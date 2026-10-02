// tests/unit_js/domain/participantBinding.test.mjs
// Several participants starting from ONE programme (src/domain/participantBinding.js).
//
// The promise (ruled 2026-10-02): a group records who started from the same plan. Every member gets
// that plan's prescription under the same item ids, and keeps their own plan object, place, sets and
// notes — people in one group move at different speeds. Changing one member's plan takes them out.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bindingFor,
  groupedClientRoutines,
  withBinding,
  withoutBinding,
} from "../../../src/domain/participantBinding.js";

const squat = {
  id: "e1",
  name: "Back Squat",
  setsTargetCount: 2,
  repsTarget: 5,
  weightTarget: 80,
  circuitId: "c1",
};
const rest = { id: "r1", type: "rest", rest: 90, circuitId: "c1" };

const janesPlan = () => ({
  routineId: "strength",
  routineName: "Jane's",
  activeExerciseIndex: 1,
  exercises: [structuredClone(squat), structuredClone(rest)],
  logs: { e1: [{ reps: 5, weight: 80, completed: true, note: "easy" }] },
});

const johnsPlan = () => ({
  routineId: "mobility",
  routineName: "John's",
  activeExerciseIndex: 3,
  exercises: [{ id: "m1", name: "Hip Opener", setsTargetCount: 1 }],
  logs: { m1: [{ reps: 10, weight: 0, completed: true, note: "" }] },
});

test("grouping gives a member the plan's prescription under the same ids, with no logged sets", () => {
  const routines = { jane: janesPlan(), john: johnsPlan() };

  const grouped = groupedClientRoutines(routines, {
    sourceId: "jane",
    memberIds: ["jane", "john"],
  });

  assert.deepEqual(
    grouped.john.exercises.map((item) => item.id),
    ["e1", "r1"],
    "the same item ids as the plan it was copied from",
  );
  assert.equal(grouped.john.exercises[0].circuitId, "c1");
  assert.equal(grouped.john.routineName, "Jane's");
  assert.deepEqual(grouped.john.logs, {
    e1: [
      { reps: 5, weight: 80, completed: false, note: "" },
      { reps: 5, weight: 80, completed: false, note: "" },
    ],
  });
  // Jane's own plan and what she logged in it are untouched.
  assert.equal(grouped.jane.logs.e1[0].completed, true);
});

test("each member keeps their own plan object, so a set logged lands for one member only", () => {
  const grouped = groupedClientRoutines(
    { jane: janesPlan(), john: johnsPlan() },
    { sourceId: "jane", memberIds: ["jane", "john"] },
  );
  assert.notEqual(grouped.john, grouped.jane);
  assert.notEqual(grouped.john.exercises[0], grouped.jane.exercises[0]);

  grouped.john.logs.e1[1].completed = true;
  grouped.john.exercises[0].weightTarget = 60;

  assert.equal(grouped.jane.logs.e1.length, 1, "John's set is not Jane's");
  assert.equal(grouped.jane.exercises[0].weightTarget, 80);
});

test("a member keeps their own place in the plan, inside its length", () => {
  const grouped = groupedClientRoutines(
    { jane: janesPlan(), john: johnsPlan() },
    { sourceId: "jane", memberIds: ["jane", "john"] },
  );
  assert.equal(grouped.john.activeExerciseIndex, 1, "John was at card 3 of a plan of 1");
  assert.equal(grouped.jane.activeExerciseIndex, 1);
});

test("what a joining member logged on an item the group's plan also has stays theirs", () => {
  const john = janesPlan();
  john.logs = { e1: [{ reps: 4, weight: 70, completed: true, note: "" }] };
  const grouped = groupedClientRoutines(
    { jane: janesPlan(), john },
    { sourceId: "jane", memberIds: ["jane", "john"] },
  );
  assert.deepEqual(grouped.john.logs.e1, [{ reps: 4, weight: 70, completed: true, note: "" }]);
});

test("members already grouped with the plan on screen keep what they logged", () => {
  const sarahs = janesPlan();
  sarahs.logs = { e1: [{ reps: 3, weight: 80, completed: true, note: "" }] };
  const grouped = groupedClientRoutines(
    { jane: janesPlan(), sarah: sarahs, john: johnsPlan() },
    { sourceId: "jane", memberIds: ["jane", "sarah", "john"], bindings: [["jane", "sarah"]] },
  );
  assert.equal(grouped.sarah, sarahs, "Sarah's plan object is the one she had");
  assert.equal(grouped.john.exercises[0].id, "e1", "John, who was not grouped, gets the plan");
});

test("a client's group is findable from either side", () => {
  const bindings = [["jane", "john"]];

  assert.deepEqual(bindingFor(bindings, "john"), ["jane", "john"]);
  assert.equal(bindingFor(bindings, "sarah"), null);
  assert.equal(bindingFor([], "jane"), null);
});

test("grouping is additive and never leaves someone in two groups at once", () => {
  const first = withBinding([], ["jane", "john"]);
  const second = withBinding(first, ["john", "sarah"]);

  assert.equal(second.length, 1);
  assert.deepEqual(second[0].sort(), ["jane", "john", "sarah"]);
});

test("a group of one is not a group", () => {
  assert.deepEqual(withBinding([], ["jane"]), []);
});

test("a member whose plan is changed leaves the group, and a group left with one ends", () => {
  // savePlanEdit (controllers/sessionPrograms.js) calls this for the client whose plan changed.
  assert.deepEqual(withoutBinding(withBinding([], ["a", "b", "c"]), "c")[0].sort(), ["a", "b"]);
  assert.deepEqual(withoutBinding(withBinding([], ["jane", "john"]), "john"), []);
});
