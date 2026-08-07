// src/modules/session/sessionTitleBar.js
// Renders the header / title block of the Active Session Overlay (date, time, and gym location).
//
// deps: {
//   getActiveSession(),
//   getISODateString(date),
//   formatClockFromMinutes(minutes)
// }

let deps = null;

export function initSessionTitleBar(d) {
  deps = d;
}

export function renderSessionTitle() {
  const el = document.getElementById("session-title-text");
  if (!el) return;
  const activeSession = deps.getActiveSession();
  if (!activeSession) return;

  const sourceSession = activeSession.sourceSession;
  if (sourceSession?.isPlanning) {
    el.textContent = `${sourceSession.titles[0]} · ${sourceSession.timeLabel}`;
    return;
  }
  const start = new Date(
    sourceSession?.startDate ? sourceSession.startDate : activeSession.startTime,
  );
  const datePart = deps.getISODateString(start);
  const timePart = deps.formatClockFromMinutes(start.getHours() * 60 + start.getMinutes());
  const location = sourceSession?.location ? ` ${sourceSession.location}` : "";
  el.textContent = `${datePart} ${timePart}${location}`;
}
