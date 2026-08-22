# tests/medium/test_repeating_sessions.py
# A repeating session on the board (TODO §35.3a).
#
# The rules themselves are pinned without a browser in tests/unit_js/domain/sessionSeries.test.mjs.
# What needs the DOM is the promise a trainer feels: an evening they never created is on the board
# because the rule says so, and the moment they act on one it becomes a real session — theirs to
# move, run and finish — without the rule producing it a second time.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import SESSIONS_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

# A series in the seeded state, plus the one-off sessions the dashboard stub already carries.
SERIES_STUB = SESSIONS_STUB.replace(
    "renderClientsViewShell();",
    """
const today = new Date();
const start = new Date(today);
start.setDate(start.getDate() - 7);
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
state.sessionSeries = [{
  id: 'ser-test',
  title: 'Repeating Strength',
  startDate: iso(start),
  weekdays: [today.getDay()],
  time: '18:00 - 19:00',
  location: 'Trib gym base',
  participants: [state.clients[0].id],
  routineId: state.routines[0].id,
  maxCapacity: 4,
}];
window.__state = state;

renderClientsViewShell();""",
)


def _mount(page, local_server):
    load_with_stub(page, local_server, SERIES_STUB)
    page.wait_for_selector("#sessions-categories-grid")


def test_an_evening_the_rule_owes_is_on_the_board(page, local_server):
    """Nobody created these: the trainer set up "every Tuesday" once, and the board owes them the
    evenings."""
    _mount(page, local_server)

    expect(
        page.locator(".session-card", has_text="Repeating Strength").first
    ).to_be_visible()


def test_the_same_evening_is_drawn_once(page, local_server):
    """Today's occurrence appears exactly once for today — a rule and a record that both speak for
    the same evening would put two identical cards on one day."""
    _mount(page, local_server)

    cards = page.locator(".session-card", has_text="Repeating Strength")
    assert cards.count() >= 1
    todays = page.locator(
        ".sessions-day-group:has(.sessions-day-group-today-tag) .session-card",
        has_text="Repeating Strength",
    )
    assert todays.count() == 1


def test_acting_on_one_evening_makes_it_a_real_session(page, local_server):
    """Touching an evening is what makes it specific, and specific things are records — otherwise
    there is nothing to move, nothing to finish and nothing to write history against."""
    _mount(page, local_server)
    assert (
        page.evaluate("() => window.__state.sessions.filter((s) => s.seriesId).length")
        == 0
    )

    page.locator(".session-card", has_text="Repeating Strength").first.click()
    page.wait_for_timeout(300)

    stored = page.evaluate("() => window.__state.sessions.filter((s) => s.seriesId)")
    assert len(stored) == 1, stored
    # It keeps the date the SERIES scheduled, which is what stops the rule producing it again.
    assert stored[0]["occurrenceDate"]
    assert stored[0]["seriesId"] == "ser-test"


def test_a_cancelled_evening_stays_gone(page, local_server):
    """Removing an evening of a repeating session cannot mean deleting the row — the rule would
    produce it again on the next render, and the trainer would watch a session they just deleted
    come back. It is kept as cancelled instead, and the board leaves the evening empty."""
    _mount(page, local_server)
    page.locator(".session-card", has_text="Repeating Strength").first.click()
    page.wait_for_timeout(300)

    cancelled = page.evaluate(
        """async () => {
          const series = await import(new URL('domain/sessionSeries.js', document.baseURI).href);
          const state = window.__state;
          const id = state.sessions.find((s) => s.seriesId).id;
          state.sessions = series.sessionsAfterRemoving(state.sessions, [id]);
          return series
            .sessionsWithSeries(state.sessions, state.sessionSeries, {
              from: '2000-01-01',
              to: '2100-01-01',
            })
            .filter((s) => s.occurrenceDate === state.sessions.find((row) => row.cancelled).occurrenceDate);
        }"""
    )

    assert cancelled == [], cancelled
