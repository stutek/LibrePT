// src/data/driveSyncService.js — orchestrates Google Drive appDataFolder sync (TODO §1.5/§3.3/§3.10).
// Single responsibility: connect/disconnect the OAuth grant, and run one sync pass (download → merge
// → apply locally → upload). Delegates auth to googleAuth.js, the wire format to driveAppData.js, and
// the actual merge decision to the pure functions in syncMerge.js — this module is the glue between
// them and stateStore.js's `getState`/`setState`/`saveToLocalStorage`.
//
// **Manual-only syncing (TODO §3.10)**: `syncNow()` is the only function that merges, applies, or
// uploads anything, and it only ever runs from an explicit trainer tap — the dialog's "Sync Now"
// button, the first-connect flow, or the header cloud icon (driveSyncUi.js). The periodic timer and
// tab-resume hook (below, and appLifecycleController.js) never call it; they call the read-only
// `refreshSyncCounts()` instead, so a device left open on the gym floor keeps an honest ahead/behind
// badge without ever writing to Drive or local state in the background.
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
// path has real usage to size against.
//
// **Conflict review**: a sync pass applies a safe default per conflict (an edit always wins over a
// deletion; a same-record double-edit takes the local side) and reports every conflict it could not
// resolve on its own via `driveSyncStatus().lastSyncResult.conflicts`. `resolveSyncConflict()` below
// lets a trainer override that default per record — it doesn't re-run the merge, it just overwrites
// the one record in local state with whichever side was picked (or deletes it, for the
// deletion-vs-edit types) and drops the conflict from `lastSyncResult` so the review UI's count goes
// down. The next sync pass uploads that choice like any other local edit — there's no separate
// "resolution" concept on the wire, which is what keeps this override safe to skip entirely.
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

import { createSyncFile, downloadSyncFile, findSyncFile, updateSyncFile } from "./driveAppData.js";
import { isDriveSyncConfigured } from "./driveSyncConfig.js";
import { syncErasureRegister } from "./erasureRegisterSync.js";
import {
  applySuppressions,
  readSuppressionList,
  writeSuppressionList,
} from "./erasureSuppression.js";
import { hasStoredConsent, requestAccessToken, revokeAccess } from "./googleAuth.js";
import { COLLECTIONS } from "./recordProjections.js";
import {
  getState,
  readDriveSyncMeta,
  saveToLocalStorage,
  setState,
  writeDriveSyncMeta,
} from "./stateStore.js";
import { countChangedRecords, mergeState } from "./syncMerge.js";

let syncing = false;
let lastSyncResult = null;

// The real ahead/behind counters (replaces the header badge's former hardcoded mock, TODO §3.9).
// `cachedAncestor` is the last-synced snapshot, kept in memory so `getAheadCount()` can be
// synchronous (every render-badge call site is sync) without re-reading IndexedDB each time. `null`
// until `primeAheadCache()` resolves at boot or a sync completes — "ahead" reads 0 until then, which
// is the honest answer: with no known ancestor there is nothing yet to compare against.
let cachedAncestor = null;

/** Populates `cachedAncestor` from IndexedDB meta — a local-only read, no network. Called once at
 * boot (app.js); safe to call again any time (e.g. after a reset) since it just re-reads. */
export async function primeAheadCache() {
  const meta = await readDriveSyncMeta();
  cachedAncestor = meta?.ancestor || null;
}

/** Real, live count of local records changed since the last-synced ancestor — "how many of my own
 * edits haven't reached Drive yet". 0 when never synced: with no ancestor there is no meaningful
 * "since" to diff against, and showing the whole dataset as "ahead" would be noise, not signal. */
export function getAheadCount() {
  if (!cachedAncestor) return 0;
  return countChangedRecords(COLLECTIONS, cachedAncestor, getState());
}

