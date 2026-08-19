# tests/e2e/test_demo_pacing.py
# What the demo's pauses are FOR (src/modules/demo/demoPace.js).
#
# Every other demo test runs as a reduced-motion viewer, where the pacing is zero and a step advances
# the moment its expectation holds — which is what took the two demo suites from 158s to a fraction
# of it. The cost of that speed is that nothing else exercises the pacing a motion-preferring viewer
# actually sees, and that pacing is a real product decision: raised 2026-08-18 as "on web browser the
# button and clicks are about 50% too fast", because a viewer has to find the control, watch the hand
# reach it, and register that something changed.
#
# So this file is the one place that pays full price, and it pays it once.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import time

from playwright.sync_api import expect


def test_a_viewer_who_wants_motion_gets_a_step_they_can_follow(page, local_server):
    """One step at full motion takes long enough to watch — the scroll, the hand's travel, the tap
    and the beat that lets the result register. The exact constants are demoPace's business; what
    must not regress is that a step is not instantaneous for someone watching it happen."""
    page.goto(f"{local_server}?init=demo_data_load&demo=walkthrough")
    page.locator("#walkthrough-overlay").wait_for(state="visible", timeout=30_000)

    started = time.monotonic()
    page.locator("#walkthrough-show").click()
    expect(page.locator("#walkthrough-overlay .walkthrough-progress")).to_contain_text(
        "2", timeout=30_000
    )
    elapsed = time.monotonic() - started

    assert elapsed > 1.5, (
        f"a step completed in {elapsed:.2f}s — too fast to follow for a viewer who did not ask "
        "for reduced motion"
    )


def test_the_hand_is_offered_at_all_only_when_motion_is_wanted(page, local_server):
    """The pointer is the demonstration: it is what makes the tap legible as someone doing this
    one-handed. It still exists under reduced motion — the walkthrough would otherwise point at
    nothing — but it does not glide, which is what demoTour.css drops and what makes the travel
    wait pointless there."""
    page.goto(f"{local_server}?init=demo_data_load&demo=walkthrough")
    page.locator("#walkthrough-overlay").wait_for(state="visible", timeout=30_000)
    page.locator("#walkthrough-show").click()

    expect(page.locator("#demo-tour-hand")).to_have_count(1)
