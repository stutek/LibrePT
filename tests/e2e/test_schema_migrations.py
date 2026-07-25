# tests/e2e/test_schema_migrations.py
# The schema-migration chain (TODO §16.2): a PT can sit on one version for months while several
# ship, so an upgrade walks a SEQUENCE of small per-version transforms rather than one big jump.
# Migrations can never be tested against a real PT's database — it is local-only by design — so the
# guarantees that stand in for that are pinned here: nothing is mutated in place, every step's
# output is validated, a bad step fails loud with the original data handed back, and a database
# written by a NEWER build is refused rather than guessed at (the rollback case).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE = "new URL('data/schemaMigrations.js', document.baseURI).href"


def _evaluate(page, body):
    return page.evaluate(
        "async () => { const m = await import(%s); %s }" % (MODULE, body)
    )


def test_legacy_database_migrates_bookings_to_sessions(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const legacy = { clients: [{ id: 'c1' }], bookings: [{ id: 'b1' }, { id: 'b2' }] };
        const result = m.migrateState(legacy);
        return {
            ok: result.ok,
            from: result.summary.fromVersion,
            to: result.summary.toVersion,
            sessions: result.state.sessions.length,
            bookings: result.state.bookings ?? null,
            schemaVersion: result.state.schemaVersion,
            description: m.describeMigration(result.summary),
            sourceUntouched: legacy.bookings.length,
            sourceHasNoSessions: legacy.sessions === undefined,
        };""",
    )

    assert r["ok"] is True
    # A database with no schemaVersion is the legacy baseline, v1.
    assert r["from"] == 1
    assert r["sessions"] == 2
    assert r["bookings"] is None
    assert r["schemaVersion"] == r["to"]
    assert any("bookings" in line for line in r["description"]), (
        "the PT is told what actually moved, not just that something did"
    )
    # The input object is never mutated — the runner works on a clone.
    assert r["sourceUntouched"] == 2
    assert r["sourceHasNoSessions"] is True


def test_current_database_is_a_no_op_but_gets_stamped(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const current = { schemaVersion: 2, clients: [], sessions: [{ id: 's1' }] };
        const result = m.migrateState(current);
        return {
            ok: result.ok,
            applied: result.summary.applied.length,
            sessions: result.state.sessions.length,
            schemaVersion: result.state.schemaVersion,
        };""",
    )

    assert r["ok"] is True
    assert r["applied"] == 0, "an up-to-date database runs no steps"
    assert r["sessions"] == 1
    assert r["schemaVersion"] == 2


def test_data_from_a_newer_build_is_refused_not_guessed(page, local_server):
    """The rollback case: an older build must never invent a backwards transform."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const future = { schemaVersion: 99, clients: [{ id: 'c1' }], sessions: [] };
        const result = m.migrateState(future);
        return {
            ok: result.ok,
            problems: result.summary.problems,
            stateIsInput: result.state === future,
        };""",
    )

    assert r["ok"] is False
    assert any("newer version" in problem for problem in r["problems"])
    # The caller gets its own object back, untouched — nothing is written over.
    assert r["stateIsInput"] is True


def test_a_step_producing_a_bad_shape_fails_loud(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """return {
            notAnObject: m.validateStateShape(null, 2),
            badCollection: m.validateStateShape({ schemaVersion: 2, sessions: [], clients: 'nope' }, 2),
            missingSessions: m.validateStateShape({ schemaVersion: 2 }, 2),
            wrongVersion: m.validateStateShape({ schemaVersion: 1, sessions: [] }, 2),
            clean: m.validateStateShape({ schemaVersion: 2, sessions: [], clients: [] }, 2),
            detectLegacy: m.detectSchemaVersion({}),
            detectStored: m.detectSchemaVersion({ schemaVersion: 7 }),
            detectGarbage: m.detectSchemaVersion({ schemaVersion: 'two' }),
        };""",
    )

    assert r["notAnObject"] == ["the migrated database is not an object"]
    assert any("clients" in problem for problem in r["badCollection"])
    assert any("sessions" in problem for problem in r["missingSessions"])
    assert any("schemaVersion" in problem for problem in r["wrongVersion"])
    assert r["clean"] == []
    assert r["detectLegacy"] == 1
    assert r["detectStored"] == 7
    assert r["detectGarbage"] == 1


def test_a_stored_legacy_database_is_migrated_on_boot(page, local_server):
    """End-to-end: a real localStorage database in the old shape loads as sessions, not bookings."""
    page.add_init_script(
        """window.localStorage.setItem('librept_db', JSON.stringify({
            clients: [{ id: 'c1', name: 'Legacy Client' }],
            exercises: [],
            routines: [],
            history: [],
            bookings: [{ id: 'b1', day: 'today', titles: ['Legacy Session'] }],
        }));"""
    )
    page.goto(local_server)
    page.wait_for_timeout(600)

    # The app's own module instance (same URL ⇒ same module record), so this is the live state the
    # app booted with, not a re-run of the migration.
    r = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const state = store.getState();
            return {
                clients: state.clients.map((c) => c.name),
                sessions: state.sessions.length,
                bookings: state.bookings ?? null,
                schemaVersion: state.schemaVersion,
                summary: store.getLastMigrationSummary(),
            };
        }"""
    )

    assert r["clients"] == ["Legacy Client"], (
        "a migration never discards the PT's own data"
    )
    assert r["sessions"] == 1
    assert r["bookings"] is None
    assert r["schemaVersion"] == 2
    assert r["summary"]["fromVersion"] == 1
    assert r["summary"]["problems"] == []


def test_absent_collections_are_filled_in_but_corrupt_ones_still_fail(
    page, local_server
):
    """A hand-trimmed backup (or one taken before a collection existed) reaches every renderer, so
    missing collections are filled in once here rather than defended against at each read site —
    but a key that is present and NOT a list is corruption, and must still fail loudly."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """const sparse = m.migrateState({ clients: [{ id: 'c1' }] });
        const corrupt = m.migrateState({ schemaVersion: 2, sessions: [], clients: 'nope' });
        return {
            ok: sparse.ok,
            history: sparse.state.history,
            notifications: sparse.state.notifications,
            planUpdates: sparse.state.planUpdates,
            clients: sparse.state.clients.length,
            corruptOk: corrupt.ok,
            corruptProblems: corrupt.summary.problems,
        };""",
    )

    assert r["ok"] is True
    assert r["history"] == []
    assert r["notifications"] == []
    assert r["planUpdates"] == []
    assert r["clients"] == 1, (
        "filling in blanks never touches data that is actually there"
    )
    assert r["corruptOk"] is False
    assert any("clients" in problem for problem in r["corruptProblems"])
