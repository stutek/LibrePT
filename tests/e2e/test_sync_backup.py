# tests/e2e/test_sync_backup.py
# The header's ahead/behind change badge (renderSyncBadge — no longer a mock) proved
# against REAL local writes. The badge's never-synced state and the backup dialog's open/close are
# pure header surface and moved to tests/medium/test_sync_badge.py; what stays here needs the real
# store, because the claim under test is that `onStateSaved` at the stateStore seam catches every
# writer — including clientFormsController, which saves directly rather than through app.js's
# wrapper. A mounted component with a fake state could not assert that.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json
from pathlib import Path

# Seeds a Drive-sync ancestor directly via stateStore.js/driveSyncService.js, bypassing the OAuth
# flow these tests can't perform, so the real diff (syncMerge.js's countChangedRecords, driven
# through driveSyncService.js's getAheadCount) is what's under test — not just the badge's markup.
SEED_ANCESTOR_TO_CURRENT_STATE = """
async () => {
    const stateStore = await import(new URL('data/stateStore.js', document.baseURI).href);
    const driveSyncService = await import(new URL('data/driveSyncService.js', document.baseURI).href);
    const state = stateStore.getState();
    await stateStore.writeDriveSyncMeta({
        fileId: 'test-file',
        ancestor: JSON.parse(JSON.stringify(state)),
    });
    await driveSyncService.primeAheadCache();
}
"""


def test_ahead_count_reflects_real_local_edits_since_the_synced_ancestor(
    page, local_server
):
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    # Wait for the demo seed to have LANDED before snapshotting the ancestor. `.active` is set when
    # the view mounts, which is BEFORE boot finishes writing demo data — so seeding on activation
    # alone captures a near-empty ancestor, and every record that arrives afterwards counts as a
    # change since it. Measured while diagnosing: 90 changes immediately after a seed that should
    # have read 0. The race was always here; an unrelated `await` added to init() for the
    # coming-unbacked warning just changed the interleaving enough to lose it.
    # Waiting on MARKUP is not enough — `#clients-list` gets an empty-state child before any record
    # exists, so a DOM wait passes while the store is still empty. Wait on the store itself.
    page.wait_for_function(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return (s.getState().clients || []).length > 0;
        }"""
    )
    page.evaluate(SEED_ANCESTOR_TO_CURRENT_STATE)

    # clientFormsController.js calls stateStore's saveToLocalStorage() directly (not through
    # app.js's saveState() wrapper) — exactly the call-site-bypasses-the-counter shape the old
    # per-call-site `incrementLocalSync` design got broken under. The badge
    # re-rendering here proves the fix: onStateSaved() at the stateStore.js seam catches every
    # writer, regardless of which path it came in through.
    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("Ahead Count Client")
    page.locator("#dialog-client button[type='submit']").click()

    assert page.locator("#sync-badge .sync-ahead").inner_text().strip() == "1"
    aria = page.locator("#sync-badge").get_attribute("aria-label")
    assert "1 change on this device to send" in aria


READ_BACKUP_HISTORY = """
async () => {
    const stateStore = await import(new URL('data/stateStore.js', document.baseURI).href);
    return await stateStore.readBackupHistory();
}
"""


SESSION_IDS = """async () => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    return (s.getState().sessions || []).map((session) => session.id);
}"""


def test_sync_and_backup_offers_no_calendar_it_does_not_have(page, local_server):
    """ "Sync Data" promised the bookings of a connected calendar, connected to none, and replaced
    the trainer's own sessions with the sample ones, saying "Calendar synced successfully!". The
    dialog offers no calendar, and visiting it leaves the sessions as they were."""
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    before = page.evaluate(SESSION_IDS)
    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")

    assert "calendar" not in page.locator("#dialog-backup").inner_text().lower()
    page.locator("#dialog-backup .modal-close-btn").click()
    page.wait_for_timeout(1500)
    assert page.evaluate(SESSION_IDS) == before


def test_downloading_a_backup_records_it_without_involving_drive(page, local_server):
    """A downloaded file is a real backup, and must be recorded as one.

    This is what keeps the unbacked-data warning honest: a trainer who exports weekly has
    to be able to clear it WITHOUT connecting Google. If only a Drive sync counted, a safety
    indicator would quietly be a prompt to enable an integration, and trainers can tell.

    The export asks for a backup password on the way through (modules/common/backupPassword.js), so
    the download is expected around the dialog's save, not around the Export tap.
    """
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#backup-btn").click()
    page.locator("#btn-export-db").click()
    page.wait_for_selector("#dialog-backup-password[open]")
    with page.expect_download():
        page.locator("#btn-backup-pw-confirm").click()

    # The handler does not await the IndexedDB write, so poll rather than assume it has landed.
    page.wait_for_function(READ_BACKUP_HISTORY)
    history = page.evaluate(READ_BACKUP_HISTORY)
    assert history["kind"] == "file"
    assert history["at"] > 0


def test_never_synced_counts_every_record_of_the_trainers_own(page, local_server):
    """No ancestor means nothing has EVER reached Drive, so everything of theirs is ahead.

    This inverts the behaviour before 2026-08-12, which short-circuited to 0 with no ancestor. That
    was defensible only while no deployment had an OAuth client id and so nobody could sync at all;
    once one shipped, "connected but never synced" became reachable, and a 0 there does not read as
    "nothing to report" — it reads as "everything is backed up" while nothing is. The same answer is
    right for a trainer who never connects: their data really is in one evictable place.

    The demo dataset loaded around these clients is NOT theirs and is not counted, so
    the number here is exactly the three records they created — the two claims are one assertion.

    Deliberately NOT seeding an ancestor — the absence is the condition under test.
    """
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_function(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return (s.getState().clients || []).length > 0;
        }"""
    )

    for index in range(3):
        page.locator("#btn-add-client").click()
        page.locator("#client-name").fill(f"Unbacked Client {index}")
        page.locator("#dialog-client button[type='submit']").click()

    aria = page.locator("#sync-badge").get_attribute("aria-label") or ""
    assert "changes on this device to send" in aria
    count = int(aria.split(" change")[0])
    assert count == 3, f"expected only the trainer's three records counted, got {count}"


