// tests/unit_js/data/recordSchemas.test.mjs
// The declared schema: recordSchemas.js's SCHEMA_4 is the first time "schema N"
// exists as data rather than as a side effect of whatever migrationSteps.js happens to produce, and
// recordProjections.js is the star-write model's projection layer for the one schema that is live
// today. This file is the proof that both are faithful to what the app ACTUALLY writes, not an
// idealized model: every seed fixture and every live writer's literal object shape (formsController's
// new-client form, feedbackModal's new-feedback form, finishWorkoutSession's history record) is
// reconstructed here and asserted to project and validate cleanly. A schema that only validates its
// own seed data would be worthless the first time a real trainer's form submission diverged from it.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as seeds from "../../../src/data/index.js";
import * as proj from "../../../src/data/recordProjections.js";
import * as m from "../../../src/data/recordSchemas.js";
import { CONVERTED_COLLECTIONS, toDomainState } from "../../../src/data/schemaShapes.js";
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
  // The store round-trips the whole object — a field the shape does not
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

test("every seed collection validates against EVERY live schema", () => {
  // The whole seed dataset — clients, exercises, routines, sessions, history, plan updates,
  // notifications — is what a clean demo install writes. None of it may fail any live schema.
  //
  // Ruled 2026-09-19 (Simon): the demo must work on the active schema and go on working the day
  // schema 5 is released. Walking LIVE_SCHEMAS rather than naming them is what makes that true by
  // itself — adding a schema makes this test demand the demo fit it, with nothing to remember.
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
  for (const [schema, shapes] of Object.entries(m.LIVE_SCHEMAS)) {
    for (const [collection, records] of Object.entries(collections)) {
      if (!proj.schemaAcceptsCollection(shapes, collection)) continue;
      for (const record of records) {
        const issues = proj.projectionIssues(collection, record, shapes);
        if (issues.length) failures.push({ schema, collection, id: record.id, issues });
      }
    }
  }
  const counts = Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, v.length]));

  assert.deepEqual(failures, []);
  assert.ok(
    Object.keys(m.LIVE_SCHEMAS).length > 0,
    "a schema registry with nothing in it proves nothing",
  );
  // A schema that validated nothing because the seed arrays were empty would pass for free.
  assert.equal(
    Object.values(counts).every((count) => count > 0),
    true,
    JSON.stringify(counts),
  );
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
  const issues = proj.projectionIssues("clients", newClient, m.SCHEMA_4);
  assert.deepEqual(issues, []);
});

test("a live finished session validates clean as the program it is stored as", () => {
  // Reconstructs exactly what finishWorkoutSession hands the store: a buildProgramSnapshot
  // output (already position-stamped) wrapped in the surrounding log fields.
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
  // Stored the way the write path stores it since schema 6: as that client's program, through the
  // one conversion every training goes through (data/trainingRecords.js).
  const [program] = toDomainState({ history: [clientLog], sessions: [] }).clientPrograms;
  const issues = proj.projectionIssues("clientPrograms", program, m.SCHEMA_6);
  // id/type/position are schema-optional on an old record (DEFAULT_HISTORY predates them) — but the
  // CURRENT write path must carry all three on every item, rest included, which is what this half
  // of the test actually pins.
  const allHaveIdTypePosition = clientLog.exercises.every(
    (it) =>
      typeof it.id === "string" && typeof it.type === "string" && typeof it.position === "number",
  );
  assert.deepEqual(issues, []);
  assert.equal(allHaveIdTypePosition, true);
});

test("a live feedback submission validates clean as the exercise note it is stored as", () => {
  // The exact object literal feedbackModal.js hands the store as a pending note.
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
  const [note] = toDomainState({ planUpdates: [newFeedback], sessions: [] }).exerciseNotes;
  const issues = proj.projectionIssues("exerciseNotes", note, m.SCHEMA_6);
  assert.deepEqual(issues, []);
});

test("projecting into an undeclared collection fails loud", () => {
  const issues = proj.projectionIssues("not-a-real-collection", { id: "x" }, m.SCHEMA_4);
  assert.equal(
    issues.some((issue) => issue.includes("no schema declared")),
    true,
  );
});

