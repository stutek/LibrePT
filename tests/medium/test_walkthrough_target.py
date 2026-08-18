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
