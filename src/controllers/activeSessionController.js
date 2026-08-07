import { newRecordId } from "../data/recordId.js";
import {
  clearActiveSessionCache,
  readActiveSessionCache,
  saveActiveSessionToCache as saveActiveSessionToCacheHelper,
} from "../data/sessionCache.js";
import { modalityOf, primaryMetricOf } from "../domain/exerciseModality.js";
import {
  buildQuickSignalEntries,
  hasQuickSignal as hasPlainQuickSignal,
  oppositeQuickSignal,
  plainQuickSignalIds,
  quickSignalColor,
} from "../domain/quickSignals.js";
import { loadUnitForEquipment } from "../domain/repsAndLoad.js";
import {
  computeActiveSessionCountdown,
  computeScheduleDriftMs,
  isCachedSessionStale,
  isScheduleDriftWorthAdjusting,
  proposeAdjustedSchedule,
  resolveScheduleFromClockValues,
} from "../domain/sessionClock.js";
import { focusIndexFromRef, focusRefForItem, isCircuitFocus } from "../domain/sessionFocus.js";
import { buildSessionHistoryRecord, upsertPlanningRecord } from "../domain/sessionHistoryRecord.js";
import {
  buildClientStateFromHistoryLog,
  buildClientStateFromRoutine,
  clampFocusIndex,
  ensureRestItems,
  isRestItem,
} from "../domain/sessionPlanFactory.js";
import { renderClientsList } from "../modules/clients/clientsView.js";
import {
  initActiveSessionBoard,
  renderActiveSessionBoard,
} from "../modules/clipboard/activeSessionBoard.js";
import {
  renderActiveSessionOverlayShell,
  renderAddSessionExerciseDialog,
  renderCatalogPickerDialog,
} from "../modules/clipboard/activeSessionOverlayView.js";
import {
  getEditorRowId,
  isClipboardEditMode,
  markEditorRow,
  setClipboardEditModeFlag,
} from "../modules/clipboard/editModeState.js";
import {
  clearAllTimers,
  restoreSessionTimers,
  startTimer,
  stopTimerIfMatches,
} from "../modules/clipboard/exerciseAndRestTimer.js";
import { updateClientTabsFadeState } from "../modules/common/activeUsersList.js";
import { formatClockFromMinutes, formatDurationHourMin } from "../modules/common/utils.js";
import {
  releaseScreenWakeLock,
  requestScreenWakeLock as requestScreenWakeLockHelper,
} from "../modules/common/wakeLock.js";
import { mountExercisePicker } from "../modules/exercises/exercisePicker.js";
import { renderGlobalHistory } from "../modules/history/historyView.js";
import { renderRoutinesList } from "../modules/plans/plansView.js";
import {
  renderActiveSessionBarLabels,
  renderIdleSessionBar,
  updateSessionBarTimer,
} from "../modules/session/sessionBar.js";
import { openSessionStartTimeDialog } from "../modules/session/sessionStartTimeDialog.js";

let activeSession = null;
let appDeps = {};

function requestScreenWakeLock() {
  return requestScreenWakeLockHelper(getActiveSession);
}

// Temporal mode of the plan currently loaded, used to label edit mode so the trainer always knows
// whether they're reshaping the LIVE session, an UPCOMING one, or a date-less PLANNING program.
function currentPlanMode() {
  const ss = activeSession?.sourceSession;
  if (ss?.isPlanning) return "planning";
  if (ss?.day === "tomorrow" || ss?.day === "upcoming") return "future";
  return "live";
}

// ---- Rest as a first-class plan item ----------------------------------------------------------
// The plan (clientState.exercises) is an ordered mix of exercise items and rest items. A rest item
// is { id, type:'rest', rest:<seconds>, circuitId, circuitTitle, circuitSeries } — it carries the
// circuit fields so a rest inside a circuit stays grouped with it. Exercise items have no `type`.
//
// Rests are first-class: `activeExerciseIndex` may point at one exactly like any exercise or
// circuit member (TODO §8.6). The plan's shape, and everything that builds one, now lives in
// domain/sessionPlanFactory.js; `isRestItem` is re-exported from here only because the router and
// the deck already import it from this module.
export { isRestItem };

// Re-exported rather than moved off this module's surface: app.js hands focusIndexFromRef to the
// router from here, and the deck reads isCircuitFocus from here. The logic lives in
// domain/sessionFocus.js; these two names are the seam its callers were already wired against.
export { focusIndexFromRef, isCircuitFocus };

// `newItemId` names a plan item the caller just created (the live deck's +Exercise/+Circuit/+Rest
// bar), so the editor opens with that row called out instead of dropping the trainer into an
// otherwise-identical list.
export function enterClipboardEditMode(newItemId = null) {
  setClipboardEditModeFlag(true);
  markEditorRow(newItemId, { kind: "new", focus: true });
  // Re-entering edit mode resets the accordion to its default (one row open) unless a callout row
  // is being inserted — toggling a row closed sets editorExpandedId to null, which must stick until
  // the trainer leaves and re-enters edit mode.
  if (!newItemId && activeSession) {
    const cs = activeSession.clientRoutines[activeSession.activeClientId];
    if (cs) cs.editorExpandedId = undefined;
  }
  renderActiveGroupBoard();
}

export function exitClipboardEditMode() {
  setClipboardEditModeFlag(false);
  renderActiveGroupBoard();
}

export function initActiveSessionController(deps) {
  appDeps = { ...appDeps, ...deps };
}

