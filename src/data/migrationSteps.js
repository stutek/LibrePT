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
export const BASELINE_SCHEMA_VERSION = 1;

export const MIGRATION_STEPS = [
  {
    from: 1,
    to: 2,
    description: "Rename the `bookings` collection to `sessions`",
    // From the PT's stance the entity is a session; "booking" was the customer-facing framing
    // (TODO §14.6). This ran as an ad-hoc shim inside loadSavedState for a while — as a real step
    // it is versioned, reported, and validated like every other schema change.
    apply(state) {
      const notes = [];
      if (Array.isArray(state.bookings)) {
        const carried = state.bookings.length;
        if (!Array.isArray(state.sessions) || state.sessions.length === 0) {
          state.sessions = state.bookings;
          notes.push(`${carried} session(s) carried over from \`bookings\``);
        } else {
          // Both present: `sessions` is the newer field, so it wins. Say so rather than silently
          // dropping records — the PT should see that something was discarded.
          notes.push(`${carried} legacy \`bookings\` record(s) dropped in favour of \`sessions\``);
        }
        // Assigned undefined rather than deleted: JSON.stringify drops it on the next save, and it
        // keeps the pre-existing behaviour this step was lifted from.
        state.bookings = undefined;
      }
      if (!Array.isArray(state.sessions)) state.sessions = [];
      return { state, notes };
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
];

export const CURRENT_SCHEMA_VERSION = 3;
