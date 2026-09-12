// src/domain/timeRange.js — reading a session's scheduled slot ("09:00 - 10:00") as an interval,
// and deciding whether two such intervals collide.
//
// This is training vocabulary, not formatting: a slot's minutes are what the day timeline lays out,
// what the clipboard merges on, and what a double-booking warning is computed from. It lived in
// `modules/common/utils.js` until the schedule-conflict rules needed it, at which point it could not
// stay there — `domain/` sits BELOW `modules/common/` in the import layering
// (agent_tools/import_layers.py), so a domain module cannot reach up for it, and duplicating a
// parser whose midnight rule is load-bearing is how the two copies quietly disagree.
//
// deps: none — pure functions over strings.

/** Parse a scheduled range into start/end minutes past midnight, or null if it isn't a range.
 *
 * Accepts both the 24h form the setup form produces (`computeTimeLabel`) and an AM/PM form, because
 * stored sessions predate the form and imported ones may not come from it at all. */
export function parseTimeRange(timeStr) {
  const parts = String(timeStr || "").split("-");
  if (parts.length !== 2) return null;
  const parseTime = (s) => {
    const m = s.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return 0;
    let hour = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ampm = m[3] ? m[3].toUpperCase() : null;
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return hour * 60 + min;
  };
  const start = parseTime(parts[0]);
  let end = parseTime(parts[1]);
  // A range whose end is at or before its start crosses midnight (e.g. "22:00 - 00:00"): treat the
  // end as the next day so overlap and duration maths stay correct. Without this a late-evening
  // session reads as an inverted range and overlaps nothing — not even itself — so its card
  // silently fails to launch (getOverlappingSessions returns []).
  if (end <= start) end += 24 * 60;
  return { start, end };
}

/** A single clock value ("17:30") as minutes past midnight, or null if it is not one.
 *
 * The strict reading of a field's contents: 24-hour only, and a value past 23:59 is not a time at
 * all. sessionClock.js carried a copy that skipped the range check, so a schedule could be rebuilt
 * from "25:00" as if it meant one in the morning the next day. */
export function clockToMinutes(value) {
  const parsed = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!parsed) return null;
  const hour = parseInt(parsed[1], 10);
  const minute = parseInt(parsed[2], 10);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

/** The clock time `minutes` after `time` ("06:00", 90 → "07:30"), wrapping past midnight.
 *
 * The setup form's end time follows its start with it: moving a session an hour earlier moves both
 * ends, because the length is what the trainer chose and the start is what they are changing. */
export function timePlusMinutes(time, minutes) {
  const parsed = String(time || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!parsed) return "";
  const total =
    (((parseInt(parsed[1], 10) * 60 + parseInt(parsed[2], 10) + minutes) % (24 * 60)) + 24 * 60) %
    (24 * 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Do two ranges share any time at all?
 *
 * Strict `<` on both sides: a session ending at 11:00 and one starting at 11:00 are SEQUENTIAL.
 * Back-to-back sessions are the normal case on a gym floor, and calling them a collision would
 * misinform the person every consumer of this exists to inform — the same decision, for the same
 * reason, that `domain/overlapLanes.js` makes about lane width. */
export function isTimeOverlapping(rangeA, rangeB) {
  if (!rangeA || !rangeB) return false;
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

/** The next `count` clock marks strictly after `time`, on the :00/:30 grid ("17:12", 4 →
 * ["17:30", "18:00", "18:30", "19:00"]). Wraps past midnight; `[]` if `time` is not a clock.
 *
 * These are the time field's shortcuts (modules/common/timeField.js). Absolute times rather than
 * "+30 min" offsets, and anchored on the clock rather than on the field's current value, because a
 * gym session is booked AT a time — the trainer is choosing "half past six", not adding thirty
 * minutes to something. Strictly after, so the end field's four marks are always four lengths of
 * session (30, 60, 90, 120 minutes) and never the start itself. */
export function nextClockMarks(time, count = 4) {
  const parsed = String(time || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!parsed) return [];
  const minutes = parseInt(parsed[1], 10) * 60 + parseInt(parsed[2], 10);
  const first = (Math.floor(minutes / 30) + 1) * 30;
  const pad = (n) => String(n).padStart(2, "0");
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const total = (first + index * 30) % (24 * 60);
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  });
}