// The board paints; this controller orchestrates. Everything it needs is injected rather than
// imported back up a layer — see agent_tools/import_layers.py and the board's own header.
initActiveSessionBoard({
  getActiveSession: () => activeSession,
  getAppDeps: () => appDeps,
  currentPlanMode,
  syncSessionFocusUrl: () => syncSessionFocusUrl(),
  ensureRestItems,
  clampFocusIndex,
  rerender: () => renderActiveGroupBoard(),
  enterEditMode: enterClipboardEditMode,
  exitEditMode: exitClipboardEditMode,
  saveActiveSessionToCache: () => saveActiveSessionToCache(),
  openAddExercise: () => openAddSessionExerciseDialog(),
  // Routed so a reload reopens the picker. `query`/`category` are transient typing state and stay
  // out of the URL; the route re-derives the filter from the row it is swapping.
  openCatalogPicker: (opts = {}) =>
    navigateToSessionDialog(
      opts.slotId ? "session.catalog.slot" : "session.catalog",
      opts.slotId ? { slotId: opts.slotId } : {},
    ) || openCatalogPicker(opts),
  buildCircuitUnits,
  getExerciseSignalColor,
  hasQuickSignal,
  logQuickSignal,
  completeCircuitRound,
  focusExerciseByIndex,
  startRestTimer: (seconds, type, label) => startClientTimer(seconds, type, label),
  newRecordId,
});

export function getActiveSession() {
  return activeSession;
}

export function setActiveSession(session) {
  activeSession = session;
}

export function sessionFocusPath() {
  if (!activeSession) return null;
  const { urlFor } = appDeps;
  if (!urlFor) return null;
  const clientId = activeSession.activeClientId || activeSession.participants[0];
  const ids = { sessionId: activeSession.id, clientId };
  // Edit mode is a first-class, deep-linkable state: its URL survives a reload so the trainer lands
  // back in the editor (not the live deck), and the plan edits — persisted on every keystroke — are
  // intact. The client segment names WHOSE plan is open so the right participant is restored, and the
  // row segment names the one just inserted or swapped — otherwise a reload drops the trainer into a
  // long plan with nothing saying which row they were in the middle of.
  if (isClipboardEditMode()) {
    const editorRowId = getEditorRowId();
    return editorRowId
      ? urlFor("session.edit.item", { ...ids, slotId: editorRowId })
      : urlFor("session.edit", ids);
  }
  const cs = activeSession.clientRoutines[clientId];
  const focusRef = focusRefForItem(cs?.exercises?.[cs.activeExerciseIndex]);
  if (!focusRef) return urlFor("session.client", ids);
  // Built, never spelled: the focus segment was renamed once already (superset → circuit), and a
  // hand-written path is what quietly survives the next rename as a dead link. The segment comes
  // from the same function the router resolves it back through, so the round trip cannot drift.
  return urlFor("session.focus", { ...ids, focusType: focusRef.type, focusId: focusRef.id });
}

// Set the edit-mode flag WITHOUT re-rendering — for the router restoring edit mode from an `/edit`
// deep link, where the caller (showSessionView) already renders the board once afterwards. Use
// enter/exitClipboardEditMode for in-app toggles that must render immediately.
export function setClipboardEditMode(on, slotId = null) {
  setClipboardEditModeFlag(on);
  if (!on) return;
  // No row in the URL does not mean "no row": a swap made from the catalog dialog marks its row and
  // then routes BACK to a slot-less `/edit` entry, and that pop must not erase the mark it just set.
  // The URL is authoritative only when it actually names a row.
  if (!slotId) return;
  // A row id from a URL may name a row that has since been deleted. Like a stale focus card, it is
  // ignored rather than erroring — syncSessionFocusUrl then drops the segment on the next render.
  const plan = activeSession?.clientRoutines?.[activeSession.activeClientId]?.exercises;
  const known = plan?.some((item) => item.id === slotId) ? slotId : null;
  // Restoring from a URL, not reacting to an edit: highlight and scroll to the row so the trainer
  // finds their place, but take no caret and show no badge. A reload is not the moment the row
  // appeared — announcing it as New would be a lie, and stealing focus would pop the phone keyboard
  // on a page the trainer may have reloaded for some other reason entirely.
  markEditorRow(known, { kind: "restored", focus: false });
}

// The session routes whose URL is the focus itself, and which the focus may therefore rewrite. A
// dialog layered over the session is NOT one of them: it named itself in the address bar, and a
// re-render behind it must not erase that.
const FOCUS_OWNED_ROUTES = ["session", "session.client", "session.focus", "session.edit"];

export function syncSessionFocusUrl() {
  if (!activeSession) return;
  const { toRoute, replaceRoute, activeRouteName } = appDeps;
  if (!toRoute || !replaceRoute) return;
  // Asking which route is active is exact. The prefix tests below only ever excluded two paths, so
  // every later route — the plan editor's catalog picker — would have had its URL overwritten by the
  // next render.
  //
  // No active route at all means routing has not run yet: recovery renders the board at boot, ahead
  // of the first resolve. The URL is the source of truth in that window, so writing here would erase
  // the very deep link the router is about to read.
  const routeName = activeRouteName?.();
  if (!routeName) return;
  if (!FOCUS_OWNED_ROUTES.includes(routeName) && routeName !== "session.edit.item") return;
  const current = toRoute(window.location.pathname);
  if (
    !current.startsWith("/session/") ||
    current.startsWith("/session/new") ||
    current.startsWith("/session/setup/")
  )
    return;
  const target = sessionFocusPath();
  // replace, not push: the URL is catching up with the card the trainer is already looking at, and a
  // history entry per card would turn Back into an undo of their own scrolling.
  if (target) replaceRoute(target);
}

export function focusExerciseByIndex(index) {
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  cs.activeExerciseIndex = index;
  // The trainer's first tap on any deck card reveals focus for the rest of this live session — see
  // deckAllCollapsed's own comment (clientRoutines' shape, above startWorkoutSession).
  cs.deckAllCollapsed = false;
  activeSession.expandedPastId = null;
  saveActiveSessionToCache();
  renderActiveGroupBoard();
}

