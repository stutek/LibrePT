// app.js - OpenPT Application Controller Logic
import { DEFAULT_EXERCISES, DEFAULT_CLIENTS, DEFAULT_ROUTINES, DEFAULT_HISTORY } from './mockData.js';

// --- STATE MANAGEMENT ---
let state = {
  clients: [],
  exercises: [],
  routines: [],
  history: []
};

let activeSession = null;
let restTimer = {
  intervalId: null,
  secondsRemaining: 0,
  isActive: false,
  originalDuration: 60
};

// --- INITIALIZE APPLICATION ---
function init() {
  // Load data from LocalStorage or initialize with Mock Data
  const savedData = localStorage.getItem('openpt_db');
  if (savedData) {
    try {
      state = JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing local storage database. Re-seeding...', e);
      seedMockData();
    }
  } else {
    seedMockData();
  }

  // Set up Event Listeners
  setupNavigation();
  setupClientForms();
  setupRoutineForms();
  setupExerciseForms();
  setupWorkoutSetup();
  setupActiveSession();
  setupRestTimer();
  setupBackupRestore();

  // Render Initial Views
  renderClientsList();
  renderRoutinesList();
  renderExercisesList();
  renderGlobalHistory();
  populateDropdownSelectors();

  // Check if there was an active session saved (session recovery)
  recoverActiveSession();
}

function seedMockData() {
  state.clients = [...DEFAULT_CLIENTS];
  state.exercises = [...DEFAULT_EXERCISES];
  state.routines = [...DEFAULT_ROUTINES];
  state.history = [...DEFAULT_HISTORY];
  saveToLocalStorage();
}

function saveToLocalStorage() {
  localStorage.setItem('openpt_db', JSON.stringify(state));
}

// --- VIEW ROUTER ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewTarget = item.getAttribute('data-view');
      switchView(viewTarget);
    });
  });

  // Theme Toggle Controller
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  });

  // Client Details back button
  document.getElementById('btn-back-to-clients').addEventListener('click', () => {
    switchView('clients');
  });
}

function switchView(viewId) {
  // Hide all views
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.remove('active');
  });

  // Deactivate all nav items
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Highlight bottom nav matching tab
  // Handles secondary screens (like client detail) which don't map to bottom nav
  const mainTab = viewId.split('-')[0]; // handles 'client-detail' -> 'client' or matches 'clients'
  const tabItem = document.querySelector(`.bottom-nav .nav-item[data-view^="${mainTab}"]`);
  if (tabItem) {
    tabItem.classList.add('active');
  }

  // Scroll to top
  document.getElementById('main-content').scrollTop = 0;
}

// --- RENDER FUNCTIONS ---

