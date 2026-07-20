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

let deps = null;

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

  // Export JSON
  const exportBtn = document.getElementById("btn-export-db");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = JSON.stringify(deps.getState(), null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const dlAnchor = document.createElement("a");
      dlAnchor.href = url;
      dlAnchor.download = `librept_backup_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      document.body.removeChild(dlAnchor);
      URL.revokeObjectURL(url);
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
