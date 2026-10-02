// tests/unit_js/data/trainingRecords.test.mjs
// The one way code reads and writes trainings (src/data/trainingRecords.js). What a caller depends
// on: it reads programs and notes whatever shape is stored, and what it writes reads back.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addPendingNote,
  allExerciseNotes,
  draftPrograms,
  feedbackFromNotes,
  noteById,
  noteTagLine,
  notesForProgram,
  pendingNotes,
  performedPrograms,
  programById,
  programDate,
  recordTrainings,
  removePendingNotes,
  removePrograms,
  resolveNote,
  saveDraft,
} from "../../../src/data/trainingRecords.js";

function finished(id, clientId, date, extra = {}) {
  return {
    id,
    clientId,
    date,
    duration: 1800,
    exercises: [{ id: `${id}-1`, type: "exercise", name: "Plank", sets: [] }],
    feedback: [],
    ...extra,
  };
}

function draft(id, clientId, extra = {}) {
  return finished(id, clientId, "2026-09-20T09:00:00.000Z", {
    isPlanning: true,
    title: "Next week",
    ...extra,
  });
}

test("a client's performed programs come newest first, without drafts or other clients", () => {
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-01T10:00:00.000Z"),
    finished("h2", "ana", "2026-09-08T10:00:00.000Z"),
    finished("h3", "bojan", "2026-09-09T10:00:00.000Z"),
    draft("d1", "ana"),
  ]);
  assert.deepEqual(
    performedPrograms(state, "ana").map((program) => program.id),
    ["h2", "h1"],
  );
  assert.equal(performedPrograms(state).length, 3);
  assert.equal(programDate(programById(state, "h1")), "2026-09-01T10:00:00.000Z");
});

test("a draft is saved once and then updated in place, keeping its id", () => {
  const state = {};
  const id = saveDraft(state, draft("d1", "ana"));
  const again = saveDraft(state, draft("d-new", "ana", { title: "Renamed" }), id);
  assert.equal(again, "d1");
  assert.deepEqual(
    draftPrograms(state).map((program) => [program.id, program.title]),
    [["d1", "Renamed"]],
  );
});

test("a client with two drafts has the one named by id updated, not the other", () => {
  const state = {};
  saveDraft(state, draft("d1", "ana"));
  recordTrainings(state, [draft("d2", "ana")]);
  saveDraft(state, draft("x", "ana", { title: "Second" }), "d2");
  assert.deepEqual(
    draftPrograms(state)
      .map((program) => [program.id, program.title])
      .sort(),
    [
      ["d1", "Next week"],
      ["d2", "Second"],
    ],
  );
});

test("a draft never overwrites another client's draft or a performed program", () => {
  const state = {};
  recordTrainings(state, [finished("h1", "ana", "2026-09-01T10:00:00.000Z")]);
  saveDraft(state, draft("d1", "ana", { title: "Ana draft" }));
  saveDraft(state, draft("d2", "bojan", { title: "Bojan draft" }));
  assert.deepEqual(
    draftPrograms(state)
      .map((program) => [program.clientId, program.title])
      .sort(),
    [
      ["ana", "Ana draft"],
      ["bojan", "Bojan draft"],
    ],
  );
  assert.equal(programById(state, "h1").status, "done");
});

test("a draft id that names no draft saves a new draft and returns its id", () => {
  // The clipboard keeps the returned id to address the same draft on its next save.
  const state = {};
  assert.equal(saveDraft(state, draft("d1", "ana"), "no-such-draft"), "d1");
  assert.deepEqual(
    draftPrograms(state).map((program) => program.id),
    ["d1"],
  );
});

test("a saved draft keeps the notes written on it", () => {
  const state = {};
  const note = { id: "n1", clientId: "ana", exerciseName: "Plank", tag: "Pain", note: "wrist" };
  saveDraft(state, draft("d1", "ana", { feedback: [note] }));
  saveDraft(state, draft("d-new", "ana", { feedback: [] }), "d1");
  assert.deepEqual(
    notesForProgram(state, "d1").map((entry) => entry.id),
    ["n1"],
  );
});

test("removed programs are gone, and the others stay", () => {
  const state = {};
  recordTrainings(state, [draft("d1", "ana"), draft("d2", "bojan")]);
  removePrograms(state, ["d1"]);
  assert.deepEqual(
    draftPrograms(state).map((program) => program.id),
    ["d2"],
  );
});

test("a pending note is listed until it is resolved, and is gone once removed", () => {
  const state = {};
  const update = {
    id: "n1",
    clientId: "ana",
    date: "2026-09-01T10:00:00.000Z",
    exerciseName: "Plank",
    tag: "Too Easy",
    resolved: false,
  };
  addPendingNote(state, update);
  assert.deepEqual(
    pendingNotes(state).map((note) => note.id),
    ["n1"],
  );

  resolveNote(state, "n1");
  assert.deepEqual(pendingNotes(state), []);
  assert.equal(noteById(state, "n1").resolved, true);

  removePendingNotes(state, ["n1"]);
  assert.equal(noteById(state, "n1"), null);
});

test("pending notes come in the order they were taken, wherever each one is filed", () => {
  // One note is also filed in a finished program and one is not; the list still runs oldest first.
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-12T10:00:00.000Z", {
      feedback: [{ id: "late", clientId: "ana", exerciseName: "Plank", tag: "Pain", note: "" }],
    }),
  ]);
  for (const [id, date] of [
    ["early", "2026-09-01T10:00:00.000Z"],
    ["late", "2026-09-12T10:00:00.000Z"],
  ]) {
    addPendingNote(state, {
      id,
      clientId: "ana",
      date,
      exerciseName: "Plank",
      tag: "Pain",
      resolved: false,
    });
  }
  assert.deepEqual(
    pendingNotes(state).map((note) => note.id),
    ["early", "late"],
  );
});

test("a note filed in a finished program is found with that program", () => {
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-01T10:00:00.000Z", {
      feedback: [{ id: "n1", clientId: "ana", exerciseName: "Plank", tag: "Pain", note: "wrist" }],
    }),
  ]);
  const [note] = notesForProgram(state, "h1");
  assert.equal(note.text, "wrist");
  assert.equal(note.programItemId, "h1-1");
  assert.equal(allExerciseNotes(state).length, 1);
});

test("a note's tag reads as the one line the feedback form stores, remark after the tag", () => {
  assert.equal(
    noteTagLine({ tag: "Too Hard - Reduce Load", text: "stopped at four" }),
    "Too Hard - Reduce Load - stopped at four",
  );
  assert.equal(noteTagLine({ tag: "Too Easy - Increase Load" }), "Too Easy - Increase Load");
  assert.equal(noteTagLine(null), "");
});

test("a program's notes come back as the feedback a live session keeps", () => {
  const state = {};
  recordTrainings(state, [
    finished("h1", "ana", "2026-09-01T10:00:00.000Z", {
      feedback: [{ id: "n1", clientId: "ana", exerciseName: "Plank", tag: "Pain", note: "wrist" }],
    }),
  ]);
  assert.deepEqual(feedbackFromNotes(notesForProgram(state, "h1")), [
    { id: "n1", clientId: "ana", exerciseName: "Plank", tag: "Pain", note: "wrist" },
  ]);
});
