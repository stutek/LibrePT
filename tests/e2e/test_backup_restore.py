# tests/e2e/test_backup_restore.py
# Restoring a backup (Sync & Backup dialog). A backup is the trainer's whole database leaving and
# re-entering the app, so the invariant that matters is that a restore is LOSSLESS: the import used
# to rebuild a fixed set of four collections, silently destroying sessions, plan updates and
# notifications that the export had faithfully written out. A restored file is now taken whole and
# put through the same schema-migration chain as a stored database, so an OLD backup upgrades and a
# backup from a newer build is refused rather than half-imported over live data.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

LEGACY_BACKUP = {
    # No schemaVersion and a `bookings` collection: a backup taken before the rename.
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
    "bookings": [{"id": "b1", "day": "today", "titles": ["Restored Session"]}],
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
    page.wait_for_selector(".booking-card")
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
    page.wait_for_selector(".booking-card")
    page.wait_for_timeout(300)

    _import(page, LEGACY_BACKUP)
    state = _state(page)

    assert state["schemaVersion"] == 2, (
        "the restored database is stamped at the current schema"
    )
    assert state.get("bookings") is None, (
        "the legacy collection is migrated, not carried along"
    )
    assert state["sessions"][0]["id"] == "b1"
    assert "Upgraded from schema 1" in page.locator("#import-status").inner_text()


def test_a_backup_from_a_newer_build_is_refused(page, local_server):
    """Half-importing data this build cannot read, over the trainer's live database, is the one
    outcome worse than refusing."""
    page.goto(local_server)
    page.wait_for_selector(".booking-card")
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
    page.wait_for_selector(".booking-card")
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
