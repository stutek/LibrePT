# tests/medium/test_walkthrough_panel.py
# The walkthrough panel must never sit on top of the control it is asking for (TODO §28.15).
#
# The panel already knows how to move to the top of the screen when it would cover the step's target
# — a guide that hides the thing it points at is worse than no guide on a phone, where there is
# nowhere else to look. What it did not do was ask AGAIN. The check ran once per step, immediately
# after `scrollIntoView`, so it measured the layout as it was BEFORE the scroll settled; and the
# 250ms poll that keeps the spotlight on a moving target never re-ran it. Reported as steps 2 and 4
# — the two that scroll the deck — covering the button "sometimes".
#
# Geometry over the real overlay, like tests/e2e/test_layout_overflow.py, but the walkthrough needs
# no router, no store and no boot: a tour is data, and the target is any element on the page.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

# One step, targeting a button placed far enough down the page that it starts off screen — the same
# situation the deck creates when a card scrolls into view near the bottom.
STUB = """
import { startGuidedWalkthrough } from './modules/demo/walkthroughOverlay.js';

const stage = document.createElement('div');
stage.className = 'app-view active';
stage.innerHTML = `
  <div style="height: 1600px"></div>
  <button id="the-target" style="height: 44px; width: 220px">Tap me</button>
  <div style="height: 1600px"></div>
`;
document.body.appendChild(stage);

const TOUR = {
  id: 'panel-test',
  steps: [
    {
      id: 'reach-the-button',
      target: '#the-target',
      caption: 'walkthrough_progress',
      expect: { selector: '#never-happens', visible: true },
    },
  ],
};

window.__walkthrough = startGuidedWalkthrough({ tour: TOUR, pollMs: 60 });
"""

OVERLAP = """() => {
  const panel = document.querySelector('.walkthrough-panel').getBoundingClientRect();
  const target = document.getElementById('the-target').getBoundingClientRect();
  const overlapX = Math.min(panel.right, target.right) - Math.max(panel.left, target.left);
  const overlapY = Math.min(panel.bottom, target.bottom) - Math.max(panel.top, target.top);
  return { overlap: overlapX > 0 && overlapY > 0, panel: panel.top, target: target.top };
}"""