export function openSessionFromHistory(log) {
  const { state, t, navigateToPath } = appDeps;
  if (!state || !t) return;
  clearAllTimers(); // fresh session — never inherit a previous session's timers

  const clientState = buildClientStateFromHistoryLog(log, state.exercises);

  activeSession = {
    id: log.id,
    startTime: new Date(log.date).getTime(),
    duration: log.duration || 0,
    participants: [log.clientId],
    clientRoutines: {
      [log.clientId]: clientState,
    },
    activeClientId: log.clientId,
    feedback: log.feedback || [],
    sourceSession: log.isPlanning
      ? {
          id: `plan-${log.id}`,
          isPlanning: true,
          titles: [log.title || t("planned_program") || "Planned Program"],
          timeLabel: t("date_unknown") || "Date Unknown",
          location: "",
        }
      : null,
  };

  setClipboardEditModeFlag(!!log.isPlanning);

  saveActiveSessionToCache();
  requestScreenWakeLock();

  const bar = document.getElementById("active-session-bar");
  if (bar) {
    bar.classList.remove("hidden", "is-idle");
    delete bar.dataset.nextSessionId;
  }
  renderActiveSessionBarLabels();
  startSessionTimer();

  if (navigateToPath) {
    navigateToPath(`/session/${log.id}/client/${log.clientId}`);
  }
}

export function startWorkoutSession(clientRoutines, sessionMeta = null, deps = {}, options = {}) {
  if (deps) appDeps = { ...appDeps, ...deps };
  const { navigate = true } = options;
  const { state, navigateToPath, t } = appDeps;
  if (!state) return;
  clearAllTimers(); // fresh session — never inherit a previous session's timers

  const participantIds = clientRoutines.map((cr) => cr.clientId);
  const sessionId = sessionMeta ? sessionMeta.id : newRecordId();

  activeSession = {
    id: sessionId,
    started: false,
    startTime: null,
    duration: 0,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    sourceSession: sessionMeta,
  };

  for (const cr of clientRoutines) {
    activeSession.clientRoutines[cr.clientId] = buildClientStateFromRoutine({
      routineId: cr.routineId,
      routines: state.routines,
      exercises: state.exercises,
      emptyPlanName: t("custom_empty_plan") || "Custom / Empty Plan",
    });
  }

  setClipboardEditModeFlag(!!sessionMeta?.isPlanning);

  saveActiveSessionToCache();

  const sId = activeSession.id || newRecordId();
  if (navigate && navigateToPath) {
    navigateToPath(`/session/${sId}/client/${activeSession.activeClientId}`);
  }
}

// Explicit trainer action, mirroring finishWorkoutSession: opening the clipboard only stages the
// session (plan visible, nothing running yet) — the timer, duration, and "live" status only begin
// once the trainer taps Start, same way a session only ends when they tap Complete.
export function beginWorkoutSession() {
  if (!activeSession || activeSession.started) return;
  activeSession.started = true;
  activeSession.startTime = Date.now();
  activeSession.duration = 0;
  saveActiveSessionToCache();
  requestScreenWakeLock();
  startSessionTimer();
  renderActiveGroupBoard();
  // The homepage's "Active session" badge is stamped at renderSessions() time, not derived live —
  // without this, a card only picks up the started session on the NEXT unrelated re-render.
  appDeps.renderSessions?.();
  offerScheduleAdjustment();
}

// Writes an adjusted slot to both places that hold one: the live session's own copy (every
// clipboard countdown reads `sourceSession`) and the persisted session record(s) it was built from
// (the dashboard card, the day timeline and the completed-session stamp read those). A trainer who
// corrects the time in one place expects the other to agree.
function applyAdjustedSchedule({ startMs, endMs }) {
  const sourceSession = activeSession?.sourceSession;
  if (!sourceSession) return;

  const toClock = (ms) => {
    const date = new Date(ms);
    return formatClockFromMinutes(date.getHours() * 60 + date.getMinutes());
  };
  const timeLabel = `${toClock(startMs)} - ${toClock(endMs)}`;

  sourceSession.startDate = new Date(startMs);
  sourceSession.endDate = new Date(endMs);
  sourceSession.timeLabel = timeLabel;

  // The trainer's own answer to "when did this actually start" — what the elapsed clock and the
  // history record's date are both measured from. Never later than now: a start in the future would
  // put the session's own elapsed time back into the negative numbers this dialog exists to end.
  activeSession.startTime = Math.min(startMs, Date.now());
  activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);

  const sessions = Array.isArray(appDeps.state?.sessions) ? appDeps.state.sessions : [];
  for (const session of sessions) {
    const belongsToThisSlot =
      session.id === sourceSession.id ||
      (Array.isArray(sourceSession.ids) && sourceSession.ids.includes(session.id));
    if (belongsToThisSlot) {
      session.time = timeLabel;
      session.startDate = new Date(startMs).toISOString();
    }
  }

  saveActiveSessionToCache();
  appDeps.saveToLocalStorage?.();
  appDeps.renderSessionTitle?.();
  renderActiveSessionBarLabels();
  updateSessionBarTimer();
  updateOverlaySessionTimer();
  appDeps.renderSessions?.();
}

// A session started well outside its slot means the SCHEDULE is wrong, not the trainer — gyms run
// late. Offer to move the slot onto the session (sessionStartTimeDialog.js). Deliberately raised
// after the session is already running, so nothing on the gym floor waits behind a modal.
function offerScheduleAdjustment() {
  const sourceSession = activeSession?.sourceSession;
  const startedAt = activeSession?.startTime;
  if (!startedAt || !isScheduleDriftWorthAdjusting(sourceSession, startedAt)) return;

  const { startMs, endMs } = proposeAdjustedSchedule(sourceSession, startedAt);
  openSessionStartTimeDialog({
    t: appDeps.t,
    scheduledLabel: sourceSession.timeLabel || "",
    driftMs: computeScheduleDriftMs(sourceSession, startedAt),
    proposedStartMs: startMs,
    proposedEndMs: endMs,
    onApply: ({ startValue, endValue }) => {
      const schedule = resolveScheduleFromClockValues({
        baseMs: startedAt,
        startValue,
        endValue,
      });
      if (schedule) applyAdjustedSchedule(schedule);
    },
  });
}

