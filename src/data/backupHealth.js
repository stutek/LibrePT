// src/data/backupHealth.js — "is any of this data anywhere it would survive losing this browser?"
// (TODO §3.8). Pure functions over plain objects; no DOM, no storage, no clock of its own.
//
// **A different question from the sync badge, and the distinction is the whole point.** §3.9's ↑
// counts records not on Drive, so a downloaded backup does not reduce it and should not — the data
// really is absent from Drive either way. This module asks whether the data is anywhere DURABLE, so
// a downloaded file answers it exactly as a completed sync does. Keeping the two separate is what
// lets the count stay factual while the warning stays honest: if only a Drive sync could clear a
// safety warning, the warning would be a prompt to enable Google wearing a warning colour, and
// trainers can tell the difference.
//
// **Why a fingerprint rather than a snapshot or a timestamp.** Counting "changes since the last
// backup" needs a reference point, and records carry no per-record `updatedAt` to compare against.
// Storing a full state snapshot (as the Drive ancestor does) would work and was rejected: it roughly
// doubles what the database holds, and a feature that exists to warn about STORAGE EVICTION should
// not be the thing that pushes an origin over its quota. So a backup records `{id, h}` per record —
// a few dozen bytes each rather than the whole record — and `countChangedRecords` diffs two of those
// unchanged, because it compares any two state-shaped objects and does not care what the fields are.
//
// The hash is non-cryptographic (FNV-1a). A collision would undercount one record in a threshold
// that fires at twenty; that is the correct amount of engineering for a nudge.
//
// Injected dependencies: none.

import { COLLECTIONS } from "./recordProjections.js";
import { countChangedRecords, stableStringify } from "./syncMerge.js";

// Both tunable, and both deliberately unambitious: a warning that fires too eagerly is ignored
// within a week, at which point it protects nobody.
export const UNBACKED_CHANGE_THRESHOLD = 20;
export const UNBACKED_DAYS_THRESHOLD = 7;

function hashRecord(record) {
  // FNV-1a over the canonical serialization, so key order cannot change the hash.
  const text = stableStringify(record);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16);
}

/** A state-shaped object of `{id, h}` records — small enough to store on every backup, and diffable
 * by `countChangedRecords` exactly as a real state would be. */
export function fingerprintState(state) {
  const fingerprint = {};
  for (const collection of COLLECTIONS) {
    fingerprint[collection] = (state?.[collection] || []).map((record) => ({
      id: record.id,
      h: hashRecord(record),
    }));
  }
  return fingerprint;
}

function totalRecords(fingerprint) {
  return COLLECTIONS.reduce((sum, collection) => sum + (fingerprint?.[collection]?.length || 0), 0);
}

/**
 * How urgently this device needs a backup.
 *
 * `history` is `readBackupHistory()`'s value — `{at, kind, fingerprint}` or null for "never".
 * Returns `{ level, unbackedCount, daysSinceBackup }` where level is:
 *   • `"none"`   — nothing worth saying.
 *   • `"due"`    — enough unbacked work to be worth a quiet marker.
 *   • `"urgent"` — the same, AND the browser has told us this origin's storage is evictable
 *                  (`storageDurability`'s `atRisk`). That is evidence, not a proxy: "not persisted"
 *                  is the browser saying it may reclaim this data, which is the actual hazard.
 *
 * **Never backed up is judged on COUNT alone, with no time component**, because there is no
 * timestamp to measure an interval from and inventing one (say, first-run) would warn a trainer who
 * is still evaluating the app with three test clients. Once they have real work, the count says so.
 */
export function assessBackupHealth({
  history,
  currentFingerprint,
  durability,
  now = Date.now(),
} = {}) {
  const current = currentFingerprint || {};
  const atRisk = Boolean(durability?.atRisk);

  if (!history?.fingerprint) {
    const unbackedCount = totalRecords(current);
    const due = unbackedCount >= UNBACKED_CHANGE_THRESHOLD;
    return {
      level: due ? (atRisk ? "urgent" : "due") : "none",
      unbackedCount,
      daysSinceBackup: null,
    };
  }

  const unbackedCount = countChangedRecords(COLLECTIONS, history.fingerprint, current);
  const daysSinceBackup = Math.floor((now - history.at) / 86_400_000);
  // Time alone never fires: an untouched database that was backed up a year ago is still fully
  // backed up, and nagging about it would teach the trainer the badge means nothing.
  const due =
    unbackedCount > 0 &&
    (unbackedCount >= UNBACKED_CHANGE_THRESHOLD || daysSinceBackup >= UNBACKED_DAYS_THRESHOLD);
  return {
    level: due ? (atRisk ? "urgent" : "due") : "none",
    unbackedCount,
    daysSinceBackup,
  };
}
