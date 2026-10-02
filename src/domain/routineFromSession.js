// src/domain/routineFromSession.js — a finished session, turned into a routine the trainer can reuse.
//
// Pure: no DOM, no storage. The caller stores the routine and opens it.
//
// What is kept is the PRESCRIPTION: which movements, in what order, how many sets, the reps target,
// the rest after each, and the circuit grouping. What is dropped is what belonged to that day and
// that person: every weight becomes 0, and for a movement counted in time, distance, calories or
// watts the number in `reps` is that day's magnitude, so it is reset to the value the routine editor
// itself uses for an empty reps field (parseReps("")). A skipped movement is kept: it was prescribed.
//
// A routine stores rest on the exercise before it (buildClientStateFromRoutine reads `item.rest`),
// while a session record stores rest as an item of its own. A rest item is therefore added to the
// movement before it; a rest with no kept movement before it has nothing to belong to and is dropped.
//
// A routine item's id must be a movement in the library. A record item's id is a library id for
// most items; otherwise the movement is found by name with catalogMatch.js's own rule. An item that
// matches nothing is left out and counted, so the trainer is told.
//
// Provenance is soft, as text in the routine's description. A field pointing back at the program
// would make program → routine → program, which the migration order forbids.

import { localDateString } from "../data/calendarDay.js";
import { newRecordId } from "../data/recordId.js";
import { orderedItems } from "../data/sessionItemOrder.js";
import { normalise } from "./catalogMatch.js";
import { primaryMetricOf } from "./exerciseModality.js";
import { parseReps } from "./repsAndLoad.js";
import { isRestRecord } from "./sessionItemRecord.js";

const DEFAULT_SETS = 1;

function libraryMatcher(library) {
  const byId = new Map(library.map((movement) => [movement.id, movement]));
  const byName = new Map(library.map((movement) => [normalise(movement.name), movement]));
  return (item) => byId.get(item.id) || byName.get(normalise(item.name)) || null;
}

// `name (2)`, `name (3)` … the first that no existing routine uses.
function uniqueName(name, taken) {
  if (!taken.has(name)) return name;
  let n = 2;
  while (taken.has(`${name} (${n})`)) n += 1;
  return `${name} (${n})`;
}

function routineItemFrom(item, movement) {
  const sets = Array.isArray(item.sets) ? item.sets : [];
  const metric = item.metric || primaryMetricOf(movement);
  const target = sets[0]?.reps;
  const routineItem = {
    id: movement.id,
    sets: sets.length || DEFAULT_SETS,
    reps: metric === "reps" && target != null ? target : parseReps(""),
    weight: 0,
    rest: 0,
  };
  if (item.circuitId) {
    routineItem.circuitId = item.circuitId;
    routineItem.circuitTitle = item.circuitTitle || "";
    routineItem.circuitSeries = item.circuitSeries || 1;
  }
  return routineItem;
}

/**
 * @param {object} args
 * @param {object} args.log        the performed program (data/trainingRecords.js)
 * @param {object[]} args.library  libraryExercises(state)
 * @param {object[]} args.routines the routines that exist, for a name that is not taken
 * @param {string} args.fallbackName name used when the record has no routine name
 * @param {string} [args.emptyPlanName] the text a session without a routine is recorded under
 * @param {string} [args.sessionTitle] the title of the session the record came from, if known
 * @param {string} args.provenance text with `{date}`, written into the description
 * @returns {{ routine: object, omitted: number }}
 */
export function buildRoutineFromRecord({
  log,
  library,
  routines,
  fallbackName,
  provenance,
  emptyPlanName = "",
  sessionTitle = "",
}) {
  const find = libraryMatcher(library);
  const exercises = [];
  let omitted = 0;
  let previous = null; // the kept routine item a following rest belongs to

  for (const item of orderedItems(log.exercises)) {
    if (isRestRecord(item)) {
      if (previous) previous.rest += item.rest || 0;
      continue;
    }
    const movement = find(item);
    if (!movement) {
      omitted += 1;
      previous = null;
      continue;
    }
    previous = routineItemFrom(item, movement);
    exercises.push(previous);
  }

  const date = localDateString(log.performedAt);
  const taken = new Set(routines.map((routine) => routine.name));
  // A session that had no routine is recorded under the empty-plan text; that is not a name.
  const recorded = log.routineName && log.routineName !== emptyPlanName ? log.routineName : "";
  const base = `${recorded || sessionTitle || fallbackName} ${date}`;
  const routine = {
    id: newRecordId(),
    name: uniqueName(base, taken),
    description: provenance.replace("{date}", date),
    exercises,
  };
  return { routine, omitted };
}
