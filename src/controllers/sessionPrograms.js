// src/controllers/sessionPrograms.js — a session on the clipboard, as the programs it is stored in.
// Single responsibility: map the clipboard's working object (`activeSession`) onto its participants'
// programs and back. Every save writes them; opening a session again, a reload, and coming back from
// another session rebuild the clipboard from them. There is no second copy of a session in progress:
// its programs are the record, planned while it is staged and live once started
// (docs/DATA_MODEL.md §3 "The session model").
// Injected dependencies: `state` and `saveToLocalStorage` through activeSessionStore.js. The program
// snapshot is domain/sessionItemRecord.js's, the plan rebuilt from one is
// domain/sessionPlanFactory.js's, and storage is data/trainingRecords.js.
//
// Every function here takes the session it works on, never only the one in the slot, so that a
// clipboard holding several sessions at once adds to this file instead of rewriting it.

import { newRecordId } from "../data/recordId.js";
import { COMMON_RECORD_FIELDS } from "../data/recordSchemas.js";
import { assignPositions, orderedItems } from "../data/sessionItemOrder.js";
import {
  discardPrograms,
  feedbackFromNotes,
  groupsOfSessions,
  notesForProgram,
  openProgramsOfSessions,
  saveSessionPrograms,
} from "../data/trainingRecords.js";
import { withoutBinding } from "../domain/participantBinding.js";
import { buildProgramSnapshot, isRestRecord } from "../domain/sessionItemRecord.js";
import { buildClientStateFromHistoryLog, ensureRestItems } from "../domain/sessionPlanFactory.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

/** The booked session rows a clipboard stands for. None for a plan written for no session. */
export function slotIdsOf(session) {
  const slot = session?.sourceSession;
  if (!slot || slot.isPlanning) return [];
  return [...new Set([slot.id, ...(slot.ids || [])].filter(Boolean))];
}

// The session row one participant's program belongs to: in a clipboard merged from overlapping
// sessions, the one the client was booked into; otherwise the clipboard's own.
function sessionIdFor(session, clientId) {
  const [slotId] = slotIdsOf(session);
  if (!slotId) return undefined;
  return session.sourceSession.clientSessions?.[clientId] || slotId;
}

/** The id of a participant's program in this session, made the first time it is asked for. */
export function programIdFor(session, clientId) {
  if (!session.programIds) session.programIds = {};
  if (!session.programIds[clientId]) session.programIds[clientId] = newRecordId();
  return session.programIds[clientId];
}

// A session row seeded as sample or test data stamps the programs written for it the same way, so
// removing the sample data removes them with it and nothing counts them as the trainer's own.
function seedStampOf(state, sessionId) {
  const row = sessionId ? (state.sessions || []).find((session) => session.id === sessionId) : null;
  return Object.fromEntries(
    COMMON_RECORD_FIELDS.filter((field) => row?.[field] !== undefined).map((field) => [
      field,
      row[field],
    ]),
  );
}

function programEntry(state, session, clientId, { status, createdAt, startedAt, planning }) {
  const clientState = session.clientRoutines?.[clientId];
  const sessionId = sessionIdFor(session, clientId);
  // A rest still carried as a number on an exercise (a plan built from a routine, or by an older
  // build) becomes an item first: the snapshot keeps rest items, not that number.
  ensureRestItems(clientState);
  // The order the trainer sees is stamped here, at the one save every edit goes through (insert,
  // delete, drag, circuit regroup), so the snapshot below reads the plan in that order.
  assignPositions(clientState.exercises);
  return {
    ...seedStampOf(state, sessionId),
    id: programIdFor(session, clientId),
    clientId,
    status,
    sessionId,
    createdAt,
    startedAt,
    title: planning ? session.sourceSession?.titles?.[0] || "" : undefined,
    routineId: clientState.routineId || "",
    routineName: clientState.routineName,
    exercises: buildProgramSnapshot(clientState, { isPlanning: planning }),
    feedback: (session.feedback || []).filter((entry) => entry.clientId === clientId),
  };
}

