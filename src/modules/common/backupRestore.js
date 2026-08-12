// src/modules/common/backupRestore.js
// Component that manages the data backup, JSON export, and JSON file import actions.
//
// deps: {
//   getState(),
//   setState(newState),
//   saveToLocalStorage(),
//   renderClientsList(),
//   renderRoutinesList(),
//   renderExercisesList(),
//   renderGlobalHistory(),
//   populateDropdownSelectors(),
//   renderSessions(),   // for the dialog's Sync Data button, which reseeds state.sessions
//   t
// }

import { buildBackupPayload, summarizeReplacement } from "../../data/backupFile.js";
import {
  applySuppressions,
  mergeSuppressionLists,
  readSuppressionList,
  writeSuppressionList,
} from "../../data/erasureSuppression.js";
import { DEFAULT_SESSIONS } from "../../data/index.js";
import { describeMigration, migrateState } from "../../data/schemaMigrations.js";
import { recordBackupTaken } from "../../data/stateStore.js";
import { catalogToCsv, catalogToInterchange } from "../../domain/exerciseStandard.js";
import { BUILD_INFO } from "../../version.js";
import { isOfflineCachedActive } from "./applicationHeader.js";
import { renderMarkupOnce } from "./dom.js";
import { downloadFile } from "./download.js";

let deps = null;

// A parsed, migrated database waiting for the trainer to confirm it may replace what they have.
// Held here rather than re-read from the file input, which browsers clear on re-render.
let pendingRestore = null;
let pendingSummary = null;
let confirmedRestore = false;

// Async because the erasure register has to be applied to the INCOMING data before it becomes the
// live database — not after, which would leave a window where the app holds names their owners
// asked to have removed, and would write them to disk on the way through.
async function applyRestoredState(restored) {
  const merged = mergeSuppressionLists(readSuppressionList(), restored?.erasureSuppressions);
  writeSuppressionList(merged);
  const { state: filtered, reErased } = await applySuppressions(restored, merged);
  // The register is not part of the database; it lives in localStorage and is written back into a
  // file only at export time. Destructured out rather than deleted so the live state never carries
  // a key the schema does not declare.
  const { erasureSuppressions: _register, ...database } = filtered;

  deps.setState(database);
  deps.saveToLocalStorage();
  pendingRestore = null;
  confirmedRestore = false;
  return reErased;
}

// The one place a successful import's status line is built, so the confirmed path cannot drift from
// the direct one. It once did: a hardcoded "Import successful!" on the confirm branch silently
// dropped the migration report — the very thing a trainer needs to see when old data moves.
// A restore that silently differs from the file the trainer chose is exactly the surprise this
// codebase keeps refusing to ship. If the erasure register filtered the incoming data, say so.
function erasureNotice(reErased) {
  if (!reErased || reErased.length === 0) return "";
  return `${reErased.length} previously-erased client(s) in this file were re-anonymised on import.`;
}

function renderImportSuccess(summary, reErased) {
  const importStatus = document.getElementById("import-status");
  if (!importStatus) return;
  importStatus.textContent = [
    summary && summary.fromVersion !== summary.toVersion
      ? `Import successful! Upgraded from schema ${summary.fromVersion}.`
      : "Import successful! Database synchronized.",
    erasureNotice(reErased),
  ]
    .filter(Boolean)
    .join(" ");
  importStatus.className = "status-msg text-emerald";
}

// Names what is about to be overwritten, per collection. "Replace 12 clients and 40 sessions?" is a
// sentence a trainer can weigh; "Are you sure?" is not.
function showReplaceConfirmation(replacing) {
  const box = document.getElementById("restore-confirm");
  const detail = document.getElementById("restore-confirm-detail");
  if (!box || !detail) return;
  const parts = Object.entries(replacing.counts).map(
    ([collection, count]) => `${count} ${collection}`,
  );
  detail.textContent = parts.join(", ");
  box.hidden = false;
}

function catalogFilename(extension) {
  return `librept_catalog_${new Date().toISOString().substring(0, 10)}.${extension}`;
}

export function initBackupRestore(d) {
  deps = d;
}

// Clear the previous import's status line. Called by the backup route before it shows the dialog.
export function prepareBackupDialog() {
  const importStatus = document.getElementById("import-status");
  if (importStatus) {
    importStatus.textContent = "";
    importStatus.className = "status-msg";
  }
}

