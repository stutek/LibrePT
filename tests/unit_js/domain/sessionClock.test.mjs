// tests/unit_js/modules/common/sessionClock.test.mjs
// The wall clock ↔ schedule reconciliation behind every active-session timer.
//
// Why this is gated rather than reviewed: the bug it pins shipped and was visible on the gym floor
// — start a session after its scheduled slot and the headline timer opened at a NEGATIVE value,
// reporting an overrun before a single set had been logged. Three surfaces (the bottom bar, the
// clipboard title bar, the dashboard card) each derived that number independently, so the fix is
// only durable if the shared decision is the tested one.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../src/domain/sessionClock.js";

const MINUTE = 60 * 1000;

function sessionAt({ startedAt, scheduledStart, scheduledEnd, duration = 0 }) {
  return {
    started: true,
    startTime: startedAt,
    duration,
    sourceSession:
      scheduledStart || scheduledEnd
        ? {
            id: "s1",
            startDate: scheduledStart ? new Date(scheduledStart) : null,
            endDate: scheduledEnd ? new Date(scheduledEnd) : null,
            timeLabel: "09:00 - 10:00",
          }
        : null,
  };
}

test("a session started inside its slot counts down to the scheduled end", () => {
  const now = Date.parse("2026-08-07T09:30:00");
  const session = sessionAt({
    startedAt: Date.parse("2026-08-07T09:00:00"),
    scheduledStart: Date.parse("2026-08-07T09:00:00"),
    scheduledEnd: Date.parse("2026-08-07T10:00:00"),
  });

  assert.deepEqual(clock.computeActiveSessionCountdown(session, now), {
    seconds: 1800,
    isCountdown: true,
    isOvertime: false,
  });
});

test("running past the scheduled end is overtime, and stays a countdown", () => {
  // The genuine overrun case must keep reading negative — that warning is the point of the
  // countdown, and the late-start fix below must not swallow it.
  const now = Date.parse("2026-08-07T10:05:00");
  const session = sessionAt({
    startedAt: Date.parse("2026-08-07T09:00:00"),
    scheduledStart: Date.parse("2026-08-07T09:00:00"),
    scheduledEnd: Date.parse("2026-08-07T10:00:00"),
  });

  const countdown = clock.computeActiveSessionCountdown(session, now);
  assert.equal(countdown.seconds, -300);
  assert.equal(countdown.isOvertime, true);
});

test("a session started after its scheduled end counts UP, never negative", () => {
  // THE BUG: tapping Start at 10:05 on a 09:00-10:00 slot opened the timer at -00h 05m. There is
  // no countdown left to run, so the honest reading is elapsed time — the same thing an ad-hoc
  // session with no schedule at all shows.
  const now = Date.parse("2026-08-07T10:07:00");
  const session = sessionAt({
    startedAt: Date.parse("2026-08-07T10:05:00"),
    scheduledStart: Date.parse("2026-08-07T09:00:00"),
    scheduledEnd: Date.parse("2026-08-07T10:00:00"),
  });

  assert.deepEqual(clock.computeActiveSessionCountdown(session, now), {
    seconds: 120,
    isCountdown: false,
    isOvertime: false,
  });
});

test("a session with no schedule at all counts up from its actual start", () => {
  const now = Date.parse("2026-08-07T10:10:00");
  const session = sessionAt({ startedAt: Date.parse("2026-08-07T10:00:00") });

  const countdown = clock.computeActiveSessionCountdown(session, now);
  assert.equal(countdown.seconds, 600);
  assert.equal(countdown.isCountdown, false);
});

test("a staged-but-unstarted session is measured from now, not from a null start", () => {
  // Opening the clipboard stages a session without starting it (startTime stays null). Its card
  // still renders a timer, so `now` stands in for the start that has not happened yet.
  const now = Date.parse("2026-08-07T09:30:00");
  const staged = {
    started: false,
    startTime: null,
    duration: 0,
    sourceSession: { endDate: new Date(Date.parse("2026-08-07T10:00:00")) },
  };
  const stale = {
    started: false,
    startTime: null,
    duration: 0,
    sourceSession: { endDate: new Date(Date.parse("2026-08-07T09:00:00")) },
  };

  assert.equal(clock.computeActiveSessionCountdown(staged, now).seconds, 1800);
  assert.deepEqual(clock.computeActiveSessionCountdown(stale, now), {
    seconds: 0,
    isCountdown: false,
    isOvertime: false,
  });
});

test("dates read the same whether they are Date objects or ISO strings", () => {
  // buildSessionMeta hands over Date objects; the same session read back from the cache carries
  // ISO strings. A reader that only handled one shape would work until the first reload.
  const now = Date.parse("2026-08-07T09:30:00");
  const cached = {
    startTime: Date.parse("2026-08-07T09:00:00"),
    duration: 0,
    sourceSession: { endDate: new Date(Date.parse("2026-08-07T10:00:00")).toISOString() },
  };

  assert.equal(clock.computeActiveSessionCountdown(cached, now).seconds, 1800);
});

test("drift is signed, and only offered past the tolerance", () => {
  const scheduled = { startDate: new Date(Date.parse("2026-08-07T09:00:00")) };

  assert.equal(
    clock.computeScheduleDriftMs(scheduled, Date.parse("2026-08-07T09:20:00")),
    20 * MINUTE,
  );
  assert.equal(
    clock.computeScheduleDriftMs(scheduled, Date.parse("2026-08-07T08:40:00")),
    -20 * MINUTE,
  );

  // The tolerance is exclusive: exactly 15 minutes out is still "running to plan".
  assert.equal(
    clock.isScheduleDriftWorthAdjusting(scheduled, Date.parse("2026-08-07T09:15:00")),
    false,
  );
  assert.equal(
    clock.isScheduleDriftWorthAdjusting(scheduled, Date.parse("2026-08-07T09:16:00")),
    true,
  );
  assert.equal(
    clock.isScheduleDriftWorthAdjusting(scheduled, Date.parse("2026-08-07T08:44:00")),
    true,
  );
});

