// src/data/storageNamespace.js — per-release isolation of the app's local storage (TODO §16.2).
// Single responsibility: decide WHICH storage key this build reads and writes, and move data
// between one release's bucket and another's — never in place.
//
// Why: localStorage is scoped per ORIGIN, not per path. Once several released versions are hosted
// side by side under one origin (`/v1.2.0/`, `/v1.3.0/`, …) they would silently share one bucket,
// so a rollback would meet data written by a schema the older build cannot read. Each release
// therefore gets its own suffixed bucket, and moving between them is an explicit copy.
//
// Two deliberate rules:
//   1. An UNTAGGED build ("dev" — local, tests, any pre-tag deploy) keeps the plain unsuffixed keys.
//      It is not a release, it cannot be switched to or from, and giving it a bucket of its own
//      would strand the data every current install already has.
//   2. A copy NEVER mutates its source. That is what bounds the blast radius of a bad migration
//      (§16.2) — the version a PT is actually running keeps its own untouched snapshot — and it is
//      what makes rollback mean something.
//
// Injected dependencies: none — reads the release identity from modules/common/releaseIdentity.js.

import { UNRELEASED, currentRelease, normalizeRelease } from "../modules/common/releaseIdentity.js";

// Data whose SHAPE belongs to a version: it is written by one build's schema and must not be handed
// to another build without an explicit migration.
export const VERSION_SCOPED_KEYS = [
  "librept_db",
  "librept_active_session",
  "librept_active_timers",
  "librept_workout_setup_draft",
  "librept_read_notifications",
];

// Preferences and consents belong to the PERSON, not the build: re-accepting the terms or losing
// the chosen theme just because you switched version would be a bug, not isolation.
export const ORIGIN_GLOBAL_KEYS = ["librept_terms_accepted", "librept-theme"];

const RELEASE_SUFFIX = "@";

export function namespacedKey(baseKey, release = currentRelease()) {
  const resolved = normalizeRelease(release);
  return resolved === UNRELEASED ? baseKey : `${baseKey}${RELEASE_SUFFIX}${resolved}`;
}

export function readVersionScoped(baseKey, release = currentRelease()) {
  return localStorage.getItem(namespacedKey(baseKey, release));
}

export function writeVersionScoped(baseKey, value, release = currentRelease()) {
  localStorage.setItem(namespacedKey(baseKey, release), value);
}

export function removeVersionScoped(baseKey, release = currentRelease()) {
  localStorage.removeItem(namespacedKey(baseKey, release));
}

// Every release that currently holds data in this origin — the input to a rollback offer and to
// EOL cleanup. The unsuffixed bucket reports as UNRELEASED.
export function listReleaseBuckets() {
  const releases = new Set();
  for (const key of Object.keys(localStorage)) {
    for (const baseKey of VERSION_SCOPED_KEYS) {
      if (key === baseKey) releases.add(UNRELEASED);
      else if (key.startsWith(`${baseKey}${RELEASE_SUFFIX}`)) {
        releases.add(key.slice(baseKey.length + RELEASE_SUFFIX.length));
      }
    }
  }
  return [...releases];
}

export function bucketHasData(release) {
  return VERSION_SCOPED_KEYS.some((baseKey) => readVersionScoped(baseKey, release) !== null);
}

// The migration primitive: snapshot one release's data into another's bucket. Returns the keys it
// copied so the caller can show the PT what moved (§16.2's "migration summary"). Refuses to
// overwrite a destination that already holds data unless asked — accepting an upgrade twice must
// not silently discard what was done under the new version in between.
export function copyBucket(fromRelease, toRelease, { overwrite = false } = {}) {
  const source = normalizeRelease(fromRelease);
  const destination = normalizeRelease(toRelease);
  if (source === destination) return { copied: [], skipped: "same-bucket" };
  if (!overwrite && bucketHasData(destination))
    return { copied: [], skipped: "destination-has-data" };

  const copied = [];
  for (const baseKey of VERSION_SCOPED_KEYS) {
    const value = readVersionScoped(baseKey, source);
    if (value === null) continue;
    writeVersionScoped(baseKey, value, destination);
    copied.push(baseKey);
  }
  return { copied, skipped: null };
}

// First boot of a tagged build on a device that has only ever run untagged ones: seed this
// release's bucket from the plain unsuffixed keys. The legacy bucket is left intact on purpose —
// it is the snapshot a rollback returns to.
export function adoptLegacyBucket(release = currentRelease()) {
  const target = normalizeRelease(release);
  if (target === UNRELEASED) return { copied: [], skipped: "unreleased-build" };
  return copyBucket(UNRELEASED, target);
}

// Past its EOL, a release's data is deleted without touching any other still-supported version.
export function discardReleaseBucket(release) {
  const target = normalizeRelease(release);
  const removed = [];
  for (const baseKey of VERSION_SCOPED_KEYS) {
    const key = namespacedKey(baseKey, target);
    if (localStorage.getItem(key) === null) continue;
    localStorage.removeItem(key);
    removed.push(baseKey);
  }
  return removed;
}
