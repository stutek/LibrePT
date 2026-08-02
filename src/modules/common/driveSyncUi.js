// src/modules/common/driveSyncUi.js — wires the "Cloud Backup (Google Drive)" card in the Sync &
// Backup dialog (rendered by backupRestore.js) to driveSyncService.js.
// Single responsibility: DOM wiring and status rendering for that one card. Knows nothing about auth,
// merging, or the Drive REST API — those live in driveSyncService.js and what it delegates to.
//
// deps: { t }

import {
  MAX_SYNC_INTERVAL_MINUTES,
  MIN_SYNC_INTERVAL_MINUTES,
  connectDriveSync,
  disconnectDriveSync,
  driveSyncStatus,
  setSyncIntervalMinutes,
  syncNow,
} from "../../data/driveSyncService.js";
import { preloadGoogleIdentityServices } from "./googleAuth.js";

let deps = null;

export function initDriveSyncUi(d) {
  deps = d;
}

function tr(key, fallback) {
  return deps?.t?.(key) || fallback;
}

function formatLastSync(status) {
  if (!status.lastSyncResult) return "";
  const { ok, at, conflicts, error } = status.lastSyncResult;
  const when = new Date(at).toLocaleTimeString();
  if (!ok) {
    if (error === "auth_required") {
      return tr("drive_sync_status_reauth", `Session expired — tap to reconnect (${when}).`);
    }
    return tr("drive_sync_status_error", `Sync failed at ${when}: ${error}`).replace(
      "{error}",
      String(error),
    );
  }
  if (conflicts?.length) {
    return `${tr("drive_sync_status_ok_conflicts", "Synced with conflicts to review")} (${conflicts.length}) — ${when}`;
  }
  return `${tr("drive_sync_status_ok", "Synced")} ${when}`;
}

function connectedDesc() {
  return tr(
    "drive_sync_desc_connected",
    "Keep your clients, routines and session history mirrored across your own devices, in a hidden app folder only LibrePT can see in your Google Drive.",
  );
}

// Pure: status -> what the card should show. Kept separate from the DOM writes below so each stays
// simple on its own — this is branchy by nature (three card states), the DOM half isn't.
function cardStateFor(status) {
  if (!status.configured) {
    return {
      desc: tr(
        "drive_sync_not_configured",
        "Google Drive sync isn't set up for this deployment yet.",
      ),
      connectDisabled: true,
      connectLabel: tr("drive_sync_connect", "Connect Google Drive"),
      disconnectVisible: false,
      intervalVisible: false,
      intervalMinutes: status.intervalMinutes,
      statusText: "",
      statusClass: "status-msg",
    };
  }
  const busyLabel = tr("drive_sync_syncing", "Syncing…");
  if (status.connected) {
    const failed = Boolean(status.lastSyncResult && !status.lastSyncResult.ok);
    return {
      desc: connectedDesc(),
      connectDisabled: status.syncing,
      connectLabel: status.syncing ? busyLabel : tr("drive_sync_now", "Sync Now"),
      disconnectVisible: true,
      intervalVisible: true,
      intervalMinutes: status.intervalMinutes,
      statusText: formatLastSync(status),
      statusClass: `status-msg ${failed ? "text-danger" : "text-emerald"}`,
    };
  }
  return {
    desc: connectedDesc(),
    connectDisabled: status.syncing,
    connectLabel: status.syncing ? busyLabel : tr("drive_sync_connect", "Connect Google Drive"),
    disconnectVisible: false,
    intervalVisible: false,
    intervalMinutes: status.intervalMinutes,
    statusText: "",
    statusClass: "status-msg",
  };
}

function applyCardState(state) {
  const set = (id, fn) => {
    const el = document.getElementById(id);
    if (el) fn(el);
  };
  set("drive-sync-desc", (el) => {
    el.textContent = state.desc;
  });
  set("btn-drive-connect", (el) => {
    el.disabled = state.connectDisabled;
  });
  set("btn-drive-connect-text", (el) => {
    el.textContent = state.connectLabel;
  });
  set("btn-drive-disconnect", (el) => el.classList.toggle("hidden", !state.disconnectVisible));
  set("drive-sync-interval-row", (el) => el.classList.toggle("hidden", !state.intervalVisible));
  set("drive-sync-interval", (el) => {
    // Never clobber the value while the trainer is mid-edit — this element is re-rendered on every
    // sync tick (periodic timer, poll-on-resume), not just on an explicit user action.
    if (document.activeElement !== el) el.value = String(state.intervalMinutes);
  });
  set("drive-sync-status", (el) => {
    el.textContent = state.statusText;
    el.className = state.statusClass;
  });
}

export function renderDriveSyncCard() {
  if (!document.getElementById("drive-sync-card")) return;
  applyCardState(cardStateFor(driveSyncStatus()));
}

/** Called by the "backup" route's `open` hook, before the dialog is shown — starts the GIS script
 * loading ahead of time (see `preloadGoogleIdentityServices`) so the Connect button's click handler
 * below can call `connectDriveSync()` with no `await` standing between the click and the popup
 * request, keeping it inside the same user-gesture the browser's popup blocker requires. */
export function prepareDriveSyncCard() {
  preloadGoogleIdentityServices();
  renderDriveSyncCard();
}

export function setupDriveSyncUi() {
  renderDriveSyncCard();

  const connectBtn = document.getElementById("btn-drive-connect");
  if (connectBtn) {
    connectBtn.addEventListener("click", async () => {
      const status = driveSyncStatus();
      if (!status.configured || status.syncing) return;
      // connectDriveSync()/syncNow() are called directly off the click event, with the GIS script
      // already preloaded by prepareDriveSyncCard() — see that function's docstring for why the
      // ordering here matters for the consent popup.
      if (status.connected) {
        await syncNow();
      } else {
        await connectDriveSync();
      }
      renderDriveSyncCard();
    });
  }

  const disconnectBtn = document.getElementById("btn-drive-disconnect");
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", async () => {
      await disconnectDriveSync();
      renderDriveSyncCard();
    });
  }

  const intervalInput = document.getElementById("drive-sync-interval");
  if (intervalInput) {
    intervalInput.setAttribute("min", String(MIN_SYNC_INTERVAL_MINUTES));
    intervalInput.setAttribute("max", String(MAX_SYNC_INTERVAL_MINUTES));
    // "change" (commits on blur/Enter), not "input" (fires per keystroke) — a half-typed number
    // must not restart the periodic timer on every digit.
    intervalInput.addEventListener("change", () => {
      setSyncIntervalMinutes(intervalInput.value);
      renderDriveSyncCard();
    });
  }

  setupHeaderCloudIconSync();
}

/** The header's cloud/sync icon (#backup-btn) already opens the Sync & Backup dialog via
 * backupRestore.js's own listener — this adds a second, independent listener that also fires an
 * immediate sync when already connected, so tapping the header icon is a one-tap "sync now" and not
 * just a way to reach the dialog's own button. */
function setupHeaderCloudIconSync() {
  const headerCloudBtn = document.getElementById("backup-btn");
  if (!headerCloudBtn) return;
  headerCloudBtn.addEventListener("click", () => {
    const status = driveSyncStatus();
    if (!status.configured || !status.connected || status.syncing) return;
    syncNow().finally(renderDriveSyncCard);
    renderDriveSyncCard(); // reflect "Syncing…" immediately, without waiting for the promise
  });
}
