# tests/medium/test_sessions_timeline.py
# The sessions dashboard renders as ONE continuous, chronologically-ordered vertical scroll of
# day-groups — not per-viewport paged columns (UC5) — and an upcoming session's card carries a
# "starts in" countdown.
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


def test_a_session_whose_start_has_passed_says_overdue_in_words(page, local_server):
    """A late session showed only "01h 43m": the rule hiding "Overdue" on an upcoming bar also
    matched the bar the ticker marks `overtime`, so both words were hidden.

    The class is added here the way sessionCard.js's 1s ticker adds it when the start passes."""
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector(".sessions-day-group")
    card = page.locator(".session-card", has_text="Morning Conditioning").first
    bar = card.locator(".session-live-bar.upcoming")
    assert bar.locator(".when-upcoming").is_visible()
    assert not bar.locator(".when-overdue").is_visible()

    bar.evaluate("el => el.classList.add('overtime')")

    assert bar.locator(".when-overdue").is_visible()
    assert bar.locator(".when-overdue").inner_text().strip() == "Overdue"
    assert not bar.locator(".when-upcoming").is_visible()


def test_a_card_is_one_compact_design_with_nothing_left_to_open(page, local_server):
    """Reported 2026-09-11 from a screenshot: the completed badge took space in the
    heading row, the card carried a block of empty space, and the programme name was written twice.

    The empty space was the heading row WRAPPING — the badge pushed the edit button onto a line of
    its own. So the three complaints are one: too much in one row, and a row below it that only
    existed to hide the participants' names. With the names gone there is nothing left to open, and
    the expand control goes with them."""
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector(".session-card")

    assert page.locator(".btn-card-expand").count() == 0, "the per-card chevron is gone"
    assert page.locator("#btn-sessions-expand").count() == 0, (
        "so is the expand-all control"
    )

    # Every card shows its meta line without being asked — that is what "always expanded" means.
    cards = page.locator(".session-card")
    assert cards.count() > 0
    for index in range(cards.count()):
        card = cards.nth(index)
        assert (
            "spots" in card.inner_text().lower() or "mest" in card.inner_text().lower()
        ), "the participant COUNT is on every card, unasked"


def test_the_programme_is_not_printed_twice(page, local_server):
    """A session usually takes its name from its programme, so a card that prints both says the same
    sentence twice — which is what the screenshot showed. The programme line appears only when it
    adds something the heading has not."""
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector(".session-card")

    doubled = page.evaluate(
        """() => [...document.querySelectorAll('.session-card')].filter((card) => {
            const title = card.querySelector('.session-card-title');
            if (!title) return false;
            const name = title.textContent.trim().toLowerCase();
            if (!name) return false;
            const rest = [...card.querySelectorAll('span')]
                .filter((s) => s !== title && !s.contains(title))
                .map((s) => s.textContent.trim().toLowerCase());
            return rest.includes(name);
        }).length"""
    )
    assert doubled == 0, f"{doubled} card(s) print their own title a second time"


def test_a_session_without_a_routine_says_which_thing_is_missing(page, local_server):
    """A lone "Undefined" beside the clipboard icon was read as the attendance state: a trainer
    looked for where to change it to "came". The card's warning already names what is missing, so
    the card says it once, in those words."""
    seeded = "sessions: structuredClone(DEFAULT_SESSIONS),"
    assert seeded in SESSIONS_STUB
    stub = SESSIONS_STUB.replace(
        seeded,
        "sessions: structuredClone(DEFAULT_SESSIONS).map((s) => "
        "s.title === 'Morning Conditioning' ? { ...s, routineId: null } : s),",
    )
    load_with_stub(page, local_server, stub)
    card = page.locator(".session-card", has_text="Morning Conditioning").first
    card.wait_for()
    text = card.inner_text()
    assert text.count("Program Not Defined") == 1, text
    assert "Undefined" not in text, text


SEED_PLANLESS_SESSIONS = """
// Two finished sessions with no routine. The first was run from a hand-built plan of three
// exercises, which is kept in its participant's finished program; the second has nothing anywhere.
const withPlan = state.sessions.find((s) => s.id === 's00f2e3d');
const withoutPlan = state.sessions.find((s) => s.id === 's07f2e3d');
withPlan.routineId = '';
withoutPlan.routineId = '';
const { recordTrainings } = await import('./data/trainingRecords.js');
recordTrainings(state, [{
  id: 'h-built', clientId: withPlan.participants[0], routineName: 'Empty plan, no routine',
  date: withPlan.startDate, duration: 3600, feedback: [],
  exercises: ['a', 'b', 'c'].map((id) => ({
    id, type: 'exercise', name: 'Move ' + id, metric: 'reps', completed: true,
    sets: [{ reps: 10, weight: 0, completed: true }],
  })),
}]);
renderClientsViewShell();
initSessionTimeline({"""


def test_no_program_warning_only_when_the_session_had_no_exercises(page, local_server):
    """A finished session run from three hand-added exercises said "Program Not Defined": the
    warning looked only at the routine. It now also looks at the record of what was done."""
    stub = SESSIONS_STUB.replace(
        "renderClientsViewShell();\ninitSessionTimeline({", SEED_PLANLESS_SESSIONS, 1
    )
    assert stub != SESSIONS_STUB
    load_with_stub(page, local_server, stub)
    page.wait_for_selector(".sessions-day-group")

    built = page.locator('.session-card[data-session-id="s00f2e3d"]')
    empty = page.locator('.session-card[data-session-id="s07f2e3d"]')
    assert built.count() == 1 and empty.count() == 1
    assert "Program Not Defined" not in built.inner_text()
    assert "Program Not Defined" in empty.inner_text()
