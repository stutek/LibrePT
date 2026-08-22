// tests/unit_js/domain/sessionSeries.test.mjs
// A repeating session, and the occurrences it stands for (src/domain/sessionSeries.js) — TODO §35.3a.
//
// The promise a trainer feels: "Tuesdays and Thursdays at six" is ONE thing they set up, the board
// still shows every evening it produces, and moving next Tuesday moves next Tuesday only. Everything
// here is pure — the board that draws these is modules/sessionList/, and the records that override
// one occurrence are ordinary sessions.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  occurrenceAsSession,
  occurrenceCalendarFields,
  occurrenceKey,
  seriesOccurrences,
  sessionsAfterRemoving,
  sessionsWithSeries,
  validateSeries,
} from "../../../src/domain/sessionSeries.js";

// Tuesdays and Thursdays at 18:00, from Tuesday 2026-08-25.
const SERIES = {
  id: "ser1",
  title: "Group Strength",
  startDate: "2026-08-25",
  time: "18:00 - 19:00",
  weekdays: [2, 4],
  participants: ["jane", "john"],
  routineId: "r1",
  location: "Trib gym base",
};

const datesOf = (occurrences) => occurrences.map((o) => o.occurrenceDate);

test("a weekly series produces the weekdays it names, in order", () => {
  const occurrences = seriesOccurrences(SERIES, { from: "2026-08-24", to: "2026-09-06" });

  assert.deepEqual(datesOf(occurrences), ["2026-08-25", "2026-08-27", "2026-09-01", "2026-09-03"]);
});

test("nothing is produced before the series starts", () => {
  // The trainer set it up on the 25th; the board should not invent the Tuesday before that.
  const occurrences = seriesOccurrences(SERIES, { from: "2026-08-01", to: "2026-08-26" });

  assert.deepEqual(datesOf(occurrences), ["2026-08-25"]);
});

test("a series that has ended stops producing evenings", () => {
  const until = { ...SERIES, until: "2026-09-01" };

  assert.deepEqual(datesOf(seriesOccurrences(until, { from: "2026-08-24", to: "2026-09-30" })), [
    "2026-08-25",
    "2026-08-27",
    "2026-09-01",
  ]);
});

test("every other week is a different series from every week", () => {
  const fortnightly = { ...SERIES, weekdays: [2], interval: 2 };

  assert.deepEqual(
    datesOf(seriesOccurrences(fortnightly, { from: "2026-08-24", to: "2026-09-30" })),
    ["2026-08-25", "2026-09-08", "2026-09-22"],
  );
});

test("an occurrence carries the slot the series was given", () => {
  const [first] = seriesOccurrences(SERIES, { from: "2026-08-24", to: "2026-08-26" });

  assert.equal(first.title, "Group Strength");
  assert.equal(first.time, "18:00 - 19:00");
  assert.deepEqual(first.participants, ["jane", "john"]);
  assert.equal(first.seriesId, "ser1");
  // The instant, so the board can sort it against one-off sessions on the same evening.
  assert.equal(new Date(first.startDate).getHours(), 18);
});

test("an occurrence a trainer has touched replaces the one the series would draw", () => {
  // Moving next Tuesday two hours later writes a REAL session for that occurrence. The series is
  // untouched, and the board must show the moved evening once, not twice.
  const moved = {
    id: "s-moved",
    seriesId: "ser1",
    occurrenceDate: "2026-08-25",
    title: "Group Strength",
    time: "20:00 - 21:00",
    startDate: "2026-08-25T20:00:00.000Z",
  };

  const shown = sessionsWithSeries([moved], [SERIES], { from: "2026-08-24", to: "2026-08-28" });

  assert.deepEqual(
    shown.map((s) => s.time),
    ["20:00 - 21:00", "18:00 - 19:00"],
  );
  assert.equal(shown.filter((s) => s.occurrenceDate === "2026-08-25").length, 1);
});

test("a cancelled occurrence leaves the evening empty and the series alive", () => {
  const cancelled = {
    id: "s-cancelled",
    seriesId: "ser1",
    occurrenceDate: "2026-08-25",
    cancelled: true,
  };

  const shown = sessionsWithSeries([cancelled], [SERIES], { from: "2026-08-24", to: "2026-08-28" });

  assert.deepEqual(datesOf(shown), ["2026-08-27"]);
});

