import { $id, closeModal, openModal } from "../helper/dom.js";
import { parseLoad, parseReps } from "../helper/repsAndLoad.js";
import { generateShortUUID, getInitials } from "../helper/utils.js";
import {
  getActiveDetailClientId,
  renderClientsList,
  showClientDetails,
} from "../views/clients/clientsView.js";
import { renderExercisesList } from "../views/exercises/exercisesView.js";
import { addRoutineExerciseRow, renderRoutinesList } from "../views/routines/routinesView.js";
import { mountExercisePicker } from "../widgets/common/exercisePicker.js";

export function setupClientForms({
  state,
  t,
  saveToLocalStorage,
  populateDropdownSelectors,
  showErrorView,
  switchView,
  openWorkoutSetupModal,
}) {
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
      const newId = generateShortUUID();
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

export function setupRoutineForms({
  state,
  t,
  saveToLocalStorage,
  populateDropdownSelectors,
  openWorkoutSetupModal,
}) {
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
      onSelect: (ex) => {
        addRoutineExerciseRow({
          preset: { id: ex.id, sets: 3, reps: 10, weight: 0, rest: 60 },
          state,
        });
      },
    });
    pickerEl.classList.remove("hidden");
  };

  $id("btn-add-routine").addEventListener("click", () => {
    $id("routine-modal-title").textContent = "Create Routine Template";
    $id("routine-form-id").value = "";
    builderList.innerHTML = "";
    openModal("dialog-routine", { resetForm: true, formId: "form-routine" });
    openRoutinePicker();
  });

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
        id: generateShortUUID(),
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

export function setupExerciseForms({ state, t, saveToLocalStorage, populateDropdownSelectors }) {
  const dialog = $id("dialog-exercise");
  const form = $id("form-exercise");
  if (!dialog || !form) return;
  const cancelBtn = dialog.querySelector(".modal-cancel");
  const closeBtn = dialog.querySelector(".modal-close-btn");

  const btnAddExercise = $id("btn-add-exercise");
  if (btnAddExercise) {
    btnAddExercise.addEventListener("click", () => {
      openModal("dialog-exercise", { resetForm: true, formId: "form-exercise" });
    });
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
    const instructions = $id("exercise-instructions").value.trim();

    // Strict taxonomy inheritance (TODO §13.2 Scenario C): a new movement ID must carry its
    // muscle group, equipment, and biomechanical pattern so volume analytics stay consistent.
    if (!name || !category || !equipment || !pattern) return;

    const newEx = {
      id: generateShortUUID(),
      name: name,
      category: category,
      equipment: equipment,
      pattern: pattern,
      instructions: instructions,
    };

    state.exercises.push(newEx);
    saveToLocalStorage();
    renderExercisesList({ state, t });
    populateDropdownSelectors();
    closeModal("dialog-exercise");
  });

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
