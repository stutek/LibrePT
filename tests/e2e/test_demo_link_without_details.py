# tests/e2e/test_demo_link_without_details.py
# A link into the sandbox does not ask for the trainer's details; the trainer's own work does
# (ruled 2026-10-13). A student who scans the flyer's QR code reaches the guided tour after the
# terms and the theme, without typing a name, a phone number and an e-mail address. The four
# fields sign what a client receives, so they are asked the first time the trainer's OWN workspace
# is opened: at the first start without a sandbox link, or when the trainer leaves the sandbox.
#
# These build their own browser context: the shared `page` fixture stores a theme and the four
# details before every boot (tests/conftest.py), which would hide exactly what is tested here.
# Fixtures (browser, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.conftest import NAVIGATION_TIMEOUT_MS

# The flyer's link: Slovenian, the sandbox, and the guided tour.
FLYER_LINK = "?lang=sl&workspace=sandbox&demo=walkthrough"


@pytest.fixture
def fresh(browser, local_server):
    """A browser that has never seen this app: no terms, no theme, no details, no data."""
    context = browser.new_context(reduced_motion="reduce")
    page = context.new_page()
    page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
    yield page
    context.close()


def _agree_and_choose_a_theme(page):
    page.locator("#btn-terms-agree").click(timeout=15_000)
    page.locator("#app-splash-theme [data-splash-theme='daylight']").click()
    page.locator("#splash-theme-continue").click()


def _stored_identity(page):
    return page.evaluate(
        """async () => {
            const identity = await import(
                new URL('data/trainerIdentity.js', document.baseURI).href
            );
            const { firstName, lastName, phone, email } = identity.readTrainerIdentity();
            return { firstName, lastName, phone, email };
        }"""
    )


def test_the_flyer_link_reaches_the_tour_without_the_details(fresh, local_server):
    fresh.goto(local_server + FLYER_LINK)
    _agree_and_choose_a_theme(fresh)

    progress = fresh.locator("#walkthrough-overlay .walkthrough-progress")
    progress.wait_for(state="visible", timeout=30_000)
    assert progress.text_content().startswith("Korak 1 od ")
    assert fresh.locator("#app-splash-details").is_hidden()
    assert _stored_identity(fresh) == {
        "firstName": "",
        "lastName": "",
        "phone": "",
        "email": "",
    }


def test_leaving_the_sandbox_asks_for_the_details_and_offers_no_way_past(
    fresh, local_server
):
    fresh.goto(local_server + "?lang=en&workspace=sandbox")
    _agree_and_choose_a_theme(fresh)
    fresh.locator("#app-splash").wait_for(state="hidden", timeout=30_000)

    fresh.locator("#btn-app-menu").click()
    fresh.locator("#menu-sandbox-leave").click()

    dialog = fresh.locator("#dialog-trainer-details")
    dialog.wait_for(state="visible", timeout=15_000)
    assert fresh.evaluate(
        "async () => (await import(new URL('data/workspace.js', document.baseURI).href)).isSandbox()"
    ) is False, "the form is asked in the trainer's own workspace"
    # Required here, as on the welcome screen: no X, no Cancel, and Escape does not close it.
    assert dialog.locator(".modal-close-btn").is_hidden()
    assert fresh.locator("#trainer-details-cancel").is_hidden()
    fresh.keyboard.press("Escape")
    assert dialog.is_visible()

    fresh.locator("#trainer-details-firstName").fill("Ana")
    fresh.locator("#trainer-details-lastName").fill("Kovač")
    fresh.locator("#trainer-details-phone").fill("+386 40 123 456")
    fresh.locator("#trainer-details-email").fill("ana@example.com")
    fresh.locator("#trainer-details-save").click()
    dialog.wait_for(state="hidden", timeout=5_000)
    assert _stored_identity(fresh)["email"] == "ana@example.com"

    # Opened later from Settings, the same form can be closed again.
    fresh.evaluate(
        "async () => (await import(new URL('modules/common/trainerDetailsDialog.js', document.baseURI).href)).openTrainerDetailsDialog()"
    )
    dialog.wait_for(state="visible", timeout=5_000)
    assert dialog.locator(".modal-close-btn").is_visible()
    assert fresh.locator("#trainer-details-cancel").is_visible()


def test_a_first_start_without_a_sandbox_link_still_asks_for_the_details(
    fresh, local_server
):
    fresh.goto(local_server + "?lang=sl")
    _agree_and_choose_a_theme(fresh)

    fresh.locator("#app-splash-details").wait_for(state="visible", timeout=15_000)