test("one-off sessions are kept exactly as they are", () => {
  const oneOff = { id: "s1", title: "Assessment", startDate: "2026-08-26T09:00:00.000Z" };

  const shown = sessionsWithSeries([oneOff], [SERIES], { from: "2026-08-24", to: "2026-08-28" });

  assert.ok(shown.some((s) => s.id === "s1"));
});

test("an occurrence is addressed by its series and its ORIGINAL date", () => {
  // The date it was scheduled for, never the date it was moved to: that is what makes a second
  // invitation a change to the same evening rather than a new one (RECURRENCE-ID).
  assert.equal(occurrenceKey("ser1", "2026-08-25"), "ser1@2026-08-25");
});

test("a series nobody can act on is rejected before it reaches the board", () => {
  assert.match(validateSeries({ id: "s", weekdays: [], time: "18:00 - 19:00" }).join(" "), /day/);
  assert.match(validateSeries({ id: "s", weekdays: [2] }).join(" "), /time/);
  assert.match(validateSeries({ weekdays: [2], time: "18:00 - 19:00" }).join(" "), /id/);
});

test("touching an evening turns it into a session that the series still recognises", () => {
  const [first] = seriesOccurrences(SERIES, { from: "2026-08-24", to: "2026-08-26" });

  const stored = occurrenceAsSession(first, "s-new");

  assert.equal(stored.id, "s-new");
  assert.equal(stored.seriesId, "ser1");
  assert.equal(stored.occurrenceDate, "2026-08-25");
  assert.equal(stored.title, "Group Strength");
  assert.ok(!("fromSeries" in stored), "a stored row is not a derived one");
  // ...and the board shows that evening once, from the record.
  const shown = sessionsWithSeries([stored], [SERIES], { from: "2026-08-24", to: "2026-08-26" });
  assert.deepEqual(
    shown.map((s) => s.id),
    ["s-new"],
  );
});

test("an evening still where the rule put it travels as the whole series", () => {
  // One entry in the client's calendar for "Tuesdays and Thursdays at six", not one per evening.
  const [first] = seriesOccurrences(SERIES, { from: "2026-08-24", to: "2026-08-26" });

  const fields = occurrenceCalendarFields(SERIES, occurrenceAsSession(first, "s1"));

  assert.deepEqual(fields.recurrence.weekdays, [2, 4]);
  assert.equal(fields.recurrenceId, undefined);
});

test("a moved evening names the evening it replaces", () => {
  const moved = {
    id: "s1",
    seriesId: "ser1",
    occurrenceDate: "2026-08-25",
    startDate: new Date("2026-08-25T20:00:00").toISOString(),
  };

  const fields = occurrenceCalendarFields(SERIES, moved);

  assert.equal(fields.recurrence, undefined, "an exception does not carry the rule");
  assert.equal(fields.recurrenceId.getHours(), 18, "it points at where the rule had put it");
  assert.equal(fields.sequence, 1, "and says it is the newer word on that evening");
});

test("a one-off session has nothing to say about recurrence", () => {
  assert.deepEqual(occurrenceCalendarFields(null, { id: "s1" }), {});
});

test("deleting a one-off evening removes it", () => {
  const oneOff = { id: "s1", title: "Assessment" };

  assert.deepEqual(sessionsAfterRemoving([oneOff], ["s1"]), []);
});

test("deleting an evening of a repeating session keeps it as cancelled", () => {
  // Removing the row outright would be undone by the next render: the rule still says every
  // Tuesday, so the evening would come straight back.
  const occurrence = { id: "s1", seriesId: "ser1", occurrenceDate: "2026-08-25" };

  const after = sessionsAfterRemoving([occurrence], ["s1"]);

  assert.equal(after.length, 1);
  assert.equal(after[0].cancelled, true);
  assert.deepEqual(
    sessionsWithSeries(after, [SERIES], { from: "2026-08-24", to: "2026-08-26" }),
    [],
  );
});
