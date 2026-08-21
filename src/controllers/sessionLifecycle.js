// src/controllers/sessionLifecycle.js — how a session begins and how it ends. Single responsibility:
// the whole-session transitions — staging a plan, tapping Start, recovering one after a reload,
// cancelling, deleting the slot behind it, and completing it into history. Injected dependencies:
// `state`, `t`, `navigateToPath`, `saveToLocalStorage`, `focusSessionsColumn`, `renderSessions` and
// `resolveRoute` arrive through activeSessionStore.js.
//
// Everything here writes to the SAME single `activeSession` slot, which is why these transitions
// belong together: opening one session is inseparable from discarding whatever occupied the slot.

import { newRecordId } from "../data/recordId.js";
import { clearActiveSessionCache, readActiveSessionCache } from "../data/sessionCache.js";
import { isCachedSessionStale } from "../domain/sessionClock.js";
import { buildSessionHistoryRecord } from "../domain/sessionHistoryRecord.js";
import {
  buildClientStateFromHistoryLog,
  buildClientStateFromRoutine,
} from "../domain/sessionPlanFactory.js";
import { sessionBelongsToSlot } from "../domain/sessionRecord.js";
import { renderClientsList } from "../modules/clients/clientsView.js";
import { renderActiveSessionBoard } from "../modules/clipboard/activeSessionBoard.js";
import { markEditorRow, setClipboardEditModeFlag } from "../modules/clipboard/editModeState.js";
import { clearAllTimers, restoreSessionTimers } from "../modules/clipboard/exerciseAndRestTimer.js";
import { renderNotificationArea } from "../modules/common/notificationArea.js";
import {
  releaseScreenWakeLock,
  requestScreenWakeLock as requestScreenWakeLockHelper,
} from "../modules/common/wakeLock.js";
import { renderGlobalHistory } from "../modules/history/historyView.js";
import { renderRoutinesList } from "../modules/plans/plansView.js";
import { renderClipboardBar } from "../modules/session/sessionBar.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import {
  getActiveSession,
  getAppDeps,
  mergeAppDeps,
  setActiveSession,
} from "./activeSessionStore.js";
import { offerScheduleAdjustment } from "./sessionScheduleAdjustment.js";
import { startSessionTimer } from "./sessionTimers.js";

function requestScreenWakeLock() {
  return requestScreenWakeLockHelper(getActiveSession);
}

export function openSessionFromHistory(log) {
  const { state, t, navigateToPath } = getAppDeps();
  if (!state || !t) return;
  clearAllTimers(); // fresh session — never inherit a previous session's timers

  const clientState = buildClientStateFromHistoryLog(log, state.exercises);

  setActiveSession({
    id: log.id,
    startTime: new Date(log.date).getTime(),
    duration: log.duration || 0,
    participants: [log.clientId],
    clientRoutines: {
      [log.clientId]: clientState,
    },
    activeClientId: log.clientId,
    feedback: log.feedback || [],
    // Reopening a draft names it outright, so the sync edits THIS record even when the client has
    // several open (upsertPlanningRecord's draftId).
    planningDraftIds: log.isPlanning ? { [log.clientId]: log.id } : {},
    sourceSession: log.isPlanning
      ? {
          id: `plan-${log.id}`,
          isPlanning: true,
          titles: [log.title || t("planned_program") || "Planned Program"],
          timeLabel: t("date_unknown") || "Date Unknown",
          location: "",
        }
      : null,
  });

  setClipboardEditModeFlag(!!log.isPlanning);

  saveActiveSessionToCache();
  requestScreenWakeLock();

  renderClipboardBar();
  startSessionTimer();

  if (navigateToPath) {
    navigateToPath(`/session/${log.id}/client/${log.clientId}`);
  }
}

export function startWorkoutSession(clientRoutines, sessionMeta = null, deps = {}, options = {}) {
  mergeAppDeps(deps);
  const { navigate = true } = options;
  const { state, navigateToPath, t } = getAppDeps();
  if (!state) return;
  clearAllTimers(); // fresh session — never inherit a previous session's timers

  const participantIds = clientRoutines.map((cr) => cr.clientId);
  const sessionId = sessionMeta ? sessionMeta.id : newRecordId();

  const session = {
    id: sessionId,
    started: false,
    startTime: null,
    duration: 0,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    sourceSession: sessionMeta,
  };
  setActiveSession(session);

  for (const cr of clientRoutines) {
    session.clientRoutines[cr.clientId] = buildClientStateFromRoutine({
      routineId: cr.routineId,
      routines: state.routines,
      exercises: state.exercises,
      emptyPlanName: t("custom_empty_plan") || "Custom / Empty Plan",
    });
  }

  setClipboardEditModeFlag(!!sessionMeta?.isPlanning);

  saveActiveSessionToCache();

  const sId = session.id || newRecordId();
  if (navigate && navigateToPath) {
    navigateToPath(`/session/${sId}/client/${session.activeClientId}`);
  }
}

