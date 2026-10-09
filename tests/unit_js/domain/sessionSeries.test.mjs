// tests/unit_js/domain/sessionSeries.test.mjs
// A repeating session, and the occurrences it stands for (src/domain/sessionSeries.js).
//
// The promise a trainer feels: "Tuesdays and Thursdays at six" is ONE thing they set up, the board
// still shows every evening it produces, and moving next Tuesday moves next Tuesday only. Everything
// here is pure — the board that draws these is modules/sessionList/, and the records that override
// one occurrence are ordinary sessions.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  claimFirstEvening,
  occurrenceAsSession,
  occurrenceCalendarFields,
  occurrenceKey,
  seriesOccurrences,
  seriesWithEdit,
  sessionsAfterCancelling,
  sessionsAfterRemoving,
  sessionsWithSeries,
  storedOccurrenceFor,
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

test("a cancelled occurrence is shown as itself, and the rule does not add that evening again", () => {
  const cancelled = {
    id: "s-cancelled",
    seriesId: "ser1",
    occurrenceDate: "2026-08-25",
    status: "cancelled",
  };

  const shown = sessionsWithSeries([cancelled], [SERIES], { from: "2026-08-24", to: "2026-08-28" });

  assert.deepEqual(datesOf(shown).sort(), ["2026-08-25", "2026-08-27"]);
  assert.equal(shown.find((s) => s.occurrenceDate === "2026-08-25").id, "s-cancelled");
});

test("a deleted occurrence leaves the evening empty and the series alive", () => {
  const deleted = {
    id: "s-deleted",
    seriesId: "ser1",
    occurrenceDate: "2026-08-25",
    status: "deleted",
  };

  const shown = sessionsWithSeries([deleted], [SERIES], { from: "2026-08-24", to: "2026-08-28" });

  assert.deepEqual(datesOf(shown), ["2026-08-27"]);
});

