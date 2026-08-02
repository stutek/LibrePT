// src/data/driveSyncService.js — orchestrates Google Drive appDataFolder sync (TODO §1.5/§3.3).
// Single responsibility: connect/disconnect the OAuth grant, and run one sync pass (download → merge
// → apply locally → upload). Delegates auth to googleAuth.js, the wire format to driveAppData.js, and
// the actual merge decision to the pure functions in syncMerge.js — this module is the glue between
// them and stateStore.js's `getState`/`setState`/`saveToLocalStorage`.
//
// **Scope of what syncs**: the collections `recordProjections.js` projects (clients, exercises,
// routines, sessions, history, planUpdates, notifications) — i.e. everything a backup export already
// carries. `schemaVersion` and `lang` are per-device/per-build, not synced. TODO §1.5 frames the long
//-run target more narrowly ("app-only data with no Calendar equivalent") once Calendar integration
// exists as the source of truth for scheduling facts; until then there is no Calendar-sourced overlap
// to exclude, so the full domain snapshot is what a PT actually needs mirrored across their devices.
//
// **Not built in this slice**: incremental sync via the Drive Changes API (`changes.list` +
// `pageToken`) — every sync downloads and re-uploads the whole JSON file, which is correct but not
// bandwidth-minimal; a real optimisation, not a correctness gap, and left for a follow-up once this
// path has real usage to size against. Also not built: a resolution UI for the `conflicts` a sync
// pass returns — they are detected, applied with a safe default (the local edit wins, the remote
// version travels alongside for later review), and reported in `driveSyncStatus()`, but nothing in
// the UI yet lets a trainer review and pick between the two sides. See docs/TODO.md §3.3.
//
// **Why no Lamport (deviceId, seq) pair**, despite TODO §18.5 flagging it as something concurrent
// writers would eventually need: the three-way merge here never tries to ORDER two edits — it detects
// "changed on both sides since the shared ancestor" and reports a conflict rather than picking a
// winner by time. A Lamport pair only matters to a scheme that still wants a deterministic "which
// edit happened later"; this one deliberately never asks that question, so it never needed the clock
// substitute either.
//
// Injected dependencies: none at the module level — call sites are the UI layer (driveSyncUi.js) and
// app.js's lifecycle hook.

import {
  hasStoredConsent,
  requestAccessToken,
  revokeAccess,
} from "../modules/common/googleAuth.js";
import { createSyncFile, downloadSyncFile, findSyncFile, updateSyncFile } from "./driveAppData.js";
import { isDriveSyncConfigured } from "./driveSyncConfig.js";
import { COLLECTIONS } from "./recordProjections.js";
import {
  getState,
  readDriveSyncMeta,
  saveToLocalStorage,
  setState,
  writeDriveSyncMeta,
} from "./stateStore.js";
import { mergeState } from "./syncMerge.js";

let syncing = false;
let lastSyncResult = null;

export function driveSyncStatus() {
  return {
    configured: isDriveSyncConfigured(),
    connected: hasStoredConsent(),
    syncing,
    lastSyncResult,
    intervalMinutes: getSyncIntervalMinutes(),
  };
}

// Periodic pull (in addition to poll-on-resume): a PT-configurable "how often" for devices left open
// on the gym floor rather than backgrounded/resumed. A plain localStorage key, not IndexedDB — this
// is a per-device preference (like the theme choice), not domain data any schema/star-write covers.
const SYNC_INTERVAL_KEY = "librept_drive_sync_interval_minutes";
export const DEFAULT_SYNC_INTERVAL_MINUTES = 5;
export const MIN_SYNC_INTERVAL_MINUTES = 1;
export const MAX_SYNC_INTERVAL_MINUTES = 60;

function clampIntervalMinutes(minutes) {
  const rounded = Math.round(Number(minutes));
  if (!Number.isFinite(rounded)) return DEFAULT_SYNC_INTERVAL_MINUTES;
  return Math.min(MAX_SYNC_INTERVAL_MINUTES, Math.max(MIN_SYNC_INTERVAL_MINUTES, rounded));
}

