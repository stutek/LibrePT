# tests/e2e/test_sync_backup.py
# End-to-end coverage of the header's Sync & Backup control: the real (TODO §3.9 — no longer a mock)
# GitHub-style ahead/behind change badge (renderSyncBadge) and the backup/restore dialog it opens.
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


def test_sync_badge_shows_real_zero_ahead_and_unknown_behind_before_any_sync(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    badge = page.locator("#sync-badge")
    assert badge.is_visible()
    assert "hidden" not in (badge.get_attribute("class") or "")

    # This deployment ships with no Drive OAuth client id configured (TODO §3.3) and no sync has
    # ever run, so the real ahead count is 0 (nothing yet to diff against) and behind is genuinely
    # unknown ("?") rather than a fabricated number.
    assert page.locator("#sync-badge .sync-zero").inner_text().strip() == "0"
    aria = badge.get_attribute("aria-label")
    assert "0 local changes to push" in aria
    assert "cloud status unknown" in aria


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


def test_sync_badge_caps_over_nine_with_second_arrow(page, local_server):
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.evaluate(SEED_ANCESTOR_TO_CURRENT_STATE)

    for i in range(10):
        page.locator("#btn-add-client").click()
        page.locator("#client-name").fill(f"Overflow Client {i}")
        page.locator("#dialog-client button[type='submit']").click()

    ahead = page.locator("#sync-badge .sync-ahead")
    # Past 9 the digit is replaced by a second arrow: two icons, no number in the cell...
    assert ahead.inner_text().strip() == ""
    assert ahead.locator("i").count() == 2
    # ...while the exact count still rides along in the aria-label for screen readers.
    assert "local changes to push" in (
        page.locator("#sync-badge").get_attribute("aria-label") or ""
    )


def test_backup_modal_opens_and_closes(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    dialog = page.locator("#dialog-backup")
    assert dialog.get_attribute("open") is None  # closed on load

    page.locator("#backup-btn").click()
    assert dialog.get_attribute("open") is not None
    assert dialog.is_visible()
    # The export/restore affordances are present in the opened modal.
    assert page.locator("#dialog-backup #btn-export-db").is_visible()

    page.locator("#dialog-backup .modal-close-btn").click()
    assert dialog.get_attribute("open") is None
