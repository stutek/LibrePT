# tests/e2e/test_sync_backup.py
# End-to-end coverage of the header's Sync & Backup control: the mock GitHub-style ahead/behind
# change badge (renderSyncBadge) and the backup/restore dialog it opens.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_sync_badge_shows_mock_ahead_behind_counts(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    badge = page.locator("#sync-badge")
    assert badge.is_visible()
    assert "hidden" not in (badge.get_attribute("class") or "")

    # Seed edits run before sync tracking flips on, so the badge shows the mock initial
    # state: 2 local edits to push (ahead), 1 remote change to pull (behind).
    assert page.locator("#sync-badge .sync-ahead").inner_text().strip() == "2"
    assert page.locator("#sync-badge .sync-behind").inner_text().strip() == "1"

    aria = badge.get_attribute("aria-label")
    assert "2 local changes to push" in aria
    assert "1 remote change to pull" in aria


def test_sync_badge_caps_over_nine_with_second_arrow(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # Each saved edit bumps the local "ahead" count; from the seed's 2, eight adds pushes it to 10.
    for i in range(8):
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
