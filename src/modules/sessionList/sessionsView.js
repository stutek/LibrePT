import { modalityOf, primaryMetricOf } from "../../domain/exerciseModality.js";
import { loadUnitForEquipment } from "../../domain/repsAndLoad.js";
import { filterSessions, hasAnyFilter } from "../../domain/sessionFilters.js";
import { sessionCalendarDate } from "../../domain/sessionRecord.js";
import { occurrenceAsSession, sessionsWithSeries } from "../../domain/sessionSeries.js";
import { renderMarkupOnce } from "../common/dom.js";
import { buildSessionMeta, escapeHTML, getOverlappingSessions } from "../common/utils.js";
import { updateSessionBarTimer } from "../session/sessionBar.js";
import { renderSessionCard } from "./sessionCard.js";
import { activeSessionFilters, renderSessionFilterBar } from "./sessionFilterBar.js";
import {
  formatCalendarDayLabel,
  getSessionDayDate,
  renderSessionsTitleBar,
  sessionDayTemporal,
  syncSessionTimelineAfterRender,
} from "./sessionTimeline.js";

export function renderClientsViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-clients"),
    `
<section id="view-clients" class="app-view active">
      <!-- Section B: Today's & Tomorrow's Sessions -->
      <!-- ONE sticky header, two rows (asked 2026-09-11): the view title with the day controls, and
           the filters under them. They were a sticky bar and a separate row below it, which meant
           the filters scrolled away while the thing they filter stayed on screen — and a filter you
           cannot see is the modal's defect arriving by another road.
           The day headers' sticky offset follows automatically: sessionTimeline.js measures this
           element with a ResizeObserver and writes its height into --sessions-header-sticky-top, so
           a second row, and the calendar opening inside it, are accounted for without a number
           being kept in step by hand. -->
      <div class="section-title sessions-title-bar view-titlebar">
        <button class="view-grabber" type="button" aria-label="Open session clipboard"></button>
        <div class="sessions-title-row">
          <h2 class="view-title-label" id="sessions-view-title">Sessions</h2>
          <!-- Populated by sessionTimeline.js (renderSessionsDatePicker) — the Today and expand
               controls are that module's own concern, not shell markup. -->
          <div class="sessions-date-picker" id="sessions-date-picker"></div>
        </div>

        <!-- Filled by sessionFilterBar.js (TODO §45.6): the date/client/location chips and, when it
             is open, the range calendar. Its own module's markup, like the day controls above. -->
        <div class="sessions-filter-bar" id="sessions-filter-bar"></div>
      </div>

      <!-- One continuous, time-ordered scroll: sessions render grouped under sticky per-day
           headers instead of fixed yesterday/today/tomorrow/upcoming columns (TODO §7.3 item 8). -->
      <div class="sessions-timeline mb-6" id="sessions-categories-grid" role="region" aria-label="Sessions"></div>

      <!-- Floating "Create Session" button: stays visible while scrolling the sessions list -->
      <button id="btn-create-session" class="btn primary-btn floating-action-btn" aria-label="Create Session" title="Create Session">
        <i class="fa-solid fa-plus"></i> <span data-i18n="btn_create_session">Create Session</span>
      </button>
    </section>
`,
  );
}

function buildClientRoutineState(routine, state) {
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
  return clientState;
}

// Marks the first `doneCount` exercises' logged sets as completed, and points the active-exercise
// pointer at wherever the demo trainer would have "just gotten to."
function markDemoProgress(clientState, doneCount) {
  let exIdx = 0;
  for (const ex of clientState.exercises) {
    if (exIdx < doneCount) {
      for (const l of clientState.logs[ex.id] || []) {
        l.completed = true;
      }
    }
    exIdx++;
  }
  clientState.activeExerciseIndex = Math.min(
    doneCount,
    Math.max(0, clientState.exercises.length - 1),
  );
}

