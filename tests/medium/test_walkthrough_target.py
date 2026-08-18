# tests/medium/test_walkthrough_target.py
# The walkthrough must point at a control the trainer can actually SEE (TODO §28.13).
#
# Every view lives in the DOM at once — the router activates one and leaves the rest in place — so a
# selector as ordinary as `.session-card` matches cards in views nobody is looking at. Reported after
# a reload during the guided walkthrough put the spotlight on an element belonging to a different
# view: `walkthroughUrl()` keeps whatever route was open, so the step resolved against a page it was
# never written for.
#
# Medium rather than unit_js: `resolveTarget` is pure logic over a DOM, and Node has no DOM. Medium
# rather than e2e: it needs no router, no store and no boot — two sections and a query.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

STUB = """
import { resolveTarget } from './modules/demo/demoTourPlayer.js';

const stage = document.createElement('div');
stage.innerHTML = `
  <section class="app-view" id="view-hidden-one">
    <div class="session-card">Group Strength &amp; Conditioning</div>
  </section>
  <section class="app-view active" id="view-visible-one">
    <div class="session-card">Group Strength &amp; Conditioning</div>
    <button class="only-here">Solo</button>
  </section>
`;
document.body.appendChild(stage);

window.__resolve = (step) => {
  const found = resolveTarget(document, step);
  return found ? (found.closest('.app-view')?.id ?? 'no-view') : null;
};
"""


def test_a_control_in_an_inactive_view_is_never_the_target(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-visible-one")

    # Both sections hold a card with this exact text, and the hidden one comes first in the DOM —
    # which is precisely the order a document query returns.
    resolved = page.evaluate(
        "() => window.__resolve({ target: '.session-card', targetText: 'Group Strength' })"
    )
    assert resolved == "view-visible-one"


def test_a_bare_selector_also_skips_what_cannot_be_seen(page, local_server):
    """The text filter is not what saves it — a step with no `targetText` takes the first match, and
    that must still be a match on screen."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-visible-one")

    assert (
        page.evaluate("() => window.__resolve({ target: '.session-card' })")
        == "view-visible-one"
    )


def test_nothing_visible_resolves_to_nothing_rather_than_to_the_wrong_thing(
    page, local_server
):
    """Failing loudly is the point: the step then reports "no control matched" and the walkthrough
    stops, instead of ringing an element in a view the trainer is not looking at."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-visible-one")

    page.evaluate(
        "() => document.getElementById('view-visible-one').classList.remove('active')"
    )
    assert page.evaluate("() => window.__resolve({ target: '.session-card' })") is None


HAND_STUB = """
import { mountDemoHand, moveDemoHand } from './modules/demo/demoHand.js';
const hand = mountDemoHand();
moveDemoHand(hand, 120, 200);
"""


def test_the_pointer_is_a_hand_with_a_pointing_finger(page, local_server):
    """TODO §28.12: "add an animated hand with extended index finger too".

    It was a white dot — a radial-gradient circle — in a module named for a hand. A dot next to a
    control reads as a bullet or a glitch; a hand reads as a person using the app, which is the
    whole reason the demo has a pointer at all.
    """
    load_with_stub(page, local_server, HAND_STUB)
    page.wait_for_selector("#demo-tour-hand")

    hand = page.locator("#demo-tour-hand")
    assert hand.locator("svg").count() == 1, "a drawn hand, not a styled div"
    # Decorative and never in the way of the tap it illustrates — both are what make it safe to
    # paint over live controls.
    assert hand.get_attribute("aria-hidden") == "true"
    assert (
        page.evaluate(
            "() => getComputedStyle(document.getElementById('demo-tour-hand')).pointerEvents"
        )
        == "none"
    )


def test_the_hand_is_taller_than_it_is_wide_because_it_is_a_hand(page, local_server):
    """A shape assertion rather than a pixel one: the old dot was square by construction, so this
    fails on any return to it while leaving the artwork free to change."""
    load_with_stub(page, local_server, HAND_STUB)
    page.wait_for_selector("#demo-tour-hand")

    box = page.locator("#demo-tour-hand").bounding_box()
    assert box["height"] > box["width"]


