// src/domain/sessionRecord.js — turning a filled-in session form into the record the dashboard
// stores, and the meta the live clipboard launches from.
//
// Two flavours come out of the same form, and keeping the difference explicit is why this is a
// module rather than four helpers inside the form's own file:
//
//   • A REAL session is scheduled. It becomes a row in `state.sessions`, which is what the
//     dashboard, the day timeline and the overlap checks all read.
//   • A PLANNING session is a routine-adjustment flow with no slot at all. It deliberately never
//     touches `state.sessions` — it produces only the meta the clipboard opens with, and persists
//     through the planning-draft path in `sessionHistoryRecord.js` instead.
//
// Pure: dates and labels in, records out. Writing them anywhere, prompting the
// trainer, and firing invites stay with the form controller.

import { parseTimeRange } from "./timeRange.js";

// The label a session shows wherever its slot is named. An end with no start is not a range, and a
// session with neither is honestly undated rather than shown as an empty gap.
export function computeTimeLabel(startTime, endTime, unknownLabel) {
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  return unknownLabel;
}

// The coarse day bucket the dashboard columns and the temporal card styling key off. Compared at
// MIDNIGHT rather than by elapsed hours: "tomorrow" is a calendar fact, and a session 20 hours out
// is tomorrow or today depending only on what time it is now.
export function computeSessionDayBucket(startDateTime) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfSessionDay = new Date(startDateTime);
  startOfSessionDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfSessionDay - startOfToday) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 1) return "upcoming";
  return "yesterday";
}

// The bucket a session is in NOW. A record's stored `day` is the bucket on the day it was written,
// and nothing moves it at midnight: a session created at 23:59 for 00:00 still said "tomorrow"
// while it ran. Read from the start date where there is one.
export function sessionDayOf(session) {
  if (session?.startDate) return computeSessionDayBucket(new Date(session.startDate));
  return session?.day ?? null;
}

