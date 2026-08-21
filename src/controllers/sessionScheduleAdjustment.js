// src/controllers/sessionScheduleAdjustment.js — "the gym ran late": reconciling a session that
// started well outside its scheduled slot. Single responsibility: OFFER the correction and, when the
// trainer accepts, write the adjusted slot everywhere one is held. Injected dependencies: `state`,
// `t`, `saveToLocalStorage`, `renderSessionTitle` and `renderSessions` arrive through
// activeSessionStore.js; the delete action is passed in by the caller rather than imported, because
// it lives in sessionLifecycle.js — which imports this module.

import {
  computeScheduleDriftMs,
  isScheduleDriftWorthAdjusting,
  proposeAdjustedSchedule,
  resolveScheduleFromClockValues,
} from "../domain/sessionClock.js";
import { sessionBelongsToSlot } from "../domain/sessionRecord.js";
import { formatClockFromMinutes } from "../modules/common/utils.js";
import { renderClipboardBar, updateSessionBarTimer } from "../modules/session/sessionBar.js";
import { openSessionStartTimeDialog } from "../modules/session/sessionStartTimeDialog.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";
import { updateOverlaySessionTimer } from "./sessionTimers.js";

// Writes an adjusted slot to both places that hold one: the live session's own copy (every
// clipboard countdown reads `sourceSession`) and the persisted session record(s) it was built from
// (the dashboard card, the day timeline and the completed-session stamp read those). A trainer who
// corrects the time in one place expects the other to agree.
function applyAdjustedSchedule({ startMs, endMs }) {
  const activeSession = getActiveSession();
  const sourceSession = activeSession?.sourceSession;
  if (!sourceSession) return;
  const appDeps = getAppDeps();

  const toClock = (ms) => {
    const date = new Date(ms);
    return formatClockFromMinutes(date.getHours() * 60 + date.getMinutes());
  };
  const timeLabel = `${toClock(startMs)} - ${toClock(endMs)}`;

  sourceSession.startDate = new Date(startMs);
  sourceSession.endDate = new Date(endMs);
  sourceSession.timeLabel = timeLabel;

  // The trainer's own answer to "when did this actually start" — what the elapsed clock and the
  // history record's date are both measured from. Never later than now: a start in the future would
  // put the session's own elapsed time back into the negative numbers this dialog exists to end.
  activeSession.startTime = Math.min(startMs, Date.now());
  activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);

  const sessions = Array.isArray(appDeps.state?.sessions) ? appDeps.state.sessions : [];
  for (const session of sessions) {
    if (!sessionBelongsToSlot(session, sourceSession)) continue;
    session.time = timeLabel;
    session.startDate = new Date(startMs).toISOString();
  }

  saveActiveSessionToCache();
  appDeps.saveToLocalStorage?.();
  appDeps.renderSessionTitle?.();
  renderClipboardBar();
  updateSessionBarTimer();
  updateOverlaySessionTimer();
  appDeps.renderSessions?.();
}

// A session started well outside its slot means the SCHEDULE is wrong, not the trainer — gyms run
// late. Offer to move the slot onto the session (sessionStartTimeDialog.js). Deliberately raised
// after the session is already running, so nothing on the gym floor waits behind a modal.
export function offerScheduleAdjustment({ onDeleteSession }) {
  const activeSession = getActiveSession();
  const sourceSession = activeSession?.sourceSession;
  const startedAt = activeSession?.startTime;
  if (!startedAt || !isScheduleDriftWorthAdjusting(sourceSession, startedAt)) return;
  const appDeps = getAppDeps();

  const { startMs, endMs } = proposeAdjustedSchedule(sourceSession, startedAt);
  openSessionStartTimeDialog({
    t: appDeps.t,
    scheduledLabel: sourceSession.timeLabel || "",
    driftMs: computeScheduleDriftMs(sourceSession, startedAt),
    proposedStartMs: startMs,
    proposedEndMs: endMs,
    onApply: ({ startValue, endValue }) => {
      const schedule = resolveScheduleFromClockValues({
        baseMs: startedAt,
        startValue,
        endValue,
      });
      if (schedule) applyAdjustedSchedule(schedule);
    },
    onDelete: () => {
      if (confirm(appDeps.t("confirm_delete_session"))) onDeleteSession();
    },
  });
}
