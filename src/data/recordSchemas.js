// src/data/recordSchemas.js — declared record shapes, per collection, per live schema major
// (TODO §18.1 / §18.4). Pure data: no domain knowledge, no IndexedDB, no migration logic.
//
// Until this module existed, "schema N" had no existence except as whatever migrationSteps.js
// happened to produce as a side effect of running the v1→v2 step — there was nothing a projection
// could target, and nothing for §18.4's staging guard to check either side against. This is that
// declaration: for every schema major this build still writes, the field set every collection's
// records must carry.
//
// Kept next to migrationSteps.js deliberately: a schema bump (a field's storage starts existing)
// and a migration step (data moves into that field) are always a matched pair under §18.4's
// expand-first rule — a field lands in a schema N release before the UI that writes it. Right now
// there is exactly one live schema, so there is nothing yet to stage a field ahead of; the
// declaration exists so that the day schema 3 is cut, staging has somewhere to write the field
// first and something for the CI guard to compare against.
//
// A field descriptor is `{ required, type }` — `type` one of "string" | "number" | "boolean" |
// "array" | "object", and an array field may add `items` (a nested field-shape, applied to every
// element — used by `history.exercises`, whose entries are sessionItemRecord.js's typed items).
// Deliberately not JSON-Schema-scale: the only two questions the staging guard and the projection
// tests need answered are "does this field exist in this schema" and "would writing the wrong
// JS type here be an outright error", not full validation — logging fields, tags and notes are
// free-form text the PT types, and holding them to a closed vocabulary here would be false rigor.

// Every SESSION_ITEM carries these on the CURRENT write path (TODO §17.1's flat typed array,
// TODO §17.5's explicit position). `exercise`-typed items additionally carry the exercise-only
// fields below; `rest`-typed items never do — but a shared shape validates cheaply as "field
// present or absent", and `type` is exactly the discriminator that already exists for readers to
// switch on.
//
// `id`, `type` and `position` are declared optional here even though every CURRENT writer sets
// them, because DEFAULT_HISTORY predates all three by design and stays valid on purpose: readers
// treat a missing `type` as "exercise" and a missing `position` as "keep array order" (both
// documented in sessionItemRecord.js / sessionItemOrder.js), which is real, decided back-compat —
// not a gap in this schema. Marking them required would make the fixture itself the failing case,
// which asserts nothing useful; the live-writer tests in test_record_schemas.py are what hold the
// CURRENT path to carrying all three.
const SESSION_ITEM_SHAPE = {
  id: { required: false, type: "string" },
  type: { required: false, type: "string" }, // "exercise" | "rest"
  position: { required: false, type: "number" }, // TODO §17.5 — dense 0..n-1, never array index
  circuitId: { required: false, type: "string" },
  circuitTitle: { required: false, type: "string" },
  circuitSeries: { required: false, type: "number" },
  // exercise-only:
  name: { required: false, type: "string" },
  loadUnit: { required: false, type: "string" },
  modality: { required: false, type: "string" },
  metric: { required: false, type: "string" },
  completed: { required: false, type: "boolean" },
  sets: { required: false, type: "array" },
  // rest-only:
  rest: { required: false, type: "number" },
};

