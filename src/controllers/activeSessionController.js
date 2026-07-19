// src/controllers/activeSessionController.js - Domain module for active workout session state, timers, signals, and lifecycle
import { generateShortUUID, formatDuration, formatSignedDuration, getInitials, getClientDisplayNameHTML, escapeHTML } from '../helper/utils.js';
import { updateSessionBarTimer, renderActiveSessionBarLabels, renderIdleSessionBar } from '../components/sessionBar.js';
import { renderActiveUsersList, updateClientTabsFadeState } from '../components/activeUsersList.js';
import { renderExerciseDeck } from '../components/exerciseDeck.js';
import { renderClipboardEditor } from '../components/clipboardEditor.js';
import { openFeedbackModal } from '../components/feedbackModal.js';
import { renderClientsList } from '../views/clientsView.js';
import { renderRoutinesList } from '../views/routinesView.js';
import { renderGlobalHistory } from '../views/historyView.js';

let activeSession = null;
let appDeps = {};
let screenWakeLock = null;
let wakeLockVisibilityAttached = false;

async function requestScreenWakeLock() {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      if (!screenWakeLock) {
        screenWakeLock = await navigator.wakeLock.request('screen');
        screenWakeLock.addEventListener('release', () => {
          screenWakeLock = null;
        });
      }
      if (!wakeLockVisibilityAttached && typeof document !== 'undefined') {
        wakeLockVisibilityAttached = true;
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && activeSession !== null) {
            requestScreenWakeLock();
          }
        });
      }
    } catch (err) {
      console.debug('WakeLock request failed or disallowed:', err);
    }
  }
}

async function releaseScreenWakeLock() {
  if (screenWakeLock !== null && typeof screenWakeLock.release === 'function') {
    try {
      await screenWakeLock.release();
      screenWakeLock = null;
    } catch (err) {
      console.debug('WakeLock release failed:', err);
    }
  }
}

// Inline clipboard edit mode: when on, the deck renders the editable plan list instead of the
// live logging deck. editorCleanup detaches the editor's document listeners on the next render.
let clipboardEditMode = false;
let editorCleanup = null;

// ---- Rest as a first-class plan item ----------------------------------------------------------
// The plan (clientState.exercises) is an ordered mix of exercise items and rest items. A rest item
// is { id, type:'rest', rest:<seconds>, circuitId, circuitTitle, circuitSeries } — it carries the
// circuit fields so a rest inside a superset stays grouped with it. Exercise items have no `type`.
export const isRestItem = (it) => !!it && it.type === 'rest';

// Legacy plans (routines, recovered/demo sessions) carried rest as a number on the exercise. Turn
// any such `rest>0` into a following rest item. Idempotent: it zeroes the exercise's rest as it
// migrates, so re-running is a no-op. Keeps the focus pointer on the same exercise object.
function ensureRestItems(cs) {
  if (!cs || !Array.isArray(cs.exercises)) return;
  const focused = cs.exercises[cs.activeExerciseIndex];
  let changed = false;
  const out = [];
  cs.exercises.forEach(it => {
    out.push(it);
    if (!isRestItem(it) && it.rest > 0) {
      out.push({
        id: `rest-${it.id}`,
        type: 'rest',
        rest: it.rest,
        circuitId: it.circuitId || null,
        circuitTitle: it.circuitTitle || '',
        circuitSeries: it.circuitSeries || 1
      });
      it.rest = 0;
      changed = true;
    }
  });
  if (changed) {
    cs.exercises = out;
    const ai = out.indexOf(focused);
    cs.activeExerciseIndex = ai >= 0 ? ai : 0;
    clampFocusToExercise(cs);
  }
}

// The active-exercise pointer must never land on a rest item (rests aren't focusable/loggable).
// Snap it to the nearest exercise, searching forward first, then backward.
function clampFocusToExercise(cs) {
  if (!cs || !cs.exercises || !cs.exercises.length) return;
  if (!isRestItem(cs.exercises[cs.activeExerciseIndex])) return;
  for (let i = cs.activeExerciseIndex; i < cs.exercises.length; i++) {
    if (!isRestItem(cs.exercises[i])) { cs.activeExerciseIndex = i; return; }
  }
  for (let i = cs.activeExerciseIndex - 1; i >= 0; i--) {
    if (!isRestItem(cs.exercises[i])) { cs.activeExerciseIndex = i; return; }
  }
  cs.activeExerciseIndex = 0;
}

