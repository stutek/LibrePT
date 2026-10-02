// src/data/schemaShapes.js — a whole state written by an older build, in the shape memory holds.
//
// Single responsibility: the one place where trainings change shape on their way in. Memory holds
// the session model (`clientPrograms`, `exerciseNotes`, `sessionAttendance`; recordSchemas.js). What
// an older build wrote holds the old shape (`history`, `planUpdates`): a backup file, a Drive sync
// file, a legacy blob, and a phone's store of a retired schema read once at the first boot. Each
// passes `toDomainState` before anything uses it, so no feature code knows the old shape existed.
// Nothing writes the old shape: schemas 4 and 5 are retired (ruled 2026-10-02, Simon).
//
// The conversion of one training lives in sessionModelConversion.js; this decides WHEN it runs.
//
// Injected dependencies: none — pure functions over plain state objects.

import { libraryExercises } from "./exerciseLibrary.js";
import { sessionModelFromHistory } from "./sessionModelConversion.js";

/** The collections of the old training shape: absent from schema 6, and converted, never dropped,
 * wherever they arrive. The one exception to "a newer schema only adds" (recordSchemas.test.mjs). */
export const CONVERTED_COLLECTIONS = ["history", "planUpdates"];
const NEW_COLLECTIONS = ["clientPrograms", "exerciseNotes", "sessionAttendance"];

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
