// tests/unit_js/domain/scheduleConflicts.test.mjs
// Double-booking rules (TODO §1.6, src/domain/scheduleConflicts.js).
//
// The promise under test is not "overlaps are found" — it is that the trainer is interrupted for the
// thing that is actually impossible (being in two places at once) and left alone for the thing the
// app supports (two programmes running side by side in one room). A warning that fires on the
// ordinary case is one nobody reads by the second week, so the negative tests here matter as much as
// the positive ones.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BUSY_ELSEWHERE,
  DOUBLE_BOOKED,
  MERGES_INTO_ONE_CLIPBOARD,
  findScheduleConflicts,
  hasBlockingConflict,
  slotFromForm,
  slotFromSession,
} from "../../../src/domain/scheduleConflicts.js";

const DAY = "2026-08-20";
const session = (id, startTime, endTime, location) => ({
  id,
  startDate: new Date(`${DAY}T${startTime}`).toISOString(),
  time: `${startTime} - ${endTime}`,
  location,
});
const slotAt = (startTime, endTime) => slotFromForm({ date: DAY, startTime, endTime });
const kinds = (conflicts) => conflicts.map((c) => c.kind);

test("a slot with nowhere else to be reports nothing", () => {
  const conflicts = findScheduleConflicts(
    { slot: slotAt("09:00", "10:00"), location: "Studio A" },
    { sessions: [session("s1", "11:00", "12:00", "Studio A")] },
  );
  assert.deepEqual(conflicts, []);
});

test("overlapping the same place is the merged clipboard, not a clash", () => {
  // The designed case: two clients on different programmes, one trainer, one room. Interrupting here
  // would fire on the ordinary case.
  const conflicts = findScheduleConflicts(
    { slot: slotAt("09:00", "10:00"), location: "Studio A" },
    { sessions: [session("s1", "09:00", "10:00", "studio a")] },
  );
  assert.deepEqual(kinds(conflicts), [MERGES_INTO_ONE_CLIPBOARD]);
  assert.equal(hasBlockingConflict(conflicts), false, "the trainer is not interrupted for it");
});

test("overlapping a different place is a clash the trainer must see", () => {
  const conflicts = findScheduleConflicts(
    { slot: slotAt("09:00", "10:00"), location: "City park" },
    { sessions: [session("s1", "09:30", "10:30", "Studio A")] },
  );
  assert.deepEqual(kinds(conflicts), [DOUBLE_BOOKED]);
  assert.equal(conflicts[0].session.id, "s1");
  assert.ok(hasBlockingConflict(conflicts));
});

test("an unnamed place is not treated as a different place", () => {
  // Location is an optional field most trainers leave blank. Guessing "somewhere else" from a blank
  // would turn the supported merge case into a warning for most of its users.
  const blankOnOneSide = findScheduleConflicts(
    { slot: slotAt("09:00", "10:00"), location: "" },
    { sessions: [session("s1", "09:00", "10:00", "Studio A")] },
  );
  assert.deepEqual(kinds(blankOnOneSide), [MERGES_INTO_ONE_CLIPBOARD]);
});

test("back-to-back sessions in different rooms are not a clash", () => {
  const conflicts = findScheduleConflicts(
    { slot: slotAt("10:00", "11:00"), location: "City park" },
    { sessions: [session("s1", "11:00", "12:00", "Studio A")] },
  );
  assert.deepEqual(conflicts, []);
});

test("re-saving a session does not clash with its own stored copy", () => {
  const stored = session("s1", "09:00", "10:00", "Studio A");
  const conflicts = findScheduleConflicts(
    { slot: slotAt("09:00", "10:00"), sessionId: "s1", location: "City park" },
    { sessions: [stored] },
  );
  assert.deepEqual(conflicts, []);
});

test("the trainer's own calendar saying they are busy is a clash", () => {
  const conflicts = findScheduleConflicts(
    { slot: slotAt("09:00", "10:00"), location: "Studio A" },
    {
      busy: [{ start: `${DAY}T09:30:00`, end: `${DAY}T10:30:00` }],
    },
  );
  assert.deepEqual(kinds(conflicts), [BUSY_ELSEWHERE]);
  assert.ok(hasBlockingConflict(conflicts));
});

test("collisions are reported in schedule order regardless of where they came from", () => {
  // The form lists them; a list that jumps between an 11:00 item and a 09:00 one reads as noise.
  const conflicts = findScheduleConflicts(
    { slot: slotAt("09:00", "12:00"), location: "City park" },
    {
      sessions: [session("late", "11:00", "12:00", "Studio A")],
      busy: [{ start: `${DAY}T09:30:00`, end: `${DAY}T10:00:00` }],
    },
  );
  assert.deepEqual(kinds(conflicts), [BUSY_ELSEWHERE, DOUBLE_BOOKED]);
});

test("a session with no schedule collides with nothing", () => {
  assert.equal(slotFromSession({ id: "s1", time: "Date Unknown" }), null);
  const conflicts = findScheduleConflicts(
    { slot: slotAt("09:00", "10:00"), location: "City park" },
    { sessions: [{ id: "s1", startDate: undefined, time: "09:00 - 10:00", location: "Studio A" }] },
  );
  assert.deepEqual(conflicts, []);
});

test("a half-filled form warns about nothing", () => {
  assert.equal(slotFromForm({ date: "", startTime: "09:00", endTime: "10:00" }), null);
  assert.equal(slotFromForm({ date: DAY, startTime: "", endTime: "" }), null);
  assert.deepEqual(findScheduleConflicts({ slot: null, location: "" }, { sessions: [] }), []);
});

test("a session running past midnight still has its real length", () => {
  // Shares timeRange.js's midnight rule: read as inverted, a 22:00-00:00 slot would collide with
  // nothing at all, and the trainer would be told a genuine double-booking is fine.
  const stored = session("night", "22:00", "00:00", "Studio A");
  const slot = slotFromSession(stored);
  assert.equal(slot.endMs - slot.startMs, 2 * 60 * 60 * 1000);

  const conflicts = findScheduleConflicts(
    { slot: slotFromForm({ date: DAY, startTime: "23:00", endTime: "23:30" }), location: "Park" },
    { sessions: [stored] },
  );
  assert.deepEqual(kinds(conflicts), [DOUBLE_BOOKED]);
});
