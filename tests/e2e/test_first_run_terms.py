# tests/e2e/test_first_run_terms.py
# End-to-end coverage of the first-run Terms & disclaimer agreement: on a fresh install it is asked
# AFTER the language, as the welcome screen's second step, and is mandatory there (no ✕, Escape
# blocked); "I agree" persists the acceptance and dismisses it, and a returning (accepted) trainer
# never sees it.
#
# These tests build their OWN browser context so the conftest auto-accept fixture (which only
# covers the shared `page` fixture) does not suppress the agreement.

from tests.conftest import NAVIGATION_TIMEOUT_MS


def _fresh_page(browser, local_server, accepted=False):
    context = browser.new_context()
    if accepted:
        context.add_init_script(
            "window.localStorage.setItem('librept_terms_accepted', '1');"
        )
    page = context.new_page()
    # Own context, so the conftest fixture that does this for the shared `page` cannot reach us.
    page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
    page.goto(local_server)
    page.locator("#app-splash-language").wait_for(state="visible")
    return context, page


def test_the_language_is_asked_before_the_terms(browser, local_server):
    """A trainer on a cleared browser used to meet English terms on top of the language step, and
    had to agree before *Slovenščina* could be tapped."""
    context, page = _fresh_page(browser, local_server)
    try:
        assert page.locator("#dialog-terms").get_attribute("open") is None

        page.locator("[data-splash-lang='sl']").click()

        terms = page.locator("#dialog-terms")
        terms.wait_for(state="visible")
        assert page.locator("#btn-terms-agree").inner_text() != "I agree"
    finally:
        context.close()


def test_the_page_declares_its_language_before_one_is_chosen(browser, local_server):
    """Before the trainer picked a language the document declared `lang="null"`: the unchosen
    language is null, and it was written into `<html lang>` as text. The page is English until a
    choice is made, so it says so."""
    context, page = _fresh_page(browser, local_server)
    try:
        assert page.evaluate("document.documentElement.getAttribute('lang')") == "en"
    finally:
        context.close()


def test_terms_are_mandatory_on_first_run(browser, local_server):
    context, page = _fresh_page(browser, local_server)
    try:
        page.locator("[data-splash-lang='en']").click()
        terms = page.locator("#dialog-terms")
        terms.wait_for(state="visible")
        assert "first-run" in (terms.get_attribute("class") or "")

        # Mandatory: the ✕ dismiss is hidden and Escape does not close it.
        assert page.locator("#dialog-terms .modal-close-btn").is_hidden()

        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert terms.get_attribute("open") is not None, (
            "Escape must not dismiss the first-run terms"
        )

        # Not accepted until the trainer agrees.
        assert (
            page.evaluate("() => localStorage.getItem('librept_terms_accepted')")
            is None
        )
    finally:
        context.close()


def test_agree_persists_and_survives_reload(browser, local_server):
    context, page = _fresh_page(browser, local_server)
    try:
        page.locator("[data-splash-lang='en']").click()
        page.locator("#btn-terms-agree").click()

        terms = page.locator("#dialog-terms")
        assert terms.get_attribute("open") is None
        assert "first-run" not in (terms.get_attribute("class") or "")
        assert (
            page.evaluate("() => localStorage.getItem('librept_terms_accepted')") == "1"
        )

        # A returning load does not ask again: the next step it stops at is the theme.
        page.reload()
        page.locator("#app-splash-theme").wait_for(state="visible")
        assert page.locator("#dialog-terms").get_attribute("open") is None
    finally:
        context.close()


def test_accepted_trainer_never_sees_terms(browser, local_server):
    context, page = _fresh_page(browser, local_server, accepted=True)
    try:
        page.locator("[data-splash-lang='en']").click()
        page.locator("#app-splash-theme").wait_for(state="visible")
        assert page.locator("#dialog-terms").get_attribute("open") is None
    finally:
        context.close()


def test_the_details_step_shows_its_button_on_the_smallest_phone(browser, local_server):
    """320x680 is the smallest screen the app supports, and the trainer's details are the one step
    nobody can skip. The save button used to start 4 px above the bottom edge of that screen, with
    only its top border line visible: the page itself does not scroll, the splash does, so the button
    was reachable but the screen looked finished without it."""
    context = browser.new_context(viewport={"width": 320, "height": 680})
    page = context.new_page()
    try:
        page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
        page.goto(local_server)
        page.locator("#app-splash-language").wait_for(state="visible")
        page.locator("[data-splash-lang='sl']").click()
        page.locator("#btn-terms-agree").click()
        page.locator("#app-splash-theme").wait_for(state="visible")
        page.locator("[data-splash-theme='midnight']").click()
        page.locator("#splash-theme-continue").click()
        page.locator("#app-splash-details").wait_for(state="visible")

        fit = page.evaluate(
            """() => {
                const save = document.getElementById('splash-trainer-save');
                const box = save.getBoundingClientRect();
                return { bottom: Math.round(box.bottom), viewport: window.innerHeight };
            }"""
        )
        assert fit["bottom"] <= fit["viewport"], (
            f"the save button ends {fit['bottom'] - fit['viewport']}px below a "
            f"{fit['viewport']}px screen"
        )
    finally:
        context.close()
