// src/data/migrationSteps.js — the ordered schema-migration chain (TODO §16.2).
// Single responsibility: WHAT changes between two adjacent schema versions. The runner that walks
// this chain, validates each step's output and reports a summary lives in data/schemaMigrations.js.
//
// A PT can sit on one version for months while several ship, so upgrading walks a SEQUENCE of small
// per-version transforms rather than one big direct conversion. Each step is a pure
// `(state) => state` on a private clone: no I/O, no globals, no reaching into localStorage — that
// is what makes the chain testable and re-runnable.
//
// Adding a step: append it, bump CURRENT_SCHEMA_VERSION to its `to`, and give it notes describing
// what actually moved — the notes are what the PT is shown before committing to an upgrade.
// Injected dependencies: none.
//
// THE CHAIN IS PER-VERSION, not one collapsed transform. It was briefly collapsed into a single
// step on the reasoning that nothing had shipped so no upgrade path needed preserving; that was
// wrong twice over. Two preview instances are demoed on real PTs' devices, and backups restore from
// 1-4 — so 1, 2, 3 and 4 are live inputs, not a history nobody lived through. Each version gets its
// own small transform again, which is what lets the import banner tell a trainer what actually
// moved rather than "upgraded from the floor".
//
// "P" is the unstable preview schema this build reads and writes, and the value actually RECORDED.
// It is not a number: a fraction in stored data would read as a real schema version to anyone
// looking at a database or a backup, and P is precisely the thing that is not one. PREVIEW_SCHEMA_RANK
// below exists only so the runner can ORDER P against numbered versions.
//
// 5 does not exist yet — it is reserved for the first stable release, created from P's final state.
// The rank is fractional so both bounds fall out of one comparison: above every numbered version
// that exists (so they all migrate up into P), and below 5 (so the day 5 is minted, every P
// database is already below current and re-enters the chain on its own, with no retirement step).

// Legacy databases predate the field entirely; anything without a `schemaVersion` is version 1.
// A value BELOW the floor — 0, or anything unrecognisable — means the same thing and enters here.
// The frozen corpus stamps 0 deliberately, so the chain's entry point is visible in the fixture.
export const BASELINE_SCHEMA_VERSION = 1;

// "P" — the unstable preview schema this build reads and writes, and the value actually RECORDED.
export const CURRENT_SCHEMA_VERSION = "P";

// How "P" ORDERS against numbered versions — never stored, never shown. Above every numbered
// version that exists, below the 5 reserved for the stable release.
export const PREVIEW_SCHEMA_RANK = 4.5;

/**
 * Comparable rank for a stored version: "P", a number, or null when it is unrecognisable.
 *
 * **"P" is the alias for EVERY fraction, not just the current one.** A fractional version is by
 * definition a preview shape, and preview data is disposable — there is nothing to gain from
 * telling 4.5 apart from 5.5, because neither is a shape any build promises to still understand.
 */
export function schemaRank(version) {
  if (version === CURRENT_SCHEMA_VERSION) return PREVIEW_SCHEMA_RANK;
  if (!Number.isFinite(version)) return null;
  return Number.isInteger(version) ? version : PREVIEW_SCHEMA_RANK;
}

export const MIGRATION_STEPS = [
  {
    from: 1,
    to: 2,
    description: "Carry the legacy `bookings` collection over to `sessions`",
    // MOVED, not dropped. `bookings` was RENAMED to `sessions` in fd59637 — the same records with
    // the same shape, never a different one (the seed was literally `bookings = [...SESSIONS]`), so
    // there is nothing to convert and carrying them over is the whole job. An earlier version of
    // this step dropped them, reasoning that pre-release data was not worth protecting; that
    // expired the moment preview instances went onto real devices and backups began restoring from
    // 1-4, because dropping them destroys a trainer's entire schedule.
    //
    // Guarded on `sessions` being absent, exactly as the original rename was: a database that
    // already has `sessions` has been through this once, and its `bookings` is a stale leftover
    // that must not clobber the live collection.
    apply(state) {
      const notes = [];
      if (Array.isArray(state.bookings) && !Array.isArray(state.sessions)) {
        state.sessions = state.bookings;
        notes.push(
          `${state.sessions.length} session(s) carried over from the legacy \`bookings\` field`,
        );
      }
      // Assigned undefined rather than deleted: JSON.stringify omits it on the next save.
      state.bookings = undefined;
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
    //
    // `upcoming` is lossy and unavoidably so: the bucket carries no magnitude, so a session four
    // days out always lands at +2. Nothing in a pre-`startDate` database records where it really
    // was — this fills a field that was never written, it does not preserve one.
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
    // Before the splash could offer a language, `lang` was forced to "en" everywhere it was absent,
    // so an install carries "en" whether the trainer picked English or was simply never asked.
    // There is no way to tell those apart after the fact, and guessing wrong leaves a Slovene
    // trainer with an English app and no prompt.
    //
    // Being its OWN step is what makes this safe: a database already at 4 never runs it, so a
    // trainer who has since chosen is not re-asked. That property was lost while the chain was
    // collapsed into one transform and had to be restored with an explicit version guard; here it
    // is structural.
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
