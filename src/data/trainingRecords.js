// src/data/trainingRecords.js — the one way code reads and writes trainings: each client's
// programs and the notes on their exercises.
//
// Single responsibility: hide WHERE a training is stored. Memory holds the session model since
// schema 6 (`clientPrograms`, `exerciseNotes`, `sessionAttendance`; recordSchemas.js), and feature
// code reads and writes it only here, so a change to how a training is stored changes this file.
//
// Every write still takes the record the clipboard builds today (domain/sessionHistoryRecord.js and
// the plan-update builders, in the old `history` / `planUpdates` shape) and converts it with the same
// function every older store and file goes through (sessionModelConversion.js), so a training
// written today and one restored from last year are the same kind of record.
//
// Injected dependencies: none — every function takes the `state` it reads or writes.

import { libraryExercises } from "./exerciseLibrary.js";
import { sessionModelFromHistory } from "./sessionModelConversion.js";

function programs(state) {
  if (!Array.isArray(state.clientPrograms)) state.clientPrograms = [];
  return state.clientPrograms;
}

function notes(state) {
  if (!Array.isArray(state.exerciseNotes)) state.exerciseNotes = [];
  return state.exerciseNotes;
}

function attendance(state) {
  if (!Array.isArray(state.sessionAttendance)) state.sessionAttendance = [];
  return state.sessionAttendance;
}

function groups(state) {
  if (!Array.isArray(state.groupSharedPrograms)) state.groupSharedPrograms = [];
  return state.groupSharedPrograms;
}

/** Every program, in no particular order. */
export function allPrograms(state) {
  return state?.clientPrograms || [];
}

/** Every exercise note, in no particular order. */
export function allExerciseNotes(state) {
  return state?.exerciseNotes || [];
}

/** When a program happened, or for a draft when it was written: the instant it is sorted by. */
export function programDate(program) {
  return program?.performedAt ?? program?.createdAt ?? null;
}

/** The programs a client performed, newest first. Without a client, everybody's. */
export function performedPrograms(state, clientId = null) {
  return allPrograms(state)
    .filter((program) => program.status === "done" && (!clientId || program.clientId === clientId))
    .sort((a, b) => new Date(programDate(b)) - new Date(programDate(a)));
}

/** Plans written for no session: what the feed lists as unscheduled plans. */
export function draftPrograms(state) {
  return allPrograms(state).filter((program) => program.status === "planned" && !program.sessionId);
}

export function programById(state, id) {
  return allPrograms(state).find((program) => program.id === id) ?? null;
}

/** The programs of the sessions named, planned or live: what a session not yet finished holds. */
export function openProgramsOfSessions(state, sessionIds) {
  const ids = new Set(sessionIds.filter(Boolean));
  return allPrograms(state).filter(
    (program) => ids.has(program.sessionId) && program.status !== "done",
  );
}

/** Live programs, the one started last first. */
export function livePrograms(state) {
  return allPrograms(state)
    .filter((program) => program.status === "live")
    .sort((a, b) => String(b.startedAt || "").localeCompare(String(a.startedAt || "")));
}

/** Which clients share one program in the sessions named: one list of client ids per group. */
export function groupsOfSessions(state, sessionIds) {
  const ids = new Set(sessionIds.filter(Boolean));
  return (state?.groupSharedPrograms || [])
    .filter((group) => ids.has(group.sessionId))
    .map((group) => [...group.clientIds]);
}

/** The notes written on one program's exercises, in the order they were written. */
export function notesForProgram(state, programId) {
  return allExerciseNotes(state).filter((note) => note.programId === programId);
}

/** The notes the trainer still has to act on in a next plan, oldest first: the order they were
 *  taken in, which is the order the Pending Review screen lists them. */
