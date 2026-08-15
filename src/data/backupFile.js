// src/data/backupFile.js — building the backup file, and reading one back.
// Single responsibility: turn the live database into a portable file and back. Pure: no DOM, no
// download, no storage — the dialog owns those.
//
// **A backup is written at the newest NUMBERED schema, never at P.** P's shape can change on any
// commit, so a file written at it is restorable only by the exact build that produced it — which is
// the opposite of what a backup is for. A numbered shape does not move, so any build can restore it
// through the migration chain.
//
// The cost is real and has to be said out loud rather than discovered: **a P-only field does not
// reach the file.** A field added in P, backed up, restored — gone. That is the price of a portable
// backup while the runtime shape is unstable, and it is why the export surfaces carry a
// preview-mode warning instead of pretending the file is complete.
//
// ONE shape per file, not every live one. Shapes only gain fields under expand-first (SCHEMA_P is
// SCHEMA_4 plus `startDate`), so the newest is a strict superset of the rest and older copies would
// store strictly less information at full size. Restore re-derives every live store anyway.
//
// **ONE version number, on the envelope, shared by the container and the records (TODO §18.7).**
// `formatVersion` sits outside any future compression or encryption, so it is the first thing
// readable — it answers "can I open this box?" — and it is the SAME integer as `schemaVersion`, so
// it also answers "how do I read what is inside?". A container change and a record change both bump
// it; the number is a single monotonic history of the file format as a whole.
//
// **Two independent numbers were considered and rejected** (Simon, 2026-08-15), and the two
// objections to sharing both fall down on this architecture:
//   * "A container-only change forces a record-schema bump with no migration to run." True, and the
//     cost is one no-op step in the chain. That is cheap, and it keeps the chain's history complete.
//   * "An older build then refuses a file whose container it understands." It should. §18.7's
//     guarantee is retain READERS forever — new builds open old files — and that is unaffected. Old
//     builds opening NEW files was never promised, and refusing is already what the restore path
//     does, because a newer file may hold records this build cannot faithfully represent.
// What sharing buys is that there is no way to express, or accidentally ship, a file whose two
// numbers disagree.
//
// The table below records which containers this build can open. **A row is never edited, only
// added**: files carrying version N are in the wild forever, so row N must keep describing what N
// meant when it was written.
//
// Injected dependencies: none.

import { CURRENT_SCHEMA_VERSION } from "./migrationSteps.js";
import { COLLECTIONS, projectCollection } from "./recordProjections.js";
import { BACKUP_SCHEMA } from "./recordSchemas.js";

// Settings that belong to the database rather than to any record. `schemaVersion` is set from
// BACKUP_SCHEMA, not copied from the live state, which is the whole point of this module.
const SETTINGS_KEYS = ["lang"];

/** How to open a file at each version. **Add rows; never edit one** — files declaring a version are
 * permanent, so the row is the only record of what that version promised.
 *
 * Keyed by the shared version integer, which is also the record schema: version 4 is schema 4 in a
 * plain-JSON container. §18.8's encryption becomes version 5 with `container: "aes-gcm"`, and a
 * no-op 4→5 step in the migration chain, since the records will not have changed. */
export const BACKUP_FORMATS = {
  4: { container: "json" },
};

/** The version written today. Tied to BACKUP_SCHEMA rather than restated, because they are one
 * number by design and a second literal here is the one place they could drift apart. */
export const CURRENT_BACKUP_FORMAT = BACKUP_SCHEMA;

/** Decides how to open a parsed file and how to read its records, from the single envelope integer.
 *
 * Returns `{ formatVersion, container, schema, legacy }`, or `{ unsupported: true, formatVersion }`
 * for a version this build has never heard of — which is a REFUSAL, not a guess. A file from a newer
 * build may be compressed, encrypted, or shaped in a way this reader would misparse into an empty
 * database and then write over the trainer's real one.
 *
 * A file with no `formatVersion` predates this field (every backup written before 2026-08-15) and is
 * plain JSON whose payload states its own `schemaVersion` — "retain readers forever" means that path
 * stays supported permanently, not until it becomes inconvenient.
 */
