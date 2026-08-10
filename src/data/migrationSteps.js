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
// TWO VERSIONS EXIST TODAY, and that is deliberate: **0** (pre-release) and **5** (current).
// LibrePT has not shipped, so no trainer is sitting on an intermediate version whose upgrade path
// has to be preserved: the four steps that used to run here (v1→v2 `sessions`, v2→v3 `startDate`,
// v3→v4 `lang`) described a history nobody lived through, and are collapsed into the ONE step
// below, which does all of their work at once.
//
// **"P" is the pre-release placeholder for 5** — the same version, under a name that says it is not
// settled yet. 5 becomes the stable release schema; until then P is what the shape is called while
// it can still move.
//
// The consequence to keep in mind: a placeholder shape may change WITHOUT the number changing, so
// two preview databases can both read `schemaVersion: 5` and hold genuinely different shapes.
// `migrateState` compares 5 against 5, applies nothing, and reports success — the number cannot
// discriminate them. Only the commit SHA can, which is why a preview backup has to carry it
// (docs/DATA_MODEL.md §1). At release the shape settles and the number starts meaning what it says.
//
// **Current starts at 5 because 1–4 are burned, not free.** Those values were stamped into real
// preview databases. Keeping current above all of them is what lets a single comparison rescue
// them — see BASELINE_SCHEMA_VERSION. Reusing one would need a hardcoded set of dead numbers
// instead, which has to be maintained, and which would silently reset a real database the day a
// release happened to reach the same number. Burned numbers are never recycled, however empty the
// range looks.
//
// The collapse is legitimate ONLY because nothing is released. The moment a real trainer holds
// data the rule inverts: readers are retained forever (docs/DATA_MODEL.md §6), steps are appended
// and never squashed, and this note becomes the reason a future agent must not repeat it.

// Pre-release databases — the field absent entirely, explicitly 0, or carrying any value a
// pre-release build once stamped (2, 3, 4 were all written at some point). The floor of the chain,
// and the version the frozen corpus (tests/fixtures/backups/) enters at.
//
// Anything BELOW current re-enters here: the field absent, 0, garbage, or one of the burned
// pre-release values (2, 3, 4) an older build stamped. Detection is a RULE, not a list of dead
// numbers — a list needs editing every time one more turns out to exist in the wild, and silently
// refuses the ones nobody remembered to enumerate.
export const BASELINE_SCHEMA_VERSION = 0;

// What this build reads and writes. Declared above MIGRATION_STEPS because the step below reads it
// at module-evaluation time.
export const CURRENT_SCHEMA_VERSION = 5;

export const MIGRATION_STEPS = [
  {
    from: BASELINE_SCHEMA_VERSION,
    to: CURRENT_SCHEMA_VERSION,
    description: "Normalise a pre-release database to the preview shape",
    apply(state) {
      const notes = [];

      // --- was v1→v2: the `bookings` → `sessions` rename (TODO §14.6) ---
      // Pre-release, so the old field name is DROPPED rather than carried forward. Assigned
      // undefined rather than deleted: JSON.stringify omits it on the next save.
      if (Array.isArray(state.bookings) && state.bookings.length > 0) {
        notes.push(`${state.bookings.length} legacy \`bookings\` entr(ies) dropped`);
      }
      state.bookings = undefined;
      if (!Array.isArray(state.sessions)) state.sessions = [];

      // --- was v2→v3: give every session a real absolute `startDate` (TODO §7.3 item 8) ---
      // Sessions carried only a 4-value `day` bucket plus a free-text `time` range — no way to
      // place one on a real timeline. This derives a one-time absolute anchor from the bucket +
      // parsed start time AT THE MOMENT OF MIGRATION; it does not track wall-clock time afterwards,
      // same as history's frozen `date` field. `day` is untouched: overlap detection and card
      // styling still key off it.
      //
      // `upcoming` is lossy and unavoidably so — the bucket carries no magnitude, so a session four
      // days out always lands at +2. Nothing in a pre-`startDate` database records where it really
      // was: this fills a field that was never written, it does not preserve one.
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

      let stamped = 0;
      for (const session of state.sessions) {
        if (!session.startDate) {
          session.startDate = deriveStartDate(session);
          stamped++;
        }
      }
      if (stamped > 0) notes.push(`${stamped} session(s) given a derived \`startDate\``);

      // --- was v3→v4: clear the stored language so every PT is asked once ---
      // Before the splash could offer a language, `lang` was forced to "en" wherever it was absent,
      // so an install carries "en" whether the trainer picked English or was never asked. Those are
      // indistinguishable after the fact, and guessing wrong leaves a Slovene trainer with an
      // English app and no prompt. Clearing costs one tap for someone who did want English; not
      // clearing costs a trainer their own language entirely.
      //
      // The one part of this step that is NOT idempotent, which matters only for a database
      // carrying a retired version: a preview install that had already chosen is asked once more.
      // One tap, once, on unreleased software.
      if (state.lang !== null && state.lang !== undefined) {
        notes.push(`language choice reset from \`${state.lang}\` so it can be asked once`);
      }
      state.lang = null;

      return { state, notes };
    },
  },
];
