# tests/e2e/test_splash_screen.py
# The cold-start splash (src/modules/splash/): it must cover the app from first paint, hold for its
# minimum, then get out of the way completely. Full e2e rather than tests/medium/ because the thing
# under test IS the real boot — the splash is dismissed by the last step of app.js's init(), so a
# stubbed app.js would have nothing to prove.
#
# Every test here is marked `keep_splash`, which opts it out of conftest's dismiss_splash wrapper —
# that wrapper clicks the dismiss X after every navigation in the rest of the suite, which is
# exactly what these must not have done for them.

import time

import pytest


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_splash_shows_the_mark_wordmark_and_tagline(page, local_server):
    """What the splash actually presents.

    Deliberately asserted on an EMPTY database: the onboarding offer then holds the splash open
    until a choice is made, so these checks cannot race the fade. Asserting them mid-hold instead
    was flaky — on a loaded box the 4s could elapse between `wait_for(visible)` and the next line,
    and the suite duly caught it doing exactly that."""
    page.goto(local_server)

    splash = page.locator("#app-splash")
    splash.wait_for(state="visible", timeout=15000)
    page.locator("#app-splash-onboarding").wait_for(state="visible", timeout=15000)

    assert splash.locator(".app-splash-mark").is_visible()
    assert "LibrePT" in splash.locator(".app-splash-name").inner_text()
    assert splash.locator(".app-splash-tagline").inner_text().strip()


@pytest.mark.keep_splash
def test_splash_leaves_completely_once_there_is_data(page, local_server):
    """With data there is nothing to onboard, so it fades — and must leave the layout entirely, or
    a full-screen overlay would go on swallowing taps."""
    page.goto(local_server)

    splash = page.locator("#app-splash")
    splash.wait_for(state="hidden", timeout=20000)
    assert splash.get_attribute("hidden") is not None


@pytest.mark.keep_splash
def test_splash_holds_for_its_minimum_even_though_boot_is_faster(page, local_server):
    """The hold is max(minimum, boot time). Boot is well under a second locally, so without the
    minimum the splash would be gone almost immediately — this pins that it is not."""
    started = time.monotonic()
    page.goto(local_server)
    page.locator("#app-splash").wait_for(state="hidden", timeout=15000)
    held_for = time.monotonic() - started

    # Against 4000ms, with room for the fade and for a page.goto that resolves after first paint.
    assert held_for > 3.0, f"splash was dismissed after only {held_for:.2f}s"


# `?splash=off` is NOT exercised here. Measuring "it was fast" by wall clock around a real page
# load asserts on the machine as much as on the code — it failed on a box at load average 20 across
# 16 cores, for reasons having nothing to do with the splash. The rule is pure arithmetic and is
# pinned in tests/unit_js/modules/splashScreen.test.mjs instead. The rest of the suite no longer
# relies on that parameter at all: it clicks the dismiss X, the same control a user has.


