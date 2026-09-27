// src/domain/adjustmentSuggestion.js — what the adjustment dialog proposes for the exercise a
// feedback signal was about.
//
// The starting point is the routine's current target when a routine holds the exercise, and
// otherwise what the client actually did in the session the signal was given in. A session built
// on the gym floor from an empty plan belongs to no routine; the dialog then added the 2.5 kg step
// to nothing and proposed 2.5 kg for a squat done at 40 kg. With neither, no number is offered.
//
// Pure: history and records in, numbers out.

import { exerciseRecordsOf } from "./sessionItemRecord.js";

const LOAD_STEP_KG = 2.5;

/** Weight, reps and sets of the exercise in the session the signal came from, or null. The
 *  session record keeps each signal under the same id as its review entry, so this finds the
 *  exact session rather than guessing by date. */
export function performedTarget(history, update) {
  const log = (history || []).find((entry) =>
    (entry.feedback || []).some((signal) => signal.id === update.id),
  );
  const record = log
    ? exerciseRecordsOf(log.exercises || []).find((item) => item.name === update.exerciseName)
    : null;
  const sets = Array.isArray(record?.sets) ? record.sets : [];
  if (sets.length === 0) return null;
  const last = sets[sets.length - 1];
  return {
    weight: Math.max(...sets.map((set) => Number(set.weight) || 0)),
    reps: last.reps,
    sets: sets.length,
  };
}

/** The dialog's starting values: the base target with the load moved one step for Too Easy or
 *  Too Hard. Empty strings when there is no base, so the fields stay blank. */
export function suggestedTarget({ routineEntry, performed, tagId }) {
  const base = routineEntry || performed;
  if (!base) return { weight: "", reps: "", sets: "" };
  const weight = Number(base.weight) || 0;
  const step = tagId === "too_easy" ? LOAD_STEP_KG : tagId === "too_hard" ? -LOAD_STEP_KG : 0;
  return { weight: Math.max(0, weight + step), reps: base.reps, sets: base.sets };
}
