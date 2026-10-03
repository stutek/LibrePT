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

import { TRANSLATIONS } from "../i18n/index.js";
import { libraryExercises } from "./exerciseLibrary.js";
import {
  feedbackForHistory,
  groupIdFor,
  sessionModelFromHistory,
  textOfTag,
} from "./sessionModelConversion.js";

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

// The names the app gives a plan nobody named. They are stored as text, in the language the plan was
// made in, so they are recognised in every language and shown in the reader's.
const GENERATED_PLAN_NAMES = ["custom_empty_plan", "planned_program"];

/** A program's or plan's name in the language of `t`: a name the app gave it is translated, a name
 *  the trainer wrote is kept as written. */
export function programNameIn(name, t) {
  if (!name) return name || "";
  const key = GENERATED_PLAN_NAMES.find((candidate) =>
    Object.values(TRANSLATIONS).some((words) => words[candidate] === name),
  );
  return key ? t(key) : name;
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
    (program) =>
      ids.has(program.sessionId) && (program.status === "planned" || program.status === "live"),
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
  const clientOf = new Map(
    allPrograms(state)
      .filter((program) => ids.has(program.sessionId))
      .map((program) => [program.id, program.clientId]),
  );
  return (state?.groupSharedPrograms || [])
    .filter((group) => group.programIds.some((id) => clientOf.has(id)))
    .map((group) => group.programIds.map((id) => clientOf.get(id)).filter(Boolean));
}

/** The notes written on one program's exercises, in the order they were written. */
export function notesForProgram(state, programId) {
  return allExerciseNotes(state).filter((note) => note.programId === programId);
}

/** The notes the trainer still has to act on in a next plan, oldest first: the order they were
 *  taken in, which is the order the Pending Review screen lists them. */
export function pendingNotes(state) {
  return allExerciseNotes(state)
    .filter((note) => note.review === "pending")
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

export function noteById(state, id) {
  return allExerciseNotes(state).find((note) => note.id === id) ?? null;
}

/**
 * A note's tag as one line, with the trainer's remark after it: the form the feedback form has
 * always stored and every screen has shown, so a reader of the tag (feedbackTags.js) still finds the
 * known tag first and the remark after its separator. The tag is its English text, as that reader
 * expects, never the id the note stores.
 */
export function noteTagLine(note) {
  const tag = textOfTag(note?.tag);
  return note?.text ? `${tag} - ${note.text}` : tag;
}

/** Notes in the shape a live session keeps its feedback in, for a program reopened on the clipboard. */
export function feedbackFromNotes(noteList) {
  return (noteList || []).map(feedbackForHistory);
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
  if (note.review !== "none") {
    return defined({
      ...note,
      ...held,
      review: note.review,
      createdAt: note.createdAt ?? held.createdAt,
    });
  }
  return defined({
    ...held,
    ...note,
    review: held.review,
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
 * program and its notes, as the conversion carries it from any record. `groups` are the clients
 * sharing one program, as lists of client ids among these entries; they replace every group a
 * program of these entries was in. They are written when `sessionId` is named or groups are given.
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
  if (sessionId || shared.length > 0) {
    const programOf = new Map(entries.map((entry) => [entry.clientId, entry.id]));
    const ours = new Set(programOf.values());
    const formed = shared
      .map((clientIds) => clientIds.map((clientId) => programOf.get(clientId)).filter(Boolean))
      .filter((programIds) => programIds.length > 1)
      .map((programIds) => ({ id: groupIdFor(programIds), programIds }));
    state.groupSharedPrograms = groups(state)
      .filter((group) => !group.programIds.some((id) => ours.has(id)))
      .concat(formed);
  }
}

function hasExercises(program) {
  return (program.exercises || []).some((item) => item?.type !== "rest");
}

/**
 * Take programs off their session. **A program is never deleted** (Simon, 2026-10-03): it is the
 * trainer's work, and nothing the app removed could be brought back. It waits as an unscheduled plan,
 * as a cancelled client's plan does (ruled 2026-10-02). One with no exercise in it is discarded
 * instead: as a plan it would only add one nobody wrote to the feed's count.
 */
export function unschedulePrograms(state, ids) {
  const moved = new Set(ids);
  const titleOf = (sessionId) =>
    (state.sessions || []).find((session) => session.id === sessionId)?.title;
  state.clientPrograms = programs(state).map((program) => {
    if (!moved.has(program.id)) return program;
    const { sessionId, startedAt: _startedAt, ...rest } = program;
    // The session's name goes with it, so the feed's "unscheduled plans" says which plan this was.
    return defined({
      ...rest,
      title: rest.title || titleOf(sessionId),
      status: hasExercises(program) ? "planned" : "discarded",
    });
  });
}

/** Programs the trainer threw away. Kept, with status "discarded", which no list shows; their notes
 *  and groups stay with them. */
export function discardPrograms(state, ids) {
  const gone = new Set(ids);
  state.clientPrograms = programs(state).map((program) =>
    gone.has(program.id) ? { ...program, status: "discarded" } : program,
  );
}

/** A client taken off a booked session: their plan for it waits unscheduled. A program already
 *  running or done is a record of work in that session and stays on it. */
export function unscheduleRemovedClients(state, sessionId, participants) {
  const kept = new Set(participants || []);
  const moved = allPrograms(state)
    .filter(
      (program) =>
        program.sessionId === sessionId &&
        program.status === "planned" &&
        !kept.has(program.clientId),
    )
    .map((program) => program.id);
  if (moved.length > 0) unschedulePrograms(state, moved);
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
    .filter((note) => !takenBack(note) || note.review !== "none")
    .map((note) => (takenBack(note) ? unfiled(note) : note));
}

/** A note the next plan waits for, in the shape the plan-update builders make. */
export function addPendingNote(state, update) {
  upsertNotes(state, converted(state, { planUpdates: [update] }).exerciseNotes);
}

export function resolveNote(state, id) {
  const note = notes(state).find((entry) => entry.id === id);
  if (note) note.review = "resolved";
}

/** Remove notes the next plan waits for. One already filed in a finished program stays there, as a
 *  record of what happened that no plan waits for any more. */
export function removePendingNotes(state, ids) {
  const gone = new Set(ids);
  state.exerciseNotes = notes(state)
    .filter((note) => !gone.has(note.id) || note.programId)
    .map((note) => (gone.has(note.id) ? { ...note, review: "none" } : note));
}
