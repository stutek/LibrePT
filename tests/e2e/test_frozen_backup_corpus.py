# tests/e2e/test_frozen_backup_corpus.py
# The frozen backup-fixture corpus TODO §18.7/§18.13 asks for: one committed fixture per historical
# schema, asserted on every commit to still import to the expected domain object. Without this, a
# long-restore guarantee ("readers are retained forever") is a hope; with it, a regression in
# migrationSteps.js/schemaMigrations.js is caught against real frozen bytes, not an inline literal
# that could quietly evolve alongside the code that reads it.
#
# Add a new fixture here (never edit an existing one — that would stop testing what it always
# tested) whenever CURRENT_SCHEMA_VERSION bumps, capturing what a real backup from the schema being
# superseded looked like.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures" / "backups"


def _migrate(page, fixture_name):
    raw = (FIXTURES_DIR / fixture_name).read_text(encoding="utf-8")
    return page.evaluate(
        """async (raw) => {
            const m = await import(new URL('data/schemaMigrations.js', document.baseURI).href);
            const result = m.migrateState(JSON.parse(raw));
            return { ok: result.ok, state: result.state, problems: result.summary.problems };
        }""",
        raw,
    )


def test_schema1_baseline_fixture_still_imports(page, local_server):
    """Pre-`schemaVersion` (TODO §14.6): the legacy `bookings` field is dropped, not carried
    forward — there is no real PT data to protect in the pre-release baseline."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _migrate(page, "schema1_baseline.json")

    assert r["ok"] is True, r["problems"]
    assert r["state"]["schemaVersion"] == 3
    assert [c["name"] for c in r["state"]["clients"]] == ["Legacy Client"]
    assert r["state"]["sessions"] == []
    assert r["state"].get("bookings") is None


def test_schema2_fixture_still_imports_and_gains_a_derived_start_date(
    page, local_server
):
    """The v2->v3 step (TODO §7.3 item 8) must still derive `startDate` from `day`+`time` on a real
    frozen schema-2 backup, not just on a same-commit literal."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _migrate(page, "schema2.json")

    assert r["ok"] is True, r["problems"]
    assert r["state"]["schemaVersion"] == 3
    assert [c["name"] for c in r["state"]["clients"]] == ["Schema2 Client"]
    session = r["state"]["sessions"][0]
    assert session["day"] == "today", (
        "day bucket is untouched — other systems still key off it"
    )
    assert session["startDate"], (
        "schema 2 predates startDate — it must be derived on import"
    )


def test_every_committed_fixture_is_accounted_for(page, local_server):
    """A fixture file added to the corpus but never exercised above would silently stop being
    tested the moment someone forgot to wire it up — this closes that gap structurally."""
    exercised = {"schema1_baseline.json", "schema2.json"}
    on_disk = {p.name for p in FIXTURES_DIR.glob("*.json")}
    assert on_disk == exercised, (
        f"fixture(s) present but not exercised by a test: {on_disk - exercised}"
    )
