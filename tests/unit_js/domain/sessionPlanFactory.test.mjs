// tests/unit_js/domain/sessionPlanFactory.test.mjs
// Building a live plan is where a session's structure is either preserved or quietly lost. Two
// properties matter more than the field-by-field mapping:
//
//   1. ORDER. `activeExerciseIndex` points into `exercises` by index, so a snapshot must be read in
//      its own program order (TODO §17.5) before the first item is pushed — sorting afterwards
//      would be too late, and a scrambled program passes every id-based integrity check we have.
//   2. STRUCTURE. Rests and prescribed-but-skipped movements survive the round trip (TODO §17.1).
//      Dropping them still yields a plausible-looking plan, which is exactly what makes it a bug
//      nobody notices.
//
// Reachable only through a booted app until TODO §24.4 moved the factory into domain/.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildClientStateFromHistoryLog,
  buildClientStateFromRoutine,
  clampFocusIndex,
  ensureRestItems,
} from "../../../src/domain/sessionPlanFactory.js";

const CATALOG = [
  {
    id: "ex-bench",
    name: "Bench Press",
    category: "Push",
    pattern: "horizontal-push",
    instructions: "Brace.",
    equipment: "barbell",
  },
  {
    id: "ex-row",
    name: "Barbell Row",
    category: "Pull",
    pattern: "horizontal-pull",
    instructions: "Flat back.",
    equipment: "barbell",
  },
];

test("a history snapshot is rebuilt in its own program order, not array order", () => {
  const log = {
    routineId: "r1",
    routineName: "Upper A",
    exercises: [
      { id: "ex-row", name: "Barbell Row", position: 2, sets: [{ reps: 8, weight: 60 }] },
      { id: "ex-bench", name: "Bench Press", position: 0, sets: [{ reps: 5, weight: 80 }] },
      { id: "r-1", type: "rest", rest: 90, position: 1 },
    ],
  };

  const plan = buildClientStateFromHistoryLog(log, CATALOG);

  assert.deepEqual(
    plan.exercises.map((item) => item.name ?? item.type),
    ["Bench Press", "rest", "Barbell Row"],
  );
  assert.equal(plan.routineName, "Upper A");
  assert.equal(plan.activeExerciseIndex, 0);
  // Every card starts collapsed on a fresh open — see the flag's comment in the factory.
  assert.equal(plan.deckAllCollapsed, true);
});

test("a movement missing from the catalog keeps the snapshot's own axes", () => {
  const log = {
    routineName: "Old",
    exercises: [
      {
        id: "gone",
        name: "Deleted Movement",
        position: 0,
        modality: "cardio",
        metric: "distance",
        loadUnit: "none",
        sets: [{ reps: 400, weight: 0, completed: true }],
      },
    ],
  };

  const [item] = buildClientStateFromHistoryLog(log, CATALOG).exercises;

  assert.equal(item.name, "Deleted Movement");
  assert.equal(item.modality, "cardio", "snapshot axes must win over a catalog fallback");
  assert.equal(item.metric, "distance");
  assert.equal(item.category, "Recovery", "an unknown movement falls back, it does not vanish");
});

test("logs survive the rebuild, including a set the trainer never completed", () => {
  const log = {
    routineName: "Upper A",
    exercises: [
      {
        id: "ex-bench",
        name: "Bench Press",
        position: 0,
        sets: [
          { reps: 5, weight: 80, completed: true, note: "easy" },
          { reps: 5, weight: 80, completed: false },
        ],
      },
    ],
  };

  const plan = buildClientStateFromHistoryLog(log, CATALOG);

  assert.deepEqual(plan.logs["ex-bench"], [
    { reps: 5, weight: 80, completed: true, note: "easy" },
    { reps: 5, weight: 80, completed: false, note: "" },
  ]);
  assert.equal(plan.exercises[0].setsTargetCount, 2);
});

test("a routine builds its plan; an unknown routine still yields a usable empty one", () => {
  const routines = [
    {
      id: "r1",
      name: "Upper A",
      exercises: [{ id: "ex-bench", sets: 3, reps: 5, weight: 80, rest: 90 }],
    },
  ];

  const plan = buildClientStateFromRoutine({
    routineId: "r1",
    routines,
    exercises: CATALOG,
    emptyPlanName: "Custom / Empty Plan",
  });
  assert.equal(plan.routineName, "Upper A");
  assert.equal(plan.exercises.length, 1);
  assert.equal(plan.logs["ex-bench"].length, 3, "one log row per prescribed set");
  assert.equal(plan.logs["ex-bench"][0].completed, false);

  const empty = buildClientStateFromRoutine({
    routineId: "nope",
    routines,
    exercises: CATALOG,
    emptyPlanName: "Custom / Empty Plan",
  });
  assert.equal(empty.routineName, "Custom / Empty Plan");
  assert.deepEqual(empty.exercises, []);
});

// Legacy plans carried rest as a NUMBER on the exercise. The migration has to be idempotent,
// because it runs on every board render — a second pass inserting a second rest would grow the
// plan without limit.
test("legacy exercise-level rest becomes a rest item exactly once", () => {
  const clientState = {
    activeExerciseIndex: 0,
    exercises: [
      { id: "a", name: "Bench Press", rest: 90 },
      { id: "b", name: "Barbell Row", rest: 0 },
    ],
    logs: {},
  };

  ensureRestItems(clientState);
  const afterFirst = clientState.exercises.map((item) => item.id);
  assert.deepEqual(afterFirst, ["a", "rest-a", "b"]);
  assert.equal(clientState.exercises[0].rest, 0, "the source rest is zeroed as it migrates");

  ensureRestItems(clientState);
  assert.deepEqual(
    clientState.exercises.map((item) => item.id),
    afterFirst,
  );
});

test("the migration keeps focus on the same item, not the same index", () => {
  const clientState = {
    activeExerciseIndex: 1,
    exercises: [
      { id: "a", name: "Bench Press", rest: 90 },
      { id: "b", name: "Barbell Row", rest: 0 },
    ],
    logs: {},
  };

  ensureRestItems(clientState);
  // "b" moved from index 1 to index 2 when the rest was inserted ahead of it.
  assert.equal(clientState.exercises[clientState.activeExerciseIndex].id, "b");
});

test("focus is clamped into range, and a rest is a valid place to land", () => {
  const plan = (index) => ({
    activeExerciseIndex: index,
    exercises: [{ id: "a" }, { id: "r", type: "rest", rest: 60 }],
  });

  const past = plan(7);
  clampFocusIndex(past);
  assert.equal(past.activeExerciseIndex, 1);

  const negative = plan(-1);
  clampFocusIndex(negative);
  assert.equal(negative.activeExerciseIndex, 1);

  // Already valid, and pointing at a rest — rests are first-class focus targets (TODO §8.6), so
  // this must not be "corrected" to the nearest exercise.
  const onRest = plan(1);
  clampFocusIndex(onRest);
  assert.equal(onRest.activeExerciseIndex, 1);

  // Nothing to clamp against; must not throw or invent an index.
  const empty = { activeExerciseIndex: 0, exercises: [] };
  clampFocusIndex(empty);
  assert.equal(empty.activeExerciseIndex, 0);
});
