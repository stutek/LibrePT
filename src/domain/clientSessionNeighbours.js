// src/domain/clientSessionNeighbours.js — the previous and next plan for ONE client, from
// wherever the trainer is currently looking (TODO §52.2).
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
// `previous` is a finished session (`state.history`, never a planning draft: a draft was authored,
// not performed). `next` is the earliest later day, where a finished day is reached through its
// history record (what was done) rather than through its scheduled row, so stepping forward from an
// old session walks through the client's history before reaching today and the schedule. Only when
// there is no later day at all does the client's open planning draft stand in, the same order
// `notificationItems.js` gives "unscheduled plans": a dated slot beats an undated draft.
//
// `clientSessionToday` answers the third question the sideways deck asks — where "Today" leads back
// to — by the same rule, for the day that is today.
//
// Pure: state in, `{ previous, next }` (or today's entry) out. What to do with the result stays with
// the controller.

const dayOf = (date) => String(date || "").slice(0, 10);

// Among candidates on the same day, history before a scheduled row, then id ascending — a STABLE rule,
// so the answer does not flip between renders of the same state.
function earlier(a, b) {
  if (a.day !== b.day) return a.day < b.day;
  if (a.kind !== b.kind) return a.kind === "history";
  return a.id < b.id;
}

// Every dated candidate for one client: finished sessions from history, and scheduled rows on days
// that have no finished record. Shared by both answers below so "which entry stands for a day" is
// decided once.
function datedCandidates(state, clientId) {
  const history = (state?.history || []).filter((record) => record.clientId === clientId);
  const sessions = (state?.sessions || []).filter(
    (session) => Array.isArray(session.participants) && session.participants.includes(clientId),
  );

  const finished = history
    .filter((record) => !record.isPlanning)
    .map((record) => ({
      kind: "history",
      id: record.id,
      date: record.date,
      day: dayOf(record.date),
      record,
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
  return { history, finished, scheduled };
}

export function clientSessionNeighbours(state, clientId, anchor) {
  const anchorDay = dayOf(anchor?.date);
  const { history, finished, scheduled } = datedCandidates(state, clientId);

  let previous = null;
  for (const entry of finished) {
    if (entry.day < anchorDay && (!previous || earlier(previous, entry))) previous = entry;
  }

  let next = null;
  for (const entry of [...finished, ...scheduled]) {
    if (entry.day > anchorDay && (!next || earlier(entry, next))) next = entry;
  }

  if (!next) {
    const draft = history.find((record) => record.isPlanning && record.id !== anchor?.id);
    if (draft)
      next = {
        kind: "draft",
        id: draft.id,
        date: draft.date,
        day: dayOf(draft.date),
        record: draft,
      };
  }

  return { previous: strip(previous), next: strip(next) };
}

/**
 * The client's session TODAY, or null — what the clipboard's Today control returns to after the
 * trainer has pulled their way to another plan (TODO §52.2 step 4). Derived from the same history and
 * schedule as the neighbours, so there is no second record of "the session launched today" to keep
 * in step: a finished day answers with its history record, an unfinished one with its scheduled row.
 *
 * `nowMs` is an epoch; its day is taken from the ISO string, the same UTC reading `dayOf` gives every
 * stored `date`/`startDate`, so the two can be compared.
 */
export function clientSessionToday(state, clientId, nowMs) {
  const today = dayOf(new Date(nowMs).toISOString());
  const { finished, scheduled } = datedCandidates(state, clientId);
  let found = null;
  for (const entry of [...finished, ...scheduled]) {
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
