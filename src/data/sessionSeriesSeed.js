// src/data/sessionSeriesSeed.js — the demo's one REPEATING session (TODO §35.3a), and the evenings
// it has already held.
//
// Single responsibility: seed data for a series, kept out of sessions.js because that file is a list
// of individual evenings and this is a rule that produces them.
//
// One series, not three: the point it has to make on a demo board is that a repeating slot exists,
// is edited in one place, and still shows up on every evening it owes. A second rule would only add
// cards to scroll past.
//
// Anchored to "today" like every other seeded time, so the demo always looks live — and started a
// week back rather than today, so the board shows evenings already behind it as well as ahead: a
// trainer's real week has both, and "moving the next one only" means nothing on a rule with no past.

// The rule, in the four values every seeded evening below has to agree with. Written once here
// rather than twice, because a slot moved in the series and not in its past evenings would put the
// same Tuesday on the board at two different hours.
const SERIES_ID = "ser01f2e3";
const SERIES_TITLE = "Tuesday & Thursday Strength";
const SLOT_TIME = "18:00 - 19:00";
const SLOT_START_HOUR = 18;
// JavaScript's own numbering, the same `getDay()` returns: 2 is Tuesday, 4 is Thursday.
const WEEKDAYS = [2, 4];
const STARTS_DAYS_BACK = 7;
const LOCATION = "Trib gym base";
const PARTICIPANTS = ["c1a9f0e2", "c2b8e1d3"];
const ROUTINE_ID = "r12d5e6f";
const MAX_CAPACITY = 6;

const now = new Date();

const twoDigits = (value) => String(value).padStart(2, "0");
const calendarDate = (date) =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
const atMidnight = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const seriesStart = new Date(now);
seriesStart.setDate(seriesStart.getDate() - STARTS_DAYS_BACK);

export const DEFAULT_SESSION_SERIES = [
  {
    id: SERIES_ID,
    title: SERIES_TITLE,
    startDate: calendarDate(seriesStart),
    weekdays: WEEKDAYS,
    time: SLOT_TIME,
    location: LOCATION,
    participants: PARTICIPANTS,
    routineId: ROUTINE_ID,
    maxCapacity: MAX_CAPACITY,
  },
];

/**
 * The evenings this rule has already held, as finished sessions.
 *
 * A derived evening can never be marked finished — it is the output of a rule, not a record — so an
 * evening in the past that nobody stored shows on the board as a session whose start went by and
 * keeps counting up. On a Friday morning the freshly built sandbox opened on "Tuesday & Thursday
 * Strength — Overdue 64h" (reported 2026-09-11), which is not a thing a trainer's board ever says
 * about a week they actually worked.
 *
 * So the seed stores them, which is exactly what the app itself does the moment somebody touches an
 * evening (domain/sessionSeries.js, `occurrenceAsSession`): the row carries `occurrenceDate`, the
 * series recognises the evening as its own and stops producing it, and the board shows it once, as
 * done. These rows join `DEFAULT_SESSIONS` (data/sessions.js), so everything that already knows
 * what a seeded session is — the provenance stamp, a backup, a restore — covers them for free.
 *
 * Evenings BEFORE today only. Today's evening, if today is a Tuesday or a Thursday, stays a derived
 * evening: it may still be ahead, and once it is behind, "overdue by two hours" is the honest
 * reading of a slot the trainer has not opened yet.
 */
export const DEFAULT_SERIES_PAST_SESSIONS = (() => {
  const sessions = [];
  const cursor = atMidnight(seriesStart);
  const today = atMidnight(now);

  while (cursor < today) {
    if (WEEKDAYS.includes(cursor.getDay())) {
      const start = new Date(cursor);
      start.setHours(SLOT_START_HOUR, 0, 0, 0);
      const occurrenceDate = calendarDate(cursor);
      sessions.push({
        // Dated rather than fixed, because which evenings are behind us depends on the day the
        // sandbox is built: two ids minted on two different Tuesdays must not collide.
        id: `ss${twoDigits(cursor.getMonth() + 1)}${twoDigits(cursor.getDate())}${twoDigits(cursor.getFullYear() % 100)}`,
        seriesId: SERIES_ID,
        occurrenceDate,
        title: SERIES_TITLE,
        time: SLOT_TIME,
        startDate: start.toISOString(),
        // "yesterday" is the coarse bucket for ANY past day, not only the day before (the same
        // answer domain/sessionRecord.js's `computeSessionDayBucket` gives); the continuous board
        // axis sorts on `startDate` above.
        day: "yesterday",
        location: LOCATION,
        participants: [...PARTICIPANTS],
        routineId: ROUTINE_ID,
        maxCapacity: MAX_CAPACITY,
        completed: true,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return sessions;
})();
