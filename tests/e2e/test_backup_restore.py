# tests/e2e/test_backup_restore.py
# Restoring a backup (Sync & Backup dialog). A backup is the trainer's whole database leaving and
# re-entering the app, so the invariant that matters is that a restore is LOSSLESS: the import used
# to rebuild a fixed set of four collections, silently destroying sessions, plan updates and
# notifications that the export had faithfully written out. A restored file is now taken whole and
# put through the same schema-migration chain as a stored database, so an OLD backup upgrades and a
# backup from a newer build is refused rather than half-imported over live data.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json
from pathlib import Path

import pytest

from tests.conftest import current_schema_version, baseline_schema_version


LEGACY_BACKUP = {
    # No schemaVersion: a backup taken before the v2->v3 `startDate` migration (TODO §7.3 item 8).
    "clients": [{"id": "c1", "name": "Restored Client"}],
    "exercises": [{"id": "e1", "name": "Restored Squat"}],
    "routines": [
        {
            "id": "r1",
            "name": "Restored Routine",
            "exercises": [{"id": "e1", "reps": 10}],
        }
    ],
    "history": [{"id": "h1", "clientId": "c1", "date": "2026-01-01"}],
    "sessions": [{"id": "b1", "day": "today", "titles": ["Restored Session"]}],
    "planUpdates": [{"id": "p1", "clientId": "c1"}],
    "notifications": [{"id": "n1", "type": "welcome"}],
    "lang": "en",
}


def _import(page, payload):
    page.click("#backup-btn")
    page.wait_for_selector("#dialog-backup[open]")
    page.set_input_files(
        "#import-db-file",
        files=[
            {
                "name": "librept_backup.json",
                "mimeType": "application/json",
                "buffer": json.dumps(payload).encode(),
            }
        ],
    )
    page.wait_for_timeout(500)


def _state(page):
    return page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.getState();
        }"""
    )


def test_restore_keeps_every_collection_in_the_backup(page, local_server):
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    _import(page, LEGACY_BACKUP)
    state = _state(page)

    assert [c["name"] for c in state["clients"]] == ["Restored Client"]
    assert [e["name"] for e in state["exercises"]] == ["Restored Squat"]
    assert [r["name"] for r in state["routines"]] == ["Restored Routine"]
    assert len(state["history"]) == 1
    # The three collections a restore used to drop on the floor.
    assert len(state["sessions"]) == 1, "sessions must survive a restore"
    assert len(state["planUpdates"]) == 1, (
        "pending plan adjustments must survive a restore"
    )
    assert len(state["notifications"]) == 1, "notifications must survive a restore"


def test_restore_migrates_an_old_backup(page, local_server):
    """A backup is data re-entering the app, so it goes through the same chain a stored DB does."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    _import(page, LEGACY_BACKUP)
    state = _state(page)

    assert state["schemaVersion"] == current_schema_version(), (
        "the restored database is stamped at the current schema"
    )
    assert state["sessions"][0]["id"] == "b1"
    assert state["sessions"][0]["startDate"], (
        "the startDate derivation runs too, giving the restored session a real one"
    )
    # %g so a whole float renders as "0", matching what the app prints — an f-string would
    # produce "0.0" and never match.
    assert f"Upgraded from schema {baseline_schema_version():g}" in (
        page.locator("#import-status").inner_text()
    )


def test_a_backup_from_a_newer_build_is_refused(page, local_server):
    """Half-importing data this build cannot read, over the trainer's live database, is the one
    outcome worse than refusing."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    before = _state(page)
    _import(page, {**LEGACY_BACKUP, "schemaVersion": 99})
    after = _state(page)

    status = page.locator("#import-status").inner_text()
    assert "Error" in status
    # The live database is untouched — the demo data is still there.
    assert len(after["clients"]) == len(before["clients"])
    assert after["clients"][0]["name"] != "Restored Client"


def test_a_sparse_backup_does_not_break_the_app(page, local_server):
    """A backup file can be hand-edited or truncated, and it now reaches every renderer whole — so
    a missing sub-collection must render empty, not throw halfway through the import."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    _import(
        page,
        {
            "clients": [],
            "exercises": [],
            "routines": [{"id": "r1", "name": "No Exercises"}],
        },
    )

    assert "successful" in page.locator("#import-status").inner_text().lower()
    assert _state(page)["routines"][0]["name"] == "No Exercises"


FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures" / "backups"


def _restore_fixture(page, name):
    _import(page, json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8")))
    return _state(page)


# One row per version a real backup can arrive at. These are the SAME frozen files the unit-level
# corpus migrates (tests/unit_js/data/frozenBackupCorpus.test.mjs) — asserted here through the
# actual restore UI, because a backup re-entering the app crosses the file picker, the import
# handler and the store, none of which the pure-logic tier exercises.
#
# `lang` is the discriminator worth watching: the v3->v4 step clears it so a trainer is asked once,
# and a database ALREADY at 4 must keep the choice its trainer has since made.
@pytest.mark.parametrize(
    "fixture,expected_session_ids,expected_lang",
    [
        # No `schemaVersion` at all — enters at the floor and walks every step. Its schedule lives
        # in the legacy `bookings` field, which is carried over rather than dropped.
        ("schema1_baseline.json", ["b1"], None),
        ("schema2.json", ["s1"], None),
        ("schema3_field_install.json", ["s1"], None),
        # Already past the language step: the stored choice survives.
        ("schema4_field_install.json", ["s1"], "sl"),
    ],
)
def test_restore_from_every_supported_version(
    page, local_server, fixture, expected_session_ids, expected_lang
):
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    state = _restore_fixture(page, fixture)

    assert state["schemaVersion"] == current_schema_version(), (
        "every restore ends at the current schema, whatever it entered at"
    )
    assert [s["id"] for s in state["sessions"]] == expected_session_ids
    assert state["lang"] == expected_lang
    for session in state["sessions"]:
        assert session["startDate"], (
            "no session may reach the app without an absolute timestamp to place it on the timeline"
        )


def test_restore_from_v4_preserves_logged_training(page, local_server):
    """The least recoverable data in the database is what a trainer actually logged. A restore that
    kept the record count but dropped the sets inside it would still look like a success."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    state = _restore_fixture(page, "schema4_field_install.json")

    assert [h["id"] for h in state["history"]] == ["h1"]
    assert state["history"][0]["exercises"][0]["sets"][0]["weight"] == 120
    # A real `startDate` is never recomputed from the coarse `day` bucket — doing so would silently
    # move a session on a trainer's calendar.
    assert state["sessions"][0]["startDate"] == "2026-08-09T16:00:00.000Z"