// Clients View
function renderClientsList(filterQuery = '') {
  const container = document.getElementById('clients-list');
  container.innerHTML = '';

  const filtered = state.clients.filter(c => 
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.goals.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="grid-column: 1/-1;">No clients found. Click "Add Client" to create one.</div>`;
    return;
  }

  filtered.forEach(client => {
    const latestWeight = client.weightHistory.length > 0 
      ? client.weightHistory[client.weightHistory.length - 1].value + ' kg'
      : 'No weight logged';

    const card = document.createElement('div');
    card.className = 'client-card card glassmorphic';
    card.innerHTML = `
      <div class="client-info-block">
        <div class="avatar">${client.avatar || getInitials(client.name)}</div>
        <div class="client-name-meta">
          <h3>${escapeHTML(client.name)}</h3>
          <p>${escapeHTML(truncateString(client.goals, 45))}</p>
        </div>
      </div>
      <div class="client-weight-pill">${latestWeight}</div>
    `;

    card.addEventListener('click', () => {
      showClientDetails(client.id);
    });

    container.appendChild(card);
  });
}

// Client Detail View
let activeDetailClientId = null;
function showClientDetails(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  activeDetailClientId = clientId;
  document.getElementById('detail-client-name').textContent = client.name;
  document.getElementById('detail-client-avatar').textContent = client.avatar || getInitials(client.name);
  document.getElementById('profile-name').textContent = client.name;
  document.getElementById('profile-joined-date').textContent = `Joined ${formatDateStr(client.joinedDate)}`;
  document.getElementById('profile-goals').textContent = client.goals || 'No goals specified.';
  document.getElementById('profile-notes').textContent = client.notes || 'No health issues or custom caveats noted.';

  // Start workout from detail
  const startBtn = document.getElementById('btn-start-client-workout');
  // Re-bind click event
  startBtn.replaceWith(startBtn.cloneNode(true));
  document.getElementById('btn-start-client-workout').addEventListener('click', () => {
    openWorkoutSetupModal(clientId);
  });

  renderClientWeightHistory(client);
  renderClientWorkoutHistory(client);
  switchView('client-detail');
}

function renderClientWeightHistory(client) {
  const tbody = document.getElementById('weight-history-tbody');
  const chartContainer = document.getElementById('weight-history-chart');
  tbody.innerHTML = '';
  chartContainer.innerHTML = '';

  const weights = [...client.weightHistory].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  if (weights.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No weight records.</td></tr>`;
    chartContainer.innerHTML = `<span class="text-muted text-sm m-auto">Log weights to see progression.</span>`;
    return;
  }

  // Render Table rows
  weights.forEach((entry, idx) => {
    let diffText = '-';
    let diffClass = '';
    if (idx < weights.length - 1) {
      const prevVal = weights[idx + 1].value;
      const diff = (entry.value - prevVal).toFixed(1);
      if (diff > 0) {
        diffText = `+${diff} kg`;
        diffClass = 'text-danger';
      } else if (diff < 0) {
        diffText = `${diff} kg`;
        diffClass = 'text-emerald';
      } else {
        diffText = '0.0 kg';
      }
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateStr(entry.date)}</td>
      <td class="font-mono font-semibold">${entry.value} kg</td>
      <td class="${diffClass} font-mono">${diffText}</td>
    `;
    tbody.appendChild(row);
  });

  // Render simple visual chart bars (up to 8 elements chronologically)
  const chartData = [...client.weightHistory].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-8);
  if (chartData.length > 1) {
    const values = chartData.map(d => d.value);
    const minVal = Math.min(...values) - 2; // leave margin at bottom
    const maxVal = Math.max(...values) + 2; // margin at top
    const range = maxVal - minVal;

    chartData.forEach(entry => {
      const heightPercent = range > 0 ? ((entry.value - minVal) / range) * 100 : 50;
      const barWrapper = document.createElement('div');
      barWrapper.className = 'chart-bar-wrapper';
      barWrapper.innerHTML = `
        <div class="chart-bar" style="height: ${Math.max(10, heightPercent)}%">
          <div class="chart-tooltip">${entry.value} kg</div>
        </div>
        <span class="chart-label">${entry.date.substring(5, 10)}</span>
      `;
      chartContainer.appendChild(barWrapper);
    });
  } else {
    chartContainer.innerHTML = `<span class="text-muted text-sm m-auto">Need at least 2 entries for chart layout.</span>`;
  }
}

function renderClientWorkoutHistory(client) {
  const container = document.getElementById('client-history-list');
  container.innerHTML = '';

  const clientHistory = state.history
    .filter(log => log.clientId === client.id)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  if (clientHistory.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted text-sm">No workouts logged yet.</div>`;
    return;
  }

  renderHistoryItems(clientHistory, container);
}

// Routines View
function renderRoutinesList() {
  const container = document.getElementById('routines-list');
  container.innerHTML = '';

  if (state.routines.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="grid-column: 1/-1;">No routine templates found. Click "New Routine" to design one.</div>`;
    return;
  }

  state.routines.forEach(routine => {
    const card = document.createElement('div');
    card.className = 'routine-card card glassmorphic';
    
    // Make tags of exercises
    const tags = routine.exercises.map(item => {
      const ex = state.exercises.find(e => e.id === item.id);
      return `<span class="preview-tag">${ex ? ex.name : 'Unknown Exercise'}</span>`;
    }).slice(0, 4).join('');

    const moreCount = routine.exercises.length > 4 ? `+${routine.exercises.length - 4} more` : '';

    card.innerHTML = `
      <div class="routine-title-info">
        <h3>${escapeHTML(routine.name)}</h3>
        <p>${escapeHTML(routine.description || 'No description.')}</p>
        <div class="routine-exercise-preview-tags">
          ${tags}
          ${moreCount ? `<span class="preview-tag" style="background:var(--primary-light); color:var(--primary); font-weight:700">${moreCount}</span>` : ''}
        </div>
      </div>
      <button class="btn secondary-btn btn-sm w-full btn-launch-routine">
        <i class="fa-solid fa-circle-play"></i> Start Group Session
      </button>
    `;

    // Routine launcher action
    card.querySelector('.btn-launch-routine').addEventListener('click', (e) => {
      e.stopPropagation();
      openWorkoutSetupModal(null, routine.id);
    });

    // Tap card to edit
    card.addEventListener('click', () => {
      openRoutineEditorModal(routine.id);
    });

    container.appendChild(card);
  });
}

// Exercise Library View
function renderExercisesList(filterQuery = '', categoryFilter = 'All') {
  const container = document.getElementById('exercises-list');
  container.innerHTML = '';

  let filtered = state.exercises;

  if (categoryFilter !== 'All') {
    filtered = filtered.filter(e => e.category === categoryFilter);
  }

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.category.toLowerCase().includes(q) ||
      (e.instructions && e.instructions.toLowerCase().includes(q))
    );
  }

  // Sort alphabetically
  filtered.sort((a,b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">No exercises match filter criteria.</div>`;
    return;
  }

  filtered.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'exercise-item card glassmorphic';
    card.innerHTML = `
      <div class="exercise-item-header">
        <h3>${escapeHTML(ex.name)}</h3>
        <span class="muscle-badge">${ex.category}</span>
      </div>
      <p class="exercise-instructions">${escapeHTML(ex.instructions || 'No instructions.')}</p>
    `;
    container.appendChild(card);
  });
}

