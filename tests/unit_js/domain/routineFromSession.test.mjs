// tests/unit_js/domain/routineFromSession.test.mjs
// A finished session becomes a routine (src/domain/routineFromSession.js): the prescription is kept,
// the day's magnitudes are stripped, and nothing in the routine points back at the record.

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRoutineFromRecord } from "../../../src/domain/routineFromSession.js";

const library = [
  { id: "sq", name: "Back Squat", modality: "strength" },
  { id: "bike", name: "Assault Bike", modality: "cardio", metric: "time" },
  { id: "row", name: "Barbell Row", modality: "strength" },
];
const PROVENANCE = "Saved from the session of {date}";

const set = (reps, weight) => ({ reps, weight, completed: true, note: "" });
const ex = (id, name, extra = {}) => ({
  type: "exercise",
  id,
  name,
  metric: "reps",
  completed: true,
  sets: [set(5, 100), set(5, 100), set(5, 100)],
  circuitId: null,
  ...extra,
});
const rest = (seconds, extra = {}) => ({
  type: "rest",
  id: `r${seconds}`,
  rest: seconds,
  ...extra,
});

const build = (log, routines = []) =>
  buildRoutineFromRecord({
    log: { performedAt: "2026-09-30T10:00:00", routineName: "Legs", ...log },
    library,
    routines,
    fallbackName: "Session",
    provenance: PROVENANCE,
  });

test("weights become 0 and the set count and reps target stay", () => {
  const { routine } = build({ exercises: [ex("sq", "Back Squat")] });
  assert.deepEqual(routine.exercises, [{ id: "sq", sets: 3, reps: 5, weight: 0, rest: 0 }]);
});

test("a time movement's magnitude is reset to the editor's empty reps value", () => {
  const bike = ex("bike", "Assault Bike", { metric: "time", sets: [set(1200, 0)] });
  const { routine } = build({ exercises: [bike] });
  assert.equal(routine.exercises[0].reps, 10);
  assert.equal(routine.exercises[0].sets, 1);
});

test("a rest item becomes the rest of the movement before it; a leading rest is dropped", () => {
  const { routine } = build({
    exercises: [rest(30), ex("sq", "Back Squat"), rest(60), rest(30), ex("row", "Barbell Row")],
  });
  assert.deepEqual(
    routine.exercises.map((e) => [e.id, e.rest]),
    [
      ["sq", 90],
      ["row", 0],
    ],
  );
});

test("circuit grouping is kept", () => {
  const circuit = { circuitId: "c1", circuitTitle: "Legs", circuitSeries: 3 };
  const { routine } = build({
    exercises: [ex("sq", "Back Squat", circuit), ex("row", "Barbell Row", circuit)],
  });
  for (const item of routine.exercises) {
    assert.equal(item.circuitId, "c1");
    assert.equal(item.circuitTitle, "Legs");
    assert.equal(item.circuitSeries, 3);
  }
});

test("an item outside the library is found by name, or left out and counted", () => {
  const { routine, omitted } = build({
    exercises: [
      ex("custom-id", "back  squat"),
      ex("nope", "Mystery Lift"),
      rest(45),
      ex("row", "Barbell Row"),
    ],
  });
  assert.deepEqual(
    routine.exercises.map((e) => e.id),
    ["sq", "row"],
  );
  assert.equal(omitted, 1);
  // The rest followed a left-out movement, so it belongs to nothing.
  assert.equal(routine.exercises[0].rest, 0);
});

test("a skipped movement is kept", () => {
  const skipped = ex("sq", "Back Squat", { completed: false });
  assert.equal(build({ exercises: [skipped] }).routine.exercises.length, 1);
});

test("name, date and soft provenance; a taken name gets a number; no link to the record", () => {
  // The record id carries a dash on purpose. The search below looks for it anywhere in the routine,
  // and a minted record id is 22 base62 characters — letters and digits only — so a short id like
  // "h1" is a string the generator can produce by chance. It did: this test failed in CI on
  // 2026-10-01 because the new routine's own id happened to contain "h1". A dash cannot appear in
  // one, so the search can only find a real link back to the record.
  const log = { id: "h1-record", exercises: [ex("sq", "Back Squat")] };
  const first = build(log).routine;
  assert.equal(first.name, "Legs 2026-09-30");
  assert.equal(first.description, "Saved from the session of 2026-09-30");
  assert.equal(build(log, [{ name: first.name }]).routine.name, "Legs 2026-09-30 (2)");
  assert.deepEqual(Object.keys(first).sort(), ["description", "exercises", "id", "name"]);
  assert.ok(!JSON.stringify(first).includes(log.id));
});

test("a record with no routine name uses the fallback", () => {
  const { routine } = build({ routineName: "", exercises: [] });
  assert.equal(routine.name, "Session 2026-09-30");
});

test("a record from an empty plan takes the session's title, not the empty-plan text", () => {
  const { routine } = buildRoutineFromRecord({
    log: {
      performedAt: "2026-09-30T10:00:00",
      routineName: "Empty plan, no routine",
      exercises: [ex("sq", "Back Squat")],
    },
    library,
    routines: [],
    fallbackName: "Session",
    emptyPlanName: "Empty plan, no routine",
    sessionTitle: "Tuesday group",
    provenance: PROVENANCE,
  });
  assert.equal(routine.name, "Tuesday group 2026-09-30");
});

test("an empty-plan record with no known session title falls back to the fallback name", () => {
  const { routine } = buildRoutineFromRecord({
    log: {
      performedAt: "2026-09-30T10:00:00",
      routineName: "Empty plan, no routine",
      exercises: [ex("sq", "Back Squat")],
    },
    library,
    routines: [],
    fallbackName: "New routine",
    emptyPlanName: "Empty plan, no routine",
    provenance: PROVENANCE,
  });
  assert.equal(routine.name, "New routine 2026-09-30");
});
