// tests/unit_js/domain/sessionHistoryRecord.test.mjs
// A history record is written down two paths — once when a session is completed, and once on every
// cache sync while a PLANNING draft is being authored. They were built separately, agreeing only by
// hand, and the planning path is the one that runs on every keystroke.
//
// Two rules carry the weight:
//   • A session where nothing was performed writes NO record, but a planning draft always does —
//     one is a session that did not happen, the other is work the trainer authored on purpose.
//   • Re-authoring a draft UPDATES it and keeps its id. The id is what the notification feed and a
//     deep link are keyed on, so editing a draft must not invalidate a link to it.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSessionHistoryRecord,
  upsertPlanningRecord,
} from "../../../src/domain/sessionHistoryRecord.js";

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

test("re-authoring a draft updates it in place and keeps its id", () => {
  const history = [];
  const first = buildSessionHistoryRecord({
    ...base,
    duration: 0,
    isPlanning: true,
    title: "Draft",
  });
  upsertPlanningRecord(history, first);
  assert.equal(history.length, 1);

  const second = buildSessionHistoryRecord({
    ...base,
    clientState: { ...planWith(false), routineName: "Upper B" },
    duration: 0,
    isPlanning: true,
    title: "Draft renamed",
  });
  upsertPlanningRecord(history, second);

  assert.equal(history.length, 1, "one open draft per client, not one per keystroke");
  assert.equal(history[0].id, first.id, "the id a link is keyed on must survive an edit");
  assert.equal(history[0].routineName, "Upper B");
  assert.equal(history[0].title, "Draft renamed");
});

test("a draft never collides with another client's, or with completed history", () => {
  const completed = { id: "h-old", clientId: "c1", isPlanning: undefined, routineName: "Done" };
  const history = [completed];

  upsertPlanningRecord(
    history,
    buildSessionHistoryRecord({ ...base, duration: 0, isPlanning: true, title: "Ana draft" }),
  );
  upsertPlanningRecord(
    history,
    buildSessionHistoryRecord({
      ...base,
      client: { id: "c2", name: "Bo" },
      duration: 0,
      isPlanning: true,
      title: "Bo draft",
    }),
  );

  assert.equal(history.length, 3);
  assert.equal(
    history[0].routineName,
    "Done",
    "a completed record is never overwritten by a draft",
  );
  assert.deepEqual(
    history.filter((entry) => entry.isPlanning).map((entry) => entry.clientId),
    ["c1", "c2"],
  );
});

test("a named draft is edited in place even when the client holds several", () => {
  // Deleting a scheduled session leaves an unscheduled plan per participant, so a client who
  // already had a draft open now has two. Matched on clientId alone the sync would find whichever
  // came first and overwrite a plan the trainer never opened.
  const history = [];
  const older = buildSessionHistoryRecord({
    ...base,
    duration: 0,
    isPlanning: true,
    title: "Draft the trainer is not editing",
  });
  const rescued = buildSessionHistoryRecord({
    ...base,
    clientState: { ...planWith(false), routineName: "Rescued" },
    duration: 0,
    isPlanning: true,
    title: "From a deleted session",
  });
  history.push(older, rescued);

  const edit = buildSessionHistoryRecord({
    ...base,
    clientState: { ...planWith(false), routineName: "Rescued, reworked" },
    duration: 0,
    isPlanning: true,
    title: "From a deleted session",
  });
  const stored = upsertPlanningRecord(history, edit, rescued.id);

  assert.equal(history.length, 2, "editing one draft must not add or drop another");
  assert.equal(stored.id, rescued.id);
  assert.equal(history[1].routineName, "Rescued, reworked");
  assert.equal(history[0].routineName, "Upper A", "the untouched draft stays untouched");
});

test("an unrecognised draft id is a new draft, not a silent overwrite", () => {
  const history = [];
  const record = buildSessionHistoryRecord({
    ...base,
    duration: 0,
    isPlanning: true,
    title: "Draft",
  });
  const stored = upsertPlanningRecord(history, record, "no-such-draft");

  assert.equal(history.length, 1);
  assert.equal(stored.id, record.id, "the caller needs the stored record's id to address it again");
});
