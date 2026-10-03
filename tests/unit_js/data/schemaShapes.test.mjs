// tests/unit_js/data/schemaShapes.test.mjs
// When a training changes shape (src/data/schemaShapes.js): on its way into memory from anything an
// older build wrote. Nothing writes the old shape since schemas 4 and 5 were retired.

import assert from "node:assert/strict";
import { test } from "node:test";

import { sessionInCurrentShape, toDomainState } from "../../../src/data/schemaShapes.js";

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

test("a session's two flags become its one status, and a held session is still found as held", () => {
  const at = { participants: ["ana"], startDate: "2026-09-01T09:30:00.000Z" };
  const state = toDomainState({
    sessions: [
      { id: "s-held", ...at, completed: true },
      { id: "s-off", ...at, cancelled: true },
      // Run, then taken off the board: cancelled is what the board must go on saying.
      { id: "s-both", ...at, completed: true, cancelled: true },
      { id: "s-next", ...at },
    ],
    history: [record],
  });
  assert.deepEqual(
    state.sessions.map((session) => [session.id, session.status]),
    [
      ["s-held", "done"],
      ["s-off", "cancelled"],
      ["s-both", "cancelled"],
      ["s-next", "scheduled"],
    ],
  );
  assert.equal(
    state.sessions.some((session) => "completed" in session || "cancelled" in session),
    false,
    "the old flags are gone",
  );
  // The old record is linked to the one session that was held that day.
  assert.equal(state.clientPrograms[0].sessionId, "s-held");
});

test("a session already carrying a status comes back as it is", () => {
  const session = { id: "s1", participants: [], status: "done" };
  assert.equal(sessionInCurrentShape(session), session);
});

test("a group of client ids from the first cut of schema 6 becomes a group of their programs", () => {
  const program = (id, clientId, sessionId) => ({
    id,
    clientId,
    sessionId,
    status: "planned",
    exercises: [],
  });
  const state = toDomainState({
    sessions: [],
    clientPrograms: [program("p-ana", "ana", "s1"), program("p-bor", "bor", "s1")],
    groupSharedPrograms: [
      { id: "s1-group-0", sessionId: "s1", clientIds: ["ana", "bor"] },
      // Only one member still has a program in the session: no group is left.
      { id: "s1-group-1", sessionId: "s1", clientIds: ["ana", "cene"] },
    ],
  });
  assert.deepEqual(state.groupSharedPrograms, [
    { id: "grp-p-ana", programIds: ["p-ana", "p-bor"] },
  ]);
});

test("a note from the first cut of schema 6 is read into its current fields on the way in", () => {
  const state = toDomainState({
    sessions: [],
    exerciseNotes: [
      { id: "n1", clientId: "ana", tag: "Too Hard - Reduce Load", resolved: false },
    ],
  });
  assert.deepEqual(state.exerciseNotes, [
    { id: "n1", clientId: "ana", tag: "too_hard", review: "pending" },
  ]);
});