test("a planning draft and an ad-hoc clipboard have no schedule to drift from", () => {
  // Neither carries dates (docs/DATA_MODEL.md §7), so neither may raise the dialog.
  const now = Date.parse("2026-08-07T09:00:00");
  assert.equal(clock.computeScheduleDriftMs({ isPlanning: true, titles: ["Draft"] }, now), null);
  assert.equal(clock.computeScheduleDriftMs(null, now), null);
  assert.equal(clock.isScheduleDriftWorthAdjusting(null, now), false);
});

test("the proposal shifts the whole slot, keeping the planned length", () => {
  const scheduled = {
    startDate: new Date(Date.parse("2026-08-07T09:00:00")),
    endDate: new Date(Date.parse("2026-08-07T10:00:00")),
  };
  // Seconds are floored off: the dialog edits these through <input type="time">, which cannot
  // round-trip them.
  const proposal = clock.proposeAdjustedSchedule(scheduled, Date.parse("2026-08-07T10:05:37"));

  assert.equal(proposal.startMs, Date.parse("2026-08-07T10:05:00"));
  assert.equal(proposal.endMs, Date.parse("2026-08-07T11:05:00"));
});

test("a slot with no usable length proposes an hour", () => {
  const startOnly = { startDate: new Date(Date.parse("2026-08-07T09:00:00")) };
  const proposal = clock.proposeAdjustedSchedule(startOnly, Date.parse("2026-08-07T10:00:00"));

  assert.equal(proposal.endMs - proposal.startMs, 60 * MINUTE);
});

test("the dialog's two clock fields resolve against the day the session is run", () => {
  const baseMs = Date.parse("2026-08-07T10:05:00");

  assert.deepEqual(
    clock.resolveScheduleFromClockValues({ baseMs, startValue: "10:05", endValue: "11:05" }),
    {
      startMs: Date.parse("2026-08-07T10:05:00"),
      endMs: Date.parse("2026-08-07T11:05:00"),
    },
  );
});

test("an end at or before the start crosses midnight", () => {
  // Same reading parseTimeRange gives a "22:00 - 00:00" slot — without it a late-evening session
  // resolves to a negative-length range.
  const baseMs = Date.parse("2026-08-07T22:10:00");
  const resolved = clock.resolveScheduleFromClockValues({
    baseMs,
    startValue: "22:10",
    endValue: "00:10",
  });

  assert.equal(resolved.endMs - resolved.startMs, 120 * MINUTE);
  assert.equal(resolved.endMs, Date.parse("2026-08-08T00:10:00"));
});

test("an unparseable field is rejected rather than silently zeroing the schedule", () => {
  const baseMs = Date.parse("2026-08-07T10:05:00");

  assert.equal(
    clock.resolveScheduleFromClockValues({ baseMs, startValue: "", endValue: "11:05" }),
    null,
  );
  assert.equal(
    clock.resolveScheduleFromClockValues({ baseMs, startValue: "10:05", endValue: "nope" }),
    null,
  );
});

test("a session started long after its slot is not instantly stale", () => {
  // The exact shape the adjust dialog exists for: a 16:00-18:00 slot the trainer opens at 23:45.
  // Measured against the SCHEDULED end it is already 5h45m old the second Start is tapped, so the
  // next reload discarded a session that had been running for seconds — the clipboard came back
  // staged, Start button restored, logged sets gone.
  const startedAt = Date.parse("2026-08-07T23:45:00");
  const lateStart = sessionAt({
    startedAt,
    scheduledStart: Date.parse("2026-08-07T16:00:00"),
    scheduledEnd: Date.parse("2026-08-07T18:00:00"),
  });

  assert.equal(clock.isCachedSessionStale(lateStart, startedAt + MINUTE), false);
  assert.equal(clock.isCachedSessionStale(lateStart, startedAt + 119 * MINUTE), false);
  // It still ages out — from when it actually ran, not from a slot it never ran in.
  assert.equal(clock.isCachedSessionStale(lateStart, startedAt + 121 * MINUTE), true);
});

test("a session only staged ages out against its slot", () => {
  // Nothing was started, so there is no elapsed time to lose and a plan left open this morning is
  // not this evening's next session.
  const staged = {
    started: false,
    startTime: null,
    sourceSession: {
      id: "s1",
      startDate: new Date(Date.parse("2026-08-07T16:00:00")),
      endDate: new Date(Date.parse("2026-08-07T18:00:00")),
    },
  };

  assert.equal(clock.isCachedSessionStale(staged, Date.parse("2026-08-07T19:59:00")), false);
  assert.equal(clock.isCachedSessionStale(staged, Date.parse("2026-08-07T20:01:00")), true);
});

test("a session with no schedule at all is kept until it has run its window", () => {
  // An ad-hoc clipboard and a planning draft carry no dates (docs/DATA_MODEL.md §7): with nothing
  // to age against, a staged one is never stale, and a started one ages from its own start.
  assert.equal(clock.isCachedSessionStale({ started: false, sourceSession: null }), false);

  const startedAt = Date.parse("2026-08-07T23:45:00");
  const adHoc = { started: true, startTime: startedAt, sourceSession: null };
  assert.equal(clock.isCachedSessionStale(adHoc, startedAt + MINUTE), false);
  assert.equal(clock.isCachedSessionStale(adHoc, startedAt + 121 * MINUTE), true);
});
