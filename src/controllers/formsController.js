// src/controllers/formsController.js - Domain module for client, routine, and exercise CRUD modal forms
import { getActiveDetailClientId, showClientDetails, renderClientsList } from '../views/clientsView.js';
import { renderRoutinesList, addRoutineExerciseRow } from '../views/routinesView.js';
import { renderExercisesList } from '../views/exercisesView.js';
import { generateShortUUID, getInitials } from '../helper/utils.js';

export function setupClientForms({ state, t, saveToLocalStorage, populateDropdownSelectors, showErrorView, switchView, openWorkoutSetupModal }) {
  const dialog = document.getElementById('dialog-client');
  const form = document.getElementById('form-client');
  if (!dialog || !form) return;
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-client').addEventListener('click', () => {
    document.getElementById('client-modal-title').textContent = 'Add New Client';
    form.reset();
    document.getElementById('client-form-id').value = '';
    dialog.showModal();
  });

  document.getElementById('btn-edit-client').addEventListener('click', () => {
    const activeId = getActiveDetailClientId();
    const client = state.clients.find(c => c.id === activeId);
    if (!client) return;

    document.getElementById('client-modal-title').textContent = 'Edit Client Profile';
    document.getElementById('client-form-id').value = client.id;
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-goals').value = client.goals || '';
    document.getElementById('client-notes').value = client.notes || '';
    
    dialog.showModal();
  });

  const closeModal = () => dialog.close();
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('client-form-id').value;
    const name = document.getElementById('client-name').value.trim();
    const goals = document.getElementById('client-goals').value.trim();
    const notes = document.getElementById('client-notes').value.trim();

    if (!name) return;

    const todayStr = new Date().toISOString().substring(0, 10);

    if (id) {
      const client = state.clients.find(c => c.id === id);
      if (client) {
        client.name = name;
        client.goals = goals;
        client.notes = notes;
      }
    } else {
      const newId = generateShortUUID();
      const newClient = {
        id: newId,
        name: name,
        avatar: getInitials(name),
        joinedDate: todayStr,
        goals: goals,
        weightHistory: [],
        notes: notes,
        active: true
      };
      state.clients.push(newClient);
    }

    saveToLocalStorage();
    renderClientsList({ state, t });
    populateDropdownSelectors();

    const activeId = getActiveDetailClientId();
    if (id && activeId === id) {
      showClientDetails({ clientId: id, state, t, showErrorView, switchView, openWorkoutSetupModal });
    }
    
    dialog.close();
  });

  const searchClientsEl = document.getElementById('search-clients');
  if (searchClientsEl) {
    searchClientsEl.addEventListener('input', (e) => {
      renderClientsList({ state, t, filterQuery: e.target.value });
    });
  }
}

export function setupRoutineForms({ state, t, saveToLocalStorage, populateDropdownSelectors, openWorkoutSetupModal }) {
  const dialog = document.getElementById('dialog-routine');
  const form = document.getElementById('form-routine');
  const builderList = document.getElementById('routine-exercises-list');
  if (!dialog || !form || !builderList) return;
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-routine').addEventListener('click', () => {
    document.getElementById('routine-modal-title').textContent = 'Create Routine Template';
    form.reset();
    document.getElementById('routine-form-id').value = '';
    builderList.innerHTML = '';
    addRoutineExerciseRow({ state });
    dialog.showModal();
  });

  const btnRoutineAddEx = document.getElementById('btn-routine-add-ex');
  if (btnRoutineAddEx) {
    btnRoutineAddEx.addEventListener('click', () => {
      addRoutineExerciseRow({ state });
    });
  }

  const closeModal = () => dialog.close();
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('routine-form-id').value;
    const name = document.getElementById('routine-name').value.trim();
    const description = document.getElementById('routine-desc').value.trim();

    if (!name) return;

    const exercises = [];
    builderList.querySelectorAll('.routine-builder-row').forEach(row => {
      const selectEx = row.querySelector('.select-ex');
      const inputSets = parseInt(row.querySelector('.input-sets').value);
      const inputReps = parseInt(row.querySelector('.input-reps').value);
      const inputWeight = parseFloat(row.querySelector('.input-weight').value);
      const inputRest = parseInt(row.querySelector('.input-rest').value);

      if (selectEx && selectEx.value && !isNaN(inputSets)) {
        exercises.push({
          id: selectEx.value,
          sets: inputSets,
          reps: isNaN(inputReps) ? 10 : inputReps,
          weight: isNaN(inputWeight) ? 0 : inputWeight,
          rest: isNaN(inputRest) ? 60 : inputRest
        });
      }
    });

    if (exercises.length === 0) {
      alert('Routines must include at least one exercise.');
      return;
    }

    if (id) {
      const routine = state.routines.find(r => r.id === id);
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
        exercises: exercises
      };
      state.routines.push(newRoutine);
    }

    saveToLocalStorage();
    renderRoutinesList({ state, t, openWorkoutSetupModal });
    populateDropdownSelectors();
    dialog.close();
  });
}

export function setupExerciseForms({ state, t, saveToLocalStorage, populateDropdownSelectors }) {
  const dialog = document.getElementById('dialog-exercise');
  const form = document.getElementById('form-exercise');
  if (!dialog || !form) return;
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  const btnAddExercise = document.getElementById('btn-add-exercise');
  if (btnAddExercise) {
    btnAddExercise.addEventListener('click', () => {
      form.reset();
      dialog.showModal();
    });
  }

  const closeModal = () => dialog.close();
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('exercise-name').value.trim();
    const category = document.getElementById('exercise-category').value;
    const instructions = document.getElementById('exercise-instructions').value.trim();

    if (!name || !category) return;

    const newEx = {
      id: generateShortUUID(),
      name: name,
      category: category,
      instructions: instructions
    };

    state.exercises.push(newEx);
    saveToLocalStorage();
    renderExercisesList({ state, t });
    populateDropdownSelectors();
    dialog.close();
  });

  const searchExercisesEl = document.getElementById('search-exercises');
  if (searchExercisesEl) {
    searchExercisesEl.addEventListener('input', (e) => {
      const activeChip = document.querySelector('.filter-chips .chip.active');
      renderExercisesList({ state, t, filterQuery: e.target.value, categoryFilter: activeChip ? activeChip.getAttribute('data-filter') : 'All' });
    });
  }

  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.getAttribute('data-filter');
      const searchVal = document.getElementById('search-exercises').value;
      renderExercisesList({ state, t, filterQuery: searchVal, categoryFilter: cat });
    });
  });
}

export function populateDropdownSelectors({ state, t }) {
  const routineSelect = document.getElementById('setup-select-routine');
  if (routineSelect && state.routines) {
    routineSelect.innerHTML = `<option value="" disabled selected>${t('select_exercise')}</option>`;
    state.routines.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      routineSelect.appendChild(opt);
    });
  }

  const sessionExList = document.getElementById('session-ex-datalist');
  if (sessionExList && state.exercises) {
    sessionExList.innerHTML = '';
    state.exercises.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.name;
      opt.label = e.category;
      sessionExList.appendChild(opt);
    });
  }
}