// --- A numbered shape does not move (ruled 2026-09-21 by the maintainer) ---
//
// Until this ruling, two rules in docs/DATA_MODEL.md disagreed: "a schema major is bumped only when
// a migration step is added" allowed an optional field to be added to schema 4, while "two files
// declaring the same numbered schema have the same shape by definition" said it could not. Schema 4
// gained fields four times under the first rule (`alias` on 2026-08-11; `startDate`, `seriesId`,
// `occurrenceDate`, `cancelled` in one later change; `completed`, `duration`, `titles`, `icon` in another), so
// "4" named four shapes and the second rule was simply false.
//
// The ruling settles it the other way: ANY change to a numbered shape — a field added, removed,
// retyped, or made required — mints a NEW schema number, even when the migration step that carries
// it does nothing. That makes the second rule true, and this is what makes it true rather than
// merely written down.
//
// The fixture is the frozen shape, captured the day of the ruling. **Never edit one.** A schema
// whose shape must change gets a new number and a new fixture beside this one; editing this file
// would silently un-freeze the shape it exists to hold still.
const FROZEN_SCHEMAS_DIR = fileURLToPath(new URL("../../fixtures/schemas/", import.meta.url));

// Which numbered schemas have a frozen shape on disk. A retired schema's fixture stays here after
// the schema leaves LIVE_SCHEMAS, because files stamped with that number are in the wild for ever.
function frozenShapeFor(schemaMajor) {
  return JSON.parse(readFileSync(`${FROZEN_SCHEMAS_DIR}schema_${schemaMajor}.json`, "utf-8"));
}

const numberedLiveSchemas = () => Object.keys(m.LIVE_SCHEMAS).filter((key) => /^\d+$/.test(key));

test("a numbered schema never moves: every live one still matches its frozen shape", () => {
  // The whole shape, not only its field names: a field turned required, or retyped from string to
  // number, changes what a file at this number promises just as much as a new field does.
  for (const schemaMajor of numberedLiveSchemas()) {
    assert.deepEqual(
      JSON.parse(JSON.stringify(m.LIVE_SCHEMAS[schemaMajor])),
      frozenShapeFor(schemaMajor),
      [
        `SCHEMA_${schemaMajor} has changed shape. A numbered schema is frozen: mint the`,
        "next number, declare the change there with a migration step that may do nothing, and",
        `freeze that number in its own fixture. Do not edit tests/fixtures/schemas/schema_${schemaMajor}.json.`,
      ].join(" "),
    );
  }
});

test("the schema every install reads declares everything any other live schema declares", () => {
  // Every install reads DEFAULT_READ_SCHEMA whatever app version it runs, and memory —
  // what a save, a backup and a sync are built from — holds only what that read brings in. A field
  // or collection some live schema declares and the read schema does not would be dropped from
  // memory at boot and from the next backup, and a restore of that backup would delete it.
  // The one exception is a collection every read of an older store converts into the read schema's
  // own (`history` and `planUpdates` into schema 6's programs and notes; sessionModelConversion
  // .test.mjs proves nothing is lost on the way and back).
  const read = m.LIVE_SCHEMAS[m.DEFAULT_READ_SCHEMA];
  const missing = [];
  for (const schemaMajor of numberedLiveSchemas()) {
    for (const [collection, shape] of Object.entries(m.LIVE_SCHEMAS[schemaMajor])) {
      if (!read[collection]) {
        if (!CONVERTED_COLLECTIONS.includes(collection)) {
          missing.push(`${schemaMajor}: collection ${collection}`);
        }
        continue;
      }
      for (const field of Object.keys(shape)) {
        if (!(field in read[collection])) missing.push(`${schemaMajor}: ${collection}.${field}`);
      }
    }
  }
  assert.deepEqual(
    missing,
    [],
    "a field leaves the read schema only with the last app version that uses it",
  );
  assert.equal(
    Math.max(...numberedLiveSchemas().map(Number)),
    m.DEFAULT_READ_SCHEMA,
    "the read schema is the newest numbered live schema",
  );
});

test("every live numbered schema is frozen on disk", () => {
  // The inverse mistake: cutting schema 5 and forgetting to freeze it would leave the new number
  // free to drift exactly as 4 did, and nothing here would notice.
  const unfrozen = [];
  for (const schemaMajor of Object.keys(m.LIVE_SCHEMAS)) {
    // PREVIEW is deliberately NOT frozen: it is the unnumbered staging shape, it may change on any
    // commit, and it is never a step in the migration chain (docs/DATA_MODEL.md §1). A field is
    // staged there and mints a number when it graduates.
    if (!/^\d+$/.test(schemaMajor)) continue;
    try {
      frozenShapeFor(schemaMajor);
    } catch {
      unfrozen.push(schemaMajor);
    }
  }
  assert.deepEqual(
    unfrozen,
    [],
    `live numbered schemas with no frozen shape: ${unfrozen.join(", ")} — add tests/fixtures/schemas/schema_<N>.json the day the schema is cut`,
  );
});

