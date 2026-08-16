# tests/medium/test_edit_session_schedule.py — the session setup form's schedule fields.
#
# Mounts ONE component (bootWorkoutSetup) against index.html's real markup: no router, no storage,
# no demo seed. The subject is what the form SAYS about a slot — the schedule it opens showing, and
# the double-booking readout under it — not what saving one does, which is a full-flow concern and
# stays in tests/e2e/.

from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

# A fixed local datetime rather than an offset from today: the expected strings then have no
# timezone or midnight-rollover arithmetic to agree with, in Python or in the browser.
SESSION_START = "2026-09-15T14:00:00"
SESSION_DATE = "2026-09-15"


def setup_stub(sessions_js, target_session="null", extra_deps=""):
    return view_stub(
        imports="""
import { bootWorkoutSetup } from './appBoot.js';
import { openWorkoutSetupModal } from './modules/session/editSessionControl.js';
import { renderWorkoutSetupViewShell } from './modules/session/editSessionView.js';
""",
        view_id="workout-setup",
        body="""
renderWorkoutSetupViewShell();

const state = {
  lang: 'en',
  sessions: __SESSIONS__,
  clients: [{ id: 'c1', name: 'Jane Doe' }, { id: 'c2', name: 'Sam Ray' }],
  routines: [{ id: 'r1', name: 'Upper Body' }],
  exercises: [],
  history: [],
  planUpdates: [],
};

bootWorkoutSetup({
  getState: () => state,
  t,
  escapeHTML: (s) => s,
  getClientDisplayNameHTML: (client) => client.name,
  switchView: activateView,
  pushRoute: noop,
  urlFor: (name) => `/${name}`,
  getISODateForColumn: () => '2026-09-15',
  scheduleTimelineSettle: noop,
  startWorkoutSession: noop,
  saveToLocalStorage: noop,
  rerenderSessions: noop,
  openSessionInviteDialog: noop,
  __EXTRA_DEPS__
});

openWorkoutSetupModal(null, null, __TARGET__);
""".replace("__SESSIONS__", sessions_js)
        .replace("__TARGET__", target_session)
        .replace("__EXTRA_DEPS__", extra_deps),
    )


SCHEDULED_SESSION = (
    """[
  {
    id: 's-edit',
    title: 'Hypertrophy Upper',
    startDate: new Date('%s').toISOString(),
    time: '14:00 - 15:30',
    location: 'Studio A',
    participants: ['c1'],
    routineId: 'r1',
  },
]"""
    % SESSION_START
)


def test_editing_a_session_opens_on_its_own_schedule(page, local_server):
    """The promise: opening a scheduled session for edit shows THAT session's slot.

    It used to show the next half hour instead — the form read `timeLabel`/`date`, which are the live
    clipboard meta's field names, while a stored session carries `time` and `startDate`. Re-saving
    then moved the session to whenever the trainer happened to open it, with nothing on screen
    suggesting anything had changed.
    """
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    assert page.input_value("#setup-session-date") == SESSION_DATE
    assert page.input_value("#setup-start-time") == "14:00"
    assert page.input_value("#setup-end-time") == "15:30"
    assert page.input_value("#setup-location") == "Studio A"
    assert page.input_value("#setup-session-name") == "Hypertrophy Upper"


def test_a_session_being_edited_does_not_clash_with_itself(page, local_server):
    """Every re-save of an unchanged session would otherwise read as a double-booking."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    expect(page.locator("#setup-schedule-conflicts")).to_be_hidden()


def fill_slot(page, start, end, location):
    page.fill("#setup-session-date", SESSION_DATE)
    page.fill("#setup-start-time", start)
    page.fill("#setup-end-time", end)
    page.fill("#setup-location", location)


def test_a_slot_in_a_different_place_at_the_same_time_is_flagged(page, local_server):
    """The trainer cannot be in two places at once, and the form says so while they type."""
    load_with_stub(page, local_server, setup_stub(SCHEDULED_SESSION))

    fill_slot(page, "15:00", "16:00", "City park")

    clash = page.locator(".schedule-clash")
    expect(clash).to_be_visible()
    expect(clash).to_contain_text("Hypertrophy Upper")
    expect(page.locator(".schedule-note")).to_have_count(0)


def test_two_sessions_in_the_same_room_are_a_note_not_a_warning(page, local_server):
    """The merged-clipboard case (§1.2). A warning here would fire on the ordinary case — a trainer
    running two clients on different programmes side by side — and be ignored within a week."""
    load_with_stub(page, local_server, setup_stub(SCHEDULED_SESSION))

    fill_slot(page, "15:00", "16:00", "Studio A")

    expect(page.locator(".schedule-note")).to_be_visible()
    expect(page.locator(".schedule-clash")).to_have_count(0)


def test_a_free_slot_says_nothing_at_all(page, local_server):
    """Back-to-back is the normal gym-floor case, not a collision."""
    load_with_stub(page, local_server, setup_stub(SCHEDULED_SESSION))

    fill_slot(page, "15:30", "16:30", "City park")

    expect(page.locator("#setup-schedule-conflicts")).to_be_hidden()


def test_an_external_calendar_saying_the_trainer_is_busy_is_flagged(page, local_server):
    """The seam the Google/Microsoft half plugs into (§1.6): busy intervals reach the same rules and
    the same readout as the app's own sessions, so nothing downstream has to learn about calendars."""
    load_with_stub(
        page,
        local_server,
        setup_stub(
            "[]",
            extra_deps=(
                "getExternalBusyIntervals: () => ["
                f"{{ start: '{SESSION_DATE}T15:15:00', end: '{SESSION_DATE}T16:00:00' }}],"
            ),
        ),
    )

    fill_slot(page, "15:00", "16:00", "City park")

    expect(page.locator(".schedule-clash")).to_be_visible()
