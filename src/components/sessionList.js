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

import { renderSessionCard } from './sessionCard.js';

export function renderSessionList(container, sessions, ctx) {
  if (!container) return;
  container.innerHTML = '';
  
  if (sessions.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px; font-size: 12px;">${ctx.emptyMessage}</div>`;
  } else {
    sessions.forEach(s => renderSessionCard(s, container, ctx.cardDeps));
  }
}
