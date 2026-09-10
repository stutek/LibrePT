# tests/e2e/test_sandbox.py
# The two workspaces against the real engine (TODO §40): switching between them, and the isolation
# that makes the whole design worth having.
#
# The naming, the key suffixes and the staleness clock are pinned as pure logic
# (tests/unit_js/data/sandboxWorkspace.test.mjs). What only a real boot can show is the part that
# lives in storage: that a record written in the sandbox is in a DIFFERENT IndexedDB database and
# does not come back with the trainer, and that the move between them repaints the app instead of
# reloading the page. An in-memory filter over one database would satisfy every assertion at the
# tier below and still put sample people in front of a working trainer.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

CLIENT_NAMES = """async () => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    return store.getState().clients.map((c) => c.name);
}"""

DATABASES = "async () => (await indexedDB.databases()).map((d) => d.name).sort()"

WORKSPACE = """async () => {
    const ws = await import(new URL('data/workspace.js', document.baseURI).href);
    return ws.activeWorkspace();
}"""


def _switch(page, expected_workspace):
    """Use the menu, not the module: the control the trainer taps is part of what is being tested."""
    page.locator("#btn-app-menu").click()
    page.locator("#menu-sandbox").click()
    page.wait_for_function(
        """(expected) => import(new URL('data/workspace.js', document.baseURI).href)
               .then((ws) => ws.activeWorkspace() === expected)""",
        arg=expected_workspace,
    )
    page.wait_for_timeout(200)


def _add_client(page, name):
    page.evaluate(
        """async (name) => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const { newRecordId } = await import(new URL('data/recordId.js', document.baseURI).href);
            store.getState().clients.push({ id: newRecordId(), name, active: true });
            store.saveToLocalStorage();
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await queue.flushWrites();
        }""",
        name,
    )


@pytest.mark.clean_start
def test_the_sandbox_is_a_separate_database_and_nothing_leaks_back(page, local_server):
    """The promise the whole of §40 rests on. A client added in the sandbox must not exist in the
    trainer's own work — not hidden from a view, ABSENT, in another database."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")
    _add_client(page, "Real Client")

    _switch(page, "sandbox")
    assert "Real Client" not in page.evaluate(CLIENT_NAMES), (
        "the trainer's own client must not be visible in the sandbox"
    )
    _add_client(page, "Sandbox Person")

    databases = page.evaluate(DATABASES)
    assert databases == ["librept", "librept_sandbox"], (
        f"the sandbox is its own database, not a store inside the other: {databases}"
    )

    _switch(page, "working")
    names = page.evaluate(CLIENT_NAMES)
    assert "Real Client" in names, "the trainer's own work comes back untouched"
    assert "Sandbox Person" not in names, (
        "nothing written in the sandbox follows them out"
    )


@pytest.mark.clean_start
def test_switching_repaints_instead_of_reloading(page, local_server):
    """§40.3's ruling: the move re-renders. A reload costs the splash hold, the open view and any
    half-filled dialog, and puts a service-worker fetch in the path of a switch that can happen mid
    session. A marker set on `window` survives a repaint and dies with a reload."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")
    page.evaluate("() => { window.__stillHere = true; }")

    _switch(page, "sandbox")

    assert page.evaluate("() => window.__stillHere === true"), (
        "the page reloaded instead of repainting"
    )
    assert page.locator("body.in-sandbox").count() == 1, "the sandbox tints the header"
    assert "SANDBOX" in page.locator("#preview-badge").inner_text().upper()


