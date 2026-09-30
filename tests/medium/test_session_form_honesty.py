# tests/medium/test_session_form_honesty.py — what the session form offers and what it refuses.
#
# Four promises a trainer relies on without looking:
#   * a client added to a session gets no programme the trainer did not choose;
#   * the name and place suggestions are the trainer's own earlier words, in any language;
#   * a session that has been run is not moved to another day by editing its date;
#   * ending a series from one of its evenings ends THAT series and adds no second evening.
# Mounts the real form (bootWorkoutSetup) against index.html's markup; nothing else of the app.

import json

from playwright.sync_api import expect

from tests.conftest import answer_app_questions
from tests.medium._harness import load_with_stub, view_stub

TODAY = "2026-09-30"
ROUTINES = [{"id": "r1", "name": "Moč A"}]
CLIENTS = [{"id": "c1", "name": "Ana Zupan"}, {"id": "c2", "name": "Bor Kos"}]


def form_stub(state):
    return view_stub(
        imports="""
import { bootWorkoutSetup } from './appBoot.js';
import { openWorkoutSetupModal } from './modules/session/editSessionControl.js';
import { renderWorkoutSetupViewShell } from './modules/session/editSessionView.js';
""",
        view_id="workout-setup",
        body="""
renderWorkoutSetupViewShell();
const state = Object.assign({ exercises: [], history: [], planUpdates: [] }, __STATE__);
window.__state = state;
bootWorkoutSetup({
  getState: () => state,
  t,
  escapeHTML: (s) => s,
  getClientDisplayNameHTML: (client) => client.name,
  switchView: activateView,
  pushRoute: noop,
  urlFor: (name) => `/${name}`,
  getISODateForColumn: () => '2026-09-30',
  scheduleTimelineSettle: noop,
  startWorkoutSession: noop,
  saveToLocalStorage: noop,
  rerenderSessions: noop,
  openSessionInviteDialog: noop,
});
window.__open = openWorkoutSetupModal;
""".replace("__STATE__", json.dumps(state)),
    )


def base_state(**extra):
    return {
        "lang": "sl",
        "clients": CLIENTS,
        "routines": ROUTINES,
        "sessions": [],
        **extra,
    }


def open_form(page, *args):
    page.evaluate("(args) => window.__open(...args)", list(args))


def test_a_client_added_to_a_new_session_gets_the_empty_plan(page, local_server):
    """The library's first routine was written for someone else; it must not be picked for a
    client the trainer has not yet chosen a programme for."""
    load_with_stub(page, local_server, form_stub(base_state()))
    open_form(page, "c1")

    select = page.locator(".participant-setup-row .select-routine-dropdown")
    assert select.input_value() == "empty_plan"


def test_a_client_added_to_a_session_with_a_routine_joins_it(page, local_server):
    state = base_state(
        routines=[*ROUTINES, {"id": "r2", "name": "Noge"}],
        sessions=[
            {
                "id": "s1",
                "title": "Jutro",
                "startDate": f"{TODAY}T08:00:00.000Z",
                "time": "08:00 - 09:00",
                "participants": ["c1"],
                "routineId": "r2",
            }
        ],
    )
    load_with_stub(page, local_server, form_stub(state))
    open_form(page, None, None, "s1")
    page.fill("#setup-participant-search", "Bor")
    page.locator(
        "#setup-participant-matches .participant-match[data-client-id='c2']"
    ).click()

    select = page.locator('.participant-setup-row[data-client-id="c2"] select')
    assert select.input_value() == "r2"


def test_an_empty_app_suggests_no_names_and_no_places(page, local_server):
    load_with_stub(page, local_server, form_stub(base_state(routines=[])))
    open_form(page)

    assert page.locator("#setup-session-name-list option").count() == 0
    assert page.locator("#setup-location-list option").count() == 0


