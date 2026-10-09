// src/data/recordSchemas.js — declared record shapes, per collection, per live schema major.
// Pure data: no domain knowledge, no IndexedDB, no migration logic.
//
// Until this module existed, "schema N" had no existence except as whatever migrationSteps.js
// happened to produce as a side effect of running the v1→v2 step — there was nothing a projection
// could target, and nothing for the staging guard to check either side against. This is that
// declaration: for every schema major this build still writes, the field set every collection's
// records must carry.
//
// Kept next to migrationSteps.js deliberately: a schema bump (a field's storage starts existing)
// and a migration step (data moves into that field) are always a matched pair under the
// expand-first rule — a field lands in a schema N release before the UI that writes it. Since
// 2026-09-21 the pair is mandatory in one direction too: a numbered shape is frozen, so a field
// change mints the next number and brings a migration step with it, even one that does nothing.
// SCHEMA_PREVIEW is where a field waits until it is ready for a number.
//
// A field descriptor is `{ required, type }` — `type` one of "string" | "number" | "boolean" |
// "array" | "object", and an array field may add `items` (a nested field-shape, applied to every
// element — used by `history.exercises`, whose entries are sessionItemRecord.js's typed items).
// A field whose every reader compares it with a fixed word adds `values`, the words it may hold:
// a status written "Done" instead of "done" would otherwise drop a training from every list that
// asks for "done", with no error anywhere.
// Deliberately not JSON-Schema-scale: the only two questions the staging guard and the projection
// tests need answered are "does this field exist in this schema" and "would writing the wrong
// JS type here be an outright error", not full validation — logging fields, tags and notes are
// free-form text the PT types, and holding them to a closed vocabulary here would be false rigor.

// Every SESSION_ITEM carries these on the CURRENT write path — a flat typed array with an
// explicit position on every item. `exercise`-typed items additionally carry the exercise-only
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
  position: { required: false, type: "number" }, // dense 0..n-1, never array index
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

// An item of a `clientPrograms` row (PREVIEW). `id` is required and names THIS item, so an
// exercise note can point at it; on a session item `id` is the clipboard row's and is sometimes
// absent. `exerciseId` is the catalogue exercise it was made from, while `name` keeps the name as
// it was, so a renamed or deleted catalogue exercise leaves the past readable.
const PROGRAM_ITEM_SHAPE = {
  ...SESSION_ITEM_SHAPE,
  id: { required: true, type: "string" },
  exerciseId: { required: false, type: "string" },
};

// Fields ANY record may carry, whatever its collection, so a shape does not have to repeat them.
// `testData` is the provenance stamp the seeder writes (data/seedProvenance.js) and `seededDemo` is
// what it was called before — both say "this row is sample or test data", which is true of a client
// and of a session alike and belongs to no one collection.
export const COMMON_RECORD_FIELDS = ["testData", "seededDemo"];