export function pendingNotes(state) {
  return allExerciseNotes(state)
    .filter((note) => note.resolved === false)
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

export function noteById(state, id) {
  return allExerciseNotes(state).find((note) => note.id === id) ?? null;
}

/**
 * A note's tag as one line, with the trainer's remark after it: the form the feedback form has
 * always stored and every screen has shown, so a reader of the tag (feedbackTags.js) still finds the
 * known tag first and the remark after its separator.
 */
export function noteTagLine(note) {
  return note?.text ? `${note.tag} - ${note.text}` : note?.tag || "";
}

/** Notes in the shape a live session keeps its feedback in, for a program reopened on the clipboard. */
export function feedbackFromNotes(noteList) {
  return (noteList || []).map((note) => ({
    id: note.id,
    clientId: note.clientId,
    exerciseName: note.exerciseName,
    tag: note.tag,
    note: note.text || "",
  }));
}

// --- Writes. What the clipboard hands in goes through the old shape and the one conversion. ---

function converted(state, { history = [], planUpdates = [] }) {
  // No sessions: a write is never guessed onto a session. The caller names it (recordTrainings).
  return sessionModelFromHistory({ history, planUpdates, exercises: libraryExercises(state) });
}

// A note already held (a signal tapped during the session, a plan update) gains the program it was
// filed in and the remark written with it, and keeps whether the next plan still waits for it.
function upsertNotes(state, incoming) {
  const list = notes(state);
  for (const note of incoming) {
    const index = list.findIndex((existing) => existing.id === note.id);
    if (index === -1) list.push(note);
    else list[index] = merged(list[index], note);
  }
}

// The two copies of one note the old shape kept, met again. A plan update brings only whether the
// next plan waits for it and when it was taken; the tag it stores has the remark run into it, so the
// held copy's tag and remark stay. A copy filed in a finished program brings the program, the item
// and the remark apart from the tag, and leaves whether a plan waits for it as it was.
function merged(held, note) {
  if (typeof note.resolved === "boolean") {
    return defined({
      ...note,
      ...held,
      resolved: note.resolved,
      createdAt: note.createdAt ?? held.createdAt,
    });
  }
  return defined({
    ...held,
    ...note,
    resolved: held.resolved,
    createdAt: held.createdAt ?? note.createdAt,
  });
}

function defined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function unfiled({ programId: _programId, programItemId: _programItemId, ...rest }) {
  return rest;
}

// The session row a client was on, among the rows one booked slot is made of.
function sessionOf(state, sessionIds, clientId) {
  const rows = (state.sessions || []).filter((session) => sessionIds.includes(session.id));
  return rows.find((session) => (session.participants || []).includes(clientId)) ?? rows[0] ?? null;
}

/**
 * Store finished or planned trainings, one record per client. `sessionIds` are the session rows the
 * clipboard was launched from: a finished program is linked to the one its client was on, and the
 * client is recorded as having attended it. A record carrying the id of a program already held
 * replaces it: that is how a live program becomes the finished one.
 */
export function recordTrainings(state, records, { sessionIds = [] } = {}) {
  const model = converted(state, { history: records.filter(Boolean) });
  for (const program of model.clientPrograms) {
    const session =
      program.status === "done" ? sessionOf(state, sessionIds, program.clientId) : null;
    if (session) program.sessionId = session.id;
    storeProgram(state, program, notesFiledOn(model, program.id));
    if (!session) continue;
    const id = `at-${session.id}-${program.clientId}`;
    if (attendance(state).some((row) => row.id === id)) continue;
    attendance(state).push({
      id,
      sessionId: session.id,
      clientId: program.clientId,
      programId: program.id,
      status: "attended",
      consumesQuota: true,
    });
  }
}

/**
 * Store the programs of a session that is not finished, one per participant, each under the id the
 * clipboard keeps for it, so saving again replaces what is held instead of adding a program.
 *
 * Each entry is one participant's program as the clipboard holds it: `{ id, clientId, status,
 * sessionId?, createdAt?, startedAt?, title?, routineId?, routineName?, exercises, feedback }`.
 * `status` is "planned" while the session is staged or is a plan with no session, "live" once the
 * trainer tapped Start. `feedback` is what the session holds on this client; it becomes the notes
 * filed on the program. A seed stamp on the entry (`testData`, `seededDemo`) is carried onto the
 * program and its notes, as the conversion carries it from any record. `groups` are the clients sharing one program in session `sessionId`, as
 * lists of client ids; they replace the groups that session had.
 */
export function saveSessionPrograms(
  state,
  entries,
  { sessionId = null, groups: shared = [] } = {},
) {
  const records = entries.map(({ status, sessionId, startedAt, createdAt, ...record }) => ({
    ...record,
    date: createdAt,
    feedback: record.feedback || [],
    // Read as a plan, so the conversion links no session and stamps no performance date; the
    // status, the session and the start are the entry's own.
    isPlanning: true,
  }));
  const model = converted(state, { history: records });
  model.clientPrograms.forEach((program, index) => {
    const { status, sessionId: programSession, startedAt } = entries[index];
    storeProgram(
      state,
      defined({ ...program, status, sessionId: programSession, startedAt }),
      notesFiledOn(model, program.id),
    );
  });
  if (sessionId) {
    state.groupSharedPrograms = groups(state)
      .filter((group) => group.sessionId !== sessionId)
      .concat(
        shared.map((clientIds, index) => ({
          id: `${sessionId}-group-${index}`,
          sessionId,
          clientIds: [...clientIds],
        })),
      );
  }
}

/** A session discarded before it finished: its programs go (removePrograms), and so do its groups. */
/** A client taken off a booked session takes their plan for it along. A program already running or
 *  done is a record of work and stays. */
export function dropPlansOfRemovedClients(state, sessionId, participants) {
  const kept = new Set(participants || []);
  const gone = allPrograms(state)
    .filter(
      (program) =>
        program.sessionId === sessionId &&
        program.status === "planned" &&
        !kept.has(program.clientId),
    )
    .map((program) => program.id);
  if (gone.length > 0) removePrograms(state, gone);
}

export function discardSessionPrograms(state, programIds, sessionId = null) {
  removePrograms(state, programIds);
  if (sessionId) {
    state.groupSharedPrograms = groups(state).filter((group) => group.sessionId !== sessionId);
  }
}

function notesFiledOn(model, programId) {
  return model.exerciseNotes.filter((note) => note.programId === programId);
}

// A program stored again under its id replaces the copy held, and keeps when it was started:
// finishing a live program is what makes it the performed one, never a second program beside it.
// The notes filed on it become exactly `filed`. A note no longer among them was taken back by the
// trainer: it goes, or stays unfiled while a next plan still waits for it.
function storeProgram(state, program, filed) {
  const list = programs(state);
  const index = list.findIndex((held) => held.id === program.id);
  if (index === -1) list.push(program);
  else list[index] = defined({ ...program, startedAt: program.startedAt ?? list[index].startedAt });

  upsertNotes(state, filed);
  const kept = new Set(filed.map((note) => note.id));
  const takenBack = (note) => note.programId === program.id && !kept.has(note.id);
  state.exerciseNotes = notes(state)
    .filter((note) => !takenBack(note) || typeof note.resolved === "boolean")
    .map((note) => (takenBack(note) ? unfiled(note) : note));
}

/** Remove programs by id. A note filed on one that the next plan still waits for stays, unfiled; the
 *  others go with the program. Attendance stays: the client still came. */
export function removePrograms(state, ids) {
  const gone = new Set(ids);
  state.clientPrograms = programs(state).filter((program) => !gone.has(program.id));
  state.exerciseNotes = notes(state)
    .filter((note) => !gone.has(note.programId) || typeof note.resolved === "boolean")
    .map((note) => (gone.has(note.programId) ? unfiled(note) : note));
  state.sessionAttendance = attendance(state).map((row) =>
    gone.has(row.programId) ? unfiled(row) : row,
  );
}

/** A note the next plan waits for, in the shape the plan-update builders make. */
export function addPendingNote(state, update) {
  upsertNotes(state, converted(state, { planUpdates: [update] }).exerciseNotes);
}

export function resolveNote(state, id) {
  const note = notes(state).find((entry) => entry.id === id);
  if (note) note.resolved = true;
}

/** Remove notes the next plan waits for. One already filed in a finished program stays there, as a
 *  record of what happened that no plan waits for any more. */
export function removePendingNotes(state, ids) {
  const gone = new Set(ids);
  state.exerciseNotes = notes(state)
    .filter((note) => !gone.has(note.id) || note.programId)
    .map((note) => {
      if (!gone.has(note.id)) return note;
      const { resolved: _resolved, ...kept } = note;
      return kept;
    });
}
