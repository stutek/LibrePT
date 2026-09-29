# tests/medium/test_edit_session_schedule.py — the session setup form's schedule fields.
#
# Mounts ONE component (bootWorkoutSetup) against index.html's real markup: no router, no storage,
# no demo seed. The subject is what the form SAYS about a slot — the schedule it opens showing, and
# the double-booking readout under it — not what saving one does, which is a full-flow concern and
# stays in tests/e2e/.

import re

from playwright.sync_api import expect

from tests.conftest import answer_app_questions, app_question_messages, frozen_today_iso
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


def test_an_end_before_the_start_is_refused_at_the_field(page, local_server):
    """18:00 to 09:00 was saved without a word: a session nine hours long in the minus, and every
    countdown and duration computed from it wrong. An end of 00:00 is midnight and stays allowed."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )
    page.fill("#setup-start-time", "18:00")
    page.fill("#setup-end-time", "09:00")
    page.locator("#btn-setup-open").click()

    expect(page.locator("#setup-end-time")).to_have_class(re.compile("is-invalid"))
    expect(page.locator("#setup-end-time-error")).to_have_text(
        "The session ends before it starts. Check the end time."
    )
    expect(page.locator("#form-workout-setup")).to_be_visible()


def test_a_repeat_that_ends_before_it_starts_is_refused_at_the_field(
    page, local_server
):
    """ "Until" 2026-11-03 on a session starting 2026-11-10 was saved as one session with no repeat,
    and the form said nothing: the trainer believed a series had been set up."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )
    page.fill("#setup-session-date", "2026-11-10")
    page.check("#setup-repeat")
    page.fill("#setup-repeat-until", "2026-11-03")
    page.locator("#btn-setup-open").click()

    expect(page.locator("#setup-repeat-until")).to_have_class(re.compile("is-invalid"))
    expect(page.locator("#setup-repeat-until-error")).to_have_text(
        "The repeat ends before the first session. Choose a date on or after it."
    )
    expect(page.locator("#form-workout-setup")).to_be_visible()


SPY_DEPS = """startWorkoutSession: () => { window.__launched = true; },
  pushRoute: (path) => { window.__routes = [...(window.__routes || []), path]; },
  urlFor: (name, params) => `/${name}/${params?.isoDate || ''}`,"""


def test_save_stores_the_session_without_opening_the_clipboard(page, local_server):
    """Planning next week, a trainer saves five sessions in a row. Every save opened the clipboard,
    which had to be closed before the next one. Save stores the session and goes back to the board,
    on the session's own day; opening the clipboard stays a separate button."""
    load_with_stub(
        page,
        local_server,
        setup_stub(SCHEDULED_SESSION, target_session="'s-edit'", extra_deps=SPY_DEPS),
    )
    answer_app_questions(page)
    page.fill("#setup-location", "Studio B")
    page.locator("#btn-setup-save").click()

    page.wait_for_function("() => (window.__routes || []).length > 0")
    assert page.evaluate("() => window.__launched") is None, (
        "Save must not open the clipboard"
    )
    assert page.evaluate("() => window.__routes") == [f"/sessions.day/{SESSION_DATE}"]


def test_a_session_saved_without_a_name_is_not_called_by_the_form_s_heading(
    page, local_server
):
    """Saved without a name, a session was called "Workout Session Setup" — the heading of the
    form — on its card, in its invitation and in its series."""
    stub = setup_stub("[]", extra_deps=SPY_DEPS)
    anchor = "bootWorkoutSetup({"
    assert stub.count(anchor) == 1
    load_with_stub(
        page, local_server, stub.replace(anchor, "window.__state = state;\n" + anchor)
    )
    answer_app_questions(page)
    page.fill("#setup-participant-search", "Jane")
    page.locator("#setup-participant-matches .participant-match").first.click()
    page.locator("#btn-setup-save").click()
    page.wait_for_function("() => (window.__state.sessions || []).length === 1")

    title = page.evaluate("() => window.__state.sessions[0].title")
    assert title == "Training session", title


def test_open_in_clipboard_still_saves_and_opens_it(page, local_server):
    load_with_stub(
        page,
        local_server,
        setup_stub(SCHEDULED_SESSION, target_session="'s-edit'", extra_deps=SPY_DEPS),
    )
    answer_app_questions(page)
    page.locator("#btn-setup-open").click()
    page.wait_for_function("() => window.__launched === true")


