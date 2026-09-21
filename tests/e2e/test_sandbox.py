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
    """Use the menu, not the module: the control the trainer taps is part of what is being tested.

    **Waits for `body.in-sandbox`, NOT for `activeWorkspace()`** (TODO §45.14). The stored workspace
    flag is set in the MIDDLE of the switch: `switchWorkspace` in data/stateStore.js calls
    `setActiveWorkspace(name)` and only then awaits `loadSavedState()` and, for a first entry, seeding
    the sandbox. A test that waited on the flag was reading the URL, and clicking the menu, while all
    of that was still running — it passed on a quiet machine and failed under eight browser workers,
    which is what it did on 2026-09-11.

    The class is set by `renderWorkspaceChrome()` inside `renderEverything()`, which app.js's
    `switchToWorkspace` runs after that await — and `renderEverything()` through `returnToLastView()`,
    the call that rewrites the URL, is one synchronous block. So by the time this class can be
    observed, the switch has loaded its database and moved the address bar. No sleep is needed and
    none is used: a timeout here would be a guess about a machine rather than a wait for the app.
    """
    page.locator("#btn-app-menu").click()
    page.locator("#menu-sandbox").click()
    page.wait_for_function(
        "(inSandbox) => document.body.classList.contains('in-sandbox') === inSandbox",
        arg=expected_workspace == "sandbox",
    )


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
            const idb = await import(new URL('data/indexedDb.js', document.baseURI).href);
            const db = await idb.openDatabase({ schemas: ['4'], name: 'librept_sandbox' });
            await idb.withTransaction(db, ['meta'], 'readwrite', ({ store: s }) => {
                s('meta').put({
                    key: 'sandbox',
                    value: { seededAt: Date.now() - 13 * 60 * 60 * 1000 },
                });
            });
            db.close();
        }"""
    )
    # Out and back in through the MENU, not by calling switchWorkspace from here (TODO §45.14): a
    # module call moves the app's stored workspace without repainting, so `body.in-sandbox` would
    # still say sandbox and every later wait would be satisfied by a stale class. Leaving the way a
    # trainer leaves keeps the page's own account of itself true.
    _switch(page, "working")
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


@pytest.mark.clean_start
def test_leaving_the_sandbox_takes_the_guide_with_it(page, local_server):
    """§42.15, reported 2026-09-11: "leave sandbox did not close the (collapsed) walktrough cards".

    The story's steps drive the sandbox's seeded records, so in the trainer's own work the guide
    points at controls for records that are not there — and parked, it is a bar over their real
    session that they did not ask for and cannot act on. Leaving ends it."""
    page.goto(f"{local_server}?workspace=sandbox&splash=off&demo=story&lang=en")
    page.wait_for_selector("#walkthrough-overlay", timeout=20000)

    # Parked, because that is the state it was reported in: the bar survives, the panel does not.
    page.locator("#walkthrough-collapse").click()
    page.wait_for_timeout(400)
    assert page.locator("#walkthrough-overlay").count() == 1

    _switch(page, "working")

    assert page.locator("#walkthrough-overlay").count() == 0, (
        "the guide followed the trainer out of the sandbox"
    )


@pytest.mark.clean_start
def test_the_sandbox_marks_the_header_the_pill_and_the_frame(page, local_server):
    """Asked 2026-09-11 as an orange skin over the whole app, narrowed 2026-09-12 to the header.

    It is worth a test rather than an eyeball because of what it PREVENTS — a trainer logging a real
    set into sample data, or reading sample numbers as a client's. The marks have to arrive with the
    workspace and leave with it: one that stayed behind would say "sandbox" over real records, which
    is the same failure pointing the other way.

    The narrowing is itself asserted here: entering the sandbox must leave the trainer's chosen
    theme alone. The orange used to BE `--primary`, so a regression that put the skin back would
    otherwise pass every check below."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")

    own_work = page.evaluate(
        "() => getComputedStyle(document.body).getPropertyValue('--primary').trim()"
    )

    _switch(page, "sandbox")

    # orange-700, written once in modules/common/sandboxMarker.css. Asserted as the colour itself
    # rather than as "not the theme's": a later edit that quietly turned the marks green would still
    # be different from every theme, and would still say nothing a trainer recognises.
    ORANGE = "rgb(194, 65, 12)"

    marks = page.evaluate(
        """() => ({
             primary: getComputedStyle(document.body).getPropertyValue('--primary').trim(),
             headerEdge: getComputedStyle(document.querySelector('.app-header')).boxShadow,
             headerBg: getComputedStyle(document.querySelector('.app-header')).backgroundImage,
             frame: getComputedStyle(document.body, '::after').borderTopWidth,
             frameColour: getComputedStyle(document.body, '::after').borderTopColor,
           })"""
    )
    assert marks["primary"] == own_work, (
        "entering the sandbox must leave the trainer's own theme alone: only the header, the pill "
        f"and the frame turn orange ({marks['primary']} vs {own_work})"
    )
    assert ORANGE in marks["headerEdge"], f"no orange edge on the header: {marks}"
    assert "gradient" in marks["headerBg"], f"no orange wash over the header: {marks}"
    assert marks["frame"] == "3px", f"no frame around the app: {marks}"
    assert marks["frameColour"] == ORANGE, (
        f"the frame is not the sandbox orange: {marks}"
    )

    # The pill in the app bar (asked 2026-09-12). Outside the sandbox the same pill marks demo data
    # in the trainer's own workspace and keeps its blue, so this is asserted in the sandbox rather
    # than on the class alone.
    pill = page.evaluate(
        """() => getComputedStyle(document.getElementById('preview-badge')).backgroundColor"""
    )
    assert pill == ORANGE, f"the sandbox pill is not the sandbox orange: {pill}"

    _switch(page, "working")

    after = page.evaluate(
        """() => ({
             primary: getComputedStyle(document.body).getPropertyValue('--primary').trim(),
             headerEdge: getComputedStyle(document.querySelector('.app-header')).boxShadow,
             frame: getComputedStyle(document.body, '::after').borderTopWidth,
           })"""
    )
    assert after["primary"] == own_work, "the trainer's own theme is still theirs"
    assert ORANGE not in after["headerEdge"], (
        f"the orange header followed the trainer out of the sandbox: {after}"
    )
    assert after["frame"] != "3px", "the frame left with the workspace"