/**
 * Write a session's programs: one per participant, planned until the trainer taps Start, live from
 * then on. A finished program reopened to be looked at is not written: it is the record of what
 * happened, and only finishing changes one.
 */
export function saveSession(session) {
  if (!session || session.finishedRecord) return;
  const { state, saveToLocalStorage } = getAppDeps();
  if (!state) return;
  const planning = Boolean(session.sourceSession?.isPlanning);
  const live = Boolean(session.started) && !planning && session.startTime;
  const options = {
    status: live ? "live" : "planned",
    createdAt: new Date().toISOString(),
    startedAt: live ? new Date(session.startTime).toISOString() : undefined,
    planning,
  };
  const clientIds = new Set((state.clients || []).map((client) => client.id));
  const entries = (session.participants || [])
    .filter((clientId) => clientIds.has(clientId) && session.clientRoutines?.[clientId])
    .map((clientId) => programEntry(state, session, clientId, options));
  saveSessionPrograms(state, entries, {
    sessionId: slotIdsOf(session)[0] ?? null,
    groups: session.bindings || [],
  });
  saveToLocalStorage?.();
}

/** Write the session on the clipboard. Every change to it calls this. */
export function saveActiveSession() {
  saveSession(getActiveSession());
}

/**
 * A change to one participant's plan — the plan editor, an exercise inserted, swapped or added, the
 * plan cleared, another plan copied onto theirs. That participant no longer trains what their group
 * trains, so they leave the group with the changed copy; a group left with one member ends. Then the
 * session is saved. Logging sets, signals and notes are not plan changes and do not come here.
 */
export function savePlanEdit(clientId = getActiveSession()?.activeClientId) {
  const session = getActiveSession();
  if (!session) return;
  if (clientId) session.bindings = withoutBinding(session.bindings, clientId);
  saveSession(session);
}

/** A plan the trainer threw away: its programs are kept as discarded, which no list shows. */
export function discardSession(session) {
  const { state } = getAppDeps();
  if (!state || !session) return;
  discardPrograms(state, Object.values(session.programIds || {}));
}

/**
 * One client's plan rebuilt from a stored program. Each item keeps the id it had: a link or a rest
 * timer naming a rest still finds it, and a movement the plan lists twice keeps which catalogue
 * exercise it is.
 */
export function clientStateFromProgram(program, exercises) {
  const clientState = buildClientStateFromHistoryLog(program, exercises);
  const stored = orderedItems(program.exercises);
  clientState.exercises.forEach((item, index) => {
    const source = stored[index];
    if (!source) return;
    if (isRestRecord(item)) item.id = source.id;
    else if (source.exerciseId && source.exerciseId !== item.id)
      item.exerciseId = source.exerciseId;
  });
  return clientState;
}

/**
 * What the stored programs of a session hold for the clipboard about to open it: each participant's
 * program, whether the session was started and when, its notes, and who shares one program. A
 * participant with no program yet is left out; the caller builds that plan from the routine.
 */
export function storedSession(state, session) {
  const slotIds = slotIdsOf(session);
  const programs = openProgramsOfSessions(state, slotIds);
  const byClient = {};
  for (const clientId of session.participants || []) {
    const own = sessionIdFor(session, clientId);
    const mine = programs.filter((program) => program.clientId === clientId);
    const program = mine.find((entry) => entry.sessionId === own) || mine[0];
    if (program) byClient[clientId] = program;
  }
  const starts = Object.values(byClient)
    .filter((program) => program.status === "live")
    .map((program) => Date.parse(program.startedAt))
    .filter(Number.isFinite);
  return {
    programs: byClient,
    started: starts.length > 0,
    startTime: starts.length ? Math.min(...starts) : null,
    feedback: Object.values(byClient).flatMap((program) =>
      feedbackFromNotes(notesForProgram(state, program.id)),
    ),
    bindings: groupsOfSessions(state, slotIds),
  };
}