def test_the_first_evening_of_a_new_repeat_is_on_the_board_once(page, local_server):
    """Saving a session that repeats wrote the session AND a rule that produced the same evening,
    so the first date had two identical cards. The session saved is that rule's first evening."""
    stub = setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    anchor = "bootWorkoutSetup({"
    assert stub.count(anchor) == 1
    load_with_stub(
        page, local_server, stub.replace(anchor, "window.__state = state;\n" + anchor)
    )
    answer_app_questions(page)

    page.check("#setup-repeat")
    page.fill("#setup-repeat-until", "2026-09-29")
    page.locator("#btn-setup-open").click()
    page.wait_for_function("() => (window.__state.sessionSeries || []).length === 1")

    evenings = page.evaluate(
        """async () => {
          const series = await import(new URL('domain/sessionSeries.js', document.baseURI).href);
          const state = window.__state;
          return series
            .sessionsWithSeries(state.sessions, state.sessionSeries, { from: '2026-09-14', to: '2026-09-30' })
            .map((row) => row.startDate.slice(0, 10));
        }"""
    )
    assert evenings.count(SESSION_DATE) == 1, evenings
    assert len(evenings) == 3, evenings


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
    """The merged-clipboard case. A warning here would fire on the ordinary case — a trainer
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
    """The seam the Google/Microsoft half plugs into: busy intervals reach the same rules and
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


# ── The time field (src/modules/common/timeField.js) ───────────────────────────────────────────
# The subject here is the CONTROL, not the slot it fills: what a trainer typing and tapping at it
# ends up with. It is mounted by the form, so this is the tier where it can be driven at all.


def test_a_slot_field_is_the_app_s_own_control_not_the_browser_s(page, local_server):
    """The promise: what the field SHOWS is 24-hour, whatever the phone is set to.

    `<input type="time">` draws its value through the browser's locale — the same 17:30 reads as
    "5:30 PM" on a device set to English (US), and no attribute overrides it. A text field draws the
    value itself, so the app decides the form (AGENT_RULES.md), and the displayed text and the
    stored value are the same string.
    """
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    field = page.locator("#setup-start-time")
    assert field.get_attribute("type") == "text"
    assert field.input_value() == "14:00"
    # Read back the way the browser holds it, not the way CSS renders it (tests/INDEX.md).
    assert field.evaluate("el => el.value") == "14:00"


