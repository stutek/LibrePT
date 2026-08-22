// src/domain/sessionSeries.js — a session that repeats, and the evenings it stands for (TODO §35.3a).
//
// Single responsibility: the recurrence rule and its exceptions. No DOM, no storage — the board that
// draws these is modules/sessionList/, and an occurrence a trainer has touched is an ordinary
// session record.
//
// **A series plus per-occurrence exceptions, not a pile of copies.** "Tuesdays and Thursdays at six"
// is ONE thing the trainer set up: writing it out as fifty session rows would make every later edit
// a fifty-row migration, and moving one evening indistinguishable from re-timing the lot. So the
// evenings are DERIVED from the rule, and only an evening something happened to — moved, cancelled,
// run, its plan edited — becomes a record of its own.
//
// **An occurrence is addressed by the series and its ORIGINAL date**, never the date it was moved
// to. That is what makes a second invitation a change to the same evening rather than a new one
// (`RECURRENCE-ID` in the calendar file, data/calendarInvite.js), and it is why a moved session
// keeps `occurrenceDate` alongside its new `startDate`.
//
// **Weekdays are JavaScript's own numbering** — 0 is Sunday, 6 is Saturday, exactly what `getDay()`
// returns. A second convention (ISO's Monday-is-1) would be one conversion away from a session that
// lands on the wrong evening, and nothing on screen would look wrong until someone missed a session.
//
// Injected dependencies: none — pure functions over plain objects.

import { computeSessionDayBucket } from "./sessionRecord.js";
import { parseTimeRange } from "./timeRange.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` for a local date, the same key the day timeline groups on. */
function calendarDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local midnight of a `YYYY-MM-DD`, so a series never drifts a day when the browser is east or
 * west of UTC — the same reason sessionRecord.js reads dates with local getters. */
