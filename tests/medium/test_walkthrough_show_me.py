# tests/medium/test_walkthrough_show_me.py
# What "Show me" does to the guide's position (TODO §38.18).
#
# Reported 2026-08-30: "show me behavior is inconsistent, should it advance always or never?" — and it
# was neither. Two rules laid down three days apart had come to contradict each other: Show me was
# written never to move the guide (2026-08-23), and then the card was made to follow the app whenever
# a step completed in front of the viewer (2026-08-26). Show me completes a step in front of the
# viewer, so whether it advanced came down to something invisible — whether the step's expectation
# happened to be true already when its card appeared.
#
# The rule now is one sentence: a step completed while the trainer is WATCHING carries the card on,
# whether their own thumb did it or they asked to be shown. These pin the three cases that make that
# either true or a lie.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

# Three steps, chosen for what is true when each one's card arrives:
#   1. nothing yet — the ordinary case, the tap has to happen;
#   2. ALREADY satisfied on arrival — the screen the step before it left behind;
#   3. the last one, where finishing is a decision rather than a step.
STUB = """
import { startGuidedWalkthrough } from './modules/demo/walkthroughOverlay.js';

const stage = document.createElement('div');
stage.className = 'app-view active';
stage.innerHTML = `
  <button id="first">First</button>
  <button id="second">Second</button>
  <button id="third">Third</button>
  <p id="already-true">this is on screen from the start</p>
  <p id="first-done" hidden>first done</p>
  <p id="third-done" hidden>third done</p>
`;
document.body.appendChild(stage);
for (const [button, mark] of [['first', 'first-done'], ['third', 'third-done']]) {
  document.getElementById(button).addEventListener('click', () => {
    document.getElementById(mark).hidden = false;
  });
}

const TOUR = {
  id: 'show-me-test',
  steps: [
    { id: 'ordinary', target: '#first', caption: 'walkthrough_progress',
      expect: { selector: '#first-done', visible: true } },
    { id: 'already-there', target: '#second', caption: 'walkthrough_progress',
      expect: { selector: '#already-true', visible: true } },
    { id: 'the-last-one', target: '#third', caption: 'walkthrough_progress',
      expect: { selector: '#third-done', visible: true } },
  ],
};

// A translator that actually formats the counter, so the assertions can read a step number rather
// than the key it is looked up by.
const words = (key) => (key === 'walkthrough_progress' ? 'step {step} of {count}' : key);

window.__walkthrough = startGuidedWalkthrough({ tour: TOUR, t: words, pollMs: 60 });
"""

STEP = "#walkthrough-overlay .walkthrough-progress"


