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
