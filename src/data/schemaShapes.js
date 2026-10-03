// src/data/schemaShapes.js — a whole state written by an older build, in the shape memory holds.
//
// Single responsibility: the one place where records change shape on their way in. Memory holds
// schema 6 (recordSchemas.js). What an older build wrote holds older shapes: `history` and
// `planUpdates` for trainings, `completed` and `cancelled` on a session, and — from the first cut of
// schema 6, never published — `resolved` and English tag text on a note and a group of client ids.
// A backup file, a Drive sync file, a legacy blob, a page's unsaved copy, and a phone's store of a
// retired schema read once at the first boot each pass `toDomainState` before anything uses it, so
// no feature code knows the old shapes existed. Nothing writes them.
//
// The conversion of one training lives in sessionModelConversion.js; this decides WHEN it runs.
//
// Injected dependencies: none — pure functions over plain state objects.

import { libraryExercises } from "./exerciseLibrary.js";
import {
  groupIdFor,
  noteInCurrentShape,
  sessionModelFromHistory,
} from "./sessionModelConversion.js";

/** The collections of the old training shape: absent from schema 6, and converted, never dropped,
 * wherever they arrive. The one exception to "a newer schema only adds" (recordSchemas.test.mjs). */
export const CONVERTED_COLLECTIONS = ["history", "planUpdates"];

/** The fields of an older shape that schema 6 replaced with another, per collection: converted
 * wherever they arrive (`sessionInCurrentShape`), never dropped. */
export const CONVERTED_FIELDS = { sessions: ["completed", "cancelled"] };
const NEW_COLLECTIONS = ["clientPrograms", "exerciseNotes", "sessionAttendance"];

function mergedById(existing, added) {
  const byId = new Map((existing || []).map((record) => [record.id, record]));
  for (const record of added) if (!byId.has(record.id)) byId.set(record.id, record);
  return [...byId.values()];
}

/** A session with one `status` instead of the flags `completed` and `cancelled`. A session that
 *  carried both was cancelled: the trainer took it off the board after it had run. */
export function sessionInCurrentShape(session) {
  if (!session || typeof session.status === "string") return session;
  const { completed, cancelled, ...rest } = session;
  let status = "scheduled";
  if (cancelled === true) status = "cancelled";
  else if (completed === true) status = "done";
  return { ...rest, status };
}

// A group of client ids in one session (the first cut of schema 6) as the programs those clients
// hold in that session. A member with no program there is left out; a group left with fewer than two
// members is no group.
function groupInCurrentShape(group, programs) {
  if (!group || Array.isArray(group.programIds)) return group;
  const programIds = (group.clientIds || [])
    .map(
      (clientId) =>
        programs.find(
          (program) => program.sessionId === group.sessionId && program.clientId === clientId,
        )?.id,
    )
    .filter(Boolean);
  if (programIds.length < 2) return null;
  const { sessionId: _sessionId, clientIds: _clientIds, ...rest } = group;
  return { ...rest, id: groupIdFor(programIds), programIds };
}

function needsShaping(state) {
  return (
    CONVERTED_COLLECTIONS.some((key) => Array.isArray(state[key])) ||
    (state.sessions || []).some((session) => typeof session?.status !== "string") ||
    (state.exerciseNotes || []).some((note) => noteInCurrentShape(note) !== note) ||
    (state.groupSharedPrograms || []).some((group) => !Array.isArray(group?.programIds))
  );
}

/**
 * A state in the shape memory holds. Old-shape collections are converted and removed, old-shape
 * records rewritten; a state already current comes back unchanged. Records already in the new shape
 * win over a conversion with the same id, so a state holding both — written while a build changed —
 * keeps its newer facts.
 */
export function toDomainState(state) {
  if (!state || !needsShaping(state)) return state;
  const next = { ...state };
  if (Array.isArray(state.sessions)) next.sessions = state.sessions.map(sessionInCurrentShape);
  if (Array.isArray(state.exerciseNotes)) {
    next.exerciseNotes = state.exerciseNotes.map(noteInCurrentShape);
  }
  if (CONVERTED_COLLECTIONS.some((key) => Array.isArray(state[key]))) {
    const model = sessionModelFromHistory({
      history: state.history || [],
      planUpdates: state.planUpdates || [],
      sessions: next.sessions || [],
      routines: state.routines || [],
      // The whole library, the built-in catalogue too: it is not stored, and an old record's
      // exercise may well be one of it.
      exercises: libraryExercises(state),
    });
    for (const key of CONVERTED_COLLECTIONS) delete next[key];
    for (const key of NEW_COLLECTIONS) next[key] = mergedById(next[key], model[key]);
  }
  if (Array.isArray(state.groupSharedPrograms)) {
    next.groupSharedPrograms = state.groupSharedPrograms
      .map((group) => groupInCurrentShape(group, next.clientPrograms || []))
      .filter(Boolean);
  }
  return next;
}
