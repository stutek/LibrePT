// src/modules/common/driveSyncUi.js — wires the "Cloud Backup (Google Drive)" card in the Sync &
// Backup dialog (rendered by backupRestore.js) to driveSyncService.js.
// Single responsibility: DOM wiring and status rendering for that one card. Knows nothing about auth,
// merging, or the Drive REST API — those live in driveSyncService.js and what it delegates to.
//
// deps: { t, renderSyncBadge, renderNotificationArea }

import {
  MAX_SYNC_INTERVAL_MINUTES,
  MIN_SYNC_INTERVAL_MINUTES,
  connectDriveSync,
  disconnectDriveSync,
  driveSyncStatus,
  resolveSyncConflict,
  setSyncIntervalMinutes,
  syncNow,
} from "../../data/driveSyncService.js";
import { preloadGoogleIdentityServices } from "../../data/googleAuth.js";
import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

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
    // Google refused the account outright. Said plainly because the trainer did nothing wrong and
    // retrying cannot help: while the OAuth app is in Testing only listed test users may grant
    // access. Deliberately NOT worded as "preview mode" — that phrase already means the data-loss
    // warning in this app (docs/PREVIEW.md, the header PREVIEW tag), and collapsing the two would
    // blunt the one that matters more.
    if (error === "access_denied") {
      return tr(
        "drive_sync_status_denied",
        "Google hasn't approved this account for sync yet. Your data is safe on this device.",
      );
    }
    // Closing the consent popup is a choice, not a fault — acknowledge and stop.
    if (error === "consent_declined") {
      return tr("drive_sync_status_declined", "Not connected — you can connect any time.");
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
      reviewVisible: false,
      reviewLabel: "",
    };
  }
  const busyLabel = tr("drive_sync_syncing", "Syncing…");
  if (status.connected) {
    const failed = Boolean(status.lastSyncResult && !status.lastSyncResult.ok);
    const conflictCount = status.lastSyncResult?.ok
      ? status.lastSyncResult.conflicts?.length || 0
      : 0;
    return {
      desc: connectedDesc(),
      connectDisabled: status.syncing,
      connectLabel: status.syncing ? busyLabel : tr("drive_sync_now", "Sync Now"),
      disconnectVisible: true,
      intervalVisible: true,
      intervalMinutes: status.intervalMinutes,
      statusText: formatLastSync(status),
      statusClass: `status-msg ${failed ? "text-danger" : "text-emerald"}`,
      reviewVisible: conflictCount > 0,
      reviewLabel: `${tr("drive_sync_review_conflicts", "Review conflicts")} (${conflictCount})`,
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
    reviewVisible: false,
    reviewLabel: "",
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
  set("btn-drive-review-conflicts", (el) => el.classList.toggle("hidden", !state.reviewVisible));
  set("btn-drive-review-conflicts-text", (el) => {
    el.textContent = state.reviewLabel;
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

  renderConflictsDialog();
  const reviewBtn = document.getElementById("btn-drive-review-conflicts");
  if (reviewBtn) {
    reviewBtn.addEventListener("click", () => {
      renderConflictsList();
      openModal("dialog-drive-conflicts");
    });
  }
}

const CONFLICT_TYPE_LABELS = {
  "add-add": ["drive_conflict_type_add_add", "Created on both devices"],
  "edit-vs-edit": ["drive_conflict_type_edit_edit", "Edited on both devices"],
  "delete-vs-edit": ["drive_conflict_type_delete_edit", "Deleted on this device, edited elsewhere"],
  "edit-vs-delete": ["drive_conflict_type_edit_delete", "Edited on this device, deleted elsewhere"],
};

function conflictTypeLabel(type) {
  const [key, fallback] = CONFLICT_TYPE_LABELS[type] || [null, type];
  return key ? tr(key, fallback) : fallback;
}

// Builds one side of a conflict card entirely via DOM APIs (createElement/textContent), never
// innerHTML — the two records are arbitrary trainer/client data (names, notes, injury text) and
// routing them through an HTML sink would need per-field escaping for no benefit, since a `<pre>`
// with plain text renders identically either way.
function buildConflictSide(label, record) {
  const wrap = document.createElement("div");
  wrap.className = "conflict-side";
  const heading = document.createElement("div");
  heading.className = "conflict-side-label";
  heading.textContent = label;
  wrap.appendChild(heading);
  const pre = document.createElement("pre");
  pre.className = "conflict-json";
  pre.textContent = record
    ? JSON.stringify(record, null, 2)
    : tr("drive_conflict_deleted", "— deleted —");
  wrap.appendChild(pre);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn secondary-btn conflict-keep-btn";
  btn.textContent = record
    ? tr("drive_conflict_keep", "Keep this version")
    : tr("drive_conflict_keep_deleted", "Delete anyway");
  wrap.appendChild(btn);
  return { wrap, btn };
}

function buildConflictCard(conflict) {
  const card = document.createElement("div");
  card.className = "conflict-item card";

  const header = document.createElement("div");
  header.className = "conflict-item-header";
  const title = document.createElement("span");
  title.className = "conflict-collection";
  title.textContent = conflict.collection;
  const typeBadge = document.createElement("span");
  typeBadge.className = "badge";
  typeBadge.textContent = conflictTypeLabel(conflict.type);
  header.append(title, typeBadge);
  card.appendChild(header);

  const sides = document.createElement("div");
  sides.className = "conflict-sides";
  const local = buildConflictSide(tr("drive_conflict_local", "This device"), conflict.local);
  const remote = buildConflictSide(tr("drive_conflict_remote", "Other device"), conflict.remote);
  local.btn.addEventListener("click", () => {
    resolveSyncConflict(conflict, "local");
    renderConflictsList();
    renderDriveSyncCard();
  });
  remote.btn.addEventListener("click", () => {
    resolveSyncConflict(conflict, "remote");
    renderConflictsList();
    renderDriveSyncCard();
  });
  sides.append(local.wrap, remote.wrap);
  card.appendChild(sides);

  return card;
}

function renderConflictsList() {
  const list = document.getElementById("drive-conflicts-list");
  if (!list) return;
  const conflicts = driveSyncStatus().lastSyncResult?.conflicts || [];
  list.replaceChildren();
  if (conflicts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "dialog-desc";
    empty.textContent = tr("drive_conflict_none", "No conflicts left to review.");
    list.appendChild(empty);
    return;
  }
  for (const conflict of conflicts) list.appendChild(buildConflictCard(conflict));
}

function renderConflictsDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-drive-conflicts"),
    `
<dialog id="dialog-drive-conflicts" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="drive-conflicts-title">Review sync conflicts</h3>
      <button class="modal-close-btn" aria-label="Close conflict review"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body-scroll">
      <p id="drive-conflicts-desc" class="dialog-desc">These records changed on two devices since the last sync. Pick which version to keep — the other side is discarded once you choose.</p>
      <div id="drive-conflicts-list"></div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn primary-btn modal-cancel">Done</button>
    </div>
  </dialog>
`,
  );
  const dialog = document.getElementById("dialog-drive-conflicts");
  if (!dialog) return;
  for (const btn of dialog.querySelectorAll(".modal-close-btn, .modal-cancel")) {
    btn.addEventListener("click", () => closeModal("dialog-drive-conflicts"));
  }
}

/** The last sync failure as `{ at, message }`, or null when the last sync was fine or none has run.
 *
 * Exported for the notification feed (domain/notificationItems.js): once a header tap syncs
 * directly rather than opening this dialog, a failure reported ONLY in here is a failure nobody
 * sees. The wording is `formatLastSync`'s, so the two surfaces cannot drift into describing the
 * same failure differently. */
export function driveSyncFailureNotice() {
  const status = driveSyncStatus();
  if (!status.lastSyncResult || status.lastSyncResult.ok !== false) return null;
  return { at: status.lastSyncResult.at, message: formatLastSync(status) };
}

/** Handles a tap on the header cloud (#backup-btn), returning true when it took the tap.
 *
 * Connected, this is "sync now" — the dialog is one extra tap nobody needed, and stays reachable
 * from the ☰ menu (TODO §3.11). Not connected, it declines the tap so backupRestore.js's listener
 * opens the dialog, which is where connecting actually happens.
 *
 * Two outcomes still open UI, and both are deliberate: conflicts open the review modal, because the
 * review UI genuinely lives there and silently swallowing a conflict is worse than an extra tap;
 * a failure repaints the header glyph and the notification feed, which is the failure's home
 * outside the dialog. */
export function handleHeaderCloudTap() {
  const status = driveSyncStatus();
  if (!status.configured || !status.connected) return false;
  // A tap while a sync is already running is a no-op, not a queued second sync — but it must not
  // fall through to opening the dialog either, or an impatient double tap lands somewhere the
  // first tap never promised.
  if (status.syncing) return true;

  syncNow()
    .then((result) => {
      if (result?.conflicts?.length) {
        renderConflictsList();
        openModal("dialog-drive-conflicts");
      }
    })
    .finally(repaintSyncSurfaces);
  // Repaint before awaiting anything: the header glyph starts spinning on the tap itself, which is
  // the only feedback a trainer gets that the tap registered at all now that no dialog opens.
  repaintSyncSurfaces();
  return true;
}

// The header badge repaints itself off onStateSaved/onSyncCountsChanged, but neither fires for the
// start of a sync or for one that failed before writing anything — the two moments this control
// most needs to reflect. Injected rather than imported so this module stays free of the header.
function repaintSyncSurfaces() {
  renderDriveSyncCard();
  deps?.renderSyncBadge?.();
  deps?.renderNotificationArea?.();
}