export function resolveBackupFormat(parsed) {
  const declared = parsed?.formatVersion;
  if (declared === undefined || declared === null) {
    return { formatVersion: null, container: "json", schema: parsed?.schemaVersion, legacy: true };
  }
  const known = BACKUP_FORMATS[declared];
  if (!known) return { unsupported: true, formatVersion: declared };
  // schema === the version itself: one number, by design.
  return { formatVersion: declared, schema: declared, ...known, legacy: false };
}

/**
 * Build the backup payload for `state`.
 *
 * `buildSha` is a support breadcrumb — "which build wrote this file" — and nothing more. It is
 * deliberately NOT consulted when restoring: the file is written at a NUMBERED schema, and two
 * files declaring the same number have the same shape by definition. That is what a numbered schema
 * means. Comparing SHAs would imply a doubt that cannot exist here; the only shape that could vary
 * between builds is P, and P is never written to a file.
 */
export function buildBackupPayload(
  state,
  { buildSha = null, now = new Date(), suppressions = null } = {},
) {
  const payload = {
    // The envelope integer, first key in the file so it is the first thing a reader (or a human in a
    // text editor) meets. It binds container and record schema together — see BACKUP_FORMATS.
    formatVersion: CURRENT_BACKUP_FORMAT,
    // The SAME number, written twice: the migration chain has always keyed off `schemaVersion` and
    // every file ever written already depends on it, so it stays. A test asserts the two agree —
    // which makes a disagreement a corrupt or hand-edited file, never a legitimate combination.
    schemaVersion: BACKUP_SCHEMA,
    // Recorded so a future migration needing a temporal anchor has one, instead of reaching for
    // `new Date()` at restore time and dating a two-year-old backup as though it were taken today.
    exportedAt: now.toISOString(),
    buildSha,
    // What the app was actually RUNNING when this was written — reporting only. A restore keys off
    // `schemaVersion` above; this is here so "which preview produced this file" is answerable.
    runtimeSchema: CURRENT_SCHEMA_VERSION,
  };

  // The erasure register rides along, and it is the ONE part of this file that is not a snapshot of
  // the database (erasureSuppression.js). It has to travel: a trainer who reinstalls and restores
  // this file would otherwise come back with an empty register, and the next restore of an older
  // file would resurrect someone who asked to be forgotten. It carries salted hashes only — no ids,
  // no names — so a backup file discloses nothing about who was erased, only how many.
  if (suppressions) payload.erasureSuppressions = suppressions;

  for (const key of SETTINGS_KEYS) payload[key] = state?.[key] ?? null;

  for (const collection of COLLECTIONS) {
    const records = Array.isArray(state?.[collection]) ? state[collection] : [];
    // Through the same projection path the star-write fan-out uses, so the file cannot drift from
    // what the store would have written for this shape.
    payload[collection] = records.map((record) => {
      const { collection: _routing, ...projected } = projectCollection(collection, record);
      return projected;
    });
  }

  return payload;
}

/** Whether a parsed file looks like one of ours, before anything is done with it. */
export function isBackupPayload(parsed) {
  return Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed);
}

/**
 * What restoring `parsed` would REPLACE, so a trainer is told before it happens rather than after.
 *
 * A restore is a whole-database replace, not a merge — the file is a snapshot, and merging two
 * databases without a common ancestor is guesswork (that ancestor is exactly what Drive sync's
 * three-way merge has and a file import does not). Replacing is right; replacing silently is not.
 */
export function summarizeReplacement(currentState) {
  const counts = {};
  for (const collection of COLLECTIONS) {
    const records = Array.isArray(currentState?.[collection]) ? currentState[collection] : [];
    if (records.length > 0) counts[collection] = records.length;
  }
  return { counts, total: Object.values(counts).reduce((sum, n) => sum + n, 0) };
}
