import {
  getActiveDetailClientId,
  renderClientsList,
  showClientDetails,
} from "../modules/clients/clientsView.js";
import { $id, closeModal, openModal } from "../modules/common/dom.js";
import { metricOptionsFor } from "../modules/common/exerciseModality.js";
import { newRecordId } from "../modules/common/recordId.js";
import { parseLoad, parseReps } from "../modules/common/repsAndLoad.js";
import { getInitials } from "../modules/common/utils.js";
import { mountExercisePicker } from "../modules/exercises/exercisePicker.js";
import { renderExercisesList } from "../modules/exercises/exercisesView.js";
import { addRoutineExerciseRow, renderRoutinesList } from "../modules/plans/plansView.js";

// Filled in by the setup functions below, and called by the create-form ROUTES. The form fields,
// the builder list and the picker are closed over by those setups, so this is the seam that lets
// the router open a form without formsController having to know about routing.
let openRoutineCreateForm = () => {};
let openExerciseCreateForm = () => {};

export function openRoutineCreateDialog() {
  openRoutineCreateForm();
}

export function openExerciseCreateDialog() {
  openExerciseCreateForm();
}

export function renderClientDialog() {
  const root = document.getElementById("dialogs-root");
  if (!root || document.getElementById("dialog-client")) return;
  root.insertAdjacentHTML(
    "beforeend",
    `
<dialog id="dialog-client" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="client-modal-title">Add New Client</h3>
      <button class="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-client" method="dialog" class="modal-form">
      <input type="hidden" id="client-form-id">
      
      <div class="form-group">
        <label for="client-name">Full Name *</label>
        <input type="text" id="client-name" required placeholder="e.g. Jane Doe" class="form-control">
      </div>
      
      <div class="form-group">
        <label for="client-email">Email</label>
        <input type="email" id="client-email" placeholder="e.g. jane.doe@example.com" class="form-control">
      </div>
      
      <div class="form-group">
        <label for="client-phone">Phone Number</label>
        <input type="tel" id="client-phone" placeholder="e.g. +386 40 123 456" class="form-control">
      </div>
      
      <div class="form-group">
        <label for="client-goals">Fitness Goals</label>
        <textarea id="client-goals" rows="2" placeholder="e.g. Strength gain, consistency..." class="form-control"></textarea>
      </div>
      
      <div class="form-group">
        <label for="client-notes">Trainer Notes & Injuries (Alert banner shows during workout)</label>
        <textarea id="client-notes" rows="3" placeholder="e.g. Left knee issue; monitor squat depth..." class="form-control"></textarea>
      </div>

      <div class="form-group checkbox-group" style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="client-gdpr-consent" class="form-checkbox">
        <label for="client-gdpr-consent" style="margin-bottom: 0; font-weight: normal; cursor: pointer;">
          Client consented to cloud sync & data storage (GDPR)
        </label>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel">Cancel</button>
        <button type="submit" class="btn primary-btn">Save Client</button>
      </div>
    </form>
  </dialog>
`,
  );
}

export function setupClientForms({
  state,
  t,
  saveToLocalStorage,
  populateDropdownSelectors,
  showErrorView,
  switchView,
  openWorkoutSetupModal,
}) {
  renderClientDialog();
  const dialog = $id("dialog-client");
  const form = $id("form-client");
  if (!dialog || !form) return;
  const cancelBtn = dialog.querySelector(".modal-cancel");
  const closeBtn = dialog.querySelector(".modal-close-btn");

  $id("btn-add-client").addEventListener("click", () => {
    $id("client-modal-title").textContent = "Add New Client";
    $id("client-form-id").value = "";
    openModal("dialog-client", { resetForm: true, formId: "form-client" });
  });

  $id("btn-edit-client").addEventListener("click", () => {
    const activeId = getActiveDetailClientId();
    const client = state.clients.find((c) => c.id === activeId);
    if (!client) return;

    $id("client-modal-title").textContent = "Edit Client Profile";
    $id("client-form-id").value = client.id;
    $id("client-name").value = client.name;
    $id("client-email").value = client.email || "";
    $id("client-phone").value = client.phone || "";
    $id("client-goals").value = client.goals || "";
    $id("client-notes").value = client.notes || "";
    $id("client-gdpr-consent").checked = Boolean(client.gdprConsent?.cloudSync);

    openModal("dialog-client");
  });

  const handleClose = () => closeModal("dialog-client");
  if (cancelBtn) cancelBtn.addEventListener("click", handleClose);
  if (closeBtn) closeBtn.addEventListener("click", handleClose);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $id("client-form-id").value;
    const name = $id("client-name").value.trim();
    const email = $id("client-email").value.trim();
    const phone = $id("client-phone").value.trim();
    const goals = $id("client-goals").value.trim();
    const notes = $id("client-notes").value.trim();
    const gdprConsentChecked = $id("client-gdpr-consent").checked;
    const nowIso = new Date().toISOString();

    if (!name) return;

    const todayStr = nowIso.substring(0, 10);

    if (id) {
      const client = state.clients.find((c) => c.id === id);
      if (client) {
        client.name = name;
        client.email = email;
        client.phone = phone;
        client.goals = goals;
        client.notes = notes;
        client.gdprConsent = {
          cloudSync: gdprConsentChecked,
          timestamp: gdprConsentChecked ? client.gdprConsent?.timestamp || nowIso : "",
        };
      }
    } else {
      const newId = newRecordId();
      const newClient = {
        id: newId,
        name: name,
        avatar: getInitials(name),
        joinedDate: todayStr,
        email: email,
        phone: phone,
        goals: goals,
        weightHistory: [],
        notes: notes,
        gdprConsent: {
          cloudSync: gdprConsentChecked,
          timestamp: gdprConsentChecked ? nowIso : "",
        },
        active: true,
      };
      state.clients.push(newClient);
    }

    saveToLocalStorage();
    renderClientsList({ state, t });
    populateDropdownSelectors();

    const activeId = getActiveDetailClientId();
    if (id && activeId === id) {
      showClientDetails({
        clientId: id,
        state,
        t,
        showErrorView,
        switchView,
        openWorkoutSetupModal,
      });
    }

    closeModal("dialog-client");
  });

  const searchClientsEl = $id("search-clients");
  if (searchClientsEl) {
    searchClientsEl.addEventListener("input", (e) => {
      renderClientsList({ state, t, filterQuery: e.target.value });
    });
  }
}

