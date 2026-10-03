// Owns the Routine create/edit dialog: its markup (renderRoutineDialog), the exercise-picker-backed
// builder list, and its wiring (setupRoutineForms). `openRoutineCreateDialog` is the seam the router
// calls through for `/routines/new` without this controller needing to know about routing.
// Split 2026-08-01 out of the old formsController.js, which bundled Client, Routine, and Exercise
// forms in one file despite the three sharing nothing but boilerplate.

import { libraryExercises } from "../data/exerciseLibrary.js";
import { newRecordId } from "../data/recordId.js";
import { parseLoad, parseReps } from "../domain/repsAndLoad.js";
import { buildRoutineFromRecord } from "../domain/routineFromSession.js";
import { countedText } from "../i18n/plural.js";
import { tellInApp } from "../modules/common/appQuestion.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../modules/common/dom.js";
import { wireLibraryTabs } from "../modules/common/libraryTabs.js";
import { keepRecordLive } from "../modules/common/liveRecordForm.js";
import { mountExercisePicker, pickerLabels } from "../modules/exercises/exercisePicker.js";
import { addRoutineExerciseRow, renderRoutinesList } from "../modules/plans/plansView.js";
import { openProgramImportDialog } from "../modules/plans/programImportDialog.js";
import { pickerEmptyWays } from "./exerciseFormsController.js";

// Filled in by setupRoutineForms, and called by the create-form ROUTE. The form fields, the
// builder list, and the picker are closed over by that setup, so this is the seam that lets the
// router open a form without routineFormsController having to know about routing.
let openRoutineCreateForm = () => {};
// Filled in the same way: the editor (plansView.js) fills the form, then hands the record over.
let openRoutineEditForm = () => {};

/** Called by the routine editor once the form shows `routine`, so typing writes into it. */
export function editRoutineLive(routine) {
  openRoutineEditForm(routine);
}

export function openRoutineCreateDialog() {
  openRoutineCreateForm();
}

// The session the performed program ran in, by the id the program holds. A program with none (one
// converted from an older build where no session fitted) gives no title. It used to be found by
// day, comparing `startDate`, an ISO instant, with a calendar date, so it never found one.
function titleOfSessionBehind(log, state) {
  if (!log.sessionId) return "";
  return (state.sessions || []).find((session) => session.id === log.sessionId)?.title || "";
}

/** "Save as routine" on a performed session: stores the routine built from it, says how many
 *  movements could not be carried over, and opens the routine editor so the trainer can rename it. */
export async function saveSessionAsRoutine({
  log,
  state,
  t,
  saveToLocalStorage,
  navigateToPath,
  urlFor,
}) {
  const { routine, omitted } = buildRoutineFromRecord({
    log,
    library: libraryExercises(state),
    routines: state.routines,
    fallbackName: t("placeholder_routine_name"),
    emptyPlanName: t("custom_empty_plan"),
    sessionTitle: titleOfSessionBehind(log, state),
    provenance: t("routine_saved_from_session"),
  });
  state.routines.push(routine);
  saveToLocalStorage();
  if (omitted > 0) {
    await tellInApp({
      t,
      message: countedText(
        t,
        document.documentElement.lang,
        "routine_from_session_omitted",
        omitted,
      ),
    });
  }
  navigateToPath(urlFor("routine.edit", { routineId: routine.id }));
}

export function renderRoutineDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-routine"),
    `
<dialog id="dialog-routine" class="dialog-modal card glassmorphic wide-modal">
    <div class="modal-header">
      <!-- Empty: the create and the edit path each write their own title on open. -->
      <h3 id="routine-modal-title"></h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close routine modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-routine" method="dialog" class="modal-form">
      <input type="hidden" id="routine-form-id">

      <div class="form-group">
        <label for="routine-name" data-i18n="routine_name">Routine Name *</label>
        <input type="text" id="routine-name" required data-i18n-placeholder="routine_name_placeholder" placeholder="e.g. Upper Body A" class="form-control">
      </div>

      <div class="form-group">
        <label for="routine-desc" data-i18n="routine_desc">Description</label>
        <input type="text" id="routine-desc" data-i18n-placeholder="routine_desc_placeholder" placeholder="e.g. Strength compound focus" class="form-control">
      </div>

      <div class="routine-builder-section">
        <div class="section-sub-title">
          <h4 data-i18n="routine_exercises_heading">Routine Exercises</h4>
          <button type="button" id="btn-routine-add-ex" class="btn secondary-btn btn-xs">
            <i class="fa-solid fa-plus"></i> <span data-i18n="btn_add_exercise">Add Exercise</span>
          </button>
        </div>

        <!-- Reps-preset datalists (surfaced when the reps combobox is focused/emptied; the PT can
             still type any value) are generated from helper/repsAndLoad.js REPS_TIERS at boot, so
             the option lists are data-driven and defined in exactly one place. -->
        <span id="reps-preset-datalists"></span>

        <div id="routine-ex-picker" class="exercise-picker hidden"></div>

        <div id="routine-exercises-list" class="routine-builder-list">
          <!-- Selection rows injected via JS -->
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel" data-i18n="btn_cancel">Cancel</button>
        <button type="submit" formnovalidate class="btn primary-btn" data-i18n="btn_save">Save</button>
      </div>
    </form>
  </dialog>
`,
  );
}