function atMidnight(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

/** How an occurrence is named wherever one must be pointed at: the series, and the date it was
 * originally scheduled for. */
export function occurrenceKey(seriesId, occurrenceDate) {
  return `${seriesId}@${occurrenceDate}`;
}

/** Which occurrence a stored session stands for, or null when it is an ordinary one-off. */
export function sessionOccurrenceKey(session) {
  if (!session?.seriesId || !session?.occurrenceDate) return null;
  return occurrenceKey(session.seriesId, session.occurrenceDate);
}

/** Structural problems in a series, found before it reaches a board.
 *
 * A rule with no days produces nothing and a rule with no slot produces evenings nobody can be told
 * about — both are silent, which is the failure worth catching early. */
export function validateSeries(series) {
  const problems = [];
  if (!series?.id) problems.push("a series needs an id");
  if (!series?.startDate) problems.push("a series needs a start date");
  if (!Array.isArray(series?.weekdays) || series.weekdays.length === 0) {
    problems.push("a series needs at least one weekday");
  }
  if (!parseTimeRange(series?.time)) problems.push("a series needs a time slot like 18:00 - 19:00");
  return problems;
}

/** The evenings a series produces between two dates, inclusive, oldest first.
 *
 * `interval` is in WEEKS and counted from the week the series starts, so "every other Tuesday" stays
 * on the Tuesdays the trainer picked rather than drifting by whichever Tuesday a caller asked from.
 */
export function seriesOccurrences(series, { from, to } = {}) {
  if (validateSeries(series).length > 0) return [];

  const slot = parseTimeRange(series.time);
  const startsOn = atMidnight(series.startDate);
  const endsOn = series.until ? atMidnight(series.until) : null;
  const windowStart = from ? atMidnight(from) : startsOn;
  const windowEnd = atMidnight(to);
  const weekdays = new Set(series.weekdays);
  const interval = Math.max(1, series.interval || 1);

  // The Sunday of the week the series starts in, which is what makes "every other week" a property
  // of the SERIES rather than of the window someone happens to ask about.
  const week0 = new Date(startsOn);
  week0.setDate(week0.getDate() - week0.getDay());

  const occurrences = [];
  const cursor = new Date(Math.max(windowStart.getTime(), startsOn.getTime()));
  while (cursor <= windowEnd) {
    if (endsOn && cursor > endsOn) break;
    const weeksIn = Math.floor((cursor - week0) / (7 * DAY_MS));
    if (weekdays.has(cursor.getDay()) && weeksIn % interval === 0) {
      const startDateTime = new Date(cursor);
      startDateTime.setHours(Math.floor(slot.start / 60), slot.start % 60, 0, 0);
      const occurrenceDate = calendarDate(cursor);
      occurrences.push({
        // Derived rows are not records and never get a record's id: this one says exactly what it
        // is, so nothing can mistake it for something stored.
        id: occurrenceKey(series.id, occurrenceDate),
        seriesId: series.id,
        occurrenceDate,
        fromSeries: true,
        title: series.title,
        time: series.time,
        startDate: startDateTime.toISOString(),
        // The board groups and styles by this bucket, so a derived evening has to carry it or it
        // renders as a session with no relationship to today.
        day: computeSessionDayBucket(startDateTime),
        location: series.location,
        participants: [...(series.participants || [])],
        routineId: series.routineId || "",
        maxCapacity: series.maxCapacity ?? (series.participants || []).length,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return occurrences;
}

/** Everything the board should show for a window: the stored sessions, plus the evenings every
 * series still owes, minus the ones a stored session already speaks for.
 *
 * A stored session WINS over the rule it came from — that is what an exception is. A cancelled one
 * wins by leaving the evening empty, which is why cancelling is a record rather than a deletion:
 * the series would simply produce the evening again.
 */
export function sessionsWithSeries(sessions, seriesList, window = {}) {
  const spokenFor = new Set(
    (sessions || []).map(sessionOccurrenceKey).filter((key) => key !== null),
  );
  const generated = (seriesList || [])
    .flatMap((series) => seriesOccurrences(series, window))
    .filter((occurrence) => !spokenFor.has(occurrence.id));
  return [...(sessions || []).filter((session) => !session.cancelled), ...generated];
}

/** The stored session a derived evening BECOMES the moment a trainer does something with it.
 *
 * Touching an evening — opening it, moving it, running it, editing its plan — is what makes it
 * specific, and specific things are records. Everything else stays a rule, which is what keeps
 * "every Tuesday" one thing to edit rather than fifty.
 *
 * It keeps `occurrenceDate` so the series still recognises the evening as its own: without it the
 * rule would produce that Tuesday all over again, beside the row that already speaks for it.
 */
export function occurrenceAsSession(occurrence, id) {
  const { fromSeries: _derived, id: _derivedId, ...session } = occurrence;
  return { ...session, id };
}

/** The instant a series scheduled one of its evenings for — the evening's identity, independent of
 * where it was later moved to. */
export function scheduledStartFor(series, occurrenceDate) {
  const slot = parseTimeRange(series?.time);
  if (!slot || !occurrenceDate) return null;
  const start = atMidnight(occurrenceDate);
  start.setHours(Math.floor(slot.start / 60), slot.start % 60, 0, 0);
  return start;
}

/** What a calendar file has to say about a session that belongs to a series (TODO §35.3a).
 *
 * Two cases, and they are mutually exclusive:
 *   • the evening is still where the rule put it — the file carries the RULE, so the client's
 *     calendar holds ONE entry for "Tuesdays and Thursdays at six" rather than one per evening;
 *   • the evening was moved — the file carries the id of the evening it REPLACES, so the client's
 *     calendar changes that entry instead of gaining a second one beside it.
 *
 * `sequence` is 1 rather than a running count: a calendar only needs the newer file to outrank the
 * original (which is 0), and a counter would be a second thing to keep true about an evening that
 * already knows when it was moved.
 */
export function occurrenceCalendarFields(series, session) {
  if (!series || !session?.occurrenceDate) return {};
  const scheduled = scheduledStartFor(series, session.occurrenceDate);
  const actual = session.startDate ? new Date(session.startDate) : null;
  const moved = scheduled && actual && scheduled.getTime() !== actual.getTime();
  if (moved) return { recurrenceId: scheduled, sequence: 1 };
  return {
    recurrence: { weekdays: series.weekdays, interval: series.interval, until: series.until },
  };
}
