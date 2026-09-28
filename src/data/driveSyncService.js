// src/data/driveSyncService.js — orchestrates Google Drive appDataFolder sync.
// Single responsibility: connect/disconnect the OAuth grant, and run one sync pass (download → merge
// → apply locally → upload). Delegates auth to googleAuth.js, the wire format to driveAppData.js, and
// the actual merge decision to the pure functions in syncMerge.js — this module is the glue between
// them and stateStore.js's `getState`/`setState`/`saveToLocalStorage`.
//
// **Manual-only syncing**: `syncNow()` is the only function that merges, applies, or
// uploads anything, and it only ever runs from an explicit trainer tap — the dialog's "Sync Now"
// button, the first-connect flow, or the header cloud icon (driveSyncUi.js). The periodic timer and
// tab-resume hook (below, and appLifecycleController.js) never call it; they call the read-only
// `refreshSyncCounts()` instead, so a device left open on the gym floor keeps an honest ahead/behind
// badge without ever writing to Drive or local state in the background.
//
// **Scope of what syncs**: the collections `recordProjections.js` projects (clients, exercises,
// routines, sessions, history, planUpdates, notifications) — i.e. everything a backup export already
// carries. `schemaVersion` and `lang` are per-device/per-build, not synced. Once Google Calendar
// integration exists as the source of truth for scheduling facts, this scope should narrow to
// app-only data with no Calendar equivalent; until then there is no Calendar-sourced overlap
// to exclude, so the full domain snapshot is what a PT actually needs mirrored across their devices.
//
// **The snapshot on Drive is encrypted when a backup password is set** (data/backupEncryption.js).
// Google encrypts Drive in transit and at rest already, but that is Google's key, not the trainer's:
// Google's own infrastructure can read the file. With a password set, the file in `appDataFolder` is
// an AES-GCM envelope and neither Google nor anyone who obtains the file can read a client's health
// record out of it. The erasure register is the one file left in the clear, on purpose — it holds
// salted hashes and nothing else (erasureSuppression.js), so there is nothing in it to disclose, and
// it has to be unionable across devices that may not share a password yet.
//
// **A sync does not run at all until a backup password is set** (except in the sandbox). Writing the
// database to Google unencrypted, once, leaves a copy behind that setting a password later does not
// reach — Drive keeps earlier versions of a file.
//
// **A device with no key must never merge an encrypted snapshot.** An unreadable download would look
// like an empty Drive file, and merging an empty remote against a populated ancestor is how a sync
// deletes the trainer's data on every device. So this asks for the password and stops.
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
// **Why no Lamport (deviceId, seq) pair**, even though concurrent writers might eventually need
// one to order edits deterministically: the three-way merge here never tries to ORDER two edits —
// it detects "changed on both sides since the shared ancestor" and reports a conflict rather than
// picking a winner by time. A Lamport pair only matters to a scheme that still wants a
// deterministic "which edit happened later"; this one deliberately never asks that question, so
// it never needed the clock substitute either.
//
// Injected dependencies: none at the module level — call sites are the UI layer (driveSyncUi.js) and
// app.js's lifecycle hook.

import { decryptBackup, encryptBackup, isEncryptedBackup } from "./backupEncryption.js";
import { ENCRYPTED_BACKUP_FORMAT } from "./backupFile.js";
import { backupKeyForWriting } from "./backupKeyStore.js";
import {
  createSyncFile,
  downloadSyncFile,
  findSyncFile,
  isAuthFailure,
  updateSyncFile,
} from "./driveAppData.js";
import { isDriveSyncConfigured } from "./driveSyncConfig.js";
import { syncErasureRegister } from "./erasureRegisterSync.js";
import {
  applySuppressions,
  readSuppressionList,
  writeSuppressionList,
} from "./erasureSuppression.js";
import {
  forgetStoredConsent,
  hasStoredConsent,
  lastAuthFailure,
  requestAccessToken,
  revokeAccess,
} from "./googleAuth.js";
import { withoutOpenEdits } from "./openRecordEdits.js";
import { COLLECTIONS } from "./recordProjections.js";
import { withoutSeedRecords } from "./seedProvenance.js";
import {
  getState,
  readDriveSyncMeta,
  recordBackupTaken,
  saveToLocalStorage,
  setState,
  writeDriveSyncMeta,
} from "./stateStore.js";
import { countChangedRecords, mergeState } from "./syncMerge.js";
import { SANDBOX, activeWorkspace } from "./workspace.js";

let syncing = false;
let lastSyncResult = null;
// The encrypted snapshot this device has no key for. Kept so the dialog can ask for THAT file's
// password: a freshly set password uses a fresh salt and would derive a different key, which could
// not open this file no matter how correctly it was typed.
let lockedSnapshot = null;

