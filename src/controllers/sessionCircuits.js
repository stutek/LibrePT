// src/controllers/sessionCircuits.js — circuits as the deck sees them. Single responsibility: GROUP a
// flat plan into circuit units for rendering, and advance a circuit through its rounds when the
// trainer taps it done. Injected dependencies: the session and `saveToLocalStorage` arrive through
// activeSessionStore.js; the plan vocabulary is domain/sessionPlanFactory.js.

import { clampFocusIndex, isRestItem } from "../domain/sessionPlanFactory.js";
import { renderActiveSessionBoard } from "../modules/clipboard/activeSessionBoard.js";
import { stopTimerIfMatches } from "../modules/clipboard/exerciseAndRestTimer.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

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
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const { saveToLocalStorage } = getAppDeps();
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
  renderActiveSessionBoard();
}
