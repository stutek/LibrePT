import { DEFAULT_SESSIONS } from "../../data/index.js";
import { isOfflineCachedActive, resetSyncState } from "../common/applicationHeader.js";
import { loadUnitForEquipment } from "../common/repsAndLoad.js";
import { buildBookingMeta, escapeHTML, getOverlappingBookings } from "../common/utils.js";
import { renderIdleSessionBar, updateSessionBarTimer } from "../session/sessionBar.js";
import {
  focusSessionsColumn,
  getFocusedSessionDay,
  getSessionDayDate,
  renderSessionsTitleBar,
  sessionDayTemporal,
} from "./daySelector.js";
import { renderSessionList } from "./sessionList.js";

export function seedDemoActiveSession({ state }) {
  const sessions = state.sessions || state.bookings || [];
  const booking = sessions.find((b) => b.id === "s01f2e3d");
  if (!booking) return;

  const participantIds = booking.participants.filter((pid) =>
    state.clients.some((c) => c.id === pid),
  );
  if (participantIds.length === 0) return;

  const routine = state.routines.find((r) => r.id === booking.routineId) || state.routines[0];
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
      location: booking.location || "",
      startDate: new Date(now - HOUR).toISOString(),
      endDate: new Date(now + HOUR).toISOString(),
      timeLabel: booking.time,
    },
    feedback: [],
  };

  const completedCounts = [4, 2, 5, 3, 1, 3, 0];

  {
    let i = 0;
    for (const pid of participantIds) {
      const clientState = {
        routineId: routine.id,
        routineName: routine.name,
        activeExerciseIndex: 0,
        exercises: [],
        logs: {},
      };

      for (const item of routine.exercises) {
        const ex = state.exercises.find((e) => e.id === item.id);
        if (!ex) continue;
        clientState.exercises.push({
          id: item.id,
          name: ex.name,
          category: ex.category,
          instructions: ex.instructions,
          setsTargetCount: item.sets,
          repsTarget: item.reps,
          weightTarget: item.weight,
          loadUnit: loadUnitForEquipment(ex.equipment),
          rest: item.rest,
          circuitId: item.circuitId || null,
          circuitTitle: item.circuitTitle || "",
          circuitSeries: item.circuitSeries || 1,
        });
        clientState.logs[item.id] = Array.from({ length: item.sets }, () => ({
          reps: item.reps,
          weight: item.weight,
          completed: false,
          note: "",
        }));
      }

      const doneCount = Math.min(
        completedCounts[i % completedCounts.length],
        clientState.exercises.length,
      );
      {
        let exIdx = 0;
        for (const ex of clientState.exercises) {
          if (exIdx < doneCount) {
            for (const l of clientState.logs[ex.id] || []) {
              l.completed = true;
            }
          }
          exIdx++;
        }
      }
      clientState.activeExerciseIndex = Math.min(
        doneCount,
        Math.max(0, clientState.exercises.length - 1),
      );

      session.clientRoutines[pid] = clientState;
      i++;
    }
  }

  localStorage.setItem("librept_active_session", JSON.stringify(session));
}

export function launchClipboardDirectly({ bookingId, state, startWorkoutSession }) {
  const sessions = state.sessions || state.bookings || [];
  const booking = sessions.find((b) => b.id === bookingId);
  if (!booking) return;

  const overlappingBookings = getOverlappingBookings(booking, sessions);

  const clientRoutinesMap = new Map();
  for (const ob of overlappingBookings) {
    for (const pId of ob.participants) {
      let routineId = ob.routineId;
      if (!routineId || !state.routines.some((r) => r.id === routineId)) {
        routineId = state.routines.length > 0 ? state.routines[0].id : "routine-upper-a";
      }
      if (!clientRoutinesMap.has(pId)) {
        clientRoutinesMap.set(pId, routineId);
      }
    }
  }

  const clientRoutines = Array.from(clientRoutinesMap.entries()).map(([clientId, routineId]) => ({
    clientId,
    routineId,
  }));

  if (clientRoutines.length === 0) return;

  startWorkoutSession(
    clientRoutines,
    buildBookingMeta(overlappingBookings, booking.day, getSessionDayDate),
  );
}

