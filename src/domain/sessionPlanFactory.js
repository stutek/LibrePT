// src/domain/sessionPlanFactory.js — builds a live session's per-client plan (`clientState`) from
// the two things a session can start from: a stored history/planning snapshot, or a routine.
//
// Pure: every input arrives as an argument and nothing here touches the DOM, storage, or the
// active session. That is what makes it `domain/` rather than part of the controller it came out
// of (TODO §24.4) — the plan's SHAPE is a training rule, while deciding when to build one is
// orchestration.
//
// The `clientState` shape it produces:
//   { routineId, routineName, activeExerciseIndex, deckAllCollapsed, exercises: [], logs: {} }
// `exercises` is an ordered mix of first-class items — exercise items and rest items — and
// `activeExerciseIndex` points INTO that array, which is why order has to be right before the
// first item is pushed rather than sorted afterwards.

import { newRecordId } from "../data/recordId.js";
import { orderedItems } from "../data/sessionItemOrder.js";
import { modalityOf, primaryMetricOf } from "./exerciseModality.js";
import { loadUnitForEquipment } from "./repsAndLoad.js";
import { isRestRecord } from "./sessionItemRecord.js";

// The live plan item and the frozen history record share one shape (sessionItemRecord.js's own
// header), so this is the one canonical predicate; re-exported under the name this app's call sites
// read naturally with.
export const isRestItem = isRestRecord;

// A fresh plan opens with every deck card collapsed (exerciseDeck.js reads this to skip rendering
// ANY card in focus) until the trainer taps one, which reveals focus for the rest of the session.
// activeExerciseIndex still points at a real item throughout — this flag only gates whether the
// deck's render honours it, so every OTHER consumer keeps working unmodified.
const DECK_STARTS_COLLAPSED = true;

// Legacy plans (routines, recovered/demo sessions) carried rest as a number on the exercise. Turn
// any such `rest>0` into a following rest item. Idempotent: it zeroes the exercise's rest as it
// migrates, so re-running is a no-op. Keeps the focus pointer on the same exercise object.
export function ensureRestItems(clientState) {
  if (!clientState || !Array.isArray(clientState.exercises)) return;
  const focused = clientState.exercises[clientState.activeExerciseIndex];
  let changed = false;
  const out = [];
  for (const item of clientState.exercises) {
    out.push(item);
    if (!isRestItem(item) && item.rest > 0) {
      out.push({
        id: `rest-${item.id}`,
        type: "rest",
        rest: item.rest,
        circuitId: item.circuitId || null,
        circuitTitle: item.circuitTitle || "",
        circuitSeries: item.circuitSeries || 1,
      });
      item.rest = 0;
      changed = true;
    }
  }
  if (changed) {
    clientState.exercises = out;
    const focusedIndex = out.indexOf(focused);
    clientState.activeExerciseIndex = focusedIndex >= 0 ? focusedIndex : 0;
    clampFocusIndex(clientState);
  }
}

// Bounds-only: after a deletion/reorder the pointer may run past the end of a shorter array. This
// used to also steer the pointer off any rest item ("rests aren't focusable") — that exception is
// gone (rests are first-class plan items now), so all that is left to guard against is running off
// the end of the array.
export function clampFocusIndex(clientState) {
  if (!clientState || !clientState.exercises || !clientState.exercises.length) return;
  const { activeExerciseIndex, exercises } = clientState;
  if (activeExerciseIndex >= exercises.length || activeExerciseIndex < 0) {
    clientState.activeExerciseIndex = exercises.length - 1;
  }
}

function historyRestItemToPlanItem(item) {
  return {
    id: newRecordId(),
    type: "rest",
    rest: item.rest || 0,
    circuitId: item.circuitId || null,
    circuitTitle: item.circuitTitle || "",
    circuitSeries: item.circuitSeries || 1,
  };
}

// One performed-exercise record from a history/planning snapshot, rebuilt into a live plan item
// plus its logs. `catalogEntry` is the movement if it still exists in the catalog (falls back to
// the snapshot's own fields for a renamed/deleted or anonymized movement — TODO §17.1).
function historyExerciseItemToPlanItem(item, exercises) {
  const catalogEntry = exercises.find((e) => e.id === item.id || e.name === item.name);
  const sets = Array.isArray(item.sets) ? item.sets : [];
  const planItem = {
    id: item.id,
    name: item.name,
    category: catalogEntry ? catalogEntry.category : "Recovery",
    pattern: catalogEntry ? catalogEntry.pattern : "",
    instructions: catalogEntry ? catalogEntry.instructions : "",
    setsTargetCount: sets.length || 1,
    repsTarget: sets[0]?.reps || 0,
    weightTarget: sets[0]?.weight || 0,
    // Prefer the snapshot's own logging axes (so an anonymized/renamed movement still logs right),
    // falling back to the catalog entry for legacy rows that never stored them.
    loadUnit: item.loadUnit || loadUnitForEquipment(catalogEntry?.equipment),
    modality: item.modality || modalityOf(catalogEntry),
    metric: item.metric || primaryMetricOf(catalogEntry),
    circuitId: item.circuitId || null,
    circuitTitle: item.circuitTitle || "",
    circuitSeries: item.circuitSeries || 1,
  };
  const logs = sets.map((set) => ({
    reps: set.reps,
    weight: set.weight,
    completed: set.completed,
    note: set.note || "",
  }));
  return { planItem, logs };
}

// Rebuild the live plan from a stored history/planning snapshot, restoring rests and circuit
// grouping — not just the performed exercises (TODO §17.1). Read in the record's OWN program order
// (TODO §17.5): the array it arrives in is a storage detail.
export function buildClientStateFromHistoryLog(log, exercises) {
  const clientState = {
    routineId: log.routineId || "",
    routineName: log.routineName,
    activeExerciseIndex: 0,
    deckAllCollapsed: DECK_STARTS_COLLAPSED,
    exercises: [],
    logs: {},
  };

  for (const item of orderedItems(log.exercises)) {
    if (isRestRecord(item)) {
      clientState.exercises.push(historyRestItemToPlanItem(item));
      continue;
    }
    const { planItem, logs } = historyExerciseItemToPlanItem(item, exercises);
    clientState.exercises.push(planItem);
    clientState.logs[item.id] = logs;
  }

  return clientState;
}

function populateClientStateExercisesFromRoutine(clientState, routine, exercises) {
  for (const item of routine.exercises) {
    const catalogEntry = exercises.find((e) => e.id === item.id);
    if (!catalogEntry) continue;
    clientState.exercises.push({
      id: item.id,
      name: catalogEntry.name,
      category: catalogEntry.category,
      pattern: catalogEntry.pattern,
      instructions: catalogEntry.instructions,
      setsTargetCount: item.sets,
      repsTarget: item.reps,
      weightTarget: item.weight,
      loadUnit: loadUnitForEquipment(catalogEntry.equipment),
      modality: modalityOf(catalogEntry),
      metric: primaryMetricOf(catalogEntry),
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
}

// `emptyPlanName` is passed in already translated: a plan's fallback label is UI copy, and this
// module has no business reaching for a dictionary.
export function buildClientStateFromRoutine({ routineId, routines, exercises, emptyPlanName }) {
  const routine = routines.find((r) => r.id === routineId);
  const clientState = {
    routineId: routine ? routine.id : "",
    routineName: routine ? routine.name : emptyPlanName,
    activeExerciseIndex: 0,
    deckAllCollapsed: DECK_STARTS_COLLAPSED,
    exercises: [],
    logs: {},
  };
  if (routine) populateClientStateExercisesFromRoutine(clientState, routine, exercises);
  return clientState;
}
