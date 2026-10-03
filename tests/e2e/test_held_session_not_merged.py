# tests/e2e/test_held_session_not_merged.py
# A session started while one already held overlaps it is run on its own. Merged with the
# held one, it took that session's clients, and a training done in the new session was written under
# the held one, with no attendance for the new one.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

HELD_ID = "s00f2e3d"  # "Early Bird Strength", seeded three hours ago and finished
CLIENT = "c4d6c3b5"  # booked into it

ADD_OVERLAPPING_SESSION = """async ({ held, client }) => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = store.getState();
    const done = state.sessions.find((s) => s.id === held);
    state.sessions.push({
        ...done,
        id: 'later-same-hour',
        title: 'Later, same hour',
        participants: [client],
        status: 'scheduled',
        duration: undefined,
    });
    store.saveToLocalStorage();
    const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
    await queue.flushWrites();
}"""

WHAT_THE_CLIPBOARD_RUNS = """async () => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    const source = live.getActiveSession()?.sourceSession;
    return source
        ? { ids: [source.id, ...(source.ids || [])], clientSessions: source.clientSessions || {} }
        : null;
}"""


def test_a_session_overlapping_a_held_one_is_run_without_it(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.evaluate(ADD_OVERLAPPING_SESSION, {"held": HELD_ID, "client": CLIENT})
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator('.session-card[data-session-id="later-same-hour"]').click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    runs = page.evaluate(WHAT_THE_CLIPBOARD_RUNS)

    assert runs is not None, "the clipboard did not open"
    assert HELD_ID not in runs["ids"], f"the held session is on the clipboard: {runs}"
    assert runs["clientSessions"].get(CLIENT) == "later-same-hour", runs