export function renderRoutineDialog() {
  const root = document.getElementById("dialogs-root");
  if (!root || document.getElementById("dialog-routine")) return;
  root.insertAdjacentHTML(
    "beforeend",
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

export function renderExerciseDialog() {
  const root = document.getElementById("dialogs-root");
  if (!root || document.getElementById("dialog-exercise")) return;
  root.insertAdjacentHTML(
    "beforeend",
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

      <!-- Metric options are repopulated per modality by formsController (cardio / agility only). -->
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
        <button type="submit" class="btn primary-btn">Save Exercise</button>
      </div>
    </form>
  </dialog>
`,
  );
}

export function setupExerciseForms({
  state,
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
  const cancelBtn = dialog.querySelector(".modal-cancel");
  const closeBtn = dialog.querySelector(".modal-close-btn");

  // As with routines: the route (`/exercises/new`) owns opening the form; the button navigates.
  openExerciseCreateForm = () => {
    openModal("dialog-exercise", { resetForm: true, formId: "form-exercise" });
    // The form reset restores modality to strength; re-sync so a reopen never leaves a metric
    // selector showing over a fixed-metric modality.
    syncMetricField();
  };
  const btnAddExercise = $id("btn-add-exercise");
  if (btnAddExercise) {
    btnAddExercise.addEventListener("click", () => navigateToPath(urlFor("exercise.new")));
  }

  const handleClose = () => closeModal("dialog-exercise");
  if (cancelBtn) cancelBtn.addEventListener("click", handleClose);
  if (closeBtn) closeBtn.addEventListener("click", handleClose);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $id("exercise-name").value.trim();
    const category = $id("exercise-category").value;
    const equipment = $id("exercise-equipment").value;
    const pattern = $id("exercise-pattern").value;
    const modality = $id("exercise-modality")?.value || "strength";
    const instructions = $id("exercise-instructions").value.trim();

    // Strict taxonomy inheritance (TODO §13.2 Scenario C): a new movement ID must carry its
    // muscle group, equipment, and biomechanical pattern so volume analytics stay consistent.
    if (!name || !category || !equipment || !pattern) return;

    const newEx = {
      id: newRecordId(),
      name: name,
      category: category,
      equipment: equipment,
      pattern: pattern,
      instructions: instructions,
    };
    // Modality decides how the movement is logged (exerciseModality.js). Omit the default so
    // strength entries stay identical to the legacy shape; metric-choice modalities (cardio, agility)
    // also carry the chosen effort metric.
    if (modality && modality !== "strength") {
      newEx.modality = modality;
      const metricOpts = metricOptionsFor(modality);
      if (metricOpts) newEx.metric = $id("exercise-metric")?.value || metricOpts[0];
    }

    state.exercises.push(newEx);
    saveToLocalStorage();
    renderExercisesList({ state, t });
    populateDropdownSelectors();
    closeModal("dialog-exercise");
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
    searchExercisesEl.addEventListener("input", (e) => {
      const activeChip = document.querySelector(".filter-chips .chip.active");
      renderExercisesList({
        state,
        t,
        filterQuery: e.target.value,
        categoryFilter: activeChip ? activeChip.getAttribute("data-filter") : "All",
      });
    });
  }

  for (const chip of document.querySelectorAll(".filter-chips .chip")) {
    chip.addEventListener("click", () => {
      for (const c of document.querySelectorAll(".filter-chips .chip")) {
        c.classList.remove("active");
      }
      chip.classList.add("active");
      const cat = chip.getAttribute("data-filter");
      const searchVal = $id("search-exercises").value;
      renderExercisesList({ state, t, filterQuery: searchVal, categoryFilter: cat });
    });
  }
}

export function populateDropdownSelectors({ state, t }) {
  const routineSelect = $id("setup-select-routine");
  if (routineSelect && state.routines) {
    routineSelect.innerHTML = `<option value="" disabled selected>${t("select_exercise")}</option>`;
    for (const r of state.routines.slice().sort((a, b) => a.name.localeCompare(b.name))) {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      routineSelect.appendChild(opt);
    }
  }

  const sessionExList = $id("session-ex-datalist");
  if (sessionExList && state.exercises) {
    sessionExList.innerHTML = "";
    for (const e of state.exercises.slice().sort((a, b) => a.name.localeCompare(b.name))) {
      const opt = document.createElement("option");
      opt.value = e.name;
      opt.label = e.category;
      sessionExList.appendChild(opt);
    }
  }
}
