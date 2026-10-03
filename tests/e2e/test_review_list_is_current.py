# tests/e2e/test_review_list_is_current.py
# The Pending Review screen lists every signal that waits when it is opened. It showed the
# list as it was last drawn — "Nothing waiting for review" right after a session that left a signal —
# until the page was reloaded.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

ADD_SIGNAL_UNDRAWN = """async () => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const records = await import(new URL('data/trainingRecords.js', document.baseURI).href);
    const state = store.getState();
    records.addPendingNote(state, {
        id: 'fresh-signal',
        clientId: state.clients[0].id,
        clientName: state.clients[0].name,
        date: new Date().toISOString(),
        exerciseName: 'Fresh Movement',
        tag: 'Too Hard - Reduce Load',
        resolved: false,
    });
    store.saveToLocalStorage();
}"""

GO_TO_REVIEW = """async () => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    const { navigateToPath, urlFor } = live.getAppDeps();
    navigateToPath(urlFor('adjustments'));
}"""


def test_the_review_screen_lists_a_signal_given_since_it_was_last_drawn(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.evaluate(ADD_SIGNAL_UNDRAWN)

    page.evaluate(GO_TO_REVIEW)
    page.wait_for_selector("#view-adjustments.active")

    assert "Fresh Movement" in page.inner_text("#dashboard-adjustments-list")
