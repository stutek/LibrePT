// src/modules/sessionList/sessionsView.js — renders the Sessions dashboard.
// Modular view renderer. It merges and sorts all sessions, then groups them into the per-day
// sections of the continuous timeline. It owns the markup of its `<section id="view-clients">` shell.

import { libraryExercises } from "../../data/exerciseLibrary.js";
import { openProgramsOfSessions } from "../../data/trainingRecords.js";
import { assignLanes } from "../../domain/overlapLanes.js";
import { filterSessions, hasAnyFilter } from "../../domain/sessionFilters.js";
import { buildClientStateFromRoutine } from "../../domain/sessionPlanFactory.js";
import { runsInOneClipboard, sessionCalendarDate } from "../../domain/sessionRecord.js";
import {
  occurrenceAsSession,
  sessionsWithSeries,
  storedOccurrenceFor,
} from "../../domain/sessionSeries.js";
import { parseTimeRange } from "../../domain/timeRange.js";
import { renderMarkupOnce } from "../common/dom.js";
import { buildSessionMeta, escapeHTML, getOverlappingSessions } from "../common/utils.js";
import { updateSessionBarTimer } from "../session/sessionBar.js";
import { isRunningOn, renderSessionCard } from "./sessionCard.js";
import { activeSessionFilters, renderSessionFilterBar } from "./sessionFilterBar.js";
import {
  formatCalendarDayLabel,
  getSessionDayDate,
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
        <button class="view-grabber" type="button" data-i18n-label="view_grabber_clipboard" aria-label="Open session clipboard"></button>
        <div class="sessions-title-row">
          <h2 class="view-title-label" id="sessions-view-title">Sessions</h2>
          <!-- Populated by sessionTimeline.js (renderSessionsDatePicker) — the Today and expand
               controls are that module's own concern, not shell markup. -->
          <div class="sessions-date-picker" id="sessions-date-picker"></div>
        </div>

        <!-- The filter chips. A row of their own on a phone and beside the title above 600px, which
             is a rule the CSS states by flipping the HEADER between column and row. Measured, after
             an attempt with the CSS order property put the chips above the title unexplainably.
             (No backticks in this comment: the markup is a template literal.) -->
        <div class="sessions-filter-bar" id="sessions-filter-bar"></div>

        <!-- The range calendar, when it is open. Below the controls rather than among them: it is a
             panel, not a button, and it opens inside this sticky header so the list scrolls under
             it. Filled by sessionFilterBar.js. -->
        <div id="sessions-filter-calendar-slot"></div>
      </div>

      <!-- One continuous, time-ordered scroll: sessions render grouped under sticky per-day
           headers instead of fixed yesterday/today/tomorrow/upcoming columns. -->
      <div class="sessions-timeline mb-6" id="sessions-categories-grid" role="region" data-i18n-label="sessions_schedule" aria-label="Sessions"></div>

      <!-- Floating "Create Session" button: stays visible while scrolling the sessions list -->
      <button id="btn-create-session" class="btn primary-btn floating-action-btn">
        <i class="fa-solid fa-plus"></i> <span data-i18n="btn_create_session">Create Session</span>
      </button>
    </section>
`,
  );
}

// The same plan a real session builds from this routine. The demo session is already under way, so
// its card in focus is open rather than collapsed as a fresh plan starts.
function buildClientRoutineState(routine, state) {
  const clientState = buildClientStateFromRoutine({
    routineId: routine.id,
    routines: [routine],
    exercises: libraryExercises(state),
    emptyPlanName: routine.name,
  });
  clientState.deckAllCollapsed = false;
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

  // The key a session in progress was kept under before schema 6 (controllers/sessionPrograms.js).
  // Written on purpose, and only on a boot under the test switch: the one-time import at start-up
  // turns it into programs, so every such boot exercises the path a trainer mid-session takes on the
  // day the update lands.
  localStorage.setItem("librept_active_session", JSON.stringify(session));
}

export function launchClipboardDirectly(
  { sessionId, state, startWorkoutSession, activeSession, resumeRunning, openSetup },
  options = {},
) {
  if (resumeRunning && isRunningOn(activeSession, sessionId)) {
    resumeRunning();
    return;
  }
  // The same set the board drew, so an evening that is still only a rule can be opened from a deep
  // link as well as from a tap — overlap merging then sees the derived evenings too, which is what
  // keeps a repeating group and a one-off rehab session in the same clipboard.
  const sessions = visibleSessions(state);
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;

  const overlappingSessions = getOverlappingSessions(session, sessions).filter((other) =>
    runsInOneClipboard(session, other),
  );

  const clientRoutinesMap = new Map();
  // Which booked session each client belongs to, kept on the clipboard's `sourceSession` so it
  // survives the active-session cache and a reload. The title bar and the participant tabs pair
  // their colour dots from it. A client booked into two overlapping sessions belongs to the first.
  const clientSessions = {};
  const stored = openProgramsOfSessions(
    state,
    overlappingSessions.map((os) => os.id),
  );
  for (const os of overlappingSessions) {
    for (const pId of os.participants) {
      // As stored, even when no routine has that id: "empty_plan" is the trainer's choice of an
      // empty plan, and buildClientStateFromRoutine makes one of it. Substituting the library's
      // first routine put a programme nobody chose on the clipboard. A client whose plan in this
      // session is stored keeps that plan's routine: the row holds one routine for everybody, and
      // the form writes a client's own choice into their plan.
      const own = stored.find((program) => program.sessionId === os.id && program.clientId === pId);
      const routineId = own ? own.routineId || "" : os.routineId || "";
      if (!clientRoutinesMap.has(pId)) {
        clientRoutinesMap.set(pId, routineId);
        clientSessions[pId] = os.id;
      }
    }
  }

  const clientRoutines = Array.from(clientRoutinesMap.entries()).map(([clientId, routineId]) => ({
    clientId,
    routineId,
  }));

  // Nobody to train: a drop-in slot waiting for its first walk-in. The tap did nothing at all, and a
  // trainer who wants to add the client who just arrived tapped again. It opens the session's form,
  // where a client is added — what the card's pencil does.
  if (clientRoutines.length === 0) {
    openSetup?.(sessionId);
    return;
  }

  startWorkoutSession(
    clientRoutines,
    {
      ...buildSessionMeta(overlappingSessions, session.day, getSessionDayDate),
      clientSessions,
    },
    options,
  );
}

// Three overlapping sessions in three columns leave each card about 85 px of text at 390 px, less
// than the time badge alone, so from this many lanes up the cluster stacks full width instead and
// each card names the times it overlaps.
const MAX_SIDE_BY_SIDE_LANES = 2;

/** Draws one day's cards. A session that overlaps nothing is a plain full-width card, as before.
 * Sessions that overlap form a block: side by side in their lanes, each pushed down by how many
 * minutes after the block's first start it begins (the CSS turns minutes into pixels and caps
 * them), so the later start visibly starts lower. */
function renderDayCards(list, daySessions, cardDeps, t) {
  const intervals = daySessions.map((session) => {
    const range = parseTimeRange(session.time);
    const start = range ? range.start : 0;
    return { session, start, end: range ? range.end : start };
  });
  const placed = assignLanes(intervals);
  for (const clusterIndex of new Set(placed.map((p) => p.cluster))) {
    const members = placed.filter((p) => p.cluster === clusterIndex);
    if (members.length === 1) {
      renderSessionCard(members[0].item.session, list, cardDeps);
      continue;
    }
    const block = document.createElement("div");
    block.className = "sessions-overlap-block";
    const laneCount = members[0].laneCount;
    const sideBySide = laneCount <= MAX_SIDE_BY_SIDE_LANES;
    block.classList.add(sideBySide ? "side-by-side" : "stacked");
    block.style.setProperty("--lane-count", String(laneCount));
    const firstStart = Math.min(...members.map((m) => m.item.start));
    for (const member of members) {
      const card = renderSessionCard(member.item.session, block, cardDeps);
      card.style.setProperty("--lane", String(member.lane));
      card.style.setProperty("--start-offset", String(member.item.start - firstStart));
      if (!sideBySide) addOverlapNote(card, member, members, t);
    }
    list.appendChild(block);
  }
}

function addOverlapNote(card, member, members, t) {
  const others = members
    .filter((m) => m !== member && m.item.start < member.item.end && member.item.start < m.item.end)
    .map((m) => m.item.session.time);
  const note = document.createElement("div");
  note.className = "session-overlap-note";
  note.textContent = t("session_overlaps_with").replace("{times}", others.join(", "));
  card.querySelector(".session-card-info")?.appendChild(note);
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

  // Resolved ONCE and used twice: the filter row offers what is on the board, and the board shows
  // what survives the filters. Asking for it separately expanded every repeating series a second
  // time on every render.
  const onBoard = visibleSessions(state);
  renderSessionFilterBar(onBoard);

  // Filtered AFTER the series are resolved, never before: an evening that exists only as a repeating
  // rule is a session on this board like any other, and filtering the stored list would quietly hide
  // exactly the ones a trainer has not touched yet.
  const sessions = filterSessions(onBoard, activeSessionFilters(), {
    dateOf: sessionCalendarDate,
  });

  // An evening that exists only as a rule becomes a RECORD the moment the trainer acts on it.
  // Done here, at the board, because this is where every tap on a derived evening
  // starts — the alternative is every downstream lookup learning what a series is.
  const store = (sessionId) => {
    const already = storedOccurrenceFor(state.sessions, sessionId);
    if (already) return already.id;
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
    // No inline padding needed: .card already sets padding: 16px (index.css).
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">${escapeHTML(empty)}</div>`;
  } else {
    // One continuous, strictly time-ordered pass — grouped under a sticky per-day header rather
    // than split into four fixed yesterday/today/tomorrow/upcoming containers.
    const sorted = [...sessions].sort(compareByStartDate);
    const byDay = new Map();
    for (const session of sorted) {
      const dayKey = sessionCalendarDate(session);
      byDay.set(dayKey, [...(byDay.get(dayKey) || []), session]);
    }
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
        renderDayCards(currentList, byDay.get(key), cardDeps, t);
      }
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
