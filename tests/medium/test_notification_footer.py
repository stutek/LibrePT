# tests/medium/test_notification_footer.py
# The omnipresent notification/status footer (#notification-area, modules/common/notificationArea.js):
# collapsed, it peeks up just enough for one line of text; expanded, it covers the whole area below
# the app header. Mounted via appBoot.bootNotificationArea() directly (see tests/medium/_harness.py)
# rather than the full app boot — this component's real markup canvas (#notification-area) is one of
# index.html's own static canvases, not something the header shell creates, so no other boot step is
# needed first.
#
# Two subjects, both needing a browser: the drawer's GEOMETRY (a phone-sized peek that must not
# steal the gym floor), and WHAT THE FEED OFFERS — which card an empty database gets versus a real
# gym, and whether a tap does what its label said. The second is here rather than in
# tests/unit_js/ because the promise is about a rendered button, not about the item list
# domain/notificationItems.js resolves.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start


def stub(state_js):
    """Mount the feed over a given database. Both feed actions that change something are RECORDED
    rather than performed — seeding writes the whole demo dataset and reloads the page, navigation
    closes the drawer — so a test can ask which one a tap reached without the tap ending the test."""
    return f"""
import {{ bootNotificationArea }} from './appBoot.js';
import {{ renderNotificationArea }} from './modules/common/notificationArea.js';
import {{ escapeHTML }} from './modules/common/utils.js';
import {{ TRANSLATIONS }} from './i18n/index.js';
import {{ DEFAULT_MESSAGES }} from './data/messages.js';

const t = (key) => TRANSLATIONS.en[key] || key;
const state = {state_js};

window.__seeded = 0;
window.__navigated = [];

bootNotificationArea({{
  getState: () => state,
  getActiveSession: () => null,
  t,
  escapeHTML,
  navigateToPath: (path) => window.__navigated.push(path),
  openSessionFromHistory: () => {{}},
  seedDemoData: () => {{ window.__seeded += 1; }},
}});
renderNotificationArea();
"""


EMPTY_DATABASE = "{}"
# A trainer's own gym, with nothing outstanding: no drafted plan, no unreviewed feedback, so the
# feed resolves to zero items exactly as an untouched install does. That collision is the reason
# the two empty states have to be told apart.
REAL_GYM = "{ clients: [{ id: 'c1', name: 'Real Person' }] }"
DEMO_LOADED = "{ notifications: structuredClone(DEFAULT_MESSAGES) }"

STUB = stub(EMPTY_DATABASE)


def expand_feed(page):
    page.locator("#notification-grabber-btn").click()
    page.wait_for_timeout(400)


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

    expand_feed(page)

    hdr_height = page.evaluate(
        "parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-height'))"
    )
    box = page.locator("#notification-area").bounding_box()
    viewport_height = page.viewport_size["height"]

    # Starts right below the header (no gap) and reaches the bottom of the viewport.
    assert abs(box["y"] - hdr_height) < 2
    assert abs((box["y"] + box["height"]) - viewport_height) < 2


def test_an_empty_database_is_offered_sample_data_by_a_button_that_says_so(
    page, local_server
):
    """Someone who chose "Start with an empty app" at first run has no other route back to the
    sample gym, so the offer stays. What changed is that the label names the action: its
    predecessor read "Open Live Demo", which sounds like navigation and wrote the whole demo
    dataset into the database instead."""
    load_with_stub(page, local_server, stub(EMPTY_DATABASE))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    button = page.locator("#btn-seed-demo-data")
    assert button.is_visible()
    assert "sample data" in button.inner_text().lower()

    button.click()
    assert page.evaluate("() => window.__seeded") == 1
    assert page.evaluate("() => window.__navigated") == []


def test_a_gym_with_real_clients_is_never_offered_the_demo_seed(page, local_server):
    """The dangerous half of the empty state the two used to share. A trainer with real people in
    the database and nothing outstanding saw the same card as someone with nothing at all — told
    their "workspace is preloaded with live training data" when it held their own work, and one
    tap from having the sample gym written in among it."""
    load_with_stub(page, local_server, stub(REAL_GYM))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    assert page.locator("#btn-seed-demo-data").count() == 0
    assert (
        "caught up" in page.locator("#notification-list-container").inner_text().lower()
    )
    assert page.evaluate("() => window.__seeded") == 0


def test_nothing_in_the_demo_feed_promises_a_walkthrough_or_leaves_the_app(
    page, local_server
):
    """Both of the welcome card's original actions were promises the app does not keep. "Explore
    Walkthrough" navigated to the client list, standing in for the engine TODO §9.5 has not built
    — the splash announces that one honestly, disabled and marked "soon". "Open Live Demo" and
    "About demo data" left for the web: the first to the app's own public URL, which is a reload
    from the hosted origin and a jump into a stranger's data from anywhere else, the second to a
    README on github.com. Both are dead without signal, in an app whose whole premise is the
    basement gym."""
    load_with_stub(page, local_server, stub(DEMO_LOADED))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    feed = page.locator("#notification-list-container")
    assert feed.locator("a[href]").count() == 0, (
        "the feed must not send a trainer off the device"
    )

    labels = [
        text.lower()
        for text in feed.locator(".notification-actions button").all_inner_texts()
    ]
    assert labels, "the demo feed should still offer its own actions"
    assert not any("walkthrough" in label for label in labels)


def test_the_welcome_card_goes_where_its_label_says(page, local_server):
    """The label names its destination, so the button cannot start over-promising again without
    someone editing the words."""
    load_with_stub(page, local_server, stub(DEMO_LOADED))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    action = page.locator(
        '[data-notification-id="demo-welcome"] .notification-actions button'
    )
    assert "clients" in action.inner_text().lower()

    action.click()
    assert page.evaluate("() => window.__navigated") == ["/clients"]
