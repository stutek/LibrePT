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
// Injected dependencies: none.

// Data whose SHAPE belongs to the app's current build: written by this build's schema and not
// interchangeable with an incompatible one without going through the schema-migration chain first.
export const VERSION_SCOPED_KEYS = [
  "librept_db",
  "librept_active_session",
  "librept_active_timers",
  "librept_workout_setup_draft",
  "librept_read_notifications",
];

// Preferences and consents belong to the PERSON, not the build: re-accepting the terms or losing
// the chosen theme on an update would be a bug, not isolation.
export const ORIGIN_GLOBAL_KEYS = ["librept_terms_accepted", "librept-theme"];

export function readVersionScoped(baseKey) {
  return localStorage.getItem(baseKey);
}

export function writeVersionScoped(baseKey, value) {
  localStorage.setItem(baseKey, value);
}

export function removeVersionScoped(baseKey) {
  localStorage.removeItem(baseKey);
}
