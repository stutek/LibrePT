# tests/e2e/test_session_launch_plan.py
# A session opens with the plan it was given.
#
# The session form offers "Empty plan, no routine" for each participant. Opening such a session
# looked for that routine, did not find it, and substituted the FIRST routine in the library, so a
# trainer who had just built "Beginner full body" saw its exercises on a session planned empty — a
# programme nobody chose, on the gym floor.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

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