@pytest.mark.keep_splash
def test_splash_uses_the_themed_background_not_a_fixed_colour(page, local_server):
    """It paints --bg-color, so a light theme gets a light splash. A hardcoded dark plate would be
    a black rectangle on daylight/blossom."""
    page.goto(local_server + "?theme=daylight")
    page.locator("#app-splash").wait_for(state="visible", timeout=5000)

    splash_background = page.evaluate(
        "() => getComputedStyle(document.getElementById('app-splash')).backgroundColor"
    )
    body_background = page.evaluate(
        "() => getComputedStyle(document.body).backgroundColor"
    )
    assert splash_background == body_background


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_splash_offers_onboarding_while_the_database_is_empty(page, local_server):
    """A trainer with nothing saved gets the entry point instead of a fade-out — and it does NOT
    time out on its own, because the choice is theirs to make."""
    page.goto(local_server)

    onboarding = page.locator("#app-splash-onboarding")
    onboarding.wait_for(state="visible", timeout=15000)
    assert page.locator("#splash-load-demo").is_visible()
    assert page.locator("#splash-start-empty").is_visible()
    # Announced but not built yet — it must not pretend to work.
    assert page.locator("#splash-walkthrough").is_disabled()

    page.wait_for_timeout(1500)
    assert onboarding.is_visible(), "the offer must wait for a choice, not expire"


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_start_with_an_empty_app_dismisses_the_splash(page, local_server):
    page.goto(local_server)
    page.locator("#splash-start-empty").click(timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=5000)


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_demo_data_choice_loads_the_dataset_and_stops_offering(page, local_server):
    """The demo button reloads through the app's own ?init=demo_data_load path. Once there is data,
    the onboarding offer is gone — that is the whole 'until something is saved' rule."""
    page.goto(local_server)
    page.locator("#splash-load-demo").click(timeout=15000)

    page.wait_for_url("**init=demo_data_load**", timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=15000)
    assert page.evaluate("() => window.stateHasData()"), "demo data should be seeded"
    assert page.locator("#app-splash-onboarding").is_hidden()


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_dismiss_x_cancels_the_hold_instead_of_waiting_it_out(page, local_server):
    """The X is live from first paint, not only after the hold — a 4s wait you cannot skip is not
    something to put in front of someone mid-session.

    Asserted without a stopwatch. On a clean start, letting the hold run to completion reveals the
    onboarding panel, which then waits indefinitely for a choice; so a splash that ends up hidden
    with the onboarding never shown is proof the click pre-empted the timer. That holds however
    slow the machine is, which a wall-clock threshold would not."""
    page.goto(local_server)

    page.locator("#splash-dismiss").click(timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=5000)
    assert page.locator("#app-splash-onboarding").is_hidden(), (
        "the hold ran to completion and revealed onboarding — the X did not cancel it"
    )


@pytest.mark.keep_splash
def test_dismissed_splash_leaves_the_app_usable(page, local_server):
    """Dismissing must remove it from the layout, not just fade it — otherwise a transparent
    full-screen overlay goes on eating every tap."""
    page.goto(local_server)
    page.locator("#splash-dismiss").click(timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=5000)

    page.locator("#app-header").wait_for(state="visible", timeout=10000)
    assert page.locator("#backup-btn").is_enabled()


@pytest.mark.keep_splash
def test_the_hold_is_paid_once_per_session_not_on_every_load(page, local_server):
    """A reload should not cost another 4s. The splash still covers the boot — it just stops adding
    to it once this tab session has already seen the full moment."""
    page.goto(local_server)
    page.locator("#app-splash").wait_for(state="hidden", timeout=20000)

    started = time.monotonic()
    page.reload()
    page.locator("#app-splash").wait_for(state="hidden", timeout=20000)
    second_load = time.monotonic() - started

    # Compared against the 4s minimum, not against a boot budget: the point is that no minimum was
    # applied at all the second time.
    assert second_load < 3.0, f"the second load still held for {second_load:.2f}s"


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_the_offer_keeps_the_x_and_does_not_auto_close(page, local_server):
    """Two rules at once: the onboarding offer never times out (there is a choice to make, and
    nothing should make it by expiry), and the X stays available throughout, so nobody is held
    there against their will."""
    page.goto(local_server)
    page.locator("#app-splash-onboarding").wait_for(state="visible", timeout=20000)

    page.wait_for_timeout(2000)
    assert page.locator("#app-splash-onboarding").is_visible(), (
        "the offer expired on a timer"
    )
    assert page.locator("#splash-dismiss").is_visible(), "the X should stay available"

    page.locator("#splash-dismiss").click()
    page.locator("#app-splash").wait_for(state="hidden", timeout=5000)


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_a_close_tapped_during_boot_is_honoured_not_lost(page, local_server):
    """The X paints before app.js has wired anything behind it. A tap in that window must be
    remembered and acted on as soon as the app is usable — delayed, never dropped.

    Driven by setting the flag theme-boot.js sets, which is the exact state a real early tap
    leaves behind; splashScreen.js is what has to honour it."""
    page.add_init_script("window.librePtSplashCloseRequested = true;")
    page.goto(local_server)

    # Clean start, so running to the end of the hold would reveal the offer and wait indefinitely.
    # Hidden, with no offer ever shown, is proof the early tap was acted on once boot finished.
    page.locator("#app-splash").wait_for(state="hidden", timeout=20000)
    assert page.locator("#app-splash-onboarding").is_hidden()
