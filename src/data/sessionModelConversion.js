// src/data/sessionModelConversion.js — the old shape of a training (`history`, `planUpdates`) to the
// new session model (`clientPrograms`, `sessionAttendance`, `exerciseNotes`) and back.
//
// Both directions are needed while schemas 4 and 5 stay live beside the new one (ruled 2026-10-02,
// Simon): reading a store that holds the old shape converts it forward, and every save writes the
// old shape for those stores from the new one. Pure: plain collections in, plain collections out.
//
// **Ids are carried, never invented at random**, so converting the same old data twice gives the
// same records, and restoring an old backup again overwrites instead of duplicating:
//   - a program keeps its history record's id;
//   - an exercise note keeps the id its feedback item and plan update already shared (the two were
//     the same note filed twice under one id);
//   - attendance is `at-<session id>-<client id>`, one per client per session.
//
// **Which session a finished record belonged to was never stored.** It is found where only one
// session fits (ruled 2026-10-02, Simon): finished, not cancelled, on the record's calendar day, with
// the client among its participants. Several that fit are narrowed by the routine. Zero, or still
// several, leave the program without a session, which the new model allows.
//
// Injected dependencies: none.

import { localDateString } from "./calendarDay.js";
import { COMMON_RECORD_FIELDS } from "./recordSchemas.js";

const ATTENDANCE_ID_PREFIX = "at-";

function defined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

// The fields any record may carry whatever its collection, the demo seeder's stamp above all: it is
// how removing the demo data tells a demo training from the trainer's own. Carried from the record a
// conversion starts from to every record it makes.
function provenance(record) {
  return Object.fromEntries(
    COMMON_RECORD_FIELDS.filter((field) => record?.[field] !== undefined).map((field) => [
      field,
      record[field],
    ]),
  );
}

// The calendar day a session row falls on, read with local getters like the day timeline does.
function sessionDay(session) {
  return session?.startDate ? localDateString(new Date(session.startDate)) : null;
}

function routineOf(session, routines) {
  return routines.find((routine) => routine.id === session.routineId);
}

// Whether a session's routine is the one the record was run from: the same id, the same name, or
// most of the record's exercises in it.
function routineFits(session, record, routines) {
  if (!session.routineId) return false;
  if (record.routineId && session.routineId === record.routineId) return true;
  const routine = routineOf(session, routines);
  if (!routine) return false;
  if (record.routineName && routine.name === record.routineName) return true;
  const inRoutine = new Set((routine.exercises || []).map((entry) => entry?.name).filter(Boolean));
  const performed = (record.exercises || []).filter((item) => item?.type !== "rest");
  const shared = performed.filter((item) => inRoutine.has(item.name)).length;
  return performed.length > 0 && shared * 2 > performed.length;
}

export function matchingSession(record, sessions, routines = []) {
  if (record.isPlanning || !record.date) return null;
  const day = localDateString(new Date(record.date));
  const candidates = sessions.filter(
    (session) =>
      session.completed === true &&
      session.cancelled !== true &&
      Array.isArray(session.participants) &&
      session.participants.includes(record.clientId) &&
      sessionDay(session) === day,
  );
  if (candidates.length === 1) return candidates[0];
  const byRoutine = candidates.filter((session) => routineFits(session, record, routines));
  return byRoutine.length === 1 ? byRoutine[0] : null;
}

// A catalogue exercise for a program item: by the id the item carries, else by its name.
function catalogueId(item, exercises) {
  if (item?.type === "rest") return undefined;
  const byId = exercises.find((exercise) => exercise.id === item.id);
  if (byId) return byId.id;
  return exercises.find((exercise) => exercise.name === item.name)?.id;
}

// Every item gets an id of its own, because an exercise note points at it. The id it had is kept
// where it is unique inside the program; otherwise it is the program's id and the position.
function programItems(record, exercises) {
  const items = record.exercises || [];
  const counts = new Map();
  for (const item of items) counts.set(item?.id, (counts.get(item?.id) || 0) + 1);
  return items.map((item, index) => {
    const ownId = item?.id && counts.get(item.id) === 1 ? item.id : `${record.id}-${index}`;
    return defined({ ...item, id: ownId, exerciseId: catalogueId(item, exercises) });
  });
}

function programFromRecord(record, session, exercises) {
  const planned = record.isPlanning === true;
  return defined({
    ...provenance(record),
    id: record.id,
    clientId: record.clientId,
    sessionId: session?.id,
    status: planned ? "planned" : "done",
    createdAt: planned ? record.date : undefined,
    performedAt: planned ? undefined : record.date,
    duration: record.duration,
    title: record.title,
    routineId: record.routineId,
    routineName: record.routineName,
    exercises: programItems(record, exercises),
  });
}

// A feedback item the app wrote carries the id its plan update shares. One without (a very old or
// hand-edited record) gets an id made from its record and its place, so a second conversion gives
// the same note rather than losing it or making another.
function feedbackId(item, record, index) {
  return item.id || `${record.id}-f${index}`;
}