// The real ahead/behind counters (replaces the header badge's former hardcoded mock).
// `cachedAncestor` is the last-synced snapshot, kept in memory so `getAheadCount()` can be
// synchronous (every render-badge call site is sync) without re-reading IndexedDB each time. `null`
// until `primeAheadCache()` resolves at boot or a sync completes — and while it is null every local
// record counts as ahead, because none of them has reached Drive. See getAheadCount below for why
// that replaced an earlier "report 0 until we have something to diff against".
let cachedAncestor = null;

/** Populates `cachedAncestor` from IndexedDB meta — a local-only read, no network. Called once at
 * boot (app.js); safe to call again any time (e.g. after a reset) since it just re-reads. */
export async function primeAheadCache() {
  const meta = await readDriveSyncMeta();
  cachedAncestor = meta?.ancestor || null;
}

/** Real, live count of local records that have never reached Drive.
 *
 * **With no ancestor this counts the WHOLE dataset, and that changed on 2026-08-12.** It used to
 * return 0, reasoning that with no known ancestor there was nothing to diff against and showing
 * everything as ahead would be noise. That held only while `GOOGLE_DRIVE_CLIENT_ID` was blank and
 * nobody could sync at all — "never synced" was universal, so a 0 misled no one. Once a real client
 * id shipped, "connected, never synced" became reachable, and there a 0 does not read as "nothing to
 * report", it reads as "everything is backed up" while in fact nothing is.
 *
 * The same answer is right for a trainer who has never connected: treating their silence as an
 * informed choice to go local-only is a guess, and the cost of guessing wrong is every client record
 * lost to a browser cache clear (docs/PREVIEW.md says this can happen). A count is a fact, not a nag.
 *
 * Note this is a DRIVE-relative fact — "not on Drive" — so a downloaded JSON backup does not reduce
 * it, and should not: the data really is absent from Drive either way. What a file backup does clear
 * is the *escalation* (the unbacked-data warning banner), which reads `readBackupHistory()` rather
 * than this count, because that question is "is this data anywhere durable at all". Keeping the
 * two separate is what stops a safety indicator from quietly becoming a prompt to enable Google.
 */
export function getAheadCount() {
  // An empty ancestor makes countChangedRecords see every record as an addition — the honest
  // reading of "none of this has ever been pushed".
  //
  // Seeded demo records are excluded from BOTH sides, so loading the demo never inflates this
  // count: the count is about work the trainer would lose, and a sales demo is not that. Filtering
  // the ancestor too keeps the diff symmetric, so a demo record that reached Drive before this rule
  // shipped cannot come back as a phantom deletion.
  //
  // A record still open in its form counts as it was before the form opened.
  return countChangedRecords(
    COLLECTIONS,
    withoutSeedRecords(cachedAncestor || {}),
    withoutSeedRecords(withoutOpenEdits(getState())),
  );
}

// "Remote changes not yet pulled" — kept live by refreshSyncCounts() below, not by a sync pass:
// syncing is manual-only, so a trainer who hasn't tapped "Sync Now" in a while still
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
 * Read-only counter refresh (Drive syncing is manual-only — a trainer must tap "Sync Now"
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
    // Through the SAME reader syncNow uses, so an encrypted snapshot is decrypted here too. Counting
    // an envelope as an empty remote would report the whole database as "behind" and send a trainer
    // to sync away a difference that does not exist.
    const { remoteState, locked } = await fetchRemoteSnapshot(token, meta);
    // No key for this file: the counts stay as they were, like every other failure here.
    if (locked) return;
    cachedBehind = countChangedRecords(COLLECTIONS, meta.ancestor || {}, remoteState);
    notifyCountsChanged();
  } catch (error) {
    console.warn("Drive sync counter refresh failed:", error);
  }
}

// Periodic counter refresh (in addition to refresh-on-resume): a PT-configurable "how often" for
// devices left open on the gym floor rather than backgrounded/resumed. Only ever calls
// refreshSyncCounts() below (syncing is manual-only) — this interval governs how fresh the
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
    // "Declined or unavailable" covered both cases with one message and helped neither. A trainer
    // who closed the popup needs nothing said; one Google REFUSED needs to know it is not their
    // mistake and not something a retry fixes — while the OAuth app is in Testing, only listed test
    // users can grant at all.
    const error = lastAuthFailure() === "denied" ? "access_denied" : "consent_declined";
    const result = { ok: false, error, at: Date.now() };
    lastSyncResult = result;
    return result;
  }
  return syncNow();
}

/** The encrypted Drive snapshot the last pass could not open, or null. The dialog derives the key
 *  from THIS envelope's salt — see `lockedSnapshot` above for why a newly set password cannot do. */
export function lockedDriveSnapshot() {
  return lockedSnapshot;
}

/** End the app's Drive access at Google and forget it here; resolves to revokeAccess's outcome. */
export async function disconnectDriveSync() {
  const outcome = await revokeAccess();
  lastSyncResult = null;
  return outcome;
}

