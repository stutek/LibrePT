// components/sessionList.js
// Renders a list of session cards inside a given container column, or displays
// an empty message if no sessions are scheduled in that column.
//
// container: DOM element to render into
// sessions: array of booking objects
// ctx: {
//   emptyMessage,
//   cardDeps: { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId }
// }

import { renderSessionCard } from "./sessionCard.js";

function getMinutesOfDay(b) {
  if (b.time) {
    const match = String(b.time).match(/^(\d{1,2}):(\d{2})/);
    if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  if (b.startDate) {
    const d = new Date(b.startDate);
    if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  }
  return 0;
}

function compareBookingsByStartTime(a, b) {
  const aDate = a.startDate ? new Date(a.startDate).getTime() : NaN;
  const bDate = b.startDate ? new Date(b.startDate).getTime() : NaN;
  if (!isNaN(aDate) && !isNaN(bDate)) {
    return aDate - bDate;
  }
  return getMinutesOfDay(a) - getMinutesOfDay(b);
}

export function renderSessionList(container, sessions, ctx) {
  if (!container) return;
  container.innerHTML = "";

  if (sessions.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px; font-size: 12px;">${ctx.emptyMessage}</div>`;
  } else {
    const sorted = [...sessions].sort(compareBookingsByStartTime);
    for (const s of sorted) {
      renderSessionCard(s, container, ctx.cardDeps);
    }
  }
}