// "Remote changes not yet pulled" — kept live by refreshSyncCounts() below, not by a sync pass:
// syncing is now manual-only (TODO §3.10), so a trainer who hasn't tapped "Sync Now" in a while still
// needs an honest count of what's waiting on Drive. `cachedBehind` is 0 until the first counter
// refresh resolves (boot, periodic tick, or tab resume), same "no data yet" convention as
// `cachedAncestor`/`getAheadCount()`.
let cachedBehind = 0;

function getBehindCount() {
  return cachedBehind;
}

// Single-listener seam (mirrors stateStore.js's onStateSaved) so app.js can re-render the header
// badge when a counts-only refresh changes `cachedBehind` — the only path that already forces a
// re-render, onStateSaved, only fires for LOCAL writes, which a read-only remote diff never causes.
let countsChangedListener = null;

export function onSyncCountsChanged(listener) {
  countsChangedListener = listener;
}

function notifyCountsChanged() {
  if (typeof countsChangedListener === "function") countsChangedListener();
}

export function driveSyncStatus() {
  const reachable = Boolean(hasStoredConsent() && lastSyncResult?.ok !== false);
  return {
    configured: isDriveSyncConfigured(),
    connected: hasStoredConsent(),
    reachable,
    syncing,
    lastSyncResult,
    intervalMinutes: getSyncIntervalMinutes(),
    ahead: getAheadCount(),
    behind: getBehindCount(),
  };
}

/**
 * Read-only counter refresh (TODO §3.10: Drive syncing is manual-only — a trainer must tap "Sync Now"
 * or the header cloud icon for any merge/upload to happen). Unlike syncNow(), this NEVER merges,
 * applies, or uploads anything: it downloads the remote file purely to diff it against the last
 * synced ancestor via `countChangedRecords()`, so the header badge's ahead/behind counts stay
 * accurate between manual syncs without ever writing to Drive or to local state in the background.
 * Any failure (offline, token needs an interactive re-prompt, no file yet) just leaves the counts as
 * they were — a background counter tick failing silently is correct; a manual "Sync Now" tap is the
 * only place a failure should surface to the trainer.
 */
export async function refreshSyncCounts() {
  if (!isDriveSyncConfigured() || !hasStoredConsent() || syncing) return;
  try {
    const token = await requestAccessToken({ interactive: false });
    if (!token) return;

    const meta = (await readDriveSyncMeta()) || { fileId: null, ancestor: {} };
    let fileId = meta.fileId;
    if (!fileId) {
      const existing = await findSyncFile(token);
      if (existing) fileId = existing.id;
    }
    const remoteState = fileId ? (await downloadSyncFile(token, fileId)) || {} : {};
    cachedBehind = countChangedRecords(COLLECTIONS, meta.ancestor || {}, remoteState);
    notifyCountsChanged();
  } catch (error) {
    console.warn("Drive sync counter refresh failed:", error);
  }
}

// Periodic counter refresh (in addition to refresh-on-resume): a PT-configurable "how often" for
// devices left open on the gym floor rather than backgrounded/resumed. Only ever calls
// refreshSyncCounts() below (TODO §3.10: manual-only syncing) — this interval governs how fresh the
// header badge's numbers are, never how often an actual merge/upload happens. A plain localStorage
// key, not IndexedDB — this is a per-device preference (like the theme choice), not domain data any
// schema/star-write covers.
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
  refreshSyncCounts();
}

/** Start (or restart, picking up a new interval) the periodic counter refresh. Safe to call
 * repeatedly — always clears any existing timer first, so app.js's boot call and a later
 * interval-setting change never stack two timers. A no-op tick when not connected costs nothing, so
 * this runs unconditionally; the actual network gate is in refreshSyncCounts(). */
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
// The snapshot file's id and content, resolving the id from Drive when this device has never
// recorded one. Extracted from syncNow purely to keep that function under the complexity gate — it
// has no independent meaning.
async function fetchRemoteSnapshot(token, meta) {
  let fileId = meta.fileId;
  if (!fileId) {
    const existing = await findSyncFile(token);
    if (existing) fileId = existing.id;
  }
  const remoteState = fileId ? (await downloadSyncFile(token, fileId)) || {} : {};
  return { fileId, remoteState };
}

