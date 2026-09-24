# tests/e2e/test_erasure_at_start.py
# Every erasure runs again when the app starts (TODO §65, src/data/clientErasure.js's
# resweepErasedClients, called from app.js). The sweep itself is pinned in
# tests/unit_js/data/clientErasure.test.mjs; this holds that the START really calls it and saves the
# result, which only the real app with its real store can show.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

# Leaves one client in the state an older build left an erasure in: marked erased, alias still kept
# (TODO §59). Written through the real store and flushed, so the reload reads it back from IndexedDB.
HALF_ERASE_FIRST_CLIENT = """async () => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    const q = await import(new URL('data/writeQueue.js', document.baseURI).href);
    const client = s.getState().clients[0];
    client.name = 'Client #OLDBLD';
    client.alias = 'with the knee';
    client.erasure = { erasedAt: '2026-08-01T09:00:00.000Z', requestedOn: '2026-07-30' };
    s.saveToLocalStorage();
    await q.flushWrites();
    return client.id;
}"""

CLIENT_BY_ID = """async (id) => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    return s.getState().clients.find((client) => client.id === id) || null;
}"""


def test_the_start_finishes_an_erasure_an_older_build_left_half_done(
    page, local_server
):
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    client_id = page.evaluate(HALF_ERASE_FIRST_CLIENT)

    page.reload()
    page.wait_for_selector("#view-client-directory.active")

    client = page.evaluate(CLIENT_BY_ID, client_id)
    assert client["alias"] == ""
    # The original dates stay: they are the trainer's evidence of when they complied.
    assert client["erasure"]["erasedAt"] == "2026-08-01T09:00:00.000Z"
