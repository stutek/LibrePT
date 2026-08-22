// tests/unit_js/domain/planDuration.test.mjs
// How long a programme actually takes, against the slot it has to fit in (src/domain/planDuration.js)
// — TODO §35.3b.
//
// The promise: while a trainer is building a session, the answer to "does this fit in the hour?" is
// on screen. It is an ESTIMATE and says so — nobody can know how long a set takes — but a trainer
// planning 45 minutes of work inside a 60-minute slot needs the number while they are still adding
// exercises, not after the session overran.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SECONDS_PER_WORKING_SET,
  planFitsSlot,
  planNetSeconds,
  slotSeconds,
} from "../../../src/domain/planDuration.js";

const exercise = (overrides = {}) => ({ type: "exercise", setsTargetCount: 3, ...overrides });
const rest = (seconds, overrides = {}) => ({ type: "rest", rest: seconds, ...overrides });

test("a plain strength plan is its sets, at a working set's length", () => {
  const items = [exercise({ setsTargetCount: 3 }), exercise({ setsTargetCount: 2 })];

  assert.equal(planNetSeconds(items), 5 * SECONDS_PER_WORKING_SET);
});

test("rests count — they are what the slot is actually spent on", () => {
  const items = [exercise({ setsTargetCount: 1 }), rest(60)];

  assert.equal(planNetSeconds(items), SECONDS_PER_WORKING_SET + 60);
});

test("held and timed work is counted in its own seconds, not in sets", () => {
  // A 40-second plank is 40 seconds, whatever a working set usually costs.
  const items = [exercise({ metric: "time", repsTarget: 40, setsTargetCount: 2 })];

  assert.equal(planNetSeconds(items), 80);
});

test("a circuit costs its rounds", () => {
  const items = [
    exercise({ circuitId: "c1", circuitSeries: 3, setsTargetCount: 1 }),
    rest(30, { circuitId: "c1", circuitSeries: 3 }),
  ];

  assert.equal(planNetSeconds(items), 3 * (SECONDS_PER_WORKING_SET + 30));
});

test("an empty plan takes no time rather than failing", () => {
  assert.equal(planNetSeconds([]), 0);
  assert.equal(planNetSeconds(), 0);
});

test("the slot is read from the label the session already carries", () => {
  assert.equal(slotSeconds("18:00 - 19:00"), 3600);
  assert.equal(slotSeconds("not a slot"), 0);
});

test("a plan that fits says by how much room is left", () => {
  const fit = planFitsSlot([exercise({ setsTargetCount: 4 })], "18:00 - 19:00");

  assert.equal(fit.fits, true);
  assert.equal(fit.netSeconds, 4 * SECONDS_PER_WORKING_SET);
  assert.equal(fit.slotSeconds, 3600);
  assert.ok(fit.overBy < 0, "room left reads as a negative overrun");
});

test("a plan that does not fit is the whole point of the number", () => {
  const items = Array.from({ length: 60 }, () => exercise({ setsTargetCount: 3 }));

  const fit = planFitsSlot(items, "18:00 - 19:00");

  assert.equal(fit.fits, false);
  assert.ok(fit.overBy > 0);
});

test("a session with no slot is not judged against one", () => {
  // A planning programme has no time at all (domain/sessionRecord.js), and inventing a verdict for
  // it would put a red number on a screen where nothing is wrong.
  const fit = planFitsSlot([exercise()], "");

  assert.equal(fit.slotSeconds, 0);
  assert.equal(fit.fits, true);
});
