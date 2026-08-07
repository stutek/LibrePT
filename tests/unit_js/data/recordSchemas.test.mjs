// tests/unit_js/data/recordSchemas.test.mjs
// The declared schema (TODO §18.1 / §18.4): recordSchemas.js's SCHEMA_2 is the first time "schema N"
// exists as data rather than as a side effect of whatever migrationSteps.js happens to produce, and
// recordProjections.js is the star-write model's projection layer for the one schema that is live
// today. This file is the proof that both are faithful to what the app ACTUALLY writes, not an
// idealized model: every seed fixture and every live writer's literal object shape (formsController's
// new-client form, feedbackModal's new-feedback form, finishWorkoutSession's history record) is
// reconstructed here and asserted to project and validate cleanly. A schema that only validates its
// own seed data would be worthless the first time a real trainer's form submission diverged from it.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as seeds from "../../../src/data/index.js";
import * as proj from "../../../src/data/recordProjections.js";
import * as m from "../../../src/data/recordSchemas.js";
import * as rec from "../../../src/domain/sessionItemRecord.js";

test("field issues catches missing required and wrong type", () => {
  const shape = {
    id: { required: true, type: "string" },
    active: { required: true, type: "boolean" },
  };
  const missing = m.fieldIssues({ id: "a1" }, shape);
  const wrongType = m.fieldIssues({ id: "a1", active: "yes" }, shape);
  const clean = m.fieldIssues({ id: "a1", active: true }, shape);

  assert.equal(
    missing.some((issue) => issue.includes("missing required field")),
    true,
  );
  assert.equal(
    wrongType.some((issue) => issue.includes("expected boolean")),
    true,
  );
  assert.deepEqual(clean, []);
});

test("undeclared fields are not an error", () => {
  // The store round-trips the whole object (TODO §16.3's invariant) — a field the shape does not
  // know about is forward-compatible data, not corruption.
  const shape = { id: { required: true, type: "string" } };
  const issues = m.fieldIssues({ id: "a1", fromTheFuture: "kept" }, shape);
  assert.deepEqual(issues, []);
});

test("nested array items are validated per element", () => {
  // history.exercises is an array of SESSION_ITEM-shaped entries — a malformed one must be
  // named with its index, not just fail the array field as a whole.
  const shape = {
    exercises: {
      required: true,
      type: "array",
      items: { id: { required: true, type: "string" } },
    },
  };
  const broken = { exercises: [{ id: "ok" }, {}] };
  const issues = m.fieldIssues(broken, shape);
  assert.equal(
    issues.some(
      (issue) => issue.includes("exercises[1]") && issue.includes("missing required field"),
    ),
    true,
  );
});

test("every seed collection projects and validates clean", () => {
  // The whole seed dataset — clients, exercises, routines, sessions, history, plan updates,
  // notifications — is what a clean demo install writes. None of it may fail its own schema.
  const collections = {
    clients: seeds.DEFAULT_CLIENTS,
    exercises: seeds.DEFAULT_EXERCISES,
    routines: seeds.DEFAULT_ROUTINES,
    sessions: seeds.DEFAULT_SESSIONS,
    history: seeds.DEFAULT_HISTORY,
    planUpdates: seeds.DEFAULT_PLAN_UPDATES,
    notifications: seeds.DEFAULT_MESSAGES,
  };

  const failures = [];
  for (const [collection, records] of Object.entries(collections)) {
    for (const record of records) {
      const issues = proj.projectionIssues(collection, record, m.SCHEMA_2);
      if (issues.length) failures.push({ collection, id: record.id, issues });
    }
  }
  const counts = Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, v.length]));

  assert.deepEqual(failures, []);
  // A schema that validated nothing because the seed arrays were empty would pass for free.
  assert.equal(
    Object.values(counts).every((count) => count > 0),
    true,
    JSON.stringify(counts),
  );
});

test("seed sessions also validate against schema 3", () => {
  // Schema 3 (TODO §7.3 item 8) requires `startDate` on every session — the seed data must
  // already carry it, not just satisfy the older, looser schema 2.
  const failures = [];
  for (const record of seeds.DEFAULT_SESSIONS) {
    const issues = proj.projectionIssues("sessions", record, m.SCHEMA_3);
    if (issues.length) failures.push({ id: record.id, issues });
  }
  assert.deepEqual(failures, []);
  assert.ok(seeds.DEFAULT_SESSIONS.length > 0);
});

test("a live created client validates clean", () => {
  // The exact object literal clientFormsController.js builds for a brand-new client — including
  // gdprConsent, which the seed fixtures never carry but every live-created client does.
  const newClient = {
    id: "c-new",
    name: "Alex Roe",
    avatar: "AR",
    joinedDate: "2026-07-27",
    email: "alex@example.com",
    phone: "+386 40 000 000",
    goals: "General fitness",
    weightHistory: [],
    notes: "",
    gdprConsent: { cloudSync: true, timestamp: "2026-07-27T10:00:00.000Z" },
    active: true,
  };
  const issues = proj.projectionIssues("clients", newClient, m.SCHEMA_2);
  assert.deepEqual(issues, []);
});

test("a live finished session history record validates clean", () => {
  // Reconstructs exactly what finishWorkoutSession pushes to state.history: a buildProgramSnapshot
  // output (already position-stamped per TODO §17.5) wrapped in the surrounding log fields.
  const clientState = {
    exercises: [
      { id: "e1", name: "Squat", setsTargetCount: 2, repsTarget: 5 },
      { type: "rest", rest: 60 },
    ],
    logs: { e1: [{ reps: 5, weight: 40, completed: true, note: "" }] },
  };
  const clientLog = {
    id: "h-new",
    clientId: "c1",
    clientName: "Jane Doe",
    routineName: "Upper Body A",
    date: new Date().toISOString(),
    duration: 1800,
    exercises: rec.buildProgramSnapshot(clientState),
    feedback: [{ id: "u-new", clientId: "c1", exerciseName: "Squat", tag: "ok", note: "" }],
  };
  const issues = proj.projectionIssues("history", clientLog, m.SCHEMA_2);
  // id/type/position are schema-optional (DEFAULT_HISTORY predates them and stays
  // valid) — but the CURRENT write path must carry all three on every item, rest
  // included, which is what this half of the test actually pins.
  const allHaveIdTypePosition = clientLog.exercises.every(
    (it) =>
      typeof it.id === "string" && typeof it.type === "string" && typeof it.position === "number",
  );
  assert.deepEqual(issues, []);
  assert.equal(allHaveIdTypePosition, true);
});

test("a live feedback submission validates clean", () => {
  // The exact object literal feedbackModal.js pushes to state.planUpdates.
  const newFeedback = {
    id: "u-live",
    clientId: "c1",
    clientName: "Jane Doe",
    date: new Date().toISOString(),
    exerciseName: "Barbell Bench Press",
    tag: "Too Easy - Increase Load",
    hasVoiceNote: false,
    resolved: false,
  };
  const issues = proj.projectionIssues("planUpdates", newFeedback, m.SCHEMA_2);
  assert.deepEqual(issues, []);
});

test("projecting into an undeclared collection fails loud", () => {
  const issues = proj.projectionIssues("not-a-real-collection", { id: "x" }, m.SCHEMA_2);
  assert.equal(
    issues.some((issue) => issue.includes("no schema declared")),
    true,
  );
});
