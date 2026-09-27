# tests/e2e/test_two_tabs.py
# Two tabs of the app on one device. Each tab holds the data in memory and every save writes the
# whole of it, so a tab left open saved its own picture of the world over the other tab's work: a
# client added in the newer tab vanished, without a word, when the older tab saved next.
#
# One tab works at a time (src/data/tabOwnership.js). Opening the app in another tab covers the
# older one with a notice and stops it saving; "Use it here" reloads it, which reads what the other
# tab saved and takes the turn back.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright. `clean_start`: the
# shared page otherwise loads the demo on every navigation, the reload included, which replaces the
# data this test counts.

import pytest

pytestmark = pytest.mark.clean_start

CLIENT_NAMES = """async () => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    return store.getState().clients.map((client) => client.name);
}"""

ADD_CLIENT = """async (name) => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const { newRecordId } = await import(new URL('data/recordId.js', document.baseURI).href);
    store.getState().clients.push({ id: newRecordId(), name, active: true });
    store.saveToLocalStorage();
    const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
    await queue.flushWrites();
}"""

NOTICE = "#dialog-other-tab"


def _open(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-header")


def _wait_until_holds(page, name):
    """The header is drawn before the data finishes loading; a save before that writes an empty
    memory. Wait until the tab holds `name`."""
    for _ in range(50):
        if name in page.evaluate(CLIENT_NAMES):
            return
        page.wait_for_timeout(100)
    raise AssertionError(
        f"{name} never reached this tab: {page.evaluate(CLIENT_NAMES)}"
    )


def test_the_older_tab_stops_saving_and_no_client_is_lost(page, local_server):
    tab_a = page
    _open(tab_a, local_server)
    tab_a.evaluate(ADD_CLIENT, "Test A")

    tab_b = page.context.new_page()
    _open(tab_b, local_server)
    tab_a.wait_for_selector(f"{NOTICE}[open]")
    assert tab_b.locator(f"{NOTICE}[open]").count() == 0
    tab_b.evaluate(ADD_CLIENT, "Test B")

    # The older tab, not reloaded since before Test B, tries to save: it must not write over B.
    tab_a.evaluate(ADD_CLIENT, "Test C (refused)")
    assert "Test B" in tab_b.evaluate(CLIENT_NAMES)

    tab_a.locator("#other-tab-use-here").click()
    tab_a.wait_for_selector("#app-header")
    tab_a.wait_for_function("() => !document.querySelector('#dialog-other-tab[open]')")
    _wait_until_holds(tab_a, "Test B")
    tab_a.evaluate(ADD_CLIENT, "Test C")
    tab_b.wait_for_selector(f"{NOTICE}[open]")

    tab_b.reload()
    tab_b.wait_for_selector("#app-header")
    _wait_until_holds(tab_b, "Test C")
    names = tab_b.evaluate(CLIENT_NAMES)
    assert {"Test A", "Test B", "Test C"} <= set(names), names
    assert "Test C (refused)" not in names
