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
];

export const CURRENT_SCHEMA_VERSION = 2;
