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

export function setupBackupRestore() {
  const dialog = document.getElementById("dialog-backup");
  if (!dialog) return;

  const importFile = document.getElementById("import-db-file");
  const importStatus = document.getElementById("import-status");

  const backupBtn = document.getElementById("backup-btn");
  if (backupBtn) {
    backupBtn.addEventListener("click", () => {
      if (importStatus) {
        importStatus.textContent = "";
        importStatus.className = "status-msg";
      }
      dialog.showModal();
    });
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
            const newState = {
              clients: importedData.clients || [],
              exercises: importedData.exercises || [],
              routines: importedData.routines || [],
              history: importedData.history || [],
            };
            deps.setState(newState);
            deps.saveToLocalStorage();

            // Re-render
            deps.renderClientsList();
            deps.renderRoutinesList();
            deps.renderExercisesList();
            deps.renderGlobalHistory();
            deps.populateDropdownSelectors();

            if (importStatus) {
              importStatus.textContent = "Import successful! Database synchronized.";
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
