# tests/e2e/test_drawer_is_current.py
# The message drawer shows what is stored when it is opened. After a plan was thrown away
# or a client taken off a session, it went on listing the old unscheduled plans until a reload.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

ADD_PLAN_UNDRAWN = """async () => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = store.getState();
    state.clientPrograms.push({
        id: 'waiting-plan',
        clientId: state.clients[0].id,
        status: 'planned',
        title: 'Plan nobody drew',
        createdAt: new Date().toISOString(),
        exercises: [{ id: 'i1', type: 'exercise', name: 'Plank', sets: [] }],
    });
    store.saveToLocalStorage();
}"""


def test_the_drawer_shows_an_unscheduled_plan_made_since_it_was_last_drawn(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.evaluate(ADD_PLAN_UNDRAWN)

    page.locator("#notification-grabber-btn").click()
    page.wait_for_selector("#notification-area.is-expanded")

    assert "Plan nobody drew" in page.inner_text("#notification-area")
