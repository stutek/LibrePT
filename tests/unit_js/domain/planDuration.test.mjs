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
  SECONDS_PER_MAX_SET,
  SECONDS_PER_REP,
  SECONDS_PER_WORKING_SET,
  SET_OVERHEAD_SECONDS,
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

// --- what a set costs, by its reps -------------------------------------------------------------
// Asked 2026-09-01 (Simon): "we should also find a way to account time for 20 bolgarian squats, or
// 5 pullups". A flat 45s per set says those two cost the same, which no trainer believes. Reps are
// already in the plan, so the model scales by them — an overhead for getting set up plus a cost per
// rep — and still invents no per-movement table, which is what this module refused for good reason.

test("a set costs its setup plus its reps, so five pull-ups are not twenty squats", () => {
  const pullups = [exercise({ setsTargetCount: 1, repsTarget: 5 })];
  const squats = [exercise({ setsTargetCount: 1, repsTarget: 20 })];

  assert.equal(planNetSeconds(pullups), SET_OVERHEAD_SECONDS + 5 * SECONDS_PER_REP);
  assert.equal(planNetSeconds(squats), SET_OVERHEAD_SECONDS + 20 * SECONDS_PER_REP);
  assert.ok(planNetSeconds(squats) > planNetSeconds(pullups) * 2);
});

test("the common set is unchanged, so the model is calibrated where it was", () => {
  // Ten reps is what the flat constant always meant. It still costs exactly that.
  assert.equal(
    planNetSeconds([exercise({ setsTargetCount: 1, repsTarget: 10 })]),
    SECONDS_PER_WORKING_SET,
  );
});

test("a rep range is costed at its top — the number the trainer might actually hit", () => {
  assert.equal(
    planNetSeconds([exercise({ setsTargetCount: 1, repsTarget: "8-12" })]),
    SET_OVERHEAD_SECONDS + 12 * SECONDS_PER_REP,
  );
});

test("an unauthored rep count falls back to the plain working set rather than to zero", () => {
  // An empty box or a band label has nothing to count. Costing it at nothing would make a whole
  // plan of them look free.
  for (const reps of ["", null, undefined, "Medium"]) {
    assert.equal(
      planNetSeconds([exercise({ setsTargetCount: 1, repsTarget: reps })]),
      SECONDS_PER_WORKING_SET,
      `reps ${JSON.stringify(reps)}`,
    );
  }
});

test("a set to failure costs the recovery it forces, not a rep count it does not have", () => {
  // Ruled 2026-09-01 (Simon): "max reps should probably default to 3 or 5 min". Three — the
  // conservative end — because at five, four such sets would eat a third of an hour on their own.
  for (const reps of ["Max", "max", "AMRAP", "F"]) {
    assert.equal(
      planNetSeconds([exercise({ setsTargetCount: 1, repsTarget: reps })]),
      SECONDS_PER_MAX_SET,
      `reps ${JSON.stringify(reps)}`,
    );
  }
  assert.ok(SECONDS_PER_MAX_SET > SECONDS_PER_WORKING_SET * 3);
});

test("per-arm reps are costed for both arms, and the description is left alone", () => {
  // Ruled 2026-09-01: "keep the description 'X reps per arm', but when estimating duration for a
  // card or a cycle it should return calculated time back". The plan's own text is never rewritten —
  // this reads it. Twelve per arm is twenty-four reps performed.
  const item = exercise({ setsTargetCount: 1, repsTarget: "12 per arm" });

  assert.equal(planNetSeconds([item]), SET_OVERHEAD_SECONDS + 24 * SECONDS_PER_REP);
  assert.equal(item.repsTarget, "12 per arm", "the authored description must survive costing");
});

test("every side word counts double, and a plain count does not", () => {
  const cost = (reps) => planNetSeconds([exercise({ setsTargetCount: 1, repsTarget: reps })]);

  for (const side of ["10 per arm", "10 per leg", "10 per side", "10 per hand", "10 per foot"]) {
    assert.equal(cost(side), SET_OVERHEAD_SECONDS + 20 * SECONDS_PER_REP, side);
  }
  assert.equal(cost("10"), SET_OVERHEAD_SECONDS + 10 * SECONDS_PER_REP);
  // "10 per minute" is a tempo, not a side.
  assert.equal(cost("10 per minute"), SET_OVERHEAD_SECONDS + 10 * SECONDS_PER_REP);
});

// --- three states, judged on WORK ---------------------------------------------------------------
// Ruled 2026-09-01 (Simon): "if the plan (not counting rests) exceeds 75% of time then it should
// mark warning and at 100% should turn error".
//
// Judged on work rather than on the total for a reason the module already half-admitted: rest is
// counted only where the trainer wrote a rest row, so the total under-reads exactly the plans most
// likely to overrun. The 25% this leaves is the rest nobody typed in.

test("a plan whose work fits inside three quarters of the slot is simply fine", () => {
  const fit = planFitsSlot([exercise({ setsTargetCount: 10, repsTarget: 10 })], "10:00 - 11:00");

  assert.equal(fit.level, "ok");
  assert.equal(fit.fits, true);
});

test("past three quarters of the slot the plan is tight, not yet over", () => {
  // 62 sets of 10 = 46.5 min of work in a 60 min slot — 77%.
  const fit = planFitsSlot([exercise({ setsTargetCount: 62, repsTarget: 10 })], "10:00 - 11:00");

  assert.equal(fit.level, "warning");
  assert.equal(fit.fits, true, "tight is a warning about the rest, not a plan that cannot fit");
});

test("work alone filling the slot is the error, whatever the rests say", () => {
  const fit = planFitsSlot([exercise({ setsTargetCount: 80, repsTarget: 10 })], "10:00 - 11:00");

  assert.equal(fit.level, "over");
  assert.equal(fit.fits, false);
});

test("rests are excluded from the judgement but still counted in the total", () => {
  const items = [exercise({ setsTargetCount: 10, repsTarget: 10 }), rest(600)];
  const fit = planFitsSlot(items, "10:00 - 11:00");

  assert.equal(fit.workSeconds, 10 * SECONDS_PER_WORKING_SET);
  assert.equal(fit.netSeconds, fit.workSeconds + 600);
  assert.equal(fit.level, "ok", "ten minutes of authored rest must not raise the alarm by itself");
});

test("a session with no slot has no level to report", () => {
  const fit = planFitsSlot([exercise({ setsTargetCount: 40 })], "");

  assert.equal(fit.level, "ok");
  assert.equal(fit.slotSeconds, 0);
});
