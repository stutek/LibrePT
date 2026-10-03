// tests/unit_js/data/calendarDay.test.mjs
// The trainer's calendar day is the LOCAL one. Run in Ljubljana's zone, where 00:38 on the 30th is
// still the 29th in UTC — the minute the new-session form offered yesterday.

process.env.TZ = "Europe/Ljubljana";

import assert from "node:assert/strict";
import { test } from "node:test";
import { localDateString, localDayOfInstant } from "../../../src/data/calendarDay.js";

test("just after local midnight the day is today, not the UTC yesterday", () => {
  assert.equal(localDateString(new Date("2026-09-29T22:38:00Z")), "2026-09-30");
});

test("late in the evening the day is still today, not the UTC tomorrow", () => {
  assert.equal(localDateString(new Date("2026-01-15T22:59:00Z")), "2026-01-15");
});

test("an instant at 23:30 UTC is the NEXT local day, not the first ten characters", () => {
  assert.equal(localDayOfInstant("2026-10-02T23:30:00.000Z"), "2026-10-03");
});

test("an empty, missing or unreadable instant has no day", () => {
  assert.equal(localDayOfInstant(""), "");
  assert.equal(localDayOfInstant(undefined), "");
  assert.equal(localDayOfInstant("not a time"), "");
});