export function getSyncIntervalMinutes() {
  return clampIntervalMinutes(
    localStorage.getItem(SYNC_INTERVAL_KEY) ?? DEFAULT_SYNC_INTERVAL_MINUTES,
  );
}

/** Persists the interval and restarts the running timer to pick it up immediately — a PT changing
 * "sync every 5 min" to "1 min" shouldn't have to wait out the old interval once first. */
export function setSyncIntervalMinutes(minutes) {
  const clamped = clampIntervalMinutes(minutes);
  localStorage.setItem(SYNC_INTERVAL_KEY, String(clamped));
  if (periodicTimer) startPeriodicSync();
  return clamped;
}

let periodicTimer = null;

function periodicTick() {
  if (!isDriveSyncConfigured() || !hasStoredConsent() || syncing) return;
  syncNow().catch((err) => console.warn("Periodic Drive sync failed:", err));
}

/** Start (or restart, picking up a new interval) the periodic pull. Safe to call repeatedly — always
 * clears any existing timer first, so app.js's boot call and a later interval-setting change never
 * stack two timers. A no-op tick when not connected costs nothing, so this runs unconditionally; the
 * actual network gate is in periodicTick(). */
export function startPeriodicSync() {
  if (periodicTimer) clearInterval(periodicTimer);
  periodicTimer = setInterval(periodicTick, getSyncIntervalMinutes() * 60_000);
}

/** First-time consent grant (must run inside a user-gesture handler) followed by an immediate sync. */
export async function connectDriveSync() {
  const token = await requestAccessToken({ interactive: true });
  if (!token) {
    const result = { ok: false, error: "consent_declined_or_unavailable", at: Date.now() };
    lastSyncResult = result;
    return result;
  }
  return syncNow();
}

export async function disconnectDriveSync() {
  await revokeAccess();
  lastSyncResult = null;
}

/**
 * Run one sync pass: silently refresh the access token, download the current Drive file (if any),
 * three-way merge it against the last-synced ancestor and the live local state, apply the result
 * locally, then upload the merged state as the new Drive content and record it as the new ancestor.
 *
 * Safe to call repeatedly (poll-on-resume, a manual "Sync now" tap) — a no-op re-sync converges on
 * the same state it started from because the merge of three identical snapshots is that snapshot.
 */
export async function syncNow() {
  if (!isDriveSyncConfigured()) return { ok: false, error: "not_configured", at: Date.now() };
  if (!hasStoredConsent()) return { ok: false, error: "not_connected", at: Date.now() };
  if (syncing) return { ok: false, error: "already_syncing", at: Date.now() };

  syncing = true;
  try {
    const token = await requestAccessToken({ interactive: false });
    if (!token) {
      const result = { ok: false, error: "auth_required", at: Date.now() };
      lastSyncResult = result;
      return result;
    }

    const meta = (await readDriveSyncMeta()) || { fileId: null, ancestor: {} };
    let fileId = meta.fileId;
    let remoteState = {};
    if (!fileId) {
      const existing = await findSyncFile(token);
      if (existing) fileId = existing.id;
    }
    if (fileId) {
      remoteState = (await downloadSyncFile(token, fileId)) || {};
    }

    const localState = getState();
    const { mergedState, conflicts } = mergeState(COLLECTIONS, {
      base: meta.ancestor || {},
      local: localState,
      remote: remoteState,
    });

    for (const collection of COLLECTIONS) {
      localState[collection] = mergedState[collection];
    }
    setState(localState);
    saveToLocalStorage();

    if (fileId) {
      await updateSyncFile(token, fileId, mergedState);
    } else {
      const created = await createSyncFile(token, mergedState);
      fileId = created.id;
    }
    await writeDriveSyncMeta({ fileId, ancestor: mergedState });

    const result = { ok: true, at: Date.now(), conflicts };
    lastSyncResult = result;
    return result;
  } catch (error) {
    const result = { ok: false, error: String(error?.message || error), at: Date.now() };
    lastSyncResult = result;
    return result;
  } finally {
    syncing = false;
  }
}