export function startSessionTimer() {
  if (!activeSession || !activeSession.started) return;
  if (activeSession.timerIntervalId) clearInterval(activeSession.timerIntervalId);

  const tick = () => {
    if (!activeSession) return;
    if (activeSession.sourceSession?.isPlanning) {
      updateOverlaySessionTimer();
      updateSessionBarTimer();
      return;
    }
    activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
    updateOverlaySessionTimer();
    updateSessionBarTimer();
    saveActiveSessionToCache();
  };

  activeSession.timerIntervalId = setInterval(tick, 1000);
  tick();
}

// The title bar's live duration, once Start has been tapped: "01h 32m" (formatDurationHourMin),
// the same shorthand the dashboard card's own live/starts-in timers use (sessionCard.js) — one
// countdown shape across the whole app instead of this surface keeping its own H:MM:SS. Once the
// session runs past its scheduled end the wrap gets `.overtime`, which activeSessionOverlay.css
// turns into a warning-coloured pill — the trainer glances at the title bar, not a stopwatch app.
export function updateOverlaySessionTimer() {
  if (!activeSession) return;
  const el = document.getElementById("overlay-session-duration");
  const wrap = document.getElementById("overlay-session-timer");
  if (!el) return;

  const { t } = appDeps;

  if (activeSession.sourceSession?.isPlanning) {
    el.textContent = t("planning") || "Planning";
    wrap?.classList.remove("overtime");
    return;
  }

  const { seconds, isOvertime } = computeActiveSessionCountdown(activeSession);
  el.textContent = formatDurationHourMin(seconds);
  wrap?.classList.toggle("overtime", isOvertime);
}

export function getActiveExercise() {
  if (!activeSession) return null;
  const activeClientId = activeSession.activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];
  if (!activeClientState || activeClientState.exercises.length === 0) return null;
  return activeClientState.exercises[activeClientState.activeExerciseIndex];
}

// The quick-signal RULES live in domain/quickSignals.js; what stays here is the part that knows
// about the live session and the app's persistence — which is exactly the split TODO §24.4 drew.
// These wrappers keep their (clientId, exerciseName, tag) signatures because exerciseDeck.js and
// feedbackModal.js are wired against them.
export function hasQuickSignal(clientId, exerciseName, tag) {
  return hasPlainQuickSignal(activeSession?.feedback, clientId, exerciseName, tag);
}

// Drops every untouched quick-signal entry for this tag from BOTH lists that hold one.
function removeQuickSignal(clientId, exerciseName, tag, state) {
  const removedIds = plainQuickSignalIds(activeSession.feedback, clientId, exerciseName, tag);
  if (removedIds.size === 0) return;
  activeSession.feedback = activeSession.feedback.filter((entry) => !removedIds.has(entry.id));
  state.planUpdates = state.planUpdates.filter((update) => !removedIds.has(update.id));
}

// The mutual-exclusion enforcement point for callers OTHER than logQuickSignal — specifically
// feedbackModal.js, which offers the same "Too Easy"/"Too Hard" tags as its own radio choices and
// writes activeSession.feedback directly rather than through logQuickSignal. Without this, a PT
// submitting the modal with the (default-checked) opposite tag while a quick-tap was already
// active left BOTH plain and "active" simultaneously — found 2026-07-27, the exact bug §8.7's
// mutual-exclusivity fix was meant to close everywhere, not just on the quick-tap path itself.
export function enforceQuickSignalExclusivity(clientId, exerciseName, tag) {
  if (!activeSession) return;
  const { state } = appDeps;
  if (!state) return;
  const opposite = oppositeQuickSignal(tag);
  if (opposite) removeQuickSignal(clientId, exerciseName, opposite, state);
}

// One tap logs the signal; tapping the SAME signal again undoes it — a toggle, not a one-way
// stamp, so a mis-tap on the gym floor doesn't need a trip to the feedback modal to correct.
// Tapping the OPPOSITE signal while one is active swaps it (see OPPOSITE_QUICK_SIGNAL).
export function logQuickSignal(tag, exId) {
  if (!activeSession) return;
  const { state, saveToLocalStorage, renderPendingPlanAdjustments } = appDeps;
  if (!state) return;

  const clientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[clientId];
  if (!clientState || clientState.exercises.length === 0) return;

  const currentExercise =
    (exId && clientState.exercises.find((e) => e.id === exId)) ||
    clientState.exercises[clientState.activeExerciseIndex];

  if (hasQuickSignal(clientId, currentExercise.name, tag)) {
    removeQuickSignal(clientId, currentExercise.name, tag, state);
  } else {
    enforceQuickSignalExclusivity(clientId, currentExercise.name, tag);

    const client = state.clients.find((c) => c.id === clientId);
    const { planUpdate, sessionFeedback } = buildQuickSignalEntries({
      clientId,
      clientName: client ? client.name : "Unknown Client",
      exerciseName: currentExercise.name,
      tag,
    });
    state.planUpdates.push(planUpdate);
    if (!activeSession.feedback) activeSession.feedback = [];
    activeSession.feedback.push(sessionFeedback);

    // Signalling on an exercise implies it was performed — the trainer is reacting to the work,
    // not planning it, so the sets stop asking to be ticked off individually.
    for (const log of clientState.logs[currentExercise.id] || []) {
      log.completed = true;
    }
  }

  saveActiveSessionToCache();
  if (saveToLocalStorage) saveToLocalStorage();
  if (renderPendingPlanAdjustments) renderPendingPlanAdjustments();
  renderActiveGroupBoard();
}

