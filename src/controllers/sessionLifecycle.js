// src/controllers/sessionLifecycle.js — how a session begins and how it ends. Single responsibility:
// the whole-session transitions — opening one (staged, reopened, or put back after a reload), tapping
// Start, cancelling, deleting the slot behind it, and completing it. Each transition changes the
// session's programs (sessionPrograms.js, over data/trainingRecords.js): planned while staged, live
// once started, done when completed, removed when discarded. Injected dependencies: `state`, `t`,
// `navigateToPath`, `saveToLocalStorage`, `focusSessionsColumn`, `renderSessions`, `resolveRoute`
// and `launchClipboardDirectly` arrive through activeSessionStore.js.
//
// The clipboard holds one session at a time, the `activeSession` slot. Opening another one leaves
// the first in its programs, where every change was already written, and the trainer can come back
// to it.

import { libraryExercises } from "../data/exerciseLibrary.js";
import { newRecordId } from "../data/recordId.js";
import { readVersionScoped, removeVersionScoped } from "../data/storageNamespace.js";
import {
  feedbackFromNotes,
  livePrograms,
  notesForProgram,
  programById,
  programDate,
  programNameIn,
  recordTrainings,
  unschedulePrograms,
} from "../data/trainingRecords.js";
import { loggedSetsPerParticipant } from "../domain/loggedSets.js";
import { buildSessionHistoryRecord } from "../domain/sessionHistoryRecord.js";
import {
  buildClientStateFromImportedItems,
  buildClientStateFromRoutine,
} from "../domain/sessionPlanFactory.js";
import { performedAtFor, sessionBelongsToSlot } from "../domain/sessionRecord.js";
import { sessionsAfterRemoving } from "../domain/sessionSeries.js";
import { countedText } from "../i18n/plural.js";
import { renderClientsList } from "../modules/clients/clientsView.js";
import { renderActiveSessionBoard } from "../modules/clipboard/activeSessionBoard.js";
import { markEditorRow, setClipboardEditModeFlag } from "../modules/clipboard/editModeState.js";
import { clearAllTimers, restoreSessionTimers } from "../modules/clipboard/exerciseAndRestTimer.js";
import { askInApp } from "../modules/common/appQuestion.js";
import { renderNotificationArea } from "../modules/common/notificationArea.js";
import {
  clientDisplayName,
  formatClockFromEpoch,
  formatDurationHourMin,
  getISODateString,
} from "../modules/common/utils.js";
import {
  releaseScreenWakeLock,
  requestScreenWakeLock as requestScreenWakeLockHelper,
} from "../modules/common/wakeLock.js";
import { renderRoutinesList } from "../modules/plans/plansView.js";
import { renderClipboardBar } from "../modules/session/sessionBar.js";
import {
  getActiveSession,
  getAppDeps,
  mergeAppDeps,
  setActiveSession,
} from "./activeSessionStore.js";
import {
  clientStateFromProgram,
  discardSession,
  programIdFor,
  saveActiveSession,
  saveSession,
  slotIdsOf,
  storedSession,
} from "./sessionPrograms.js";
import { offerScheduleAdjustment } from "./sessionScheduleAdjustment.js";
import { startSessionTimer } from "./sessionTimers.js";

function requestScreenWakeLock() {
  return requestScreenWakeLockHelper(getActiveSession);
}

// The session leaving the slot keeps its programs; only its clock and the rest timers on screen
// stop. Returns whether the slot held a session.
function leaveSlot() {
  const previous = getActiveSession();
  if (!previous) return false;
  if (previous.timerIntervalId) clearInterval(previous.timerIntervalId);
  clearAllTimers();
  return true;
}

// Into an empty slot, which is what a reload leaves, the rest timers stored for this session come
// back. A session that is running gets its clock and keeps the screen awake.
function enterSlot(session, slotWasHeld) {
  setActiveSession(session);
  if (!slotWasHeld) restoreSessionTimers(session.id);
  if (session.started) {
    startSessionTimer();
    requestScreenWakeLock();
  }
}

