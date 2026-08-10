// tests/unit_js/data/demoDataRemoval.test.mjs
// Clearing the demo data once a trainer has started real work (src/data/demoDataRemoval.js).
//
// The scenario: they load the demo to evaluate LibrePT, add real clients, and now the fake people
// are a stain. The whole risk of the feature is deleting too much — a trainer's first real session
// is built out of the 48 seeded exercises, so a naive "remove everything seeded" empties the
// programme they just wrote. Every test here is about what must NOT be deleted.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as removal from "../../../src/data/demoDataRemoval.js";
import { DEFAULT_CLIENTS, DEFAULT_EXERCISES, DEFAULT_ROUTINES } from "../../../src/data/index.js";
import { SEED_PROVENANCE_FIELD, isSeedRecord } from "../../../src/data/seedProvenance.js";

const seedClient = DEFAULT_CLIENTS[0];
const seedExercise = DEFAULT_EXERCISES[0];
const seedRoutine = DEFAULT_ROUTINES[0];

// A 22-char base62 id, the shape recordId.js mints — deliberately NOT an 8-char one, so these read
// as the trainer's own records under either provenance test.
const realId = (suffix) => `${"0".repeat(22 - suffix.length)}${suffix}`;

function databaseWith(overrides = {}) {
  return {
    clients: [...DEFAULT_CLIENTS],
    exercises: [...DEFAULT_EXERCISES],
    routines: [...DEFAULT_ROUTINES],
    history: [],
    planUpdates: [],
    sessions: [],
    notifications: [],
    ...overrides,
  };
}

test("a seeded record is recognised by stamp or by committed id", () => {
  assert.equal(isSeedRecord("clients", seedClient), true);
  assert.equal(isSeedRecord("clients", { id: realId("mine"), name: "Real" }), false);
  // The stamp wins when present, including when it says false — a trainer's record that happens to
  // collide with a seed id is still theirs.
  assert.equal(isSeedRecord("clients", { ...seedClient, [SEED_PROVENANCE_FIELD]: false }), false);
  assert.equal(isSeedRecord("clients", { id: realId("x"), [SEED_PROVENANCE_FIELD]: true }), true);
});

test("the exercise catalog is kept by default", () => {
  // 48 seeded movements are a starter catalog, not a stain: the trainer's first real session is
  // built out of them.
  const plan = removal.planDemoRemoval(databaseWith());

  assert.deepEqual(plan.removals.exercises, []);
  assert.equal(plan.counts.exercises.keeping, true);
  assert.ok(plan.removals.clients.length > 0, "the fake people ARE removed");
});

test("a seeded exercise used by a real routine survives even when exercises are cleared too", () => {
  // The trainer explicitly asked to clear exercises as well, but one of them is in a programme they
  // wrote. Deleting it would leave that programme prescribing a movement that no longer exists.
  const realRoutine = {
    id: realId("rt"),
    name: "My Real Programme",
    exercises: [{ id: seedExercise.id, sets: 3, reps: 5 }],
  };
  const state = databaseWith({ routines: [...DEFAULT_ROUTINES, realRoutine] });

  const plan = removal.planDemoRemoval(state, { keepCollections: [] });

  assert.ok(!plan.removals.exercises.includes(seedExercise.id));
  assert.ok(
    plan.retained.some((entry) => entry.id === seedExercise.id && entry.collection === "exercises"),
  );
  assert.deepEqual(removal.brokenDependenciesAfter(state, plan), []);
});

test("a demo client the trainer has logged real training against survives", () => {
  // This is the renamed-demo-client case, settled without guessing at intent: a real history record
  // depends on the client, so the client is retained by the same rule as everything else.
  const state = databaseWith({
    history: [{ id: realId("h1"), clientId: seedClient.id, date: "2026-08-01T08:00:00.000Z" }],
  });

  const plan = removal.planDemoRemoval(state);

  assert.ok(!plan.removals.clients.includes(seedClient.id));
  assert.ok(plan.removals.clients.length > 0, "the other demo clients still go");
  assert.deepEqual(removal.brokenDependenciesAfter(state, plan), []);
});

