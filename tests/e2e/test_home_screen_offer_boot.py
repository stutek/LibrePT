# tests/e2e/test_home_screen_offer_boot.py
# When the whole app shows the home-screen offer (src/modules/common/homeScreenInstall.js): only
# once the welcome screen has come down, and on the flyer's sandbox link too, which skips the
# trainer's details. What the card and Settings say per browser is pinned in
# tests/medium/test_home_screen_offer.py; this file holds what only app.js can answer.
#
# Safari on an iPhone is the browser here because it needs no event: the card is drawn from the user
# agent alone. Fixtures (browser, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.conftest import NAVIGATION_TIMEOUT_MS

IPHONE_SAFARI = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
)
CARD = "#notification-list-container .home-screen-offer"
OPEN_DRAWER = """async () => {
    const area = await import(new URL('modules/common/notificationArea.js', document.baseURI).href);
    area.toggleNotificationArea(true);
}"""


@pytest.fixture
def iphone(browser, local_server):
    """Safari on an iPhone that has never seen this app."""
    context = browser.new_context(
        reduced_motion="reduce",
        user_agent=IPHONE_SAFARI,
        has_touch=True,
        viewport={"width": 390, "height": 844},
    )
    page = context.new_page()
    page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
    yield page
    context.close()


def test_the_offer_waits_while_the_welcome_screen_asks(iphone, local_server):
    iphone.goto(local_server + "?lang=sl&workspace=sandbox")
    iphone.locator("#btn-terms-agree").wait_for(state="visible", timeout=15_000)
    iphone.evaluate(OPEN_DRAWER)

    assert iphone.locator(CARD).count() == 0


def test_the_flyer_link_shows_the_offer_once_the_welcome_screen_is_done(iphone, local_server):
    iphone.goto(local_server + "?lang=sl&workspace=sandbox&demo=walkthrough")
    iphone.locator("#btn-terms-agree").click(timeout=15_000)
    iphone.locator("#app-splash-theme [data-splash-theme='daylight']").click()
    iphone.locator("#splash-theme-continue").click()
    iphone.locator("#app-splash").wait_for(state="hidden", timeout=30_000)

    iphone.evaluate(OPEN_DRAWER)
    card = iphone.locator(CARD)
    card.wait_for(state="attached", timeout=5_000)
    assert card.locator(".home-screen-steps li").count() == 3