@pytest.mark.clean_start
def test_the_sandbox_pill_breathes_and_stops_for_reduced_motion(page, local_server):
    """Asked 2026-09-12: make the pill breathe slowly between two oranges so it is noticed.

    The half worth a test is the SECOND one. Motion here is emphasis, never meaning — the pill says
    the word SANDBOX either way — which is what makes it safe to switch off for a reader who has
    asked for less movement, and exactly the kind of contract a later style edit drops without
    noticing."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")
    _switch(page, "sandbox")

    moving = page.evaluate(
        "() => getComputedStyle(document.getElementById('preview-badge')).animationName"
    )
    assert moving == "sandboxBreathe", f"the pill does not breathe: {moving}"

    page.emulate_media(reduced_motion="reduce")
    still = page.evaluate(
        "() => getComputedStyle(document.getElementById('preview-badge')).animationName"
    )
    assert still == "none", f"the breath ignores a request for less motion: {still}"


@pytest.mark.clean_start
def test_the_sandbox_card_lists_the_chapters_of_the_guided_story(page, local_server):
    """Asked for 2026-09-21. The story is six chapters and four to six minutes, and the card offered
    one way into it: the beginning. A trainer who wants to see the evening after a session should be
    able to start there, so the card carries the whole table of contents and every line of it is a
    way in."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")
    _switch(page, "sandbox")

    page.wait_for_selector("#notification-area .notification-card", timeout=10000)
    page.locator("#notification-grabber-btn").click()
    page.locator(".notification-chapters-summary").first.click()

    chapters = page.locator(".notification-chapter")
    # Every chapter of the trainer's own walk, named — not a count, which nobody can choose from.
    assert chapters.count() >= 4, chapters.all_inner_texts()
    assert any(text.strip() for text in chapters.all_inner_texts())

    chapters.last.click()
    page.wait_for_url("**chapter=**", timeout=10000)
    assert "demo=story" in page.url, page.url