// A clipboard holding one stored program, for its one client.
function sessionOfProgram(program, state, t) {
  const planned = program.status === "planned";
  const live = program.status === "live";
  return {
    id: program.id,
    started: live,
    startTime: new Date((live && program.startedAt) || programDate(program)).getTime(),
    duration: live
      ? Math.floor((Date.now() - Date.parse(program.startedAt)) / 1000)
      : program.duration || 0,
    participants: [program.clientId],
    clientRoutines: {
      [program.clientId]: clientStateFromProgram(program, libraryExercises(state)),
    },
    activeClientId: program.clientId,
    feedback: feedbackFromNotes(notesForProgram(state, program.id)),
    // A program not yet done is written back to itself on every save, even when the client holds
    // several drafts.
    programIds: planned || live ? { [program.clientId]: program.id } : {},
    sourceSession: planned
      ? {
          id: `plan-${program.id}`,
          isPlanning: true,
          titles: [programNameIn(program.title, t) || t("planned_program") || "Planned Program"],
          timeLabel: t("date_unknown") || "Date Unknown",
          location: "",
        }
      : null,
    // A finished session is REOPENED here, not staged to be run: from the History view, and, far
    // more often, by pulling the plan aside on the clipboard. It carries its own name and
    // must not offer Start — it already happened. This is deliberately not a
    // `sourceSession`: that means "the booked slot this clipboard was launched from", and every
    // reader of it (the clipboard strip, the schedule-drift offer, the timers) would then be
    // handed a slot that was never booked.
    finishedRecord: planned || live ? null : { id: program.id, title: program.title || "" },
  };
}

/** Put a stored program on the clipboard: a performed one to look back at, a planned one to edit, a
 *  live one with no session to go on with. A program of a session not yet finished opens as that
 *  session, with everybody in it. The clipboard is rebuilt from the program, and its notes become
 *  the session's feedback. `navigate: false` opens it without moving to its address. */
export function openSessionFromHistory(program, { navigate = true } = {}) {
  const { state, t, navigateToPath } = getAppDeps();
  if (!state || !t) return;
  // A plan the trainer threw away is kept, never shown again, an old link to it included.
  if (program?.status === "discarded") return;
  if (openAsItsSession(program, navigate)) return;
  const slotWasHeld = leaveSlot();
  enterSlot(sessionOfProgram(program, state, t), slotWasHeld);

  setClipboardEditModeFlag(program.status === "planned");
  saveActiveSession();
  renderClipboardBar();

  if (navigate && navigateToPath) {
    navigateToPath(`/session/${program.id}/client/${program.clientId}`);
  }
}

// A program of a booked session that is not finished is opened as that session, so a save writes it
// back to its session and nobody in the session is left out. Returns false when the session row is
// gone: the program then opens on its own, as a program with no session.
function openAsItsSession(program, navigate) {
  if (!program.sessionId || program.status === "done") return false;
  const { navigateToPath, launchClipboardDirectly } = getAppDeps();
  const showing = getActiveSession();
  if (showing && slotIdsOf(showing).includes(program.sessionId)) {
    if (navigate) navigateToPath?.(`/session/${showing.id}/client/${program.clientId}`);
    return true;
  }
  launchClipboardDirectly?.({ sessionId: program.sessionId }, { navigate });
  return getActiveSession() !== showing;
}

// The routine a participant's plan is built from, as the built plan records it: a routine id that
// names no routine is the trainer's choice of an empty plan, which records none.
function routineIdOf(state, routineId) {
  return (state.routines || []).some((routine) => routine.id === routineId) ? routineId : "";
}

// One participant's plan. The program stored for this session is used while it is still the plan
// the session names: started, or built from the routine the session has now. Otherwise the plan is
// built from the routine, or from an imported programme, and saved under the stored program's id,
// so it replaces that program rather than standing beside it.
function planFor(session, assignment, program, options) {
  const { state, t } = getAppDeps();
  const exercises = libraryExercises(state);
  if (program) session.programIds[assignment.clientId] = program.id;
  const stillTheSessionsPlan =
    program?.status === "live" ||
    (program?.routineId || "") === routineIdOf(state, assignment.routineId);
  if (program && stillTheSessionsPlan && !options.plan) {
    return clientStateFromProgram(program, exercises);
  }
  const clientState = buildClientStateFromRoutine({
    routineId: assignment.routineId,
    routines: state.routines,
    exercises,
    emptyPlanName: t("custom_empty_plan") || "Empty plan, no routine",
  });
  // An IMPORTED programme arrives as plan items rather than as a routine, so it
  // replaces what the routine would have supplied. Handled here, at the one place a plan is built,
  // rather than by writing over the session afterwards — an import that patched a session the
  // moment after it was created would be a second way to construct one.
  if (options.plan) {
    const imported = buildClientStateFromImportedItems(
      options.plan,
      exercises,
      session.sourceSession?.titles?.[0] || "",
    );
    Object.assign(clientState, {
      exercises: imported.exercises,
      logs: imported.logs,
      routineName: imported.routineName,
    });
  }
  return clientState;
}

