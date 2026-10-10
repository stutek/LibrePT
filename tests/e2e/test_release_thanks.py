# tests/e2e/test_release_thanks.py
# The thanks to early adopters, a card in the notification drawer once per release (asked for
# 2026-10-10). Which device states show it is pinned in tests/unit_js/domain/notificationItems.test.mjs
# and the rendered card in tests/medium/test_notification_footer.py; this file holds what only the
# whole app can answer: that app.js tells the drawer the first-run questions are answered, and that a
# closed card stays closed through a real reload, with the service worker and the boot in between.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

RELEASE_THANKS = "#notification-list-container .notification-card.release-thanks"

OPEN_DRAWER = """async () => {
    const area = await import(new URL('modules/common/notificationArea.js', document.baseURI).href);
    area.toggleNotificationArea(true);
}"""


def open_drawer(page):
    # Opened through the component, not by tapping the handle: when a seeded session is live at the
    # hour the suite runs, the clipboard bar takes the middle of the handle (the reason
    # tests/e2e/test_sandbox.py opens it the same way).
    page.evaluate(OPEN_DRAWER)
    page.wait_for_selector("#notification-area.is-expanded")


def test_the_thanks_is_in_the_drawer_after_the_first_run(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    open_drawer(page)

    assert page.locator(RELEASE_THANKS).count() == 1


def test_a_closed_thanks_stays_closed_after_a_reload(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    open_drawer(page)
    page.locator(RELEASE_THANKS).get_by_role(
        "button", name="Close this message"
    ).click()
    page.wait_for_selector(RELEASE_THANKS, state="detached")

    page.reload()
    page.wait_for_selector("#view-clients.active")
    open_drawer(page)
    # The drawer is drawn when it opens, so the feed's other cards are there to be counted; the
    # thanks is not among them.
    page.wait_for_selector("#notification-list-container .notification-card")
    assert page.locator(RELEASE_THANKS).count() == 0
