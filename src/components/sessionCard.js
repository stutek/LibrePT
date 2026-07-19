// components/sessionCard.js
// Renders one session-booking card for the dashboard day columns (the tappable card that
// launches the clipboard). Dependencies are injected by the caller (renderSessions in app.js)
// so this component stays decoupled from app.js internals and is easy to relocate/test.
//
// deps: { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId }

import { parseTimeRange, formatSignedDuration } from '../helper/utils.js';

// A single interval counts down the clock-based ongoing-session timers (cards not driven by the
// launched-clipboard timer). Each such timer carries data-end (epoch ms of its scheduled end); the
// ticker updates the text, flips the "overtime" state, and warns the bar once it crosses zero.
let cardTicker = null;
function ensureCardTicker() {
  if (cardTicker) return;
  cardTicker = setInterval(() => {
    document.querySelectorAll('.booking-live-timer[data-end]').forEach(el => {
      const remSec = Math.round((parseInt(el.dataset.end, 10) - Date.now()) / 1000);
      el.textContent = formatSignedDuration(remSec);
      const over = remSec < 0;
      el.classList.toggle('overtime', over);
      const bar = el.closest('.booking-live-bar');
      if (bar) bar.classList.toggle('overtime', over);
    });
  }, 1000);
}

export function renderSessionCard(b, colContainer, deps) {
  const { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId } = deps;

  const card = document.createElement('div');
  // Layout lives in .booking-card (index.css) so it can stack to a single column on mobile.
  // The temporal class tints the title to match the day-selection line (past/future).
  const temporal = sessionDayTemporal(b.day);
  card.className = 'booking-card card glassmorphic' + (temporal !== 'today' ? ` booking-${temporal}` : '');
  // A card is marked "Active session" when it's the launched clipboard session (matched by the
  // booking id(s) it launched from) OR a session that has started by wall-clock today and isn't
  // closed. Every applicable card is marked, so overlapping sessions all show as ongoing. Once a
  // non-closed session runs past its end (negative remaining), the marker turns a warning colour.
  const activeSession = deps.getActiveSession ? deps.getActiveSession() : null;
  const sb = activeSession && activeSession.booking;
  const isLaunched = !b.completed && !!activeSession && (
    (activeId && b.id === activeId) ||
    (activeSession.id === b.id) ||
    (sb && sb.id === b.id) ||
    (sb && Array.isArray(sb.ids) && sb.ids.includes(b.id))
  );
  const range = parseTimeRange(b.time);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isNow = !b.completed && b.day === 'today' && !!range && nowMin >= range.start;
  const isLive = isLaunched || isNow;
  if (isLive) card.classList.add('booking-live');

  // Hover feedback style
  card.addEventListener('mouseenter', () => {
    card.style.background = 'rgba(255, 255, 255, 0.05)';
    card.style.transform = 'translateY(-1px)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = '';
    card.style.transform = '';
  });

  const info = document.createElement('div');
  info.style.flex = '1';

  // Resolve participants with injury checking
  const clients = b.participants.map(pId => state.clients.find(c => c.id === pId)).filter(Boolean);
  const clientHTMLs = clients.map(c => {
    let injuryIcon = '';
    if (c.hasInjury) {
      injuryIcon = ` <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 10px; color: #ef4444;" title="Has recorded injury"></i>`;
    }
    return `<span style="font-weight: 600; color: var(--text-color);">${escapeHTML(c.name)}${injuryIcon}</span>`;
  });
  const clientNamesStr = clientHTMLs.join(', ');

  // Find routine name
  const routine = state.routines.find(r => r.id === b.routineId);
  const routineName = routine ? routine.name : '';

  // Readiness warnings — a session needs both a program and at least one participant
  const pill = (label) => `
    <div class="booking-warning-pill" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${label}</span>
    </div>`;
  const warnings = [];
  if (!routineName) warnings.push(pill(t('program_not_defined')));
  if (clients.length === 0) warnings.push(pill(t('no_members_assigned')));
  const warningHTML = warnings.length
    ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">${warnings.join('')}</div>`
    : '';

  // A finished session is badged and de-emphasised rather than shown as launchable
  const completedBadge = b.completed
    ? `<span class="badge badge-success" style="font-size: 9px; padding: 2px 6px; font-weight: 700;"><i class="fa-solid fa-circle-check" style="margin-right:3px;"></i>${t('session_completed')}</span>`
    : '';
  if (b.completed) card.classList.add('booking-completed');

  // The live clipboard session's timer ticks via sessionBar (.session-card-timer). A session that is
  // only in-progress by the clock counts down via the shared card ticker (data-end). Both go
  // "overtime" (warning) once remaining time is negative.
  let timerText = '';
  let timerIsOvertime = false;
  let timerLive = false;   // driven by the launched clipboard timer
  let timerEndMs = null;   // scheduled end (epoch) for the clock-based countdown
  if (isLaunched && activeSession) {
    timerLive = true;
    const endDate = activeSession.booking && activeSession.booking.endDate;
    if (endDate) {
      const remainingSec = Math.round((new Date(endDate).getTime() - Date.now()) / 1000);
      timerText = formatSignedDuration(remainingSec);
      timerIsOvertime = remainingSec < 0;
    } else if (deps.formatDuration) {
      timerText = deps.formatDuration(activeSession.duration || 0);
    }
  } else if (isNow && range) {
    const end = new Date(); end.setHours(0, 0, 0, 0); end.setMinutes(range.end);
    timerEndMs = end.getTime();
    const remSec = Math.round((timerEndMs - Date.now()) / 1000);
    timerText = formatSignedDuration(remSec);
    timerIsOvertime = remSec < 0;
  }

  info.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
      <span class="badge badge-primary" style="font-size: 10px; padding: 2px 6px; font-weight: 700; font-family: monospace;">${escapeHTML(b.time)}</span>
      <strong class="booking-card-title" style="font-size: 13px;">${escapeHTML(b.title)}</strong>
      ${completedBadge}
    </div>
    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
      <i class="fa-solid fa-users" style="margin-right: 4px; font-size: 10px;"></i> ${clientNamesStr || `<span style="color: #ef4444;">—</span>`}
      <span style="margin-left: 4px; color: var(--primary); font-weight: 600;">(${clients.length}/${b.maxCapacity} ${t('spots_filled')})</span>
    </div>
    <div style="font-size: 11px; color: var(--text-muted);">
      <i class="fa-solid fa-clipboard-list" style="margin-right: 4px; font-size: 10px;"></i> Program: <span class="font-semibold">${routineName ? escapeHTML(routineName) : `<span style="color: #ef4444; font-weight: 600;">${t('undefined')}</span>`}</span>
    </div>
    ${warningHTML}
  `;

  // Green left bracket spills into a full-width bottom bar with the Active-session tag + countdown;
  // the bar turns a warning colour when the session has run past its end (overtime).
  const timerCls = (timerLive ? 'session-card-timer ' : '') + 'booking-live-timer' + (timerIsOvertime ? ' overtime' : '');
  const timerAttrs = timerLive ? ` id="session-card-timer-${escapeHTML(b.id)}"` : (timerEndMs != null ? ` data-end="${timerEndMs}"` : '');
  const timerSpan = timerText ? `<span${timerAttrs} class="${timerCls}">${escapeHTML(timerText)}</span>` : '';
  const liveBarHTML = isLive ? `
    <div class="booking-live-bar${timerIsOvertime ? ' overtime' : ''}">
      <span class="booking-live-tag"><i class="fa-solid fa-person-running"></i> ${escapeHTML(t('active_session') || 'Active session')}</span>
      ${timerSpan}
    </div>` : '';
  if (timerEndMs != null) ensureCardTicker();

  // No launch/completed button: the whole card is the tap target, and completion already shows
  // as a badge — the button just duplicated that and ate horizontal space.
  card.addEventListener('click', () => {
    launchClipboardDirectly(b.id);
  });

  card.appendChild(info);
  if (liveBarHTML) card.insertAdjacentHTML('beforeend', liveBarHTML);
  colContainer.appendChild(card);
}