// A field NO live schema declares is still written whole into every store, because dropping unknown
// data from every store would lose it for good.
test("a field no live schema declares is kept in every store", () => {
  const exercise = { id: "x", name: "Sled Push", futureField: 1, collection: "exercises" };
  for (const schema of Object.keys(m.LIVE_SCHEMAS)) {
    assert.deepEqual(m.narrowToSchema(exercise, "exercises", schema), exercise);
  }
});

const NEW_SESSION_MODEL = [
  "clientPrograms",
  "groupSharedPrograms",
  "sessionAttendance",
  "exerciseNotes",
  "clientNotes",
];

test("the session model is schema 6, with the client's own notes still staged in PREVIEW", () => {
  // Cut into schema 6 on 2026-10-02; `clientNotes` waits in PREVIEW until a screen writes it.
  for (const collection of NEW_SESSION_MODEL.filter((name) => name !== "clientNotes")) {
    assert.ok(m.SCHEMA_6[collection], `${collection} is not in schema 6`);
  }
  assert.equal(m.SCHEMA_6.clientNotes, undefined, "client notes reached a numbered schema");
  assert.ok(m.SCHEMA_PREVIEW.clientNotes);
  // Schemas 4 and 5 are retired: nothing reads or writes their stores any more.
  assert.deepEqual(Object.keys(m.LIVE_SCHEMAS).sort(), ["6", "PREVIEW"]);
});

test("the records of one group training validate clean in the new session model", () => {
  // Ana and Bojan share one program in session s1, each with their own copy; Cene was sick.
  const squat = {
    id: "i1",
    exerciseId: "ex-squat",
    type: "exercise",
    position: 0,
    name: "Barbell Back Squat",
    sets: [{ reps: 5, weight: 62.5, completed: true }],
  };
  const records = {
    clientPrograms: [
      { id: "p1", clientId: "ana", sessionId: "s1", status: "done", exercises: [squat] },
      { id: "p2", clientId: "bojan", sessionId: "s1", status: "live", exercises: [squat] },
      // Unscheduled: Cene's plan waits for a new date.
      { id: "p3", clientId: "cene", status: "planned", exercises: [squat] },
    ],
    groupSharedPrograms: [{ id: "grp-p1", programIds: ["p1", "p2"] }],
    sessionAttendance: [
      {
        id: "a1",
        sessionId: "s1",
        clientId: "ana",
        programId: "p1",
        status: "attended",
        consumesQuota: true,
      },
      { id: "a2", sessionId: "s1", clientId: "cene", status: "sick", consumesQuota: false },
    ],
    exerciseNotes: [
      // A quick signal tapped on the clipboard has no text; a written remark has no tag.
      {
        id: "n1",
        clientId: "ana",
        programId: "p1",
        programItemId: "i1",
        tag: "too_easy",
        review: "pending",
      },
      {
        id: "n2",
        clientId: "ana",
        programId: "p1",
        programItemId: "i1",
        text: "Knees in on rep 4.",
        review: "none",
      },
    ],
    clientNotes: [
      {
        id: "c1",
        clientId: "ana",
        createdAt: "2026-10-02T08:00:00.000Z",
        text: "Prefers mornings.",
      },
    ],
  };
  for (const [collection, rows] of Object.entries(records)) {
    for (const row of rows) {
      assert.deepEqual(
        m.fieldIssues(row, m.SCHEMA_PREVIEW[collection]),
        [],
        `${collection} ${row.id}`,
      );
    }
  }
});

test("a status outside its words is refused, so a misspelt one cannot hide a training", () => {
  const program = { id: "p1", clientId: "ana", status: "Done", exercises: [] };
  assert.deepEqual(m.fieldIssues(program, m.SCHEMA_6.clientPrograms), [
    '`status` is "Done", expected one of planned, live, done, discarded',
  ]);
  const session = { id: "s1", participants: [], startDate: "2026-10-03T08:00:00.000Z" };
  assert.deepEqual(m.fieldIssues({ ...session, status: "completed" }, m.SCHEMA_6.sessions), [
    '`status` is "completed", expected one of scheduled, cancelled, done',
  ]);
  assert.deepEqual(m.fieldIssues({ ...session, status: "done" }, m.SCHEMA_6.sessions), []);
  const note = { id: "n1", clientId: "ana", review: "none" };
  assert.notDeepEqual(
    m.fieldIssues({ ...note, tag: "Too Easy - Increase Load" }, m.SCHEMA_6.exerciseNotes),
    [],
    "a note stores the tag's id, never its English text",
  );
});

test("a program item without its own id is refused, because a note could not point at it", () => {
  const item = { type: "exercise", name: "Plank" };
  const program = { id: "p1", clientId: "ana", status: "planned", exercises: [item] };
  assert.notDeepEqual(m.fieldIssues(program, m.SCHEMA_PREVIEW.clientPrograms), []);
});