test("a cancelled one-off stays on the board", () => {
  const oneOff = { id: "s1", title: "Assessment", status: "cancelled" };

  const shown = sessionsWithSeries([oneOff], [], { from: "2026-08-24", to: "2026-08-28" });

  assert.deepEqual(
    shown.map((s) => s.id),
    ["s1"],
  );
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

test("the session saved with a new series is the series' evening on its date", () => {
  const tuesday = { id: "s1", startDate: new Date(2026, 7, 25, 18).toISOString() };
  const claimed = claimFirstEvening(tuesday, SERIES);
  assert.equal(claimed.seriesId, "ser1");
  assert.equal(claimed.occurrenceDate, "2026-08-25");
  const board = sessionsWithSeries([claimed], [SERIES], { from: "2026-08-24", to: "2026-08-26" });
  assert.equal(board.length, 1, "the first evening is on the board once");

  // A session on a day the rule does not produce stays a one-off beside it.
  const monday = { id: "s2", startDate: new Date(2026, 7, 24, 18).toISOString() };
  assert.equal(claimFirstEvening(monday, SERIES).seriesId, undefined);
  assert.equal(claimFirstEvening(tuesday, null), tuesday);
});

test("a series that ends before it starts is rejected; ending on its first day is not", () => {
  assert.match(
    validateSeries({ ...SERIES, until: "2026-08-18" }).join(" "),
    /end before it starts/,
  );
  assert.deepEqual(validateSeries({ ...SERIES, until: "2026-08-25" }), []);
  assert.deepEqual(validateSeries({ ...SERIES, until: "" }), []);
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

test("deleting an evening of a repeating session keeps its row, marked deleted", () => {
  // Removing the row outright would be undone by the next render: the rule still says every
  // Tuesday, so the evening would come straight back. Marked "deleted", not "cancelled": a
  // cancelled evening stays on the board, and the trainer chose to take this one off it.
  const occurrence = { id: "s1", seriesId: "ser1", occurrenceDate: "2026-08-25" };

  const after = sessionsAfterRemoving([occurrence], ["s1"]);

  assert.equal(after.length, 1);
  assert.equal(after[0].status, "deleted");
  assert.deepEqual(
    sessionsWithSeries(after, [SERIES], { from: "2026-08-24", to: "2026-08-26" }),
    [],
  );
});

test("cancelling keeps every row, one-off and repeating, marked cancelled", () => {
  const oneOff = { id: "s1", title: "Assessment", status: "scheduled" };
  const occurrence = { id: "s2", seriesId: "ser1", occurrenceDate: "2026-08-25" };
  const untouched = { id: "s3", title: "Other", status: "scheduled" };

  const after = sessionsAfterCancelling([oneOff, occurrence, untouched], ["s1", "s2"]);

  assert.deepEqual(
    after.map((s) => [s.id, s.status]),
    [
      ["s1", "cancelled"],
      ["s2", "cancelled"],
      ["s3", "scheduled"],
    ],
  );
  assert.equal(after[0].title, "Assessment", "the row keeps what it said");
  assert.equal(oneOff.status, "scheduled", "the stored list is not changed in place");
});

test("editing the whole series changes what the rule describes, not which days it falls on", () => {
  const edited = seriesWithEdit(SERIES, {
    title: "Group Strength & Conditioning",
    time: "19:00 - 20:00",
    participants: ["jane", "john", "sarah"],
  });

  assert.equal(edited.title, "Group Strength & Conditioning");
  assert.equal(edited.time, "19:00 - 20:00");
  assert.deepEqual(edited.participants, ["jane", "john", "sarah"]);
  // The days are the rule's own sentence — "we are moving to Wednesdays" is a different edit.
  assert.deepEqual(edited.weekdays, [2, 4]);
  assert.equal(edited.startDate, SERIES.startDate);
});

test("an edit that says nothing leaves the rule as it was", () => {
  assert.deepEqual(seriesWithEdit(SERIES, {}), SERIES);
});

// Ending a series is the form's "Until" on an evening of it: the new last day is written into THAT
// series. A series that was open stays open when the edit says nothing about "until".
test("an edit carrying a last day ends the series on it, and only when it says so", () => {
  const ended = seriesWithEdit(SERIES, { until: "2026-10-06" });
  assert.equal(ended.until, "2026-10-06");
  assert.equal(ended.id, SERIES.id);
  assert.equal(seriesWithEdit({ ...SERIES, until: "2026-10-06" }, {}).until, "2026-10-06");
  // An empty last day reopens the series.
  assert.equal(seriesWithEdit({ ...SERIES, until: "2026-10-06" }, { until: "" }).until, "");
  assert.deepEqual(
    datesOf(seriesOccurrences(ended, { from: "2026-08-24", to: "2026-12-31" })).slice(-1),
    ["2026-10-06"],
  );
});

test("an edit carrying weekdays replaces them; an empty list keeps the old ones", () => {
  assert.deepEqual(seriesWithEdit(SERIES, { weekdays: [3] }).weekdays, [3]);
  assert.deepEqual(seriesWithEdit(SERIES, { weekdays: [] }).weekdays, [2, 4]);
});

// A stored evening answers to the key the board taps with, which is the DERIVED evening's id. The
// record itself carries a fresh id, so asking by id alone said "not stored yet" on the second tap and
// wrote the evening a second time — two identical cards on one day.
test("an occurrence already written down is found by the key the board taps with", () => {
  const key = occurrenceKey("ser1", "2026-09-01");
  const stored = { id: "s-new", seriesId: "ser1", occurrenceDate: "2026-09-01" };

  assert.equal(storedOccurrenceFor([stored], key), stored);
  assert.equal(storedOccurrenceFor([stored], occurrenceKey("ser1", "2026-09-03")), null);
  assert.equal(storedOccurrenceFor([], key), null);
});

test("an ordinary session is still found by its own id", () => {
  const oneOff = { id: "s1", title: "Monday morning" };
  assert.equal(storedOccurrenceFor([oneOff], "s1"), oneOff);
  assert.equal(storedOccurrenceFor([oneOff], "s2"), null);
});
