// Owns the Routine create/edit dialog: its markup (renderRoutineDialog), the exercise-picker-backed
// builder list, and its wiring (setupRoutineForms). `openRoutineCreateDialog` is the seam the router
// calls through for `/routines/new` without this controller needing to know about routing.
// Split 2026-08-01 out of the old formsController.js, which bundled Client, Routine, and Exercise
// forms in one file despite the three sharing nothing but boilerplate.

import { newRecordId } from "../data/recordId.js";
import { parseLoad, parseReps } from "../domain/repsAndLoad.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../modules/common/dom.js";
import { mountExercisePicker } from "../modules/exercises/exercisePicker.js";
import { addRoutineExerciseRow, renderRoutinesList } from "../modules/plans/plansView.js";

// Filled in by setupRoutineForms, and called by the create-form ROUTE. The form fields, the
// builder list, and the picker are closed over by that setup, so this is the seam that lets the
// router open a form without routineFormsController having to know about routing.
let openRoutineCreateForm = () => {};

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
        <button type="submit" class="btn primary-btn">Save Routine</button>
      </div>
    </form>
  </dialog>
`,
  );
}

export function setupRoutineForms({
  state,
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
  const cancelBtn = dialog.querySelector(".modal-cancel");
  const closeBtn = dialog.querySelector(".modal-close-btn");
  const pickerEl = $id("routine-ex-picker");

  const hideRoutinePicker = () => pickerEl?.classList.add("hidden");

  // Mount a fresh filtered picker; each tap drops a configured row into the template
  // (TODO §13.2 Scenario A). Stays open for rapid multi-add.
  const openRoutinePicker = () => {
    if (!pickerEl) return;
    mountExercisePicker(pickerEl, {
      state,
      searchLabel: t("search_movements") || "Search movements",
      muscleLabel: t("muscle") || "Muscle",
      equipmentLabel: t("equipment") || "Equipment",
      onSelect: (ex) => {
        addRoutineExerciseRow({
          preset: { id: ex.id, sets: 3, reps: 10, weight: 0, rest: 60 },
          state,
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
  };
  $id("btn-add-routine").addEventListener("click", () => navigateToPath(urlFor("routine.new")));

  const btnRoutineAddEx = $id("btn-routine-add-ex");
  if (btnRoutineAddEx) {
    btnRoutineAddEx.addEventListener("click", () => {
      if (pickerEl?.classList.contains("hidden")) openRoutinePicker();
      else hideRoutinePicker();
    });
  }

  const handleClose = () => closeModal("dialog-routine");
  if (cancelBtn) cancelBtn.addEventListener("click", handleClose);
  if (closeBtn) closeBtn.addEventListener("click", handleClose);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $id("routine-form-id").value;
    const name = $id("routine-name").value.trim();
    const description = $id("routine-desc").value.trim();

    if (!name) return;

    const exercises = [];
    for (const row of builderList.querySelectorAll(".routine-builder-row")) {
      const selectEx = row.querySelector(".select-ex");
      const inputSets = parseInt(row.querySelector(".input-sets").value);
      const inputRest = parseInt(row.querySelector(".input-rest").value);

      if (selectEx?.value && !isNaN(inputSets)) {
        exercises.push({
          id: selectEx.value,
          sets: inputSets,
          reps: parseReps(row.querySelector(".input-reps").value),
          weight: parseLoad(row.querySelector(".input-weight")?.value),
          rest: isNaN(inputRest) ? 60 : inputRest,
        });
      }
    }

    if (exercises.length === 0) {
      alert("Routines must include at least one exercise.");
      return;
    }

    if (id) {
      const routine = state.routines.find((r) => r.id === id);
      if (routine) {
        routine.name = name;
        routine.description = description;
        routine.exercises = exercises;
      }
    } else {
      const newRoutine = {
        id: newRecordId(),
        name: name,
        description: description,
        exercises: exercises,
      };
      state.routines.push(newRoutine);
    }

    saveToLocalStorage();
    renderRoutinesList({ state, t, openWorkoutSetupModal });
    populateDropdownSelectors();
    closeModal("dialog-routine");
  });
}
