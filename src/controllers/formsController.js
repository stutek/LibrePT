import { $id, openModal, closeModal } from '../helper/dom.js';
import { getActiveDetailClientId, showClientDetails, renderClientsList } from '../views/clientsView.js';
import { renderRoutinesList, addRoutineExerciseRow } from '../views/routinesView.js';
import { renderExercisesList } from '../views/exercisesView.js';
import { generateShortUUID, getInitials } from '../helper/utils.js';

export function setupClientForms({ state, t, saveToLocalStorage, populateDropdownSelectors, showErrorView, switchView, openWorkoutSetupModal }) {
  const dialog = $id('dialog-client');
  const form = $id('form-client');
  if (!dialog || !form) return;
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  $id('btn-add-client').addEventListener('click', () => {
    $id('client-modal-title').textContent = 'Add New Client';
    $id('client-form-id').value = '';
    openModal('dialog-client', { resetForm: true, formId: 'form-client' });
  });

  $id('btn-edit-client').addEventListener('click', () => {
    const activeId = getActiveDetailClientId();
    const client = state.clients.find(c => c.id === activeId);
    if (!client) return;

    $id('client-modal-title').textContent = 'Edit Client Profile';
    $id('client-form-id').value = client.id;
    $id('client-name').value = client.name;
    $id('client-goals').value = client.goals || '';
    $id('client-notes').value = client.notes || '';
    
    openModal('dialog-client');
  });

  const handleClose = () => closeModal('dialog-client');
  if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
  if (closeBtn) closeBtn.addEventListener('click', handleClose);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $id('client-form-id').value;
    const name = $id('client-name').value.trim();
    const goals = $id('client-goals').value.trim();
    const notes = $id('client-notes').value.trim();

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
    
    closeModal('dialog-client');
  });

  const searchClientsEl = $id('search-clients');
  if (searchClientsEl) {
    searchClientsEl.addEventListener('input', (e) => {
      renderClientsList({ state, t, filterQuery: e.target.value });
    });
  }
}

export function setupRoutineForms({ state, t, saveToLocalStorage, populateDropdownSelectors, openWorkoutSetupModal }) {
  const dialog = $id('dialog-routine');
  const form = $id('form-routine');
  const builderList = $id('routine-exercises-list');
  if (!dialog || !form || !builderList) return;
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  $id('btn-add-routine').addEventListener('click', () => {
    $id('routine-modal-title').textContent = 'Create Routine Template';
    $id('routine-form-id').value = '';
    builderList.innerHTML = '';
    addRoutineExerciseRow({ state });
    openModal('dialog-routine', { resetForm: true, formId: 'form-routine' });
  });

  const btnRoutineAddEx = $id('btn-routine-add-ex');
  if (btnRoutineAddEx) {
    btnRoutineAddEx.addEventListener('click', () => {
      addRoutineExerciseRow({ state });
    });
  }

  const handleClose = () => closeModal('dialog-routine');
  if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
  if (closeBtn) closeBtn.addEventListener('click', handleClose);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $id('routine-form-id').value;
    const name = $id('routine-name').value.trim();
    const description = $id('routine-desc').value.trim();

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
    closeModal('dialog-routine');
  });
}

export function setupExerciseForms({ state, t, saveToLocalStorage, populateDropdownSelectors }) {
  const dialog = $id('dialog-exercise');
  const form = $id('form-exercise');
  if (!dialog || !form) return;
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  const btnAddExercise = $id('btn-add-exercise');
  if (btnAddExercise) {
    btnAddExercise.addEventListener('click', () => {
      openModal('dialog-exercise', { resetForm: true, formId: 'form-exercise' });
    });
  }

  const handleClose = () => closeModal('dialog-exercise');
  if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
  if (closeBtn) closeBtn.addEventListener('click', handleClose);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $id('exercise-name').value.trim();
    const category = $id('exercise-category').value;
    const instructions = $id('exercise-instructions').value.trim();

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
    closeModal('dialog-exercise');
  });

  const searchExercisesEl = $id('search-exercises');
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
      const searchVal = $id('search-exercises').value;
      renderExercisesList({ state, t, filterQuery: searchVal, categoryFilter: cat });
    });
  });
}

export function populateDropdownSelectors({ state, t }) {
  const routineSelect = $id('setup-select-routine');
  if (routineSelect && state.routines) {
    routineSelect.innerHTML = `<option value="" disabled selected>${t('select_exercise')}</option>`;
    state.routines.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      routineSelect.appendChild(opt);
    });
  }

  const sessionExList = $id('session-ex-datalist');
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
