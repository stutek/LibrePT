// components/sessionCard.js
// Renders one session-booking card for the dashboard day columns (the tappable card that
// launches the clipboard). Dependencies are injected by the caller (renderSessions in app.js)
// so this component stays decoupled from app.js internals and is easy to relocate/test.
//
// deps: { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId }

export function renderSessionCard(b, colContainer, deps) {
  const { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId } = deps;

  const card = document.createElement('div');
  // Layout lives in .booking-card (index.css) so it can stack to a single column on mobile.
  // The temporal class tints the title to match the day-selection line (past/future).
  const temporal = sessionDayTemporal(b.day);
  card.className = 'booking-card card glassmorphic' + (temporal !== 'today' ? ` booking-${temporal}` : '');
  // The session currently in progress is emphasised (accent tint + border), the same visual
  // language as a selected participant, so it stands out from the rest of the day.
  const activeSession = deps.getActiveSession ? deps.getActiveSession() : null;
  const isLive = !b.completed && (
    (activeId && b.id === activeId) ||
    (activeSession && activeSession.id === b.id) ||
    (activeSession && activeSession.booking && activeSession.booking.id === b.id) ||
    (activeSession && activeSession.booking && activeSession.booking.ids && activeSession.booking.ids.includes(b.id))
  );
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

  let timerInitialText = '00:00';
  let timerIsOvertime = false;
  if (isLive && activeSession) {
    const endDate = activeSession.booking && activeSession.booking.endDate;
    if (endDate && deps.formatSignedDuration) {
      const remainingSec = Math.round((new Date(endDate).getTime() - Date.now()) / 1000);
      timerInitialText = deps.formatSignedDuration(remainingSec);
      timerIsOvertime = remainingSec < 0;
    } else if (deps.formatDuration) {
      timerInitialText = deps.formatDuration(activeSession.duration || 0);
    }
  }

  const liveMarkerHTML = isLive ? `
    <span class="badge badge-live session-card-live-marker" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); font-size: 10px; padding: 2px 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
      <span class="pulse-indicator" style="margin: 0; width: 6px; height: 6px;"></span>
      <span>${escapeHTML(t('live_tracking_clipboard') || 'Active Workout')}</span>
    </span>` : '';

  const liveTimerHTML = isLive ? `
    <span id="session-card-timer-${escapeHTML(b.id)}" class="session-card-timer badge ${timerIsOvertime ? 'overtime' : ''}" style="background: var(--card-bg); border: 1px solid ${timerIsOvertime ? '#ef4444' : 'var(--primary)'}; color: ${timerIsOvertime ? '#ef4444' : 'var(--primary)'}; font-size: 11px; font-family: monospace; font-weight: 700; padding: 2px 8px; margin-left: auto;">${escapeHTML(timerInitialText)}</span>` : '';

  info.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
      ${liveMarkerHTML}
      <span class="badge badge-primary" style="font-size: 10px; padding: 2px 6px; font-weight: 700; font-family: monospace;">${escapeHTML(b.time)}</span>
      <strong class="booking-card-title" style="font-size: 13px;">${escapeHTML(b.title)}</strong>
      ${liveTimerHTML}
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

  // No launch/completed button: the whole card is the tap target, and completion already shows
  // as a badge — the button just duplicated that and ate horizontal space.
  card.addEventListener('click', () => {
    launchClipboardDirectly(b.id);
  });

  card.appendChild(info);
  colContainer.appendChild(card);
}
