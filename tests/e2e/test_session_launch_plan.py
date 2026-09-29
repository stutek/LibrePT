# tests/e2e/test_session_launch_plan.py
# A session opens with the plan it was given.
#
# The session form offers "Empty plan, no routine" for each participant. Opening such a session
# looked for that routine, did not find it, and substituted the FIRST routine in the library, so a
# trainer who had just built "Beginner full body" saw its exercises on a session planned empty — a
# programme nobody chose, on the gym floor.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.conftest import answer_app_questions

MORNING = (
    '.session-card[data-session-id="s04f2e3d"]'  # Morning Conditioning, seeded tomorrow
)


def test_a_session_planned_empty_opens_empty(page, local_server):
    page.goto(local_server)
    page.wait_for_selector(MORNING)
    page.evaluate(
        """async () => {
          const store = await import(new URL('data/stateStore.js', document.baseURI).href);
          const state = store.getState();
          state.sessions.find((s) => s.id === 's04f2e3d').routineId = 'empty_plan';
          if (!state.routines.length) throw new Error('the seed must have routines to be tempted by');
        }"""
    )
    page.locator(MORNING).click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    planned = page.evaluate(
        """async () => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          return Object.values(session.clientRoutines).map((c) => c.exercises.length);
        }"""
    )
    assert planned and all(count == 0 for count in planned), planned


# Seeded around the current hour and not completed, so it can always be started.
RUNNING = ".session-card"
RUNNING_TITLE = "Group Strength & Conditioning"


def _running_session(page):
    return page.evaluate(
        """async () => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const s = ctrl.getActiveSession();
          return s && { started: !!s.started, startTime: s.startTime };
        }"""
    )


def test_tapping_a_running_sessions_card_returns_to_it(page, local_server):
    # A started session holds its clock and every set logged so far. Its card on the board is
    # marked as the running one, and a tap on it rebuilt the clipboard from the routine: an
    # unstarted copy replaced the session, without a word.
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(RUNNING, has_text=RUNNING_TITLE).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-start-session")
    # Started off its slot, the app offers to move the slot onto the clock. Accepting it is the
    # quickest way to a running session; where the slot ends up does not matter here.
    dialog = page.locator("#dialog-session-start-time[open]")
    dialog.wait_for()
    page.click("#btn-session-start-time-apply")
    dialog.wait_for(state="detached")
    before = _running_session(page)
    assert before["started"] and before["startTime"], before

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(RUNNING, has_text=RUNNING_TITLE).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    assert _running_session(page) == before


DROP_IN = (
    "s17f2e3d"  # "Open Slot (Drop-in)": nobody on it yet, three places, its own routine
)
SARAH = "c3c7d2c4"


def _stored_session(page, session_id):
    return page.evaluate(
        """async (id) => {
          const store = await import(new URL('data/stateStore.js', document.baseURI).href);
          const s = store.getState().sessions.find((row) => row.id === id);
          return { places: s.maxCapacity, routineId: s.routineId, participants: s.participants };
        }""",
        session_id,
    )


def test_the_first_client_in_a_drop_in_slot_keeps_its_places_and_its_plan(
    page, local_server
):
    # Adding the first walk-in to a slot for three made it a slot for one — the form has no field
    # for places and counted the participants — and the new client's routine menu opened on the
    # library's first routine, which replaced the slot's own plan on save.
    answer_app_questions(page)
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    before = _stored_session(page, DROP_IN)
    assert before["places"] == 3 and before["participants"] == [], before

    page.goto(f"{local_server}session/setup/{DROP_IN}")
    page.wait_for_selector("#view-workout-setup.active")
    page.fill("#setup-participant-search", "Sarah")
    page.click(
        f"#setup-participant-matches .participant-match[data-client-id='{SARAH}']"
    )
    page.locator("#btn-setup-open").click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    after = _stored_session(page, DROP_IN)
    assert after == {
        "places": 3,
        "routineId": before["routineId"],
        "participants": [SARAH],
    }, after


def test_a_tap_on_a_slot_with_nobody_on_it_opens_its_form(page, local_server):
    # The tap did nothing: no clipboard, no message. The trainer tapping a drop-in slot wants to
    # add the walk-in who just arrived, and the session's form is where a client is added.
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(f'.session-card[data-session-id="{DROP_IN}"]').click()

    page.wait_for_selector("#view-workout-setup.active")
    path = page.evaluate("() => location.pathname")
    assert path.endswith(f"session/setup/{DROP_IN}"), path
