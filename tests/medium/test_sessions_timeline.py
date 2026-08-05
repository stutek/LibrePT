# tests/medium/test_sessions_timeline.py
# The sessions dashboard renders as ONE continuous, chronologically-ordered vertical scroll of
# day-groups — not per-viewport paged columns (UC5) — and an upcoming session's card carries a
# "starts in" countdown (TODO §2.3).
#
# Both are pure render facts about the timeline, so they mount on _harness.py's SESSIONS_STUB. What
# stays in tests/e2e/ from these two files is everything that is NOT a render fact: scroll-driven
# URL sync and the Today control (test_sessions_dashboard), and the past-card elapsed-time edit that
# must survive a reload plus the finish-session stamp written through the real controller
# (test_session_status_line).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

import pytest

from tests.medium._harness import SESSIONS_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

HOUR_MIN = re.compile(r"^-?\d{2}h \d{2}m$")

TIMELINE_SHAPE = """() => {
  const groups = Array.from(document.querySelectorAll('.sessions-day-group[data-date]'));
  const dates = groups.map((g) => g.dataset.date);
  const sorted = [...dates].sort();
  const lefts = new Set(groups.map((g) => Math.round(g.getBoundingClientRect().left)));
  return {
    count: groups.length,
    inOrder: JSON.stringify(dates) === JSON.stringify(sorted),
    singleColumn: lefts.size <= 1,
  };
}"""


@pytest.mark.parametrize("width,height", [(390, 844), (868, 843), (1280, 800)])
def test_continuous_vertical_timeline_at_every_viewport(
    page, local_server, width, height
):
    """The timeline is one vertical, chronologically-ordered scroll of day-groups — not
    per-viewport paged columns — at every viewport width."""
    page.set_viewport_size({"width": width, "height": height})
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector(".sessions-day-group")
    page.wait_for_function(f"() => ({TIMELINE_SHAPE})().count > 1", polling=100)

    result = page.evaluate(TIMELINE_SHAPE)
    assert result["count"] > 1, "the seed data spans multiple days"
    assert result["singleColumn"], f"day-groups must stack in one column at {width}px"
    assert result["inOrder"], "day-groups must render in chronological order"


def test_upcoming_card_shows_a_starts_in_countdown(page, local_server):
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector(".sessions-day-group")

    # "Morning Conditioning" is in the "tomorrow" bucket (src/data/sessions.js) — always in the
    # future regardless of wall-clock time of day, unlike a same-day currentHour-relative slot
    # (currentHour is clamped to at most 18, so a +3/+4 offset can itself have already started
    # once real time passes ~21:00).
    card = page.locator(".session-card", has_text="Morning Conditioning").first
    bar = card.locator(".session-live-bar.upcoming")
    assert bar.count() == 1
    assert "fa-forward-fast" in bar.locator("i").first.get_attribute("class")

    countdown = bar.locator(".session-live-timer").inner_text().strip()
    assert HOUR_MIN.match(countdown), f"expected '01h 32m' countdown, got {countdown!r}"