@pytest.mark.clean_start
def test_a_sandbox_older_than_twelve_hours_offers_a_fresh_one(page, local_server):
    """§40.4. The seeded board is built around the day it was made, so by the next morning the demo
    has nothing live on it. Declining must be remembered — a question asked again immediately is a
    question that was not answered."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")
    _switch(page, "sandbox")

    # Age the sandbox by hand rather than waiting twelve hours: the meta store is what staleness is
    # measured against, and this is the same value seeding writes.
    page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const idb = await import(new URL('data/indexedDb.js', document.baseURI).href);
            const db = await idb.openDatabase({ schemas: ['4'], name: 'librept_sandbox' });
            await idb.withTransaction(db, ['meta'], 'readwrite', ({ store: s }) => {
                s('meta').put({
                    key: 'sandbox',
                    value: { seededAt: Date.now() - 13 * 60 * 60 * 1000 },
                });
            });
            db.close();
            await store.switchWorkspace('working');
        }"""
    )
    _switch(page, "sandbox")

    dialog = page.locator("#dialog-sandbox-stale")
    dialog.wait_for(state="visible", timeout=5000)
    page.locator("#sandbox-stale-decline").click()
    dialog.wait_for(state="hidden", timeout=5000)

    # Straight back in, well inside the three-hour cooldown: no second asking.
    _switch(page, "working")
    _switch(page, "sandbox")
    assert dialog.is_hidden(), "a declined offer must stay declined for the cooldown"


@pytest.mark.clean_start
def test_coming_back_returns_to_the_view_you_left(page, local_server):
    """§40.3, ruled 2026-09-10: stepping out to look something up and coming back to the dashboard
    means finding your session, your client and your exercise again — three taps on a gym floor with
    somebody waiting. The route is remembered per workspace, and the live session is recovered for
    the workspace being entered so the clipboard has something to draw."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")

    # Open a client's page — an ordinary view that names a record, which is what makes the return
    # worth anything: the dashboard would have been reachable either way.
    client_id = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.getState().clients[0].id;
        }"""
    )
    # Through the router, not by writing a path by hand: an invented path is refused by the very
    # check this test is about, and the failure then looks like the feature rather than the test.
    page.evaluate(
        """async (id) => {
            const router = await import(new URL('controllers/routerController.js', document.baseURI).href);
            router.navigateToPath(`/clients/${id}`);
        }""",
        client_id,
    )
    page.wait_for_timeout(300)
    left_on = page.url
    assert f"/clients/{client_id}" in left_on, left_on

    _switch(page, "sandbox")
    assert page.url != left_on, (
        "the sandbox does not open on the client page of another database"
    )

    _switch(page, "working")
    # The path, not the whole address: the deep-link query the test booted with is not part of what
    # is being remembered, and carrying it back would be remembering the wrong thing.
    assert f"/clients/{client_id}" in page.url, (
        f"came back to {page.url}, left from {left_on}"
    )


@pytest.mark.clean_start
def test_the_sandbox_says_how_to_leave_it(page, local_server):
    """§42.10, ruled 2026-09-10: the menu is way enough out — but the trainer has to be told it is
    there. The feed's leading card is where they are already being told none of this is real, so it
    is where the way back belongs, naming the control rather than describing it."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")
    _switch(page, "sandbox")

    page.wait_for_selector("#notification-area .notification-card", timeout=10000)
    feed = page.locator("#notification-area").inner_text().lower()

    assert "sandbox" in feed, feed[:400]
    assert "leave the sandbox" in feed, (
        "the card must name the menu item, not describe it"
    )
    # The destructive offer belongs to a mixed database, not to this one: clearing demo data in here
    # would empty the very thing the trainer came to look at.
    assert "clear demo data" not in feed, feed[:400]


@pytest.mark.clean_start
def test_the_badge_offers_nothing_to_follow_in_the_sandbox(page, local_server):
    """§42.12. The badge links to the preview build's data-loss notice, which is the wrong
    destination from a workspace holding sample data — and it is the one link a trainer taps
    expecting an explanation of what they are looking at. The explanation lives in the feed
    (§42.10); the badge becomes a marker, and gets its link back on the way out."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")
    badge = page.locator("#preview-badge")

    assert badge.get_attribute("href"), (
        "outside the sandbox it stays the route to that notice"
    )

    _switch(page, "sandbox")
    assert badge.get_attribute("href") is None, (
        "the sandbox badge must not offer a link"
    )
    assert badge.get_attribute("role") == "status"

    _switch(page, "working")
    assert badge.get_attribute("href"), (
        "the link comes back with the trainer's own work"
    )