test("retention reaches a fixpoint through a chain of dependencies", () => {
  // A real session → a demo routine → demo exercises. Rescuing the routine is worthless if the
  // exercises it prescribes are deleted underneath it, so retention has to propagate, not stop at
  // the first hop.
  const realSession = {
    id: realId("s1"),
    participants: [],
    routineId: seedRoutine.id,
    startDate: "2026-08-10T08:00:00.000Z",
  };
  const state = databaseWith({ sessions: [realSession] });

  const plan = removal.planDemoRemoval(state, { keepCollections: [] });
  const prescribedIds = seedRoutine.exercises.map((item) => item.id);

  assert.ok(!plan.removals.routines.includes(seedRoutine.id), "the routine is rescued");
  for (const exerciseId of prescribedIds) {
    assert.ok(
      !plan.removals.exercises.includes(exerciseId),
      `exercise ${exerciseId} must be rescued along with the routine that prescribes it`,
    );
  }
  assert.deepEqual(removal.brokenDependenciesAfter(state, plan), []);
});

test("an opted-out record is kept, and so is everything it depends on", () => {
  // The confirmation screen's escape hatch: a demo record the trainer edited into something real
  // that nothing else points at. Nothing can infer that, so they say so.
  const state = databaseWith();

  const plan = removal.planDemoRemoval(state, {
    keepCollections: [],
    keepIds: { routines: [seedRoutine.id] },
  });

  assert.ok(!plan.removals.routines.includes(seedRoutine.id));
  for (const item of seedRoutine.exercises) {
    assert.ok(!plan.removals.exercises.includes(item.id));
  }
  assert.deepEqual(removal.brokenDependenciesAfter(state, plan), []);
});

test("applying a plan removes exactly the planned ids and nothing else", () => {
  const realClient = { id: realId("c9"), name: "Real Client", active: true };
  const state = databaseWith({ clients: [...DEFAULT_CLIENTS, realClient] });

  const plan = removal.planDemoRemoval(state);
  const next = removal.applyDemoRemoval(state, plan);

  assert.ok(
    next.clients.some((client) => client.id === realClient.id),
    "a real client is never touched",
  );
  assert.equal(next.exercises.length, state.exercises.length, "kept collections are untouched");
  for (const id of plan.removals.clients) {
    assert.ok(!next.clients.some((client) => client.id === id));
  }
  // The input is not mutated — the caller still holds its own database until it saves.
  assert.equal(state.clients.length, DEFAULT_CLIENTS.length + 1);
});

test("a hand-edited plan that would orphan a record is detected", () => {
  // planDemoRemoval never produces one, but the plan is user-editable on the way to a confirmation
  // screen. This is the check that runs before any write.
  const realRoutine = {
    id: realId("rt"),
    name: "My Real Programme",
    exercises: [{ id: seedExercise.id, sets: 3, reps: 5 }],
  };
  const state = databaseWith({ routines: [...DEFAULT_ROUTINES, realRoutine] });

  const tampered = { removals: { exercises: [seedExercise.id] } };
  const broken = removal.brokenDependenciesAfter(state, tampered);

  // Every dependant is reported, the trainer's routine AND the seeded one that also prescribes it —
  // this checks the resulting DATABASE for orphans, not just the records the trainer authored.
  assert.ok(broken.some((entry) => entry.id === realRoutine.id));
  assert.ok(broken.some((entry) => entry.id === seedRoutine.id));
  for (const entry of broken) {
    assert.deepEqual(entry.missing, { collection: "exercises", id: seedExercise.id });
  }
});

test("a database with no demo data offers nothing to remove", () => {
  const own = {
    clients: [{ id: realId("c1"), name: "Real", active: true }],
    exercises: [],
    routines: [],
    history: [],
    planUpdates: [],
    sessions: [],
    notifications: [],
  };

  assert.equal(removal.hasRemovableDemoData(own), false);
  assert.equal(removal.hasRemovableDemoData(databaseWith()), true);
});
