// Owns the Routine create/edit dialog: its markup (renderRoutineDialog), the exercise-picker-backed
// builder list, and its wiring (setupRoutineForms). `openRoutineCreateDialog` is the seam the router
// calls through for `/routines/new` without this controller needing to know about routing.
// Split 2026-08-01 out of the old formsController.js, which bundled Client, Routine, and Exercise
// forms in one file despite the three sharing nothing but boilerplate.

import { newRecordId } from "../data/recordId.js";
import { parseLoad, parseReps } from "../domain/repsAndLoad.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../modules/common/dom.js";
import { keepRecordLive } from "../modules/common/liveRecordForm.js";
import { mountExercisePicker } from "../modules/exercises/exercisePicker.js";
import { addRoutineExerciseRow, renderRoutinesList } from "../modules/plans/plansView.js";

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

export function renderRoutineDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-routine"),
    `
<dialog id="dialog-routine" class="dialog-modal card glassmorphic wide-modal">
    <div class="modal-header">
      <h3 id="routine-modal-title">Create Routine Template</h3>
      <button class="modal-close-btn" aria-label="Close routine modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-routine" method="dialog" class="modal-form">
      <input type="hidden" id="routine-form-id">

      <div class="form-group">
        <label for="routine-name">Routine Name *</label>
        <input type="text" id="routine-name" required placeholder="e.g. Upper Body A" class="form-control">
      </div>

      <div class="form-group">
        <label for="routine-desc">Description</label>
        <input type="text" id="routine-desc" placeholder="e.g. Strength compound focus" class="form-control">
      </div>

      <div class="routine-builder-section">
        <div class="section-sub-title">
          <h4>Routine Exercises</h4>
          <button type="button" id="btn-routine-add-ex" class="btn secondary-btn btn-xs">
            <i class="fa-solid fa-plus"></i> Add Exercise
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
        <button type="button" class="btn secondary-btn modal-cancel">Cancel</button>
        <button type="submit" formnovalidate class="btn primary-btn">Save</button>
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
  openWorkoutSetupModal,
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

  const hideRoutinePicker = () => pickerEl?.classList.add("hidden");

  // Mount a fresh filtered picker; each tap drops a configured row into the template
  // (TODO §13.2 Scenario A). Stays open for rapid multi-add.
  const openRoutinePicker = () => {
    if (!pickerEl) return;
    mountExercisePicker(pickerEl, {
      state: getState(),
      searchLabel: t("search_movements") || "Search movements",
      muscleLabel: t("muscle") || "Muscle",
      equipmentLabel: t("equipment") || "Equipment",
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
    $id("routine-modal-title").textContent = "Create Routine Template";
    $id("routine-form-id").value = "";
    builderList.innerHTML = "";
    openModal("dialog-routine", { resetForm: true, formId: "form-routine" });
    openRoutinePicker();
    live.openNew();
  };
  $id("btn-add-routine").addEventListener("click", () => navigateToPath(urlFor("routine.new")));

  const btnRoutineAddEx = $id("btn-routine-add-ex");
  if (btnRoutineAddEx) {
    btnRoutineAddEx.addEventListener("click", () => {
      if (pickerEl?.classList.contains("hidden")) openRoutinePicker();
      else hideRoutinePicker();
    });
  }

  // ✕ keeps what was typed, like Save; only Cancel undoes it (liveRecordForm.js).
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal("dialog-routine"));

  // Every change goes into the routine record, so a reload loses nothing (TODO §50.2). An empty name
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
      renderRoutinesList({ state: getState(), t, openWorkoutSetupModal });
      populateDropdownSelectors();
    },
  });
  openRoutineEditForm = (routine) => live.openExisting(routine);
}