// What the session's stored programs say about it as a whole: whether and when it was started, its
// notes, and who started from one plan. Each member's plan is their own, rebuilt from their program.
function resumeStored(session, stored) {
  session.started = stored.started;
  session.startTime = stored.startTime;
  session.duration = stored.started ? Math.floor((Date.now() - stored.startTime) / 1000) : 0;
  session.feedback = stored.feedback;
  session.bindings = stored.bindings;
}

/** Open a session on the clipboard: a booked one, a plan written for no session, or an imported
 *  programme. What its programs already hold — sets logged, notes, Start — is put back, so leaving a
 *  session and opening it again, or reloading, loses nothing. */
export function startWorkoutSession(clientRoutines, sessionMeta = null, deps = {}, options = {}) {
  mergeAppDeps(deps);
  const { navigate = true } = options;
  const { state, navigateToPath } = getAppDeps();
  if (!state) return;
  const slotWasHeld = leaveSlot();

  const participantIds = clientRoutines.map((cr) => cr.clientId);
  const session = {
    id: sessionMeta ? sessionMeta.id : newRecordId(),
    started: false,
    startTime: null,
    duration: 0,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    sourceSession: sessionMeta,
    programIds: {},
  };
  const stored = storedSession(state, session);
  for (const assignment of clientRoutines) {
    session.clientRoutines[assignment.clientId] = planFor(
      session,
      assignment,
      stored.programs[assignment.clientId],
      options,
    );
  }
  resumeStored(session, stored);
  // A plan with no session is found again by its first participant's program: that id is its
  // address, so a reload of the address opens it.
  if (!slotIdsOf(session).length) session.id = programIdFor(session, participantIds[0]);

  enterSlot(session, slotWasHeld);
  setClipboardEditModeFlag(!!sessionMeta?.isPlanning);
  saveSession(session);

  if (navigate && navigateToPath) {
    navigateToPath(`/session/${session.id}/client/${session.activeClientId}`);
  }
}

// Explicit trainer action, mirroring finishWorkoutSession: opening the clipboard only stages the
// session (plan visible, nothing running yet) — the timer, duration, and "live" status only begin
// once the trainer taps Start, same way a session only ends when they tap Complete.
// Editing the plan before Start leaves the LAST added exercise as the active card. A session starts
// at the first exercise that still has a set to log; when everything is done the index stays.
function pointAtFirstExerciseNotDone(clientState) {
  const exercises = clientState?.exercises || [];
  const isDone = (exercise) => {
    const sets = clientState.logs?.[exercise.id] || [];
    return sets.length > 0 && sets.every((set) => set.completed);
  };
  const index = exercises.findIndex((exercise) => !isDone(exercise));
  if (index >= 0) clientState.activeExerciseIndex = index;
}

export function beginWorkoutSession() {
  const activeSession = getActiveSession();
  if (!activeSession || activeSession.started) return;
  for (const clientState of Object.values(activeSession.clientRoutines || {})) {
    pointAtFirstExerciseNotDone(clientState);
  }
  activeSession.started = true;
  activeSession.startTime = Date.now();
  activeSession.duration = 0;
  saveActiveSession();
  requestScreenWakeLock();
  startSessionTimer();
  renderActiveSessionBoard();
  // The homepage's "Active session" badge is stamped at renderSessions() time, not derived live —
  // without this, a card only picks up the started session on the NEXT unrelated re-render.
  getAppDeps().renderSessions?.();
  offerScheduleAdjustment({
    onDeleteSession: deleteScheduledSession,
    deleteQuestion: deleteSessionQuestion,
  });
}

/** The trainer throws the plan away: its programs are kept as discarded, so it does not come back in
 *  the feed's "unscheduled plans", and nothing the trainer wrote is deleted. Then the clipboard
 *  closes. */
export function cancelWorkoutSession() {
  const activeSession = getActiveSession();
  const { saveToLocalStorage } = getAppDeps();
  if (activeSession) {
    discardSession(activeSession);
    saveToLocalStorage?.();
  }
  closeWorkoutSession();
}