export function enterClipboardEditMode() {
  clipboardEditMode = true;
  renderActiveGroupBoard();
}

export function exitClipboardEditMode() {
  clipboardEditMode = false;
  renderActiveGroupBoard();
}

export function initActiveSessionController(deps) {
  appDeps = { ...appDeps, ...deps };
}

export function getActiveSession() {
  return activeSession;
}

export function setActiveSession(session) {
  activeSession = session;
}

export function focusIndexFromRef(clientState, focusRef) {
  if (!clientState || !clientState.exercises || !focusRef) return -1;
  if (focusRef.type === 'superset') {
    return clientState.exercises.findIndex(e => !isRestItem(e) && e.circuitId === focusRef.id);
  }
  return clientState.exercises.findIndex(e => !isRestItem(e) && !e.circuitId && e.id === focusRef.id);
}

export function sessionFocusPath() {
  if (!activeSession) return null;
  const clientId = activeSession.activeClientId || activeSession.participants[0];
  const base = `/session/${activeSession.id}/client/${clientId}`;
  const cs = activeSession.clientRoutines[clientId];
  const ex = cs && cs.exercises && cs.exercises[cs.activeExerciseIndex];
  if (!ex) return base;
  return ex.circuitId ? `${base}/superset/${ex.circuitId}` : `${base}/exercise/${ex.id}`;
}

export function syncSessionFocusUrl() {
  if (!activeSession) return;
  const { toRoute, toUrl } = appDeps;
  if (!toRoute || !toUrl) return;
  const current = toRoute(window.location.pathname);
  if (!current.startsWith('/session/')) return;
  const target = sessionFocusPath();
  if (target && current !== target) {
    window.history.replaceState(null, '', toUrl(target));
  }
}

export function focusExerciseByIndex(index) {
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  cs.activeExerciseIndex = index;
  activeSession.expandedPastId = null;
  saveActiveSessionToCache();
  renderActiveGroupBoard();
}

export function startWorkoutSession(clientRoutines, bookingMeta = null, deps = {}) {
  if (deps) appDeps = { ...appDeps, ...deps };
  const { state, navigateToPath } = appDeps;
  if (!state) return;

  const participantIds = clientRoutines.map(cr => cr.clientId);
  const sessionId = bookingMeta ? bookingMeta.id : generateShortUUID();

  activeSession = {
    id: sessionId,
    startTime: Date.now(),
    duration: 0,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    booking: bookingMeta
  };

  clientRoutines.forEach(cr => {
    const routine = state.routines.find(r => r.id === cr.routineId);
    if (!routine) return;
    
    const clientState = {
      routineId: routine.id,
      routineName: routine.name,
      activeExerciseIndex: 0,
      exercises: [],
      logs: {}
    };

    routine.exercises.forEach(item => {
      const ex = state.exercises.find(e => e.id === item.id);
      if (ex) {
        clientState.exercises.push({
          id: item.id,
          name: ex.name,
          category: ex.category,
          instructions: ex.instructions,
          setsTargetCount: item.sets,
          repsTarget: item.reps,
          weightTarget: item.weight,
          rest: item.rest,
          circuitId: item.circuitId || null,
          circuitTitle: item.circuitTitle || '',
          circuitSeries: item.circuitSeries || 1
        });

        clientState.logs[item.id] = Array.from({ length: item.sets }, () => ({
          reps: item.reps,
          weight: item.weight,
          completed: false,
          note: ''
        }));
      }
    });

    activeSession.clientRoutines[cr.clientId] = clientState;
  });

  saveActiveSessionToCache();
  requestScreenWakeLock();

  const sId = activeSession.id || generateShortUUID();
  if (navigateToPath) {
    navigateToPath(`/session/${sId}/client/${activeSession.activeClientId}`);
  }
}

export function startSessionTimer() {
  if (!activeSession) return;
  if (activeSession.timerIntervalId) clearInterval(activeSession.timerIntervalId);

  const tick = () => {
    if (!activeSession) return;
    activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
    updateOverlaySessionTimer();
    updateSessionBarTimer();
    saveActiveSessionToCache();
  };

  activeSession.timerIntervalId = setInterval(tick, 1000);
  tick();
}

