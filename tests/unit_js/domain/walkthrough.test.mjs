// tests/unit_js/domain/walkthrough.test.mjs
// The guided walkthrough's cursor (src/domain/walkthrough.js) — TODO §9.5.
//
// What these pin is the PROMISE the panel makes to a trainer standing in a gym: you are never asked
// to do something you have already done, you cannot be advanced past a control that does not exist
// yet, and going back never demands the step again. The button wiring is
// modules/demo/walkthroughOverlay.js and is covered by tests/e2e/test_walkthrough.py, which drives
// the real controls; nothing here touches a DOM.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  advanceWalkthrough,
  completeWalkthroughStep,
  currentWalkthroughStep,
  isWalkthroughStepDone,
  retreatWalkthrough,
  startWalkthrough,
  walkthroughControls,
} from "../../../src/domain/walkthrough.js";

// Shaped like gymFloorTour.js (id + target + expect), trimmed to what a cursor can see. Using a
// stand-in rather than the real script keeps a copy change to the demo's captions from failing
// these — the real script's structure is validated by domain/demoTour.js's own tests.
const TOUR = {
  id: "test-tour",
  steps: [
    { id: "first", target: ".one", expect: { selector: ".one.done" } },
    { id: "second", target: ".two", expect: { selector: ".two.done" } },
    { id: "third", target: ".three", expect: { selector: ".three.done" } },
  ],
};

test("a fresh walkthrough asks for the first step and offers no way past it", () => {
  const state = startWalkthrough();

  assert.equal(currentWalkthroughStep(TOUR, state).id, "first");
  const controls = walkthroughControls(TOUR, state);
  assert.equal(controls.canShowMe, true, "the trainer can ask to be shown");
  assert.equal(controls.canAdvance, false, "nothing to advance to until the step happens");
  assert.equal(controls.canGoBack, false, "there is nowhere behind the first step");
  assert.equal(controls.stepNumber, 1);
  assert.equal(controls.stepCount, 3);
});

test("completing the step adds the offer to move on, and keeps the offer to be shown", () => {
  // Show me used to disappear here, on the reasoning that an offer to do a done thing is a control
  // that does nothing. Reported 2026-08-18 ("moving back and forward in the demo loses show me
  // buttons"): walking back through a finished tour left a guide with no Show me anywhere, because
  // every step behind you is done. On a revisited step it no longer TAPS — it points at the control
  // again (walkthroughOverlay.js), which is what someone re-reading a step actually wants and is
  // also what keeps "a step returned to asks nothing of the trainer a second time" true.
  const state = completeWalkthroughStep(startWalkthrough(), "first");

  const controls = walkthroughControls(TOUR, state);
  assert.equal(controls.canShowMe, true);
  assert.equal(controls.canAdvance, true);
});

test("advancing is refused while the current step is undone, because its successor's control does not exist yet", () => {
  const state = startWalkthrough();

  const unchanged = advanceWalkthrough(TOUR, state);

  assert.deepEqual(unchanged, state);
  assert.equal(currentWalkthroughStep(TOUR, unchanged).id, "first");
});

test("the same completion arriving repeatedly changes nothing", () => {
  // The overlay polls for the trainer's own tap, so it reports the same completion every tick.
  const once = completeWalkthroughStep(startWalkthrough(), "first");
  const again = completeWalkthroughStep(once, "first");

  assert.deepEqual(again, once);
});

test("going back re-asks nothing: a step already done stays done", () => {
  let state = completeWalkthroughStep(startWalkthrough(), "first");
  state = advanceWalkthrough(TOUR, state);
  state = completeWalkthroughStep(state, "second");
  state = advanceWalkthrough(TOUR, state);

  const back = retreatWalkthrough(state);

  assert.equal(currentWalkthroughStep(TOUR, back).id, "second");
  assert.equal(isWalkthroughStepDone(back, "second"), true);
  assert.equal(
    walkthroughControls(TOUR, back).canAdvance,
    true,
    "Next is there without doing it again",
  );
  // Still offered, as a POINTER rather than a second tap — see the note above.
  assert.equal(walkthroughControls(TOUR, back).canShowMe, true);
});

test("the last step offers a finish rather than another step", () => {
  let state = completeWalkthroughStep(startWalkthrough(), "first");
  state = advanceWalkthrough(TOUR, state);
  state = completeWalkthroughStep(state, "second");
  state = advanceWalkthrough(TOUR, state);

  assert.equal(walkthroughControls(TOUR, state).isLastStep, true);

  state = completeWalkthroughStep(state, "third");
  const finished = advanceWalkthrough(TOUR, state);

  assert.equal(walkthroughControls(TOUR, finished).isFinished, true);
  assert.equal(currentWalkthroughStep(TOUR, finished), null, "nothing is being asked any more");
});

test("a walkthrough left on its first step can still be walked out of backwards without breaking", () => {
  // Back on the first step is not offered, and calling it anyway must not walk off the front of the
  // script — the overlay re-renders from whatever comes back.
  const state = startWalkthrough();

  assert.deepEqual(retreatWalkthrough(state), state);
});