export const SCHEMA_4 = {
  clients: {
    id: { required: true, type: "string" },
    name: { required: true, type: "string" },
    // How the trainer tells two same-named clients apart ("morning", "Novak", "with the knee").
    // Optional and free-form: gyms have two Jane Does, and every surface that must not confuse them
    // — the erasure confirmation, the data-export picker — needs something human to show alongside
    // an opaque id. Additive, so a record without it stays valid; declared here rather than only in
    // P so it reaches a backup (BACKUP_SCHEMA is 4 — see backupFile.js).
    alias: { required: false, type: "string" },
    avatar: { required: false, type: "string" },
    joinedDate: { required: false, type: "string" },
    email: { required: false, type: "string" },
    phone: { required: false, type: "string" },
    goals: { required: false, type: "string" },
    weightHistory: { required: false, type: "array" },
    notes: { required: false, type: "string" },
    hasInjury: { required: false, type: "boolean" },
    injury: { required: false, type: "string" },
    active: { required: true, type: "boolean" },
    gdprConsent: { required: false, type: "object" },
    // Set once an Art. 17 request has been honoured (clientErasure.js): `{ erasedAt, requestedOn }`.
    // Absent on every client who has not asked to be forgotten, which is nearly all of them.
    erasure: { required: false, type: "object" },
  },
  exercises: {
    id: { required: true, type: "string" },
    name: { required: true, type: "string" },
    category: { required: false, type: "string" },
    equipment: { required: false, type: "string" },
    pattern: { required: false, type: "string" },
    modality: { required: false, type: "string" },
    metric: { required: false, type: "string" },
    instructions: { required: false, type: "string" },
  },
  routines: {
    id: { required: true, type: "string" },
    name: { required: true, type: "string" },
    description: { required: false, type: "string" },
    exercises: { required: true, type: "array" },
  },
  sessions: {
    id: { required: true, type: "string" },
    time: { required: false, type: "string" },
    title: { required: false, type: "string" },
    location: { required: false, type: "string" },
    participants: { required: true, type: "array" },
    routineId: { required: false, type: "string" },
    maxCapacity: { required: false, type: "number" },
    day: { required: false, type: "string" },
    // The four fields below and the two collections at the end of this shape were declared only in
    // P until 2026-09-17, while every install already wrote them (TODO §61). Ruled that day
    // (Simon): schema 4 is the live schema and takes them, accepting that "4" then names a wider
    // shape than it did — no install or backup may lose them. `startDate` stays optional HERE only
    // because a schema-4 file written before it existed is still restored as schema 4.
    startDate: { required: false, type: "string" },
    // Which evening of which series this row SPEAKS FOR (TODO §35.3a). `occurrenceDate` is the date
    // the series originally scheduled, never the date the session was moved to: that is what makes
    // a second invitation a change to the same evening rather than a new one, and what lets the
    // board show a moved evening once instead of twice.
    seriesId: { required: false, type: "string" },
    occurrenceDate: { required: false, type: "string" },
    // A cancelled evening is a RECORD, not a deletion — the rule would simply produce it again.
    cancelled: { required: false, type: "boolean" },
  },
  history: {
    id: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    clientName: { required: false, type: "string" },
    routineId: { required: false, type: "string" },
    routineName: { required: false, type: "string" }, // soft ref, deliberately not an FK — §4
    date: { required: false, type: "string" },
    duration: { required: false, type: "number" },
    // The frozen program snapshot (TODO §17.1) — a flat typed array, every entry SESSION_ITEM-shaped.
    exercises: { required: true, type: "array", items: SESSION_ITEM_SHAPE },
    feedback: { required: false, type: "array" },
    isPlanning: { required: false, type: "boolean" },
    // The trainer-authored name of a planning-mode draft (e.g. "Upper Body Strength Draft") —
    // only meaningful alongside isPlanning:true; a real finished session has no use for it.
    title: { required: false, type: "string" },
  },
  planUpdates: {
    id: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    clientName: { required: false, type: "string" },
    date: { required: false, type: "string" },
    exerciseName: { required: false, type: "string" },
    tag: { required: false, type: "string" },
    hasVoiceNote: { required: false, type: "boolean" },
    resolved: { required: true, type: "boolean" },
  },
  // App chrome, not a trainer's business record: no clientId, no cross-session meaning, freely
  // reseeded. Declared for completeness with schemaMigrations.js's ARRAY_COLLECTIONS, not because
  // it carries the durability stakes the six collections above do.
  notifications: {
    id: { required: true, type: "string" },
    type: { required: false, type: "string" },
    titleKey: { required: false, type: "string" },
    descKey: { required: false, type: "string" },
    actions: { required: false, type: "array" },
  },
  // Invitations (TODO §1.6, decided 2026-08-17): an RSVP is a fact about an invitation — it was
  // sent, and this came back — not a property of a person or of a session. `sessions.participants`
  // stays the authoritative attendee list, and an attendee the trainer added by hand simply has no
  // invitation here.
  //
  // BY REFERENCE ONLY, deliberately: two ids and the facts about the message, with no name, email or
  // phone. That is what makes anonymisation cheap — erasing a client rewrites one client record and
  // leaves every invitation structurally valid, with nothing in it to redact.
  //
  // Declared first in P alone (Simon, 2026-08-17: "not modifying [schema 4] would actually test our
  // rollout plans"), which exposed that staging was a convention nobody enforced; it is enforced now
  // (stateStore.js's starWrite, backupFile.js). Moved into schema 4 on 2026-09-17 (TODO §61): installs
  // held it in the P store alone, so no backup carried an RSVP. previewTransfer.js brings over what
  // was written before.
  //
  // `answeredAt` and `sentAt` are INSTANTS — ISO-8601 UTC — never local calendar dates. A response
  // time is only comparable against a cutoff if both are absolute (Simon, 2026-08-17: record the
  // response time rather than marking a reply late).
  invites: {
    id: { required: true, type: "string" },
    sessionId: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    channel: { required: false, type: "string" },
    sentAt: { required: false, type: "string" },
    status: { required: true, type: "string" },
    answer: { required: false, type: "string" },
    answeredAt: { required: false, type: "string" },
  },
  // A session that repeats (TODO §35.3a): the RULE, not the evenings it produces. Fifty stored rows
  // for "Tuesdays and Thursdays at six" would make every later edit a fifty-row migration and would
  // make moving one evening indistinguishable from re-timing the lot, so occurrences are derived
  // (domain/sessionSeries.js) and only an evening something happened to becomes a `sessions` row.
  //
  // Moved from P into schema 4 with `invites` above, for the same reason (TODO §61).
  //
  // `weekdays` is JavaScript's own numbering (0 = Sunday), the same `getDay()` returns.
  sessionSeries: {
    id: { required: true, type: "string" },
    title: { required: false, type: "string" },
    startDate: { required: true, type: "string" },
    until: { required: false, type: "string" },
    time: { required: true, type: "string" },
    weekdays: { required: true, type: "array" },
    interval: { required: false, type: "number" },
    location: { required: false, type: "string" },
    participants: { required: false, type: "array" },
    routineId: { required: false, type: "string" },
    maxCapacity: { required: false, type: "number" },
  },
};