def test_more_than_nine_unpushed_changes_reads_as_an_alarm(page, local_server):
    """Past nine, the ahead cell drops the digit for `↑!` — an alarm, not a second arrow.

    The two directions are deliberately asymmetric. Ahead means those edits exist ONLY
    on this device, so past a handful the point is "many, and at risk"; behind means Drive holds
    changes not pulled yet, where nothing is at risk. `↑↑` said "many" only to whoever wrote it, and
    using it on both sides flattened the one distinction that makes either worth reading.
    """
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.evaluate(SEED_ANCESTOR_TO_CURRENT_STATE)

    for i in range(10):
        page.locator("#btn-add-client").click()
        page.locator("#client-name").fill(f"Overflow Client {i}")
        page.locator("#dialog-client button[type='submit']").click()

    ahead = page.locator("#sync-badge .sync-ahead")
    assert ahead.inner_text().strip() == "!"
    assert ahead.locator("i").count() == 1, (
        "the alarm replaces the digit, not the arrow"
    )
    # ...while the exact count still rides along in the aria-label for screen readers.
    assert "changes on this device to send" in (
        page.locator("#sync-badge").get_attribute("aria-label") or ""
    )


def test_an_exported_backup_holds_nothing_readable(page, local_server):
    """The file that leaves the phone must disclose nothing to whoever ends up holding it.

    Asserted on the bytes actually downloaded, not on the encrypting function — the function is
    pinned in tests/unit_js/data/backupEncryption.test.mjs, and what this adds is that the app's own
    export path really goes through it. A client's name here would mean the encryption is a setting
    that the download ignores.
    """
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_function(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return (s.getState().clients || []).length > 0;
        }"""
    )
    names = page.evaluate(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return (s.getState().clients || []).map((c) => c.name).filter(Boolean);
        }"""
    )
    assert names, "the demo seed produced no client to look for"

    page.locator("#backup-btn").click()
    page.locator("#btn-export-db").click()
    page.wait_for_selector("#dialog-backup-password[open]")
    with page.expect_download() as downloaded:
        page.locator("#btn-backup-pw-confirm").click()
    written = Path(downloaded.value.path()).read_text(encoding="utf-8")

    envelope = json.loads(written)
    assert envelope["container"] == "aes-gcm"
    assert envelope["formatVersion"] == 6
    # The version and the key parameters are readable, because a file nobody can open still has to be
    # identifiable. Nothing else is.
    assert set(envelope) == {
        "formatVersion",
        "container",
        "kdf",
        "salt",
        "iv",
        "ciphertext",
        "hint",
    }
    for name in names:
        assert name not in written, (
            f"the client {name} is readable in the exported file"
        )
    assert "clients" not in written, (
        "the collection names are readable in the exported file"
    )


def test_the_backup_dialog_states_the_header_number_in_words(page, local_server):
    """The header shows "3?" and nothing on screen said what 3 counts. The dialog it opens says it."""
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_function(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return (s.getState().clients || []).length > 0;
        }"""
    )
    for index in range(3):
        page.locator("#btn-add-client").click()
        page.locator("#client-name").fill(f"Counted Client {index}")
        page.locator("#dialog-client button[type='submit']").click()

    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")

    text = page.locator("#sync-hub-changes").inner_text()
    assert "3 changes on this device are not yet in Google Drive" in text, text
    assert "not connected" in text, text