// Global History View
function renderGlobalHistory() {
  const container = document.getElementById('global-history-list');
  container.innerHTML = '';

  // Sort history newest first
  const sorted = [...state.history].sort((a,b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">No logged workouts in global history.</div>`;
    return;
  }

  renderHistoryItems(sorted, container);
}

// Helper to render lists of history items
function renderHistoryItems(historyList, container) {
  // We can group consecutive logs that were done together (same date, routine, and participants)
  // to display them as a neat group session log or individually.
  // For simplicity, let's render them as cards. If multiple people did it together, let's keep it clean.
  historyList.forEach(log => {
    const card = document.createElement('div');
    card.className = 'history-card card glassmorphic';
    
    const minutes = Math.floor(log.duration / 60);
    const durationText = minutes > 0 ? `${minutes} min session` : '< 1 min';

    // Render exercises completed list
    let exercisesLogHTML = '';
    log.exercises.forEach(ex => {
      const setsText = ex.sets.map(s => {
        const checkIcon = s.completed ? '✓' : 'x';
        return `${s.weight}kg×${s.reps}${s.note ? ` (${s.note})` : ''}`;
      }).join(', ');
      
      exercisesLogHTML += `
        <div class="history-ex-row">
          <strong>${escapeHTML(ex.name)}</strong>: <span>${escapeHTML(setsText)}</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="history-card-header">
        <div class="history-header-meta">
          <h4>${escapeHTML(log.clientName)}</h4>
          <p>${escapeHTML(log.routineName)} • ${durationText}</p>
        </div>
        <div class="history-date">${formatDateStr(log.date)}</div>
      </div>
      <div class="history-exercise-log">
        ${exercisesLogHTML}
      </div>
    `;

    container.appendChild(card);
  });
}

// --- FORM CONTROLLERS ---

// 1. Client Add/Edit Modal
function setupClientForms() {
  const dialog = document.getElementById('dialog-client');
  const form = document.getElementById('form-client');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-client').addEventListener('click', () => {
    document.getElementById('client-modal-title').textContent = 'Add New Client';
    form.reset();
    document.getElementById('client-form-id').value = '';
    dialog.showModal();
  });

  document.getElementById('btn-edit-client').addEventListener('click', () => {
    const client = state.clients.find(c => c.id === activeDetailClientId);
    if (!client) return;

    document.getElementById('client-modal-title').textContent = 'Edit Client Profile';
    document.getElementById('client-form-id').value = client.id;
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-weight').value = client.weightHistory.length > 0 
      ? client.weightHistory[client.weightHistory.length - 1].value 
      : '';
    document.getElementById('client-goals').value = client.goals || '';
    document.getElementById('client-notes').value = client.notes || '';
    
    dialog.showModal();
  });

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('client-form-id').value;
    const name = document.getElementById('client-name').value.trim();
    const weightVal = parseFloat(document.getElementById('client-weight').value);
    const goals = document.getElementById('client-goals').value.trim();
    const notes = document.getElementById('client-notes').value.trim();

    if (!name) return;

    const todayStr = new Date().toISOString().substring(0, 10);

    if (id) {
      // Edit mode
      const client = state.clients.find(c => c.id === id);
      if (client) {
        client.name = name;
        client.goals = goals;
        client.notes = notes;
        
        // If weight changed or is new, add it
        if (!isNaN(weightVal)) {
          const lastWeight = client.weightHistory.length > 0 ? client.weightHistory[client.weightHistory.length - 1].value : null;
          if (lastWeight !== weightVal) {
            client.weightHistory.push({ date: todayStr, value: weightVal });
          }
        }
      }
    } else {
      // Add mode
      const newId = 'client-' + Date.now();
      const weightHistory = !isNaN(weightVal) ? [{ date: todayStr, value: weightVal }] : [];
      
      const newClient = {
        id: newId,
        name: name,
        avatar: getInitials(name),
        joinedDate: todayStr,
        goals: goals,
        weightHistory: weightHistory,
        notes: notes,
        active: true
      };
      state.clients.push(newClient);
    }

    saveToLocalStorage();
    renderClientsList();
    populateDropdownSelectors();

    if (id && activeDetailClientId === id) {
      showClientDetails(id); // reload details
    }
    
    dialog.close();
  });

  // Client Search
  document.getElementById('search-clients').addEventListener('input', (e) => {
    renderClientsList(e.target.value);
  });

  // Log Weight Dialog Submitter
  const weightDialog = document.getElementById('dialog-weight');
  const weightForm = document.getElementById('form-weight');
  
  document.getElementById('btn-add-weight').addEventListener('click', () => {
    document.getElementById('weight-log-value').value = '';
    document.getElementById('weight-log-date').value = new Date().toISOString().substring(0, 10);
    weightDialog.showModal();
  });

  weightDialog.querySelector('.modal-cancel').addEventListener('click', () => weightDialog.close());
  weightDialog.querySelector('.modal-close-btn').addEventListener('click', () => weightDialog.close());

  weightForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = parseFloat(document.getElementById('weight-log-value').value);
    const date = document.getElementById('weight-log-date').value;
    
    if (isNaN(value) || !date) return;

    const client = state.clients.find(c => c.id === activeDetailClientId);
    if (client) {
      // Remove any existing entry for that specific date to prevent duplicates
      client.weightHistory = client.weightHistory.filter(w => w.date !== date);
      client.weightHistory.push({ date: date, value: value });
      // Sort weight history chronologically
      client.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date));
      
      saveToLocalStorage();
      renderClientsList();
      showClientDetails(client.id); // refresh
    }
    
    weightDialog.close();
  });
}

// 2. Routine Template Modal
function setupRoutineForms() {
  const dialog = document.getElementById('dialog-routine');
  const form = document.getElementById('form-routine');
  const builderList = document.getElementById('routine-exercises-list');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-routine').addEventListener('click', () => {
    document.getElementById('routine-modal-title').textContent = 'Create Routine Template';
    form.reset();
    document.getElementById('routine-form-id').value = '';
    builderList.innerHTML = '';
    addRoutineExerciseRow(); // start with one blank exercise
    dialog.showModal();
  });

  document.getElementById('btn-routine-add-ex').addEventListener('click', () => {
    addRoutineExerciseRow();
  });

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('routine-form-id').value;
    const name = document.getElementById('routine-name').value.trim();
    const description = document.getElementById('routine-desc').value.trim();

    if (!name) return;

    // Collect routine rows
    const exercises = [];
    builderList.querySelectorAll('.routine-builder-row').forEach(row => {
      const selectEx = row.querySelector('.select-ex');
      const inputSets = parseInt(row.querySelector('.input-sets').value);
      const inputReps = parseInt(row.querySelector('.input-reps').value);
      const inputWeight = parseFloat(row.querySelector('.input-weight').value);
      const inputRest = parseInt(row.querySelector('.input-rest').value);

      if (selectEx.value && !isNaN(inputSets)) {
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
      // Edit
      const routine = state.routines.find(r => r.id === id);
      if (routine) {
        routine.name = name;
        routine.description = description;
        routine.exercises = exercises;
      }
    } else {
      // Add
      const newRoutine = {
        id: 'routine-' + Date.now(),
        name: name,
        description: description,
        exercises: exercises
      };
      state.routines.push(newRoutine);
    }

    saveToLocalStorage();
    renderRoutinesList();
    populateDropdownSelectors();
    dialog.close();
  });
}