export function updateOverlaySessionTimer() {
  if (!activeSession) return;
  const el = document.getElementById('overlay-session-duration');
  if (!el) return;

  const endDate = activeSession.booking && activeSession.booking.endDate;
  if (endDate) {
    const remainingSec = Math.round((new Date(endDate).getTime() - Date.now()) / 1000);
    el.textContent = formatSignedDuration(remainingSec);
    el.style.color = remainingSec < 0 ? 'var(--danger)' : 'var(--primary)';
  } else {
    el.textContent = formatDuration(activeSession.duration);
    el.style.color = 'var(--primary)';
  }
}

export function getActiveExercise() {
  if (!activeSession) return null;
  const activeClientId = activeSession.activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];
  if (!activeClientState || activeClientState.exercises.length === 0) return null;
  return activeClientState.exercises[activeClientState.activeExerciseIndex];
}

export function logQuickSignal(tag, exId) {
  if (!activeSession) return;
  const { state, saveToLocalStorage, renderPendingPlanAdjustments } = appDeps;
  if (!state) return;

  const clientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[clientId];
  if (!clientState || clientState.exercises.length === 0) return;

  const curEx = (exId && clientState.exercises.find(e => e.id === exId))
    || clientState.exercises[clientState.activeExerciseIndex];
  const client = state.clients.find(c => c.id === clientId);

  const newFeedback = {
    id: generateShortUUID(),
    clientId,
    clientName: client ? client.name : 'Unknown Client',
    date: new Date().toISOString(),
    exerciseName: curEx.name,
    tag,
    hasVoiceNote: false,
    resolved: false
  };
  state.planUpdates.push(newFeedback);

  if (!activeSession.feedback) activeSession.feedback = [];
  activeSession.feedback.push({
    id: newFeedback.id,
    clientId,
    exerciseName: curEx.name,
    tag,
    note: '',
    hasVoiceNote: false
  });

  (clientState.logs[curEx.id] || []).forEach(l => { l.completed = true; });

  saveActiveSessionToCache();
  if (saveToLocalStorage) saveToLocalStorage();
  if (renderPendingPlanAdjustments) renderPendingPlanAdjustments();
  renderActiveGroupBoard();
}

export function getExerciseSignalColor(clientId, exerciseName) {
  const fb = ((activeSession && activeSession.feedback) || [])
    .filter(f => f.clientId === clientId && f.exerciseName === exerciseName);
  if (fb.length === 0) return null;
  if (fb.some(f => (f.note && f.note.trim()) || f.hasVoiceNote)) return 'var(--danger)';
  if (fb.some(f => /too hard|reduce load/i.test(f.tag))) return '#f59e0b';
  if (fb.some(f => /too easy|increase load/i.test(f.tag))) return 'var(--success)';
  return 'var(--danger)';
}

export function buildSupersetUnits(list) {
  const units = [];
  list.forEach(item => {
    if (item.circuitId) {
      const last = units[units.length - 1];
      if (last && last.type === 'circuit' && last.circuitId === item.circuitId) {
        last.items.push(item);
        last.isInFocus = last.isInFocus || item.isInFocus;
        last.isCompleted = last.isCompleted && item.isCompleted;
      } else {
        units.push({
          type: 'circuit',
          circuitId: item.circuitId,
          title: item.circuitTitle,
          series: item.circuitSeries || 1,
          items: [item],
          isInFocus: item.isInFocus,
          isCompleted: item.isCompleted
        });
      }
    } else {
      units.push(item);
    }
  });
  return units;
}

export function completeSupersetRound(circuitId) {
  if (!activeSession) return;
  const { saveToLocalStorage } = appDeps;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  if (!cs.circuitRounds) cs.circuitRounds = {};
  const groupExs = cs.exercises.filter(e => e.circuitId === circuitId && !isRestItem(e));
  if (groupExs.length === 0) return;
  const series = groupExs[0].circuitSeries || 1;
  const cur = cs.circuitRounds[circuitId] || 1;
  if (cur < series) {
    cs.circuitRounds[circuitId] = cur + 1;
  } else {
    groupExs.forEach(ex => (cs.logs[ex.id] || []).forEach(l => { l.completed = true; }));
    // End of the circuit block includes any trailing rest items; land focus on the next exercise.
    let lastIdx = -1;
    cs.exercises.forEach((it, idx) => { if (it.circuitId === circuitId) lastIdx = idx; });
    let next = lastIdx + 1;
    while (next < cs.exercises.length && isRestItem(cs.exercises[next])) next++;
    cs.activeExerciseIndex = Math.min(next, cs.exercises.length - 1);
    clampFocusToExercise(cs);
  }
  saveActiveSessionToCache();
  if (saveToLocalStorage) saveToLocalStorage();
  renderActiveGroupBoard();
}

