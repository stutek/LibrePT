# tests/e2e/test_messages_pane_navigation.py
# Navigating away must reveal where you navigated TO (TODO §28.7).
#
# The messages drawer expands to cover everything below the header, so a route change underneath it
# is a route change nobody can see. Reported as "the ☰ menu does not work while the messages pane is
# expanded" — the menu works perfectly, and that is exactly why it took a report to find: the URL
# changes, the view activates, and the screen does not move.
#
# Full e2e rather than medium: the claim spans the router, the header menu and the notification area
# at once, which is precisely the seam a single mounted component cannot have.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

EXPAND_MESSAGES = """async () => {
    const area = await import(new URL('modules/common/notificationArea.js', document.baseURI).href);
    area.toggleNotificationArea(true);
}"""

IS_EXPANDED = "() => document.querySelector('.notification-area').classList.contains('is-expanded')"


def _expand_messages(page):
    page.evaluate(EXPAND_MESSAGES)
    # The drawer slides up over 0.32s; asserting before it settles would pass on a drawer that is
    # still on its way in.
    page.wait_for_timeout(400)
    assert page.evaluate(IS_EXPANDED)


def test_choosing_a_view_from_the_menu_reveals_it(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-header")
    _expand_messages(page)

    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#menu-clients-register").click()

    page.wait_for_selector("#view-client-directory.active")
    # The destination is what the trainer must end up looking at. A drawer left covering it is the
    # whole bug: the route changed, and nothing on screen said so.
    page.wait_for_function(f"() => !({IS_EXPANDED})()")
    assert page.locator("#btn-add-client").is_visible()


def test_the_drawer_survives_actions_that_are_not_navigation(page, local_server):
    """Collapsing on navigation must not become collapsing on any tap — the drawer is where a
    trainer reads a list of messages, and it closing under them while they scroll it would be a
    second bug wearing the first one's clothes."""
    page.goto(local_server)
    page.wait_for_selector("#app-header")
    _expand_messages(page)

    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.keyboard.press("Escape")

    assert page.evaluate(IS_EXPANDED)


def test_the_drawer_stays_open_when_nothing_changed_view(page, local_server):
    """The other half of §28.7, and the regression it caused (reported 2026-08-18: "the message area
    can't be expanded").

    Expanding the drawer settles the timeline, which rewrites the URL to the focused day — so the
    router re-enters the SAME route, and a rule that collapsed on every switchView collapsed the
    drawer 3ms after it opened. From a trainer's side the pane simply would not open at all.
    Collapsing belongs to an actual change of view, not to every call at that seam.
    """
    page.goto(local_server)
    page.wait_for_selector("#app-header")

    # The trainer's own control, not the module function the other tests call: the collapse is
    # provoked by what EXPANDING does to the layout, so reaching past the handle would skip the bug.
    page.locator("#notification-grabber-btn").click()
    # Long enough for the timeline settle and any route re-entry it provokes.
    page.wait_for_timeout(1500)

    assert page.evaluate(IS_EXPANDED), (
        "the drawer closed itself with nobody navigating anywhere"
    )
