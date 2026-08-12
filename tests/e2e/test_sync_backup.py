# tests/e2e/test_sync_backup.py
# The header's ahead/behind change badge (renderSyncBadge, TODO §3.9 — no longer a mock) proved
# against REAL local writes. The badge's never-synced state and the backup dialog's open/close are
# pure header surface and moved to tests/medium/test_sync_badge.py; what stays here needs the real
# store, because the claim under test is that `onStateSaved` at the stateStore seam catches every
# writer — including clientFormsController, which saves directly rather than through app.js's
# wrapper. A mounted component with a fake state could not assert that.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

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
    page.evaluate(SEED_ANCESTOR_TO_CURRENT_STATE)

    # clientFormsController.js calls stateStore's saveToLocalStorage() directly (not through
    # app.js's saveState() wrapper) — exactly the call-site-bypasses-the-counter shape TODO §3.9
    # described as broken under the old per-call-site `incrementLocalSync` design. The badge
    # re-rendering here proves the fix: onStateSaved() at the stateStore.js seam catches every
    # writer, regardless of which path it came in through.
    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("Ahead Count Client")
    page.locator("#dialog-client button[type='submit']").click()

    assert page.locator("#sync-badge .sync-ahead").inner_text().strip() == "1"
    aria = page.locator("#sync-badge").get_attribute("aria-label")
    assert "1 local change to push" in aria


READ_BACKUP_HISTORY = """
async () => {
    const stateStore = await import(new URL('data/stateStore.js', document.baseURI).href);
    return await stateStore.readBackupHistory();
}
"""


def test_downloading_a_backup_records_it_without_involving_drive(page, local_server):
    """A downloaded file is a real backup, and must be recorded as one.

    This is what keeps TODO §3.8's coming unbacked warning honest: a trainer who exports weekly has
    to be able to clear it WITHOUT connecting Google. If only a Drive sync counted, a safety
    indicator would quietly be a prompt to enable an integration, and trainers can tell.
    """
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#backup-btn").click()
    with page.expect_download():
        page.locator("#btn-export-db").click()

    # The handler does not await the IndexedDB write, so poll rather than assume it has landed.
    page.wait_for_function(READ_BACKUP_HISTORY)
    history = page.evaluate(READ_BACKUP_HISTORY)
    assert history["kind"] == "file"
    assert history["at"] > 0


def test_never_synced_counts_the_whole_dataset_as_ahead(page, local_server):
    """No ancestor means nothing has EVER reached Drive, so everything local is ahead.

    This inverts the previous behaviour, which short-circuited to 0 with no ancestor. That was
    defensible only while no deployment had an OAuth client id and so nobody could sync at all; once
    one shipped, "connected but never synced" became reachable, and a 0 there does not read as
    "nothing to report" — it reads as "everything is backed up" while nothing is. The same answer is
    right for a trainer who never connects: their data really is in one evictable place.

    Deliberately NOT seeding an ancestor — the absence is the condition under test.
    """
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill("Unbacked Client")
    page.locator("#dialog-client button[type='submit']").click()

    # The seeded demo database plus this new client is comfortably past 9, so the cell shows the
    # over-nine treatment rather than a digit; the exact number rides in the aria-label.
    aria = page.locator("#sync-badge").get_attribute("aria-label") or ""
    assert "local changes to push" in aria
    count = int(aria.split(" local change")[0])
    assert count > 1, f"expected the whole dataset counted as ahead, got {count}"


def test_more_than_nine_unpushed_changes_reads_as_an_alarm(page, local_server):
    """Past nine, the ahead cell drops the digit for `↑!` — an alarm, not a second arrow.

    The two directions are deliberately asymmetric (TODO §3.11). Ahead means those edits exist ONLY
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
    assert "local changes to push" in (
        page.locator("#sync-badge").get_attribute("aria-label") or ""
    )