// Opens the existing "add exercise to session" dialog (also used by the in-clipboard editor).
function openAddSessionExerciseDialog() {
  const modal = document.getElementById('dialog-add-session-exercise');
  const form = document.getElementById('form-add-session-exercise');
  if (!modal || !form) return;
  form.reset();
  modal.showModal();
}

export function renderActiveGroupBoard() {
  if (!activeSession) return;
  const { state, t, navigateToPath } = appDeps;
  if (!state || !t) return;

  const activeClientId = activeSession.activeClientId || activeSession.participants[0];
  activeSession.activeClientId = activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];

  // Rest is a first-class plan item: migrate any legacy exercise-level rest and keep focus off rests.
  ensureRestItems(activeClientState);
  clampFocusToExercise(activeClientState);

  syncSessionFocusUrl();

  const tabsContainer = document.getElementById('active-session-client-tabs');
  if (tabsContainer) {
    renderActiveUsersList(tabsContainer, activeSession, {
      clients: state.clients,
      activeClientId,
      getInitials,
      getClientDisplayNameHTML,
      navigateToPath
    });
  }

  const alertBanner = document.getElementById('clipboard-client-alert');
  const alertText = document.getElementById('clipboard-client-notes-text');
  const activeClient = state.clients.find(c => c.id === activeClientId);
  if (alertBanner && activeClient) {
    if (activeClient.hasInjury && (activeClient.injury || activeClient.notes)) {
      alertText.textContent = activeClient.injury || activeClient.notes;
      alertBanner.classList.remove('hidden');
    } else {
      alertBanner.classList.add('hidden');
    }
  }

  // Detach any previous editor's document listeners before this render replaces the deck DOM.
  if (editorCleanup) { editorCleanup(); editorCleanup = null; }

  const deckContainer = document.getElementById('active-exercise-scroll-deck');
  if (deckContainer && activeClientState && clipboardEditMode) {
    const persist = () => { saveActiveSessionToCache(); if (appDeps.saveToLocalStorage) appDeps.saveToLocalStorage(); };
    const editClient = state.clients.find(c => c.id === activeClientId);
    editorCleanup = renderClipboardEditor(deckContainer, {
      activeClientState,
      clientName: editClient ? editClient.name : '',
      allExerciseNames: (state.exercises || []).map(e => e.name),
      t, escapeHTML,
      save: persist,
      rerender: renderActiveGroupBoard,
      openAddExercise: openAddSessionExerciseDialog,
      exit: exitClipboardEditMode,
      genId: generateShortUUID
    });
  } else if (deckContainer && activeClientState) {
    renderExerciseDeck(deckContainer, {
      activeSession, activeClientState, activeClientId, state,
      t, escapeHTML, buildSupersetUnits, getExerciseSignalColor,
      logQuickSignal, openFeedbackModal, completeSupersetRound, focusExerciseByIndex,
      saveActiveSessionToCache, saveToLocalStorage: appDeps.saveToLocalStorage,
      onRerender: renderActiveGroupBoard
    });
  }

  const container = document.getElementById('clipboard-logger-container');
  if (!container) return;

  if (!activeClientState || activeClientState.exercises.length === 0) {
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="clipboard-empty-state">
        <h4>${t('no_exercises_injected')}</h4>
        <p>${t('no_exercises_desc')}</p>
      </div>
    `;
    return;
  }

  container.classList.add('hidden');
  container.innerHTML = '';
}

export function setupActiveSession(deps) {
  if (deps) appDeps = { ...appDeps, ...deps };
  const { state, t, navigateToPath, focusSessionsColumn, launchClipboardDirectly } = appDeps;

  const clientTabsBar = document.getElementById('active-session-client-tabs');
  if (clientTabsBar) {
    clientTabsBar.addEventListener('scroll', updateClientTabsFadeState);
  }

  // Leaving the clipboard is handled globally by the title-bar grab handle + swipe-down gesture
  // (setupViewDismiss in app.js), shared with every other view; and the app-name logo also goes home.

  document.getElementById('btn-expand-session').addEventListener('click', (e) => {
    e.stopPropagation();
    const activeClientId = activeSession ? activeSession.activeClientId || activeSession.participants[0] : '';
    const sessionId = activeSession ? activeSession.id || 'session' : 'session';
    if (navigateToPath) navigateToPath(`/session/${sessionId}/client/${activeClientId}`);
  });

  const sessionBar = document.getElementById('active-session-bar');
  if (sessionBar) {
    sessionBar.addEventListener('click', () => {
      if (activeSession) {
        const activeClientId = activeSession.activeClientId || activeSession.participants[0];
        const sessionId = activeSession.id || 'session';
        if (navigateToPath) navigateToPath(`/session/${sessionId}/client/${activeClientId}`);
      } else if (sessionBar.dataset.nextBookingId && launchClipboardDirectly) {
        launchClipboardDirectly(sessionBar.dataset.nextBookingId);
      }
    });
    sessionBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sessionBar.click();
      }
    });
  }

  const sessionMenuBtn = document.getElementById('btn-session-menu');
  const sessionMenu = document.getElementById('session-menu');
  const closeSessionMenu = () => {
    if (sessionMenu) sessionMenu.classList.add('hidden');
    if (sessionMenuBtn) sessionMenuBtn.setAttribute('aria-expanded', 'false');
  };
  if (sessionMenuBtn && sessionMenu) {
    sessionMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !sessionMenu.classList.contains('hidden');
      sessionMenu.classList.toggle('hidden', isOpen);
      sessionMenuBtn.setAttribute('aria-expanded', String(!isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!sessionMenu.classList.contains('hidden') && !e.target.closest('.session-menu-wrap')) {
        closeSessionMenu();
      }
    });
  }

  const btnEditPlan = document.getElementById('btn-edit-plan');
  if (btnEditPlan) {
    btnEditPlan.addEventListener('click', (e) => { e.stopPropagation(); enterClipboardEditMode(); });
  }

  const btnDeleteSession = document.getElementById('btn-delete-session');
  if (btnDeleteSession) {
    btnDeleteSession.addEventListener('click', () => {
      closeSessionMenu();
      if (confirm(t('confirm_cancel'))) {
        cancelWorkoutSession();
      }
    });
  }

  const btnFinishSession = document.getElementById('btn-finish-session');
  if (btnFinishSession) {
    btnFinishSession.addEventListener('click', () => {
      finishWorkoutSession();
    });
  }

  const addExModal = document.getElementById('dialog-add-session-exercise');
  const addExForm = document.getElementById('form-add-session-exercise');
  
  if (addExModal && addExForm) {
    const btnAddExToSession = document.getElementById('btn-add-exercise-to-session');
    if (btnAddExToSession) {
      btnAddExToSession.addEventListener('click', () => {
        addExForm.reset();
        addExModal.showModal();
      });
    }

    const cancelBtn = addExModal.querySelector('.modal-cancel');
    const closeBtn = addExModal.querySelector('.modal-close-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => addExModal.close());
    if (closeBtn) closeBtn.addEventListener('click', () => addExModal.close());

    addExForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const typed = document.getElementById('session-add-select-ex').value.trim();
      const sets = parseInt(document.getElementById('session-add-sets').value);
      const reps = parseInt(document.getElementById('session-add-reps').value);
      const weight = parseFloat(document.getElementById('session-add-weight').value);
      const rest = parseInt(document.getElementById('session-add-rest').value);

      if (!activeSession || !typed || isNaN(sets)) return;

      let baseEx = state.exercises.find(ex => ex.name.toLowerCase() === typed.toLowerCase());
      if (!baseEx) {
        baseEx = { id: generateShortUUID(), name: typed, category: 'Custom', instructions: '' };
      }
      const exId = baseEx.id;

      const activeClientId = activeSession.activeClientId;
      const clientState = activeSession.clientRoutines[activeClientId];

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

      clientState.exercises.push(newEx);

      clientState.logs[exId] = Array.from({ length: sets }, () => ({
        reps: reps,
        weight: weight,
        completed: false,
        note: ''
      }));

      clientState.activeExerciseIndex = clientState.exercises.length - 1;
      
      saveActiveSessionToCache();
      renderActiveGroupBoard();
      addExModal.close();
    });
  }
}

export function cancelWorkoutSession() {
  const { navigateToPath, focusSessionsColumn } = appDeps;
  if (activeSession && activeSession.timerIntervalId) {
    clearInterval(activeSession.timerIntervalId);
  }
  releaseScreenWakeLock();
  activeSession = null;
  localStorage.removeItem('librept_active_session');
  
  renderIdleSessionBar();

  if (navigateToPath) navigateToPath('/clients');
  if (focusSessionsColumn) focusSessionsColumn('today', 'smooth');
}

export function finishWorkoutSession() {
  if (!activeSession) return;
  const { state, t, saveToLocalStorage, navigateToPath } = appDeps;
  if (!state || !t) return;

  let totalSets = 0;
  let completedSets = 0;
  
  activeSession.participants.forEach(pId => {
    const clientState = activeSession.clientRoutines[pId];
    if (clientState) {
      for (const exId in clientState.logs) {
        clientState.logs[exId].forEach(log => {
          totalSets++;
          if (log.completed) completedSets++;
        });
      }
    }
  });

  if (completedSets === 0) {
    if (!confirm(t('alert_no_sets'))) {
      return;
    }
  }

  const sessionDateISO = new Date(activeSession.startTime).toISOString();
  const sessionDuration = activeSession.duration;

  activeSession.participants.forEach(pId => {
    const client = state.clients.find(c => c.id === pId);
    const clientState = activeSession.clientRoutines[pId];
    if (!client || !clientState) return;

    const clientCompletedExercises = [];

    clientState.exercises.forEach(ex => {
      const logsList = clientState.logs[ex.id] || [];
      const clientSetsLogged = [];
      
      logsList.forEach(log => {
        if (log.completed || log.weight > 0) {
          clientSetsLogged.push({
            reps: log.reps,
            weight: log.weight,
            completed: log.completed,
            note: log.note || ''
          });
        }
      });

      if (clientSetsLogged.length > 0) {
        clientCompletedExercises.push({
          id: ex.id,
          name: ex.name,
          sets: clientSetsLogged
        });
      }
    });

    if (clientCompletedExercises.length > 0) {
      const clientLog = {
        id: generateShortUUID(),
        clientId: pId,
        clientName: client.name,
        routineName: clientState.routineName,
        date: sessionDateISO,
        duration: sessionDuration,
        exercises: clientCompletedExercises,
        feedback: (activeSession.feedback || []).filter(f => f.clientId === pId)
      };
      
      state.history.push(clientLog);
    }
  });

  if (saveToLocalStorage) saveToLocalStorage();

  cancelWorkoutSession();

  renderClientsList({ state, t });
  renderRoutinesList({ state, t });
  renderGlobalHistory({ state, t });

  if (navigateToPath) navigateToPath('/history');
}

export function saveActiveSessionToCache() {
  if (!activeSession) return;
  const cacheObj = {
    ...activeSession,
    timerIntervalId: null
  };
  localStorage.setItem('librept_active_session', JSON.stringify(cacheObj));
}

export function recoverActiveSession() {
  const cached = localStorage.getItem('librept_active_session');
  if (!cached) return;

  try {
    const parsed = JSON.parse(cached);
    if (parsed && parsed.startTime) {
      activeSession = parsed;
      activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);

      if (activeSession.booking) {
        activeSession.booking.startDate = new Date(activeSession.booking.startDate);
        activeSession.booking.endDate = new Date(activeSession.booking.endDate);
      }

      const STALE_AFTER_MS = 2 * 60 * 60 * 1000;
      const endTime = activeSession.booking && activeSession.booking.endDate
        ? activeSession.booking.endDate.getTime() : null;
      if (endTime && Date.now() > endTime + STALE_AFTER_MS) {
        activeSession = null;
        localStorage.removeItem('librept_active_session');
        renderIdleSessionBar();
        return;
      }

      const bar = document.getElementById('active-session-bar');
      if (bar) {
        bar.classList.remove('hidden', 'is-idle');
        delete bar.dataset.nextBookingId;
      }
      renderActiveSessionBarLabels();

      startSessionTimer();
      renderActiveGroupBoard();
      requestScreenWakeLock();
    }
  } catch (e) {
    console.error('Error recovering active session cache:', e);
  }
}
