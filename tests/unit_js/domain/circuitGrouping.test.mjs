// tests/unit_js/domain/circuitGrouping.test.mjs
// A circuit is not a container in the data — its members are ordinary items in the same flat array
// that happen to share a circuitId. So "this is a circuit" is an INVARIANT somebody maintains, not
// a structure that enforces itself, and every way of breaking it produces a plan that still looks
// plausible: two blocks with the same name, a member whose set count no longer matches the rounds,
// a round counter pointing at round 5 of a 3-round circuit that can therefore never be completed.
//
// None of this was reachable without mounting the editor in a browser until TODO §24.5.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectCircuitsMeta,
  normalizeCircuits,
  pruneOrphanedCircuitRounds,
  regroupCircuitMembers,
} from "../../../src/domain/circuitGrouping.js";

const exercise = (id, over = {}) => ({
  id,
  name: id,
  setsTargetCount: 1,
  repsTarget: 10,
  weightTarget: 20,
  ...over,
});
const rest = (id, over = {}) => ({ id, type: "rest", rest: 60, ...over });
const inCircuit = (circuitId, extra = {}) => ({
  circuitId,
  circuitTitle: "Finisher",
  circuitSeries: 3,
  ...extra,
});

test("scattered members are pulled together at the circuit's first position", () => {
  const clientState = {
    activeExerciseIndex: 0,
    exercises: [
      exercise("a", inCircuit("c1")),
      exercise("loose-1"),
      exercise("b", inCircuit("c1")),
      exercise("loose-2"),
      rest("r1", inCircuit("c1")),
    ],
    logs: {},
  };

  normalizeCircuits(clientState);

  assert.deepEqual(
    clientState.exercises.map((item) => item.id),
    ["a", "b", "r1", "loose-1", "loose-2"],
    "the block keeps its place in the program rather than jumping to the end",
  );
});

test("normalising an already-normal plan changes nothing", () => {
  const clientState = {
    activeExerciseIndex: 1,
    exercises: [exercise("a", inCircuit("c1")), exercise("b", inCircuit("c1")), exercise("solo")],
    logs: {},
    circuitRounds: { c1: 2 },
  };

  normalizeCircuits(clientState);
  const once = clientState.exercises.map((item) => item.id);
  normalizeCircuits(clientState);

  assert.deepEqual(
    clientState.exercises.map((item) => item.id),
    once,
  );
  assert.equal(clientState.circuitRounds.c1, 2);
  assert.equal(clientState.activeExerciseIndex, 1);
});

test("the array's identity survives, because the editor renders straight from it", () => {
  const clientState = {
    activeExerciseIndex: 0,
    exercises: [exercise("b", inCircuit("c1")), exercise("loose"), exercise("a", inCircuit("c1"))],
    logs: {},
  };
  const held = clientState.exercises;

  normalizeCircuits(clientState);

  assert.equal(clientState.exercises, held, "a reassigned array would strand the editor's copy");
});

test("one title and one round count per circuit, taken from its first exercise", () => {
  const items = [
    rest("r1", inCircuit("c1", { circuitTitle: "Wrong", circuitSeries: 9 })),
    exercise("a", inCircuit("c1", { circuitTitle: "Right", circuitSeries: 4 })),
    exercise("b", inCircuit("c1", { circuitTitle: "Stale", circuitSeries: 1 })),
  ];

  const regrouped = regroupCircuitMembers(items, {});

  for (const member of regrouped) {
    assert.equal(
      member.circuitTitle,
      "Right",
      "identity comes from the first EXERCISE, not a rest",
    );
    assert.equal(member.circuitSeries, 4);
  }
});

test("a member's set count and log rows follow the round count", () => {
  const logs = {
    a: [{ reps: 10, weight: 20, completed: true, note: "solid" }],
    b: [
      { reps: 8, weight: 30, completed: true, note: "" },
      { reps: 8, weight: 30, completed: false, note: "" },
      { reps: 8, weight: 30, completed: false, note: "" },
      { reps: 8, weight: 30, completed: false, note: "" },
    ],
  };
  const items = [exercise("a", inCircuit("c1")), exercise("b", inCircuit("c1"))];

  regroupCircuitMembers(items, logs);

  // Grown to the 3 rounds, keeping the set already logged.
  assert.equal(logs.a.length, 3);
  assert.equal(logs.a[0].completed, true);
  assert.equal(logs.a[0].note, "solid");
  assert.equal(logs.a[1].reps, 10, "a new row is seeded from the member's own target");
  // Trimmed down to 3 from 4.
  assert.equal(logs.b.length, 3);
  assert.equal(items[0].setsTargetCount, 3);
});

test("a rest inside a circuit takes the grouping but never a set count", () => {
  const items = [exercise("a", inCircuit("c1")), rest("r1", inCircuit("c1"))];
  const logs = {};

  regroupCircuitMembers(items, logs);

  assert.equal(items[1].circuitSeries, 3);
  assert.equal("setsTargetCount" in items[1], false, "a rest has no sets to align");
  assert.equal("r1" in logs, false, "and nothing to log");
});

test("round counters are dropped for deleted circuits and clamped to the series", () => {
  const items = [exercise("a", inCircuit("c1", { circuitSeries: 3 }))];
  const rounds = { c1: 7, "c-deleted": 2 };

  pruneOrphanedCircuitRounds(items, rounds);

  assert.equal("c-deleted" in rounds, false);
  assert.equal(rounds.c1, 3, "a counter past the series could never be completed");

  pruneOrphanedCircuitRounds(items, { c1: 0 });
  const zeroed = { c1: 0 };
  pruneOrphanedCircuitRounds(items, zeroed);
  assert.equal(zeroed.c1, 1, "rounds are 1-based");
});

test("pointers into the plan are dropped when the row they name is gone", () => {
  const clientState = {
    activeExerciseIndex: 5,
    editorExpandedId: "deleted-row",
    exercises: [exercise("a"), exercise("b")],
    logs: {},
  };

  normalizeCircuits(clientState);

  assert.equal(clientState.activeExerciseIndex, 1);
  assert.equal(clientState.editorExpandedId, null);
});

test("the circuit list reads in the order the trainer sees the blocks", () => {
  const items = [
    exercise("solo"),
    exercise("b", inCircuit("c2", { circuitTitle: "Second", circuitSeries: 2 })),
    exercise("a", inCircuit("c1", { circuitTitle: "First", circuitSeries: 3 })),
    exercise("b2", inCircuit("c2", { circuitTitle: "Second", circuitSeries: 2 })),
  ];

  assert.deepEqual(collectCircuitsMeta(items), [
    { id: "c2", title: "Second", series: 2 },
    { id: "c1", title: "First", series: 3 },
  ]);
  assert.deepEqual(collectCircuitsMeta([exercise("solo")]), []);
});

test("a plan with no logs or rounds yet is normalised, not crashed", () => {
  const clientState = { activeExerciseIndex: 0, exercises: [exercise("a", inCircuit("c1"))] };

  normalizeCircuits(clientState);

  assert.deepEqual(clientState.circuitRounds, { c1: 1 });
  assert.deepEqual(clientState.logs, {});
  // A plan that is not an array at all must not throw either — this runs before every render.
  normalizeCircuits({ exercises: null });
});
