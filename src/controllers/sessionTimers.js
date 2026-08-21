// src/controllers/sessionTimers.js — everything in the session that counts. Single responsibility:
// the session's OWN elapsed-time interval and title-bar readout, plus starting a per-client
// rest/exercise timer on the trainer's behalf. Injected dependencies: the session and `t` come
// through activeSessionStore.js; the stacked multi-client timer overlay is
// modules/clipboard/exerciseAndRestTimer.js and the mini-bar readout is modules/session/sessionBar.js.

import { computeActiveSessionCountdown } from "../domain/sessionClock.js";
import { focusRefForItem } from "../domain/sessionFocus.js";
import { startTimer } from "../modules/clipboard/exerciseAndRestTimer.js";
import { formatDurationHourMin } from "../modules/common/utils.js";
import { updateSessionBarTimer } from "../modules/session/sessionBar.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

export function startSessionTimer() {
  const activeSession = getActiveSession();
  if (!activeSession || !activeSession.started) return;
  if (activeSession.timerIntervalId) clearInterval(activeSession.timerIntervalId);

  const tick = () => {
    // Re-read rather than closing over the session: cancelWorkoutSession clears the slot, and a
    // tick still holding the old object would keep stamping a session the trainer has left.
    const session = getActiveSession();
    if (!session) return;
    if (session.sourceSession?.isPlanning) {
      updateOverlaySessionTimer();
      updateSessionBarTimer();
      return;
    }
    session.duration = Math.floor((Date.now() - session.startTime) / 1000);
    updateOverlaySessionTimer();
    updateSessionBarTimer();
    saveActiveSessionToCache();
  };

  activeSession.timerIntervalId = setInterval(tick, 1000);
  tick();
}

// The title bar's live duration, once Start has been tapped: "01h 32m" (formatDurationHourMin),
// the same shorthand the dashboard card's own live/starts-in timers use (sessionCard.js) — one
// countdown shape across the whole app instead of this surface keeping its own H:MM:SS. Once the
// session runs past its scheduled end the wrap gets `.overtime`, which activeSessionOverlay.css
// turns into a warning-coloured pill — the trainer glances at the title bar, not a stopwatch app.
export function updateOverlaySessionTimer() {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const el = document.getElementById("overlay-session-duration");
  const wrap = document.getElementById("overlay-session-timer");
  if (!el) return;

  const { t } = getAppDeps();

  if (activeSession.sourceSession?.isPlanning) {
    el.textContent = t("planning") || "Planning";
    wrap?.classList.remove("overtime");
    return;
  }

  const { seconds, isOvertime } = computeActiveSessionCountdown(activeSession);
  el.textContent = formatDurationHourMin(seconds);
  wrap?.classList.toggle("overtime", isOvertime);
}

// Start a timer for the ACTIVE client (rest or exercise), labelled with their name so it's clear in
// the stacked, multi-client timer overlay. Deck cards call this with just seconds + type + label.
export function startClientTimer(seconds, type = "rest", label = "") {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const clientId = activeSession.activeClientId;
  const client = getAppDeps().state?.clients?.find((c) => c.id === clientId);
  const cs = activeSession.clientRoutines[clientId];
  // The SAME ref builder the URL uses: this one used to spell a standalone rest as an "exercise",
  // which focusIndexFromRef refuses to resolve, so tapping the timer card never landed on the rest
  // it was counting down (TODO §24.4).
  const focusRef = focusRefForItem(cs?.exercises?.[cs.activeExerciseIndex]);
  startTimer({
    clientId,
    clientName: client ? client.name : "",
    type,
    label,
    seconds,
    sessionId: activeSession.id,
    focusRef,
  });
}
