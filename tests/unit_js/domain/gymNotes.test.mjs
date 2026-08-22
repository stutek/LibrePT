// tests/unit_js/domain/gymNotes.test.mjs
// What the floor already said about one client (src/domain/gymNotes.js) — TODO §35.3c/d.
//
// The promise: a signal or note taken one-handed mid-circuit comes back at the moment the trainer
// plans that client's next session, and the ones about movements in the plan they are looking at
// come back FIRST. Nothing here touches a DOM — the panel that shows this is
// modules/clipboard/activeSessionBoard.js.

import assert from "node:assert/strict";
import { test } from "node:test";
import { gymNotesForPlan, notesWithGymNote } from "../../../src/domain/gymNotes.js";

const UPDATES = [
  {
    id: "u1",
    clientId: "jane",
    exerciseName: "Barbell Back Squat",
    tag: "Too Hard - Reduce Load",
    date: "2026-08-01T10:00:00.000Z",
    resolved: false,
  },
  {
    id: "u2",
    clientId: "jane",
    exerciseName: "Deadlift",
    tag: "Form Break - Watch Position - hips rise first",
    date: "2026-08-10T10:00:00.000Z",
    resolved: false,
  },
  {
    id: "u3",
    clientId: "jane",
    exerciseName: "Barbell Bench Press",
    tag: "Too Easy - Increase Load",
    date: "2026-08-12T10:00:00.000Z",
    resolved: true,
  },
  {
    id: "u4",
    clientId: "john",
    exerciseName: "Deadlift",
    tag: "Too Easy - Increase Load",
    date: "2026-08-11T10:00:00.000Z",
    resolved: false,
  },
];

const forJane = (planExerciseNames) =>
  gymNotesForPlan({ planUpdates: UPDATES, clientId: "jane", planExerciseNames });

test("only this client's floor notes come back", () => {
  assert.deepEqual(
    forJane([]).map((note) => note.id),
    ["u2", "u1"],
  );
});

test("a note the trainer already acted on stays gone", () => {
  // Resolved means dealt with. Showing it again while planning is asking the same question twice,
  // which is how a review pane teaches people to stop reading it.
  assert.ok(!forJane([]).some((note) => note.id === "u3"));
});

test("what the plan on screen is about comes first", () => {
  // §35.3d's whole claim: the deadlift note resurfaces when the deadlift is next programmed for
  // this client. Newest-first ordering alone would bury it under an unrelated signal.
  const notes = forJane(["Barbell Back Squat"]);

  assert.deepEqual(
    notes.map((note) => note.id),
    ["u1", "u2"],
  );
  assert.equal(notes[0].inThisPlan, true);
  assert.equal(notes[1].inThisPlan, false);
});

test("within each group the newest is first", () => {
  const notes = forJane(["Barbell Back Squat", "Deadlift"]);

  assert.deepEqual(
    notes.map((note) => note.id),
    ["u2", "u1"],
  );
});

test("a movement is matched by name, whatever case it was typed in", () => {
  // The plan's items and a logged signal both carry a NAME, and the two are typed and edited
  // independently — a catalog swap can recase one of them.
  const notes = forJane(["barbell back squat"]);

  assert.equal(notes[0].id, "u1");
  assert.equal(notes[0].inThisPlan, true);
});

test("nothing logged yet is an empty list, not a failure", () => {
  assert.deepEqual(
    gymNotesForPlan({ planUpdates: [], clientId: "jane", planExerciseNames: [] }),
    [],
  );
  assert.deepEqual(gymNotesForPlan({}), []);
});

test("a note kept on the record is added to what the trainer already wrote", () => {
  // §35.3c: it has to reach the CLIENT record, because that is the text the next plan is written
  // against — and it must not replace notes the trainer typed themselves.
  const notes = notesWithGymNote("Prefers morning sessions.", {
    on: "2026-08-21",
    exerciseName: "Deadlift",
    tag: "Joint Pain / Discomfort - left knee",
  });

  assert.match(notes, /Prefers morning sessions\./);
  assert.match(notes, /2026-08-21/);
  assert.match(notes, /Deadlift/);
  assert.match(notes, /left knee/);
});

test("a client with no notes yet gets the line and nothing else", () => {
  const notes = notesWithGymNote("", { on: "2026-08-21", exerciseName: "Deadlift", tag: "sore" });

  assert.ok(!notes.startsWith("\n"));
  assert.equal(notes.split("\n").length, 1);
});

test("nothing to say leaves the record exactly as it was", () => {
  assert.equal(notesWithGymNote("Existing.", { on: "2026-08-21" }), "Existing.");
});