def _start(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector(".walkthrough-panel")
    # enterStep scrolls the target into view; let the scroll and the panel's own transition settle.
    page.wait_for_timeout(600)


def test_the_panel_does_not_cover_the_control_it_asks_for(page, local_server):
    _start(page, local_server)

    assert page.evaluate(OVERLAP)["overlap"] is False


def test_the_panel_gets_out_of_the_way_again_after_the_page_scrolls(page, local_server):
    """The reported case. A trainer scrolls — the deck is its own scroll container and steps 2 and 4
    both move it — and the control slides under a panel that decided where to sit before the step
    began."""
    _start(page, local_server)

    # Put the target exactly where the panel lives: pinned to the bottom of the viewport.
    page.evaluate(
        """() => {
            const target = document.getElementById('the-target');
            const box = target.getBoundingClientRect();
            window.scrollBy(0, box.top - (window.innerHeight - box.height - 8));
        }"""
    )
    # Longer than the 60ms poll this stub asks for, plus the panel's own move.
    page.wait_for_timeout(600)

    state = page.evaluate(OVERLAP)
    assert state["overlap"] is False, (
        f"panel at y={state['panel']} covers the target at y={state['target']}"
    )


# The same promise, with the story's own card in the panel — which is what makes the panel tall
# enough to have nowhere to go. A chapter's opening card rides on the first real step, so the panel
# carries a paragraph AND an instruction, and on a phone that was over half the screen: docked at the
# bottom it covered a control in the middle, and flipping to the top covered it too (TODO §38.15,
# measured on iPhone 14 and iPhone SE at story steps 23 and 30).
CARD_STUB = """
import { startGuidedWalkthrough } from './modules/demo/walkthroughOverlay.js';
import { mountDemoNarrator } from './modules/demo/demoNarratorCard.js';

const PROSE = ('Sunday, two days out, on the sofa. Her file has landed and her first session is '
  + 'still to come; Tuesday belongs to the three who have trained with you for a while. ').repeat(4);
const words = (key) => (key === 'body' ? PROSE : key === 'title' ? 'The programme' : key);

const stage = document.createElement('div');
stage.className = 'app-view active';
// A session card on a board that scrolls, which is what the real target is. Placed so that it lands
// in the middle of the screen — the one band a panel docked at either end can still reach.
stage.innerHTML = `
  <div style="height: 1200px"></div>
  <button id="the-target" style="height: 72px; width: 240px">Tuesday &amp; Thursday Strength</button>
  <div style="height: 1200px"></div>
`;
document.body.appendChild(stage);
window.__putTargetMidScreen = () => {
  const box = document.getElementById('the-target').getBoundingClientRect();
  window.scrollBy(0, box.top - (window.innerHeight * 0.48));
};

const narrator = mountDemoNarrator({ t: words });
const TOUR = {
  id: 'card-panel-test',
  steps: [
    {
      id: 'open-the-session',
      target: '#the-target',
      caption: 'walkthrough_progress',
      narrate: { kind: 'chapter', titleKey: 'title', bodyKey: 'body' },
      expect: { selector: '#never-happens', visible: true },
    },
  ],
};

window.__walkthrough = startGuidedWalkthrough({
  tour: TOUR,
  t: words,
  pollMs: 60,
  narrator,
  onStep: (step) => narrator.showStep(step),
});
"""

PANEL_SHARE = """() => {
  const panel = document.querySelector('.walkthrough-panel').getBoundingClientRect();
  return Math.round((panel.height / window.innerHeight) * 100);
}"""


@pytest.mark.parametrize(
    ("phone", "width", "height"),
    [("iPhone 14", 390, 844), ("iPhone SE", 375, 667)],
)
def test_the_panel_clears_the_control_even_while_a_card_is_open(
    page, local_server, phone, width, height
):
    """Reported 2026-08-30 after walking the demo at iPhone sizes: "popravi čudno postavljene
    kartice". At the openings of two chapters the guide's panel stood on the session card its own
    spotlight was ringing — the ring visible below the panel's edge with its top half covered.

    A panel that takes more than half the screen has no side of the screen left to move to, so the
    prose scrolls inside a bounded panel instead of pushing it taller.
    """
    page.set_viewport_size({"width": width, "height": height})
    load_with_stub(page, local_server, CARD_STUB)
    page.wait_for_selector(".walkthrough-panel")
    page.wait_for_selector("#demo-narrator-card")
    page.evaluate("() => window.__putTargetMidScreen()")
    page.wait_for_timeout(900)

    state = page.evaluate(OVERLAP)
    share = page.evaluate(PANEL_SHARE)
    assert state["overlap"] is False, (
        f"{phone}: the panel (top {state['panel']}, {share}% of the screen) covers the control it "
        f"rings at y={state['target']}"
    )


@pytest.mark.parametrize(
    ("phone", "width", "height"),
    [("iPhone 14", 390, 844), ("iPhone SE", 375, 667)],
)
def test_a_card_does_not_grow_the_panel_past_the_room_it_needs_to_move(
    page, local_server, phone, width, height
):
    """The rule behind the test above, stated as a number so a longer paragraph cannot quietly bring
    the problem back: a panel over half the screen cannot get out of its own way at either end."""
    page.set_viewport_size({"width": width, "height": height})
    load_with_stub(page, local_server, CARD_STUB)
    page.wait_for_selector("#demo-narrator-card")
    page.evaluate("() => window.__putTargetMidScreen()")
    page.wait_for_timeout(900)

    share = page.evaluate(PANEL_SHARE)
    assert share <= 45, f"{phone}: the panel is {share}% of the screen with a card open"


# Putting the guide away and getting it back (TODO §38.16). Reported 2026-08-30: "demo cards exiting
# does not allow for return to demo" — the corner of the panel held a ✕ that ended the walkthrough
# outright, which is the most final act on the panel wearing the glyph that everywhere else in this
# app means "close this box".
PARK = """() => {
  const overlay = document.querySelector('.walkthrough');
  const shown = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  };
  return {
    parked: overlay?.classList.contains('is-collapsed') ?? null,
    progress: document.querySelector('.walkthrough-progress')?.textContent?.trim(),
    instruction: shown('.walkthrough-caption'),
    buttons: shown('.walkthrough-actions'),
    card: shown('#demo-narrator-card'),
    endOffered: shown('#walkthrough-exit'),
    panelHeight: Math.round(document.querySelector('.walkthrough-panel').getBoundingClientRect().height),
  };
}"""


def test_the_card_can_be_put_away_and_brought_back(page, local_server):
    """What a trainer wanting the card out of the way actually wants: the card gone for a moment, not
    the demo over. Parked, the guide keeps the one line worth reading from across the room — which
    step of how many — and the whole bar is the way back in."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, CARD_STUB)
    page.wait_for_selector("#demo-narrator-card")
    page.wait_for_timeout(500)
    full = page.evaluate(PARK)

    page.click("#walkthrough-collapse")
    page.wait_for_timeout(300)
    parked = page.evaluate(PARK)

    assert parked["parked"] is True
    assert parked["progress"] == full["progress"], (
        "the step number stays on the parked bar"
    )
    assert not parked["card"] and not parked["instruction"] and not parked["buttons"]
    assert parked["panelHeight"] < full["panelHeight"] / 2, (
        f"parked at {parked['panelHeight']}px against {full['panelHeight']}px open — not a bar"
    )

    # Anywhere on the bar, the way the message drawer's own bar works.
    page.click(".walkthrough-progress")
    page.wait_for_timeout(300)
    back = page.evaluate(PARK)

    assert back["parked"] is False
    assert back["card"] and back["instruction"] and back["buttons"]


def test_ending_the_demo_is_offered_only_once_it_is_out_of_the_way(page, local_server):
    """The one act with nothing after it is one tap from a guide already parked, and two from one
    you are reading. It still ends the walkthrough — the way out did not go anywhere."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, CARD_STUB)
    page.wait_for_selector("#demo-narrator-card")
    page.wait_for_timeout(500)

    assert page.evaluate(PARK)["endOffered"] is False

    page.click("#walkthrough-collapse")
    page.wait_for_timeout(300)
    assert page.evaluate(PARK)["endOffered"] is True

    page.click("#walkthrough-exit")
    page.wait_for_timeout(300)
    assert page.locator(".walkthrough-panel").count() == 0, "the demo really did end"


def test_a_parked_guide_keeps_watching(page, local_server):
    """A park, not a pause. The trainer who does the step by hand while the card is away comes back
    to a guide that moved on with them — which is the whole reason the bar keeps the step number."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, CARD_STUB)
    page.wait_for_selector(".walkthrough-panel")
    page.click("#walkthrough-collapse")
    page.wait_for_timeout(300)

    # The stub's step can never complete, so what is asserted is that the poll is still running:
    # the spotlight keeps following the control while the guide is parked.
    page.evaluate("() => window.__putTargetMidScreen()")
    page.wait_for_timeout(500)
    ringed = page.evaluate(
        """() => {
            const ring = document.querySelector('.walkthrough-spotlight');
            const target = document.getElementById('the-target').getBoundingClientRect();
            const box = ring.getBoundingClientRect();
            return ring.classList.contains('is-visible')
              && Math.abs(box.top + box.height / 2 - (target.top + target.height / 2)) < 24;
        }"""
    )
    assert ringed, "the ring stopped following the control while the guide was parked"
