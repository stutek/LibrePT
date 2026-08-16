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
