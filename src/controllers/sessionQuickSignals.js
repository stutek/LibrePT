// src/controllers/sessionQuickSignals.js — one-tap "too easy / too hard / note" marks on a live
// exercise. Single responsibility: MUTATE the session's feedback and the app's plan-adjustment queue
// in step; the RULES (what supersedes what, which colour a card takes) are pure and live in
// domain/quickSignals.js — exactly the split TODO §24.4 drew. Injected dependencies: `state`,
// `saveToLocalStorage` and `renderPendingPlanAdjustments` arrive through activeSessionStore.js.
//
// The (clientId, exerciseName, tag) signatures are kept because exerciseDeck.js and feedbackModal.js
// are wired against them.

import {
  buildQuickSignalEntries,
  hasExerciseNote as hasPlainExerciseNote,
  hasQuickSignal as hasPlainQuickSignal,
  oppositeQuickSignal,
  plainQuickSignalIds,
  quickSignalColor,
} from "../domain/quickSignals.js";
import { renderActiveSessionBoard } from "../modules/clipboard/activeSessionBoard.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

export function hasQuickSignal(clientId, exerciseName, tag) {
  return hasPlainQuickSignal(getActiveSession()?.feedback, clientId, exerciseName, tag);
}

// Drops every untouched quick-signal entry for this tag from BOTH lists that hold one.
function removeQuickSignal(clientId, exerciseName, tag, state) {
  const activeSession = getActiveSession();
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
  if (!getActiveSession()) return;
  const { state } = getAppDeps();
  if (!state) return;
  const opposite = oppositeQuickSignal(tag);
  if (opposite) removeQuickSignal(clientId, exerciseName, opposite, state);
}

// One tap logs the signal; tapping the SAME signal again undoes it — a toggle, not a one-way
// stamp, so a mis-tap on the gym floor doesn't need a trip to the feedback modal to correct.
// Tapping the OPPOSITE signal while one is active swaps it (see OPPOSITE_QUICK_SIGNAL).
export function logQuickSignal(tag, exId) {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const { state, saveToLocalStorage, renderPendingPlanAdjustments } = getAppDeps();
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
  renderActiveSessionBoard();
}

// "Is there a written or voice note on this exercise?" — the deck's note mark. Same wrapper shape
// as hasQuickSignal above, for the same reason: the rule is pure and lives in domain/quickSignals.js.
export function hasExerciseNote(clientId, exerciseName) {
  return hasPlainExerciseNote(getActiveSession()?.feedback, clientId, exerciseName);
}

export function getExerciseSignalColor(clientId, exerciseName) {
  return quickSignalColor(getActiveSession()?.feedback, clientId, exerciseName);
}
