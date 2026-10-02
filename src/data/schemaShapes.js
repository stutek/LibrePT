// src/data/schemaShapes.js — one whole state between the shape memory holds and the shape a
// schema's store holds.
//
// Single responsibility: the two places where a training changes shape. Memory holds the new
// session model (`clientPrograms`, `exerciseNotes`, `sessionAttendance`; recordSchemas.js). A store,
// a backup file or a legacy blob written by an older build holds the old shape (`history`,
// `planUpdates`). Everything read from such a source passes `toDomainState` before anything uses
// it, and every store of a schema that still declares the old shape is written from
// `stateForSchema`. Converting in these two places only is what lets schemas 4 and 5 stay live beside
// the new one (ruled 2026-10-02, Simon) with no feature code knowing which shape a store holds.
//
// The conversion of one training lives in sessionModelConversion.js; this decides WHEN it runs.
//
// Injected dependencies: none — pure functions over plain state objects.

import { libraryExercises } from "./exerciseLibrary.js";
import { LIVE_SCHEMAS } from "./recordSchemas.js";
import { historyFromSessionModel, sessionModelFromHistory } from "./sessionModelConversion.js";

/** The collections of the old training shape: absent from schema 6, and converted, never dropped,
 * wherever they arrive. The one exception to "a newer schema only adds" (recordSchemas.test.mjs). */
export const CONVERTED_COLLECTIONS = ["history", "planUpdates"];
const NEW_COLLECTIONS = ["clientPrograms", "exerciseNotes", "sessionAttendance"];

/** Whether a schema's store holds trainings in the old shape. */
export function holdsOldTrainingShape(schema) {
  const shape = LIVE_SCHEMAS[schema];
  return Boolean(shape?.history) && !shape?.clientPrograms;
}

function mergedById(existing, added) {
  const byId = new Map((existing || []).map((record) => [record.id, record]));
  for (const record of added) if (!byId.has(record.id)) byId.set(record.id, record);
  return [...byId.values()];
}

/**
 * A state in the shape memory holds. Old-shape collections are converted and removed; a state that
 * holds none comes back unchanged. Records already in the new shape win over a conversion with the
 * same id, so a state holding both — written while a build changed — keeps its newer facts.
 */
export function toDomainState(state) {
  if (!state || !CONVERTED_COLLECTIONS.some((key) => Array.isArray(state[key]))) return state;
  const model = sessionModelFromHistory({
    history: state.history || [],
    planUpdates: state.planUpdates || [],
    sessions: state.sessions || [],
    routines: state.routines || [],
    // The whole library, the built-in catalogue too: it is not stored, and an old record's
    // exercise may well be one of it.
    exercises: libraryExercises(state),
  });
  const next = { ...state };
  for (const key of CONVERTED_COLLECTIONS) delete next[key];
  for (const key of NEW_COLLECTIONS) next[key] = mergedById(state[key], model[key]);
  return next;
}

/** The state one schema's store is written from: memory's own, or the old shape built from it. */
export function stateForSchema(domainState, schema) {
  if (!holdsOldTrainingShape(schema)) return domainState;
  return {
    ...domainState,
    ...historyFromSessionModel({
      clientPrograms: domainState.clientPrograms || [],
      exerciseNotes: domainState.exerciseNotes || [],
      clients: domainState.clients || [],
    }),
  };
}
