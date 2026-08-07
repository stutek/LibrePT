// tests/unit_js/domain/sessionFocus.test.mjs
// The property that matters is a ROUND TRIP: every item in a plan must resolve back to itself
// through the ref that addresses it. A URL, a cached session and a running timer all store a ref
// and later ask for the item back, so a kind of item the trip does not hold for is a kind of item
// the trainer cannot be sent back to.
//
// It did not hold for standalone rests. The timer wrote `{ type: "exercise" }` for one, and
// focusIndexFromRef's exercise branch explicitly excludes rests, so the ref resolved to nothing and
// tapping the timer card left focus wherever it happened to be (TODO §24.4).

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  focusIndexFromRef,
  focusRefForItem,
  isCircuitFocus,
} from "../../../src/domain/sessionFocus.js";

// One of every kind an `exercises` array can hold: a plain exercise, a standalone rest, a circuit
// member, and a rest INSIDE that circuit.
const PLAN = {
  exercises: [
    { id: "ex-1", name: "Bench Press" },
    { id: "rest-1", type: "rest", rest: 90 },
    { id: "ex-2", name: "Barbell Row", circuitId: "circ-1", circuitTitle: "Finisher" },
    { id: "rest-2", type: "rest", rest: 30, circuitId: "circ-1" },
    { id: "ex-3", name: "Plank" },
  ],
};

test("every kind of plan item survives the ref round trip", () => {
  PLAN.exercises.forEach((item, index) => {
    const ref = focusRefForItem(item);
    assert.notEqual(ref, null, `no ref built for ${item.id}`);
    const resolved = focusIndexFromRef(PLAN, ref);
    const expected = item.circuitId
      ? // A circuit member resolves to its BLOCK, which is the first member — the whole block is
        // what the trainer sees in focus, so this is the intended answer, not a near miss.
        PLAN.exercises.findIndex((other) => other.circuitId === item.circuitId)
      : index;
    assert.equal(resolved, expected, `${item.id} did not round-trip`);
  });
});

test("a standalone rest is addressed as a rest, not as an exercise", () => {
  const rest = PLAN.exercises[1];
  assert.deepEqual(focusRefForItem(rest), { type: "rest", id: "rest-1" });
  // The regression itself: the ref the timer used to build resolves to nothing.
  assert.equal(focusIndexFromRef(PLAN, { type: "exercise", id: "rest-1" }), -1);
  assert.equal(focusIndexFromRef(PLAN, { type: "rest", id: "rest-1" }), 1);
});

test("circuit membership outranks an item's own kind", () => {
  assert.deepEqual(focusRefForItem(PLAN.exercises[2]), { type: "circuit", id: "circ-1" });
  // Including for a rest inside the circuit — it belongs to the block, not to itself.
  assert.deepEqual(focusRefForItem(PLAN.exercises[3]), { type: "circuit", id: "circ-1" });
});

// Renaming a term must not orphan a running timer or a link somebody saved.
test("the pre-rename superset spelling still resolves", () => {
  assert.equal(isCircuitFocus("circuit"), true);
  assert.equal(isCircuitFocus("superset"), true);
  assert.equal(isCircuitFocus("exercise"), false);
  assert.equal(focusIndexFromRef(PLAN, { type: "superset", id: "circ-1" }), 2);
});

test("a ref naming a deleted card resolves to nothing rather than throwing", () => {
  assert.equal(focusIndexFromRef(PLAN, { type: "exercise", id: "gone" }), -1);
  assert.equal(focusIndexFromRef(PLAN, { type: "circuit", id: "gone" }), -1);
  assert.equal(focusIndexFromRef(PLAN, null), -1);
  assert.equal(focusIndexFromRef(null, { type: "exercise", id: "ex-1" }), -1);
  assert.equal(focusIndexFromRef({}, { type: "exercise", id: "ex-1" }), -1);
  assert.equal(focusRefForItem(null), null);
  assert.equal(focusRefForItem(undefined), null);
});
