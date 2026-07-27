import { DEFAULT_SESSIONS } from "../../data/index.js";
import { isOfflineCachedActive, resetSyncState } from "../common/applicationHeader.js";
import { modalityOf, primaryMetricOf } from "../common/exerciseModality.js";
import { loadUnitForEquipment } from "../common/repsAndLoad.js";
import { buildBookingMeta, escapeHTML, getOverlappingBookings } from "../common/utils.js";
import { renderIdleSessionBar, updateSessionBarTimer } from "../session/sessionBar.js";
import { renderSessionCard } from "./sessionCard.js";
import {
  formatCalendarDayLabel,
  getSessionDayDate,
  renderSessionsTitleBar,
  sessionDayTemporal,
  syncSessionTimelineAfterRender,
} from "./sessionTimeline.js";

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
  const FIVE_MIN = 5 * 60 * 1000;
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const startTime = now - FIVE_MIN;

  const session = {
    id: booking.id,
    startTime,
    duration: 300,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    booking: {
      id: booking.id,
      titles: [booking.title],
      day: booking.day,
      location: booking.location || "",
      startDate: new Date(startTime).toISOString(),
      endDate: new Date(now + TWO_HOURS).toISOString(),
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

      for (const item of routine.exercises || []) {
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
          modality: modalityOf(ex),
          metric: primaryMetricOf(ex),
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

// Local calendar date (not UTC) a session's `startDate` falls on — the grouping key for the
// timeline. `startDate` is built from a local Date at seed/migration time (src/data/sessions.js,
// migrationSteps.js), so reading it back through local getters keeps a late-evening session on the
// day the trainer actually thinks of it as.
function calendarDayKey(session) {
  const d = new Date(session.startDate);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function compareByStartDate(a, b) {
  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
}

export function renderSessions({
  state,
  t,
  getActiveSession,
  launchClipboardDirectly,
  saveToLocalStorage,
  rerenderSessions,
  navigateToPath,
  urlFor,
}) {
  const container = document.getElementById("sessions-categories-grid");
  if (!container) return;

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
    urlFor,
  };

  container.innerHTML = "";

  if (sessions.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px;">${t("no_bookings_today")}</div>`;
  } else {
    // One continuous, strictly time-ordered pass — grouped under a sticky per-day header rather
    // than split into four fixed yesterday/today/tomorrow/upcoming containers (TODO §7.3 item 8).
    const sorted = [...sessions].sort(compareByStartDate);
    let currentKey = null;
    let currentList = null;
    for (const session of sorted) {
      const key = calendarDayKey(session);
      if (key !== currentKey) {
        currentKey = key;
        const { weekday, date, temporal, isToday } = formatCalendarDayLabel(key);

        const group = document.createElement("div");
        group.className = "sessions-day-group";
        group.dataset.date = key;

        const header = document.createElement("div");
        header.className = `sessions-day-group-header${temporal !== "today" ? ` is-${temporal}` : ""}`;
        header.innerHTML = `
          <span class="sessions-day-group-weekday">${escapeHTML(weekday)}</span>
          <span class="sessions-day-group-date">${escapeHTML(date)}</span>
          ${isToday ? `<span class="sessions-day-group-today-tag">${escapeHTML(t("today"))}</span>` : ""}
        `;
        group.appendChild(header);

        currentList = document.createElement("div");
        currentList.className = "stack-list";
        group.appendChild(currentList);

        container.appendChild(group);
      }
      renderSessionCard(session, currentList, cardDeps);
    }
  }

  syncSessionTimelineAfterRender();
  renderIdleSessionBar();
  updateSessionBarTimer();
}