export function renderBackupDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-backup"),
    `
<dialog id="dialog-backup" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3>Sync &amp; Backup Center</h3>
      <button class="modal-close-btn" aria-label="Close sync & backup modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body-scroll">
      <p class="dialog-desc">LibrePT stores your logs directly on this device. Sync the latest session schedule, download a backup file to keep your history safe, or import it to move to another phone.</p>

      <!-- Preview-build warning. A backup is written at the newest NUMBERED schema so any build can
           restore it, which means anything the preview shape added on top is NOT in the file. That
           is a real gap and it is stated here rather than left to be discovered after a restore.
           Spelled out in full, not an icon: this is the one thing a trainer needs to have read. -->
      <!-- Shown only when a restore would overwrite existing records. Hidden by default so the
           common case (restoring onto an empty device) stays one step. -->
      <div id="restore-confirm" class="restore-confirm" hidden>
        <p><i class="fa-solid fa-triangle-exclamation"></i>
          <strong>Restoring replaces everything on this device.</strong>
          You would lose: <span id="restore-confirm-detail"></span>.
        </p>
        <div class="restore-confirm-actions">
          <button type="button" class="btn-secondary" id="btn-restore-cancel">Keep what I have</button>
          <button type="button" class="btn-danger" id="btn-restore-confirm">Replace it</button>
        </div>
      </div>

      <p class="backup-preview-warning" id="backup-preview-warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span id="backup-preview-warning-text">This is a preview build. Backups and sync are written in the last stable format, so anything added by this preview is not included. Keep your own copy of anything you cannot lose.</span>
      </p>

      <div class="backup-actions">
        <div class="action-card card">
          <i class="fa-solid fa-arrows-rotate backup-icon-large text-primary"></i>
          <h4 id="sync-data-title">Sync Session Data</h4>
          <p id="sync-data-desc">Pull the latest bookings and session schedule from your connected calendar.</p>
          <button id="btn-sync-data" class="btn primary-btn w-full">
            <i class="fa-solid fa-arrows-rotate"></i> <span id="btn-sync-data-text">Sync Data</span>
          </button>
          <p id="sync-status" class="status-msg"></p>
        </div>

        <div class="action-card card" id="drive-sync-card">
          <i class="fa-brands fa-google-drive backup-icon-large text-primary"></i>
          <h4 id="drive-sync-title">Cloud Backup (Google Drive)</h4>
          <p id="drive-sync-desc">Keep your clients, routines and session history mirrored across your own devices, in a hidden app folder only LibrePT can see in your Google Drive.</p>
          <!-- Sync carries the SAME stable-format limitation as a downloaded backup, and needs the
               warning more: an export is something a trainer chooses in the moment, while sync runs
               unattended, so there is no point at which they would otherwise be told. -->
          <p class="backup-preview-warning" id="drive-sync-preview-warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span id="drive-sync-preview-warning-text">Preview build: sync writes the last stable format, so anything this preview added is not mirrored.</span>
          </p>
          <button id="btn-drive-connect" class="btn primary-btn w-full">
            <i class="fa-brands fa-google-drive"></i> <span id="btn-drive-connect-text">Connect Google Drive</span>
          </button>
          <button id="btn-drive-disconnect" class="btn secondary-btn w-full hidden">Disconnect</button>
          <div id="drive-sync-interval-row" class="drive-sync-interval-row hidden">
            <label for="drive-sync-interval" id="drive-sync-interval-label">Sync every</label>
            <input type="number" id="drive-sync-interval" class="form-control drive-sync-interval-input" min="1" max="60" step="1">
            <span id="drive-sync-interval-unit">min</span>
          </div>
          <p id="drive-sync-status" class="status-msg"></p>
          <button id="btn-drive-review-conflicts" class="btn secondary-btn w-full hidden"><i class="fa-solid fa-code-compare"></i> <span id="btn-drive-review-conflicts-text">Review conflicts</span></button>
        </div>

        <div class="action-card card">
          <i class="fa-solid fa-file-export backup-icon-large text-emerald"></i>
          <h4 id="backup-export-title">Export Data Backup</h4>
          <p id="backup-export-desc">Download your clients, routines, and workout logs as a single JSON file.</p>
          <button id="btn-export-db" class="btn primary-btn w-full">Export JSON</button>
        </div>

        <div class="action-card card">
          <i class="fa-solid fa-arrow-right-arrow-left backup-icon-large text-cyan"></i>
          <h4 id="catalog-export-title">Export Exercise Catalog</h4>
          <p id="catalog-export-desc">Export your movement catalog mapped to the open wger taxonomy, so it stays interchangeable with external tools.</p>
          <button id="btn-export-catalog-json" class="btn secondary-btn w-full">Export Catalog JSON</button>
          <button id="btn-export-catalog-csv" class="btn secondary-btn w-full">Export Catalog CSV</button>
        </div>

        <div class="action-card card">
          <i class="fa-solid fa-file-import backup-icon-large text-indigo"></i>
          <h4 id="backup-import-title">Import Data Backup</h4>
          <p id="backup-import-desc">Load an existing \`.json\` backup file. This will merge or overwrite your current database.</p>
          <div class="file-upload-wrapper">
            <button type="button" id="btn-select-json" class="btn secondary-btn w-full file-trigger">Select JSON File</button>
            <input type="file" id="import-db-file" accept=".json" class="file-input-hidden">
          </div>
          <p id="import-status" class="status-msg"></p>
        </div>
      </div>
    </div>
  </dialog>
`,
  );
}