export function seedDemoActiveSession({ state }) {
  const sessions = state.sessions || [];
  const scheduledSession = sessions.find((s) => s.id === "s01f2e3d");
  if (!scheduledSession) return;

  const participantIds = scheduledSession.participants.filter((pid) =>
    state.clients.some((c) => c.id === pid),
  );
  if (participantIds.length === 0) return;

  const routine =
    state.routines.find((r) => r.id === scheduledSession.routineId) || state.routines[0];
  if (!routine) return;

  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const startTime = now - FIVE_MIN;

  const session = {
    id: scheduledSession.id,
    startTime,
    duration: 300,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    sourceSession: {
      id: scheduledSession.id,
      titles: [scheduledSession.title],
      day: scheduledSession.day,
      location: scheduledSession.location || "",
      startDate: new Date(startTime).toISOString(),
      endDate: new Date(now + TWO_HOURS).toISOString(),
      timeLabel: scheduledSession.time,
    },
    feedback: [],
  };

  const completedCounts = [4, 2, 5, 3, 1, 3, 0];

  let i = 0;
  for (const pid of participantIds) {
    const clientState = buildClientRoutineState(routine, state);
    const doneCount = Math.min(
      completedCounts[i % completedCounts.length],
      clientState.exercises.length,
    );
    markDemoProgress(clientState, doneCount);
    session.clientRoutines[pid] = clientState;
    i++;
  }

  localStorage.setItem("librept_active_session", JSON.stringify(session));
}

