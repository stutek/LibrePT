# tests/medium/test_drive_sync_ui.py
# The "Cloud Backup (Google Drive)" card in the Sync & Backup dialog (driveSyncUi.js).
#
# **This suite flipped state on 2026-08-12**, when a real OAuth client id was installed in
# src/data/driveSyncConfig.js. It used to pin the "not configured" card — the honest state of a
# deployment whose GOOGLE_DRIVE_CLIENT_ID was blank — and that assertion is now unreachable, because
# `configured` is derived from that constant and is true for every build we ship. What it pins now is
# the CONFIGURED-BUT-NOT-CONNECTED card: Connect offered and enabled, and nothing that implies a
# session we do not have.
#
# The third state (connected) still cannot be reached here: it needs a real consent grant, and
# Google fingerprints and blocks automated browsers on accounts.google.com, so no Playwright tier
# will ever reach it. That is what tests/live/ exists for. Mounted via _harness.py's HEADER_STUB.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start


def test_drive_sync_card_offers_connect_and_implies_no_session(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    page.locator("#backup-btn").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None

    card = page.locator("#drive-sync-card")
    assert card.is_visible()

    # The card explains what connecting does, rather than reporting the deployment is unconfigured.
    desc = page.locator("#drive-sync-desc").inner_text()
    assert "isn't set up" not in desc
    assert "hidden app folder" in desc

    # Connect is live: a configured deployment must open a real consent flow, not a dead button.
    connect_btn = page.locator("#btn-drive-connect")
    assert connect_btn.is_enabled()
    assert "Connect" in page.locator("#btn-drive-connect-text").inner_text()

    # Disconnect and the periodic-interval control stay hidden until a grant exists — offering
    # either here would imply a session this device has never had.
    assert "hidden" in (
        page.locator("#btn-drive-disconnect").get_attribute("class") or ""
    )
    assert "hidden" in (
        page.locator("#drive-sync-interval-row").get_attribute("class") or ""
    )
    # No conflicts exist to review when there's nothing configured to have synced in the first place.
    assert "hidden" in (
        page.locator("#btn-drive-review-conflicts").get_attribute("class") or ""
    )


def test_header_cloud_icon_still_opens_the_dialog_when_not_connected(
    page, local_server
):
    # setupHeaderCloudIconSync() adds a SECOND listener on #backup-btn (fire a sync when already
    # connected) alongside backupRestore.js's own (navigate to the dialog) — this pins that the
    # original behaviour survives, and that the new listener's guard clause (configured/connected)
    # means it does nothing harmful when neither is true.
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    page.locator("#backup-btn").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None
    assert page.locator("#drive-sync-card").is_visible()


def test_drive_sync_card_survives_repeated_dialog_opens(page, local_server):
    # prepareDriveSyncCard() re-renders on every "backup" route entry (open/close/reopen); it must
    # stay correct rather than accumulating stale state or duplicate listeners.
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    for _ in range(3):
        page.locator("#backup-btn").click()
        assert page.locator("#drive-sync-card").is_visible()
        page.locator("#dialog-backup .modal-close-btn").click()
        assert page.locator("#dialog-backup").get_attribute("open") is None

    page.locator("#backup-btn").click()
    # Still the configured-but-not-connected card after three cycles — the re-render neither
    # accumulates stale state nor drifts into implying a session.
    assert page.locator("#btn-drive-connect").is_enabled()
    assert "hidden" in (
        page.locator("#btn-drive-disconnect").get_attribute("class") or ""
    )
