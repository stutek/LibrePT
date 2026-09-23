// src/modules/plans/programImportDialog.js — bringing in a programme written somewhere else
// (TODO §29).
//
// Single responsibility: the surface. The parser is domain/programImport.js, the catalog match is
// domain/catalogMatch.js, and the write is the editor's own save — there is deliberately no
// import-specific persistence to keep correct.
//
// **Four inputs, every one optional** (decided 2026-08-18): who it is for, which session, text to
// paste, a file to read. A trainer with a plan in a chat window pastes; one with a file picks the
// file; one who has neither client nor session in mind still gets an editor to work in.
//
// **Every failure is shown BEFORE the editor opens, and all of them.** Landing in an editor and only
// then noticing three blank rows is a puzzle; being told "3 of 12 items could not be read, here they
// are, at these positions" is something a trainer can act on — fix the paste, or go in knowing
// exactly which rows to repair. They can still proceed: the readable items are worth having.
//
// **The result is the ordinary editor**, not a bespoke review screen. That is what makes a wrong
// guess a field somebody retypes instead of a corrupted record, and it is why the ingestion can
// afford to be liberal at the edges.
//
// **Nothing here writes.** The dialog hands the parsed plan to the caller, which opens the editor;
// the editor's save is the same one a hand-built session uses.
//
// Injected dependencies: `t`, `getState`, `onImport(plan)`, `readFileText(file)`.

import { libraryExercises } from "../../data/exerciseLibrary.js";
import { customCount, matchAgainstCatalog } from "../../domain/catalogMatch.js";
import { PROGRAM_FORMAT, programTemplate, readProgram } from "../../domain/programImport.js";
import { closeModal, openModal, renderMarkupOnce } from "../common/dom.js";

let deps = null;

export function initProgramImportDialog(injected) {
  deps = injected;
}

export function renderProgramImportDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-program-import"),
    `
<dialog id="dialog-program-import" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="program-import-title">Import a programme</h3>
    <button class="modal-close-btn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="program-import-lede" class="text-sm text-muted"></p>

    <div class="grid grid-2-col gap-2 mb-2">
      <div>
        <label for="program-import-client" id="program-import-client-label"></label>
        <select id="program-import-client" class="form-control"></select>
      </div>
      <div>
        <label for="program-import-session" id="program-import-session-label"></label>
        <select id="program-import-session" class="form-control"></select>
      </div>
    </div>

    <label for="program-import-text" id="program-import-text-label"></label>
    <textarea id="program-import-text" class="form-control" rows="7"></textarea>

    <div class="program-import-actions">
      <label class="btn secondary-btn program-import-file">
        <i class="fa-solid fa-file-arrow-up"></i> <span id="program-import-file-label"></span>
        <input type="file" id="program-import-file" accept=".json,application/json" hidden>
      </label>
      <button type="button" id="program-import-template" class="btn secondary-btn">
        <i class="fa-solid fa-file-lines"></i> <span id="program-import-template-label"></span>
      </button>
      <button type="button" id="program-import-prompt" class="btn secondary-btn">
        <i class="fa-solid fa-copy"></i> <span id="program-import-prompt-label"></span>
      </button>
    </div>

    <!-- Said before the editor opens, and all of it at once: a trainer who lands in an editor and
         only then notices the gaps has been handed a puzzle. -->
    <div id="program-import-report" class="program-import-report hidden" role="status"></div>

    <div class="modal-actions">
      <button type="button" class="btn secondary-btn modal-cancel" id="program-import-cancel"></button>
      <button type="button" class="btn primary-btn" id="program-import-open"></button>
    </div>
  </div>
</dialog>
`,
  );
}

function fillChoices(select, rows, placeholder) {
  select.textContent = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = placeholder;
  select.appendChild(none);
  for (const row of rows) {
    const option = document.createElement("option");
    option.value = row.id;
    // textContent: these are names a trainer typed and titles they wrote.
    option.textContent = row.label;
    select.appendChild(option);
  }
}

/** What the trainer is told before anything opens: how many items came through, how many are custom,
 * and every line that could not be read, with its position and its own text. */
