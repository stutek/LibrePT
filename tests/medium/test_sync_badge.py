# tests/medium/test_sync_badge.py
# The header's Sync & Backup control: the ahead/behind change badge in its never-synced state, and
# the backup dialog it opens. Both are pure header surface, so they mount on
# tests/medium/_harness.py's HEADER_STUB.
#
# The two OTHER tests in the e2e original stay there deliberately: they drive real client creation
# through the form and assert the count reflects it, which is the whole point of TODO §3.9 — that
# `onStateSaved` at the stateStore seam catches every writer, including call sites that bypass
# app.js's save wrapper. That claim is only meaningful against the real store, so a mounted
# component with a fake state would assert nothing.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

# app.js renders the badge at the end of init() (and re-renders it from the onStateSaved /
# onSyncCountsChanged seams). Neither runs here, so the stub renders it once explicitly.
STUB = (
    HEADER_STUB
    + """
import { renderSyncBadge } from './modules/common/applicationHeader.js';
renderSyncBadge();
"""
)


def test_sync_badge_shows_real_zero_ahead_and_unknown_behind_before_any_sync(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

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


def test_backup_modal_opens_and_closes(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    dialog = page.locator("#dialog-backup")
    assert dialog.get_attribute("open") is None  # closed on load

    page.locator("#backup-btn").click()
    assert dialog.get_attribute("open") is not None
    assert dialog.is_visible()
    # The export/restore affordances are present in the opened modal.
    assert page.locator("#dialog-backup #btn-export-db").is_visible()

    page.locator("#dialog-backup .modal-close-btn").click()
    assert dialog.get_attribute("open") is None
