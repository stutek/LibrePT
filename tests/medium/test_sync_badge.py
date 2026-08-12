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

    # Ahead is 0 here because this store is genuinely EMPTY (clean_start), not because no sync has
    # run. That distinction became load-bearing on 2026-08-12: getAheadCount() used to short-circuit
    # to 0 whenever there was no ancestor, and now counts the whole dataset instead, so "never
    # synced" no longer implies 0 — only "no records" does. A store with content and no ancestor
    # reports all of it (tests/e2e/test_sync_backup.py pins that half, which needs the real store).
    # Behind is still genuinely unknown ("?") rather than a fabricated number.
    assert page.locator("#sync-badge .sync-zero").inner_text().strip() == "0"
    aria = badge.get_attribute("aria-label")
    assert "0 local changes to push" in aria
    assert "cloud status unknown" in aria


def test_counters_are_legible_and_grow_on_desktop(page, local_server):
    """The counts must be readable on both form factors.

    They shipped at 10px with 9px arrows — AGENT_RULES §2.D's own example of what not to do ("9px of
    text is nothing to aim at") — in the surface a trainer checks to know whether their work is safe.

    The desktop half is pinned because its media query is `(min-width: 700px) and (pointer: fine)`,
    and the pointer clause is easy to get silently wrong: a rule that never matches would leave the
    desktop path shipped but unexercised. Width alone would be the wrong test anyway, since a phone
    in landscape clears 700px and is exactly where vertical space is scarcest.
    """
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    def badge_font_px():
        return page.evaluate(
            "parseFloat(getComputedStyle(document.querySelector('#sync-badge')).fontSize)"
        )

    page.set_viewport_size({"width": 390, "height": 844})
    assert badge_font_px() >= 12, "phone counters must clear the 9px anti-pattern"

    page.set_viewport_size({"width": 1440, "height": 900})
    assert badge_font_px() >= 14, (
        "desktop step did not apply — check the pointer media query"
    )
    header_height = page.evaluate(
        "getComputedStyle(document.documentElement).getPropertyValue('--hdr-height').trim()"
    )
    assert header_height == "76px", (
        f"expected the taller desktop header, got {header_height}"
    )


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