// Explicit trainer action, mirroring finishWorkoutSession: opening the clipboard only stages the
// session (plan visible, nothing running yet) — the timer, duration, and "live" status only begin
// once the trainer taps Start, same way a session only ends when they tap Complete.
export function beginWorkoutSession() {
  const activeSession = getActiveSession();
  if (!activeSession || activeSession.started) return;
  activeSession.started = true;
  activeSession.startTime = Date.now();
  activeSession.duration = 0;
  saveActiveSessionToCache();
  requestScreenWakeLock();
  startSessionTimer();
  renderActiveSessionBoard();
  // The homepage's "Active session" badge is stamped at renderSessions() time, not derived live —
  // without this, a card only picks up the started session on the NEXT unrelated re-render.
  getAppDeps().renderSessions?.();
  offerScheduleAdjustment({ onDeleteSession: deleteScheduledSession });
}

export function cancelWorkoutSession() {
  const activeSession = getActiveSession();
  const { state, navigateToPath, focusSessionsColumn, saveToLocalStorage } = getAppDeps();
  // An explicit delete of a planning session must also drop its draft(s) from state.history —
  // otherwise a discarded plan keeps reappearing in the "unscheduled plans" notification message
  // it backs (syncPlanningSnapshotToHistory), which reads as the delete having silently failed.
  if (activeSession?.sourceSession?.isPlanning && state && Array.isArray(state.history)) {
    // By draft id where the clipboard knows it, so deleting one draft leaves a client's OTHER
    // drafts alone — falling back to the clientId sweep only for a session cached before drafts
    // were addressable, where the client can only have had the one.
    const ownDraftIds = new Set(Object.values(activeSession.planningDraftIds || {}));
    const participants = new Set(activeSession.participants || []);
    state.history = state.history.filter((entry) => {
      if (!entry.isPlanning) return true;
      return ownDraftIds.size ? !ownDraftIds.has(entry.id) : !participants.has(entry.clientId);
    });
    if (saveToLocalStorage) saveToLocalStorage();
  }
  if (activeSession?.timerIntervalId) {
    clearInterval(activeSession.timerIntervalId);
  }
  releaseScreenWakeLock();
  setActiveSession(null);
  setClipboardEditModeFlag(false);
  clearActiveSessionCache();
  clearAllTimers(); // timers are session-scoped

  renderClipboardBar();

  if (navigateToPath) navigateToPath("/");
  if (focusSessionsColumn) focusSessionsColumn("today", "smooth");
}

// "This one never happened" — the slot comes off the board for good, unlike cancelWorkoutSession
// above, which only drops the LIVE clipboard and leaves the scheduled row behind (the ⋯ menu said
// "Delete Session" and the confirm said "delete this session", but the card was still on the
// dashboard afterwards).
//
// The programming does not die with the slot. Each participant's plan is kept as an UNSCHEDULED
// draft, because the trainer authored it once and a session deleted for having slipped its slot is
// exactly the one that gets re-run on another day; the feed's "unscheduled plans" item is then the
// route back to it. Logged sets and feedback ARE discarded, which is what the confirm says — a
// session worth deleting is a session that did not happen.
export function deleteScheduledSession() {
  const activeSession = getActiveSession();
  const appDeps = getAppDeps();
  const { state, saveToLocalStorage } = appDeps;
  const sourceSession = activeSession?.sourceSession;
  // A planning draft has no slot to remove, and deleting one is already cancelWorkoutSession's job.
  if (!state || !sourceSession || sourceSession.isPlanning) return;
  if (!Array.isArray(state.history)) state.history = [];
  const title = sourceSession.titles?.[0] || "";
  const nowISO = new Date().toISOString();

  for (const participantId of activeSession.participants) {
    const plan = buildSessionHistoryRecord({
      client: state.clients.find((client) => client.id === participantId),
      clientState: activeSession.clientRoutines[participantId],
      dateISO: nowISO,
      duration: 0,
      isPlanning: true,
      title,
    });
    // Pushed rather than upserted: this is a NEW unscheduled plan, and a client already holding one
    // must keep it (upsertPlanningRecord's draftId is what keeps the two apart from here on). An
    // empty plan is not rescued — there is nothing in it to re-run, and it would only inflate the
    // feed's outstanding-work count with a draft the trainer never wrote.
    if (plan?.exercises?.length) state.history.push(plan);
  }

  state.sessions = (state.sessions || []).filter(
    (session) => !sessionBelongsToSlot(session, sourceSession),
  );
  if (saveToLocalStorage) saveToLocalStorage();

  cancelWorkoutSession();

  appDeps.renderSessions?.();
  renderGlobalHistory({ state, t: appDeps.t });
  renderNotificationArea();
}