export function getExerciseSignalColor(clientId, exerciseName) {
  return quickSignalColor(activeSession?.feedback, clientId, exerciseName);
}

export function buildCircuitUnits(list) {
  const units = [];
  for (const item of list) {
    if (item.circuitId) {
      const last = units[units.length - 1];
      if (last && last.type === "circuit" && last.circuitId === item.circuitId) {
        last.items.push(item);
        last.isInFocus = last.isInFocus || item.isInFocus;
        last.isCompleted = last.isCompleted && item.isCompleted;
      } else {
        units.push({
          type: "circuit",
          circuitId: item.circuitId,
          title: item.circuitTitle,
          series: item.circuitSeries || 1,
          items: [item],
          isInFocus: item.isInFocus,
          isCompleted: item.isCompleted,
        });
      }
    } else {
      units.push(item);
    }
  }
  return units;
}

export function completeCircuitRound(circuitId) {
  if (!activeSession) return;
  const { saveToLocalStorage } = appDeps;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  if (!cs.circuitRounds) cs.circuitRounds = {};
  const groupExs = cs.exercises.filter((e) => e.circuitId === circuitId && !isRestItem(e));
  if (groupExs.length === 0) return;
  const series = groupExs[0].circuitSeries || 1;
  const cur = cs.circuitRounds[circuitId] || 1;
  if (cur < series) {
    cs.circuitRounds[circuitId] = cur + 1;
  } else {
    for (const ex of groupExs) {
      for (const l of cs.logs[ex.id] || []) {
        l.completed = true;
      }
    }
    // Land focus on whatever comes right after the circuit block — a trailing rest included: that
    // countdown is exactly what's next, and rests are first-class focus targets like any other item.
    let lastIdx = -1;
    {
      let idx = 0;
      for (const it of cs.exercises) {
        if (it.circuitId === circuitId) lastIdx = idx;
        idx++;
      }
    }
    cs.activeExerciseIndex = Math.min(lastIdx + 1, cs.exercises.length - 1);
    cs.deckAllCollapsed = false;
    clampFocusIndex(cs);
    // The block is fully done — a rest/exercise timer still running against it is now stale.
    // Freeze it rather than silently dropping it: the trainer sees it held at its final value
    // and clears it themselves with ✕.
    stopTimerIfMatches(activeSession.activeClientId, { type: "circuit", id: circuitId });
  }
  saveActiveSessionToCache();
  if (saveToLocalStorage) saveToLocalStorage();
  renderActiveGroupBoard();
}

// Start a timer for the ACTIVE client (rest or exercise), labelled with their name so it's clear in
// the stacked, multi-client timer overlay. Deck cards call this with just seconds + type + label.
function startClientTimer(seconds, type = "rest", label = "") {
  if (!activeSession) return;
  const clientId = activeSession.activeClientId;
  const client = appDeps.state?.clients?.find((c) => c.id === clientId);
  const cs = activeSession.clientRoutines[clientId];
  // The SAME ref builder the URL uses: this one used to spell a standalone rest as an "exercise",
  // which focusIndexFromRef refuses to resolve, so tapping the timer card never landed on the rest
  // it was counting down (TODO §24.4).
  const focusRef = focusRefForItem(cs?.exercises?.[cs.activeExerciseIndex]);
  startTimer({
    clientId,
    clientName: client ? client.name : "",
    type,
    label,
    seconds,
    sessionId: activeSession.id,
    focusRef,
  });
}

// Opens the existing "add exercise to session" dialog (also used by the in-clipboard editor).
function openAddSessionExerciseDialog() {
  const modal = document.getElementById("dialog-add-session-exercise");
  const form = document.getElementById("form-add-session-exercise");
  if (!modal || !form) return;
  form.reset();
  modal.showModal();
}

// Navigate to a dialog that hangs off the session the trainer is in. Returns false when there is no
// session to hang it off, so callers can fall back to opening it directly.
function navigateToSessionDialog(routeName, params = {}) {
  const { navigateToPath, urlFor } = appDeps;
  if (!activeSession || !navigateToPath || !urlFor) return false;
  const clientId = activeSession.activeClientId || activeSession.participants[0];
  navigateToPath(urlFor(routeName, { sessionId: activeSession.id, clientId, ...params }));
  return true;
}

// Append a movement to the active client's plan as a fresh, taxonomy-aware item (its own slot id, so
// the same catalog movement can appear twice without colliding logs), then re-render. Shared by the
// typed add-exercise form and the catalog picker.
function injectExerciseIntoActivePlan(baseEx, { sets, reps, weight, rest }) {
  if (!activeSession || !baseEx) return;
  const activeClientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[activeClientId];
  if (!clientState) return;
  const slotId = newRecordId();
  clientState.exercises.push({
    id: slotId,
    exerciseId: baseEx.id,
    name: baseEx.name,
    category: baseEx.category,
    pattern: baseEx.pattern || "",
    instructions: baseEx.instructions || "",
    loadUnit: loadUnitForEquipment(baseEx.equipment),
    modality: modalityOf(baseEx),
    metric: primaryMetricOf(baseEx),
    setsTargetCount: sets,
    repsTarget: reps,
    weightTarget: weight,
    rest,
  });
  clientState.logs[slotId] = Array.from({ length: sets }, () => ({
    reps,
    weight,
    completed: false,
    note: "",
  }));
  clientState.activeExerciseIndex = clientState.exercises.length - 1;
  clientState.deckAllCollapsed = false;
  // Called out in the editor so the injected movement isn't lost in the list. No focus: the catalog
  // already filled the name in, so there is nothing to type.
  markEditorRow(slotId, { kind: "new", focus: false });
  saveActiveSessionToCache();
  renderBoardUnlessDialogIsOpen();
}

