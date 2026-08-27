// tests/unit_js/modules/demo/demoPace.test.mjs
// The demo's pacing (src/modules/demo/demoPace.js).
//
// Every pause the scripted demo takes exists for one reason: a viewer's eye has to find the control,
// register that it changed, and read the caption. Someone who has asked their system for reduced
// motion is telling us the opposite — the hand does not glide for them (the CSS already cuts it), so
// waiting for travel that is not happening is dead time in front of a person who asked for less.

import assert from "node:assert/strict";
import { test } from "node:test";

// The wave COUNT is the drawing's business and lives with the drawing; the two durations are the
// player's, because it has to wait for them. Importing demoHand here touches no DOM — it reads a
// constant, and every function in it takes its document as an argument.
import { RIPPLE_WAVES } from "../../../../src/modules/demo/demoHand.js";
import {
  RIPPLE_RING_MS,
  RIPPLE_STAGGER_MS,
  demoPace,
} from "../../../../src/modules/demo/demoPace.js";

test("full motion paces for an eye following a finger", () => {
  const pace = demoPace(false);

  // The settle is the longest beat: it is what lets a viewer see the RESULT of the tap.
  assert.ok(pace.stepPauseMs >= 1000, "a step must stay readable at full motion");
  assert.ok(pace.travelMs > 0, "the hand travels, so the travel must be waited for");
});

test("reduced motion waits for nothing at all", () => {
  const pace = demoPace(true);

  // Every one of these is a beat for a human eye, and there is no eye to pace: the hand does not
  // glide (the CSS cuts it), so nothing is travelling, settling or landing to be waited for.
  assert.equal(pace.scrollSettleMs, 0);
  assert.equal(pace.travelMs, 0);
  assert.equal(pace.tapLeadMs, 0);
  assert.equal(pace.stepPauseMs, 0);
});

test("the tap's mark gets a full ring's head start on the click", () => {
  // Reported 2026-08-27: the rings sometimes arrive on a screen the tap has already replaced, which
  // reads as the new view being tapped rather than the old one. The click is what changes the view,
  // so the only place to fix that is BEFORE it: the mark leads the tap by its own duration, and what
  // carries over the change is the tail of a ring already past its peak.
  const pace = demoPace(false);

  assert.ok(
    pace.tapLeadMs >= RIPPLE_RING_MS,
    `the click fires ${pace.tapLeadMs}ms after the rings appear, a ring lasts ${RIPPLE_RING_MS}ms`,
  );
  // Derived, not merely large: a ring drawn slower must push the click out with it, or this drifts
  // back into the bug the next time the animation is retimed.
  assert.equal(pace.tapLeadMs, RIPPLE_RING_MS);
  // The trailing rings are emitted on a stagger, and every one of them must be out before the app
  // is allowed to answer — a ring that first appears after the view changed belongs to the new view.
  const lastRingOutAt = RIPPLE_STAGGER_MS * (RIPPLE_WAVES - 1);
  assert.ok(lastRingOutAt < pace.tapLeadMs, "the last ring must be out before the click");
});

test("zero pacing is safe because the step waits on its OUTCOME, not on a clock", () => {
  // The pause used to double as correctness: sleep 1350ms, then check the expectation once. At zero
  // that check would race a handler that re-renders on the next frame. The player therefore polls
  // the expectation until it holds, which is both faster than the old sleep and more honest — it
  // waits for exactly as long as the app takes.
  assert.ok(demoPace(true).outcomeBudgetMs >= 1000, "the poll needs a real budget to fail against");
  assert.equal(demoPace(true).outcomeBudgetMs, demoPace(false).outcomeBudgetMs);
});

test("the two paces carry the same fields, so a caller cannot depend on one shape", () => {
  assert.deepEqual(Object.keys(demoPace(true)).sort(), Object.keys(demoPace(false)).sort());
});