// The local calendar date a session falls on, as `YYYY-MM-DD` — the day timeline's grouping key, and
// what the edit form puts back in its date field.
//
// LOCAL getters, not `toISOString().split("T")[0]`: `startDate` is built from a local Date at seed
// and migration time, so reading it back in UTC moves a late-evening session to the following day —
// onto a timeline column the trainer does not think of it as belonging to.
export function sessionCalendarDate(session) {
  if (!session?.startDate) return null;
  const date = new Date(session.startDate);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Merge over an existing row rather than replacing it: a stored session carries fields this form
// never edits (`status` and `duration`, stamped by finishing a session), and a wholesale replace
// would silently drop them. A new row starts "scheduled"; the form never sets a status, so editing
// a held session leaves it held.
//
// The number of places is one of them: the form has no field for it and counts the participants.
// Saving a drop-in slot for three with its first client turned it into a slot for one, so the next
// two could not be added. An edit keeps the places the session had, and grows them only when more
// people are on it than that.
export function upsertSessionRecord(sessions, sessionRecord) {
  const existingIndex = sessions.findIndex((session) => session.id === sessionRecord.id);
  if (existingIndex >= 0) {
    const existing = sessions[existingIndex];
    const maxCapacity = Math.max(existing.maxCapacity ?? 0, sessionRecord.maxCapacity ?? 0);
    sessions[existingIndex] = { ...existing, ...sessionRecord, maxCapacity };
    return;
  }
  sessions.push({ status: "scheduled", ...sessionRecord });
}

// The inverse of the meta factories below: which stored rows is this live clipboard running?
// A slot can be more than one row — the day timeline merges sessions sharing a time and place into
// a single card, and the meta then carries `ids` for all of them (`id` names the first). Every
// caller that writes back onto "the session behind the clipboard" — stamping it done,
// re-timing it, deleting it — has to agree on that set, and three of them had grown their own copy
// of the same two-clause check.
/**
 * When a finished training happened, as its record says: when the trainer tapped Start, unless that
 * was on another calendar day than the slot — a session logged the morning after, with its schedule
 * kept. Then the slot's own start, or the client's history puts it on another day than the board.
 */
export function performedAtFor(startTime, slotStartDate) {
  const started = new Date(startTime);
  if (!slotStartDate) return started.toISOString();
  const slot = new Date(slotStartDate);
  return sessionCalendarDate({ startDate: slot }) === sessionCalendarDate({ startDate: started })
    ? started.toISOString()
    : slot.toISOString();
}

/**
 * Whether two overlapping sessions are run on one clipboard. A session already held is not run
 * again: merged with one still to come, it took that session's clients, and a training done in the
 * new session was written under the held one, with no attendance for the new one. So a session not
 * yet held merges only with others not yet held, and a held one is opened with held ones only.
 */
export function runsInOneClipboard(session, other) {
  return (session?.status === "done") === (other?.status === "done");
}

export function sessionBelongsToSlot(session, sourceSession) {
  if (!session || !sourceSession) return false;
  if (session.id === sourceSession.id) return true;
  return Array.isArray(sourceSession.ids) && sourceSession.ids.includes(session.id);
}

/**
 * Whether the live clipboard stands on records a removal just deleted: its booked slot is one of
 * the removed sessions, or one of its participants is a removed client. `removals` is
 * `{ collection: [id, ...] }`, the shape demoDataRemoval.js plans.
 */
export function clipboardDependsOnRemoved(activeSession, removals) {
  if (!activeSession) return false;
  const removedSessions = new Set(removals?.sessions || []);
  const removedClients = new Set(removals?.clients || []);
  const slot = activeSession.sourceSession;
  const slotIds = [slot?.id, ...(Array.isArray(slot?.ids) ? slot.ids : [])];
  if (slotIds.some((id) => id && removedSessions.has(id))) return true;
  return (activeSession.participants || []).some((id) => removedClients.has(id));
}

export function buildSessionRecord({
  sessionId,
  sessionName,
  sessionDate,
  startTime,
  timeLabel,
  location,
  clientRoutines,
}) {
  const startDateTime = new Date(`${sessionDate}T${startTime || "00:00"}`);
  return {
    id: sessionId,
    title: sessionName,
    time: timeLabel,
    startDate: startDateTime.toISOString(),
    location,
    participants: clientRoutines.map((assignment) => assignment.clientId),
    routineId: clientRoutines[0]?.routineId || "",
    maxCapacity: clientRoutines.length,
    day: computeSessionDayBucket(startDateTime),
  };
}

// What the clipboard opens with. `isPlanning` is the flag every downstream guard reads to know this
// session has no slot to run against — no countdown, no Start/Complete footer, no completion stamp.
export function buildPlanningSessionMeta({
  sessionId,
  sessionName,
  sessionDate,
  timeLabel,
  location,
}) {
  return {
    id: sessionId,
    isPlanning: true,
    titles: [sessionName],
    date: sessionDate,
    timeLabel,
    location,
  };
}

//
// It carries the same `day`, `startDate` and `endDate` as a slot launched from the dashboard
// (modules/common/utils.js's `buildSessionMeta`). With only `date`, the clipboard header found no
// day and no start, read `new Date(null)`, and printed 1970-01-01 right after the save.
export function buildRealSessionMeta({
  sessionId,
  sessionName,
  sessionDate,
  startTime,
  timeLabel,
  location,
}) {
  const startDate = new Date(`${sessionDate}T${startTime || "00:00"}`);
  const range = parseTimeRange(timeLabel);
  const endDate = range ? new Date(startDate.getTime() + (range.end - range.start) * 60000) : null;
  return {
    id: sessionId,
    titles: [sessionName],
    date: sessionDate,
    day: computeSessionDayBucket(startDate),
    startDate,
    endDate,
    timeLabel,
    location,
  };
}

// Who is being invited: the participants this save ADDS. Diffed against the session's participants
// as they stood before it, so re-saving an unchanged assignment never re-invites somebody who was
// already on the list.
export function newlyAssignedParticipantIds(previousParticipants, clientRoutines) {
  const previous = previousParticipants || [];
  return clientRoutines
    .map((assignment) => assignment.clientId)
    .filter((clientId) => !previous.includes(clientId));
}