// A change made from inside a routed dialog must not re-render the view behind it: the dialog is
// about to close, that close routes, and the routing render is the one the trainer actually sees. A
// render spent behind the dialog also spends the one-shot call-out, so the row would lose its mark.
function renderBoardUnlessDialogIsOpen() {
  if (appDeps.activeRouteIsDialog?.()) return;
  renderActiveGroupBoard();
}

// Retarget an existing plan row at a different movement, keeping the slot: the id, the sets and the
// logs already written against them survive, so a swap changes WHAT is done, never what was done.
function swapPlanItemMovement(slotId, baseEx) {
  if (!activeSession || !baseEx) return;
  const clientState = activeSession.clientRoutines[activeSession.activeClientId];
  const item = clientState?.exercises?.find((e) => e.id === slotId);
  if (!item) return;
  item.exerciseId = baseEx.id;
  item.name = baseEx.name;
  item.category = baseEx.category;
  item.pattern = baseEx.pattern || "";
  item.instructions = baseEx.instructions || "";
  item.loadUnit = loadUnitForEquipment(baseEx.equipment);
  item.modality = modalityOf(baseEx);
  item.metric = primaryMetricOf(baseEx);
  markEditorRow(slotId, { kind: "swap", focus: false });
  saveActiveSessionToCache();
  if (appDeps.saveToLocalStorage) appDeps.saveToLocalStorage();
  renderBoardUnlessDialogIsOpen();
}

// Plan-edit taxonomy browse. Two modes, one dialog:
//  - no `slotId`: "Add from catalog" — inject the chosen movement with sensible defaults;
//  - with `slotId`: the row's 📖 button — swap THAT row's movement in place.
// The picker opens pre-filtered on the row's own muscle group and pre-seeded with whatever the PT
// had already typed in the name field, with the caret in the search box: the common case ("swap this
// press for another press") is then one tap, and a named target is type-then-Enter — no scrolling.
function catalogPickerTitle(slotId, t) {
  return slotId
    ? t("swap_movement") || "Swap movement"
    : t("catalog_picker_title") || "Add from Exercise Catalog";
}

// The movement already on the row is not a swap target. Plans authored before slots carried an
// `exerciseId` (routines, demo data) only know the movement by name, so fall back to that.
function resolveCurrentMovementId(item, state) {
  if (!item) return null;
  return item.exerciseId || state.exercises.find((e) => e.name === item.name)?.id || null;
}

export function openCatalogPicker({ slotId = null, query = "", category = "" } = {}) {
  const dialog = document.getElementById("dialog-catalog-picker");
  const mount = document.getElementById("catalog-picker-mount");
  if (!dialog || !mount || !activeSession) return;
  const { state, t } = appDeps;
  const titleEl = document.getElementById("catalog-picker-title");
  if (titleEl) titleEl.textContent = catalogPickerTitle(slotId, t);

  const clientState = activeSession.clientRoutines[activeSession.activeClientId];
  const item = slotId ? clientState?.exercises?.find((e) => e.id === slotId) : null;
  const currentMovementId = resolveCurrentMovementId(item, state);
  mountExercisePicker(mount, {
    state,
    excludeId: currentMovementId,
    defaultCategory: category || item?.category || "All",
    initialQuery: query,
    autoFocusSearch: true,
    searchLabel: t("search_movements") || "Search movements",
    muscleLabel: t("muscle") || "Muscle",
    equipmentLabel: t("equipment") || "Equipment",
    onSelect: (ex) => {
      if (slotId) swapPlanItemMovement(slotId, ex);
      else injectExerciseIntoActivePlan(ex, { sets: 3, reps: 10, weight: 0, rest: 60 });
      dialog.close();
    },
  });
  dialog.showModal();
}

// The board render itself lives in modules/clipboard/activeSessionBoard.js (TODO §24.3). Kept as a
// named export here because ~15 call sites in this file, plus app.js and the router, already call
// renderActiveGroupBoard() — the seam moved, the entry point did not.
export function renderActiveGroupBoard() {
  renderActiveSessionBoard();
}

// The dashboard mini-bar's own expand affordance + click-through, and its Enter/Space keyboard
// equivalent. Leaving the clipboard is handled globally by the title-bar grab handle + swipe-down
// gesture (setupViewDismiss in app.js), shared with every other view.
function wireSessionExpandBar(navigateToPath, launchClipboardDirectly) {
  const clientTabsBar = document.getElementById("active-session-client-tabs");
  if (clientTabsBar) {
    clientTabsBar.addEventListener("scroll", updateClientTabsFadeState);
  }

  const btnExpandSession = document.getElementById("btn-expand-session");
  if (btnExpandSession) {
    btnExpandSession.addEventListener("click", (e) => {
      e.stopPropagation();
      const activeClientId = activeSession
        ? activeSession.activeClientId || activeSession.participants[0]
        : "";
      const sessionId = activeSession ? activeSession.id || "session" : "session";
      if (navigateToPath) navigateToPath(`/session/${sessionId}/client/${activeClientId}`);
    });
  }

  const sessionBar = document.getElementById("active-session-bar");
  if (!sessionBar) return;
  sessionBar.addEventListener("click", () => {
    if (activeSession) {
      const activeClientId = activeSession.activeClientId || activeSession.participants[0];
      const sessionId = activeSession.id || "session";
      if (navigateToPath) navigateToPath(`/session/${sessionId}/client/${activeClientId}`);
    } else if (sessionBar.dataset.nextSessionId && launchClipboardDirectly) {
      launchClipboardDirectly(sessionBar.dataset.nextSessionId);
    }
  });
  sessionBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      sessionBar.click();
    }
  });
}

