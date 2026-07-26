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

export function setupBackupRestore() {
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