function noteFromFeedback(item, record, program, id) {
  const programItem = program.exercises.find((entry) => entry.name === item.exerciseName);
  return defined({
    ...provenance(record),
    id,
    clientId: item.clientId || record.clientId,
    programId: program.id,
    programItemId: programItem?.id,
    exerciseId: programItem?.exerciseId,
    exerciseName: item.exerciseName,
    createdAt: record.date,
    tag: item.tag,
    text: item.note || undefined,
  });
}

// A plan update is the note the trainer still has to act on. Where the same note sits in a history
// record, that copy has the tag and the remark apart, and the plan update adds whether it is done.
function withPlanUpdate(note, update) {
  return defined({
    ...note,
    createdAt: update.date || note.createdAt,
    resolved: update.resolved === true,
  });
}

function noteFromPlanUpdate(update, exercises) {
  return defined({
    ...provenance(update),
    id: update.id,
    clientId: update.clientId,
    exerciseId: exercises.find((exercise) => exercise.name === update.exerciseName)?.id,
    exerciseName: update.exerciseName,
    createdAt: update.date,
    tag: update.tag,
    resolved: update.resolved === true,
  });
}

/** `history` and `planUpdates` as programs, attendance and exercise notes. */
export function sessionModelFromHistory({
  history = [],
  planUpdates = [],
  sessions = [],
  routines = [],
  exercises = [],
} = {}) {
  const clientPrograms = [];
  const attendanceById = new Map();
  const notesById = new Map();

  for (const record of history) {
    const session = matchingSession(record, sessions, routines);
    const program = programFromRecord(record, session, exercises);
    clientPrograms.push(program);
    if (session) {
      const id = `${ATTENDANCE_ID_PREFIX}${session.id}-${record.clientId}`;
      if (!attendanceById.has(id)) {
        attendanceById.set(id, {
          ...provenance(record),
          id,
          sessionId: session.id,
          clientId: record.clientId,
          programId: program.id,
          status: "attended",
          consumesQuota: true,
        });
      }
    }
    for (const [index, item] of (record.feedback || []).entries()) {
      if (!item) continue;
      const id = feedbackId(item, record, index);
      if (!notesById.has(id)) notesById.set(id, noteFromFeedback(item, record, program, id));
    }
  }

  for (const update of planUpdates) {
    const note = notesById.get(update.id);
    notesById.set(
      update.id,
      note ? withPlanUpdate(note, update) : noteFromPlanUpdate(update, exercises),
    );
  }

  return {
    clientPrograms,
    sessionAttendance: [...attendanceById.values()],
    exerciseNotes: [...notesById.values()],
  };
}

function itemForHistory(item) {
  const { exerciseId: _exerciseId, ...rest } = item;
  return rest;
}

function feedbackForHistory(note) {
  return {
    id: note.id,
    clientId: note.clientId,
    exerciseName: note.exerciseName,
    tag: note.tag,
    note: note.text || "",
  };
}

function recordFromProgram(program, notesByProgram, clientsById) {
  const planned = program.status === "planned";
  return defined({
    ...provenance(program),
    id: program.id,
    clientId: program.clientId,
    clientName: clientsById.get(program.clientId)?.name,
    routineId: program.routineId,
    routineName: program.routineName,
    date: planned ? program.createdAt : program.performedAt,
    duration: program.duration,
    exercises: (program.exercises || []).map(itemForHistory),
    feedback: (notesByProgram.get(program.id) || []).map(feedbackForHistory),
    isPlanning: planned ? true : undefined,
    title: program.title,
  });
}

// The plan update an older build reads: one tag, with the remark after it as the feedback form
// has always written it.
function planUpdateFromNote(note, clientsById) {
  return defined({
    ...provenance(note),
    id: note.id,
    clientId: note.clientId,
    clientName: clientsById.get(note.clientId)?.name,
    date: note.createdAt,
    exerciseName: note.exerciseName,
    tag: note.text ? `${note.tag} - ${note.text}` : note.tag,
    resolved: note.resolved,
  });
}

// What the old `history` held: a finished training, and a plan written for no session. A session
// in progress, or a booked one being planned, lived in an older build's own cache, never in
// `history`; written there, every session ever opened would read as an unscheduled plan.
function inOldHistory(program) {
  if (program.status === "done") return true;
  return program.status === "planned" && !program.sessionId;
}

/** The new model as the `history` and `planUpdates` an older schema holds. */
export function historyFromSessionModel({
  clientPrograms = [],
  exerciseNotes = [],
  clients = [],
} = {}) {
  // Grouped once: this runs on every save, and a lookup per program would grow with the square of
  // a trainer's years of records.
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const notesByProgram = new Map();
  for (const note of exerciseNotes) {
    if (!note.programId) continue;
    if (!notesByProgram.has(note.programId)) notesByProgram.set(note.programId, []);
    notesByProgram.get(note.programId).push(note);
  }
  return {
    history: clientPrograms
      .filter(inOldHistory)
      .map((program) => recordFromProgram(program, notesByProgram, clientsById)),
    planUpdates: exerciseNotes
      .filter((note) => typeof note.resolved === "boolean")
      .map((note) => planUpdateFromNote(note, clientsById)),
  };
}
