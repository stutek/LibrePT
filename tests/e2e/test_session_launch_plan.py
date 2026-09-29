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