def _start(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector(".walkthrough-panel")
    page.wait_for_timeout(400)


def test_show_me_carries_the_card_on_from_an_ordinary_step(page, local_server):
    """The case that already worked: nothing is true yet, the guide taps, the step is done in front
    of the viewer, the card follows."""
    _start(page, local_server)
    expect(page.locator(STEP)).to_contain_text("step 1")

    page.click("#walkthrough-show")

    expect(page.locator(STEP)).to_contain_text("step 2", timeout=10_000)


def test_show_me_carries_the_card_on_from_a_step_that_was_already_true(
    page, local_server
):
    """The case that did not, and the whole of the report. This step's expectation holds the moment
    its card appears — the screen was left there by the step before — so the guide used to
    demonstrate it and then sit still, while the identical tap one step earlier moved on. Nothing on
    screen distinguishes the two, which from the floor reads as a button that sometimes works."""
    _start(page, local_server)
    page.click("#walkthrough-show")
    expect(page.locator(STEP)).to_contain_text("step 2", timeout=10_000)

    page.click("#walkthrough-show")

    expect(page.locator(STEP)).to_contain_text("step 3", timeout=10_000)


def test_the_last_step_still_waits_for_the_trainer(page, local_server):
    """The one exception worth keeping: ending is a decision. A demo that closed itself the moment
    the final tap landed would take the thank-you card with it before anyone read it."""
    _start(page, local_server)
    page.click("#walkthrough-show")
    expect(page.locator(STEP)).to_contain_text("step 2", timeout=10_000)
    page.click("#walkthrough-show")
    expect(page.locator(STEP)).to_contain_text("step 3", timeout=10_000)

    page.click("#walkthrough-show")
    page.wait_for_timeout(2_000)

    expect(page.locator(STEP)).to_contain_text("step 3")
    expect(page.locator(".walkthrough-panel")).to_be_visible()
    expect(page.locator("#walkthrough-next")).to_be_enabled()


def test_being_shown_a_step_again_does_not_carry_you_past_one_you_have_not_seen(
    page, local_server
):
    """Walking back and asking to be shown is a REPLAY, not progress. The guide re-explains where the
    trainer already is; carrying them forward from there would skip the step they came back for."""
    _start(page, local_server)
    page.click("#walkthrough-show")
    expect(page.locator(STEP)).to_contain_text("step 2", timeout=10_000)
    page.click("#walkthrough-back")
    expect(page.locator(STEP)).to_contain_text("step 1")

    page.click("#walkthrough-show")
    page.wait_for_timeout(2_000)

    expect(page.locator(STEP)).to_contain_text("step 1")


# A card whose Show me is a SEQUENCE, not one tap (asked 2026-09-11 for the story's welcome card:
# show the SANDBOX badge, then the two sandbox rows behind the ☰ menu). Three promises live in this
# stub, and each one is a way the shipped card could go wrong:
#   1. a pointed-at control is never fired — tapping the real "Leave the sandbox" row would end the
#      sandbox in the middle of the first card;
#   2. the menu the sequence opened is closed again — two steps later the story asks the trainer to
#      open that same menu, and one left standing grades that step done before they touch anything;
#   3. the step itself completes, so the guide carries on rather than reporting a failure.
SEQUENCE_STUB = """
import { startGuidedWalkthrough } from './modules/demo/walkthroughOverlay.js';

window.__fired = [];
window.__opened = 0;

const stage = document.createElement('div');
stage.className = 'app-view active';
stage.innerHTML = `
  <p id="badge">SANDBOX</p>
  <button id="menu-toggle">Menu</button>
  <div id="menu" class="hidden">
    <button id="leave">Leave the sandbox</button>
    <button id="reset">Build a fresh sandbox</button>
  </div>
`;
document.body.appendChild(stage);

const menu = document.getElementById('menu');
document.getElementById('menu-toggle').addEventListener('click', () => {
  menu.classList.toggle('hidden');
  if (!menu.classList.contains('hidden')) window.__opened += 1;
});
for (const id of ['leave', 'reset']) {
  document.getElementById(id).addEventListener('click', () => window.__fired.push(id));
}

const TOUR = {
  id: 'sequence-test',
  steps: [
    {
      id: 'the-card',
      // On the panel itself, like the story's welcome card: there is nothing in the app this step
      // asks for, so its own expectation is simply that the card is on screen.
      target: '.walkthrough-caption',
      caption: 'walkthrough_progress',
      expect: { selector: '.walkthrough-caption', visible: true },
      demonstrate: [
        { target: '#badge', point: true },
        { target: '#menu-toggle', expect: { selector: '#leave', visible: true } },
        { target: '#leave', point: true },
        { target: '#reset', point: true },
        { target: '#menu-toggle', expect: { selector: '#menu', visible: false } },
      ],
    },
  ],
};

const words = (key) => (key === 'walkthrough_progress' ? 'step {step} of {count}' : key);
window.__walkthrough = startGuidedWalkthrough({ tour: TOUR, t: words, pollMs: 60 });
"""


def _start_sequence(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, SEQUENCE_STUB)
    page.wait_for_selector(".walkthrough-panel")
    page.wait_for_timeout(400)
    page.click("#walkthrough-show")
    # Five beats, each with its own scroll, travel, tap and pause — a wall-clock guess would either
    # cut the sequence in half or pad every run. The guide greys its own buttons out while a
    # demonstration is in flight, so waiting for Show me to come back is waiting for the sequence.
    page.wait_for_function(
        "() => !document.getElementById('walkthrough-show').disabled", timeout=40_000
    )


def test_a_demonstrated_sequence_points_at_controls_without_firing_them(
    page, local_server
):
    """The card shows the way OUT of the sandbox and the way to start over. Firing either one is the
    act itself, in the middle of the sentence that describes it."""
    _start_sequence(page, local_server)

    assert page.evaluate("() => window.__fired") == []
    assert page.evaluate("() => window.__opened") >= 1


def test_a_demonstrated_sequence_puts_the_menu_back(page, local_server):
    """It opened the menu, so it closes it: the next step of the real story asks the trainer to open
    that menu, and a menu left open makes that step true before they have done anything."""
    _start_sequence(page, local_server)

    expect(page.locator("#menu")).to_be_hidden()


def test_a_demonstrated_sequence_completes_the_step(page, local_server):
    """The step is graded on its own expectation, not on the last beat — so a sequence that ran
    through carries the guide on instead of reporting that nothing happened."""
    _start_sequence(page, local_server)

    expect(page.locator(".walkthrough-problem")).to_be_hidden()
    expect(page.locator("#walkthrough-next")).to_be_enabled()
