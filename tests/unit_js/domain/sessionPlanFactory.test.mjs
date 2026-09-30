// tests/unit_js/domain/sessionPlanFactory.test.mjs
// Building a live plan is where a session's structure is either preserved or quietly lost. Two
// properties matter more than the field-by-field mapping:
//
//   1. ORDER. `activeExerciseIndex` points into `exercises` by index, so a snapshot must be read in
//      its own program order before the first item is pushed — sorting afterwards
//      would be too late, and a scrambled program passes every id-based integrity check we have.
//   2. STRUCTURE. Rests and prescribed-but-skipped movements survive the round trip.
//      Dropping them still yields a plausible-looking plan, which is exactly what makes it a bug
//      nobody notices.
//
// Reachable only through a booted app until the factory was moved into domain/.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  blankExercise,
  buildClientStateFromHistoryLog,
  buildClientStateFromImportedItems,
  buildClientStateFromLibraryCircuit,
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

test("each library circuit insertion gets independent slots, rounds and rest items", () => {
  const circuit = {
    id: "library",
    name: "Push and pull",
    series: 4,
    exercises: [
      { id: "ex-bench", reps: 8, weight: 30, rest: 45 },
      { id: "ex-bench", reps: 5, weight: 40 },
      { id: "ex-row", reps: 12, weight: 20 },
    ],
  };
  const before = structuredClone(circuit);
  const first = buildClientStateFromLibraryCircuit(circuit, CATALOG);
  const second = buildClientStateFromLibraryCircuit(circuit, CATALOG);
  assert.deepEqual(
    first.exercises.map((item) => item.name || item.type),
    ["Bench Press", "rest", "Bench Press", "Barbell Row"],
  );
  const allIds = [...first.exercises, ...second.exercises].map((item) => item.id);
  assert.equal(new Set(allIds).size, allIds.length);
  assert.notEqual(first.exercises[0].circuitId, second.exercises[0].circuitId);
  assert.equal(first.exercises[1].rest, 45);
  assert.deepEqual(
    first.logs[first.exercises[0].id],
    Array.from({ length: 4 }, () => ({
      reps: 8,
      weight: 30,
      completed: false,
      note: "",
    })),
  );
  first.exercises[0].repsTarget = 99;
  assert.equal(second.exercises[0].repsTarget, 8);
  assert.deepEqual(circuit, before);
});

test("an incomplete library circuit is refused rather than inserted partly", () => {
  assert.equal(
    buildClientStateFromLibraryCircuit({ exercises: [{ id: "missing" }] }, CATALOG),
    null,
  );
  assert.equal(buildClientStateFromLibraryCircuit({ exercises: [] }, CATALOG), null);
});

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

test("a movement a routine lists twice gets two slots, each with its own sets", () => {
  // A warm-up and a main block often share a movement. One id for both meant one log: the
  // warm-up's single set and the main block's three were the same record.
  const routines = [
    {
      id: "r1",
      name: "Warm-up then work",
      exercises: [
        { id: "ex-row", sets: 1, reps: 10, weight: 0, circuitId: "warm", circuitTitle: "Warm-up" },
        { id: "ex-bench", sets: 3, reps: 5, weight: 80 },
        { id: "ex-row", sets: 3, reps: 8, weight: 40, circuitId: "main", circuitTitle: "Main" },
      ],
    },
  ];

  const plan = buildClientStateFromRoutine({ routineId: "r1", routines, exercises: CATALOG });

  const [warm, , main] = plan.exercises;
  assert.equal(warm.id, "ex-row", "the first occurrence keeps the catalogue id, as every plan did");
  assert.notEqual(main.id, warm.id);
  assert.equal(main.exerciseId, "ex-row", "the second still knows which movement it is");
  assert.equal(main.name, "Barbell Row");
  assert.equal(plan.logs[warm.id].length, 1);
  assert.equal(plan.logs[main.id].length, 3);
  assert.equal(plan.logs[main.id][0].weight, 40);
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

  // Already valid, and pointing at a rest — rests are first-class focus targets, so
  // this must not be "corrected" to the nearest exercise.
  const onRest = plan(1);
  clampFocusIndex(onRest);
  assert.equal(onRest.activeExerciseIndex, 1);

  // Nothing to clamp against; must not throw or invent an index.
  const empty = { activeExerciseIndex: 0, exercises: [] };
  clampFocusIndex(empty);
  assert.equal(empty.activeExerciseIndex, 0);
});

test("a blank exercise has one empty log row per target set, in the circuit it joins", () => {
  // The editor and the deck's quick insert both start here; a log row count that differs from the
  // set target leaves a set the trainer cannot tick, or a tick with no set.
  const { planItem, logs } = blankExercise({
    id: "x1",
    circuitId: "c1",
    circuitTitle: "Core",
    circuitSeries: 2,
  });
  assert.equal(planItem.name, "");
  assert.equal(logs.length, planItem.setsTargetCount);
  assert.ok(logs.every((row) => row.reps === planItem.repsTarget && row.completed === false));
  assert.equal(logs[0] === logs[1], false, "each set is its own row");
  assert.deepEqual(
    [planItem.circuitId, planItem.circuitTitle, planItem.circuitSeries],
    ["c1", "Core", 2],
  );
  assert.deepEqual(blankExercise({ id: "x2" }).planItem.circuitId, null);
});

test("an imported programme becomes plan items with targets and logs, not raw import rows", () => {
  const set = (reps, weight) => ({ reps, weight, completed: false });
  const items = [
    {
      id: "tmp-1",
      type: "exercise",
      name: "  bench press ",
      exerciseId: "ex-bench",
      custom: false,
      sets: [set(5, 60), set(5, 60), set(5, 60), set(5, 60)],
    },
    { id: "tmp-2", type: "rest", rest: 120 },
    {
      id: "tmp-3",
      type: "exercise",
      name: "Push-Up",
      custom: true,
      sets: [set(12, 0), set(12, 0)],
    },
    {
      id: "tmp-4",
      type: "exercise",
      name: "Bench Press",
      exerciseId: "ex-bench",
      custom: false,
      sets: [set(8, 40)],
    },
  ];
  const state = buildClientStateFromImportedItems(items, CATALOG, "Upper");
  const [bench, rest, pushUp, benchAgain] = state.exercises;
  assert.equal(state.routineName, "Upper");
  assert.equal(bench.id, "ex-bench");
  assert.equal(bench.name, "Bench Press");
  assert.equal(bench.setsTargetCount, 4);
  assert.equal(bench.repsTarget, 5);
  assert.equal(bench.weightTarget, 60);
  assert.deepEqual(
    state.logs["ex-bench"].map((log) => [log.reps, log.weight]),
    [
      [5, 60],
      [5, 60],
      [5, 60],
      [5, 60],
    ],
  );
  assert.equal(rest.type, "rest");
  assert.equal(pushUp.name, "Push-Up");
  assert.equal(pushUp.id, "tmp-3");
  assert.equal(pushUp.setsTargetCount, 2);
  assert.equal(state.logs["tmp-3"].length, 2);
  assert.equal(benchAgain.exerciseId, "ex-bench");
  assert.notEqual(benchAgain.id, "ex-bench");
  assert.equal(state.logs[benchAgain.id][0].weight, 40);
});