function openRoutineEditorModal(routineId) {
  const routine = state.routines.find(r => r.id === routineId);
  if (!routine) return;

  const dialog = document.getElementById('dialog-routine');
  const builderList = document.getElementById('routine-exercises-list');

  document.getElementById('routine-modal-title').textContent = 'Edit Routine Template';
  document.getElementById('routine-form-id').value = routine.id;
  document.getElementById('routine-name').value = routine.name;
  document.getElementById('routine-desc').value = routine.description || '';
  
  builderList.innerHTML = '';
  routine.exercises.forEach(item => {
    addRoutineExerciseRow(item);
  });

  dialog.showModal();
}

function addRoutineExerciseRow(preset = null) {
  const builderList = document.getElementById('routine-exercises-list');
  const row = document.createElement('div');
  row.className = 'routine-builder-row';
  
  // Build Options of Exercises
  const optionsHTML = state.exercises
    .sort((a,b) => a.name.localeCompare(b.name))
    .map(ex => `<option value="${ex.id}" ${preset && preset.id === ex.id ? 'selected' : ''}>${escapeHTML(ex.name)} (${ex.category})</option>`)
    .join('');

  row.innerHTML = `
    <select class="form-control select-ex" required>
      <option value="" disabled ${!preset ? 'selected' : ''}>Select Exercise</option>
      ${optionsHTML}
    </select>
    <div class="form-group" style="gap:2px">
      <input type="number" min="1" placeholder="Sets" class="form-control input-sets" value="${preset ? preset.sets : '3'}" required aria-label="Sets quantity">
    </div>
    <div class="form-group" style="gap:2px">
      <input type="number" min="1" placeholder="Reps" class="form-control input-reps" value="${preset ? preset.reps : '10'}" required aria-label="Reps quantity">
    </div>
    <div class="form-group" style="gap:2px">
      <input type="number" step="0.5" placeholder="kg" class="form-control input-weight" value="${preset ? preset.weight : '0'}" required aria-label="Starting weight in kilograms">
    </div>
    <div class="form-group" style="gap:2px">
      <input type="number" min="0" step="5" placeholder="Rest" class="form-control input-rest" value="${preset ? preset.rest : '60'}" required aria-label="Rest duration in seconds">
    </div>
    <button type="button" class="btn-remove-row" aria-label="Remove exercise from routine"><i class="fa-solid fa-trash-can"></i></button>
  `;

  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    row.remove();
  });

  builderList.appendChild(row);
  // Auto scroll to bottom of builder list
  builderList.scrollTop = builderList.scrollHeight;
}

// 3. Custom Exercise creation
function setupExerciseForms() {
  const dialog = document.getElementById('dialog-exercise');
  const form = document.getElementById('form-exercise');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-exercise').addEventListener('click', () => {
    form.reset();
    dialog.showModal();
  });

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('exercise-name').value.trim();
    const category = document.getElementById('exercise-category').value;
    const instructions = document.getElementById('exercise-instructions').value.trim();

    if (!name || !category) return;

    const newEx = {
      id: 'ex-' + Date.now(),
      name: name,
      category: category,
      instructions: instructions
    };

    state.exercises.push(newEx);
    saveToLocalStorage();
    renderExercisesList();
    populateDropdownSelectors();
    dialog.close();
  });

  // Search Exercises
  document.getElementById('search-exercises').addEventListener('input', (e) => {
    const activeChip = document.querySelector('.filter-chips .chip.active');
    renderExercisesList(e.target.value, activeChip ? activeChip.getAttribute('data-filter') : 'All');
  });

  // Category chips filtering
  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.getAttribute('data-filter');
      const searchVal = document.getElementById('search-exercises').value;
      renderExercisesList(searchVal, cat);
    });
  });
}