function renderReport(result) {
  const report = document.getElementById("program-import-report");
  const { t } = deps;
  report.textContent = "";
  report.classList.remove("hidden");

  if (!result.ok) {
    report.textContent = result.reason;
    return;
  }

  const summary = document.createElement("p");
  summary.className = "m-0";
  summary.textContent = t("program_import_read")
    .replace("{count}", String(result.items.length))
    .replace("{custom}", String(customCount(result.items)));
  report.appendChild(summary);

  if (result.unreadable.length === 0) return;
  const heading = document.createElement("p");
  heading.className = "program-import-unreadable-heading";
  heading.textContent = t("program_import_unreadable").replace(
    "{count}",
    String(result.unreadable.length),
  );
  report.appendChild(heading);
  const list = document.createElement("ul");
  for (const row of result.unreadable) {
    const entry = document.createElement("li");
    entry.textContent = `${row.position}: ${JSON.stringify(row.raw).slice(0, 120)}`;
    list.appendChild(entry);
  }
  report.appendChild(list);
}

/** Reads whatever is in the box, matched against the catalog, and reports it. Returns the plan or
 * null — the caller decides whether there is anything to open. */
function readCurrent() {
  const state = deps.getState();
  const result = readProgram(document.getElementById("program-import-text").value);
  if (result.ok) {
    result.items = matchAgainstCatalog(result.items, libraryExercises(state));
  }
  renderReport(result);
  document.getElementById("program-import-open").disabled = !result.ok;
  return result.ok ? result : null;
}

export function setupProgramImportDialog() {
  renderProgramImportDialog();
  const { t } = deps;
  const textArea = document.getElementById("program-import-text");
  if (!textArea) return;

  document.getElementById("program-import-text").addEventListener("input", readCurrent);

  document.getElementById("program-import-file").addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    // Read into the SAME box a paste lands in, so a file and a paste are one path from here on —
    // and the trainer can see and fix what the file contained before anything opens.
    textArea.value = await deps.readFileText(file);
    readCurrent();
  });

  document.getElementById("program-import-template").addEventListener("click", () => {
    // The template goes into the box rather than to a download: it is there to be READ and then
    // replaced, and a file in the downloads folder is one more thing to find.
    textArea.value = programTemplate();
    readCurrent();
  });

  document.getElementById("program-import-prompt").addEventListener("click", async () => {
    const button = document.getElementById("program-import-prompt-label");
    try {
      await navigator.clipboard.writeText(
        t("program_import_prompt_text").replace("{format}", PROGRAM_FORMAT),
      );
      button.textContent = t("program_import_prompt_copied");
    } catch {
      // A browser may refuse the clipboard; the prompt then goes in the box, where it can be
      // selected by hand — never leaving the trainer with nothing.
      textArea.value = t("program_import_prompt_text").replace("{format}", PROGRAM_FORMAT);
    }
  });

  document.getElementById("program-import-open").addEventListener("click", () => {
    const result = readCurrent();
    if (!result) return;
    closeModal("dialog-program-import");
    deps.onImport({
      title: result.title,
      items: result.items,
      clientId: document.getElementById("program-import-client").value || null,
      sessionId: document.getElementById("program-import-session").value || null,
    });
  });

  for (const id of ["program-import-cancel"]) {
    document
      .getElementById(id)
      .addEventListener("click", () => closeModal("dialog-program-import"));
  }
  document
    .querySelector("#dialog-program-import .modal-close-btn")
    .addEventListener("click", () => closeModal("dialog-program-import"));
}

export function openProgramImportDialog() {
  setupProgramImportDialog();
  const { t, getState } = deps;
  const state = getState();

  for (const [id, key] of [
    ["program-import-title", "program_import_title"],
    ["program-import-lede", "program_import_lede"],
    ["program-import-client-label", "program_import_client"],
    ["program-import-session-label", "program_import_session"],
    ["program-import-text-label", "program_import_text"],
    ["program-import-file-label", "program_import_file"],
    ["program-import-template-label", "program_import_template"],
    ["program-import-prompt-label", "program_import_prompt"],
    ["program-import-cancel", "btn_cancel"],
    ["program-import-open", "program_import_open"],
  ]) {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
  }

  fillChoices(
    document.getElementById("program-import-client"),
    (state.clients || [])
      .filter((client) => client.active !== false)
      .map((client) => ({
        id: client.id,
        label: client.name,
      })),
    t("program_import_no_client"),
  );
  fillChoices(
    document.getElementById("program-import-session"),
    (state.sessions || []).map((session) => ({
      id: session.id,
      label: `${session.title || t("workout_setup_title")} · ${session.time || ""}`.trim(),
    })),
    t("program_import_no_session"),
  );

  document.getElementById("program-import-text").value = "";
  document.getElementById("program-import-report").classList.add("hidden");
  document.getElementById("program-import-open").disabled = true;
  openModal("dialog-program-import");
}
