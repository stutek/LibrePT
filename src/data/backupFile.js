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
// ONE shape per file, not every live one. Shapes only gain fields under expand-first (SCHEMA_3 is
// SCHEMA_2 plus `startDate`), so the newest is a strict superset of the rest and older copies would
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
 * `buildSha` identifies the code that produced the file. It is not decoration: while the runtime
 * schema is a placeholder, two files can both say `schemaVersion: 4` and have been produced by
 * builds whose P shapes differed, and the SHA is the only thing that can tell them apart when
 * someone is diagnosing a restore.
 */
export function buildBackupPayload(state, { buildSha = null, now = new Date() } = {}) {
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
 * What a restore should TELL the trainer about a file, beyond whether it worked.
 *
 * A file from a different build cannot be assumed shape-compatible in its preview-only details, and
 * saying so is the difference between a restore they can trust and one they merely survived.
 */
export function describeBackupOrigin(parsed, currentBuildSha) {
  if (!isBackupPayload(parsed)) return null;
  const sha = parsed.buildSha || null;
  return {
    exportedAt: parsed.exportedAt || null,
    buildSha: sha,
    fromThisBuild: Boolean(sha && currentBuildSha && sha === currentBuildSha),
    // A file predating this metadata: neither confirmed same-build nor confirmed different.
    unknownOrigin: !sha,
  };
}