RIPPLE_STUB = """
import { mountDemoHand, moveDemoHand, pulseDemoHand } from './modules/demo/demoHand.js';
const hand = mountDemoHand();
moveDemoHand(hand, 120, 200);
window.__tap = () => pulseDemoHand(hand);
"""


def test_a_tap_leaves_a_visible_mark_where_it_landed(page, local_server):
    """Wanted 2026-08-18: "make some click visual effect when show me clicks".

    The hand pressing toward the screen is the gesture; a ripple is what says the press LANDED. On a
    laptop, where there is no finger to watch, the two are what separate "a control changed" from "a
    control changed because something tapped it".
    """
    load_with_stub(page, local_server, RIPPLE_STUB)
    page.wait_for_selector("#demo-tour-hand")

    assert page.locator(".demo-tour-ripple").count() == 0, "nothing to see before a tap"

    # The pointer travels to its target over 0.42s; tapping mid-flight would put the ring where the
    # hand WAS, which is correct behaviour and a meaningless thing to assert against. The real player
    # waits for the same reason (performStep's travelMs).
    page.wait_for_timeout(600)
    page.evaluate("() => window.__tap()")
    ripple = page.locator(".demo-tour-ripple").first
    assert page.locator(".demo-tour-ripple").count() >= 1

    # A tolerance, not containment: the ring is mid-animation whenever it is sampled, so its box is
    # 7px across at one instant and 58px at another. What has to be true is that the mark is on the
    # fingertip rather than on the palm or on the previous control — half a fingertip of slack says
    # exactly that, and fails on the tens-of-pixels errors that composing two transforms produced.
    box = ripple.bounding_box()
    hand_box = page.locator("#demo-tour-hand").bounding_box()
    centre_x, centre_y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    assert abs(centre_x - hand_box["x"]) < 15, (
        f"ring at x={centre_x}, fingertip at {hand_box['x']}"
    )
    assert abs(centre_y - hand_box["y"]) < 15, (
        f"ring at y={centre_y}, fingertip at {hand_box['y']}"
    )


def test_the_mark_cleans_up_after_itself(page, local_server):
    """It is a flash, not a residue: one per tap, and four steps must not leave four rings behind."""
    load_with_stub(page, local_server, RIPPLE_STUB)
    page.wait_for_selector("#demo-tour-hand")

    page.evaluate("() => window.__tap()")
    page.evaluate("() => window.__tap()")
    page.wait_for_timeout(1200)

    assert page.locator(".demo-tour-ripple").count() == 0


def test_the_fingertip_stays_put_while_the_hand_presses(page, local_server):
    """Reported 2026-08-18: "finger is also jumping after every click".

    The press animates the hand's scale, and scaling about its centre drags the fingertip toward the
    middle of the palm and back — 4px of travel at the one moment the eye is on the contact point,
    which reads as the finger hopping. A real finger presses from its tip: the contact point is the
    one part that must not move.
    """
    load_with_stub(page, local_server, RIPPLE_STUB)
    page.wait_for_selector("#demo-tour-hand")
    page.wait_for_timeout(600)

    hand = page.locator("#demo-tour-hand")
    before = hand.bounding_box()
    page.evaluate("() => window.__tap()")
    # Mid-press: the scale keyframe bottoms out at 55% of a 0.36s animation.
    page.wait_for_timeout(200)
    during = hand.bounding_box()

    assert abs(during["x"] - before["x"]) < 1.5, (
        f"fingertip moved {during['x'] - before['x']}px"
    )
    assert abs(during["y"] - before["y"]) < 1.5, (
        f"fingertip moved {during['y'] - before['y']}px"
    )


def test_a_tap_sends_more_than_one_wave_out(page, local_server):
    """Wanted 2026-08-18: waves spreading like something touching a water surface. One ring reads as
    a highlight; several, staggered and fading, read as an impact."""
    load_with_stub(page, local_server, RIPPLE_STUB)
    page.wait_for_selector("#demo-tour-hand")
    page.wait_for_timeout(600)

    page.evaluate("() => window.__tap()")

    assert page.locator(".demo-tour-ripple").count() >= 2
