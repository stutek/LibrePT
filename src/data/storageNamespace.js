// src/data/storageNamespace.js — the app's plain localStorage keys (TODO §16.5/§16.3).
// Single responsibility: read/write the handful of localStorage keys the app still uses now that
// the live store is IndexedDB (TODO §18.6 part 4).
//
// There is no bucket-keying scheme left to build here. Multi-version hosting (per-release-tag
// buckets, `librept_db@v1.2.0`) was dropped outright (TODO §16/§18: no release tags — one build
// carries every supported behaviour concurrently). The schema axis that would otherwise replace it
// (TODO §16.3, "key storage buckets on the data schema, not the release tag") already lives
// elsewhere: IndexedDB's per-schema object stores (`schema2`, `schema3`, ...,
// data/indexedDb.js's `storeNameForSchema`) ARE that keying scheme. localStorage's `librept_db` is
// no longer a live, multi-bucket store at all — it is read exactly once, as the legacy import
// source for the one-time move onto IndexedDB, and left untouched afterwards as the rollback
// snapshot. A build with no IndexedDB falls back to this same plain key as its only store, which
// also needs no bucket axis: a browser lacking IndexedDB never had multiple schemas to keep apart.
//
// **The axis that DOES exist here is the workspace** (TODO §40.1, data/workspace.js): a fact about
// the DATA is scoped to the workspace holding it, a fact about the PERSON or the device is shared by
// both. That is the same split the two lists below already drew, so the workspace suffix is applied
// by the version-scoped accessors and by nothing else — the sandbox cannot pick up the trainer's live
// session, and the trainer cannot lose their theme by stepping into the sandbox.
//
// Injected dependencies: data/workspace.js (the active workspace's key suffix).

import { scopedKey } from "./workspace.js";

// Data whose SHAPE belongs to the app's current build: written by this build's schema and not
// interchangeable with an incompatible one without going through the schema-migration chain first.
// These are also exactly the keys that belong to ONE workspace (§40.1) — a live session, its timers,
// a half-filled setup, which messages have been read.
export const VERSION_SCOPED_KEYS = [
  "librept_db",
  "librept_active_session",
  "librept_active_timers",
  "librept_workout_setup_draft",
  "librept_read_notifications",
];

// Preferences and consents belong to the PERSON, not the build: re-accepting the terms or losing
// the chosen theme on an update would be a bug, not isolation. By the same reasoning they belong to
// no workspace either, so these are read and written unscoped and are shared by both.
export const ORIGIN_GLOBAL_KEYS = ["librept_terms_accepted", "librept-theme", "librept_lang"];

export function readVersionScoped(baseKey) {
  return localStorage.getItem(scopedKey(baseKey));
}

export function writeVersionScoped(baseKey, value) {
  localStorage.setItem(scopedKey(baseKey), value);
}

export function removeVersionScoped(baseKey) {
  localStorage.removeItem(scopedKey(baseKey));
}

/** Read/write a per-workspace key belonging to a NAMED workspace rather than the active one — what
 * the timer stack needs to watch the clocks of the workspace the trainer is not looking at
 * (TODO §40.11). Kept here so localStorage key construction has one home. */
export function readForWorkspace(baseKey, name) {
  return localStorage.getItem(scopedKey(baseKey, name));
}

export function writeForWorkspace(baseKey, name, value) {
  localStorage.setItem(scopedKey(baseKey, name), value);
}

/** Drop every per-workspace key belonging to `name` — what a sandbox reset clears alongside the
 * database (TODO §40.4). Total by construction: it walks the declared list rather than matching a
 * pattern, so a key added to `VERSION_SCOPED_KEYS` is swept without anybody remembering to add it
 * here too. */
export function clearWorkspaceKeys(name) {
  for (const baseKey of VERSION_SCOPED_KEYS) localStorage.removeItem(scopedKey(baseKey, name));
}