// The dialog's "Sync Data" button. It lived in sessionsView.js's setupCalendarSessions until
// 2026-08-05 (TODO §22) — the sessions dashboard wiring a button whose markup belongs to this
// dialog, which is why a test of the offline signal had to boot a sessions-module function to reach
// a backup-dialog button. import_layers.py cannot catch that: both sides were legal cross-feature
// imports and the problem was ownership, not direction.
//
// `state` and `renderSessions` come from deps rather than an import, so this module still knows
// nothing about the sessions feature beyond "re-render it when the data changes".
function setupCalendarSync() {
  const syncBtn = document.getElementById("btn-sync-data");
  if (!syncBtn) return;
  const { getState, t, saveToLocalStorage, renderSessions } = deps;

  syncBtn.addEventListener("click", () => {
    const icon = syncBtn.querySelector("i");
    const btnText = document.getElementById("btn-sync-data-text");
    const status = document.getElementById("sync-status");

    if (icon) icon.classList.add("fa-spin");
    if (btnText) btnText.textContent = t("syncing_calendar");
    if (status) {
      status.textContent = "";
      status.className = "status-msg";
    }
    syncBtn.disabled = true;

    if (isOfflineCachedActive() || !navigator.onLine) {
      if (status) {
        status.textContent = t("offline_cached_desc");
        status.className = "status-msg text-danger";
      }
      if (icon) icon.classList.remove("fa-spin");
      if (btnText) btnText.textContent = t("btn_sync_data");
      syncBtn.disabled = false;
      return;
    }

    setTimeout(() => {
      getState().sessions = [...DEFAULT_SESSIONS];

      // saveToLocalStorage() (deps.saveToLocalStorage — app.js's saveState()) fires
      // onStateSaved's listener on its own now, which re-renders the header badge with a real
      // ahead count — no separate reset call needed (TODO §3.9).
      saveToLocalStorage();
      renderSessions();

      if (icon) icon.classList.remove("fa-spin");
      if (btnText) btnText.textContent = t("btn_sync_data");
      syncBtn.disabled = false;
      if (status) {
        status.textContent = t("calendar_synced");
        status.className = "status-msg text-emerald";
      }
    }, 1200);
  });
}