// Populate selectors across forms
function populateDropdownSelectors() {
  // Workout setup routines drop down
  const routineSelect = document.getElementById('setup-select-routine');
  routineSelect.innerHTML = '<option value="" disabled selected>Select Routine Template</option>';
  
  state.routines.sort((a,b) => a.name.localeCompare(b.name)).forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    routineSelect.appendChild(opt);
  });

  // Add exercise to active session drop down
  const sessionExSelect = document.getElementById('session-add-select-ex');
  sessionExSelect.innerHTML = '<option value="" disabled selected>Select Exercise</option>';
  
  state.exercises.sort((a,b) => a.name.localeCompare(b.name)).forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.name} (${e.category})`;
    sessionExSelect.appendChild(opt);
  });
}

// --- WORKOUT SESSION LOGIC ---

// 1. Session Setup Modal
function setupWorkoutSetup() {
  const dialog = document.getElementById('dialog-workout-setup');
  const form = document.getElementById('form-workout-setup');
  const clientsChecklist = document.getElementById('setup-clients-checklist');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const routineId = document.getElementById('setup-select-routine').value;
    
    // Collect active clients checked
    const participantIds = [];
    clientsChecklist.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      participantIds.push(cb.value);
    });

    if (participantIds.length === 0) {
      alert('You must select at least one participant client.');
      return;
    }

    if (!routineId) {
      alert('Please select a routine template.');
      return;
    }

    startWorkoutSession(routineId, participantIds);
    dialog.close();
  });
}

function openWorkoutSetupModal(preselectedClientId = null, preselectedRoutineId = null) {
  const dialog = document.getElementById('dialog-workout-setup');
  const clientsChecklist = document.getElementById('setup-clients-checklist');
  
  // Render clients checklist dynamically
  clientsChecklist.innerHTML = '';
  state.clients.sort((a,b) => a.name.localeCompare(b.name)).forEach(client => {
    const item = document.createElement('label');
    item.className = 'checklist-item';
    const isChecked = (preselectedClientId === client.id) ? 'checked' : '';
    item.innerHTML = `
      <input type="checkbox" value="${client.id}" ${isChecked}>
      <span>${escapeHTML(client.name)}</span>
    `;
    clientsChecklist.appendChild(item);
  });

  // Pre-select routine if passed
  const routineSelect = document.getElementById('setup-select-routine');
  if (preselectedRoutineId) {
    routineSelect.value = preselectedRoutineId;
  } else {
    routineSelect.value = '';
  }

  dialog.showModal();
}

// 2. Active Session Core
function startWorkoutSession(routineId, participantIds) {
  const routine = state.routines.find(r => r.id === routineId);
  if (!routine) return;

  // Initialize session state
  activeSession = {
    routineId: routine.id,
    routineName: routine.name,
    startTime: Date.now(),
    duration: 0,
    participants: participantIds,
    exercises: [], // copy exercise definitions
    logs: {}, // logs mapping
    activeExerciseIndex: 0
  };

  // Populate active exercises
  routine.exercises.forEach(item => {
    const ex = state.exercises.find(e => e.id === item.id);
    if (ex) {
      activeSession.exercises.push({
        id: item.id,
        name: ex.name,
        category: ex.category,
        instructions: ex.instructions,
        setsTargetCount: item.sets,
        repsTarget: item.reps,
        weightTarget: item.weight,
        rest: item.rest
      });

      // Initialize logs for all sets for all participants for this exercise
      participantIds.forEach(pId => {
        for (let sIdx = 0; sIdx < item.sets; sIdx++) {
          const key = `${item.id}_${pId}_${sIdx}`;
          activeSession.logs[key] = {
            reps: item.reps,
            weight: item.weight,
            completed: false,
            note: ''
          };
        }
      });
    }
  });

  // Save session state to localStorage for persistence recovery
  saveActiveSessionToCache();

  // Open overlay and bar
  document.getElementById('active-session-bar').classList.remove('hidden');
  document.getElementById('active-session-overlay').classList.remove('hidden');
  
  // Set labels
  document.getElementById('overlay-routine-name').textContent = routine.name;
  document.getElementById('session-bar-title').textContent = `Active: ${participantIds.length} Clients`;

  // Start timer interval
  startSessionTimer();

  // Render group board
  renderActiveGroupBoard();
}

function startSessionTimer() {
  if (activeSession.timerIntervalId) clearInterval(activeSession.timerIntervalId);
  
  activeSession.timerIntervalId = setInterval(() => {
    activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
    const timeStr = formatDuration(activeSession.duration);
    document.getElementById('session-bar-duration').textContent = timeStr;
    document.getElementById('overlay-session-duration').textContent = timeStr;
    
    // Save periodically
    saveActiveSessionToCache();
  }, 1000);
}

function renderActiveGroupBoard() {
  if (!activeSession || activeSession.exercises.length === 0) return;

  const currentExIdx = activeSession.activeExerciseIndex;
  const currentEx = activeSession.exercises[currentExIdx];

  // Update navigation details
  document.getElementById('active-ex-index').textContent = `Exercise ${currentExIdx + 1} of ${activeSession.exercises.length}`;
  document.getElementById('active-ex-name').textContent = currentEx.name;
  document.getElementById('active-ex-desc').textContent = currentEx.instructions || 'No instructions provided.';

  // Disable/enable arrows
  document.getElementById('btn-prev-exercise').disabled = (currentExIdx === 0);
  document.getElementById('btn-next-exercise').disabled = (currentExIdx === activeSession.exercises.length - 1);

  // Render client card logs
  const matrixContainer = document.getElementById('active-session-group-matrix');
  matrixContainer.innerHTML = '';

  activeSession.participants.forEach(pId => {
    const client = state.clients.find(c => c.id === pId);
    if (!client) return;

    // Check if client has finished all sets for current exercise
    let allSetsDone = true;
    const setsHTML = [];

    for (let sIdx = 0; sIdx < currentEx.setsTargetCount; sIdx++) {
      const key = `${currentEx.id}_${pId}_${sIdx}`;
      const log = activeSession.logs[key] || { reps: 10, weight: 0, completed: false, note: '' };

      if (!log.completed) {
        allSetsDone = false;
      }

      const checkedClass = log.completed ? 'checked' : '';

      setsHTML.push(`
        <div class="active-set-row" data-client="${pId}" data-set="${sIdx}">
          <span class="set-index-col">S${sIdx + 1}</span>
          
          <!-- Weight Stepper -->
          <div class="stepper-control-group">
            <span class="stepper-label">kg</span>
            <div class="stepper-input-wrapper">
              <button type="button" class="step-btn btn-weight-minus" aria-label="Decrease weight">-</button>
              <input type="number" step="0.5" class="input-set-weight" value="${log.weight}" aria-label="Set weight in kilograms">
              <button type="button" class="step-btn btn-weight-plus" aria-label="Increase weight">+</button>
            </div>
          </div>
          
          <!-- Reps Stepper -->
          <div class="stepper-control-group">
            <span class="stepper-label">reps</span>
            <div class="stepper-input-wrapper">
              <button type="button" class="step-btn btn-reps-minus" aria-label="Decrease reps">-</button>
              <input type="number" class="input-set-reps" value="${log.reps}" aria-label="Set reps quantity">
              <button type="button" class="step-btn btn-reps-plus" aria-label="Increase reps">+</button>
            </div>
          </div>
          
          <!-- Completed Checkbox -->
          <div class="set-check-col">
            <button type="button" class="set-checkbox-btn ${checkedClass}" aria-label="Mark set completed">
              <i class="fa-solid fa-check"></i>
            </button>
          </div>
        </div>
      `);
    }

    const card = document.createElement('div');
    card.className = `participant-log-card card ${allSetsDone ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="participant-card-header ${allSetsDone ? 'completed-all' : ''}">
        <h5>
          <div class="avatar" style="width:28px; height:28px; font-size:11px">${client.avatar || getInitials(client.name)}</div>
          <span>${escapeHTML(client.name)}</span>
        </h5>
        <span class="participant-header-status">${allSetsDone ? '<i class="fa-solid fa-circle-check text-emerald"></i> All Done' : 'Remaining'}</span>
      </div>
      <div class="participant-set-rows">
        ${setsHTML.join('')}
      </div>
    `;

    // Add event bindings to the steppers and buttons
    card.querySelectorAll('.active-set-row').forEach(row => {
      const clientId = row.getAttribute('data-client');
      const setIdx = parseInt(row.getAttribute('data-set'));
      const key = `${currentEx.id}_${clientId}_${setIdx}`;

      const weightInput = row.querySelector('.input-set-weight');
      const repsInput = row.querySelector('.input-set-reps');
      const checkBtn = row.querySelector('.set-checkbox-btn');

      // Functions to sync state and DOM
      const updateWeight = (val) => {
        if (isNaN(val) || val < 0) val = 0;
        activeSession.logs[key].weight = val;
        weightInput.value = val;
        saveActiveSessionToCache();
      };

      const updateReps = (val) => {
        if (isNaN(val) || val < 0) val = 0;
        activeSession.logs[key].reps = val;
        repsInput.value = val;
        saveActiveSessionToCache();
      };

      // Weight stepper
      row.querySelector('.btn-weight-minus').addEventListener('click', () => {
        const current = parseFloat(weightInput.value) || 0;
        updateWeight(Math.max(0, current - 2.5));
      });
      row.querySelector('.btn-weight-plus').addEventListener('click', () => {
        const current = parseFloat(weightInput.value) || 0;
        updateWeight(current + 2.5);
      });
      weightInput.addEventListener('change', (e) => {
        updateWeight(parseFloat(e.target.value));
      });

      // Reps stepper
      row.querySelector('.btn-reps-minus').addEventListener('click', () => {
        const current = parseInt(repsInput.value) || 0;
        updateReps(Math.max(0, current - 1));
      });
      row.querySelector('.btn-reps-plus').addEventListener('click', () => {
        const current = parseInt(repsInput.value) || 0;
        updateReps(current + 1);
      });
      repsInput.addEventListener('change', (e) => {
        updateReps(parseInt(e.target.value));
      });

      // Checkbox click
      checkBtn.addEventListener('click', () => {
        const isChecked = activeSession.logs[key].completed;
        activeSession.logs[key].completed = !isChecked;
        
        if (!isChecked) {
          checkBtn.classList.add('checked');
          // If Rest Timer duration is specified, trigger timer
          if (currentEx.rest > 0 && !restTimer.isActive) {
            triggerRestTimer(currentEx.rest);
          }
        } else {
          checkBtn.classList.remove('checked');
        }

        saveActiveSessionToCache();
        // Re-render group board to update card backgrounds and indicators
        renderActiveGroupBoard();
      });
    });

    matrixContainer.appendChild(card);
  });
}

function setupActiveSession() {
  // Navigation Arrows
  document.getElementById('btn-prev-exercise').addEventListener('click', () => {
    if (activeSession && activeSession.activeExerciseIndex > 0) {
      activeSession.activeExerciseIndex--;
      renderActiveGroupBoard();
    }
  });

  document.getElementById('btn-next-exercise').addEventListener('click', () => {
    if (activeSession && activeSession.activeExerciseIndex < activeSession.exercises.length - 1) {
      activeSession.activeExerciseIndex++;
      renderActiveGroupBoard();
    }
  });

  // Minimize panel trigger
  document.getElementById('btn-collapse-session').addEventListener('click', () => {
    document.getElementById('active-session-overlay').classList.add('hidden');
  });

  // Expand panel trigger
  document.getElementById('btn-expand-session').addEventListener('click', () => {
    document.getElementById('active-session-overlay').classList.remove('hidden');
  });

  // Cancel workout
  document.getElementById('btn-cancel-session').addEventListener('click', () => {
    if (confirm('Cancel active workout? All logged sets for this session will be permanently lost.')) {
      cancelWorkoutSession();
    }
  });

  // Finish workout
  document.getElementById('btn-finish-session').addEventListener('click', () => {
    finishWorkoutSession();
  });

  // Setup Add Exercise to Session modal trigger
  const addExModal = document.getElementById('dialog-add-session-exercise');
  const addExForm = document.getElementById('form-add-session-exercise');
  
  document.getElementById('btn-add-exercise-to-session').addEventListener('click', () => {
    addExForm.reset();
    addExModal.showModal();
  });

  addExModal.querySelector('.modal-cancel').addEventListener('click', () => addExModal.close());
  addExModal.querySelector('.modal-close-btn').addEventListener('click', () => addExModal.close());

  addExForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const exId = document.getElementById('session-add-select-ex').value;
    const sets = parseInt(document.getElementById('session-add-sets').value);
    const reps = parseInt(document.getElementById('session-add-reps').value);
    const weight = parseFloat(document.getElementById('session-add-weight').value);
    const rest = parseInt(document.getElementById('session-add-rest').value);

    if (!activeSession || !exId || isNaN(sets)) return;

    const baseEx = state.exercises.find(e => e.id === exId);
    if (!baseEx) return;

    // Append exercise to active session routine list
    const newEx = {
      id: exId,
      name: baseEx.name,
      category: baseEx.category,
      instructions: baseEx.instructions,
      setsTargetCount: sets,
      repsTarget: reps,
      weightTarget: weight,
      rest: rest
    };

    activeSession.exercises.push(newEx);

    // Initialize logs for all participants
    activeSession.participants.forEach(pId => {
      for (let sIdx = 0; sIdx < sets; sIdx++) {
        const key = `${exId}_${pId}_${sIdx}`;
        activeSession.logs[key] = {
          reps: reps,
          weight: weight,
          completed: false,
          note: ''
        };
      }
    });

    // Jump to the newly added exercise
    activeSession.activeExerciseIndex = activeSession.exercises.length - 1;
    
    saveActiveSessionToCache();
    renderActiveGroupBoard();
    addExModal.close();
  });
}

function cancelWorkoutSession() {
  if (activeSession) {
    clearInterval(activeSession.timerIntervalId);
  }
  activeSession = null;
  localStorage.removeItem('openpt_active_session');
  document.getElementById('active-session-bar').classList.add('hidden');
  document.getElementById('active-session-overlay').classList.add('hidden');
}

function finishWorkoutSession() {
  if (!activeSession) return;

  // Verify if any sets were logged
  let totalSets = 0;
  let completedSets = 0;
  for (const k in activeSession.logs) {
    totalSets++;
    if (activeSession.logs[k].completed) completedSets++;
  }

  if (completedSets === 0) {
    if (!confirm('No completed sets were logged. Are you sure you want to finish and save an empty session?')) {
      return;
    }
  }

  // constructed date ISO string
  const sessionDateISO = new Date(activeSession.startTime).toISOString();
  const sessionDuration = activeSession.duration;

  // Split history into individual records for each participant
  activeSession.participants.forEach(pId => {
    const client = state.clients.find(c => c.id === pId);
    if (!client) return;

    // Build array of exercises completed by this specific client
    const clientCompletedExercises = [];

    activeSession.exercises.forEach(ex => {
      const clientSetsLogged = [];
      for (let sIdx = 0; sIdx < ex.setsTargetCount; sIdx++) {
        const key = `${ex.id}_${pId}_${sIdx}`;
        const log = activeSession.logs[key];
        
        // Save set if completed (or if trainer logged a custom load)
        if (log && (log.completed || log.weight > 0)) {
          clientSetsLogged.push({
            reps: log.reps,
            weight: log.weight,
            completed: log.completed,
            note: log.note || ''
          });
        }
      }

      if (clientSetsLogged.length > 0) {
        clientCompletedExercises.push({
          id: ex.id,
          name: ex.name,
          sets: clientSetsLogged
        });
      }
    });

    // Save individual history entry if client actually did exercises
    if (clientCompletedExercises.length > 0) {
      const clientLog = {
        id: `log-${Date.now()}-${pId}`,
        clientId: pId,
        clientName: client.name,
        routineName: activeSession.routineName,
        date: sessionDateISO,
        duration: sessionDuration,
        exercises: clientCompletedExercises
      };
      
      state.history.push(clientLog);

      // Extract weights from the exercise log to potentially add to client weightHistory
      // We don't automatically update bodyweight from exercise logs unless it's a bodyweight metric,
      // but let's keep client weight tracking separate.
    }
  });

  // Save changes
  saveToLocalStorage();

  // Clear session caches
  cancelWorkoutSession();

  // Refresh data listings
  renderClientsList();
  renderRoutinesList();
  renderGlobalHistory();

  // Direct to History view to show logged training
  switchView('history');
}

// --- LOCAL STORAGE SESSION RECOVERY ---
function saveActiveSessionToCache() {
  if (!activeSession) return;
  // Create cache copy without timer interval ID handle
  const cacheObj = {
    ...activeSession,
    timerIntervalId: null
  };
  localStorage.setItem('openpt_active_session', JSON.stringify(cacheObj));
}

function recoverActiveSession() {
  const cached = localStorage.getItem('openpt_active_session');
  if (!cached) return;

  try {
    const parsed = JSON.parse(cached);
    if (parsed && parsed.startTime) {
      activeSession = parsed;
      // Recalculate duration offset
      activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
      
      // Open panel widgets
      document.getElementById('active-session-bar').classList.remove('hidden');
      document.getElementById('session-bar-title').textContent = `Active: ${activeSession.participants.length} Clients`;

      // Start elapsed timer ticking
      startSessionTimer();
      renderActiveGroupBoard();
    }
  } catch (e) {
    console.error('Error recovering active session cache:', e);
  }
}

// --- REST TIMER CONTROLLER ---
function setupRestTimer() {
  const panel = document.getElementById('floating-rest-timer');
  const timerLabel = document.getElementById('timer-countdown');
  const toggleBtn = document.getElementById('btn-timer-toggle');
  
  document.getElementById('btn-timer-trigger').addEventListener('click', () => {
    const currentEx = activeSession ? activeSession.exercises[activeSession.activeExerciseIndex] : null;
    triggerRestTimer(currentEx ? currentEx.rest : 60);
  });

  document.getElementById('btn-trigger-group-timer').addEventListener('click', () => {
    const currentEx = activeSession ? activeSession.exercises[activeSession.activeExerciseIndex] : null;
    triggerRestTimer(currentEx ? currentEx.rest : 60);
  });

  document.getElementById('btn-close-timer').addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  toggleBtn.addEventListener('click', () => {
    if (restTimer.isActive) {
      pauseRestTimer();
    } else {
      resumeRestTimer();
    }
  });

  document.getElementById('btn-timer-plus').addEventListener('click', () => {
    adjustRestTimer(15);
  });

  document.getElementById('btn-timer-minus').addEventListener('click', () => {
    adjustRestTimer(-15);
  });
}

function triggerRestTimer(durationSeconds) {
  if (restTimer.intervalId) clearInterval(restTimer.intervalId);
  
  restTimer.secondsRemaining = durationSeconds;
  restTimer.originalDuration = durationSeconds;
  restTimer.isActive = true;
  
  const panel = document.getElementById('floating-rest-timer');
  panel.classList.remove('hidden');
  
  updateTimerUI();
  
  restTimer.intervalId = setInterval(tickRestTimer, 1000);
}

function tickRestTimer() {
  if (restTimer.secondsRemaining > 0) {
    restTimer.secondsRemaining--;
    updateTimerUI();
  } else {
    // Rest Complete Beep & Vibrations
    clearInterval(restTimer.intervalId);
    restTimer.isActive = false;
    restTimer.intervalId = null;
    updateTimerUI();
    
    playTimerAlert();
    document.getElementById('timer-countdown').textContent = 'DONE!';
  }
}

function updateTimerUI() {
  const timerLabel = document.getElementById('timer-countdown');
  const toggleBtn = document.getElementById('btn-timer-toggle');
  
  timerLabel.textContent = `${restTimer.secondsRemaining}s`;
  
  if (restTimer.isActive) {
    toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

function pauseRestTimer() {
  if (restTimer.intervalId) {
    clearInterval(restTimer.intervalId);
    restTimer.intervalId = null;
  }
  restTimer.isActive = false;
  updateTimerUI();
}

function resumeRestTimer() {
  if (restTimer.secondsRemaining <= 0) return;
  restTimer.isActive = true;
  updateTimerUI();
  restTimer.intervalId = setInterval(tickRestTimer, 1000);
}

function adjustRestTimer(seconds) {
  restTimer.secondsRemaining += seconds;
  if (restTimer.secondsRemaining < 0) restTimer.secondsRemaining = 0;
  updateTimerUI();
}

function playTimerAlert() {
  // Mobile Haptic Vibration
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }

  // Synthesized audio beep via Web Audio API (cross-browser offline friendly)
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Play double beep
    const playBeep = (time, frequency, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, time);
      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    playBeep(now, 880, 0.25); // high A tone
    playBeep(now + 0.3, 880, 0.4); // slightly longer tone
  } catch (e) {
    console.error('Error synthesizing rest timer alert sound:', e);
  }
}

// --- DATA IMPORT/EXPORT ---
function setupBackupRestore() {
  const dialog = document.getElementById('dialog-backup');
  const importFile = document.getElementById('import-db-file');
  const importStatus = document.getElementById('import-status');

  document.getElementById('backup-btn').addEventListener('click', () => {
    importStatus.textContent = '';
    importStatus.className = 'status-msg';
    dialog.showModal();
  });

  dialog.querySelector('.modal-close-btn').addEventListener('click', () => dialog.close());

  // Export JSON
  document.getElementById('btn-export-db').addEventListener('click', () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `openpt_backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    URL.revokeObjectURL(url);
  });

  // Trigger file click
  dialog.querySelector('.file-trigger').addEventListener('click', () => {
    importFile.click();
  });

  // Import JSON File
  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const importedData = JSON.parse(evt.target.result);
        
        // Simple verification schema
        if (importedData && Array.isArray(importedData.clients) && Array.isArray(importedData.exercises)) {
          state = {
            clients: importedData.clients || [],
            exercises: importedData.exercises || [],
            routines: importedData.routines || [],
            history: importedData.history || []
          };
          saveToLocalStorage();
          
          // Re-render
          renderClientsList();
          renderRoutinesList();
          renderExercisesList();
          renderGlobalHistory();
          populateDropdownSelectors();

          importStatus.textContent = 'Import successful! Database synchronized.';
          importStatus.className = 'status-msg text-emerald';
        } else {
          throw new Error('Missing core structure validation.');
        }
      } catch (err) {
        importStatus.textContent = 'Error: Invalid backup file format.';
        importStatus.className = 'status-msg text-danger';
        console.error('Import file parse error:', err);
      }
    };
    reader.readAsText(file);
  });

  // Wipe database
  document.getElementById('btn-reset-db').addEventListener('click', () => {
    if (confirm('CRITICAL WARNING: This permanently wipes all workout logs and custom records. Are you absolutely sure?')) {
      localStorage.removeItem('openpt_db');
      cancelWorkoutSession();
      seedMockData();
      
      renderClientsList();
      renderRoutinesList();
      renderExercisesList();
      renderGlobalHistory();
      populateDropdownSelectors();
      
      importStatus.textContent = 'Database reset successfully to factory defaults.';
      importStatus.className = 'status-msg text-emerald';
    }
  });
}

// --- UTILITY HELPER FUNCTIONS ---
function getInitials(name) {
  if (!name) return 'PT';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function truncateString(str, num) {
  if (!str) return '';
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');
  
  if (hrs > 0) {
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Register Service Worker for offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA Service Worker registered:', reg.scope))
      .catch(err => console.error('PWA Service Worker registration failed:', err));
  });
}

// Trigger initialization on DOM load
window.addEventListener('DOMContentLoaded', init);
