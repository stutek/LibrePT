// tests/unit_js/modules/common/dateField.test.mjs
// How the date field READS what was typed into it (src/modules/common/dateField.js).
//
// The control itself needs a DOM and is pinned in tests/medium/test_edit_session_schedule.py. This
// is the half with no DOM and the half that can be wrong in silence: a short entry resolved against
// the wrong month saves a session on a day nobody chose, and the form shows a real date either way.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dateFromDigits,
  dateFromDotted,
  dayMarks,
  isoToDate,
  normalizeDateEntry,
} from "../../../../src/modules/common/dateField.js";

const ON_SCREEN = "2026-09-15";

test("eight digits are the whole date", () => {
  assert.equal(dateFromDigits("20260912", ON_SCREEN), "2026-09-12");
  assert.equal(dateFromDigits("20270101", ON_SCREEN), "2027-01-01");
});

test("four digits are a month and a day inside the year on screen", () => {
  assert.equal(dateFromDigits("1102", ON_SCREEN), "2026-11-02");
});

test("two digits are a day inside the month on screen", () => {
  // The edit a trainer actually makes: same week, Thursday instead of Tuesday.
  assert.equal(dateFromDigits("17", ON_SCREEN), "2026-09-17");
  assert.equal(dateFromDigits("3", ON_SCREEN), "2026-09-03");
});

test("a day past the end of its month lands on the last one, not in the next", () => {
  // September has 30 days. JavaScript would roll "31 September" forward to the first of October in
  // silence, which is a session moved to a month nobody chose.
  assert.equal(dateFromDigits("31", ON_SCREEN), "2026-09-30");
  assert.equal(dateFromDigits("20260231", ON_SCREEN), "2026-02-28");
  assert.equal(dateFromDigits("9931", ON_SCREEN), "2026-12-31");
});

test("an empty field stays empty — `required` is what complains about it, not this", () => {
  assert.equal(dateFromDigits("", ON_SCREEN), "");
  assert.equal(normalizeDateEntry("", ON_SCREEN), "");
});

test("a value already in shape survives being read again", () => {
  // Every programmatic write and every `page.fill()` goes through this path; a normaliser that moved
  // "2026-09-15" would move every stored session and restored draft with it.
  assert.equal(normalizeDateEntry("2026-09-15", ON_SCREEN), "2026-09-15");
});

test("an ISO day is read as a LOCAL day, not as UTC midnight", () => {
  // `new Date("2026-09-12")` is midnight UTC, which is the 11th anywhere west of Greenwich — a
  // whole day lost on a date the trainer typed themselves.
  const date = isoToDate("2026-09-12");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 8);
  assert.equal(date.getDate(), 12);
});

test("a date that does not exist is not one", () => {
  assert.equal(isoToDate("2026-02-30"), null);
  assert.equal(isoToDate("2026-13-01"), null);
  assert.equal(isoToDate("12.09.2026"), null);
  assert.equal(isoToDate(""), null);
});

test("the marks start with the day given and run forward", () => {
  assert.deepEqual(dayMarks("2026-09-12", 4), [
    "2026-09-12",
    "2026-09-13",
    "2026-09-14",
    "2026-09-15",
  ]);
});

test("the marks cross a month end without arithmetic of their own", () => {
  assert.deepEqual(dayMarks("2026-09-29", 4), [
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
  ]);
});

test("a date written day first with dots is read as that day, not as digits", () => {
  // "6.10.2026" used to lose its separators and become year 6102, month 02, day 06, without a word.
  assert.equal(normalizeDateEntry("6.10.2026", ON_SCREEN), "2026-10-06");
  assert.equal(normalizeDateEntry("06.10.2026", ON_SCREEN), "2026-10-06");
  assert.equal(normalizeDateEntry("6. 10. 2026", ON_SCREEN), "2026-10-06");
  assert.equal(normalizeDateEntry("6/10/2026", ON_SCREEN), "2026-10-06");
  assert.equal(normalizeDateEntry("6-10-2026", ON_SCREEN), "2026-10-06");
});

test("day and month without a year take the year on screen", () => {
  assert.equal(normalizeDateEntry("6.10.", ON_SCREEN), "2026-10-06");
  assert.equal(normalizeDateEntry("6. 10.", ON_SCREEN), "2026-10-06");
  assert.equal(normalizeDateEntry("6.10", "2027-01-01"), "2027-10-06");
});

test("a day typed apart that is not real is refused, never turned into another day", () => {
  assert.equal(dateFromDotted("31.2.2026", ON_SCREEN), null);
  assert.equal(dateFromDotted("6.13.2026", ON_SCREEN), null);
  assert.equal(dateFromDotted("0.10.2026", ON_SCREEN), null);
  assert.equal(dateFromDotted("6.10.26", ON_SCREEN), null);
  assert.equal(dateFromDotted("29.2.2027", ON_SCREEN), null);
  assert.equal(normalizeDateEntry("31.2.2026", ON_SCREEN), "");
  assert.equal(dateFromDotted("29.2.2028", ON_SCREEN), "2028-02-29");
});

test("entries without separators, and ISO days, keep the digit rules", () => {
  assert.equal(dateFromDotted("20260912", ON_SCREEN), "");
  assert.equal(dateFromDotted("17", ON_SCREEN), "");
  assert.equal(dateFromDotted("2026-09-12", ON_SCREEN), "");
  assert.equal(normalizeDateEntry("2026-09-12", ON_SCREEN), "2026-09-12");
});
