// src/domain/clientSessionNeighbours.js — the previous and next plan for ONE client, from
// wherever the trainer is currently looking.
//
// Ruling (Simon, 2026-09-14): stepping back and forward between sessions moves through THIS
// client's own history and schedule, not through every trainer's sessions in calendar order. A
// trainer reviewing Ana's Tuesday session steps to Ana's own previous and next plan, never to
// whichever other client happened to train the day before.
//
// Neighbours are other DAYS. A session anchors at its start, and the history record written when it
// finishes carries a later time on the same day, so comparing timestamps would offer the session
// being looked at as its own "next". Two sessions for one client on one day are rare enough that the
// second one is not reachable from the first by this route.
//
// `previous` is a finished session (a performed program, never a planned one: a plan was authored,
// not performed). `next` is the earliest later day, where a finished day is reached through its
// performed program (what was done) rather than through its scheduled row, so stepping forward from an
// old session walks through the client's history before reaching today and the schedule. Only when
// there is no later day at all does the client's open planning draft stand in, the same order
// `notificationItems.js` gives "unscheduled plans": a dated slot beats an undated draft.
//
// `clientSessionToday` answers the third question the sideways deck asks — where "Today" leads back
// to — by the same rule, for the day that is today.
//
// Pure: state in, `{ previous, next }` (or today's entry) out, each entry's `record` a program as
// data/trainingRecords.js reads it. What to do with the result stays with the controller.

import { localDateString } from "../data/calendarDay.js";
import { allPrograms, programDate } from "../data/trainingRecords.js";

// The local calendar day. The first ten characters of an instant are the day in UTC, which put a
// session after midnight on the day before.
const dayOf = (date) => (date ? localDateString(date) : "");

// Among candidates on the same day, history before a scheduled row, then id ascending — a STABLE rule,
// so the answer does not flip between renders of the same state.
function earlier(a, b) {
  if (a.day !== b.day) return a.day < b.day;
  if (a.kind !== b.kind) return a.kind === "history";
  return a.id < b.id;
}

// Every dated candidate for one client: performed programs, and scheduled rows on days that have no
// performed program. Shared by both answers below so "which entry stands for a day" is decided once.
function datedCandidates(state, clientId) {
  const programs = state
    ? allPrograms(state).filter((program) => program.clientId === clientId)
    : [];
  const sessions = (state?.sessions || []).filter(
    (session) => Array.isArray(session.participants) && session.participants.includes(clientId),
  );

  const finished = programs
    .filter((program) => program.status === "done")
    .map((program) => ({
      kind: "history",
      id: program.id,
      date: programDate(program),
      day: dayOf(programDate(program)),
      record: program,
    }));
  const finishedDays = new Set(finished.map((entry) => entry.day));
  const scheduled = sessions
    .map((session) => ({
      kind: "session",
      id: session.id,
      date: session.startDate,
      day: dayOf(session.startDate),
      session,
    }))
    .filter((entry) => !finishedDays.has(entry.day));
  return { programs, finished, scheduled };
}

export function clientSessionNeighbours(state, clientId, anchor) {
  const anchorDay = dayOf(anchor?.date);
  const { programs, finished, scheduled } = datedCandidates(state, clientId);

  let previous = null;
  for (const entry of finished) {
    if (entry.day < anchorDay && (!previous || earlier(previous, entry))) previous = entry;
  }

  let next = null;
  for (const entry of [...finished, ...scheduled]) {
    if (entry.day > anchorDay && (!next || earlier(entry, next))) next = entry;
  }

  if (!next) {
    // A draft is a plan written for no session. A planned program WITH a session is that session's
    // plan, staged on the clipboard — the session itself, never the next one.
    const draft = programs.find(
      (program) => program.status === "planned" && !program.sessionId && program.id !== anchor?.id,
    );
    if (draft)
      next = {
        kind: "draft",
        id: draft.id,
        date: programDate(draft),
        day: dayOf(programDate(draft)),
        record: draft,
      };
  }

  return { previous: strip(previous), next: strip(next) };
}

/**
 * The client's session TODAY, or null — what the clipboard's Today control returns to after the
 * trainer has pulled their way to another plan. Derived from the same programs and
 * schedule as the neighbours, so there is no second record of "the session launched today" to keep
 * in step. The work in hand comes first: the session the client is training in now, then a session
 * of today not yet held, then a finished one by its performed program. With one finished and
 * another running, Today led to the finished one.
 */
export function clientSessionToday(state, clientId, nowMs) {
  const today = dayOf(nowMs);
  const todays = (state?.sessions || []).filter(
    (session) =>
      Array.isArray(session.participants) &&
      session.participants.includes(clientId) &&
      dayOf(session.startDate) === today,
  );
  const running = new Set(
    allPrograms(state || {})
      .filter((program) => program.clientId === clientId && program.status === "live")
      .map((program) => program.sessionId),
  );
  const asEntry = (session) => ({
    kind: "session",
    id: session.id,
    date: session.startDate,
    session,
  });
  const live = todays.find((session) => running.has(session.id));
  if (live) return asEntry(live);
  const toCome = todays
    .filter((session) => !["done", "cancelled", "deleted"].includes(session.status))
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))[0];
  if (toCome) return asEntry(toCome);
  const { finished } = datedCandidates(state, clientId);
  let found = null;
  for (const entry of finished) {
    if (entry.day === today && (!found || earlier(entry, found))) found = entry;
  }
  return strip(found);
}

// `day` is this module's working value, not part of the answer.
function strip(entry) {
  if (!entry) return null;
  const { day, ...rest } = entry;
  return rest;
}
