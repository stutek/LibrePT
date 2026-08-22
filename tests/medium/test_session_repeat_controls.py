# tests/medium/test_session_repeat_controls.py
# Setting up a session that repeats, in the form a trainer actually fills in (TODO §35.3a).
#
# The recurrence rules are pinned without a browser in tests/unit_js/domain/sessionSeries.test.mjs,
# and the board's side of it in tests/medium/test_repeating_sessions.py. What needs the DOM is the
# authoring promise: ticking one box is the whole of "this repeats", the day they picked is already
# chosen for them, and a one-off session is unaffected by a control they never touched.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import {
  renderWorkoutSetupViewShell,
  renderEditSessionView,
} from './modules/session/editSessionView.js';
import {
  setupRepeatControls,
  readRepeatFields,
  selectedWeekdays,
} from './modules/session/sessionRepeatControls.js';
""",
    view_id="workout-setup",
    body="""
renderWorkoutSetupViewShell();
// The shell is an empty section; the form itself is a second render (the view is rebuilt each
// time it opens), and the controls only exist once that has happened.
renderEditSessionView();
setupRepeatControls({ lang: 'en' });

// The form's own read-back, exposed so a test can ask what a save WOULD write without booting the
// whole session controller (which needs a router, a store and an invite path).
window.__readSeries = () =>
  readRepeatFields({
    id: 'ser-new',
    session: {
      title: 'Tuesday Strength',
      sessionDate: document.getElementById('setup-session-date').value,
      timeLabel: '18:00 - 19:00',
      location: 'Trib gym base',
      participants: ['c1'],
      routineId: 'r1',
    },
  });
window.__weekdays = () => selectedWeekdays(document);
""",
)


def _mount(page, local_server, date="2026-08-25"):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#setup-repeat")
    page.fill("#setup-session-date", date)


def test_a_session_is_a_one_off_until_someone_says_otherwise(page, local_server):
    """Most sessions are one-offs, so the control is off and silent — and a form nobody touched
    must not arm a rule that fills the next eight weeks."""
    _mount(page, local_server)

    expect(page.locator("#setup-repeat-detail")).to_be_hidden()
    assert page.evaluate("() => window.__readSeries()") is None


def test_ticking_repeats_already_knows_which_day(page, local_server):
    """A trainer who says "this repeats" means "this, again". Asking them to also name the weekday
    they just picked a date for is asking them to say it twice — and a rule with no day produces
    nothing at all, silently."""
    _mount(page, local_server, date="2026-08-25")  # a Tuesday

    page.check("#setup-repeat")

    expect(page.locator("#setup-repeat-detail")).to_be_visible()
    assert page.evaluate("() => window.__weekdays()") == [2]


def test_the_form_reads_back_as_the_rule_it_describes(page, local_server):
    _mount(page, local_server, date="2026-08-25")
    page.check("#setup-repeat")

    page.locator("#setup-repeat-days input[data-weekday='4']").check()
    page.fill("#setup-repeat-until", "2026-12-31")

    series = page.evaluate("() => window.__readSeries()")
    assert sorted(series["weekdays"]) == [2, 4]
    assert series["startDate"] == "2026-08-25"
    assert series["until"] == "2026-12-31"
    assert series["time"] == "18:00 - 19:00"


def test_every_weekday_is_a_thumb_sized_target(page, local_server):
    """Seven controls on a 390px phone is where a design starts shrinking things below what a thumb
    can hit (§7.1)."""
    _mount(page, local_server)
    page.check("#setup-repeat")

    days = page.locator("#setup-repeat-days .setup-repeat-day")
    assert days.count() == 7
    for index in range(7):
        box = days.nth(index).bounding_box()
        assert box["height"] >= 36, f"day {index} is {box}"
