// src/domain/scheduleConflicts.js — is this slot a clash, or is it the normal gym-floor case?
// (TODO §1.6). Single responsibility: given one slot the trainer is about to save, say which
// already-known commitments it collides with and WHICH KIND of collision each one is. Pure — the
// form owns the warning, and the calendar client owns fetching the busy intervals.
//
// **An overlap is not automatically a conflict, and getting that backwards would make the warning
// worthless.** Two of this trainer's sessions running at the same time IN THE SAME PLACE is a
// designed feature, not a mistake: `getOverlappingSessions` merges them into a single clipboard so a
// trainer can run two clients on different programmes side by side. Warning about that would fire on
// the ordinary case, and a warning that fires on the ordinary case is one nobody reads by the second
// week. What is impossible is the trainer being in two PLACES at once — so a collision is only
// reported as a clash when both slots name a location and the names differ.
//
// **Silence when we do not know the place, not a guess.** A blank location means the trainer never
// filled the field in, which is common; treating unknown as "somewhere else" would warn on most of
// the merged case. This is the opposite of the choice `calendarFreeBusy.js` makes about an unreadable
// room, and deliberately so: there, the unknown is a room a DIFFERENT trainer may be occupying and
// the default action books over them; here the unknown is the trainer's own field, and the default
// action is a flow the app supports.
//
// **External busy intervals come in as data, not as Google.** `busy` is whatever the trainer's own
// calendar says they are already committed to — read via `data/calendarFreeBusy.js` today, and via
// whatever Microsoft's equivalent turns out to be later. Nothing in here knows which.
//
// deps: none — pure functions over plain objects.

import { parseTimeRange } from "./timeRange.js";

/** The slot is a clash: the trainer is booked somewhere else at the same time. */
export const DOUBLE_BOOKED = "doubleBooked";
/** The slot collides with an external calendar's busy interval (their own, not a room's). */
export const BUSY_ELSEWHERE = "busyElsewhere";
/** The slot overlaps another of this trainer's sessions in the same place — the merged-clipboard
 * case. Reported so the form can SAY so, because "these two will open as one clipboard" is not
 * obvious from a list of sessions, and is not a warning. */
export const MERGES_INTO_ONE_CLIPBOARD = "mergesIntoOneClipboard";

function toMillis(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

/** Two places are only different when we actually know both of them. */
function namesDifferentPlaces(a, b) {
  const normalise = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const left = normalise(a);
  const right = normalise(b);
  if (!left || !right) return false;
  return left !== right;
}

function overlaps(a, b) {
  // Strict on both sides — back-to-back is sequential, the same rule timeRange.js and overlapLanes.js
  // both rest on.
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

/** The absolute interval a stored session occupies, or null if it has no schedule to collide with.
 *
 * `startDate` is the session's own absolute timestamp and the only field that survives the passage of
 * time (the `day` field is a bucket — "upcoming" covers every date past tomorrow, so it cannot tell
 * next Monday from next Friday). Length comes from the `time` label, which is also what carries the
 * midnight crossing. A record with neither is genuinely unscheduled and collides with nothing. */
export function slotFromSession(session) {
  if (!session?.startDate) return null;
  const startMs = toMillis(session.startDate);
  if (Number.isNaN(startMs)) return null;
  const range = parseTimeRange(session.time);
  if (!range) return null;
  return { startMs, endMs: startMs + (range.end - range.start) * 60_000 };
}

/** The interval the setup form currently describes, or null while it is still incomplete.
 *
 * An end at or before the start crosses midnight, exactly as a stored slot's label does — so the
 * 22:00-00:00 session the form is being used to create gets the same length here that it will have
 * once saved. */
export function slotFromForm({ date, startTime, endTime }) {
  if (!date || !startTime) return null;
  const startMs = toMillis(`${date}T${startTime}`);
  if (Number.isNaN(startMs)) return null;
  const range = parseTimeRange(`${startTime} - ${endTime || startTime}`);
  return { startMs, endMs: startMs + (range.end - range.start) * 60_000 };
}

/** Everything the given slot collides with, most recent commitment first in schedule order.
 *
 * Returns `[{ kind, session?, interval? }]` — `session` for a collision with one of this trainer's
 * own stored sessions, `interval` for one with an external calendar's busy block. An empty array
 * means the slot is free, and a slot with no schedule yet is always free.
 *
 * `sessionId` is the session being EDITED, if any: a slot always overlaps its own stored copy, and
 * reporting that would make every re-save of an unchanged session look like a clash.
 */
export function findScheduleConflicts({ slot, sessionId, location }, { sessions = [], busy = [] }) {
  if (!slot) return [];
  const found = [];

  for (const session of sessions) {
    if (session.id === sessionId) continue;
    const other = slotFromSession(session);
    if (!other || !overlaps(slot, other)) continue;
    found.push({
      kind: namesDifferentPlaces(location, session.location)
        ? DOUBLE_BOOKED
        : MERGES_INTO_ONE_CLIPBOARD,
      session,
      startMs: other.startMs,
    });
  }

  for (const interval of busy) {
    const other = { startMs: toMillis(interval.start), endMs: toMillis(interval.end) };
    if (Number.isNaN(other.startMs) || Number.isNaN(other.endMs)) continue;
    if (!overlaps(slot, other)) continue;
    found.push({ kind: BUSY_ELSEWHERE, interval, startMs: other.startMs });
  }

  return found.sort((a, b) => a.startMs - b.startMs);
}

/** Does this set of collisions warrant interrupting the trainer? The merged-clipboard case never
 * does — it is a supported flow, and every caller that treats "has collisions" as "has a problem"
 * would be wrong about it. */
export function hasBlockingConflict(conflicts) {
  return conflicts.some(({ kind }) => kind !== MERGES_INTO_ONE_CLIPBOARD);
}
