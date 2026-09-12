// tests/unit_js/modules/common/timeField.test.mjs
// How the time field READS what was typed into it (src/modules/common/timeField.js).
//
// The control itself needs a DOM and is pinned in tests/medium/test_edit_session_schedule.py. This
// is the half with no DOM in it and the half that can be wrong in silence: a half-typed entry that
// resolves to the wrong time is saved as a real slot, and nothing on screen says so.

import assert from "node:assert/strict";
import { test } from "node:test";
import { clockFromDigits, normalizeClockEntry } from "../../../../src/modules/common/timeField.js";

test("four digits are the time they spell", () => {
  assert.equal(clockFromDigits("1730"), "17:30");
  assert.equal(clockFromDigits("0900"), "09:00");
  assert.equal(clockFromDigits("0000"), "00:00");
});

test("an unfinished entry resolves the way a digital watch reads it", () => {
  assert.equal(clockFromDigits("9"), "09:00");
  assert.equal(clockFromDigits("17"), "17:00");
  assert.equal(clockFromDigits("173"), "17:30");
});

test("digits that cannot be an hour are read as one digit of hour and the rest as minutes", () => {
  // "93" cannot be 93 o'clock, and the trainer who typed it meant half past nine.
  assert.equal(clockFromDigits("93"), "09:30");
  assert.equal(clockFromDigits("930"), "09:30");
});

test("a slipped finger is clamped to a real time, never left unreadable", () => {
  assert.equal(clockFromDigits("2599"), "23:59");
  assert.equal(clockFromDigits("1999"), "19:59");
});

test("an empty field stays empty — `required` is what complains about it, not this", () => {
  assert.equal(clockFromDigits(""), "");
  assert.equal(normalizeClockEntry(""), "");
});

test("a value already in shape survives being read again", () => {
  // Playwright's `fill()` and every programmatic write go through this path; a normaliser that
  // moved "17:30" would move every seeded session and every restored draft with it.
  assert.equal(normalizeClockEntry("17:30"), "17:30");
  assert.equal(normalizeClockEntry("07:05"), "07:05");
});
