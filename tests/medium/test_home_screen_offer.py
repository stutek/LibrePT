# tests/medium/test_home_screen_offer.py
# The offer to put the app's icon on the home screen (src/modules/common/homeScreenInstall.js): a
# card in the notification area after the welcome screen, and a section in Settings that is always
# there. Which browser gets what is decided by a pure function pinned in
# tests/unit_js/modules/common/homeScreenInstall.test.mjs; these are the promises of what is drawn.
#
# A real install cannot happen in a headless browser, so each situation is made the way the module
# reads it: the user agent and touch points for Safari, `navigator.standalone` for an app already
# running from its icon, and a `beforeinstallprompt` event whose prompt() records the call.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

CARD = "#notification-list-container .home-screen-offer"
SETTINGS = "#settings-home-screen"
CLOSED_KEY = "librept_home_screen_offer_closed"

IPHONE_SAFARI = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
)


def stub(lang="en", welcome_finished=True):
    return f"""
import {{ bootNotificationArea }} from './appBoot.js';
import {{ renderNotificationArea, toggleNotificationArea }} from './modules/common/notificationArea.js';
import {{ renderSettingsDialog }} from './modules/common/applicationHeader.js';
import {{
  listenForInstallPrompt, onInstallSituationChange, renderSettingsHomeScreen,
}} from './modules/common/homeScreenInstall.js';
import {{ escapeHTML }} from './modules/common/utils.js';
import {{ TRANSLATIONS }} from './i18n/index.js';

const t = (key) => TRANSLATIONS.{lang}[key] || key;
listenForInstallPrompt();
bootNotificationArea({{
  getState: () => ({{ clients: [{{ id: 'c1', name: 'Real Person' }}] }}),
  getActiveSession: () => null,
  t,
  escapeHTML,
  navigateToPath: () => {{}},
  isFirstRunAnswered: () => true,
  isWelcomeFinished: () => {"true" if welcome_finished else "false"},
}});
renderSettingsDialog();
const redraw = () => {{ renderNotificationArea(); renderSettingsHomeScreen(t); }};
onInstallSituationChange(redraw);
redraw();
toggleNotificationArea(true);
window.__stubReady = true;
"""


def as_iphone_safari(page):
    page.add_init_script(
        f"Object.defineProperty(navigator, 'userAgent', {{ get: () => '{IPHONE_SAFARI}' }});"
        "Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });"
    )


def mount(page, local_server, **kwargs):
    load_with_stub(page, local_server, stub(**kwargs))
    page.wait_for_function("() => window.__stubReady === true")


def open_settings(page):
    page.evaluate("() => document.getElementById('dialog-settings').showModal()")


def words(page, lang, *keys):
    return page.evaluate(
        """async ([lang, keys]) => {
            const { TRANSLATIONS } = await import(new URL('i18n/index.js', document.baseURI).href);
            return keys.map((key) => TRANSLATIONS[lang][key]);
        }""",
        [lang, list(keys)],
    )


def without_glyph_marks(text):
    return text.replace("{pageMenu}", "").replace("{share}", "")


IPHONE_STEPS = ("home_screen_iphone_step1", "home_screen_iphone_step2", "home_screen_iphone_step3")


@pytest.mark.parametrize("lang", ["sl", "en", "de"])
def test_safari_on_an_iphone_is_shown_the_steps_in_its_language(page, local_server, lang):
    as_iphone_safari(page)
    mount(page, local_server, lang=lang)
    steps = words(page, lang, *IPHONE_STEPS)

    card = page.locator(CARD)
    assert card.count() == 1
    shown = card.locator(".home-screen-steps li").evaluate_all(
        "items => items.map((li) => li.textContent)"
    )
    assert shown == [without_glyph_marks(step) for step in steps]
    # The first step names two buttons and draws each one's glyph after its name.
    assert card.locator(".home-screen-steps li").first.locator(".home-screen-glyph").count() == 2
    # Safari cannot be started from a page, so the card offers no button that pretends to.
    assert card.locator("[data-home-screen-add]").count() == 0

    open_settings(page)
    settings = page.locator(SETTINGS)
    assert settings.locator(".home-screen-steps li").count() == 3
    assert settings.locator(".home-screen-steps li").first.is_visible()
    assert page.locator("#settings-home-screen-heading").text_content() == words(
        page, lang, "home_screen_heading"
    )[0]


def test_the_card_waits_for_the_welcome_screen(page, local_server):
    as_iphone_safari(page)
    mount(page, local_server, welcome_finished=False)

    assert page.locator(CARD).count() == 0


def test_closing_the_card_ends_it_for_good_and_settings_keeps_the_offer(page, local_server):
    as_iphone_safari(page)
    mount(page, local_server)

    page.locator(CARD).get_by_role("button", name="Close this message").click()

    assert page.locator(CARD).count() == 0
    assert page.evaluate(f"() => localStorage.getItem('{CLOSED_KEY}')") == "1"
    page.evaluate(
        "async () => (await import(new URL('modules/common/notificationArea.js', document.baseURI).href)).renderNotificationArea()"
    )
    assert page.locator(CARD).count() == 0
    open_settings(page)
    assert page.locator(SETTINGS).locator(".home-screen-steps li").first.is_visible()


FAKE_INSTALL_EVENT = """(outcome) => {
    window.__prompted = 0;
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = () => { window.__prompted += 1; return Promise.resolve({ outcome }); };
    window.dispatchEvent(event);
    return event.defaultPrevented;
}"""


def test_the_browser_install_event_gives_a_button_that_asks_the_browser(page, local_server):
    mount(page, local_server)
    assert page.locator(CARD).count() == 0, "no event yet: this browser can neither ask nor name steps"

    prevented = page.evaluate(FAKE_INSTALL_EVENT, "accepted")
    assert prevented, "the browser's own install bar is held back; the app's offer says why"

    add = page.locator(CARD).get_by_role("button", name="Add the icon to the home screen")
    add.click()
    page.wait_for_function("() => window.__prompted === 1")
    page.wait_for_function(f"() => localStorage.getItem('{CLOSED_KEY}') === '1'")
    page.locator(CARD).wait_for(state="detached")


def test_settings_offers_the_browser_install_button(page, local_server):
    mount(page, local_server)
    page.evaluate(FAKE_INSTALL_EVENT, "dismissed")
    open_settings(page)

    page.locator(SETTINGS).get_by_role("button", name="Add the icon to the home screen").click()
    page.wait_for_function("() => window.__prompted === 1")
    # Said no to the browser: nothing is closed, and the browser may offer again later.
    assert page.evaluate(f"() => localStorage.getItem('{CLOSED_KEY}')") is None


def test_an_app_already_on_the_home_screen_offers_nothing(page, local_server):
    page.add_init_script("Object.defineProperty(navigator, 'standalone', { get: () => true });")
    as_iphone_safari(page)
    mount(page, local_server)

    assert page.locator(CARD).count() == 0
    assert page.locator(SETTINGS).text_content() == words(page, "en", "home_screen_installed")[0]


def test_another_browser_is_told_to_use_its_own_menu(page, local_server):
    mount(page, local_server)

    assert page.locator(CARD).count() == 0
    assert page.locator(SETTINGS).text_content() == words(page, "en", "home_screen_browser_menu")[0]