export function setupBackupRestore() {
  renderBackupDialog();
  setupCalendarSync(); // after renderBackupDialog — #btn-sync-data is part of that markup
  const dialog = document.getElementById("dialog-backup");
  if (!dialog) return;

  const importFile = document.getElementById("import-db-file");
  const importStatus = document.getElementById("import-status");

  // The dialog is a route: navigating opens it, so Back closes it and a reload reopens it. The
  // status line from a previous import is cleared by prepareBackupDialog(), which the route calls
  // before showing — a stale "restore failed" must not greet the next open.
  const backupBtn = document.getElementById("backup-btn");
  if (backupBtn) {
    backupBtn.addEventListener("click", () => deps.navigateToPath(deps.urlFor("backup")));
  }

  const closeBtn = dialog.querySelector(".modal-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => dialog.close());
  }

  // Restore confirmation. `confirmedRestore` is not a flag the import path checks forever — it is
  // cleared as soon as the pending state is applied, so a SECOND import still has to be confirmed.
  const restoreConfirmBtn = document.getElementById("btn-restore-confirm");
  if (restoreConfirmBtn) {
    restoreConfirmBtn.addEventListener("click", async () => {
      if (!pendingRestore) return;
      confirmedRestore = true;
      const summary = pendingSummary;
      const reErased = await applyRestoredState(pendingRestore);
      pendingSummary = null;
      const box = document.getElementById("restore-confirm");
      if (box) box.hidden = true;
      renderImportSuccess(summary, reErased);
      deps.renderClientsList();
      deps.renderRoutinesList();
      deps.renderExercisesList();
      deps.renderGlobalHistory();
      deps.populateDropdownSelectors();
    });
  }

  const restoreCancelBtn = document.getElementById("btn-restore-cancel");
  if (restoreCancelBtn) {
    restoreCancelBtn.addEventListener("click", () => {
      // Discard the parsed file entirely rather than leaving it primed — a trainer who declined
      // once must not have it applied by an unrelated later click.
      pendingRestore = null;
      pendingSummary = null;
      confirmedRestore = false;
      const box = document.getElementById("restore-confirm");
      if (box) box.hidden = true;
      const status = document.getElementById("import-status");
      if (status) {
        status.textContent = "Nothing was changed.";
        status.className = "status-msg";
      }
    });
  }

  // Export JSON — the whole local database, for backup / device migration.
  const exportBtn = document.getElementById("btn-export-db");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      // Built at the newest NUMBERED schema, not at the runtime one (data/backupFile.js): a file
      // written at the unstable preview shape is restorable only by the build that wrote it.
      const payload = buildBackupPayload(deps.getState(), {
        buildSha: typeof BUILD_INFO?.commit === "string" ? BUILD_INFO.commit : null,
        // Carried so the erasure register survives a reinstall — see erasureSuppression.js.
        suppressions: readSuppressionList(),
      });
      const dataStr = JSON.stringify(payload, null, 2);
      downloadFile(
        dataStr,
        `librept_backup_${new Date().toISOString().substring(0, 10)}.json`,
        "application/json",
      );
      // A downloaded file is a real backup, so it answers TODO §3.8's "is this data anywhere
      // durable" exactly as a Drive sync does. Recording it is what keeps the coming unbacked
      // warning honest — a trainer who exports weekly must be able to clear it WITHOUT connecting
      // Google, or a safety indicator becomes a prompt to enable an integration.
      recordBackupTaken("file");
    });
  }

  // Export the exercise catalog mapped to the open wger taxonomy, so it stays interchangeable with
  // external research / coaching tools (TODO §13.1). Exports the trainer's LIVE catalog — custom
  // movements included — not just the seed set.
  const exportCatalogJsonBtn = document.getElementById("btn-export-catalog-json");
  if (exportCatalogJsonBtn) {
    exportCatalogJsonBtn.addEventListener("click", () => {
      const exercises = deps.getState().exercises || [];
      const payload = JSON.stringify(catalogToInterchange(exercises), null, 2);
      downloadFile(payload, catalogFilename("json"), "application/json");
    });
  }

  const exportCatalogCsvBtn = document.getElementById("btn-export-catalog-csv");
  if (exportCatalogCsvBtn) {
    exportCatalogCsvBtn.addEventListener("click", () => {
      const exercises = deps.getState().exercises || [];
      downloadFile(catalogToCsv(exercises), catalogFilename("csv"), "text/csv");
    });
  }

  // Trigger file click
  const fileTrigger = dialog.querySelector(".file-trigger");
  if (fileTrigger && importFile) {
    fileTrigger.addEventListener("click", () => {
      importFile.click();
    });
  }

  // Import JSON File
  if (importFile) {
    importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const importedData = JSON.parse(evt.target.result);

          // Simple verification schema
          if (
            importedData &&
            Array.isArray(importedData.clients) &&
            Array.isArray(importedData.exercises)
          ) {
            // A backup is restored WHOLE. Rebuilding a fixed set of collections here silently
            // dropped everything not listed — sessions, plan updates, notifications — so a restore
            // quietly destroyed data the export had faithfully written out. Anything the file
            // carries is kept, including keys a newer build added that this one does not know.
            const { ok, state: restored, summary } = migrateState(importedData);
            if (!ok) {
              // A backup from a NEWER build (or one this version cannot migrate) is refused rather
              // than half-imported over the trainer's live database.
              throw new Error(describeMigration(summary).join("; ") || "Unmigratable backup.");
            }

            // A restore REPLACES the database — the file is a snapshot, and merging two databases
            // without a common ancestor is guesswork (that ancestor is what Drive sync's three-way
            // merge has and a file import does not). Replacing is right; replacing SILENTLY is not:
            // a trainer setting up a new phone who has already entered a client would lose it with
            // no warning. So when there is anything to lose, the restore waits for a confirmation
            // that names what it is about to overwrite.
            const replacing = summarizeReplacement(deps.getState());
            if (replacing.total > 0 && !confirmedRestore) {
              pendingRestore = restored;
              pendingSummary = summary;
              showReplaceConfirmation(replacing);
              return;
            }
            const reErased = await applyRestoredState(restored);

            // Re-render
            deps.renderClientsList();
            deps.renderRoutinesList();
            deps.renderExercisesList();
            deps.renderGlobalHistory();
            deps.populateDropdownSelectors();

            if (importStatus) {
              const migrated = summary.applied.length > 0;
              importStatus.textContent = [
                migrated
                  ? `Import successful! Upgraded from schema ${summary.fromVersion}.`
                  : "Import successful! Database synchronized.",
                erasureNotice(reErased),
              ]
                .filter(Boolean)
                .join(" ");
              importStatus.className = "status-msg text-emerald";
            }
          } else {
            throw new Error("Missing core structure validation.");
          }
        } catch (err) {
          if (importStatus) {
            importStatus.textContent = "Error: Invalid backup file format.";
            importStatus.className = "status-msg text-danger";
          }
          console.error("Import file parse error:", err);
        }
      };
      reader.readAsText(file);
    });
  }
}
