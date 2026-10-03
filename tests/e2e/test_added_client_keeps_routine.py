# tests/e2e/test_added_client_keeps_routine.py
# A client added to a saved session with a routine of their own gets that routine. The
# session row keeps one routine, its first client's, and the clipboard opened from the card gave it
# to everybody, so the added client's choice was dropped without a word.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

SESSION = "s15f2e3d"  # "Lower Body Strength", seeded in two days, routine r11d5e6f
JANE = "c1a9f0e2"
HIIT = "r10d5e6f"

PLAN_OF = """async (id) => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    const plan = live.getActiveSession()?.clientRoutines?.[id];
    return plan ? { routineId: plan.routineId, count: plan.exercises.length } : null;
}"""


def test_a_client_added_to_a_saved_session_keeps_the_routine_chosen_for_them(
    page, local_server
):
    page.goto(f"{local_server}session/setup/{SESSION}")
    page.wait_for_selector("#form-workout-setup")
    page.fill("#setup-participant-search", "Jane")
    page.click(
        f"#setup-participant-matches .participant-match[data-client-id='{JANE}']"
    )
    page.select_option(
        f".participant-setup-row[data-client-id='{JANE}'] .select-routine-dropdown",
        HIIT,
    )
    page.click("#btn-setup-save")
    page.wait_for_selector("#view-clients.active")

    # The session's own address opens it as a tap on its card does (launchClipboardDirectly).
    page.goto(f"{local_server}session/{SESSION}")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    plan = page.evaluate(PLAN_OF, JANE)

    assert plan is not None, "Jane is not on the clipboard"
    assert plan["routineId"] == HIIT, plan
    assert plan["count"] > 0, "Jane's plan is empty"