export function setupRoutineForms({
  getState,
  t,
  saveToLocalStorage,
  populateDropdownSelectors,
  navigateToPath,
  urlFor,
}) {
  renderRoutineDialog();
  const dialog = $id("dialog-routine");
  const form = $id("form-routine");
  const builderList = $id("routine-exercises-list");
  if (!dialog || !form || !builderList) return;
  const closeBtn = dialog.querySelector(".modal-close-btn");
  const pickerEl = $id("routine-ex-picker");

  // Mount a fresh filtered picker; each tap drops a configured row into the template.
  // Stays open for rapid multi-add.
  const openRoutinePicker = () => {
    if (!pickerEl) return;
    mountExercisePicker(pickerEl, {
      state: getState(),
      ...pickerLabels(t),
      ...pickerEmptyWays(),
      onSelect: (ex) => {
        addRoutineExerciseRow({
          preset: { id: ex.id, sets: 3, reps: 10, weight: 0, rest: 60 },
          state: getState(),
          t,
        });
      },
    });
    pickerEl.classList.remove("hidden");
  };

  // Populating the create form is the ROUTE's job now (`/routines/new`), so a reload reopens it on a
  // blank form rather than dropping the trainer on the list. The button only navigates.
  openRoutineCreateForm = () => {
    $id("routine-modal-title").textContent = t("create_routine_title");
    $id("routine-form-id").value = "";
    builderList.innerHTML = "";
    openModal("dialog-routine", { resetForm: true, formId: "form-routine" });
    openRoutinePicker();
    live.openNew();
  };
  $id("btn-add-routine").addEventListener("click", () => navigateToPath(urlFor("routine.new")));
  $id("btn-import-program")?.addEventListener("click", openProgramImportDialog);
  wireLibraryTabs($id("view-routines"), navigateToPath, urlFor);

  const btnRoutineAddEx = $id("btn-routine-add-ex");
  if (btnRoutineAddEx) {
    btnRoutineAddEx.addEventListener("click", () => {
      // An open picker stays open: "add" never hides the list it adds from. A second tap puts the
      // cursor in the search box instead.
      if (pickerEl?.classList.contains("hidden")) openRoutinePicker();
      else pickerEl?.querySelector(".picker-search")?.focus();
    });
  }

  // ✕ keeps what was typed, like Save; only Cancel undoes it (liveRecordForm.js).
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal("dialog-routine"));

  // Every change goes into the routine record, so a reload loses nothing. An empty name
  // or set count is written as a placeholder; a row without a movement has nothing to stand in for
  // it and is left out.
  const live = keepRecordLive({
    dialog,
    form,
    collection: "routines",
    getState,
    saveToLocalStorage,
    createRecord: () => ({
      id: newRecordId(),
      name: t("placeholder_routine_name"),
      description: "",
      exercises: [],
    }),
    writeFields: (routine) => {
      routine.name = $id("routine-name").value.trim() || t("placeholder_routine_name");
      routine.description = $id("routine-desc").value.trim();
      routine.exercises = [];
      for (const row of builderList.querySelectorAll(".routine-builder-row")) {
        const selectEx = row.querySelector(".select-ex");
        const inputSets = parseInt(row.querySelector(".input-sets").value);
        const inputRest = parseInt(row.querySelector(".input-rest").value);
        if (!selectEx?.value) continue;
        routine.exercises.push({
          ...JSON.parse(row.dataset.kept || "{}"),
          id: selectEx.value,
          // The same three sets a row starts with when the picker adds it.
          sets: isNaN(inputSets) ? 3 : inputSets,
          reps: parseReps(row.querySelector(".input-reps").value),
          weight: parseLoad(row.querySelector(".input-weight")?.value),
          rest: isNaN(inputRest) ? 60 : inputRest,
        });
      }
    },
    isBlank: () =>
      !$id("routine-name").value.trim() &&
      !$id("routine-desc").value.trim() &&
      !builderList.querySelector(".routine-builder-row"),
    onChange: () => {
      renderRoutinesList({ state: getState(), t });
      populateDropdownSelectors();
    },
  });
  openRoutineEditForm = (routine) => live.openExisting(routine);
}
