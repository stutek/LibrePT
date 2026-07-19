// src/views/sessionsView.js - Domain module for sessions dashboard, calendar sync, and clipboard launching
import { DEFAULT_SESSIONS } from '../data/index.js';
import { renderSessionList } from '../components/sessionList.js';
import { renderSessionsTitleBar, focusSessionsColumn, getFocusedSessionDay, sessionDayTemporal, getSessionDayDate } from '../components/daySelector.js';
import { renderIdleSessionBar, updateSessionBarTimer } from '../components/sessionBar.js';
import { getOverlappingBookings, buildBookingMeta, escapeHTML, formatDuration, formatSignedDuration } from '../helper/utils.js';
import { resetSyncState } from '../components/applicationHeader.js';

export function seedDemoActiveSession({ state }) {
  const booking = (state.bookings || []).find(b => b.id === 's01f2e3d');
  if (!booking) return;

  const participantIds = booking.participants.filter(pid => state.clients.some(c => c.id === pid));
  if (participantIds.length === 0) return;

  const routine = state.routines.find(r => r.id === booking.routineId) || state.routines[0];
  if (!routine) return;

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const startTime = now - HOUR;

  const session = {
    id: booking.id,
    startTime,
    duration: Math.floor((now - startTime) / 1000),
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    booking: {
      id: booking.id,
      titles: [booking.title],
      day: booking.day,
      location: booking.location || '',
      startDate: new Date(now - HOUR).toISOString(),
      endDate: new Date(now + HOUR).toISOString(),
      timeLabel: booking.time
    },
    feedback: []
  };

  const completedCounts = [4, 2, 5, 3, 1, 3, 0];

  participantIds.forEach((pid, i) => {
    const clientState = {
      routineId: routine.id,
      routineName: routine.name,
      activeExerciseIndex: 0,
      exercises: [],
      logs: {}
    };

    routine.exercises.forEach(item => {
      const ex = state.exercises.find(e => e.id === item.id);
      if (!ex) return;
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
    });

    const doneCount = Math.min(completedCounts[i % completedCounts.length], clientState.exercises.length);
    clientState.exercises.forEach((ex, exIdx) => {
      if (exIdx < doneCount) {
        (clientState.logs[ex.id] || []).forEach(l => { l.completed = true; });
      }
    });
    clientState.activeExerciseIndex = Math.min(doneCount, Math.max(0, clientState.exercises.length - 1));

    session.clientRoutines[pid] = clientState;
  });

  localStorage.setItem('librept_active_session', JSON.stringify(session));
}

export function launchClipboardDirectly({ bookingId, state, startWorkoutSession }) {
  if (!state.bookings) return;
  const booking = state.bookings.find(b => b.id === bookingId);
  if (!booking) return;

  const overlappingBookings = getOverlappingBookings(booking, state.bookings);

  const clientRoutinesMap = new Map();
  overlappingBookings.forEach(ob => {
    ob.participants.forEach(pId => {
      let routineId = ob.routineId;
      if (!routineId || !state.routines.some(r => r.id === routineId)) {
        routineId = state.routines.length > 0 ? state.routines[0].id : 'routine-upper-a';
      }
      if (!clientRoutinesMap.has(pId)) {
        clientRoutinesMap.set(pId, routineId);
      }
    });
  });

  const clientRoutines = Array.from(clientRoutinesMap.entries()).map(([clientId, routineId]) => ({
    clientId,
    routineId
  }));

  if (clientRoutines.length === 0) return;

  startWorkoutSession(clientRoutines, buildBookingMeta(overlappingBookings, booking.day, getSessionDayDate));
}

export function setupCalendarBookings({ state, t, saveToLocalStorage, renderSessions }) {
  const syncBtn = document.getElementById('btn-sync-data');
  if (!syncBtn) return;

  syncBtn.addEventListener('click', () => {
    const icon = syncBtn.querySelector('i');
    const btnText = document.getElementById('btn-sync-data-text');
    const status = document.getElementById('sync-status');

    if (icon) icon.classList.add('fa-spin');
    if (btnText) btnText.textContent = t('syncing_calendar');
    if (status) { status.textContent = ''; status.className = 'status-msg'; }
    syncBtn.disabled = true;

    setTimeout(() => {
      state.bookings = [...DEFAULT_SESSIONS];

      saveToLocalStorage();
      renderSessions();

      resetSyncState();

      if (icon) icon.classList.remove('fa-spin');
      if (btnText) btnText.textContent = t('btn_sync_data');
      syncBtn.disabled = false;
      if (status) { status.textContent = t('calendar_synced'); status.className = 'status-msg text-emerald'; }
    }, 1200);
  });
}

export function renderSessions({ state, t, getActiveSession, launchClipboardDirectly }) {
  const yesterdayContainer = document.getElementById('yesterday-sessions-list');
  const todayContainer = document.getElementById('today-sessions-list');
  const tomorrowContainer = document.getElementById('tomorrow-sessions-list');
  const upcomingContainer = document.getElementById('upcoming-sessions-list');
  
  if (!todayContainer || !tomorrowContainer) return;
  
  renderSessionsTitleBar();
  
  const bookings = state.bookings || [];
  const activeSession = getActiveSession();
  
  const cardDeps = { 
    state, 
    t, 
    escapeHTML, 
    launchClipboardDirectly: (bookingId) => launchClipboardDirectly(bookingId), 
    sessionDayTemporal, 
    activeId: activeSession ? activeSession.id : null,
    getActiveSession,
    formatDuration,
    formatSignedDuration
  };

  const yesterdaySessions = bookings.filter(b => b.day === 'yesterday');
  const todaySessions = bookings.filter(b => b.day === 'today');
  const tomorrowSessions = bookings.filter(b => b.day === 'tomorrow');
  const upcomingSessions = bookings.filter(b => b.day === 'upcoming');

  if (yesterdayContainer) {
    renderSessionList(yesterdayContainer, yesterdaySessions, {
      emptyMessage: 'No past sessions.',
      cardDeps
    });
  }

  renderSessionList(todayContainer, todaySessions, {
    emptyMessage: t('no_bookings_today'),
    cardDeps
  });

  renderSessionList(tomorrowContainer, tomorrowSessions, {
    emptyMessage: t('no_bookings_today'),
    cardDeps
  });

  if (upcomingContainer) {
    renderSessionList(upcomingContainer, upcomingSessions, {
      emptyMessage: 'No upcoming sessions.',
      cardDeps
    });
  }

  requestAnimationFrame(() => focusSessionsColumn(getFocusedSessionDay(), 'auto'));
  renderIdleSessionBar();
  updateSessionBarTimer();
}