def test_four_typed_digits_are_the_time_they_spell(page, local_server):
    """Typing is the fastest way in, and a tap into the field starts a fresh time: the control
    selects what is there, so "1730" replaces 14:00 rather than being appended to it."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    page.click("#setup-start-time")
    page.locator("#setup-start-time").press_sequentially("1730")

    assert page.input_value("#setup-start-time") == "17:30"


def test_the_end_field_s_marks_are_the_four_session_lengths(page, local_server):
    """Counted from the START, not from the clock: half an hour, an hour, ninety minutes, two hours.
    One tap is then a whole booked slot, which is what booking a session usually is."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    marks = page.locator(".stepped-field:has(#setup-end-time) .stepped-field-mark")
    assert marks.all_text_contents() == ["14:30", "15:00", "15:30", "16:00"]

    marks.nth(1).click()
    assert page.input_value("#setup-end-time") == "15:00"


def test_moving_the_start_recounts_the_end_s_marks(page, local_server):
    """They are offered against the start the trainer has NOW, not the one the form opened on."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    page.fill("#setup-start-time", "18:00")

    marks = page.locator(".stepped-field:has(#setup-end-time) .stepped-field-mark")
    assert marks.all_text_contents() == ["18:30", "19:00", "19:30", "20:00"]


def test_the_arrows_move_the_time_by_five_minutes_and_carry_the_hour(
    page, local_server
):
    """The correction that is neither a retype nor a half-hour mark: a session that actually starts
    at five past. One pair of arrows, minutes only — an hour's change is already one tap away in the
    marks."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    steps = page.locator(".stepped-field:has(#setup-start-time) .stepped-field-step")
    steps.nth(0).click()
    assert page.input_value("#setup-start-time") == "14:05"

    page.fill("#setup-start-time", "13:55")
    steps.nth(0).click()
    assert page.input_value("#setup-start-time") == "14:00"

    steps.nth(1).click()
    assert page.input_value("#setup-start-time") == "13:55"


def test_a_half_typed_time_does_not_wipe_the_end_of_the_slot(page, local_server):
    """The end follows the start, and the rule used to run on every keystroke: "1" is not a time, so
    the end was set from an unreadable value and came back empty. It is restored to a real slot when
    the fourth digit lands."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    page.click("#setup-start-time")
    page.locator("#setup-start-time").press_sequentially("17")
    assert page.input_value("#setup-end-time") == "15:30"

    page.locator("#setup-start-time").press_sequentially("30")
    assert page.input_value("#setup-start-time") == "17:30"
    assert page.input_value("#setup-end-time") == "19:00"


# ── The date field (src/modules/common/dateField.js) ───────────────────────────────────────────


def test_the_day_is_shown_in_the_form_it_is_stored_in(page, local_server):
    """The promise: one written date, ISO, whatever the phone is set to.

    `<input type="date">` draws its value through the browser's locale, so the twelfth of September
    reads as 09/12/2026 on a device set to English (US) and 12.09.2026 on one set to Slovenian — and
    a date read the wrong way round puts a session three months away with nothing on screen to say
    so. The field now shows exactly the string the app stores (AGENT_RULES.md).
    """
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    field = page.locator("#setup-session-date")
    assert field.get_attribute("type") == "text"
    assert field.evaluate("el => el.value") == SESSION_DATE


def test_a_typed_day_is_read_against_the_day_on_screen(page, local_server):
    """Two digits are a day in the month already shown — the common edit is "same week, Thursday
    instead", and asking for eight digits to move by two days is how a form gets abandoned."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    page.click("#setup-session-date")
    page.locator("#setup-session-date").press_sequentially("17")
    page.locator("#setup-location").click()
    assert page.input_value("#setup-session-date") == "2026-09-17"

    page.click("#setup-session-date")
    page.locator("#setup-session-date").press_sequentially("20261102")
    assert page.input_value("#setup-session-date") == "2026-11-02"


def test_a_day_that_does_not_exist_is_moved_and_the_field_says_so(page, local_server):
    """2027-02-29 became 2027-02-28 without a word: the field keeps a slipped finger on a real day,
    but a trainer who does not see the change invites a client for the wrong day. The field says
    which day it chose, and the note goes as soon as the trainer types again."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )
    field = page.locator("#setup-session-date")
    note = page.locator(".stepped-field:has(#setup-session-date) .stepped-field-note")

    field.click()
    field.press_sequentially("20270229")
    assert field.input_value() == "2027-02-28"
    expect(note).to_have_text(
        "2027-02-29 does not exist. The date is set to 2027-02-28."
    )

    page.locator("#setup-location").click()
    field.click()
    field.press_sequentially("20270301")
    assert field.input_value() == "2027-03-01"
    expect(note).to_be_hidden()


def test_the_day_marks_are_today_tomorrow_and_the_two_days_after(page, local_server):
    """Named, not four ISO strings: a row of dates the trainer has to decode is no faster than typing
    one. Counted from the CLOCK, so they are the days a session is actually being booked for."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    marks = page.locator(".stepped-field:has(#setup-session-date) .stepped-field-mark")
    labels = marks.all_text_contents()
    assert labels[:2] == ["today", "tomorrow"]
    assert len(labels) == 4

    marks.nth(0).click()
    assert page.input_value("#setup-session-date") == frozen_today_iso()


def test_the_arrows_move_the_day_by_one(page, local_server):
    """One day a tap, so "we moved it to Wednesday" is one control and not a retyped date."""
    load_with_stub(
        page, local_server, setup_stub(SCHEDULED_SESSION, target_session="'s-edit'")
    )

    steps = page.locator(".stepped-field:has(#setup-session-date) .stepped-field-step")
    steps.nth(0).click()
    assert page.input_value("#setup-session-date") == "2026-09-16"
    steps.nth(1).click()
    steps.nth(1).click()
    assert page.input_value("#setup-session-date") == "2026-09-14"


SESSION_WITH_FEEDBACK = """[
  {
    id: 's-feedback',
    title: 'Hypertrophy Upper',
    startDate: new Date('2026-09-15T14:00:00').toISOString(),
    time: '14:00 - 15:30',
    location: 'Studio A',
    participants: ['c1', 'c2'],
    routineId: 'r1',
    hasFeedback: true,
  },
]"""


def test_taking_someone_off_a_session_with_feedback_asks_in_the_dictionary_s_words(
    page, local_server
):
    """The question was an English sentence in code, in every language. Declining it
    leaves the session as it was."""
    load_with_stub(
        page,
        local_server,
        setup_stub(SESSION_WITH_FEEDBACK, target_session="'s-feedback'"),
    )
    answer_app_questions(page, accept=False)

    rows = "#setup-participants-assignment-list .participant-setup-row"
    page.locator(f"{rows} .participant-remove").last.click()
    page.locator("#btn-setup-open").click()
    page.wait_for_function("() => (window.__appQuestionMessages || []).length > 0")
    messages = app_question_messages(page)

    expected = page.evaluate(
        """async () => {
            const { TRANSLATIONS } = await import(new URL('i18n/index.js', document.baseURI).href);
            return TRANSLATIONS.en.confirm_remove_participant_with_feedback;
        }"""
    )
    expect(page.locator("#form-workout-setup")).to_be_visible()
    assert messages == [expected]
