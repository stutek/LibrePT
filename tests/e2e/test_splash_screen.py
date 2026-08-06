# tests/e2e/test_splash_screen.py
# The cold-start splash (src/modules/splash/): it must cover the app from first paint, hold for its
# minimum, then get out of the way completely. Full e2e rather than tests/medium/ because the thing
# under test IS the real boot — the splash is dismissed by the last step of app.js's init(), so a
# stubbed app.js would have nothing to prove.
#
# These navigate with an explicit `splash=` so conftest's skip_splash_hold wrapper leaves the URL
# alone (it only appends when the parameter is absent).

import time

import pytest


@pytest.mark.clean_start
def test_splash_shows_the_mark_wordmark_and_tagline(page, local_server):
    """What the splash actually presents.

    Deliberately asserted on an EMPTY database: the onboarding offer then holds the splash open
    until a choice is made, so these checks cannot race the fade. Asserting them mid-hold instead
    was flaky — on a loaded box the 4s could elapse between `wait_for(visible)` and the next line,
    and the suite duly caught it doing exactly that."""
    page.goto(local_server + "?splash=on")

    splash = page.locator("#app-splash")
    splash.wait_for(state="visible", timeout=15000)
    page.locator("#app-splash-onboarding").wait_for(state="visible", timeout=15000)

    assert splash.locator(".app-splash-mark").is_visible()
    assert "LibrePT" in splash.locator(".app-splash-name").inner_text()
    assert splash.locator(".app-splash-tagline").inner_text().strip()


def test_splash_leaves_completely_once_there_is_data(page, local_server):
    """With data there is nothing to onboard, so it fades — and must leave the layout entirely, or
    a full-screen overlay would go on swallowing taps."""
    page.goto(local_server + "?splash=on")

    splash = page.locator("#app-splash")
    splash.wait_for(state="hidden", timeout=20000)
    assert splash.get_attribute("hidden") is not None


def test_splash_holds_for_its_minimum_even_though_boot_is_faster(page, local_server):
    """The hold is max(minimum, boot time). Boot is well under a second locally, so without the
    minimum the splash would be gone almost immediately — this pins that it is not."""
    started = time.monotonic()
    page.goto(local_server + "?splash=on")
    page.locator("#app-splash").wait_for(state="hidden", timeout=15000)
    held_for = time.monotonic() - started

    # Against 4000ms, with room for the fade and for a page.goto that resolves after first paint.
    assert held_for > 3.0, f"splash was dismissed after only {held_for:.2f}s"


# `?splash=off` skipping the hold is NOT tested here. Measuring "it was fast" by wall clock around
# a real page load asserts on the machine as much as on the code — it failed on a box at load
# average 20 across 16 cores, for reasons having nothing to do with the splash. The rule itself is
# pure arithmetic and is pinned in tests/unit_js/modules/splashScreen.test.mjs instead.


def test_splash_uses_the_themed_background_not_a_fixed_colour(page, local_server):
    """It paints --bg-color, so a light theme gets a light splash. A hardcoded dark plate would be
    a black rectangle on daylight/blossom."""
    page.goto(local_server + "?theme=daylight&splash=on")
    page.locator("#app-splash").wait_for(state="visible", timeout=5000)

    splash_background = page.evaluate(
        "() => getComputedStyle(document.getElementById('app-splash')).backgroundColor"
    )
    body_background = page.evaluate(
        "() => getComputedStyle(document.body).backgroundColor"
    )
    assert splash_background == body_background


@pytest.mark.clean_start
def test_splash_offers_onboarding_while_the_database_is_empty(page, local_server):
    """A trainer with nothing saved gets the entry point instead of a fade-out — and it does NOT
    time out on its own, because the choice is theirs to make."""
    page.goto(local_server + "?splash=on")

    onboarding = page.locator("#app-splash-onboarding")
    onboarding.wait_for(state="visible", timeout=15000)
    assert page.locator("#splash-load-demo").is_visible()
    assert page.locator("#splash-start-empty").is_visible()
    # Announced but not built yet — it must not pretend to work.
    assert page.locator("#splash-walkthrough").is_disabled()

    page.wait_for_timeout(1500)
    assert onboarding.is_visible(), "the offer must wait for a choice, not expire"


@pytest.mark.clean_start
def test_start_with_an_empty_app_dismisses_the_splash(page, local_server):
    page.goto(local_server + "?splash=on")
    page.locator("#splash-start-empty").click(timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=5000)


@pytest.mark.clean_start
def test_demo_data_choice_loads_the_dataset_and_stops_offering(page, local_server):
    """The demo button reloads through the app's own ?init=demo_data_load path. Once there is data,
    the onboarding offer is gone — that is the whole 'until something is saved' rule."""
    page.goto(local_server + "?splash=on")
    page.locator("#splash-load-demo").click(timeout=15000)

    page.wait_for_url("**init=demo_data_load**", timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=15000)
    assert page.evaluate("() => window.stateHasData()"), "demo data should be seeded"
    assert page.locator("#app-splash-onboarding").is_hidden()