// The title bar's ⋯ overflow menu, its Edit-plan trigger, and the Start/Complete/Delete actions
// that hang off it — all of a single overlay-chrome piece, wired together because closeSessionMenu
// is shared between the menu's own outside-tap dismissal and the Delete action inside it.
function wireSessionMenuAndActions(t) {
  const sessionMenuBtn = document.getElementById("btn-session-menu");
  const sessionMenu = document.getElementById("session-menu");
  const closeSessionMenu = () => {
    if (sessionMenu) sessionMenu.classList.add("hidden");
    if (sessionMenuBtn) sessionMenuBtn.setAttribute("aria-expanded", "false");
  };
  if (sessionMenuBtn && sessionMenu) {
    sessionMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !sessionMenu.classList.contains("hidden");
      sessionMenu.classList.toggle("hidden", isOpen);
      sessionMenuBtn.setAttribute("aria-expanded", String(!isOpen));
    });
    document.addEventListener("click", (e) => {
      if (!sessionMenu.classList.contains("hidden") && !e.target.closest(".session-menu-wrap")) {
        closeSessionMenu();
      }
    });
  }

  document.getElementById("btn-edit-plan")?.addEventListener("click", (e) => {
    e.stopPropagation();
    enterClipboardEditMode();
  });

  document.getElementById("btn-delete-session")?.addEventListener("click", () => {
    closeSessionMenu();
    // While editing, this button deletes the PLAN (clears its exercises) and stays in the session;
    // otherwise it cancels the whole session. The label is swapped to match in renderActiveGroupBoard.
    if (isClipboardEditMode()) {
      if (confirm(t("confirm_delete_plan"))) clearActivePlan();
    } else if (confirm(t("confirm_cancel"))) {
      cancelWorkoutSession();
    }
  });

  document
    .getElementById("btn-start-session")
    ?.addEventListener("click", () => beginWorkoutSession());
  document
    .getElementById("btn-finish-session")
    ?.addEventListener("click", () => finishWorkoutSession());
}

function handleAddSessionExerciseSubmit(e, state, addExModal) {
  e.preventDefault();
  const typed = document.getElementById("session-add-select-ex").value.trim();
  const sets = parseInt(document.getElementById("session-add-sets").value);
  const reps = parseInt(document.getElementById("session-add-reps").value);
  const weight = parseFloat(document.getElementById("session-add-weight").value);
  const rest = parseInt(document.getElementById("session-add-rest").value);

  if (!activeSession || !typed || isNaN(sets)) return;

  let baseEx = state.exercises.find((ex) => ex.name.toLowerCase() === typed.toLowerCase());
  if (!baseEx) {
    baseEx = { id: newRecordId(), name: typed, category: "Custom", instructions: "" };
  }

  injectExerciseIntoActivePlan(baseEx, { sets, reps, weight, rest });
  addExModal.close();
}

