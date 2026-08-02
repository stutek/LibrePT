# tests/e2e/test_drive_sync_ui.py
# The "Cloud Backup (Google Drive)" card in the Sync & Backup dialog (driveSyncUi.js). This
# deployment ships with no OAuth client id configured (src/data/driveSyncConfig.js —
# GOOGLE_DRIVE_CLIENT_ID is a per-deployment secret-free constant the maintainer fills in, TODO
# §1.5), so the only state this suite can pin without a real Google account is the honest
# "not configured" one — the card must say so plainly and refuse to open a broken consent flow,
# never guess or silently no-op. Behaviour once a client id IS configured belongs to a real Google
# test account, out of scope for CI.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_drive_sync_card_reports_not_configured_and_disables_connect(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#backup-btn").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None

    card = page.locator("#drive-sync-card")
    assert card.is_visible()
    assert "isn't set up" in page.locator("#drive-sync-desc").inner_text()

    connect_btn = page.locator("#btn-drive-connect")
    assert connect_btn.is_disabled()
    # Disconnect and the periodic-interval control stay hidden — there is nothing to disconnect
    # from and nothing to schedule.
    assert "hidden" in (
        page.locator("#btn-drive-disconnect").get_attribute("class") or ""
    )
    assert "hidden" in (
        page.locator("#drive-sync-interval-row").get_attribute("class") or ""
    )


def test_header_cloud_icon_still_opens_the_dialog_when_not_connected(
    page, local_server
):
    # setupHeaderCloudIconSync() adds a SECOND listener on #backup-btn (fire a sync when already
    # connected) alongside backupRestore.js's own (navigate to the dialog) — this pins that the
    # original behaviour survives, and that the new listener's guard clause (configured/connected)
    # means it does nothing harmful when neither is true.
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#backup-btn").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None
    assert page.locator("#drive-sync-card").is_visible()


def test_drive_sync_card_survives_repeated_dialog_opens(page, local_server):
    # prepareDriveSyncCard() re-renders on every "backup" route entry (open/close/reopen); it must
    # stay correct rather than accumulating stale state or duplicate listeners.
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    for _ in range(3):
        page.locator("#backup-btn").click()
        assert page.locator("#drive-sync-card").is_visible()
        page.locator("#dialog-backup .modal-close-btn").click()
        assert page.locator("#dialog-backup").get_attribute("open") is None

    page.locator("#backup-btn").click()
    assert page.locator("#btn-drive-connect").is_disabled()
