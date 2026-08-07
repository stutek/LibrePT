// src/domain/sessionClock.js
// Reconciles an active session's SCHEDULE (`sourceSession.startDate`/`endDate` — what was planned)
// against the WALL CLOCK (when the trainer actually tapped Start). Pure: no DOM, no persistence,
// no formatting — every caller owns its own rendering.
//
// It answers two questions that used to be answered in four places, three of them identically:
//
//   1. What does the headline timer mean? The bottom bar, the clipboard title bar and the dashboard
//      card each derived "seconds until sourceSession.endDate" on their own, which reads as an
//      overrun the instant a session is started late — tap Start at 10:05 on a 09:00-10:00 slot and
//      the timer opens at "-00h 05m", reporting overtime that never happened. A countdown is only
//      meaningful when the session BEGAN before its scheduled end; started after it, there is
//      nothing left to count down and the honest reading is elapsed time.
//   2. Has the clock drifted far enough from the plan to be worth offering to fix? Gym reality is
//      that sessions slip — a client arrives late, the previous group overruns — and the schedule,
//      not the trainer, is what is wrong by the time Start is tapped.

// A session that starts within a quarter hour of its slot is running to plan as far as the trainer
// is concerned; past that the schedule is stale enough to be worth one tap to correct.
export const SCHEDULE_DRIFT_TOLERANCE_MS = 15 * 60 * 1000;

// Fallback length for a slot with no usable scheduled range (an ad-hoc or half-specified session),
// so the adjust dialog always has a sane end time to propose.
const DEFAULT_SESSION_LENGTH_MS = 60 * 60 * 1000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// How long a cached live session is worth restoring for after it has stopped being current. Two
// hours covers a browser reload, a phone locking mid-set, and the walk between two gym floors;
// past that a session nobody completed is abandoned, not paused.
export const ACTIVE_SESSION_STALE_AFTER_MS = 2 * 60 * 60 * 1000;

// `startDate`/`endDate` arrive as Date objects from buildSessionMeta but as ISO strings once the
// session has been through the cache, so both shapes have to read the same.
function toEpochMs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function elapsedSeconds(activeSession, now) {
  if (!activeSession?.startTime) return activeSession?.duration || 0;
  return Math.floor((now - activeSession.startTime) / 1000);
}

// The headline timer for an active session: `{ seconds, isCountdown, isOvertime }`. Callers format
// it (the bar keeps second precision, the card and title bar round to "01h 32m") and use
// `isOvertime` for the warning styling — it is never set in count-up mode, because a session with
// no live schedule to overrun cannot be overrunning it.
export function computeActiveSessionCountdown(activeSession, now = Date.now()) {
  const startedAt = activeSession?.startTime ?? now;
  const scheduledEndMs = toEpochMs(activeSession?.sourceSession?.endDate);

  if (scheduledEndMs !== null && scheduledEndMs > startedAt) {
    const seconds = Math.round((scheduledEndMs - now) / 1000);
    return { seconds, isCountdown: true, isOvertime: seconds < 0 };
  }
  return { seconds: elapsedSeconds(activeSession, now), isCountdown: false, isOvertime: false };
}

// Signed milliseconds between the actual start and the scheduled one (positive = started late).
// Null when there is nothing to compare against: a planning draft carries no dates at all, and an
// ad-hoc clipboard has no source session (docs/DATA_MODEL.md §7).
export function computeScheduleDriftMs(sourceSession, actualStartMs) {
  if (!sourceSession || sourceSession.isPlanning) return null;
  const scheduledStartMs = toEpochMs(sourceSession.startDate);
  if (scheduledStartMs === null) return null;
  return actualStartMs - scheduledStartMs;
}

export function isScheduleDriftWorthAdjusting(sourceSession, actualStartMs) {
  const driftMs = computeScheduleDriftMs(sourceSession, actualStartMs);
  return driftMs !== null && Math.abs(driftMs) > SCHEDULE_DRIFT_TOLERANCE_MS;
}

// The range the adjust dialog opens on: the session shifted whole onto the actual start, keeping
// the length it was planned for. Start is floored to the minute because the dialog edits it through
// `<input type="time">`, which has no seconds to round-trip.
export function proposeAdjustedSchedule(sourceSession, actualStartMs) {
  const scheduledStartMs = toEpochMs(sourceSession?.startDate);
  const scheduledEndMs = toEpochMs(sourceSession?.endDate);
  const plannedLengthMs =
    scheduledStartMs !== null && scheduledEndMs !== null && scheduledEndMs > scheduledStartMs
      ? scheduledEndMs - scheduledStartMs
      : DEFAULT_SESSION_LENGTH_MS;

  const startMs = Math.floor(actualStartMs / 60000) * 60000;
  return { startMs, endMs: startMs + plannedLengthMs };
}

// Whether a cached live session is too old to restore. The window is measured from the moment the
// session STOPPED being current, and for a session the trainer actually started that moment is
// never earlier than the start itself — a 16:00-18:00 slot begun at 23:45 (exactly the late start
// the adjust dialog exists for) had not been running two hours by 23:45:01, however long ago its
// slot ended. Measuring from the scheduled end alone discarded such a session on the very next
// reload: the clipboard came back staged with the Start button restored, silently losing the
// session that was running and every set logged into it.
//
// A session that was only STAGED (opened, never started) still ages out against its slot — there
// is no elapsed time to lose, and a plan left open from this morning is not today's next session.
export function isCachedSessionStale(activeSession, now = Date.now()) {
  const scheduledEndMs = toEpochMs(activeSession?.sourceSession?.endDate);
  const startedAtMs = activeSession?.started ? (activeSession.startTime ?? null) : null;
  if (scheduledEndMs === null && startedAtMs === null) return false;

  const lastCurrentAtMs = Math.max(scheduledEndMs ?? -Infinity, startedAtMs ?? -Infinity);
  return now > lastCurrentAtMs + ACTIVE_SESSION_STALE_AFTER_MS;
}

function clockValueToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

// Turns the dialog's two "HH:MM" fields back into epochs, on the day the session is actually being
// run. An end at or before the start crosses midnight and rolls to the next day, the same reading
// `parseTimeRange` gives a "22:00 - 00:00" slot. Returns null if either field is unparseable, so a
// bad edit is rejected rather than silently zeroing the schedule.
export function resolveScheduleFromClockValues({ baseMs, startValue, endValue }) {
  const startMinutes = clockValueToMinutes(startValue);
  const endMinutes = clockValueToMinutes(endValue);
  if (startMinutes === null || endMinutes === null) return null;

  const midnight = new Date(baseMs);
  midnight.setHours(0, 0, 0, 0);
  const startMs = midnight.getTime() + startMinutes * 60000;
  const endMs =
    midnight.getTime() + endMinutes * 60000 + (endMinutes <= startMinutes ? MS_PER_DAY : 0);
  return { startMs, endMs };
}