export function setupCalendarBookings({ state, t, saveToLocalStorage, renderSessions }) {
  const syncBtn = document.getElementById("btn-sync-data");
  if (!syncBtn) return;

  syncBtn.addEventListener("click", () => {
    const icon = syncBtn.querySelector("i");
    const btnText = document.getElementById("btn-sync-data-text");
    const status = document.getElementById("sync-status");

    if (icon) icon.classList.add("fa-spin");
    if (btnText) btnText.textContent = t("syncing_calendar");
    if (status) {
      status.textContent = "";
      status.className = "status-msg";
    }
    syncBtn.disabled = true;

    if (isOfflineCachedActive() || !navigator.onLine) {
      if (status) {
        status.textContent = t("offline_cached_desc");
        status.className = "status-msg text-danger";
      }
      if (icon) icon.classList.remove("fa-spin");
      if (btnText) btnText.textContent = t("btn_sync_data");
      syncBtn.disabled = false;
      return;
    }

    setTimeout(() => {
      state.sessions = [...DEFAULT_SESSIONS];
      state.bookings = [...DEFAULT_SESSIONS];

      saveToLocalStorage();
      renderSessions();

      resetSyncState();

      if (icon) icon.classList.remove("fa-spin");
      if (btnText) btnText.textContent = t("btn_sync_data");
      syncBtn.disabled = false;
      if (status) {
        status.textContent = t("calendar_synced");
        status.className = "status-msg text-emerald";
      }
    }, 1200);
  });
}

export function renderSessions({
  state,
  t,
  getActiveSession,
  launchClipboardDirectly,
  saveToLocalStorage,
  rerenderSessions,
  navigateToPath,
  toUrl,
}) {
  const yesterdayContainer = document.getElementById("yesterday-sessions-list");
  const todayContainer = document.getElementById("today-sessions-list");
  const tomorrowContainer = document.getElementById("tomorrow-sessions-list");
  const upcomingContainer = document.getElementById("upcoming-sessions-list");

  if (!todayContainer || !tomorrowContainer) return;

  renderSessionsTitleBar();

  const sessions = state.sessions || state.bookings || [];
  const activeSession = getActiveSession();

  const cardDeps = {
    state,
    t,
    escapeHTML,
    launchClipboardDirectly: (bookingId) => launchClipboardDirectly(bookingId),
    sessionDayTemporal,
    activeId: activeSession ? activeSession.id : null,
    getActiveSession,
    saveToLocalStorage,
    rerenderSessions,
    navigateToPath,
    toUrl,
  };

  const yesterdaySessions = sessions.filter((b) => b.day === "yesterday");
  const todaySessions = sessions.filter((b) => b.day === "today");
  const tomorrowSessions = sessions.filter((b) => b.day === "tomorrow");
  const upcomingSessions = sessions.filter((b) => b.day === "upcoming");

  if (yesterdayContainer) {
    renderSessionList(yesterdayContainer, yesterdaySessions, {
      emptyMessage: "No past sessions.",
      cardDeps,
    });
  }

  renderSessionList(todayContainer, todaySessions, {
    emptyMessage: t("no_bookings_today"),
    cardDeps,
  });

  renderSessionList(tomorrowContainer, tomorrowSessions, {
    emptyMessage: t("no_bookings_today"),
    cardDeps,
  });

  if (upcomingContainer) {
    renderSessionList(upcomingContainer, upcomingSessions, {
      emptyMessage: "No upcoming sessions.",
      cardDeps,
    });
  }

  const focusedDay = getFocusedSessionDay();
  requestAnimationFrame(() => focusSessionsColumn(focusedDay, "auto"));
  renderIdleSessionBar();
  updateSessionBarTimer();
}
