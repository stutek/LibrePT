# tests/e2e/test_card_plan_warning.py
# A session card warns "Program not defined" only when no one on it has a plan. A session
# with no routine whose participants' plans were written on the clipboard kept the red warning, which
# can lead a trainer to write the plan again.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

ADD_SESSIONS = """async () => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = store.getState();
    const client = state.clients[0].id;
    const start = new Date(Date.now() + 26 * 3600 * 1000);
    start.setMinutes(0, 0, 0);
    const slot = (id, title) => ({
        id,
        title,
        time: `${String(start.getHours()).padStart(2, '0')}:00 - ${String((start.getHours() + 1) % 24).padStart(2, '0')}:00`,
        startDate: start.toISOString(),
        day: 'tomorrow',
        location: '',
        participants: [client],
        routineId: '',
        maxCapacity: 1,
        status: 'scheduled',
    });
    state.sessions.push(slot('with-plan', 'Written on the clipboard'), slot('without-plan', 'Nothing yet'));
    state.clientPrograms.push({
        id: 'plan-on-clipboard',
        clientId: client,
        sessionId: 'with-plan',
        status: 'planned',
        createdAt: new Date().toISOString(),
        exercises: [{ id: 'i1', type: 'exercise', name: 'Plank', sets: [] }],
    });
    store.saveToLocalStorage();
    const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
    await queue.flushWrites();
}"""


def _warns(page, session_id):
    card = page.locator(f'.session-card[data-session-id="{session_id}"]')
    card.wait_for()
    return card.locator(".session-warning-pill").count() > 0


def test_a_card_warns_only_when_nobody_on_it_has_a_plan(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.evaluate(ADD_SESSIONS)
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    assert not _warns(page, "with-plan"), (
        "a plan written on the clipboard still reads as missing"
    )
    assert _warns(page, "without-plan"), (
        "a session with no plan at all lost its warning"
    )
