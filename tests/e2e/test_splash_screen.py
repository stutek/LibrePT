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

# Mirrors DEFAULT_MINIMUM_VISIBLE_MS in src/modules/splash/splashScreen.js. Kept as seconds because
# every stopwatch here is a time.monotonic() delta.
SPLASH_MINIMUM_HOLD_S = 5.0


def _answer_language_step(page, code="en"):
    """Clear the language step, which precedes everything else on a clean start.

    Tests below that are about the onboarding offer or the X have to get past it first — it is a
    genuine gate, not incidental setup, and pretending otherwise would just make them assert on
    the language screen by accident."""
    page.locator("#app-splash-language").wait_for(state="visible", timeout=20000)
    page.locator(f"[data-splash-lang='{code}']").click()
    page.locator("#app-splash-language").wait_for(state="hidden", timeout=5000)


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_splash_shows_the_mark_wordmark_and_tagline(page, local_server):
    """What the splash actually presents.

    Deliberately asserted on an EMPTY database: the onboarding offer then holds the splash open
    until a choice is made, so these checks cannot race the fade. Asserting them mid-hold instead
    was flaky — on a loaded box the 5s could elapse between `wait_for(visible)` and the next line,
    and the suite duly caught it doing exactly that."""
    page.goto(local_server)
    _answer_language_step(page)

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

    # Against 5000ms, with room for the fade and for a page.goto that resolves after first paint.
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
    _answer_language_step(page)

    onboarding = page.locator("#app-splash-onboarding")
    onboarding.wait_for(state="visible", timeout=15000)
    assert page.locator("#splash-load-demo").is_visible()
    assert page.locator("#splash-start-empty").is_visible()
    # Built since 2026-08-17 (TODO §9.5). It was the last control in the app announcing something
    # that did not exist, so "enabled" is the assertion that promise is now kept.
    assert page.locator("#splash-walkthrough").is_enabled()

    page.wait_for_timeout(1500)
    assert onboarding.is_visible(), "the offer must wait for a choice, not expire"


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_start_with_an_empty_app_dismisses_the_splash(page, local_server):
    page.goto(local_server)
    _answer_language_step(page)
    page.locator("#splash-start-empty").click(timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=5000)


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_demo_data_choice_loads_the_dataset_and_stops_offering(page, local_server):
    """The demo button reloads through the app's own ?init=demo_data_load path. Once there is data,
    the onboarding offer is gone — that is the whole 'until something is saved' rule."""
    page.goto(local_server)
    _answer_language_step(page)
    page.locator("#splash-load-demo").click(timeout=15000)

    page.wait_for_url("**init=demo_data_load**", timeout=15000)
    page.locator("#app-splash").wait_for(state="hidden", timeout=15000)
    assert page.evaluate("() => window.stateHasData()"), "demo data should be seeded"
    assert page.locator("#app-splash-onboarding").is_hidden()


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_walkthrough_choice_arrives_with_data_to_walk_through(page, local_server):
    """The walkthrough drives the seeded group session, so its entry point has to bring the dataset
    with it. A walkthrough started on the empty app a first-run trainer is looking at would be a
    panel pointing at nothing — which is why this button reloads through ?init=demo_data_load too,
    rather than only setting ?demo=."""
    page.goto(local_server)
    _answer_language_step(page)
    page.locator("#splash-walkthrough").click(timeout=15000)

    page.wait_for_url("**init=demo_data_load**", timeout=15000)
    assert "demo=walkthrough" in page.url
    page.locator("#walkthrough-overlay").wait_for(state="visible", timeout=20000)


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_dismiss_x_cancels_the_hold_instead_of_waiting_it_out(page, local_server):
    """The X is live from first paint, not only after the hold — a 5s wait you cannot skip is not
    something to put in front of someone mid-session.

    Asserted without a stopwatch. On a clean start, letting the hold run to completion reveals the
    onboarding panel, which then waits indefinitely for a choice; so a splash that ends up hidden
    with the onboarding never shown is proof the click pre-empted the timer. That holds however
    slow the machine is, which a wall-clock threshold would not."""
    page.goto(local_server)
    _answer_language_step(page)

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
    """A reload should not cost another 5s. The splash still covers the boot — it just stops adding
    to it once this tab session has already seen the full moment."""
    page.goto(local_server)
    page.locator("#app-splash").wait_for(state="hidden", timeout=20000)

    started = time.monotonic()
    page.reload()
    page.locator("#app-splash").wait_for(state="hidden", timeout=20000)
    second_load = time.monotonic() - started

    # Compared against the MINIMUM itself, not a boot budget. A second load that finishes inside
    # the minimum proves the minimum was not applied — which is the whole claim — while any tighter
    # number starts asserting on how fast the box booted the app. It was tighter (3.0s), and duly
    # failed at 3.13s on a 16-core machine sitting at load average 18, for reasons having nothing
    # to do with the splash. Same trap the note above `?splash=off` describes; the arithmetic that
    # a held session asks for zero hold is pinned exactly in
    # tests/unit_js/modules/splashScreen.test.mjs.
    assert second_load < SPLASH_MINIMUM_HOLD_S, (
        f"the second load still held for {second_load:.2f}s, "
        f"which is the full {SPLASH_MINIMUM_HOLD_S}s minimum being re-applied"
    )


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_the_offer_keeps_the_x_and_does_not_auto_close(page, local_server):
    """Two rules at once: the onboarding offer never times out (there is a choice to make, and
    nothing should make it by expiry), and the X stays available throughout, so nobody is held
    there against their will."""
    page.goto(local_server)
    _answer_language_step(page)
    page.locator("#app-splash-onboarding").wait_for(state="visible", timeout=20000)

    page.wait_for_timeout(2000)
    assert page.locator("#app-splash-onboarding").is_visible(), (
        "the offer expired on a timer"
    )
    assert page.locator("#splash-dismiss").is_visible(), "the X should stay available"

    page.locator("#splash-dismiss").click()
    page.locator("#app-splash").wait_for(state="hidden", timeout=5000)


