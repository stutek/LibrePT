# tests/medium/test_unbacked_badge.py
# The header's unbacked-data warning (TODO §3.8, renderBackupBadge in applicationHeader.js).
#
# Mounted on HEADER_STUB and driven by calling renderBackupBadge() with an assessment directly:
# what the assessment DECIDES is pure logic and belongs in tests/unit_js/data/backupHealth.test.mjs,
# which pins it far more cheaply. What only a browser can answer is the other half — whether the
# thing a trainer sees matches the decision, and whether tapping it reaches the remedy.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

STUB = (
    HEADER_STUB
    + """
import { renderBackupBadge } from './modules/common/applicationHeader.js';
window.showBackupHealth = (health) => renderBackupBadge(health);
renderBackupBadge({ level: 'none', unbackedCount: 0 });
"""
)


def test_no_warning_when_there_is_nothing_unbacked(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    # The default state of a well-kept database is silence — a badge that is always present is one
    # nobody reads by the second day.
    assert page.locator("#unbacked-badge").is_hidden()


def test_the_warning_names_itself_rather_than_relying_on_colour(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    page.evaluate("window.showBackupHealth({ level: 'due', unbackedCount: 23 })")

    badge = page.locator("#unbacked-badge")
    assert badge.is_visible()
    # Spelled out, not a bare coloured triangle: a wordless warning has its meaning only in an
    # aria-label, which is the hover problem in another costume (AGENT_RULES §2.D.1) — and this one
    # is about losing a trainer's whole client history.
    assert "NOT BACKED UP" in badge.inner_text()
    # The count is what makes it concrete, and it belongs in the accessible name rather than the
    # pill, which has to stay narrow beside the PREVIEW badge.
    assert "23 changes" in (badge.get_attribute("aria-label") or "")


def test_a_single_change_reads_as_singular(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    page.evaluate("window.showBackupHealth({ level: 'due', unbackedCount: 1 })")
    # Noun AND verb agree — a screen-reader user hears this sentence in full, on the one message
    # asking them to act. The first version said "1 change exist".
    assert "1 change exists only on this device" in (
        page.locator("#unbacked-badge").get_attribute("aria-label") or ""
    )


def test_evictable_storage_reads_as_more_urgent_than_merely_unbacked(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    page.evaluate("window.showBackupHealth({ level: 'due', unbackedCount: 30 })")
    due_text = page.locator("#unbacked-badge").inner_text()

    page.evaluate("window.showBackupHealth({ level: 'urgent', unbackedCount: 30 })")
    urgent = page.locator("#unbacked-badge")
    # The two levels must be distinguishable by WORDING, not only by colour — the escalation has to
    # survive a colourblind trainer and a sunlit phone screen.
    assert urgent.inner_text() != due_text
    assert "AT RISK" in urgent.inner_text()


def test_the_warning_clears_without_a_reload(page, local_server):
    """It must go quiet the moment the data is safe. A warning that survives the action resolving it
    is how a trainer learns to ignore it."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    page.evaluate("window.showBackupHealth({ level: 'urgent', unbackedCount: 40 })")
    assert page.locator("#unbacked-badge").is_visible()

    page.evaluate("window.showBackupHealth({ level: 'none', unbackedCount: 0 })")
    assert page.locator("#unbacked-badge").is_hidden()


def test_tapping_the_warning_opens_the_remedy(page, local_server):
    """Not an explainer — the Sync & Backup dialog, which offers BOTH a downloaded file and a Drive
    sync. §3.8 turns on either being available, so the warning must not route only to Google."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    page.evaluate("window.showBackupHealth({ level: 'due', unbackedCount: 25 })")

    page.locator("#unbacked-badge").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None
    assert page.locator("#dialog-backup #btn-export-db").is_visible()
