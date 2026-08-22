# tests/e2e/test_first_run_deeplink.py
# What a demo link does on a browser whose data was just cleared (reported 2026-08-21: "when I
# delete browser data and use a deep link, I get neither the language choice nor the demo").
#
# Two separate causes, both invisible to every other test in this suite because the shared `page`
# fixture auto-accepts the terms and auto-dismisses the splash:
#
#   1. Seeding the demo used to stamp `lang = "en"` on a store that had never chosen one, so the
#      splash's language question saw an answer nobody gave and skipped itself.
#   2. The demo started as soon as the app was wired — which on a first run is BEHIND the mandatory
#      terms modal. It played itself out, all sixteen beats, while the trainer was still reading the
#      agreement; by the time they tapped "I agree" there was nothing left to watch.
#
# These build their own browser context for that reason: the conftest fixtures would hide both.
# Fixtures (local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.conftest import NAVIGATION_TIMEOUT_MS


@pytest.fixture
def fresh(browser, local_server):
    """A browser that has never seen this app: no stored terms acceptance, no language, no data."""
    context = browser.new_context(reduced_motion="reduce")
    page = context.new_page()
    page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)
    yield page
    context.close()


def test_a_demo_link_still_asks_which_language_to_speak(fresh, local_server):
    """The link answers what it NAMES. `?init=` says load the demo; it says nothing about language,
    and a narrated demo in a language the viewer does not read is the worst version of it."""
    fresh.goto(f"{local_server}?init=demo_data_load&demo=gym_floor")

    fresh.locator("#btn-terms-agree").click()

    language = fresh.locator("#app-splash-language")
    language.wait_for(state="visible", timeout=10_000)
    assert language.locator("[data-splash-lang]").count() >= 2


def test_a_link_that_names_a_language_is_not_asked_again(fresh, local_server):
    """`?lang=sl` IS the answer — a share link naming a language must open in it."""
    fresh.goto(f"{local_server}?init=demo_data_load&lang=sl")

    fresh.locator("#btn-terms-agree").click()
    fresh.wait_for_selector("#view-clients.active", timeout=15_000)

    assert fresh.locator("#app-splash-language").is_hidden()


def test_the_demo_waits_until_someone_can_actually_watch_it(fresh, local_server):
    """The whole point of the demo is being seen. Nothing may play while a mandatory modal is on
    top of it — the trainer would agree to the terms and find the show already over."""
    fresh.goto(f"{local_server}?init=demo_data_load&demo=gym_floor")
    fresh.wait_for_selector("#dialog-terms[open]", timeout=15_000)
    fresh.wait_for_timeout(3_000)

    assert fresh.evaluate("() => window.__demoTourResults") is None, (
        "the demo ran behind the terms modal, where nobody could see it"
    )

    fresh.locator("#btn-terms-agree").click()
    fresh.locator("#app-splash-language [data-splash-lang='en']").click()

    fresh.wait_for_function(
        "() => Array.isArray(window.__demoTourResults)", timeout=60_000
    )
    results = fresh.evaluate("() => window.__demoTourResults")
    assert [r["ok"] for r in results] == [True] * len(results)
