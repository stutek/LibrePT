// src/modules/common/sessionItemRecord.js — the immutable program snapshot stored in history.
//
// TODO §17.1: a finished session must persist the WHOLE structured program, not just the performed
// sets. Previously finishWorkoutSession flattened a session to completed exercises only, dropping
// rests, circuit grouping, and prescribed-but-skipped exercises — so re-opening a past session lost
// its structure and it could not seed a faithful template.
//
// Shape — a history record's `exercises` array is an ordered list of typed items, EVERY item
// carrying an id (TODO §18.2 treats a record's `id` as its lineageId — an item with none cannot be
// individually addressed once items stop living only inside their parent's array):
//   • exercise: { type:'exercise', id, name, loadUnit, modality, metric, completed, sets:[…],
//                 circuitId, circuitTitle, circuitSeries }
//   • rest:     { type:'rest', id, rest:<seconds>, circuitId, circuitTitle, circuitSeries }
// Circuits are NOT a stored container — they are a RENDER-time grouping over consecutive items that
// share a circuitId (buildCircuitUnits, the same unit the live deck folds). Keeping the stored form
// a flat typed array means history and the live session share ONE model, with nothing to keep in sync;
// and because a completed record is immutable, the contiguity a circuit relies on is frozen for good.
//
// Back-compat: legacy history rows (and the DEFAULT_HISTORY seed for strength work) are a flat list of
// exercise leaves with no `type`, no `completed`, and no circuit fields. The guards below treat any
// item that is not an explicit rest as an exercise, and readers treat a missing `completed` as done —
// so old rows render exactly as before.

import { newRecordId } from "./recordId.js";
import { assignPositions, orderedItems } from "./sessionItemOrder.js";

export const isRestRecord = (item) => !!item && item.type === "rest";
export const isExerciseRecord = (item) => !!item && !isRestRecord(item);

// A logged exercise counts as skipped only when explicitly flagged completed:false. Legacy rows have
// no flag and are treated as completed (they only ever stored performed work).
export const isSkippedRecord = (item) => isExerciseRecord(item) && item.completed === false;

// Exercise leaves only (rests filtered out) — for analytics, last-performance, feedback matching and
// the backup round-trip, which all care about movements, not the rest/circuit scaffolding.
// Reads in program order, not array order: a record that has been through a projection or a per-row
// store arrives keyed, not sequenced (TODO §17.5). Legacy rows with no position keep arrival order.
export function exerciseRecordsOf(items) {
  return orderedItems(items).filter(isExerciseRecord);
}

function buildRestSnapshotItem(it) {
  return {
    type: "rest",
    // The live editor already stamps an id on every rest it creates (clipboardEditor.js's
    // makeRest); this snapshot must not be where that identity is silently dropped. The
    // fallback exists for rests older than that — never for anything this build creates.
    id: it.id || newRecordId(),
    rest: it.rest || 0,
    circuitId: it.circuitId || null,
    circuitTitle: it.circuitTitle || "",
    circuitSeries: it.circuitSeries || 1,
  };
}

// A movement with no logged sets is kept as its prescription (uncompleted), so the record still
// shows what was programmed but not reached.
function resolvePrescribedSets(it) {
  return Array.from({ length: Math.max(1, it.setsTargetCount ?? it.sets ?? 1) }, () => ({
    reps: it.repsTarget ?? it.reps ?? 0,
    weight: it.weightTarget ?? it.weight ?? 0,
    completed: false,
    note: "",
  }));
}

function buildExerciseSnapshotItem(it, logs, isPlanning) {
  const loggedSets = logs.map((l) => ({
    reps: l.reps,
    weight: l.weight,
    completed: !!l.completed,
    note: l.note || "",
  }));
  const anyCompleted = loggedSets.some((s) => s.completed);
  const sets = loggedSets.length ? loggedSets : resolvePrescribedSets(it);

  return {
    type: "exercise",
    id: it.id,
    name: it.name,
    loadUnit: it.loadUnit || "kg",
    modality: it.modality || "strength",
    metric: it.metric || "reps",
    // A planning template is prescription only — never "performed"; live sessions mark completion
    // from whether any set was logged done.
    completed: isPlanning ? false : anyCompleted,
    circuitId: it.circuitId || null,
    circuitTitle: it.circuitTitle || "",
    circuitSeries: it.circuitSeries || 1,
    sets,
  };
}

// Build the immutable program snapshot for one client from their live session state. Keeps EVERY
// planned item: rests pass through; each exercise records its performed sets (or, if nothing was
// logged, its prescription as uncompleted sets) plus a completed flag, so a skipped movement is
// retained as a deliberate review signal rather than silently dropped.
export function buildProgramSnapshot(clientState, { isPlanning = false } = {}) {
  const items = [];
  for (const it of orderedItems(clientState.exercises)) {
    if (isRestRecord(it)) {
      items.push(buildRestSnapshotItem(it));
      continue;
    }
    items.push(buildExerciseSnapshotItem(it, clientState.logs[it.id] || [], isPlanning));
  }
  // The record is frozen from here on, so its order must be carried in it — this is the one write
  // whose output outlives every array it was ever held in (TODO §17.5).
  return assignPositions(items);
}
