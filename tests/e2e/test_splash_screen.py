# tests/e2e/test_splash_screen.py
# The cold-start splash (src/modules/splash/): it must cover the app from first paint, hold for its
# minimum, then get out of the way completely. Full e2e rather than tests/medium/ because the thing
# under test IS the real boot — the splash is dismissed by the last step of app.js's init(), so a
# stubbed app.js would have nothing to prove.
#
# These navigate with an explicit `splash=` so conftest's skip_splash_hold wrapper leaves the URL
# alone (it only appends when the parameter is absent).

import time


def test_splash_covers_the_app_on_load_and_then_disappears(page, local_server):
    """The whole point: visible immediately, gone afterwards, and not left in the layout where it
    could swallow taps."""
    page.goto(local_server + "?splash=on")

    splash = page.locator("#app-splash")
    splash.wait_for(state="visible", timeout=5000)
    assert splash.locator(".app-splash-mark").is_visible()
    assert "LibrePT" in splash.locator(".app-splash-name").inner_text()
    assert splash.locator(".app-splash-tagline").inner_text().strip()

    splash.wait_for(state="hidden", timeout=15000)
    assert page.locator("#app-splash").get_attribute("hidden") is not None


def test_splash_holds_for_its_minimum_even_though_boot_is_faster(page, local_server):
    """The hold is max(minimum, boot time). Boot is well under a second locally, so without the
    minimum the splash would be gone almost immediately — this pins that it is not."""
    started = time.monotonic()
    page.goto(local_server + "?splash=on")
    page.locator("#app-splash").wait_for(state="hidden", timeout=15000)
    held_for = time.monotonic() - started

    # Against 4000ms, with room for the fade and for a page.goto that resolves after first paint.
    assert held_for > 3.0, f"splash was dismissed after only {held_for:.2f}s"


def test_splash_off_skips_the_hold_entirely(page, local_server):
    """`?splash=off` is a real deep-link parameter (demo links land straight on the app), and it is
    what keeps the rest of the browser suite from paying 4s per navigation."""
    started = time.monotonic()
    page.goto(local_server + "?splash=off")
    page.locator("#app-splash").wait_for(state="hidden", timeout=15000)
    assert time.monotonic() - started < 3.0


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
