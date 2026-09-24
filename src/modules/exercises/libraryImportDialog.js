// src/modules/exercises/libraryImportDialog.js — bringing a trainer's exercise library into the app
// (TODO §45.5).
//
// Single responsibility: the surface. Reading and planning are domain/libraryImport.js; this shows
// the trainer what the text holds and, on their word, writes it.
//
// **A review before the write, and all of it at once** — the rule §29 set for a programme. The
// trainer sees how many exercises and circuits are new, which ones the library already has (and so
// will not get twice), and every entry that could not be read, with its position. Nothing is written
// until they press Add to library.
//
// **The source name is theirs to set.** It is taken from the file when the file names one (its
// `source` or `author`), else from the file's name. It applies to entries that do not already name
// their source; a colleague's export can carry several sources, which must survive another hop.
// Once the trainer types in the field, a later read leaves it alone.
//
// Injected dependencies: `t`, `getState`, `saveToLocalStorage`, `newId`, `readFileText(file)`,
// `onImported(source)`.

import {
  ALL_SOURCES,
  addToLibrary,
  libraryExercises,
  sourcesOf,
} from "../../data/exerciseLibrary.js";
import { recordIdsInUse } from "../../data/recordProjections.js";
import { libraryTemplate, planLibraryImport, readLibrary } from "../../domain/libraryImport.js";
import { closeModal, openModal, renderMarkupOnce } from "../common/dom.js";

const DIALOG_ID = "dialog-library-import";
let deps = null;
let sourceTyped = false;

export function initLibraryImportDialog(injected) {
  deps = injected;
}

function renderLibraryImportDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${DIALOG_ID}`),
    `
<dialog id="${DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="library-import-title"></h3>
    <button class="modal-close-btn" aria-label="Close" data-i18n-label="close"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="library-import-lede" class="text-sm text-muted"></p>

    <label for="library-import-text" id="library-import-text-label"></label>
    <textarea id="library-import-text" class="form-control" rows="7"></textarea>

    <div class="program-import-actions">
      <label class="btn secondary-btn program-import-file">
        <i class="fa-solid fa-file-arrow-up"></i> <span id="library-import-file-label"></span>
        <input type="file" id="library-import-file" accept=".json,application/json" hidden>
      </label>
      <button type="button" id="library-import-template" class="btn secondary-btn">
        <i class="fa-solid fa-file-lines"></i> <span id="library-import-template-label"></span>
      </button>
    </div>

    <label for="library-import-source" id="library-import-source-label"></label>
    <input type="text" id="library-import-source" class="form-control" maxlength="60">

    <div id="library-import-report" class="program-import-report hidden" role="status"></div>

    <div class="modal-actions">
      <button type="button" class="btn secondary-btn modal-cancel" id="library-import-cancel"></button>
      <button type="button" class="btn primary-btn" id="library-import-add"></button>
    </div>
  </div>
