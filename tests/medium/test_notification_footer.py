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
window.__walkthroughStarted = 0;

bootNotificationArea({{
  getState: () => state,
  getActiveSession: () => null,
  t,
  escapeHTML,
  navigateToPath: (path) => window.__navigated.push(path),
  openSessionFromHistory: () => {{}},
  seedDemoData: () => {{ window.__seeded += 1; }},
  startWalkthrough: () => {{ window.__walkthroughStarted += 1; }},
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


SCHEDULE_CHURN = """{ notifications: [
  { id: 'b1', type: 'reservation', icon: 'fa-solid fa-calendar-check',
    title: 'Spot booked', description: 'Ana booked Tuesday 18:00', actions: [] },
  { id: 'c1', type: 'cancellation', icon: 'fa-solid fa-calendar-xmark',
    title: 'Spot cancelled', description: 'Marko cancelled Wednesday 07:00', actions: [] },
  { id: 'c2', type: 'cancellation', icon: 'fa-solid fa-calendar-xmark',
    title: 'Spot cancelled', description: 'Eva cancelled Thursday 19:30', actions: [] },
] }"""


def test_accumulated_schedule_news_renders_as_separate_lines(page, local_server):
    """One card, three readable lines (TODO §28.10).

    Which arrivals get grouped is pure logic and is pinned in
    tests/unit_js/domain/notificationItems.test.mjs. What only a browser can answer is whether the
    joined text actually renders as a list: HTML collapses newlines, so a card built by joining
    lines is one run-on paragraph unless the stylesheet says otherwise.
    """
    load_with_stub(page, local_server, stub(SCHEDULE_CHURN))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    cards = page.locator(".notification-card")
    assert cards.count() == 1, "three arrivals must arrive as one card"

    description = cards.first.locator(".notification-card-desc")
    for line in ("Ana booked", "Marko cancelled", "Eva cancelled"):
        assert line in description.inner_text()

    # inner_text() reflects rendered line breaks, so this fails on a run-on paragraph while passing
    # on a stack of lines — which is the whole difference a trainer sees.
    assert len(description.inner_text().strip().splitlines()) == 3


WALKTHROUGH_READY = """{
  notifications: structuredClone(DEFAULT_MESSAGES),
  sessions: [{ id: 's1', participants: ['c1', 'c2'], routineId: 'r1' }],
  routines: [{ id: 'r1', exercises: [{ id: 'e1', circuitId: 'z1' }] }],
}"""

WALKTHROUGH_NOT_READY = """{
  notifications: structuredClone(DEFAULT_MESSAGES),
  sessions: [{ id: 's1', participants: ['c1'], routineId: 'r1' }],
  routines: [{ id: 'r1', exercises: [{ id: 'e1' }] }],
}"""


def test_the_demo_card_offers_to_start_the_walkthrough(page, local_server):
    """TODO §28.14: the splash offers the walkthrough on a first run, and a trainer who dismissed it
    had nowhere else to find it. The demo card is where they are already being told they are looking
    at sample data."""
    load_with_stub(page, local_server, stub(WALKTHROUGH_READY))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    walkthrough = page.locator("button[data-action-walkthrough]")
    assert walkthrough.count() == 1
    assert walkthrough.is_visible()

    walkthrough.click()
    assert page.evaluate("() => window.__walkthroughStarted") == 1


def test_no_walkthrough_button_when_the_data_it_needs_is_gone(page, local_server):
    """Offered against a store that cannot satisfy the steps, the guide stops on its first one — in
    front of the person being shown the product. Which shapes qualify is pinned in
    tests/unit_js/domain/walkthroughReadiness.test.mjs; this is the button obeying it."""
    load_with_stub(page, local_server, stub(WALKTHROUGH_NOT_READY))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    assert page.locator("button[data-action-walkthrough]").count() == 0
    # The card itself stays — the trainer still needs to be told they are on demo data.
    assert page.locator(".notification-card.demo-mode").count() == 1


def test_the_destructive_action_is_not_thumb_adjacent_to_the_one_you_want(
    page, local_server
):
    """Reported 2026-08-18: "show me around button in the message is too close to delete demo data".

    The two actions on the demo card are the friendliest and the most destructive things the feed
    offers, 8px apart. The app already has a rule for this shape — a destructive action sharing a row
    takes the far end of it (`.modal-actions .danger-link-btn`) — and this is the same shape in a
    different component.
    """
    load_with_stub(page, local_server, stub(WALKTHROUGH_READY))
    page.wait_for_selector("#notification-area")
    expand_feed(page)

    walkthrough = page.locator("button[data-action-walkthrough]").bounding_box()
    reset = page.locator("button[data-action-reset]").bounding_box()

    on_the_same_line = abs(walkthrough["y"] - reset["y"]) < 8
    if on_the_same_line:
        gap = reset["x"] - (walkthrough["x"] + walkthrough["width"])
        assert gap >= 24, f"only {gap}px between 'show me around' and 'clear demo data'"
    else:
        # Its own line is the stronger answer, and the one this card takes: a row apart cannot be
        # mis-hit while reaching for the button above it. The margin still has to be real, though —
        # stacked at the default 8px gap is no better than side by side at 8px.
        gap = reset["y"] - (walkthrough["y"] + walkthrough["height"])
        assert gap >= 10, f"only {gap}px between them when stacked"
