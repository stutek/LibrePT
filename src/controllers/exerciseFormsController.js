// Owns the custom-Exercise create dialog: its markup (renderExerciseDialog) and its wiring
// (setupExerciseForms — the modality-driven metric selector, save, and the exercise-list search +
// category chips). `openExerciseCreateDialog` is the seam the router calls through for
// `/exercises/new` without this controller needing to know about routing.
// Split 2026-08-01 out of the old formsController.js, which bundled Client, Routine, and Exercise
// forms in one file despite the three sharing nothing but boilerplate.

import { newRecordId } from "../data/recordId.js";
import { metricOptionsFor } from "../domain/exerciseModality.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../modules/common/dom.js";
import { keepRecordLive } from "../modules/common/liveRecordForm.js";
import { renderExercisesList } from "../modules/exercises/exercisesView.js";

// Filled in by setupExerciseForms, and called by the create-form ROUTE — same seam pattern as
// routineFormsController's openRoutineCreateForm.
let openExerciseCreateForm = () => {};

export function openExerciseCreateDialog() {
  openExerciseCreateForm();
}

export function renderExerciseDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-exercise"),
    `
<dialog id="dialog-exercise" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3>Create Custom Exercise</h3>
      <button class="modal-close-btn" aria-label="Close exercise modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-exercise" method="dialog" class="modal-form">
      <div class="form-group">
        <label for="exercise-name">Exercise Name *</label>
        <input type="text" id="exercise-name" required placeholder="e.g. Bulgarian Split Squat" class="form-control">
      </div>

      <div class="form-group">
        <label for="exercise-category">Target Muscle Group *</label>
        <select id="exercise-category" required class="form-control">
          <option value="Chest">Chest</option>
          <option value="Back">Back</option>
          <option value="Legs">Legs</option>
          <option value="Shoulders">Shoulders</option>
          <option value="Arms">Arms</option>
          <option value="Core">Core</option>
          <option value="Recovery">Recovery</option>
          <option value="Cardio">Cardio</option>
        </select>
      </div>

      <div class="form-group">
        <label for="exercise-equipment">Equipment *</label>
        <select id="exercise-equipment" required class="form-control">
          <option value="Barbell">Barbell</option>
          <option value="Dumbbell">Dumbbell</option>
          <option value="Cable">Cable</option>
          <option value="Machine">Machine</option>
          <option value="Band">Band</option>
          <option value="Bodyweight">Bodyweight</option>
        </select>
      </div>

      <div class="form-group">
        <label for="exercise-pattern">Movement Pattern *</label>
        <select id="exercise-pattern" required class="form-control">
          <option value="Horizontal Push">Horizontal Push</option>
          <option value="Horizontal Pull">Horizontal Pull</option>
          <option value="Vertical Push">Vertical Push</option>
          <option value="Vertical Pull">Vertical Pull</option>
          <option value="Squat">Squat</option>
          <option value="Hinge">Hinge</option>
          <option value="Lunge">Lunge</option>
          <option value="Isolation">Isolation</option>
          <option value="Core">Core</option>
          <option value="Mobility">Mobility</option>
          <option value="Conditioning">Conditioning</option>
          <option value="Balance">Balance</option>
          <option value="Agility">Agility</option>
        </select>
      </div>

      <div class="form-group">
        <label for="exercise-modality">How it's logged *</label>
        <select id="exercise-modality" required class="form-control">
          <option value="strength">Strength — sets × reps × load</option>
          <option value="isometric">Isometric — hold time + load</option>
          <option value="cardio">Cardio — time / distance / calories / watts / pace / HR</option>
          <option value="stretch">Stretch — hold time</option>
          <option value="balance">Balance — hold time</option>
          <option value="agility">Agility — time / distance / reps</option>
        </select>
      </div>

      <!-- Metric options are repopulated per modality by exerciseFormsController (cardio / agility only). -->
      <div class="form-group hidden" id="exercise-metric-group">
        <label for="exercise-metric">Metric</label>
        <select id="exercise-metric" class="form-control"></select>
      </div>

      <div class="form-group">
        <label for="exercise-instructions">Instructions</label>
        <textarea id="exercise-instructions" rows="2" placeholder="Form cues..." class="form-control"></textarea>
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

export function setupExerciseForms({
  getState,
  t,
  saveToLocalStorage,
  populateDropdownSelectors,
  navigateToPath,
  urlFor,
}) {
  renderExerciseDialog();
  const dialog = $id("dialog-exercise");
  const form = $id("form-exercise");
  if (!dialog || !form) return;
  const closeBtn = dialog.querySelector(".modal-close-btn");

  // As with routines: the route (`/exercises/new`) owns opening the form; the button navigates.
  openExerciseCreateForm = () => {
    openModal("dialog-exercise", { resetForm: true, formId: "form-exercise" });
    // The form reset restores modality to strength; re-sync so a reopen never leaves a metric
    // selector showing over a fixed-metric modality.
    syncMetricField();
    live.openNew();
  };
  const btnAddExercise = $id("btn-add-exercise");
  if (btnAddExercise) {
    btnAddExercise.addEventListener("click", () => navigateToPath(urlFor("exercise.new")));
  }

  // ✕ keeps what was typed, like Save; only Cancel undoes it (liveRecordForm.js).
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal("dialog-exercise"));

  // Every change goes into the exercise record, so a reload loses nothing (TODO §50.2). The
  // selects start on a value, so a new movement always has its muscle group, equipment and pattern
  // (TODO §13.2 Scenario C); an empty name is written as the placeholder.
  const live = keepRecordLive({
    dialog,
    form,
    collection: "exercises",
    getState,
    saveToLocalStorage,
    createRecord: () => ({
      id: newRecordId(),
      name: t("placeholder_exercise_name"),
      instructions: "",
    }),
    writeFields: (exercise) => {
      exercise.name = $id("exercise-name").value.trim() || t("placeholder_exercise_name");
      exercise.category = $id("exercise-category").value;
      exercise.equipment = $id("exercise-equipment").value;
      exercise.pattern = $id("exercise-pattern").value;
      exercise.instructions = $id("exercise-instructions").value.trim();
      // Modality decides how the movement is logged (exerciseModality.js). Omit the default so
      // strength entries stay identical to the legacy shape; metric-choice modalities (cardio,
      // agility) also carry the chosen effort metric.
      const modality = $id("exercise-modality")?.value || "strength";
      const metricOpts = metricOptionsFor(modality);
      Reflect.deleteProperty(exercise, "modality");
      Reflect.deleteProperty(exercise, "metric");
      if (modality !== "strength") {
        exercise.modality = modality;
        if (metricOpts) exercise.metric = $id("exercise-metric")?.value || metricOpts[0];
      }
    },
    isBlank: () => !$id("exercise-name").value.trim() && !$id("exercise-instructions").value.trim(),
    onChange: () => {
      renderExercisesList({ state: getState(), t });
      populateDropdownSelectors();
    },
  });

  // Modalities with a choice of effort metric (cardio, agility) reveal a metric selector, populated
  // from the modality's own option set; the fixed-metric modalities (strength/isometric/holds) hide it.
  const METRIC_LABELS = {
    time: "Time",
    distance: "Distance",
    calories: "Calories",
    watts: "Watts",
    pace: "Pace (/km)",
    heartrate: "Heart rate (bpm)",
    reps: "Reps",
  };
  const modalitySelect = $id("exercise-modality");
  const metricGroup = $id("exercise-metric-group");
  const metricSelect = $id("exercise-metric");
  const syncMetricField = () => {
    const opts = metricOptionsFor(modalitySelect?.value);
    if (opts && metricSelect) {
      metricSelect.innerHTML = opts
        .map((m) => `<option value="${m}">${METRIC_LABELS[m] || m}</option>`)
        .join("");
      metricGroup?.classList.remove("hidden");
    } else {
      metricGroup?.classList.add("hidden");
    }
  };
  if (modalitySelect && metricGroup) {
    modalitySelect.addEventListener("change", syncMetricField);
    syncMetricField();
  }

  const searchExercisesEl = $id("search-exercises");
  if (searchExercisesEl) {
    // No filter passed: the list reads the search box and both chip rows itself.
    searchExercisesEl.addEventListener("input", () => {
      renderExercisesList({ state: getState(), t });
    });
  }

  // A tap moves the active chip within ITS row only — source and muscle filter independently.
  for (const row of document.querySelectorAll("#view-exercises .filter-chips")) {
    for (const chip of row.querySelectorAll(".chip")) {
      chip.addEventListener("click", () => {
        for (const c of row.querySelectorAll(".chip")) c.classList.remove("active");
        chip.classList.add("active");
        renderExercisesList({ state: getState(), t });
      });
    }
  }
}