</dialog>
`,
  );
}

const byId = (id) => document.getElementById(id);

function paragraph(className, text) {
  const element = document.createElement("p");
  element.className = className;
  // textContent throughout: every name here comes from someone else's file.
  element.textContent = text;
  return element;
}

function list(rows) {
  const element = document.createElement("ul");
  for (const row of rows) {
    const entry = document.createElement("li");
    entry.textContent = row;
    element.appendChild(entry);
  }
  return element;
}

function renderReport(parsed, plan) {
  const { t } = deps;
  const report = byId("library-import-report");
  report.textContent = "";
  report.classList.remove("hidden");
  if (!parsed.ok) {
    report.appendChild(
      paragraph(
        "m-0",
        t(`library_import_refused_${parsed.reason}`).replace("{detail}", parsed.detail),
      ),
    );
    return;
  }
  report.appendChild(
    paragraph(
      "m-0",
      t("library_import_read")
        .replace("{exercises}", String(plan.exercises.length))
        .replace("{circuits}", String(plan.circuits.length)),
    ),
  );
  if (plan.duplicates.length > 0) {
    report.appendChild(
      paragraph(
        "program-import-unreadable-heading",
        t("library_import_duplicates").replace("{count}", String(plan.duplicates.length)),
      ),
    );
    report.appendChild(list(plan.duplicates));
  }
  if (parsed.unreadable.length > 0) {
    report.appendChild(
      paragraph(
        "program-import-unreadable-heading",
        t("library_import_unreadable").replace("{count}", String(parsed.unreadable.length)),
      ),
    );
    report.appendChild(
      list(
        parsed.unreadable.map((row) => `${row.position}: ${JSON.stringify(row.raw).slice(0, 120)}`),
      ),
    );
  }
}

/** Read the box, plan it against the library as it is now, and report. Returns the plan when there
 * is something to add, else null. */
function readCurrent(fileName = "") {
  const { t, getState, newId } = deps;
  const parsed = readLibrary(byId("library-import-text").value);
  const sourceField = byId("library-import-source");
  if (parsed.ok && !sourceTyped) {
    sourceField.value = parsed.source || fileName.replace(/\.[^.]+$/, "");
  }
  const source = sourceField.value.trim();
  const plan = parsed.ok
    ? planLibraryImport(parsed, libraryExercises(getState()), {
        source,
        newId,
        circuitWord: t("circuit"),
        takenIds: recordIdsInUse(getState()),
      })
    : null;
  renderReport(parsed, plan);
  const hasNew = Boolean(plan && plan.exercises.length + plan.circuits.length > 0);
  byId("library-import-add").disabled = !hasNew;
  return hasNew ? { plan, source } : null;
}

function addImported() {
  const current = readCurrent();
  if (!current) return;
  const { plan } = current;
  addToLibrary(deps.getState(), plan);
  deps.saveToLocalStorage();
  closeModal(DIALOG_ID);
  // A file may carry several sources. Filtering it to the fallback field would hide what was added.
  const sources = sourcesOf(plan.exercises);
  deps.onImported(sources.length === 1 ? sources[0] : ALL_SOURCES);
}

function wire() {
  const textArea = byId("library-import-text");
  if (textArea.dataset.wired) return;
  textArea.dataset.wired = "true";
  textArea.addEventListener("input", () => readCurrent());
  byId("library-import-source").addEventListener("input", () => {
    sourceTyped = true;
    readCurrent();
  });
  byId("library-import-file").addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    // Into the same box a paste lands in, so a file and a paste are one path from here on.
    textArea.value = await deps.readFileText(file);
    readCurrent(file.name || "");
  });
  byId("library-import-template").addEventListener("click", () => {
    textArea.value = libraryTemplate();
    readCurrent();
  });
  byId("library-import-add").addEventListener("click", addImported);
  byId("library-import-cancel").addEventListener("click", () => closeModal(DIALOG_ID));
  document
    .querySelector(`#${DIALOG_ID} .modal-close-btn`)
    .addEventListener("click", () => closeModal(DIALOG_ID));
}

export function openLibraryImportDialog() {
  renderLibraryImportDialog();
  wire();
  const { t } = deps;
  for (const [id, key] of [
    ["library-import-title", "library_import_title"],
    ["library-import-lede", "library_import_lede"],
    ["library-import-text-label", "library_import_text"],
    ["library-import-file-label", "library_import_file"],
    ["library-import-template-label", "library_import_template"],
    ["library-import-source-label", "library_import_source"],
    ["library-import-cancel", "btn_cancel"],
    ["library-import-add", "library_import_add"],
  ]) {
    byId(id).textContent = t(key);
  }
  byId("library-import-source").placeholder = t("library_import_source_placeholder");
  byId("library-import-text").value = "";
  byId("library-import-source").value = "";
  sourceTyped = false;
  byId("library-import-report").classList.add("hidden");
  byId("library-import-add").disabled = true;
  openModal(DIALOG_ID);
}