export function launchClipboardDirectly({ sessionId, state, startWorkoutSession }, options = {}) {
  // The same set the board drew, so an evening that is still only a rule can be opened from a deep
  // link as well as from a tap — overlap merging then sees the derived evenings too, which is what
  // keeps a repeating group and a one-off rehab session in the same clipboard.
  const sessions = visibleSessions(state);
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;

  const overlappingSessions = getOverlappingSessions(session, sessions);

  const clientRoutinesMap = new Map();
  for (const os of overlappingSessions) {
    for (const pId of os.participants) {
      let routineId = os.routineId;
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
    buildSessionMeta(overlappingSessions, session.day, getSessionDayDate),
    options,
  );
}

function compareByStartDate(a, b) {
  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
}

// How far ahead the board draws evenings a series still owes. An open-ended rule is infinite, so
// some horizon is unavoidable; eight weeks is what a trainer plans within, and beyond it the board
// would be a list of identical Tuesdays nobody scrolls to. Behind, the window reaches back far
// enough to keep the past week's evenings on the board beside the ones that were actually run.
const SERIES_HORIZON_DAYS = 56;
const SERIES_LOOKBACK_DAYS = 7;

function seriesWindow(now = new Date()) {
  const day = (offset) => {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, "0")}`;
  };
  return { from: day(-SERIES_LOOKBACK_DAYS), to: day(SERIES_HORIZON_DAYS) };
}

/** Every evening the board should show: the stored sessions, plus what each series still owes.
 *
 * Exported because the clipboard launch has to resolve the same set — a trainer tapping an evening
 * that only exists as a rule must reach the same thing they are looking at.
 */
export function visibleSessions(state) {
  return sessionsWithSeries(state.sessions || [], state.sessionSeries || [], seriesWindow());
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
  focusSessionsColumn,
  newRecordId,
}) {
  const container = document.getElementById("sessions-categories-grid");
  if (!container) return;

  renderSessionsTitleBar();
  renderSessionFilterBar();

  // Filtered AFTER the series are resolved, never before: an evening that exists only as a repeating
  // rule is a session on this board like any other, and filtering the stored list would quietly hide
  // exactly the ones a trainer has not touched yet.
  const sessions = filterSessions(visibleSessions(state), activeSessionFilters(), {
    dateOf: sessionCalendarDate,
  });
  const activeSession = getActiveSession();

  // An evening that exists only as a rule becomes a RECORD the moment the trainer acts on it
  // (TODO §35.3a). Done here, at the board, because this is where every tap on a derived evening
  // starts — the alternative is every downstream lookup learning what a series is.
  const store = (sessionId) => {
    if ((state.sessions || []).some((session) => session.id === sessionId)) return sessionId;
    const derived = sessions.find((session) => session.id === sessionId && session.fromSeries);
    if (!derived) return sessionId;
    const stored = occurrenceAsSession(derived, newRecordId ? newRecordId() : derived.id);
    state.sessions = [...(state.sessions || []), stored];
    saveToLocalStorage?.();
    return stored.id;
  };

  const cardDeps = {
    state,
    t,
    escapeHTML,
    launchClipboardDirectly: (sessionId) => launchClipboardDirectly(store(sessionId)),
    sessionDayTemporal,
    activeId: activeSession ? activeSession.id : null,
    getActiveSession,
    saveToLocalStorage,
    rerenderSessions,
    navigateToPath,
    urlFor,
    // Given to the card rather than hidden inside `urlFor`: a URL built while RENDERING would then
    // silently write a record for every evening on the board. Conversion belongs to the tap.
    storeSession: store,
  };

  container.innerHTML = "";

  if (sessions.length === 0) {
    // An empty board that does not say WHY is the filter defect in a different costume: the trainer
    // reads "no sessions" and starts looking for the data, not for the chip they left on.
    const empty = hasAnyFilter(activeSessionFilters())
      ? t("no_sessions_for_filters")
      : t("no_sessions_scheduled");
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px;">${escapeHTML(empty)}</div>`;
  } else {
    // One continuous, strictly time-ordered pass — grouped under a sticky per-day header rather
    // than split into four fixed yesterday/today/tomorrow/upcoming containers (TODO §7.3 item 8).
    const sorted = [...sessions].sort(compareByStartDate);
    let currentKey = null;
    let currentList = null;
    const groupMeta = []; // [{ key, group, footer }], in order — filled in with next-day info below
    for (const session of sorted) {
      const key = sessionCalendarDate(session);
      if (key !== currentKey) {
        currentKey = key;
        const { weekday, date, isToday } = formatCalendarDayLabel(key);

        const group = document.createElement("div");
        group.className = "sessions-day-group";
        group.dataset.date = key;

        // Sticks to the top of the viewport while this group's cards are scrolled past it, the
        // same as it always has.
        const header = document.createElement("div");
        header.className = "sessions-day-group-header";
        header.innerHTML = `
          <span class="sessions-day-group-weekday">${escapeHTML(weekday)}</span>
          <span class="sessions-day-group-date">${escapeHTML(date)}</span>
          ${isToday ? `<span class="sessions-day-group-today-tag">${escapeHTML(t("today"))}</span>` : ""}
        `;
        group.appendChild(header);

        currentList = document.createElement("div");
        currentList.className = "stack-list";
        group.appendChild(currentList);

        // Sticks to the BOTTOM of the viewport while this group's cards are still below it — but
        // previews the NEXT day, not this one: mirroring the SAME day here just prints it twice
        // (once at each edge) with nothing between them to tell a genuine duplicate group from a
        // mirrored pair. Showing what's coming up next is what a bottom-edge marker is actually
        // for while scrolling through a long day. Content + click target filled in below, once
        // every group (and therefore each one's successor) exists.
        const footer = document.createElement("div");
        footer.className = "sessions-day-group-footer";
        group.appendChild(footer);

        if (focusSessionsColumn) {
          header.addEventListener("click", () => focusSessionsColumn(key, "smooth"));
        }

        container.appendChild(group);
        groupMeta.push({ key, group, footer });
      }
      renderSessionCard(session, currentList, cardDeps);
    }

    // Second pass: each footer shows its SUCCESSOR's day, now that every group's key is known. The
    // last group has no successor to preview and gets no footer at all — there is nothing left to
    // scroll toward.
    //
    // Deliberately NOT pruned by "does this group's own height already exceed the viewport": that
    // was measured via offsetHeight right here at render time, which reads 0 for every element
    // whose ancestor .app-view isn't .active yet — true mid-navigation (e.g. creating a session
    // navigates straight into its clipboard, then back out to the dashboard, calling
    // renderSessions() while the view is still transitioning). A too-short group measured that way
    // got its footer permanently removed even though its real, laid-out height was well over the
    // viewport — the bug this comment used to rationalize away. observeGroupFooterVisibility
    // (sessionTimeline.js) already hides a footer whenever its previewed day's own header is
    // genuinely on screen, which is the actual "would this be redundant" question — a group short
    // enough that its successor's header is already visible gets exactly the same suppressed
    // result, just decided dynamically against real layout instead of a fragile one-shot measurement.
    for (let i = 0; i < groupMeta.length; i++) {
      const { footer } = groupMeta[i];
      const next = groupMeta[i + 1];
      if (!next) {
        footer.remove();
        continue;
      }
      const { weekday, date, isToday } = formatCalendarDayLabel(next.key);
      footer.innerHTML = `
        <span class="sessions-day-group-weekday">${escapeHTML(weekday)}</span>
        <span class="sessions-day-group-date">${escapeHTML(date)}</span>
        ${isToday ? `<span class="sessions-day-group-today-tag">${escapeHTML(t("today"))}</span>` : ""}
      `;
      if (focusSessionsColumn) {
        footer.addEventListener("click", () => focusSessionsColumn(next.key, "smooth"));
      }
    }
  }

  syncSessionTimelineAfterRender();
  updateSessionBarTimer();
}
