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
// Injected dependencies: none.

import { CURRENT_SCHEMA_VERSION } from "./migrationSteps.js";
import { COLLECTIONS, projectCollection } from "./recordProjections.js";
import { BACKUP_SCHEMA } from "./recordSchemas.js";

// Settings that belong to the database rather than to any record. `schemaVersion` is set from
// BACKUP_SCHEMA, not copied from the live state, which is the whole point of this module.
const SETTINGS_KEYS = ["lang"];

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
