// components/sessionTitleBar.js
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
  const el = document.getElementById('session-title-text');
  if (!el) return;
  const activeSession = deps.getActiveSession();
  if (!activeSession) return;

  const booking = activeSession.booking;
  const start = new Date(booking && booking.startDate ? booking.startDate : activeSession.startTime);
  const datePart = deps.getISODateString(start);
  const timePart = deps.formatClockFromMinutes(start.getHours() * 60 + start.getMinutes());
  const location = booking && booking.location ? ` ${booking.location}` : '';
  el.textContent = `${datePart} ${timePart}${location}`;
}