def test_suggestions_are_the_trainer_s_own_titles_and_places(page, local_server):
    state = base_state(
        sessions=[
            {
                "id": "s1",
                "title": "Moč",
                "location": "Studio",
                "startDate": f"{TODAY}T08:00:00.000Z",
                "time": "08:00 - 09:00",
                "participants": ["c1"],
                "routineId": "r1",
            }
        ]
    )
    load_with_stub(page, local_server, form_stub(state))
    open_form(page)

    names = page.eval_on_selector_all(
        "#setup-session-name-list option", "els => els.map(e => e.value)"
    )
    places = page.eval_on_selector_all(
        "#setup-location-list option", "els => els.map(e => e.value)"
    )
    assert "Moč" in names
    assert places == ["Studio"]
    assert "Morning Strength" not in names


def started_session(**extra):
    return {
        "id": "s-run",
        "title": "Jutranja",
        "startDate": f"{TODAY}T08:00:00",
        "time": "08:00 - 09:00",
        "location": "Studio",
        "participants": ["c1"],
        "routineId": "r1",
        **extra,
    }


def test_a_started_session_keeps_its_day_and_says_why(page, local_server):
    state = base_state(sessions=[started_session(completed=True)])
    load_with_stub(page, local_server, form_stub(state))
    open_form(page, None, None, "s-run")

    for field in ("setup-session-date", "setup-start-time", "setup-end-time"):
        assert page.get_attribute(f"#{field}", "readonly") is not None, field
    expect(page.locator("#setup-slot-locked-note")).to_be_visible()


def test_a_planned_session_keeps_its_fields_editable(page, local_server):
    state = base_state(sessions=[started_session()])
    load_with_stub(page, local_server, form_stub(state))
    open_form(page, None, None, "s-run")

    assert page.get_attribute("#setup-session-date", "readonly") is None
    expect(page.locator("#setup-slot-locked-note")).to_be_hidden()


SERIES = {
    "id": "ser1",
    "title": "Hipertrofija",
    "startDate": TODAY,
    "time": "07:00 - 08:00",
    "weekdays": [3],
    "participants": ["c1"],
    "routineId": "r1",
    "location": "Studio",
}


def evening_state():
    return base_state(
        sessionSeries=[dict(SERIES)],
        sessions=[
            {
                "id": "s-eve",
                "title": "Hipertrofija",
                "startDate": f"{TODAY}T07:00:00",
                "time": "07:00 - 08:00",
                "location": "Studio",
                "participants": ["c1"],
                "routineId": "r1",
                "seriesId": "ser1",
                "occurrenceDate": TODAY,
            }
        ],
    )


def test_an_evening_of_a_series_shows_repeat_ticked_with_its_days(page, local_server):
    load_with_stub(page, local_server, form_stub(evening_state()))
    open_form(page, None, None, "s-eve")

    assert page.is_checked("#setup-repeat")
    assert page.is_checked('#setup-repeat-days input[data-weekday="3"]')
    assert page.is_checked("#setup-repeat-days input:checked") is True


def test_ending_a_series_from_an_evening_ends_that_series_only(page, local_server):
    load_with_stub(page, local_server, form_stub(evening_state()))
    answer_app_questions(page)
    open_form(page, None, None, "s-eve")

    page.check("#setup-apply-to-series")
    page.fill("#setup-repeat-until", "2026-10-07")
    page.locator("#btn-setup-save").click()
    page.wait_for_function(
        "() => window.__state.sessionSeries[0].until === '2026-10-07'"
    )

    result = page.evaluate(
        """async () => {
          const series = await import(new URL('domain/sessionSeries.js', document.baseURI).href);
          const s = window.__state;
          return {
            seriesCount: s.sessionSeries.length,
            evenings: series
              .sessionsWithSeries(s.sessions, s.sessionSeries, { from: '2026-09-28', to: '2026-12-31' })
              .map((row) => row.startDate.slice(0, 10)),
          };
        }"""
    )
    assert result["seriesCount"] == 1
    assert result["evenings"] == [TODAY, "2026-10-07"]