// The preview shape P: schema 4 with a session's `startDate` required (migrationSteps.js's v2→v3
// step derives it). Since 2026-09-17 nothing else differs — the fields and collections P alone
// used to declare moved into schema 4 (TODO §61).
export const SCHEMA_P = {
  ...SCHEMA_4,
  sessions: {
    ...SCHEMA_4.sessions,
    startDate: { required: true, type: "string" },
  },
};

// Every schema major this build still knows how to write. A build can only write schemas it knows
// how to project (TODO §18.1) — grows only when a schema is cut; never grows retroactively.
// ONE numbering across both axes. These used to be 2 and 3 on a "record schema" axis independent of
// `schemaVersion`'s migration axis — two systems using small integers for different things, which
// cost real time in review before it was collapsed. `4` here is the SAME 4 the migration chain ends
// at.
//
// Two shapes are live, and they do different jobs:
//   - **4** is the active schema (TODO §61): what this build reads and stamps, what a backup is
//     written at, and the copy P is rebuilt FROM when the build changes.
//   - **P** is the preview shape, still written so an install that chose to read it keeps working.
//     Disposable by design: never a source of truth for anything that has to outlive the build.
export const LIVE_SCHEMAS = { 4: SCHEMA_4, P: SCHEMA_P };

// The durable shape, and the one P is rebuilt from. Not derived from LIVE_SCHEMAS by taking a max:
// "P" is not a number, and the stable shape is a decision rather than an accident of ordering.
export const STABLE_SCHEMA = 4;

/**
 * The newest NUMBERED shape, and what a backup file is written at.
 *
 * A backup is not written at "P" on purpose (docs/DATA_MODEL.md §1): P's shape can change on any
 * commit, so a file written at it is restorable only by the exact build that produced it. A
 * numbered shape does not move, so any build can restore it.
 *
 * Only ONE shape goes into a file, not every live one. Shapes only gain fields under expand-first —
 * SCHEMA_P is SCHEMA_4 plus whatever the preview adds — so P is a superset of the stable shape,
 * and an older copy alongside it stores strictly less information at full size. Restore re-derives
 * every live store from whatever it receives, through the same fan-out that keeps them current.
 */
export const BACKUP_SCHEMA = STABLE_SCHEMA;

/**
 * The schema a fresh install READS from. Declared, never derived.
 *
 * It used to be `Math.max(...Object.keys(LIVE_SCHEMAS))`, which made the read target a function of
 * registry MEMBERSHIP: merely registering a shape silently relocated every read in the app. Those
 * are two independent facts — "this build can write shape N" and "this build reads shape N" — and
 * conflating them means a cutover can happen as a side effect of a one-line registry edit, with
 * nothing in the diff saying so.
 *
 * It is only the DEFAULT. Which schema a given install actually reads is a per-install choice the
 * trainer makes (data/readSchema.js): every live schema is written concurrently by the star-write
 * fan-out, so a newer one is already current and complete by the time it is offered, and moving
 * between them is a read re-point rather than a migration.
 */
// Schema 4 since 2026-09-17: the active schema (TODO §61). It was "P", the preview shape.
export const DEFAULT_READ_SCHEMA = 4;

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

// Structural problems for one record against one collection's field shape — empty means the
// record is acceptable. Checks presence of required fields and the JS type of whatever is present;
// says nothing about fields the record carries that the shape does not declare, because the store
// round-trips the whole object (§16.3's invariant) — an undeclared field is forward-compatible
// data, not an error.
export function fieldIssues(record, shape) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return ["record is not an object"];
  }
  const issues = [];
  for (const [field, spec] of Object.entries(shape)) {
    const present = record[field] !== undefined && record[field] !== null;
    if (!present) {
      if (spec.required) issues.push(`missing required field \`${field}\``);
      continue;
    }
    const actual = typeOf(record[field]);
    if (actual !== spec.type) {
      issues.push(`\`${field}\` is ${actual}, expected ${spec.type}`);
      continue;
    }
    if (spec.type === "array" && spec.items) {
      record[field].forEach((element, index) => {
        for (const nested of fieldIssues(element, spec.items)) {
          issues.push(`\`${field}[${index}]\`: ${nested}`);
        }
      });
    }
  }
  return issues;
}

export function isRecordValid(record, shape) {
  return fieldIssues(record, shape).length === 0;
}

// Every field name this shape declares, required or not — the input a staging-guard comparison
// (TODO §18.4) needs from BOTH the schema a field is proposed for and every currently-live schema.
export function fieldNamesOf(shape) {
  return Object.keys(shape);
}
