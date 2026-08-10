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

export const SCHEMA_2 = {
  clients: {
    id: { required: true, type: "string" },
    name: { required: true, type: "string" },
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
};

// Schema 3 (TODO §7.3 item 8 / migrationSteps.js's v2→v3 step): sessions gain a real absolute
// `startDate` timestamp, required from here on — everything else is unchanged from schema 2.
export const SCHEMA_3 = {
  ...SCHEMA_2,
  sessions: {
    ...SCHEMA_2.sessions,
    startDate: { required: true, type: "string" },
  },
};

// Every schema major this build still knows how to write. A build can only write schemas it knows
// how to project (TODO §18.1) — grows only when a schema is cut; never grows retroactively.
export const LIVE_SCHEMAS = { 2: SCHEMA_2, 3: SCHEMA_3 };

/**
 * The newest NUMBERED shape, and what a backup file is written at.
 *
 * A backup is not written at "P" on purpose (docs/DATA_MODEL.md §1): P's shape can change on any
 * commit, so a file written at it is restorable only by the exact build that produced it. A
 * numbered shape does not move, so any build can restore it.
 *
 * Only ONE shape goes into a file, not every live one. Shapes only gain fields under expand-first —
 * SCHEMA_3 is SCHEMA_2 plus `startDate` — so the newest is a strict superset of every older one,
 * and an older copy alongside it stores strictly less information at full size. Restore re-derives
 * every live store from whatever it receives, through the same fan-out that keeps them current.
 */
export const BACKUP_SCHEMA = Math.max(...Object.keys(LIVE_SCHEMAS).map(Number));

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
export const DEFAULT_READ_SCHEMA = 3;

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
