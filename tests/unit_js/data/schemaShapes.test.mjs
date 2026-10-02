// tests/unit_js/data/schemaShapes.test.mjs
// When a training changes shape (src/data/schemaShapes.js): on its way into memory from anything an
// older build wrote. Nothing writes the old shape since schemas 4 and 5 were retired.

import assert from "node:assert/strict";
import { test } from "node:test";

import { toDomainState } from "../../../src/data/schemaShapes.js";

const record = {
  id: "h1",
  clientId: "ana",
  date: "2026-09-01T10:00:00.000Z",
  exercises: [{ id: "i1", type: "exercise", name: "Plank", sets: [] }],
  feedback: [],
};

test("an old-shape state reaches memory as programs and notes, with the old collections gone", () => {
  const state = toDomainState({
    clients: [{ id: "ana", name: "Ana" }],
    history: [record],
    planUpdates: [{ id: "u1", clientId: "ana", tag: "Pain", resolved: false }],
    sessions: [],
  });
  assert.equal("history" in state, false);
  assert.equal("planUpdates" in state, false);
  assert.deepEqual(
    state.clientPrograms.map((program) => program.id),
    ["h1"],
  );
  assert.deepEqual(
    state.exerciseNotes.map((note) => note.id),
    ["u1"],
  );
  assert.equal(state.clients[0].name, "Ana", "everything else is left as it was");
});

test("a state already in memory's shape is returned as it is", () => {
  const state = { clientPrograms: [], exerciseNotes: [], sessions: [] };
  assert.equal(toDomainState(state), state);
});

test("a record already in the new shape wins over a conversion with the same id", () => {
  // A page's unsaved copy written while the build changed can hold both shapes. The newer facts in
  // the new shape must not be overwritten by an older copy of the same training.
  const newer = { id: "h1", clientId: "ana", status: "done", title: "Edited later", exercises: [] };
  const state = toDomainState({ history: [record], clientPrograms: [newer], sessions: [] });
  assert.deepEqual(state.clientPrograms, [newer]);
});