@pytest.mark.keep_splash
def test_a_close_tapped_during_boot_is_honoured_not_lost(page, local_server):
    """The X paints before app.js has wired anything behind it. A tap in that window must be
    remembered and acted on as soon as the app is usable — delayed, never dropped.

    Driven by setting the flag theme-boot.js sets, which is the exact state a real early tap
    leaves behind; splashScreen.js is what has to honour it. Seeded data, so the splash would
    otherwise sit through its full hold."""
    page.add_init_script("window.librePtSplashCloseRequested = true;")
    page.goto(local_server)
    page.locator("#app-splash").wait_for(state="hidden", timeout=20000)


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_an_early_close_tap_cannot_skip_the_language_step(page, local_server):
    """The language step has no X because there is nothing to dismiss to. An early tap landing
    where the X will later be must not become a back door around it, or the app comes up in a
    language nobody picked."""
    page.add_init_script("window.librePtSplashCloseRequested = true;")
    page.goto(local_server)

    page.locator("#app-splash-language").wait_for(state="visible", timeout=20000)
    page.wait_for_timeout(1000)
    assert page.locator("#app-splash-language").is_visible(), (
        "the early tap skipped the gate"
    )


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_language_is_asked_first_and_has_no_way_out(page, local_server):
    """The language step comes before everything — before the hold, before onboarding — and is the
    one screen with no exit. Every other word the app could show is in a language nobody has
    chosen, so there is nothing useful to dismiss to."""
    page.goto(local_server)

    language = page.locator("#app-splash-language")
    language.wait_for(state="visible", timeout=20000)
    assert page.locator("#splash-dismiss").is_hidden(), (
        "the language step must have no X"
    )
    assert page.locator("#app-splash-onboarding").is_hidden(), (
        "language comes before onboarding"
    )

    # Labels are each in their own language, never translated — legible to someone who cannot read
    # whichever one the app happens to be rendering in.
    assert page.locator("[data-splash-lang='en']").inner_text().strip() == "English"
    assert page.locator("[data-splash-lang='sl']").inner_text().strip() == "Slovenščina"


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_choosing_a_language_applies_it_and_moves_on(page, local_server):
    """Picking Slovenian translates the app and hands over to the next step, with the X back."""
    page.goto(local_server)
    page.locator("#app-splash-language").wait_for(state="visible", timeout=20000)
    page.locator("[data-splash-lang='sl']").click()

    assert page.evaluate("() => window.__libreptState?.lang ?? null") in (None, "sl")
    page.locator("#app-splash-onboarding").wait_for(state="visible", timeout=20000)
    assert page.locator("#splash-dismiss").is_visible(), (
        "the X returns once a language is chosen"
    )


@pytest.mark.keep_splash
def test_a_chosen_language_is_never_asked_for_again(page, local_server):
    """Seeded data comes with a language already set, so the step must not appear at all."""
    page.goto(local_server)
    page.locator("#app-splash").wait_for(state="hidden", timeout=20000)
    assert page.locator("#app-splash-language").is_hidden()
