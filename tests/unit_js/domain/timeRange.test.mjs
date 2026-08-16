// tests/unit_js/domain/timeRange.test.mjs
// Slot parsing and collision (src/domain/timeRange.js).
//
// Both rules pinned here were previously guarded only from a long way off: the midnight-crossing one
// by a full browser e2e test (tests/e2e/test_session_launch_time_of_day.py, which reaches it through
// a clipboard launch), and the touching-is-not-clashing one nowhere at all. They are two lines of
// pure arithmetic; this is the tier they belong in.

import assert from "node:assert/strict";
import { test } from "node:test";
import { isTimeOverlapping, parseTimeRange } from "../../../src/domain/timeRange.js";

test("a 24h slot reads as minutes past midnight", () => {
  assert.deepEqual(parseTimeRange("09:00 - 10:30"), { start: 540, end: 630 });
});

test("an afternoon slot written in AM/PM reads the same as its 24h form", () => {
  // Stored sessions predate the setup form, and imported ones need never have come from it.
  assert.deepEqual(parseTimeRange("2:00 PM - 3:30 PM"), parseTimeRange("14:00 - 15:30"));
});

test("a late-evening slot ending after midnight still has positive length", () => {
  // The bug this guards: read as an inverted range, a 22:00-00:00 session overlaps NOTHING — not
  // even itself — so the card that launches it goes dead with no error anywhere.
  const range = parseTimeRange("22:00 - 00:00");
  assert.ok(range.end > range.start);
  assert.ok(isTimeOverlapping(range, range));
});

test("something with no range in it is undated, not a zero-length slot", () => {
  assert.equal(parseTimeRange("Date Unknown"), null);
  assert.equal(parseTimeRange(""), null);
  assert.equal(parseTimeRange(undefined), null);
});

test("slots that share any minute collide", () => {
  assert.ok(isTimeOverlapping(parseTimeRange("10:00 - 11:00"), parseTimeRange("10:30 - 11:30")));
});

test("back-to-back slots do not collide", () => {
  // The `<` vs `<=` decision: back-to-back sessions are the normal gym-floor case, and calling them
  // a clash would make every honest warning built on this untrustworthy.
  assert.equal(
    isTimeOverlapping(parseTimeRange("10:00 - 11:00"), parseTimeRange("11:00 - 12:00")),
    false,
  );
});

test("an undated slot collides with nothing", () => {
  assert.equal(isTimeOverlapping(null, parseTimeRange("10:00 - 11:00")), false);
});