// Kept out of syncNow's body so a Drive hiccup on the register cannot fail a state sync that
// otherwise succeeded — the register heals on the next pass, whereas a failed state sync loses the
// trainer's work window. Returns null when it could not run.
async function syncRegister(mergedState) {
  try {
    const token = await requestAccessToken({ interactive: false });
    if (!token) return null;
    const result = await syncErasureRegister(token, {
      localList: readSuppressionList(),
      state: mergedState,
      drive: {
        findFile: findSyncFile,
        downloadFile: downloadSyncFile,
        createFile: createSyncFile,
        updateFile: updateSyncFile,
      },
    });
    writeSuppressionList(result.list);
    return result;
  } catch {
    return null;
  }
}

export async function syncNow() {
  if (!isDriveSyncConfigured()) return { ok: false, error: "not_configured", at: Date.now() };
  if (!hasStoredConsent()) return { ok: false, error: "not_connected", at: Date.now() };
  if (syncing) return { ok: false, error: "already_syncing", at: Date.now() };

  syncing = true;
  let reErasedOnSync = [];
  try {
    const token = await requestAccessToken({ interactive: false });
    if (!token) {
      const result = { ok: false, error: "auth_required", at: Date.now() };
      lastSyncResult = result;
      return result;
    }

    const meta = (await readDriveSyncMeta()) || { fileId: null, ancestor: {} };
    const { fileId, remoteState } = await fetchRemoteSnapshot(token, meta);

    const localState = getState();
    const { mergedState, conflicts } = mergeState(COLLECTIONS, {
      base: meta.ancestor || {},
      local: localState,
      remote: remoteState,
    });

    for (const collection of COLLECTIONS) {
      localState[collection] = mergedState[collection];
    }

    // The register rides the same pass, BEFORE the merged state is applied: a client another device
    // erased must not surface here even briefly, and must not be written to disk under their name
    // on the way through. This is what makes an erasure a promise kept on every device rather than
    // only on the one it was performed on.
    const registerResult = await syncRegister(mergedState);
    if (registerResult) {
      const filtered = await applySuppressions(mergedState, registerResult.list);
      for (const collection of COLLECTIONS) {
        localState[collection] = filtered.state[collection];
      }
      reErasedOnSync = filtered.reErased;
    }

    setState(localState);
    saveToLocalStorage();

    const writtenFileId = fileId || (await createSyncFile(token, mergedState)).id;
    if (fileId) await updateSyncFile(token, fileId, mergedState);
    await writeDriveSyncMeta({ fileId: writtenFileId, ancestor: mergedState });
    cachedAncestor = mergedState;

    const result = { ok: true, at: Date.now(), conflicts, reErased: reErasedOnSync };
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

/**
 * Override a merge's default pick for one conflict — `keepSide` is `"local"` or `"remote"`,
 * whichever side of `conflict.local`/`conflict.remote` should survive (either may be `null`, which
 * means "delete this record": the deletion-vs-edit conflict types report the deleted side as `null`,
 * so choosing it is how a trainer can undo the "an edit always wins" default and honour the deletion
 * instead). Not a re-merge — just replaces the one record in local state and re-saves, exactly like
 * any other local edit; the next sync pass is what actually pushes it to Drive.
 */
export function resolveSyncConflict(conflict, keepSide) {
  const chosen = keepSide === "remote" ? conflict.remote : conflict.local;
  const state = getState();
  const records = (state[conflict.collection] || []).filter((r) => r.id !== conflict.id);
  if (chosen) records.push(chosen);
  state[conflict.collection] = records;
  setState(state);
  saveToLocalStorage();

  if (lastSyncResult?.conflicts) {
    lastSyncResult = {
      ...lastSyncResult,
      conflicts: lastSyncResult.conflicts.filter(
        (c) => !(c.collection === conflict.collection && c.id === conflict.id),
      ),
    };
  }
}
