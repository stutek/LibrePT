# tests/e2e/test_record_schemas.py
# The declared schema (TODO §18.1 / §18.4): recordSchemas.js's SCHEMA_2 is the first time "schema N"
# exists as data rather than as a side effect of whatever migrationSteps.js happens to produce, and
# recordProjections.js is the star-write model's projection layer for the one schema that is live
# today. This file is the proof that both are faithful to what the app ACTUALLY writes, not an
# idealized model: every seed fixture and every live writer's literal object shape (formsController's
# new-client form, feedbackModal's new-feedback form, finishWorkoutSession's history record) is
# reconstructed here and asserted to project and validate cleanly. A schema that only validates its
# own seed data would be worthless the first time a real trainer's form submission diverged from it.
#
# Note on style: each test inlines its own literal `page.evaluate` body rather than sharing a helper
# that builds one from a string. The app ships `script-src 'self'` with no `unsafe-eval`, so a
# `new Function(...)` helper is refused by the page's own CSP — correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_field_issues_catches_missing_required_and_wrong_type(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/recordSchemas.js', document.baseURI).href;
            const m = await import(url);
            const shape = { id: { required: true, type: 'string' }, active: { required: true, type: 'boolean' } };
            return {
                missing: m.fieldIssues({ id: 'a1' }, shape),
                wrongType: m.fieldIssues({ id: 'a1', active: 'yes' }, shape),
                clean: m.fieldIssues({ id: 'a1', active: true }, shape),
            };
        }"""
    )
    assert any("missing required field" in issue for issue in r["missing"])
    assert any("expected boolean" in issue for issue in r["wrongType"])
    assert r["clean"] == []


def test_undeclared_fields_are_not_an_error(page, local_server):
    """The store round-trips the whole object (TODO §16.3's invariant) — a field the shape does not
    know about is forward-compatible data, not corruption."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/recordSchemas.js', document.baseURI).href;
            const m = await import(url);
            const shape = { id: { required: true, type: 'string' } };
            return m.fieldIssues({ id: 'a1', fromTheFuture: 'kept' }, shape);
        }"""
    )
    assert r == []


def test_nested_array_items_are_validated_per_element(page, local_server):
    """history.exercises is an array of SESSION_ITEM-shaped entries — a malformed one must be
    named with its index, not just fail the array field as a whole."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/recordSchemas.js', document.baseURI).href;
            const m = await import(url);
            const shape = {
                exercises: {
                    required: true,
                    type: 'array',
                    items: { id: { required: true, type: 'string' } },
                },
            };
            const broken = { exercises: [{ id: 'ok' }, {}] };
            return m.fieldIssues(broken, shape);
        }"""
    )
    assert any(
        "exercises[1]" in issue and "missing required field" in issue for issue in r
    )


def test_every_seed_collection_projects_and_validates_clean(page, local_server):
    """The whole seed dataset — clients, exercises, routines, sessions, history, plan updates,
    notifications — is what a clean demo install writes. None of it may fail its own schema."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemasUrl = new URL('data/recordSchemas.js', document.baseURI).href;
            const projUrl = new URL('data/recordProjections.js', document.baseURI).href;
            const dataUrl = new URL('data/index.js', document.baseURI).href;
            const schemas = await import(schemasUrl);
            const proj = await import(projUrl);
            const seeds = await import(dataUrl);

            const collections = {
                clients: seeds.DEFAULT_CLIENTS,
                exercises: seeds.DEFAULT_EXERCISES,
                routines: seeds.DEFAULT_ROUTINES,
                sessions: seeds.DEFAULT_SESSIONS,
                history: seeds.DEFAULT_HISTORY,
                planUpdates: seeds.DEFAULT_PLAN_UPDATES,
                notifications: seeds.DEFAULT_MESSAGES,
            };

            const failures = [];
            for (const [collection, records] of Object.entries(collections)) {
                for (const record of records) {
                    const issues = proj.projectionIssues(collection, record, schemas.SCHEMA_2);
                    if (issues.length) failures.push({ collection, id: record.id, issues });
                }
            }
            const counts = Object.fromEntries(
                Object.entries(collections).map(([k, v]) => [k, v.length])
            );
            return { failures, counts };
        }"""
    )
    assert r["failures"] == [], r["failures"]
    # A schema that validated nothing because the seed arrays were empty would pass for free.
    assert all(count > 0 for count in r["counts"].values()), r["counts"]


def test_seed_sessions_also_validate_against_schema_3(page, local_server):
    """Schema 3 (TODO §7.3 item 8) requires `startDate` on every session — the seed data must
    already carry it, not just satisfy the older, looser schema 2."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemasUrl = new URL('data/recordSchemas.js', document.baseURI).href;
            const projUrl = new URL('data/recordProjections.js', document.baseURI).href;
            const dataUrl = new URL('data/index.js', document.baseURI).href;
            const schemas = await import(schemasUrl);
            const proj = await import(projUrl);
            const seeds = await import(dataUrl);

            const failures = [];
            for (const record of seeds.DEFAULT_SESSIONS) {
                const issues = proj.projectionIssues('sessions', record, schemas.SCHEMA_3);
                if (issues.length) failures.push({ id: record.id, issues });
            }
            return { failures, count: seeds.DEFAULT_SESSIONS.length };
        }"""
    )
    assert r["failures"] == [], r["failures"]
    assert r["count"] > 0


def test_a_live_created_client_validates_clean(page, local_server):
    """The exact object literal clientFormsController.js builds for a brand-new client — including
    gdprConsent, which the seed fixtures never carry but every live-created client does."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemasUrl = new URL('data/recordSchemas.js', document.baseURI).href;
            const projUrl = new URL('data/recordProjections.js', document.baseURI).href;
            const schemas = await import(schemasUrl);
            const proj = await import(projUrl);
            const newClient = {
                id: 'c-new',
                name: 'Alex Roe',
                avatar: 'AR',
                joinedDate: '2026-07-27',
                email: 'alex@example.com',
                phone: '+386 40 000 000',
                goals: 'General fitness',
                weightHistory: [],
                notes: '',
                gdprConsent: { cloudSync: true, timestamp: '2026-07-27T10:00:00.000Z' },
                active: true,
            };
            return proj.projectionIssues('clients', newClient, schemas.SCHEMA_2);
        }"""
    )
    assert r == []


def test_a_live_finished_session_history_record_validates_clean(page, local_server):
    """Reconstructs exactly what finishWorkoutSession pushes to state.history: a buildProgramSnapshot
    output (already position-stamped per TODO §17.5) wrapped in the surrounding log fields."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemasUrl = new URL('data/recordSchemas.js', document.baseURI).href;
            const projUrl = new URL('data/recordProjections.js', document.baseURI).href;
            const recordUrl = new URL('modules/common/sessionItemRecord.js', document.baseURI).href;
            const schemas = await import(schemasUrl);
            const proj = await import(projUrl);
            const rec = await import(recordUrl);

            const clientState = {
                exercises: [
                    { id: 'e1', name: 'Squat', setsTargetCount: 2, repsTarget: 5 },
                    { type: 'rest', rest: 60 },
                ],
                logs: { e1: [{ reps: 5, weight: 40, completed: true, note: '' }] },
            };
            const clientLog = {
                id: 'h-new',
                clientId: 'c1',
                clientName: 'Jane Doe',
                routineName: 'Upper Body A',
                date: new Date().toISOString(),
                duration: 1800,
                exercises: rec.buildProgramSnapshot(clientState),
                feedback: [{ id: 'u-new', clientId: 'c1', exerciseName: 'Squat', tag: 'ok', note: '' }],
            };
            return {
                issues: proj.projectionIssues('history', clientLog, schemas.SCHEMA_2),
                // id/type/position are schema-optional (DEFAULT_HISTORY predates them and stays
                // valid) — but the CURRENT write path must carry all three on every item, rest
                // included, which is what this half of the test actually pins.
                allHaveIdTypePosition: clientLog.exercises.every(
                    (it) => typeof it.id === 'string' && typeof it.type === 'string' && typeof it.position === 'number'
                ),
            };
        }"""
    )
    assert r["issues"] == []
    assert r["allHaveIdTypePosition"] is True


def test_a_live_feedback_submission_validates_clean(page, local_server):
    """The exact object literal feedbackModal.js pushes to state.planUpdates."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemasUrl = new URL('data/recordSchemas.js', document.baseURI).href;
            const projUrl = new URL('data/recordProjections.js', document.baseURI).href;
            const schemas = await import(schemasUrl);
            const proj = await import(projUrl);
            const newFeedback = {
                id: 'u-live',
                clientId: 'c1',
                clientName: 'Jane Doe',
                date: new Date().toISOString(),
                exerciseName: 'Barbell Bench Press',
                tag: 'Too Easy - Increase Load',
                hasVoiceNote: false,
                resolved: false,
            };
            return proj.projectionIssues('planUpdates', newFeedback, schemas.SCHEMA_2);
        }"""
    )
    assert r == []


def test_projecting_into_an_undeclared_collection_fails_loud(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemasUrl = new URL('data/recordSchemas.js', document.baseURI).href;
            const projUrl = new URL('data/recordProjections.js', document.baseURI).href;
            const schemas = await import(schemasUrl);
            const proj = await import(projUrl);
            return proj.projectionIssues('not-a-real-collection', { id: 'x' }, schemas.SCHEMA_2);
        }"""
    )
    assert any("no schema declared" in issue for issue in r)
