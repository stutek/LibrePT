# tests/medium/test_notification_footer.py
# The omnipresent notification/status footer (#notification-area, modules/common/notificationArea.js):
# collapsed, it peeks up just enough for one line of text; expanded, it covers the whole area below
# the app header. Mounted via appBoot.bootNotificationArea() directly (see tests/medium/_harness.py)
# rather than the full app boot — this component's real markup canvas (#notification-area) is one of
# index.html's own static canvases, not something the header shell creates, so no other boot step is
# needed first.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

STUB = """
import { bootNotificationArea } from './appBoot.js';
import { renderNotificationArea } from './modules/common/notificationArea.js';
import { escapeHTML } from './modules/common/utils.js';
import { TRANSLATIONS } from './i18n/index.js';

const t = (key) => TRANSLATIONS.en[key] || key;

bootNotificationArea({
  getState: () => ({}),
  getActiveSession: () => null,
  t,
  escapeHTML,
  navigateToPath: () => {},
  openSessionFromHistory: () => {},
});
renderNotificationArea();
"""


def test_collapsed_footer_is_a_single_line(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#notification-area")

    assert not page.locator("#notification-summary-desc").is_visible()

    viewport_height = page.viewport_size["height"]
    box = page.locator("#notification-area").bounding_box()
    peek_height = viewport_height - box["y"]
    # A single text line + padding comfortably fits under 70px; the old two-line peek was 92px.
    assert peek_height < 70, (
        f"collapsed footer is {peek_height}px tall, expected a single line"
    )


def test_expanded_footer_covers_the_whole_area_below_the_header(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#notification-area")

    page.locator("#notification-grabber-btn").click()
    page.wait_for_timeout(400)

    hdr_height = page.evaluate(
        "parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-height'))"
    )
    box = page.locator("#notification-area").bounding_box()
    viewport_height = page.viewport_size["height"]

    # Starts right below the header (no gap) and reaches the bottom of the viewport.
    assert abs(box["y"] - hdr_height) < 2
    assert abs((box["y"] + box["height"]) - viewport_height) < 2