function wireAddExerciseAndCatalogDialogs(state) {
  const addExModal = document.getElementById("dialog-add-session-exercise");
  const addExForm = document.getElementById("form-add-session-exercise");
  if (!addExModal || !addExForm) return;

  const btnAddExToSession = document.getElementById("btn-add-exercise-to-session");
  if (btnAddExToSession) {
    btnAddExToSession.addEventListener("click", () => {
      addExForm.reset();
      addExModal.showModal();
    });
  }

  const cancelBtn = addExModal.querySelector(".modal-cancel");
  const closeBtn = addExModal.querySelector(".modal-close-btn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => addExModal.close());
  if (closeBtn) closeBtn.addEventListener("click", () => addExModal.close());

  // Catalog picker dialog: only needs a close affordance — selecting a movement injects + closes it.
  const catalogModal = document.getElementById("dialog-catalog-picker");
  const catalogCloseBtn = catalogModal?.querySelector(".modal-close-btn");
  if (catalogCloseBtn) catalogCloseBtn.addEventListener("click", () => catalogModal.close());

  addExForm.addEventListener("submit", (e) => handleAddSessionExerciseSubmit(e, state, addExModal));
}

export function setupActiveSession(deps) {
  if (deps) appDeps = { ...appDeps, ...deps };
  renderActiveSessionOverlayShell();
  renderAddSessionExerciseDialog();
  renderCatalogPickerDialog();
  const { state, t, navigateToPath, launchClipboardDirectly } = appDeps;

  wireSessionExpandBar(navigateToPath, launchClipboardDirectly);
  wireSessionMenuAndActions(t);
  wireAddExerciseAndCatalogDialogs(state);
}

// Edit-mode "Delete Plan": empty the active client's plan (exercises + their logs + circuit rounds)
// so the trainer can rebuild from scratch, keeping the session itself open and still in edit mode.
export function clearActivePlan() {
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  cs.exercises = [];
  cs.logs = {};
  cs.circuitRounds = {};
  cs.activeExerciseIndex = 0;
  saveActiveSessionToCache();
  if (appDeps.saveToLocalStorage) appDeps.saveToLocalStorage();
  renderActiveGroupBoard();
}

export function cancelWorkoutSession() {
  const { state, navigateToPath, focusSessionsColumn, saveToLocalStorage } = appDeps;
  // An explicit delete of a planning session must also drop its draft(s) from state.history —
  // otherwise a discarded plan keeps reappearing in the "unscheduled plans" notification message
  // it backs (syncPlanningSnapshotToHistory), which reads as the delete having silently failed.
  if (activeSession?.sourceSession?.isPlanning && state && Array.isArray(state.history)) {
    const participants = new Set(activeSession.participants || []);
    state.history = state.history.filter((h) => !(h.isPlanning && participants.has(h.clientId)));
    if (saveToLocalStorage) saveToLocalStorage();
  }
  if (activeSession?.timerIntervalId) {
    clearInterval(activeSession.timerIntervalId);
  }
  releaseScreenWakeLock();
  activeSession = null;
  setClipboardEditModeFlag(false);
  clearActiveSessionCache();
  clearAllTimers(); // timers are session-scoped

  renderIdleSessionBar();

  if (navigateToPath) navigateToPath("/");
  if (focusSessionsColumn) focusSessionsColumn("today", "smooth");
}

// Confirm only when finishing meaningfully early — more than 10 minutes still on the countdown.
// Near the scheduled end or in overrun (<=10 min or negative), complete silently. Returns whether
// the trainer wants to proceed (always true when there's nothing to confirm).
function confirmEarlyFinish(t) {
  const endDate = activeSession.sourceSession?.endDate;
  if (!endDate || activeSession.sourceSession?.isPlanning) return true;
  const remainingMin = (new Date(endDate).getTime() - Date.now()) / 60000;
  if (remainingMin <= 10) return true;
  const msg = t("confirm_finish_early").replace("{min}", String(Math.round(remainingMin)));
  return confirm(msg);
}

function countCompletedSets() {
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
function stampSourceSessionsCompleted(state, sessionDuration) {
  const ss = activeSession.sourceSession;
  if (!ss || ss.isPlanning) return;
  const sessions = Array.isArray(state.sessions) ? state.sessions : [];
  for (const session of sessions) {
    if (session.id === ss.id || (Array.isArray(ss.ids) && ss.ids.includes(session.id))) {
      session.completed = true;
      session.duration = sessionDuration;
    }
  }
}

// Log a record for every participant who performed something (skipped work is kept alongside it),
// or always for a planning template. A session where nothing was done writes no history — the
// record's own shape and that judgement both live in domain/sessionHistoryRecord.js.
function appendHistoryRecordsForParticipants(state, sessionDateISO, sessionDuration) {
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
  if (!activeSession) return;
  const { state, t, saveToLocalStorage, navigateToPath } = appDeps;
  if (!state || !t) return;

  if (!confirmEarlyFinish(t)) return;

  const completedSets = countCompletedSets();
  if (
    completedSets === 0 &&
    !activeSession.sourceSession?.isPlanning &&
    !confirm(t("alert_no_sets"))
  ) {
    return;
  }

  const sessionDateISO = new Date(activeSession.startTime).toISOString();
  const sessionDuration = activeSession.duration;

  stampSourceSessionsCompleted(state, sessionDuration);
  appendHistoryRecordsForParticipants(state, sessionDateISO, sessionDuration);

  if (saveToLocalStorage) saveToLocalStorage();

  cancelWorkoutSession();

  renderClientsList({ state, t });
  renderRoutinesList({ state, t });
  renderGlobalHistory({ state, t });

  if (navigateToPath) navigateToPath("/history");
}

// A planning-mode clipboard has no Start/Finish footer (currentPlanMode() === "planning" hides it
// entirely — see renderActiveGroupBoard), so finishWorkoutSession() never runs for one. Without
// this, a planning session simply vanishes the moment the trainer opens a different session (the
// single activeSession slot is replaced) or leaves without saving anywhere durable. Every cache
// sync while editing one upserts the CURRENT snapshot into state.history — the exact shape
// finishWorkoutSession already writes for a real session (isPlanning:true), and the exact shape
// openSessionFromHistory already knows how to reopen — matched by clientId so re-editing updates
// the same record instead of piling up duplicates (one open draft per client at a time). This is
// what backs the notification feed's "unscheduled plans" list (renderNotificationArea).
function syncPlanningSnapshotToHistory() {
  if (!activeSession?.sourceSession?.isPlanning) return;
  const { state, saveToLocalStorage } = appDeps;
  if (!state) return;
  if (!Array.isArray(state.history)) state.history = [];

  const title = activeSession.sourceSession.titles?.[0] || "";
  const nowISO = new Date().toISOString();

  for (const pId of activeSession.participants) {
    const draft = buildSessionHistoryRecord({
      client: state.clients.find((c) => c.id === pId),
      clientState: activeSession.clientRoutines[pId],
      feedback: activeSession.feedback || [],
      dateISO: nowISO,
      duration: 0,
      isPlanning: true,
      title,
    });
    if (draft) upsertPlanningRecord(state.history, draft);
  }
  if (saveToLocalStorage) saveToLocalStorage();
}

export function saveActiveSessionToCache() {
  saveActiveSessionToCacheHelper(activeSession);
  syncPlanningSnapshotToHistory();
}

export function recoverActiveSession() {
  const parsed = readActiveSessionCache();
  if (!parsed) return;

  try {
    activeSession = parsed;
    activeSession.duration = activeSession.started
      ? Math.floor((Date.now() - activeSession.startTime) / 1000)
      : 0;

    if (activeSession.sourceSession) {
      activeSession.sourceSession.startDate = new Date(activeSession.sourceSession.startDate);
      activeSession.sourceSession.endDate = new Date(activeSession.sourceSession.endDate);
    }

    if (isCachedSessionStale(activeSession)) {
      activeSession = null;
      clearActiveSessionCache();
      renderIdleSessionBar();
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
    const bootRoute = appDeps.resolveRoute?.(window.location.pathname);
    if (bootRoute?.isEditor) {
      setClipboardEditModeFlag(true);
      markEditorRow(bootRoute.params.slotId ?? null, { kind: "restored", focus: false });
    }

    const bar = document.getElementById("active-session-bar");
    if (bar) {
      bar.classList.remove("hidden", "is-idle");
      delete bar.dataset.nextSessionId;
    }
    renderActiveSessionBarLabels();

    renderActiveGroupBoard();
    restoreSessionTimers();
    if (activeSession.started) {
      startSessionTimer();
      requestScreenWakeLock();
    }
  } catch (e) {
    console.error("Error recovering active session cache:", e);
  }
}
