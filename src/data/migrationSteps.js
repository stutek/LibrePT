// src/data/migrationSteps.js — the ordered schema-migration chain (TODO §16.2).
// Single responsibility: WHAT changes between two adjacent schema versions. The runner that walks
// this chain, validates each step's output and reports a summary lives in data/schemaMigrations.js.
//
// A PT can sit on one version for months while several ship, so upgrading walks a SEQUENCE of small
// per-version transforms (v1→v2→v3…) rather than one big direct conversion. Each step is a pure
// `(state) => state` on a private clone: no I/O, no globals, no reaching into localStorage — that
// is what makes the chain testable and re-runnable.
//
// Adding a step: append it, bump CURRENT_SCHEMA_VERSION to its `to`, and give it notes describing
// what actually moved — the notes are what the PT is shown before committing to an upgrade.
// Injected dependencies: none.

// Legacy databases predate the field entirely; anything without a `schemaVersion` is version 1.
//
// A literal `schemaVersion: 0` means the same thing and is read the same way (schemaMigrations.js's
// `detectSchemaVersion` only honours integers ABOVE zero). There is no 0→1 step and there must not
// be one invented: "0" is a NAME for the pre-versioning shape, not a version the app ever wrote.
// The frozen corpus (tests/fixtures/backups/schema0_demo.json) states it explicitly rather than
// omitting the field, so the entry point of the chain is visible in the fixture itself.
export const BASELINE_SCHEMA_VERSION = 1;

export const MIGRATION_STEPS = [
  {
    from: 1,
    to: 2,
    description: "Ensure every database has a `sessions` collection",
    // Pre-release (no real PT data to protect), so the old `bookings` field name (TODO §14.6) is
    // simply dropped rather than carried forward — this step only guarantees `sessions` exists as
    // an array for whatever the v2→v3 step expects next.
    apply(state) {
      if (!Array.isArray(state.sessions)) state.sessions = [];
      // Assigned undefined rather than deleted: JSON.stringify drops it on the next save.
      state.bookings = undefined;
      return { state, notes: [] };
    },
  },
  {
    from: 2,
    to: 3,
    description: "Give every session a real absolute `startDate` timestamp",
    // Sessions carried only a 4-value `day` bucket (yesterday/today/tomorrow/upcoming) plus a
    // free-text `time` range string — no way to place one on a real timeline (TODO §7.3 item 8).
    // `day` is untouched: overlap detection and card styling still key off it. This derives a
    // one-time absolute anchor from the bucket + parsed start time, at the moment of migration —
    // it does not track wall-clock time afterwards, same as history's frozen `date` field.
    apply(state) {
      const notes = [];
      const now = new Date();
      const dayOffset = { yesterday: -1, today: 0, tomorrow: 1, upcoming: 2 };

      function deriveStartDate(session) {
        const [startHHMM] = String(session.time || "").split(" - ");
        const match = /^(\d{1,2}):(\d{2})$/.exec((startHHMM || "").trim());
        const hour = match ? Number(match[1]) : 9;
        const minute = match ? Number(match[2]) : 0;
        const d = new Date(now);
        d.setDate(d.getDate() + (dayOffset[session.day] ?? 2));
        d.setHours(hour, minute, 0, 0);
        return d.toISOString();
      }

      if (Array.isArray(state.sessions)) {
        let stamped = 0;
        for (const session of state.sessions) {
          if (!session.startDate) {
            session.startDate = deriveStartDate(session);
            stamped++;
          }
        }
        if (stamped > 0) notes.push(`${stamped} session(s) given a derived \`startDate\``);
      }
      return { state, notes };
    },
  },
  {
    from: 3,
    to: 4,
    description: "Clear the stored language so every existing PT is asked to choose one",
    // Before the splash could offer a language, `lang` was forced to "en" everywhere it was
    // absent — so an install carries "en" whether the trainer picked English or was simply never
    // asked. There is no way to tell those apart after the fact, and guessing the wrong way leaves
    // a Slovene trainer with an English app and no prompt.
    //
    // So this deliberately treats EVERY database on schema 3 as never-asked and clears the value.
    // The cost of being wrong is one tap for someone who did want English; the cost of the other
    // choice is a trainer who never gets offered their own language at all.
    apply(state) {
      const notes = [];
      if (state.lang !== null && state.lang !== undefined) {
        notes.push(`language choice reset from \`${state.lang}\` so it can be asked once`);
      }
      state.lang = null;
      return { state, notes };
    },
  },
];

export const CURRENT_SCHEMA_VERSION = 4;