// The clipboard empties and the trainer is back on the board. The session's programs are left as
// they are: finishing has already made them done, deleting the session unscheduled them, and
// throwing a plan away discarded it.
function closeWorkoutSession() {
  const activeSession = getActiveSession();
  const { navigateToPath, focusSessionsColumn } = getAppDeps();
  if (activeSession?.timerIntervalId) {
    clearInterval(activeSession.timerIntervalId);
  }
  releaseScreenWakeLock();
  setActiveSession(null);
  setClipboardEditModeFlag(false);
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
// The programming does not die with the slot, and no program is deleted. Each participant's program
// keeps its id and waits as an UNSCHEDULED plan, because the trainer authored it once and a session
// deleted for having slipped its slot is exactly the one that gets re-run on another day; the feed's
// "unscheduled plans" item is then the route back to it. Logged sets and feedback ARE discarded,
// which is what the confirm says — a session worth deleting is a session that did not happen.
/** The session's title, ISO date and 24-hour time, in one line: what the question is about. */
function sessionNameLine(t, sourceSession) {
  const titles = (sourceSession?.titles || []).filter(Boolean).join(", ");
  const start = sourceSession?.startDate ? new Date(sourceSession.startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return titles;
  return t("delete_session_named")
    .replace("{title}", titles)
    .replace("{date}", getISODateString(start))
    .replace("{time}", formatClockFromEpoch(start.getTime()));
}

/** What a started session loses: the logged sets, per participant. */
function loggedSetsLine(t, activeSession) {
  const { state } = getAppDeps();
  const lang = document.documentElement.lang;
  const parts = loggedSetsPerParticipant(activeSession).map(({ clientId, count }) =>
    t("delete_sets_participant")
      .replace("{name}", clientDisplayName((state?.clients || []).find((c) => c.id === clientId)))
      .replace("{count}", countedText(t, lang, "delete_sets", count)),
  );
  return parts.length
    ? t("delete_sets_lost").replace("{sets}", parts.join("; "))
    : t("delete_sets_none");
}

/** The question asked before deleting the session on the clipboard. It names the session. An
 *  evening of a repeating session is deleted alone, and the question says so: without it a trainer
 *  could fear that every evening of the series had gone. A started session also says which logged
 *  sets cannot come back. */
export function deleteSessionQuestion(t) {
  const { state } = getAppDeps();
  const activeSession = getActiveSession();
  const sourceSession = activeSession?.sourceSession;
  const oneOfASeries = (state?.sessions || []).some(
    (session) => session.seriesId && sessionBelongsToSlot(session, sourceSession),
  );
  const question = t("confirm_delete_session");
  const lines = [sessionNameLine(t, sourceSession)];
  lines.push(oneOfASeries ? `${t("delete_one_evening")} ${question}` : question);
  if (activeSession?.started) lines.push(loggedSetsLine(t, activeSession));
  return lines.filter(Boolean).join("\n");
}

/** A started session is deleted by sliding, not by a tap: a phone in a pocket cannot slide. */
export function deleteSessionNeedsSlide() {
  return Boolean(getActiveSession()?.started);
}

export function deleteScheduledSession() {
  const activeSession = getActiveSession();
  const appDeps = getAppDeps();
  const { state, saveToLocalStorage } = appDeps;
  const sourceSession = activeSession?.sourceSession;
  // A planning draft has no slot to remove, and deleting one is already cancelWorkoutSession's job.
  if (!state || !sourceSession || sourceSession.isPlanning) return;
  const title = sourceSession.titles?.[0] || "";
  const nowISO = new Date().toISOString();

  const plans = [];
  for (const participantId of activeSession.participants) {
    const plan = buildSessionHistoryRecord({
      client: state.clients.find((client) => client.id === participantId),
      clientState: activeSession.clientRoutines[participantId],
      dateISO: nowISO,
      duration: 0,
      isPlanning: true,
      title,
    });
    // The program's own id: the plan REPLACES the program it was, as what was prescribed, without
    // the sets logged against it. A client already holding another unscheduled plan keeps that one
    // beside it.
    if (plan?.exercises?.length) {
      plans.push({ ...plan, id: programIdFor(activeSession, participantId) });
    }
  }
  recordTrainings(state, plans);
  // Off the slot. A program with nothing in it is kept as discarded instead: it would only inflate
  // the feed's outstanding-work count with a plan the trainer never wrote.
  unschedulePrograms(
    state,
    activeSession.participants.map((pId) => activeSession.programIds?.[pId]).filter(Boolean),
  );

  // Deleting an evening of a REPEATING session cannot mean removing the row: the rule would produce
  // that evening again on the next render, and the trainer would watch a session they just deleted
  // come back. It is kept as cancelled, which is the only way to say "not this
  // Tuesday" to a rule that says "every Tuesday". A one-off is deleted, as it always was.
  state.sessions = sessionsAfterRemoving(
    state.sessions || [],
    (state.sessions || [])
      .filter((session) => sessionBelongsToSlot(session, sourceSession))
      .map((session) => session.id),
  );
  if (saveToLocalStorage) saveToLocalStorage();

  // Closed, not cancelled: cancelling throws the plan away, and these programs were just kept.
  closeWorkoutSession();

  appDeps.renderSessions?.();
  renderNotificationArea();
}

// Confirm only when finishing meaningfully early — more than 10 minutes still on the countdown.
// Near the scheduled end or in overrun (<=10 min or negative), complete silently. Returns whether
// the trainer wants to proceed (always true when there's nothing to confirm).
async function confirmEarlyFinish(activeSession, t) {
  const endDate = activeSession.sourceSession?.endDate;
  if (!endDate || activeSession.sourceSession?.isPlanning) return true;
  const remainingMin = (new Date(endDate).getTime() - Date.now()) / 60000;
  if (remainingMin <= 10) return true;
  // Said the way every other countdown in the app says it ("01h 32m"): the same question used to
  // count in raw minutes, so a session two days off asked about "3812 minutes" — a number no trainer
  // reads as a time.
  const message = t("confirm_finish_early").replace(
    "{time}",
    formatDurationHourMin(remainingMin * 60),
  );
  return askInApp({ t, message, confirmKey: "dialog_finish_now" });
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
// session never touched state.sessions at all, only the client's programs.
function stampSourceSessionsCompleted(activeSession, state, sessionDuration) {
  const ss = activeSession.sourceSession;
  if (!ss || ss.isPlanning) return;
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  for (const session of sessions) {
    if (!sessionBelongsToSlot(session, ss)) continue;
    session.status = "done";
    session.duration = sessionDuration;
  }
}

// Every participant who performed something gets their program finished: the live program becomes
// the done one, under the same id, with skipped work kept alongside it. A planning template stays
// planned. A participant who did nothing has no training to keep, so their program waits
// unscheduled, as a cancelled client's does: it is never deleted. No attendance is written for them:
// nothing logged does not prove they were absent. The record's own shape and that judgement both
// live in domain/sessionHistoryRecord.js.
function finishProgramsOfParticipants(activeSession, state, sessionDateISO, sessionDuration) {
  const records = activeSession.participants.map((pId) => {
    const record = buildSessionHistoryRecord({
      client: state.clients.find((c) => c.id === pId),
      clientState: activeSession.clientRoutines[pId],
      feedback: activeSession.feedback || [],
      dateISO: sessionDateISO,
      duration: sessionDuration,
      isPlanning: !!activeSession.sourceSession?.isPlanning,
    });
    if (record) record.id = programIdFor(activeSession, pId);
    return record;
  });
  // The session rows this clipboard was launched from, so each program is linked to the one its
  // client was on and the client is recorded as having attended. A planning clipboard has no slot.
  recordTrainings(state, records, { sessionIds: slotIdsOf(activeSession) });
  const unperformed = activeSession.participants.filter((_, index) => !records[index]);
  unschedulePrograms(
    state,
    unperformed.map((pId) => activeSession.programIds?.[pId]).filter(Boolean),
  );
}

export async function finishWorkoutSession() {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const { state, t, saveToLocalStorage, navigateToPath } = getAppDeps();
  if (!state || !t) return;

  if (!(await confirmEarlyFinish(activeSession, t))) return;

  const completedSets = countCompletedSets(activeSession);
  if (
    completedSets === 0 &&
    !activeSession.sourceSession?.isPlanning &&
    !(await askInApp({ t, message: t("alert_no_sets"), confirmKey: "dialog_finish_now" }))
  ) {
    return;
  }
  // The questions above wait for an answer; the session may have been closed meanwhile.
  if (getActiveSession() !== activeSession) return;

  const slot = activeSession.sourceSession;
  const sessionDateISO = performedAtFor(
    activeSession.startTime,
    slot && !slot.isPlanning ? slot.startDate : null,
  );
  const sessionDuration = activeSession.duration;

  stampSourceSessionsCompleted(activeSession, state, sessionDuration);
  finishProgramsOfParticipants(activeSession, state, sessionDateISO, sessionDuration);

  if (saveToLocalStorage) saveToLocalStorage();

  closeWorkoutSession();

  // The finished session just produced its signals (pending exercise notes); the drawer lists them.
  renderNotificationArea();

  renderClientsList({ state, t });
  renderRoutinesList({ state, t });

  // Back to the sessions list, where the finished session's card is. It used to open the history of
  // every client, which is gone: history is shown only on a client's page.
  if (navigateToPath) navigateToPath("/");
  // Then repaint the list, for the same reason starting a session does it: a card's status line is
  // stamped when the list renders, not derived live, and the route is already "/" when a trainer
  // finishes from there — so the card went on saying "Active session" until something unrelated
  // repainted it or the page was reloaded.
  getAppDeps().renderSessions?.();
}

// Before sessions were stored as programs, the one in progress lived in this key. The first start of
// this build converts what it holds into programs, once, so a trainer in the middle of a session
// when the update arrives loses nothing, and the key goes.
const LEGACY_SESSION_KEY = "librept_active_session";

function legacySession() {
  const raw = readVersionScoped(LEGACY_SESSION_KEY);
  if (raw === null) return null;
  removeVersionScoped(LEGACY_SESSION_KEY);
  try {
    const session = JSON.parse(raw);
    return session?.id ? session : null;
  } catch {
    return null;
  }
}

function importLegacySession(cached) {
  // A plan's drafts were addressed by `planningDraftIds`; they are the plan's programs.
  const { planningDraftIds, ...session } = cached;
  session.programIds = { ...planningDraftIds, ...session.programIds };
  session.timerIntervalId = null;
  // An older build had bound participants share one plan object, which JSON stored as a copy per
  // member: each member's own plan, which is what a group is now. `bindings` says who is grouped.
  session.duration = session.started ? Math.floor((Date.now() - session.startTime) / 1000) : 0;
  if (session.sourceSession?.startDate) {
    session.sourceSession.startDate = new Date(session.sourceSession.startDate);
  }
  if (session.sourceSession?.endDate) {
    session.sourceSession.endDate = new Date(session.sourceSession.endDate);
  }
  enterSlot(session, false);
  setClipboardEditModeFlag(Boolean(session.sourceSession?.isPlanning));
  saveSession(session);
}

// The session an address names, when it is a clipboard's address: `/session/<id>/…`, the dialogs
// over it included. The setup form's address names a session too, but opens no clipboard.
function sessionInAddress(route) {
  return route?.name !== "session.setup" ? route?.params?.sessionId || null : null;
}

// Open the session or program an id names, without moving to its address: the router then finds it
// on the clipboard and only applies the address's focus.
function openById(id) {
  const { state, launchClipboardDirectly } = getAppDeps();
  launchClipboardDirectly?.({ sessionId: id }, { navigate: false });
  if (getActiveSession()) return;
  const program = programById(state, id);
  if (program) openSessionFromHistory(program, { navigate: false });
}

/**
 * Put a session back on the empty clipboard at start, or when the trainer changes workspace. There is
 * no copy to recover it from: it is read from its programs. The session the address names comes
 * back; at any other address, the live session started last, so the clipboard bar shows it. The
 * focus, the participant and the editor come from the address, as the router enters it.
 */
export function recoverActiveSession() {
  const imported = legacySession();
  if (imported && !getActiveSession()) importLegacySession(imported);
  if (getActiveSession()) {
    renderRestored();
    return;
  }
  const { state, resolveRoute } = getAppDeps();
  if (!state) return;
  const route = resolveRoute?.(window.location.pathname);
  const named = sessionInAddress(route);
  const [startedLast] = livePrograms(state);
  if (named) openById(named);
  else if (startedLast) openSessionFromHistory(startedLast, { navigate: false });
  if (!getActiveSession()) return;
  // The address is the only thing that knows the trainer was in the editor, and which row. The row
  // is taken here, not left to the router: the render below syncs the address, and a sync with no
  // row would erase the segment the router is about to read. The router drops it if the row is gone.
  if (route?.isEditor) {
    setClipboardEditModeFlag(true);
    markEditorRow(route.params.slotId ?? null, { kind: "restored", focus: false });
  }
  renderRestored();
}

function renderRestored() {
  renderClipboardBar();
  renderActiveSessionBoard();
}
