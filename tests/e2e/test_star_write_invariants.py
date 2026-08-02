# tests/e2e/test_star_write_invariants.py
# The CD-pipeline invariants TODO §18.13 asks for around §18.4's staging guard: expand-first schema
# evolution, projections that are pure/total (idempotent + invertible), and the specific loss
# scenario staging exists to prevent — an older schema's UI writing a record the newest schema
# requires more of. test_record_schemas.py covers the single-schema half (real writer shapes
# against the schema they were built for); this file is the cross-schema half.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

# Real object literals the app's write path actually builds — mirrors test_record_schemas.py's
# live-writer fixtures, reused here across every live schema rather than just one.
_LIVE_WRITER_SETUP = """
    const newClient = {
        id: 'c-new', name: 'Alex Roe', avatar: 'AR', joinedDate: '2026-07-27',
        email: 'alex@example.com', phone: '+386 40 000 000', goals: 'General fitness',
        weightHistory: [], notes: '',
        gdprConsent: { cloudSync: true, timestamp: '2026-07-27T10:00:00.000Z' },
        active: true,
    };
    const newFeedback = {
        id: 'u-live', clientId: 'c1', clientName: 'Jane Doe', date: new Date().toISOString(),
        exerciseName: 'Barbell Bench Press', tag: 'Too Easy - Increase Load',
        hasVoiceNote: false, resolved: false,
    };
    const clientState = {
        exercises: [
            { id: 'e1', name: 'Squat', setsTargetCount: 2, repsTarget: 5 },
            { type: 'rest', rest: 60 },
        ],
        logs: { e1: [{ reps: 5, weight: 40, completed: true, note: '' }] },
    };
    const clientLog = {
        id: 'h-new', clientId: 'c1', clientName: 'Jane Doe', routineName: 'Upper Body A',
        date: new Date().toISOString(), duration: 1800,
        exercises: rec.buildProgramSnapshot(clientState),
        feedback: [{ id: 'u-new', clientId: 'c1', exerciseName: 'Squat', tag: 'ok', note: '' }],
    };
    const liveWriters = { clients: newClient, planUpdates: newFeedback, history: clientLog };
"""


def test_schema_evolution_is_additive_never_drops_a_field(page, local_server):
    """Expand-first (TODO §18.4): a field lands in every live schema before the UI that writes it
    ever ships, so a live schema's declared field set may only grow release over release, never
    shrink — a field disappearing would silently break every OLDER build still writing it."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const m = await import(new URL('data/recordSchemas.js', document.baseURI).href);
            const older = m.SCHEMA_2;
            const newer = m.SCHEMA_3;
            const dropped = [];
            for (const collection of Object.keys(older)) {
                const newerShape = newer[collection];
                if (!newerShape) { dropped.push(`${collection}: whole collection`); continue; }
                for (const field of m.fieldNamesOf(older[collection])) {
                    if (!(field in newerShape)) dropped.push(`${collection}.${field}`);
                }
            }
            return dropped;
        }"""
    )
    assert r == [], f"fields dropped between live schemas (never allowed): {r}"


def test_every_live_writer_shape_validates_against_every_live_schema(
    page, local_server
):
    """The staging guard itself: every real object literal the write path builds must satisfy
    EVERY live schema's required fields, not only the one it happened to be checked against first —
    this is what makes writing into a newly-cut schema safe on day one, rather than discovered by a
    trainer on a downgrade."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemas = await import(new URL('data/recordSchemas.js', document.baseURI).href);
            const proj = await import(new URL('data/recordProjections.js', document.baseURI).href);
            const rec = await import(new URL('modules/common/sessionItemRecord.js', document.baseURI).href);
            %s
            const failures = [];
            for (const [schemaMajor, schema] of Object.entries(schemas.LIVE_SCHEMAS)) {
                for (const [collection, record] of Object.entries(liveWriters)) {
                    const issues = proj.projectionIssues(collection, record, schema);
                    if (issues.length) failures.push({ schema: schemaMajor, collection, issues });
                }
            }
            return failures;
        }"""
        % _LIVE_WRITER_SETUP
    )
    assert r == [], r


def test_projections_are_idempotent_and_invertible(page, local_server):
    """ "Projections must be pure and total" (TODO §18.4) made concrete: projecting twice is the same
    as once, and un-projecting a projection recovers the exact domain object — together, what lets a
    bucket be re-derived by re-projection rather than restored from a backup."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const proj = await import(new URL('data/recordProjections.js', document.baseURI).href);
            const rec = await import(new URL('modules/common/sessionItemRecord.js', document.baseURI).href);
            %s
            const failures = [];
            for (const [collection, record] of Object.entries(liveWriters)) {
                const once = proj.projectCollection(collection, record);
                const twice = proj.projectCollection(collection, once);
                if (JSON.stringify(once) !== JSON.stringify(twice)) {
                    failures.push({ collection, check: 'idempotent' });
                }
                const restored = proj.toDomainObject(once);
                if (JSON.stringify(restored) !== JSON.stringify(record)) {
                    failures.push({ collection, check: 'invertible' });
                }
            }
            return failures;
        }"""
        % _LIVE_WRITER_SETUP
    )
    assert r == [], r


def test_an_older_schemas_writer_missing_a_newer_required_field_is_caught(
    page, local_server
):
    """The specific loss scenario staging exists to prevent (TODO §18.4): a session literal shaped
    exactly like what schema 2's UI wrote — no `startDate` at all, since schema 2 never declared the
    field — must fail schema 3's projection, which requires it. If this ever silently passed, a
    star write from an old cached build would plant an invalid record in the newest bucket."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const schemas = await import(new URL('data/recordSchemas.js', document.baseURI).href);
            const proj = await import(new URL('data/recordProjections.js', document.baseURI).href);
            const oldSession = {
                id: 's-old', time: '09:00 - 10:00', title: '', location: '',
                participants: ['c1'], routineId: 'r1', maxCapacity: 4, day: 'today',
                // deliberately no startDate — schema 2 never declared it.
            };
            return {
                againstSchema2: proj.projectionIssues('sessions', oldSession, schemas.SCHEMA_2),
                againstSchema3: proj.projectionIssues('sessions', oldSession, schemas.SCHEMA_3),
            };
        }"""
    )
    assert r["againstSchema2"] == [], (
        "schema 2 never required startDate — this must validate clean"
    )
    assert any("startDate" in issue for issue in r["againstSchema3"]), (
        "schema 3 requires startDate — an old-shaped record must be caught, not silently accepted"
    )
