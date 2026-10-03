// tests/unit_js/domain/sessionHistoryRecord.test.mjs
// A history record is written down two paths — once when a session is completed, and once on every
// cache sync while a PLANNING draft is being authored. They were built separately, agreeing only by
// hand, and the planning path is the one that runs on every keystroke.
//
// The rule that carries the weight: a session where nothing was performed writes NO record, but a
// planning draft always does — one is a session that did not happen, the other is work the trainer
// authored on purpose. How a draft is stored and updated is data/trainingRecords.js's promise, tested
// with it.

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSessionHistoryRecord } from "../../../src/domain/sessionHistoryRecord.js";

const CLIENT = { id: "c1", name: "Ana" };

const planWith = (completed) => ({
  routineName: "Upper A",
  exercises: [
    { id: "ex-1", name: "Bench Press", setsTargetCount: 1 },
    { id: "r-1", type: "rest", rest: 60 },
  ],
  logs: { "ex-1": [{ reps: 5, weight: 80, completed, note: "" }] },
});

const base = {
  client: CLIENT,
  clientState: planWith(true),
  dateISO: "2026-08-07T10:00:00.000Z",
  duration: 3600,
};

test("a completed session records the whole program, rests included", () => {
  const record = buildSessionHistoryRecord(base);

  assert.equal(record.clientId, "c1");
  assert.equal(record.clientName, "Ana");
  assert.equal(record.routineName, "Upper A");
  assert.equal(record.duration, 3600);
  assert.equal(record.date, "2026-08-07T10:00:00.000Z");
  // The rest is not performed work, but dropping it would lose the program's structure.
  assert.equal(record.exercises.length, 2);
  assert.equal(
    record.exercises.some((item) => item.type === "rest"),
    true,
  );
  // Not a draft, so neither planning field is present at all.
  assert.equal("isPlanning" in record, false);
  assert.equal("title" in record, false);
});

test("a session where nothing was performed writes no record", () => {
  assert.equal(buildSessionHistoryRecord({ ...base, clientState: planWith(false) }), null);
  // Missing client or plan is the same answer, not a crash.
  assert.equal(buildSessionHistoryRecord({ ...base, client: null }), null);
  assert.equal(buildSessionHistoryRecord({ ...base, clientState: null }), null);
});

test("a client with a signal but no set ticked is recorded, with the signal", () => {
  // Too Hard deliberately ticks no set. Without a record the finish deleted the client's program,
  // and the signal, which is stored against that program, went with it.
  const record = buildSessionHistoryRecord({
    ...base,
    clientState: planWith(false),
    feedback: [
      { id: "f1", clientId: "c1", exerciseName: "Bench Press", tag: "Too Hard - Reduce Load" },
    ],
  });
  assert.notEqual(record, null);
  assert.deepEqual(
    record.feedback.map((entry) => entry.id),
    ["f1"],
  );

  // Another participant's signal does not make this client's empty session worth a record.
  const other = buildSessionHistoryRecord({
    ...base,
    clientState: planWith(false),
    feedback: [
      { id: "f2", clientId: "c2", exerciseName: "Bench Press", tag: "Too Hard - Reduce Load" },
    ],
  });
  assert.equal(other, null);
});

test("a planning draft is recorded even though nothing was performed", () => {
  const draft = buildSessionHistoryRecord({
    ...base,
    clientState: planWith(false),
    duration: 0,
    isPlanning: true,
    title: "Winter block wk3",
  });

  assert.notEqual(draft, null, "an authored draft is always worth keeping");
  assert.equal(draft.isPlanning, true);
  assert.equal(draft.title, "Winter block wk3");
  assert.equal(draft.duration, 0);
});

test("only the recipient's own feedback travels with their record", () => {
  const record = buildSessionHistoryRecord({
    ...base,
    feedback: [
      { id: "f1", clientId: "c1", exerciseName: "Bench Press", tag: "Too Hard - Reduce Load" },
      { id: "f2", clientId: "c2", exerciseName: "Bench Press", tag: "Too Easy - Increase Load" },
    ],
  });

  assert.deepEqual(
    record.feedback.map((entry) => entry.id),
    ["f1"],
    "another participant's feedback must not leak into this client's history",
  );
});
