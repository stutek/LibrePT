// components/backupRestore.js
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
//   t
// }

import { describeMigration, migrateState } from "../../data/schemaMigrations.js";
import { renderMarkupOnce } from "./dom.js";
import { catalogToCsv, catalogToInterchange } from "./exerciseStandard.js";

let deps = null;

// Download an in-memory string as a file, reusing one blob-anchor pattern for every export action.
function downloadFile(contents, filename, mimeType) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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

export function setupBackupRestore() {
  renderBackupDialog();
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

  // Export JSON — the whole local database, for backup / device migration.
  const exportBtn = document.getElementById("btn-export-db");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = JSON.stringify(deps.getState(), null, 2);
      downloadFile(
        dataStr,
        `librept_backup_${new Date().toISOString().substring(0, 10)}.json`,
        "application/json",
      );
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
      reader.onload = (evt) => {
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
            deps.setState(restored);
            deps.saveToLocalStorage();

            // Re-render
            deps.renderClientsList();
            deps.renderRoutinesList();
            deps.renderExercisesList();
            deps.renderGlobalHistory();
            deps.populateDropdownSelectors();

            if (importStatus) {
              const migrated = summary.applied.length > 0;
              importStatus.textContent = migrated
                ? `Import successful! Upgraded from schema ${summary.fromVersion}.`
                : "Import successful! Database synchronized.";
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
