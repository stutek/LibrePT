# tests/e2e/test_schema_migrations.py
# The schema-migration chain (TODO §16.2): a PT can sit on one version for months while several
# ship, so an upgrade walks a SEQUENCE of small per-version transforms rather than one big jump.
# Pure migration-runner coverage (clone-not-mutate, per-step validation, refusal of a newer-build
# database, absent-vs-corrupt collections) moved to tests/unit_js/data/schemaMigrations.test.mjs.
# What stays here needs the real, live-booted app: a stored legacy localStorage database migrated
# on actual boot, read back through the app's own module instance.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

from tests.conftest import SRC_DIR


def current_schema_version():
    """CURRENT_SCHEMA_VERSION as declared in src/data/migrationSteps.js.

    Read rather than hardcoded: these tests assert "migrated to the CURRENT schema", and a literal
    turns that into "migrated to 3" — which starts silently asserting the wrong thing the moment a
    migration lands, and has to be edited by whoever adds one."""
    source = (SRC_DIR / "data" / "migrationSteps.js").read_text(encoding="utf-8")
    return int(re.search(r"CURRENT_SCHEMA_VERSION = (\d+)", source).group(1))


def baseline_schema_version():
    """BASELINE_SCHEMA_VERSION as declared in src/data/migrationSteps.js.

    Read for the same reason as the current version above: the floor moved from 1 to 0 when the
    pre-release chain was collapsed, and a literal here would have silently kept asserting the
    old one."""
    source = (SRC_DIR / "data" / "migrationSteps.js").read_text(encoding="utf-8")
    return int(re.search(r"BASELINE_SCHEMA_VERSION = (\d+)", source).group(1))


def test_a_stored_legacy_database_is_migrated_on_boot(page, local_server):
    """End-to-end: a real localStorage database in the old shape loads with an empty `sessions`,
    not the dropped legacy `bookings` collection (TODO §14.6 — no back-compat carry-over)."""
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
    assert r["sessions"] == 0, (
        "the legacy `bookings` collection is dropped, not carried over"
    )
    assert r["bookings"] is None
    assert r["schemaVersion"] == current_schema_version(), (
        "walks the full chain in one boot, not just one hop"
    )
    assert r["summary"]["fromVersion"] == baseline_schema_version()
    assert r["summary"]["problems"] == []
