// src/data/storageDurability.js — is this device's storage safe to trust with a PT's only copy?
// (TODO §18.6, §18.8). Single responsibility: ask the browser to make storage persistent, and report
// honestly when it is not.
//
// **Why this is mandatory rather than nice to have.** LibrePT is local-first by design: there is no
// server holding a second copy, so an eviction is not a cache miss, it is a business losing its
// records. Without `navigator.storage.persist()` a browser may reclaim IndexedDB under storage
// pressure, and Safari additionally caps script-writable storage for sites the user has not engaged
// with for seven days — a PT who does not open the app over a quiet fortnight is precisely the case.
// Installing to the home screen (which the app already promotes) exempts you from that cap, and
// `persist()` covers the rest.
//
// **Detect the CONSEQUENCE, not the mode (§18.8).** It is tempting to detect private browsing and
// warn about it, but every such detection is a heuristic that browsers actively break, and it answers
// the wrong question. What matters is "can this device be trusted to still hold the data tomorrow",
// which `persisted()` and `estimate()` answer directly — and which also catches the cases private-mode
// detection misses entirely: a nearly full Android device, or a Safari tab that was never installed.
//
// This module only reports. Deciding what to say to the trainer, and when, belongs to the UI.
//
// Injected dependencies: `storage` (defaults to navigator.storage) so every branch is testable.

// Below this, a "successful" write is likely to fail or be evicted shortly: a very busy PT reaches
// ~16.6 MiB/yr in a single bucket (§18.6's sizing), so a quota in the low tens of MB is not a working
// device — it is a private window or a device that is already full.
export const MINIMUM_WORKABLE_QUOTA_BYTES = 50 * 1024 * 1024;

function storageApi(injected) {
  if (injected) return injected;
  return typeof navigator !== "undefined" ? navigator.storage : null;
}

/**
 * Ask the browser to exempt this origin from eviction.
 *
 * Idempotent and cheap to call on every boot: if permission was already granted, `persisted()` short
 * -circuits it, and browsers that grant based on engagement heuristics may say yes on a later boot
 * having said no on the first. A refusal is NOT an error — most browsers refuse until the app is
 * installed or the user has engaged with it enough — so it resolves rather than throws.
 */
export async function requestPersistentStorage({ storage } = {}) {
  const api = storageApi(storage);
  if (!api || typeof api.persist !== "function") {
    return { supported: false, persisted: false };
  }
  try {
    if (typeof api.persisted === "function" && (await api.persisted())) {
      return { supported: true, persisted: true, alreadyGranted: true };
    }
    return { supported: true, persisted: !!(await api.persist()) };
  } catch {
    // A browser that throws here (some private modes do) is telling us the same thing a refusal does.
    return { supported: true, persisted: false };
  }
}

/**
 * What we can say about this device's storage right now.
 *
 * Returns { durable, quota, usage, atRisk, reason }. `atRisk` is the one the UI acts on, and `reason`
 * names which consequence tripped it so the message can be specific rather than a generic scare:
 *   • "no-storage-api"  — too old or too locked down to ask; assume nothing is durable.
 *   • "tiny-quota"      — there is not room for a working dataset (private window, full device).
 *   • "not-persisted"   — it works today, but the browser is free to reclaim it.
 */
export async function assessDurability({ storage } = {}) {
  const api = storageApi(storage);
  if (!api || typeof api.estimate !== "function") {
    return { durable: false, quota: null, usage: null, atRisk: true, reason: "no-storage-api" };
  }

  let quota = null;
  let usage = null;
  try {
    const estimate = await api.estimate();
    quota = typeof estimate?.quota === "number" ? estimate.quota : null;
    usage = typeof estimate?.usage === "number" ? estimate.usage : null;
  } catch {
    return { durable: false, quota: null, usage: null, atRisk: true, reason: "no-storage-api" };
  }

  let durable = false;
  try {
    durable = typeof api.persisted === "function" ? !!(await api.persisted()) : false;
  } catch {
    durable = false;
  }

  // Quota is checked before persistence: a persisted origin with no room to grow is still a device
  // that will start failing writes, and saying "your storage is protected" there would be a lie.
  if (quota !== null && quota < MINIMUM_WORKABLE_QUOTA_BYTES) {
    return { durable, quota, usage, atRisk: true, reason: "tiny-quota" };
  }
  if (!durable) {
    return { durable, quota, usage, atRisk: true, reason: "not-persisted" };
  }
  return { durable: true, quota, usage, atRisk: false, reason: null };
}