// Confirm only when finishing meaningfully early — more than 10 minutes still on the countdown.
// Near the scheduled end or in overrun (<=10 min or negative), complete silently. Returns whether
// the trainer wants to proceed (always true when there's nothing to confirm).
function confirmEarlyFinish(activeSession, t) {
  const endDate = activeSession.sourceSession?.endDate;
  if (!endDate || activeSession.sourceSession?.isPlanning) return true;
  const remainingMin = (new Date(endDate).getTime() - Date.now()) / 60000;
  if (remainingMin <= 10) return true;
  const msg = t("confirm_finish_early").replace("{min}", String(Math.round(remainingMin)));
  return confirm(msg);
}

function countCompletedSets(activeSession) {
  let completedSets = 0;
  for (const pId of activeSession.participants) {
    const clientState = activeSession.clientRoutines[pId];
    if (!clientState) continue;
    for (const exId in clientState.logs) {
      for (const log of clientState.logs[exId]) {
        if (log.completed) completedSets++;
      }
    }
  }
  return completedSets;
}

// Stamp completion + elapsed time onto the session(s) this live session launched from, so the
// dashboard's past-session status line (2.3) has something to show — previously finishing a
// session never touched state.sessions at all, only state.history.
function stampSourceSessionsCompleted(activeSession, state, sessionDuration) {
  const ss = activeSession.sourceSession;
  if (!ss || ss.isPlanning) return;
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  for (const session of sessions) {
    if (!sessionBelongsToSlot(session, ss)) continue;
    session.completed = true;
    session.duration = sessionDuration;
  }
}

// Log a record for every participant who performed something (skipped work is kept alongside it),
// or always for a planning template. A session where nothing was done writes no history — the
// record's own shape and that judgement both live in domain/sessionHistoryRecord.js.
function appendHistoryRecordsForParticipants(
  activeSession,
  state,
  sessionDateISO,
  sessionDuration,
) {
  for (const pId of activeSession.participants) {
    const clientLog = buildSessionHistoryRecord({
      client: state.clients.find((c) => c.id === pId),
      clientState: activeSession.clientRoutines[pId],
      feedback: activeSession.feedback || [],
      dateISO: sessionDateISO,
      duration: sessionDuration,
      isPlanning: !!activeSession.sourceSession?.isPlanning,
    });
    if (clientLog) state.history.push(clientLog);
  }
}

export function finishWorkoutSession() {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const { state, t, saveToLocalStorage, navigateToPath } = getAppDeps();
  if (!state || !t) return;

  if (!confirmEarlyFinish(activeSession, t)) return;

  const completedSets = countCompletedSets(activeSession);
  if (
    completedSets === 0 &&
    !activeSession.sourceSession?.isPlanning &&
    !confirm(t("alert_no_sets"))
  ) {
    return;
  }

  const sessionDateISO = new Date(activeSession.startTime).toISOString();
  const sessionDuration = activeSession.duration;

  stampSourceSessionsCompleted(activeSession, state, sessionDuration);
  appendHistoryRecordsForParticipants(activeSession, state, sessionDateISO, sessionDuration);

  if (saveToLocalStorage) saveToLocalStorage();

  cancelWorkoutSession();

  renderClientsList({ state, t });
  renderRoutinesList({ state, t });
  renderGlobalHistory({ state, t });

  if (navigateToPath) navigateToPath("/history");
}

export function recoverActiveSession() {
  const parsed = readActiveSessionCache();
  if (!parsed) return;

  try {
    setActiveSession(parsed);
    const activeSession = parsed;
    activeSession.duration = activeSession.started
      ? Math.floor((Date.now() - activeSession.startTime) / 1000)
      : 0;

    if (activeSession.sourceSession) {
      activeSession.sourceSession.startDate = new Date(activeSession.sourceSession.startDate);
      activeSession.sourceSession.endDate = new Date(activeSession.sourceSession.endDate);
    }

    if (isCachedSessionStale(activeSession)) {
      setActiveSession(null);
      clearActiveSessionCache();
      renderClipboardBar();
      return;
    }

    if (activeSession.sourceSession?.isPlanning) {
      setClipboardEditModeFlag(true);
    }
    // Recovery runs before the first route is entered (app.js boots the session, then routes), so
    // the URL is the only thing that knows the trainer was in the editor. Ask the router what the
    // address bar names rather than sniffing the path for a suffix — the same question, answered by
    // the code that owns the patterns, and it keeps working as edit-mode URLs gain segments.
    //
    // The row id has to be taken here too, not left to the router: recovery renders the board, that
    // render syncs the URL, and a sync with no row id would erase the very segment the router is
    // about to read. The router validates it a moment later and drops it if the row is gone.
    const bootRoute = getAppDeps().resolveRoute?.(window.location.pathname);
    if (bootRoute?.isEditor) {
      setClipboardEditModeFlag(true);
      markEditorRow(bootRoute.params.slotId ?? null, { kind: "restored", focus: false });
    }

    renderClipboardBar();

    renderActiveSessionBoard();
    restoreSessionTimers();
    if (activeSession.started) {
      startSessionTimer();
      requestScreenWakeLock();
    }
  } catch (e) {
    console.error("Error recovering active session cache:", e);
  }
}
