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

import time

import pytest
from playwright.sync_api import Error as PlaywrightError

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


def _seeded_state(page, timeout_s=15):
    """The stored language, names and places, read in ONE call once the seed is in memory.

    One call, retried: a first visit may reload the page once, and a second call after a separate
    wait can land on the new page before it has loaded anything (seen: an empty state read right
    after a wait that had seen eight clients). A call cut off by that reload is simply tried again."""
    deadline = time.monotonic() + timeout_s
    while True:
        try:
            seeded = page.evaluate(
                """async () => {
                    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
                    const state = store.getState();
                    if (!state.clients.length) return null;
                    return {
                        lang: state.lang,
                        clients: state.clients.map((client) => client.name),
                        exercises: state.exercises.map((exercise) => exercise.name),
                        places: [...new Set(state.sessions.map((session) => session.location))],
                    };
                }"""
            )
        except PlaywrightError:
            seeded = None
        if seeded or time.monotonic() > deadline:
            assert seeded, "the sandbox was not seeded"
            return seeded
        page.wait_for_timeout(200)


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


def test_the_flyer_link_fills_the_sandbox_in_slovenian(fresh, local_server):
    """The sandbox is seeded on first entry, at boot, from the link's language — not from
    `?init=`, which the rest of the suite seeds through. So this follows the flyer's exact link
    and reads what was written: Slovenian words, and names that need no translation."""
    fresh.goto(local_server + "?lang=sl&workspace=sandbox&demo=walkthrough&theme=daylight")
    seeded = _seeded_state(fresh)
    assert seeded["lang"] == "sl", seeded
    assert {"Eva", "Tom", "Nina"} <= set(seeded["clients"]), seeded["clients"]
    assert "Poteg zgornjega škripca" in seeded["exercises"]
    assert "Lat Pulldown" not in seeded["exercises"]
    assert "Fitnes Trib" in seeded["places"], seeded["places"]


def test_a_first_start_without_a_sandbox_link_still_asks_for_the_details(
    fresh, local_server
):
    fresh.goto(local_server + "?lang=sl")
    _agree_and_choose_a_theme(fresh)

    fresh.locator("#app-splash-details").wait_for(state="visible", timeout=15_000)
