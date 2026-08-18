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


CURRENT_BACKUP = {
    # Already at this build's shape: importing it moves nothing forward, which is what makes it the
    # genuinely consequence-free restore.
    "schemaVersion": current_schema_version(),
    "clients": [{"id": "c1", "name": "Restored", "active": True}],
    "exercises": [],
    "routines": [],
    "history": [],
    "planUpdates": [],
    "sessions": [],
    "notifications": [],
}


def _import(page, payload, confirm=True):
    """Restore `payload`, confirming the replace prompt when it appears.

    A restore over a non-empty database asks before overwriting — these tests boot with the demo
    dataset, so they take that branch every time. `confirm=False` exercises the decline path."""
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

    if page.locator("#restore-confirm:not([hidden])").count() > 0:
        page.click("#btn-restore-confirm" if confirm else "#btn-restore-cancel")
        page.wait_for_timeout(400)


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


def test_a_restore_over_existing_data_asks_before_replacing(page, local_server):
    """Restore REPLACES the database — a file is a snapshot, and merging two databases without a
    common ancestor is guesswork. Replacing is right; replacing silently is not, because a trainer
    setting up a new phone may already have entered real work."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    before = _state(page)
    _import(page, LEGACY_BACKUP, confirm=False)

    assert len(_state(page)["clients"]) == len(before["clients"]), (
        "declining the prompt must leave the database exactly as it was"
    )
    assert "Nothing was changed" in page.locator("#import-status").inner_text()

    # And the declined payload is discarded, not left primed to be applied by a later click.
    page.click("#btn-backup-export") if page.locator(
        "#btn-backup-export"
    ).count() else None
    assert page.locator("#restore-confirm:not([hidden])").count() == 0


def test_the_replace_prompt_names_what_would_be_lost(page, local_server):
    """ "Replace 8 clients, 13 sessions" is a sentence a trainer can weigh. "Are you sure?" is not."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    page.click("#backup-btn")
    page.wait_for_selector("#dialog-backup[open]")
    page.set_input_files(
        "#import-db-file",
        files=[
            {
                "name": "librept_backup.json",
                "mimeType": "application/json",
                "buffer": json.dumps(LEGACY_BACKUP).encode(),
            }
        ],
    )
    page.wait_for_timeout(500)

    detail = page.locator("#restore-confirm-detail").inner_text()
    assert "clients" in detail, (
        f"the prompt has to name what is at stake, got {detail!r}"
    )


def test_a_restore_onto_an_empty_device_does_not_ask(page, local_server):
    """The prompt appears only when something is at stake — a warning shown every time is a warning
    nobody reads.

    Rewritten 2026-08-18 for TODO §18.7: this used to import the LEGACY backup and assert silence, which
    stopped being right once forward-migration consent existed. Bringing an old file forward IS something
    at stake — it stops opening in an older build — so the no-prompt case is now a file already at this
    build's shape, which is the one that truly costs nothing. The old-file case is asserted below."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    # Clear the database first, so the restore lands on an empty device.
    page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            store.setState({ ...store.emptyState() });
            store.saveToLocalStorage();
        }"""
    )
    page.wait_for_timeout(300)

    page.click("#backup-btn")
    page.wait_for_selector("#dialog-backup[open]")
    page.set_input_files(
        "#import-db-file",
        files=[
            {
                "name": "librept_backup.json",
                "mimeType": "application/json",
                "buffer": json.dumps(CURRENT_BACKUP).encode(),
            }
        ],
    )
    page.wait_for_timeout(600)

    assert page.locator("#restore-confirm:not([hidden])").count() == 0
    assert [c["name"] for c in _state(page)["clients"]] == ["Restored"]


@pytest.mark.clean_start
def test_an_old_backup_asks_before_bringing_the_file_forward(page, local_server):
    """TODO §18.7's last item. The prompt has always covered what a trainer loses from THIS DEVICE, so an
    empty device skipped it entirely — and that is exactly the case where the other consequence still
    applies: bringing a schema-1 file forward means it stops opening in an older build they may still
    have on a second phone. A one-way door is worth a sentence beforehand."""
    page.goto(local_server)
    page.wait_for_selector("#app-header", timeout=15_000)

    # Inline rather than through `_import`, which answers the prompt for you — this test is about the
    # prompt itself, so it has to be read before it is dismissed.
    page.click("#backup-btn")
    page.wait_for_selector("#dialog-backup[open]")
    page.set_input_files(
        "#import-db-file",
        files=[
            {
                "name": "librept_backup.json",
                "mimeType": "application/json",
                "buffer": json.dumps(LEGACY_BACKUP).encode(),
            }
        ],
    )
    page.wait_for_timeout(600)

    assert page.locator("#restore-confirm:not([hidden])").count() == 1
    assert page.locator("#restore-confirm-forward:not([hidden])").count() == 1
    assert "older builds" in page.locator("#restore-confirm-forward-text").inner_text()

    page.click("#btn-restore-cancel")
    page.wait_for_timeout(400)
    # Declining is a refusal, not a delay: nothing was written and the file is untouched on disk.
    assert _state(page)["clients"] == []


@pytest.mark.clean_start
def test_a_current_backup_onto_an_empty_device_still_restores_in_one_step(
    page, local_server
):
    """The consent must not become a toll on the ordinary case — yesterday's backup restored today moves
    nothing forward and has nothing to replace, so it should not stop to ask."""
    page.goto(local_server)
    page.wait_for_selector("#app-header", timeout=15_000)

    _import(page, CURRENT_BACKUP)

    assert [client["name"] for client in _state(page)["clients"]] == ["Restored"]
