// tests/unit_js/data/starWriteInvariants.test.mjs
// The CD-pipeline invariants TODO §18.13 asks for around §18.4's staging guard: expand-first schema
// evolution, projections that are pure/total (idempotent + invertible), and the specific loss
// scenario staging exists to prevent — an older schema's UI writing a record the newest schema
// requires more of. recordSchemas.test.mjs covers the single-schema half (real writer shapes
// against the schema they were built for); this file is the cross-schema half.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as proj from "../../../src/data/recordProjections.js";
import * as schemas from "../../../src/data/recordSchemas.js";
import * as rec from "../../../src/domain/sessionItemRecord.js";

// Real object literals the app's write path actually builds — mirrors recordSchemas.test.mjs's
// live-writer fixtures, reused here across every live schema rather than just one.
function buildLiveWriters() {
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
  return { clients: newClient, planUpdates: newFeedback, history: clientLog };
}

test("schema evolution is additive never drops a field", () => {
  // Expand-first (TODO §18.4): a field lands in every live schema before the UI that writes it
  // ever ships, so a live schema's declared field set may only grow release over release, never
  // shrink — a field disappearing would silently break every OLDER build still writing it.
  const older = schemas.SCHEMA_4;
  const newer = schemas.SCHEMA_P;
  const dropped = [];
  for (const collection of Object.keys(older)) {
    const newerShape = newer[collection];
    if (!newerShape) {
      dropped.push(`${collection}: whole collection`);
      continue;
    }
    for (const field of schemas.fieldNamesOf(older[collection])) {
      if (!(field in newerShape)) dropped.push(`${collection}.${field}`);
    }
  }
  assert.deepEqual(dropped, [], `fields dropped between live schemas (never allowed): ${dropped}`);
});

test("every live writer shape validates against every live schema", () => {
  // The staging guard itself: every real object literal the write path builds must satisfy
  // EVERY live schema's required fields, not only the one it happened to be checked against first —
  // this is what makes writing into a newly-cut schema safe on day one, rather than discovered by a
  // trainer on a downgrade.
  const liveWriters = buildLiveWriters();
  const failures = [];
  for (const [schemaMajor, schema] of Object.entries(schemas.LIVE_SCHEMAS)) {
    for (const [collection, record] of Object.entries(liveWriters)) {
      const issues = proj.projectionIssues(collection, record, schema);
      if (issues.length) failures.push({ schema: schemaMajor, collection, issues });
    }
  }
  assert.deepEqual(failures, []);
});

test("projections are idempotent and invertible", () => {
  // "Projections must be pure and total" (TODO §18.4) made concrete: projecting twice is the same
  // as once, and un-projecting a projection recovers the exact domain object — together, what lets a
  // bucket be re-derived by re-projection rather than restored from a backup.
  const liveWriters = buildLiveWriters();
  const failures = [];
  for (const [collection, record] of Object.entries(liveWriters)) {
    const once = proj.projectCollection(collection, record);
    const twice = proj.projectCollection(collection, once);
    if (JSON.stringify(once) !== JSON.stringify(twice)) {
      failures.push({ collection, check: "idempotent" });
    }
    const restored = proj.toDomainObject(once);
    if (JSON.stringify(restored) !== JSON.stringify(record)) {
      failures.push({ collection, check: "invertible" });
    }
  }
  assert.deepEqual(failures, []);
});

test("an older schemas writer missing a newer required field is caught", () => {
  // The specific loss scenario staging exists to prevent (TODO §18.4): a session literal shaped
  // exactly like what schema 4's UI wrote — no `startDate` at all, since schema 4 never declared the
  // field — must fail schema P's projection, which requires it. If this ever silently passed, a
  // star write from an old cached build would plant an invalid record in the newest bucket.
  const oldSession = {
    id: "s-old",
    time: "09:00 - 10:00",
    title: "",
    location: "",
    participants: ["c1"],
    routineId: "r1",
    maxCapacity: 4,
    day: "today",
    // deliberately no startDate — schema 4 never declared it.
  };
  const againstSchema2 = proj.projectionIssues("sessions", oldSession, schemas.SCHEMA_4);
  const againstSchema3 = proj.projectionIssues("sessions", oldSession, schemas.SCHEMA_P);

  assert.deepEqual(
    againstSchema2,
    [],
    "schema 4 never required startDate — this must validate clean",
  );
  assert.equal(
    againstSchema3.some((issue) => issue.includes("startDate")),
    true,
    "schema P requires startDate — an old-shaped record must be caught, not silently accepted",
  );
});

// --- Staging is enforced, not merely intended (TODO §18.4). Decided 2026-08-17: a new collection goes
// into the PREVIEW schema first, because doing it that way "would actually test our rollout plans".
// It did — it found that nothing enforced the boundary. These are that enforcement. ---

test("a schema declares which collections belong in it, and preview-only ones are not in the stable shape", () => {
  // `invites` is the first preview-only collection. The point of the pair is that the two shapes
  // genuinely differ — if this ever passes trivially, staging has stopped being exercised.
  assert.ok(schemas.SCHEMA_P.invites, "P declares invites");
  assert.equal(schemas.SCHEMA_4.invites, undefined, "4 does not");
});

test("a record is written only to schemas that declare its collection", () => {
  // The invariant the fan-out has to hold. Before this, every projected record went into every live
  // store regardless — so a preview-only collection was preview-only in name and durable in fact.
  assert.equal(proj.schemaAcceptsCollection(schemas.SCHEMA_P, "invites"), true);
  assert.equal(proj.schemaAcceptsCollection(schemas.SCHEMA_4, "invites"), false);
  // Everything that is not preview-only still goes everywhere, or staging would have quietly become
  // a way to lose ordinary records.
  for (const collection of ["clients", "sessions", "history", "planUpdates"]) {
    assert.equal(proj.schemaAcceptsCollection(schemas.SCHEMA_4, collection), true, collection);
    assert.equal(proj.schemaAcceptsCollection(schemas.SCHEMA_P, collection), true, collection);
  }
});

test("the collections a backup carries come from the schema it is written at, not from what happens to be projectable", () => {
  // This is the half that had no enforcement at all: backupFile walked the PROJECTOR table, which
  // knows nothing about schemas, so anything projectable rode into the file whatever shape it
  // belonged to.
  const carried = proj.collectionsForSchema(schemas.LIVE_SCHEMAS[schemas.BACKUP_SCHEMA]);

  assert.equal(carried.includes("invites"), false, "a preview-only collection is not in a backup");
  assert.ok(carried.includes("clients"));
  assert.ok(carried.includes("sessions"));
});

test("every projectable collection is declared by at least one live schema", () => {
  // The inverse mistake: a projector with no schema anywhere would write records nothing validates,
  // and the new filter would silently drop them into no store at all.
  for (const collection of proj.COLLECTIONS) {
    const declaredSomewhere = Object.values(schemas.LIVE_SCHEMAS).some((schema) =>
      proj.schemaAcceptsCollection(schema, collection),
    );
    assert.ok(declaredSomewhere, `${collection} is declared by no live schema`);
  }
});