/** Forget the Drive connection on this device only. Google is not asked; other devices keep syncing. */
export function forgetDriveSyncOnThisDevice() {
  forgetStoredConsent();
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
  const downloaded = fileId ? (await downloadSyncFile(token, fileId)) || {} : {};
  if (!isEncryptedBackup(downloaded)) return { fileId, remoteState: downloaded };

  // Encrypted on Drive. Without the key this pass CANNOT continue: see the header — an unreadable
  // snapshot is indistinguishable from an empty one, and merging an empty remote would delete
  // records everywhere.
  const stored = await backupKeyForWriting();
  if (!stored) {
    lockedSnapshot = downloaded;
    return { fileId, remoteState: null, locked: true };
  }
  try {
    const remoteState = await decryptBackup(downloaded, { key: stored.key });
    lockedSnapshot = null;
    return { fileId, remoteState };
  } catch {
    // A key on this device, a file written with a different password. Same answer: stop, and keep the
    // file so the trainer can be asked for the password it was actually written with.
    lockedSnapshot = downloaded;
    return { fileId, remoteState: null, locked: true };
  }
}

// The bytes to upload: the snapshot in an AES-GCM envelope when this workspace has a backup
// password, the plain snapshot when it has none. The ancestor recorded in the meta store stays the
// PLAIN merged state either way — it is a local record of what Drive last saw, read by the next
// merge, and encrypting it would buy nothing while costing a decrypt on every pass.
async function snapshotForUpload(mergedState) {
  const stored = await backupKeyForWriting();
  if (!stored) return mergedState;
  return encryptBackup(mergedState, {
    key: stored.key,
    salt: stored.salt,
    iterations: stored.iterations,
    formatVersion: ENCRYPTED_BACKUP_FORMAT,
  });
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

// Everything that has to succeed before a merge can be attempted: a live token, the meta record, and
// a snapshot this device can actually read. Returns `{ error }` for each case where the pass must stop
// having changed nothing — `auth_required`, and `backup_password_required` for an encrypted Drive copy
// with no key here, which the dialog turns into "type your backup password".
async function prepareSyncPass() {
  // **A sync writes the trainer's whole database into Google's storage, so it does not run until that
  // copy can be encrypted.** Google encrypts Drive with Google's own key, which its own infrastructure
  // can read; this is the only thing that makes the file opaque to everyone but the trainer. The
  // sandbox is exempt: its records are sample data about nobody.
  if (activeWorkspace() !== SANDBOX && !(await backupKeyForWriting())) {
    return { error: "backup_password_not_set" };
  }
  const token = await requestAccessToken({ interactive: false });
  if (!token) return { error: "auth_required" };
  const meta = (await readDriveSyncMeta()) || { fileId: null, ancestor: {} };
  const { fileId, remoteState, locked } = await fetchRemoteSnapshot(token, meta);
  if (locked) return { error: "backup_password_required" };
  return { token, meta, fileId, remoteState };
}

export async function syncNow() {
  if (!isDriveSyncConfigured()) return { ok: false, error: "not_configured", at: Date.now() };
  if (!hasStoredConsent()) return { ok: false, error: "not_connected", at: Date.now() };
  if (syncing) return { ok: false, error: "already_syncing", at: Date.now() };

  syncing = true;
  let reErasedOnSync = [];
  try {
    const prepared = await prepareSyncPass();
    if (prepared.error) {
      const result = { ok: false, error: prepared.error, at: Date.now() };
      lastSyncResult = result;
      return result;
    }
    const { token, meta, fileId, remoteState } = prepared;

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

    // What goes on the wire, which is the merged snapshot itself only while no password is set.
    const outgoing = await snapshotForUpload(mergedState);
    const writtenFileId = fileId || (await createSyncFile(token, outgoing)).id;
    if (fileId) await updateSyncFile(token, fileId, outgoing);
    await writeDriveSyncMeta({ fileId: writtenFileId, ancestor: mergedState });
    cachedAncestor = mergedState;
    // The data now exists somewhere the browser cannot evict — the other half of what the
    // unbacked-data warning banner asks about, which a downloaded backup file answers equally well.
    await recordBackupTaken("drive");

    const result = { ok: true, at: Date.now(), conflicts, reErased: reErasedOnSync };
    lastSyncResult = result;
    return result;
  } catch (error) {
    // A dead or revoked grant is the one failure a trainer can actually act on, and it is
    // indistinguishable from a transport error once flattened to a message string. Naming it here
    // is what turns an unactionable "sync failed" into "tap to reconnect" — and forgetting the
    // stored consent is what stops the card offering "Sync Now" for a session that cannot succeed.
    if (isAuthFailure(error)) {
      forgetStoredConsent();
      const result = { ok: false, error: "auth_required", at: Date.now() };
      lastSyncResult = result;
      return result;
    }
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
