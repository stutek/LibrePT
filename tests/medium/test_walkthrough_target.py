# tests/medium/test_walkthrough_target.py
# The walkthrough must point at a control the trainer can actually SEE (TODO §28.13).
#
# Every view lives in the DOM at once — the router activates one and leaves the rest in place — so a
# selector as ordinary as `.session-card` matches cards in views nobody is looking at. Reported after
# a reload during the guided walkthrough put the spotlight on an element belonging to a different
# view: `guidedDemoUrl()` keeps whatever route was open, so the step resolved against a page it was
# never written for.
#
# Medium rather than unit_js: `resolveTarget` is pure logic over a DOM, and Node has no DOM. Medium
# rather than e2e: it needs no router, no store and no boot — two sections and a query.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

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
    <div class="session-card">Group Strength &amp; Conditioning<button class="btn-edit-session"></button></div>
    <div class="session-card">Tuesday &amp; Thursday Strength<button class="btn-edit-session"></button></div>
    <button class="only-here">Solo</button>
  </section>
`;
document.body.appendChild(stage);

window.__resolve = (step) => {
  const found = resolveTarget(document, step);
  return found ? (found.closest('.app-view')?.id ?? 'no-view') : null;
};
window.__resolveCard = (step) => {
  const found = resolveTarget(document, step);
  return found ? found.closest('.session-card')?.textContent.trim() : null;
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
// Measured in the SAME synchronous block as the tap, so "at the moment of contact" is exact rather
// than a race against a wait_for_timeout.
window.__tapAndMeasureRings = () => {
  pulseDemoHand(hand);
  return [...document.querySelectorAll('.demo-tour-ripple')].map((ring) => ({
    width: ring.getBoundingClientRect().width,
    opacity: Number(getComputedStyle(ring).opacity),
  }));
};
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

    # Measured against the point the pointer was SENT to (120, 200 in the stub), which is what the
    # ring is supposed to mark — the contact point. Comparing it against the hand's bounding box
    # instead let a 10px error hide, because the box's corner is not where the finger is: the drawn
    # fingertip sits inside it (reported 2026-08-18: "not centered around index finger").
    box = ripple.bounding_box()
    centre_x, centre_y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    assert abs(centre_x - 120) < 5, f"ring centred at x={centre_x}, finger touched 120"
    assert abs(centre_y - 200) < 5, f"ring centred at y={centre_y}, finger touched 200"


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


def test_the_waiting_rings_are_not_painted_at_full_size_first(page, local_server):
    """Found 2026-08-27 while fixing the mark's timing: the rings behind the first are sent on a
    delay, and a `forwards`-only fill leaves them in their UNANIMATED state until their turn — drawn
    at the full 26px right at the contact point, then snapping back to 0.35 to begin expanding. Three
    rings appear at once as a hard blob, and only then does anything ripple.

    Each ring must begin where its own animation begins: small, and no brighter than its place in
    the group.
    """
    load_with_stub(page, local_server, RIPPLE_STUB)
    page.wait_for_selector("#demo-tour-hand")
    page.wait_for_timeout(600)

    rings = page.evaluate("() => window.__tapAndMeasureRings()")

    assert len(rings) >= 2
    for index, ring in enumerate(rings):
        assert ring["width"] < 20, (
            f"ring {index + 1} is {ring['width']}px wide at the moment of contact — it is waiting "
            "its turn at full size instead of at the start of its own expansion"
        )
    # And the group fades back to front, which is what keeps it from reading as a target reticle.
    assert rings[-1]["opacity"] < rings[0]["opacity"], (
        f"every ring goes out at the same brightness ({rings[0]['opacity']})"
    )


def test_the_waves_take_the_theme_colour(page, local_server):
    """Wanted 2026-08-18: rings coloured by the selected scheme. White read as a screenshot artefact
    on a pale theme and as glare on a dark one; the app's own accent says LibrePT is doing this."""
    load_with_stub(page, local_server, RIPPLE_STUB)
    page.wait_for_selector("#demo-tour-hand")
    page.wait_for_timeout(600)
    page.evaluate("() => window.__tap()")

    colors = page.evaluate(
        """() => {
            const probe = document.createElement('span');
            probe.style.color = 'var(--primary)';
            document.body.appendChild(probe);
            const primary = getComputedStyle(probe).color;
            probe.remove();
            const ring = document.querySelector('.demo-tour-ripple');
            return { border: getComputedStyle(ring).borderTopColor, primary };
        }"""
    )

    assert colors["border"] == colors["primary"], (
        f"ring is {colors['border']}, theme accent is {colors['primary']}"
    )


# The rings and the real click are ONE gesture, and the click is what can replace the whole screen.
# So the order between them is a product property, not an implementation detail — measured here in
# the player's own injected clock rather than against the wall, which makes it exact instead of
# flaky: `wait` is the only thing the player ever sleeps on, so summing what it was asked for IS the
# demo's timeline.
LEAD_STUB = """
import { performStep } from './modules/demo/demoTourPlayer.js';
import { mountDemoHand } from './modules/demo/demoHand.js';
import { RIPPLE_RING_MS } from './modules/demo/demoPace.js';

const hand = mountDemoHand();
const control = document.createElement('button');
control.id = 'the-control';
control.textContent = 'Tap me';
// What every real target does and what makes the bug visible: the tap changes what is on screen.
control.addEventListener('click', () => { control.textContent = 'done'; });
document.body.appendChild(control);

window.__timeGesture = async () => {
  const marks = { ringMs: RIPPLE_RING_MS };
  let clock = 0;
  control.addEventListener('click', () => { marks.clickAt = clock; });
  const wait = (ms) => {
    if (marks.ringsAt === undefined && document.querySelector('.demo-tour-ripple')) {
      marks.ringsAt = clock;
    }
    clock += ms;
    return Promise.resolve();
  };
  const outcome = await performStep(
    { id: 'lead', target: '#the-control', expect: { selector: '#the-control', containsText: 'done' } },
    { doc: document, hand, wait },
  );
  return { ...marks, ok: outcome.ok };
};
"""


def test_the_rings_are_drawn_and_played_before_the_tap_reaches_the_app(
    page, local_server
):
    """Reported 2026-08-27: "the ripple is sometimes too late — the application already loads the new
    view when the effect fires".

    The click is what changes the view, so the mark has to be spent before it: by the time the app is
    told anything, a full ring has already expanded over the control being tapped. What crosses the
    view change is the tail of a ring past its peak, which reads as the echo of the tap that left —
    not as a fresh tap on the screen that arrived.
    """
    load_with_stub(page, local_server, LEAD_STUB)
    page.wait_for_selector("#the-control")

    marks = page.evaluate("() => window.__timeGesture()")

    assert marks["ok"], "the step itself must pass, or the timings mean nothing"
    assert marks.get("ringsAt") is not None, (
        "the rings were never drawn before the click"
    )
    lead = marks["clickAt"] - marks["ringsAt"]
    assert lead >= marks["ringMs"], (
        f"the app was tapped {lead}ms after the rings appeared, and a ring lasts "
        f"{marks['ringMs']}ms — the rest of it plays over whatever the tap opened"
    )


# A control that EXISTS and a claim that never comes true — a demonstration that runs and fails,
# rather than one that cannot start. Pointing the step at nothing was the earlier version and is now
# a different case entirely: since 2026-08-26 a step whose control is not on screen is the trainer
# having wandered off, and the panel swaps itself for the two-button card (TODO §38.5). That card is
# the answer to "never leave a dead-looking guide" for THAT case; this stub keeps the other one.
BROKEN_TOUR_STUB = """
import { startGuidedWalkthrough } from './modules/demo/walkthroughOverlay.js';

const stage = document.createElement('div');
stage.className = 'app-view active';
stage.innerHTML = '<button id="a-real-button" style="height: 44px">Tap me</button>';
document.body.appendChild(stage);

window.__walkthrough = startGuidedWalkthrough({
  pollMs: 60,
  tour: {
    id: 'broken',
    steps: [
      {
        id: 'nowhere',
        target: '#a-real-button',
        caption: 'walkthrough_progress',
        expect: { selector: '#nor-does-this', visible: true },
      },
    ],
  },
});
"""


def test_a_failed_show_me_does_not_leave_the_panel_stuck_busy(page, local_server):
    """The panel disables Next and Show me while a demonstration is in flight, and re-enables them
    when it finishes. If a demonstration could end without finishing — a throw on the way — both
    would stay greyed with nothing on screen explaining why, which is indistinguishable from a dead
    guide. Driven with a step pointing at a control that does not exist, the closest reachable
    version of "the demonstration did not complete".
    """
    load_with_stub(page, local_server, BROKEN_TOUR_STUB)
    page.wait_for_selector("#walkthrough-overlay")

    page.locator("#walkthrough-show").click()

    # Waited FOR rather than waited OUT: a fixed sleep here fails on a loaded machine and passes on
    # a quiet one, which says nothing about the promise. Both of these are what the trainer sees.
    expect(page.locator(".walkthrough-problem")).to_be_visible(timeout=15_000)
    expect(page.locator("#walkthrough-show")).to_be_enabled(timeout=15_000)


def test_an_icon_button_is_named_by_the_card_it_sits_on(page, local_server):
    """An icon button carries no text of its own, so a step can only ever have named it by position —
    which is exactly what broke the first gym-floor tour. `targetWithin` says what a person says:
    the edit button on the card called this."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-visible-one")

    resolved = page.evaluate(
        """() => window.__resolveCard({
          targetWithin: '.session-card',
          targetText: 'Tuesday & Thursday',
          target: '.btn-edit-session',
        })"""
    )
    assert resolved.startswith("Tuesday & Thursday")


def test_a_card_that_is_not_on_screen_is_not_searched_inside(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-visible-one")

    assert (
        page.evaluate(
            """() => window.__resolveCard({
              targetWithin: '.session-card',
              targetText: 'no such session',
              target: '.btn-edit-session',
            })"""
        )
        is None
    )