// **FROZEN. Do not add, remove, retype or re-require a field here** (ruled 2026-09-21 by
// the maintainer). A numbered shape does not move: any change to one mints the NEXT schema number
// and is declared there, with a migration step that is allowed to do nothing. That is what makes
// "two files declaring the same numbered schema have the same shape" true rather than aspirational —
// it was false four times over before the ruling (`alias`, the session fields added for invites and
// repeating sessions, and `completed`, `duration`, `titles` and `icon`), each one an optional field
// slipped into a shape already on trainers' devices.
//
// A field that is not ready for a number goes into SCHEMA_PREVIEW below, which is unnumbered and
// free to change on any commit.
//
// Held still by tests/fixtures/schemas/schema_4.json, which recordSchemas.test.mjs compares this
// against on every build. Editing that fixture to make a failure go away un-freezes the shape it
// exists to hold — mint the next number instead.
export const SCHEMA_4 = {
  clients: {
    id: { required: true, type: "string" },
    name: { required: true, type: "string" },
    // How the trainer tells two same-named clients apart ("morning", "Novak", "with the knee").
    // Optional and free-form: gyms have two Jane Does, and every surface that must not confuse them
    // — the erasure confirmation, the data-export picker — needs something human to show alongside
    // an opaque id. Additive, so a record without it stays valid; declared here rather than only in
    // P so it reaches a backup (a backup is written at a numbered schema — see backupFile.js).
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
    // Legacy, from before `bookings` was renamed to `sessions` (migrationSteps.js's 1 → 2): those
    // rows carried a `titles` array instead of a single `title`. Nothing reads it now, and it is
    // declared rather than dropped because a migration that deletes a trainer's own words to tidy a
    // shape is worse than a field nobody uses.
    titles: { required: false, type: "array" },
    // The four fields below and the two collections at the end of this shape were declared only in
    // P until 2026-09-17, while every install already wrote them. Ruled that day
    // (Simon): schema 4 is the live schema and takes them, accepting that "4" then names a wider
    // shape than it did — no install or backup may lose them. `startDate` stays optional HERE only
    // because a schema-4 file written before it existed is still restored as schema 4.
    startDate: { required: false, type: "string" },
    // Which evening of which series this row SPEAKS FOR. `occurrenceDate` is the date
    // the series originally scheduled, never the date the session was moved to: that is what makes
    // a second invitation a change to the same evening rather than a new one, and what lets the
    // board show a moved evening once instead of twice.
    seriesId: { required: false, type: "string" },
    occurrenceDate: { required: false, type: "string" },
    // A cancelled evening is a RECORD, not a deletion — the rule would simply produce it again.
    cancelled: { required: false, type: "boolean" },
    // Stamped when a session is finished (domain/sessionRecord.js) — how long it ran, in seconds,
    // beside the flag. Declared 2026-09-19: the app had been writing both into a shape
    // that did not know them.
    completed: { required: false, type: "boolean" },
    duration: { required: false, type: "number" },
  },
  history: {
    id: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    clientName: { required: false, type: "string" },
    routineId: { required: false, type: "string" },
    routineName: { required: false, type: "string" }, // soft ref, deliberately not an FK
    date: { required: false, type: "string" },
    duration: { required: false, type: "number" },
    // The frozen program snapshot — a flat typed array, every entry SESSION_ITEM-shaped.
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
    // The glyph the feed draws beside the message (data/messages.js). Declared 2026-09-19.
    icon: { required: false, type: "string" },
  },
  // Invitations (decided 2026-08-17): an RSVP is a fact about an invitation — it was
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
  // (stateStore.js's starWrite, backupFile.js). Moved into schema 4 on 2026-09-17: installs
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
  // A session that repeats: the RULE, not the evenings it produces. Fifty stored rows
  // for "Tuesdays and Thursdays at six" would make every later edit a fifty-row migration and would
  // make moving one evening indistinguishable from re-timing the lot, so occurrences are derived
  // (domain/sessionSeries.js) and only an evening something happened to becomes a `sessions` row.
  //
  // Moved from P into schema 4 with `invites` above, for the same reason.
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

// **FROZEN, like SCHEMA_4 above**, and held still by tests/fixtures/schemas/schema_5.json.
//
// Schema 4 plus what importing a trainer's own library needs (ruled 2026-09-23):
//   - `exercises.source` — who the exercise came from, as the trainer names it ("Ana Novak").
//     Trainers exchange catalogues, so any number of sources exist; absent on the trainer's own.
//   - `circuits` — a block of exercises the trainer reuses when building a plan. Offered only there,
//     never listed as a routine. `exercises` holds routine-style entries whose `id` is an exercise
//     id (recordDependencies.js reads it that way). `name` is required: an imported circuit that
//     arrives without a title is given one by the import (Simon, 2026-09-23).
//
// Declared as a spread of SCHEMA_4 on purpose: schema 5 only ADDS. Every field an older live schema
// declares must stay declared in the newest one (recordSchemas.test.mjs), because every install
// READS the newest numbered store (DEFAULT_READ_SCHEMA below) whatever app version it runs.
export const SCHEMA_5 = {
  ...SCHEMA_4,
  exercises: {
    ...SCHEMA_4.exercises,
    source: { required: false, type: "string" },
  },
  circuits: {
    id: { required: true, type: "string" },
    name: { required: true, type: "string" },
    series: { required: false, type: "number" },
    exercises: { required: true, type: "array" },
    source: { required: false, type: "string" },
  },
};

// **FROZEN, like SCHEMA_4 and SCHEMA_5 above**, and held still by tests/fixtures/schemas/schema_6.json.
//
// THE SESSION MODEL (ruled 2026-10-02, Simon). It replaces `history`, which held a plan not yet
// performed (`isPlanning`) and a training that happened in one shape, and `planUpdates`, which held
// a second copy of the notes inside it. A session (`sessions`) stays the booked slot; what each
// client does in it is a program of their own.
//
// The one numbered schema that does not only ADD: `history` and `planUpdates` are not here, and a
// session's `completed` and `cancelled` became its `status`. What they held is, in the fields and
// collections below, and every read of an older store or file converts it (schemaShapes.js), so
// reading this shape loses nothing an install holds.
const { history: _history, planUpdates: _planUpdates, ...SCHEMA_5_WITHOUT_TRAININGS } = SCHEMA_5;

// The words a status field may hold, one list per field. Readers compare with these exact words.
export const PROGRAM_STATUSES = ["planned", "live", "done", "discarded"];
// A session is "cancelled" when the trainer cancels it: the row stays on the board, shown weaker.
// "deleted" is only an evening of a repeating session the trainer deleted: its row has to stay, or
// the rule would produce that evening again, and the board does not show it. A deleted one-off has
// no row at all.
export const SESSION_STATUSES = ["scheduled", "cancelled", "done", "deleted"];
export const ATTENDANCE_STATUSES = ["attended", "noShow", "cancelled", "sick", "forceMajeure"];
export const NOTE_REVIEWS = ["none", "pending", "resolved"];
export const INVITE_STATUSES = ["sent", "answered"];

// The feedback tags, by the id a note stores, with the English text an older build stored instead.
// The text is how a record from `history`, `planUpdates` or the clipboard is read into a note
// (sessionModelConversion.js), and how a note is written back for the clipboard and the client's
// data export, which still speak the text. The words a trainer reads come from the dictionary
// (domain/feedbackTags.js).
export const FEEDBACK_TAG_TEXTS = {
  note: "Note",
  too_easy: "Too Easy - Increase Load",
  too_hard: "Too Hard - Reduce Load",
  form_break: "Form Break - Watch Position",
  joint_pain: "Joint Pain / Discomfort",
  progression: "Completed reps easily",
};

// A session of schema 6: one `status` instead of the two flags `completed` and `cancelled`, which
// allowed a session that was both. Which programs ran in it is on the programs; the session says
// only whether it was held, cancelled, deleted from its series or is still to come. `startDate` is required: migration step
// 2 → 3 gave one to every older session, and every writer sets it.
const {
  completed: _completed,
  cancelled: _cancelled,
  ...SESSION_5_WITHOUT_FLAGS
} = SCHEMA_5.sessions;

export const SCHEMA_6 = {
  ...SCHEMA_5_WITHOUT_TRAININGS,

  sessions: {
    ...SESSION_5_WITHOUT_FLAGS,
    startDate: { required: true, type: "string" },
    status: { required: true, type: "string", values: SESSION_STATUSES },
    // The instant the trainer tapped Finish, ISO-8601 in UTC. A session finished before this field
    // existed has none, and no conversion invents one.
    finishedAt: { required: false, type: "string" },
  },

  invites: {
    ...SCHEMA_5.invites,
    status: { required: true, type: "string", values: INVITE_STATUSES },
  },

  // ONE CLIENT'S PROGRAM. Every client has their own copy, also inside a group, because each one's
  // performed sets differ; a shared program is a `groupSharedPrograms` row, never one shared record.
  // A program belongs to zero or one session: none while it waits unscheduled, which is where a
  // client's cancellation moves it. One session holds many.
  //
  // `status` is "planned", "live", "done" or "discarded". "Unscheduled" is not a status: it is a
  // planned program with no `sessionId`. A program is never deleted (Simon, 2026-10-03): one the
  // trainer throws away is "discarded", kept in the database, the backup and the client's data
  // export, and shown in no list. `createdAt` is when it was written, `startedAt` when the trainer tapped
  // Start (the running clock counts from it) and `performedAt` when it became done, all ISO-8601 UTC
  // instants; a program converted from `history` may have no session, so it carries its own dates. It also keeps that record's id, so restoring the same old backup twice
  // overwrites rather than duplicates (data/sessionModelConversion.js).
  clientPrograms: {
    id: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    sessionId: { required: false, type: "string" },
    status: { required: true, type: "string", values: PROGRAM_STATUSES },
    createdAt: { required: false, type: "string" },
    startedAt: { required: false, type: "string" },
    performedAt: { required: false, type: "string" },
    duration: { required: false, type: "number" }, // seconds
    title: { required: false, type: "string" },
    routineId: { required: false, type: "string" },
    routineName: { required: false, type: "string" }, // soft ref, as on history
    exercises: { required: true, type: "array", items: PROGRAM_ITEM_SHAPE },
  },

  // WHICH PROGRAMS STARTED AS ONE, as a circuit groups exercises. Each member still has their own
  // `clientPrograms` row, their own tab and their own logged sets; this is only the grouping (ruled
  // 2026-10-02, Simon; domain/participantBinding.js). It names the programs, not the clients and a
  // session: who and where are on the programs, so they cannot disagree with them, and a plan with no
  // session can hold a group too. The id is made from the members (trainingRecords.js), never from a
  // place in a list: Drive sync merges by id, and an id taken from a position passes to another group
  // when one before it is removed.
  groupSharedPrograms: {
    id: { required: true, type: "string" },
    programIds: { required: true, type: "array" },
  },

  // ONE CLIENT AT ONE SESSION: whether they came, and whether it uses up a session of their package.
  // `consumesQuota` is stored, not derived from the status, because the trainer decides when a
  // cancellation counts.
  sessionAttendance: {
    id: { required: true, type: "string" },
    sessionId: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    programId: { required: false, type: "string" },
    status: { required: true, type: "string", values: ATTENDANCE_STATUSES },
    consumesQuota: { required: true, type: "boolean" },
  },

  // WHAT THE TRAINER NOTES ABOUT ONE EXERCISE OF ONE CLIENT'S PROGRAM: a quick signal tapped on the
  // clipboard (`tag`, an id of FEEDBACK_TAG_TEXTS), a written remark (`text`), or both. It replaces
  // the `feedback` array inside a history record and the `planUpdates` collection, which filed the
  // same note twice under one id. Linked by id, never by exercise name, which changes when an
  // exercise is renamed; `exerciseName` keeps the name as it was, as a program item does, because a
  // note written outside a session has no program item to point at. `review` says what the next plan
  // does with it: "none" — it only records what happened; "pending" — it waits on the Pending Review
  // screen; "resolved" — the trainer dealt with it there. No voice-note field: the coming schema
  // carries none (Simon, 2026-09-27).
  exerciseNotes: {
    id: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    programId: { required: false, type: "string" },
    programItemId: { required: false, type: "string" },
    exerciseId: { required: false, type: "string" },
    exerciseName: { required: false, type: "string" },
    createdAt: { required: false, type: "string" }, // ISO-8601 UTC instant, never a local date
    tag: { required: false, type: "string", values: Object.keys(FEEDBACK_TAG_TEXTS) },
    text: { required: false, type: "string" },
    review: { required: true, type: "string", values: NOTE_REVIEWS },
  },
};

// The PREVIEW shape: for CI and for previewing an upcoming version, never a step in the
// migration chain. It is provisioned and written like any live schema — Simon, 2026-09-17: PREVIEW
// uses the same mechanism as released schemas — and rebuilt from the stable schema when the build
// changes. It replaced "P", whose fields and collections moved into schema 4 the same day. Built on
// the NEWEST numbered shape, so reading it never narrows what an install holds.
export const SCHEMA_PREVIEW = {
  ...SCHEMA_6,

  // WHAT THE TRAINER NOTES ABOUT THE CLIENT AS A PERSON, one dated record each, meant to replace the
  // single free-text `clients.notes`, which every edit overwrites. Waits here until a screen writes
  // it: a frozen schema cannot change its mind about a shape nobody has used yet.
  clientNotes: {
    id: { required: true, type: "string" },
    clientId: { required: true, type: "string" },
    createdAt: { required: false, type: "string" }, // ISO-8601 UTC instant, never a local date
    text: { required: true, type: "string" },
  },

  // A collection ONLY this shape declares, so staging is always exercised by the real schemas: a
  // record of it goes into the PREVIEW store alone, a backup (written at a numbered schema) leaves it out, and a
  // restore names it as lost. Written by tests; no screen writes it, so an install never holds one.
  previewProbe: {
    id: { required: true, type: "string" },
    note: { required: false, type: "string" },
  },
};

// Every schema major this build still knows how to write. A build can only write schemas it knows
// how to project — grows only when a schema is cut; never grows retroactively.
// ONE numbering across both axes. These used to be 2 and 3 on a "record schema" axis independent of
// `schemaVersion`'s migration axis — two systems using small integers for different things, which
// cost real time in review before it was collapsed. `4` here is the SAME 4 the migration chain ends
// at.
//
// Two shapes are live, and they do different jobs:
//   - **6** is the active schema: what this build reads, writes and stamps, what a backup is
//     written at, and the copy PREVIEW is rebuilt FROM when the build changes.
//   - **PREVIEW** is the preview shape for CI and previews, written like any live schema and rebuilt
//     from 6 when the build changes. Disposable by design: never a source of truth for anything that
//     has to outlive the build, and never a step in the migration chain.
//
// Schemas 4 and 5 are RETIRED (ruled 2026-10-02, Simon): no build from this one on writes or reads
// their stores. SCHEMA_4 and SCHEMA_5 stay declared and frozen above, because the files and the old
// stores written in them still exist: a backup at format 4 or 5 is restored through the migration
// chain, and a phone's old store fills store 6 once on its first boot (readSchema.js).
export const LIVE_SCHEMAS = { 6: SCHEMA_6, PREVIEW: SCHEMA_PREVIEW };

// The durable shape, and the one PREVIEW is rebuilt from. Not derived from LIVE_SCHEMAS by taking a
// max: PREVIEW is not a number, and the stable shape is a decision rather than an accident of ordering.
export const STABLE_SCHEMA = 6;

/**
 * The newest NUMBERED shape, and what a backup file is written at.
 *
 * A backup is not written at PREVIEW on purpose (docs/DATA_MODEL.md §1): its shape can change on any
 * commit, so a file written at it is restorable only by the exact build that produced it. A
 * numbered shape does not move, so any build can restore it.
 *
 * Only ONE shape goes into a file, not every live one. Shapes only gain fields under expand-first —
 * SCHEMA_PREVIEW is SCHEMA_6 plus whatever the preview adds — a superset of the stable shape,
 * and an older copy alongside it stores no information the stable one does not (schema 6 holds what
 * `history` and `planUpdates` held, in its own collections). Restore re-derives
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
 * **Every install reads the newest numbered schema, whatever app version the trainer runs**
 * The app version decides how the app BEHAVES; it never narrows what is read. Reading an
 * older, narrower store would leave the data it cannot hold out of memory, and memory is what a save,
 * a backup and a Drive sync are built from — so a backup would lose it and a restore would delete it.
 * A per-install choice (data/readSchema.js) remains for the test passes that read PREVIEW or pin the
 * released shape; nothing offers it to a trainer.
 */
// Schema 6 since 2026-10-02. Schema 5 from 2026-09-23; schema 4 from 2026-09-17; before that "P".
export const DEFAULT_READ_SCHEMA = 6;

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

/**
 * Fields on `record` that `shape` does not declare — what a feature writing ahead of its schema looks
 * like (ruled 2026-09-17: the schema ships before or with the code that uses it).
 *
 * `collection` is the routing key the store adds, not a field of the record, and the common fields
 * above belong to every shape, so neither counts as undeclared.
 */
export function undeclaredFields(record, shape) {
  return undeclaredFieldsOf(record, shape);
}

/**
 * `record` as the store of live schema `schema` holds it: without the fields some OTHER live schema
 * declares for `collection` and this one does not.
 *
 * Without it every record went into every store whole, so schema 4's store received
 * `exercises.source`, a field only schema 5 declares — a field staged in a newer shape leaked into
 * the frozen one. Only a field KNOWN to a newer live schema is dropped: a field no live schema
 * declares is still written whole, because dropping it from every store would lose it for good.
 * A per-schema projector that also renames and retypes fields is the fuller version of this.
 */
export function narrowToSchema(record, collection, schema) {
  const newer = fieldsOnlyOthersDeclare(collection, schema);
  if (newer.size === 0) return record;
  return Object.fromEntries(Object.entries(record).filter(([field]) => !newer.has(field)));
}

/**
 * The fields `target`'s store holds for `collection` that the schema being READ does not declare —
 * so memory, built from the read store, never has them. A save must carry them over from
 * the row `target` already holds, or reading an older schema and saving once wipes them.
 */
export function fieldsHiddenFrom(readSchema, target, collection) {
  const read = LIVE_SCHEMAS[readSchema]?.[collection];
  // A collection the read schema does not declare is never in memory, so no save can overwrite it.
  if (!read) return [];
  return Object.keys(LIVE_SCHEMAS[target]?.[collection] || {}).filter((field) => !(field in read));
}

function fieldsOnlyOthersDeclare(collection, schema) {
  const own = LIVE_SCHEMAS[schema]?.[collection] || {};
  const others = new Set();
  for (const [key, shapes] of Object.entries(LIVE_SCHEMAS)) {
    if (String(key) === String(schema)) continue;
    for (const field of Object.keys(shapes[collection] || {})) {
      if (!(field in own)) others.add(field);
    }
  }
  return others;
}

function undeclaredFieldsOf(record, shape) {
  if (!record || !shape) return [];
  return Object.keys(record).filter(
    (field) => field !== "collection" && !COMMON_RECORD_FIELDS.includes(field) && !(field in shape),
  );
}

// Structural problems for one record against one collection's field shape — empty means the
// record is acceptable. Checks presence of required fields and the JS type of whatever is present;
// says nothing about fields the record carries that the shape does not declare, because the store
// round-trips the whole object — an undeclared field is forward-compatible
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
    if (spec.values && !spec.values.includes(record[field])) {
      issues.push(`\`${field}\` is "${record[field]}", expected one of ${spec.values.join(", ")}`);
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
// needs from BOTH the schema a field is proposed for and every currently-live schema.
export function fieldNamesOf(shape) {
  return Object.keys(shape);
}
