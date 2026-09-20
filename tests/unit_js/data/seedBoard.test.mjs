// tests/unit_js/data/seedBoard.test.mjs
// What the board looks like the second a sandbox is built (TODO §35.3a, §40.4).
//
// The seed is generated relative to "now", so its defects appear and disappear with the clock and
// none of them can be seen by reading the file. Two were reported on 2026-09-11, both on a Friday
// morning:
//
//   • the repeating session's past evenings — Tuesday, Thursday — were derived rows, and a derived
//     row can never be marked finished, so the board showed them as sessions still waiting to be
//     run: red, "Overdue 64h", growing by the hour in a sandbox ninety seconds old;
//   • two seeded sessions shared the id `s09f2e3d`, so one of them silently replaced the other.
//
// These assertions are about the DATASET a trainer is shown, not about any one record, which is why
// they run over the same set the board draws (`sessionsWithSeries`) rather than over the seed array.

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SESSIONS, DEFAULT_SESSION_SERIES } from "../../../src/data/index.js";
import { sessionsWithSeries } from "../../../src/domain/sessionSeries.js";

// The window modules/sessionList/sessionsView.js draws: eight weeks ahead, one week back.
const calendarDate = (daysFromToday) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, "0")}`;
};

const boardRows = () =>
  sessionsWithSeries(DEFAULT_SESSIONS, DEFAULT_SESSION_SERIES, {
    from: calendarDate(-7),
    to: calendarDate(56),
  });

test("every seeded session has an id of its own", () => {
  const ids = DEFAULT_SESSIONS.map((session) => session.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, [], "two seeded sessions share an id, so one overwrites the other");
});

test("nothing on a fresh board is overdue by more than its own day", () => {
  const now = Date.now();
  // A session whose start has passed and which is not finished is drawn as OVERDUE. That is honest
  // about a session running late — the demo's live pair started an hour ago — and dishonest about
  // an evening days back that the sandbox invented already finished.
  //
  // **The cut is ELAPSED TIME, not the calendar day** (TODO §69, 2026-09-21). It used to be the
  // start of today, which failed this test for a whole hour every night: the live pair is
  // `slot(-1, +1)` in data/sessions.js and is DELIBERATELY allowed to cross midnight — the point of
  // that dataset is that something is running whenever a trainer opens it, and an earlier clamp
  // holding the spread inside one calendar day was removed for exactly that reason. Run at 00:29,
  // a pair that started at 23:29 landed on "yesterday" and was counted as stale.
  //
  // A day is the threshold the test's own name states, and it sits in the middle of a wide empty
  // band rather than being tuned to pass: the only unfinished rows in the past are the live pair at
  // one to two hours, the next unfinished row is in the FUTURE, and the defect this was written for
  // was reported at 64 hours.
  const A_DAY = 24 * 3600 * 1000;

  const stale = boardRows()
    .filter((session) => !session.completed)
    .filter((session) => now - new Date(session.startDate).getTime() > A_DAY)
    .map((session) => ({
      id: session.id,
      title: session.title,
      overdueHours: Math.round((now - new Date(session.startDate).getTime()) / 3600000),
    }));

  assert.deepEqual(stale, [], "a freshly built sandbox is showing sessions overdue from past days");
});

test("the repeating session's past evenings are stored, so the rule stops producing them", () => {
  // The mechanism behind the assertion above: a stored row that carries `occurrenceDate` speaks for
  // that evening, and `sessionsWithSeries` then leaves it out of what it derives. Without the
  // `occurrenceDate` the board would show the evening twice — once finished, once overdue.
  const [series] = DEFAULT_SESSION_SERIES;
  const spokenFor = DEFAULT_SESSIONS.filter((session) => session.seriesId === series.id);

  assert.ok(spokenFor.length > 0, "a series that started a week back has evenings behind it");
  for (const session of spokenFor) {
    assert.ok(session.occurrenceDate, `${session.id} names no evening of the series`);
    assert.equal(session.completed, true, `${session.id} is a past evening and is not finished`);
    assert.equal(session.time, series.time, `${session.id} is not in the series' own slot`);
  }
  const derived = boardRows().filter((row) => row.fromSeries);
  const collisions = derived.filter((row) =>
    spokenFor.some((session) => session.occurrenceDate === row.occurrenceDate),
  );
  assert.deepEqual(
    collisions.map((row) => row.occurrenceDate),
    [],
    "an evening is on the board twice: once stored, once derived",
  );
});
