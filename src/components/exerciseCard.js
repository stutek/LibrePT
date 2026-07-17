// components/exerciseCard.js
// Renders one standalone (non-superset) exercise card inside the clipboard deck. It has two
// states: the in-focus card is the live logging surface (target sets/reps/weight plus the
// one-tap Too Easy / Too Hard / Feedback signals), and the compact row is a collapsed peek
// that taps to bring the exercise into focus.
//
// The caller creates the `card` element and appends it; this component only fills it in.
// ctx: {
//   currentCount, activeClientId, pastExpanded, isFutureSession,
//   t, escapeHTML, getExerciseSignalColor,
//   logQuickSignal(tag), openFeedbackModal(), onFocus(index)
// }

export function renderExerciseCard(card, item, ctx) {
  const {
    currentCount, activeClientId, pastExpanded, isFutureSession,
    t, escapeHTML, getExerciseSignalColor, logQuickSignal, openFeedbackModal, onFocus
  } = ctx;

  // An open past log defocuses the live card, so the active exercise renders compact too
  const showInFocus = item.isInFocus && !pastExpanded;
  const checkedClass = showInFocus ? 'in-focus' : (item.isCompleted ? 'completed' : '');
  card.className = `exercise-deck-card ${checkedClass}${isFutureSession ? ' future-session' : ''}`;

  let statusBadge = '';
  if (showInFocus) {
    statusBadge = `<span class="badge badge-cyan deck-card-status">In Focus</span>`;
  } else if (item.isCompleted) {
    statusBadge = `<span class="badge badge-emerald deck-card-status">Completed</span>`;
  } else {
    statusBadge = `<span class="badge deck-card-status deck-card-status-upcoming">Upcoming</span>`;
  }

  // Bodyweight/timed work has no load to show — a bare "0" reads as a missing value
  const weightValue = item.weightTarget > 0 ? item.weightTarget : '—';
  const counter = `${item.index + 1}/${currentCount}`;

  // Tint the title by any feedback logged for this exercise (see getExerciseSignalColor)
  const signalColor = getExerciseSignalColor(activeClientId, item.name);
  const nameStyle = signalColor ? ` style="color: ${signalColor};"` : '';

  if (showInFocus) {
    // Expanded focus card is the primary logging surface: target stats plus the
    // one-tap outcome signals that replaced the per-set stepper grid
    card.innerHTML = `
      <div class="deck-card-top">
        <span class="deck-card-counter">${counter}</span>
        ${statusBadge}
      </div>
      <h5 class="deck-card-name"${nameStyle}>${escapeHTML(item.name)}</h5>
      <div class="deck-card-stats">
        <div class="deck-stat">
          <span class="deck-stat-value">${escapeHTML(String(item.setsTarget))}</span>
          <span class="deck-stat-label">${t('sets')}</span>
        </div>
        <div class="deck-stat">
          <span class="deck-stat-value">${escapeHTML(String(item.repsTarget))}</span>
          <span class="deck-stat-label">${t('reps_label')}</span>
        </div>
        <div class="deck-stat">
          <span class="deck-stat-value">${escapeHTML(String(weightValue))}</span>
          <span class="deck-stat-label">${t('kg')}</span>
        </div>
      </div>
      <div class="deck-card-actions">
        <button type="button" class="deck-action-btn deck-action-easy" aria-label="${t('signal_too_easy')}">
          <i class="fa-solid fa-feather"></i><span>${t('signal_too_easy')}</span>
        </button>
        <button type="button" class="deck-action-btn deck-action-hard" aria-label="${t('signal_too_hard')}">
          <i class="fa-solid fa-weight-hanging"></i><span>${t('signal_too_hard')}</span>
        </button>
        <button type="button" id="btn-log-feedback" class="deck-action-btn deck-action-feedback" aria-label="${t('btn_log_feedback')}">
          <i class="fa-solid fa-triangle-exclamation"></i><span>${t('feedback_short')}</span>
        </button>
      </div>
    `;
    card.querySelector('.deck-action-easy').addEventListener('click', (e) => {
      e.stopPropagation();
      logQuickSignal('Too Easy - Increase Load');
    });
    card.querySelector('.deck-action-hard').addEventListener('click', (e) => {
      e.stopPropagation();
      logQuickSignal('Too Hard - Reduce Load');
    });
    card.querySelector('.deck-action-feedback').addEventListener('click', (e) => {
      e.stopPropagation();
      openFeedbackModal();
    });
  } else {
    // Compact row for the rest of the plan — tap to bring into focus. The target
    // is labelled S(ets) × R(eps) × weight so a collapsed, single-line card still
    // reads unambiguously (e.g. "S4 × R6 × 60kg").
    const compactTarget = `S${escapeHTML(String(item.setsTarget))} × R${escapeHTML(String(item.repsTarget))}` +
      (item.weightTarget > 0 ? ` × ${escapeHTML(String(item.weightTarget))}${t('kg')}` : '');
    card.innerHTML = `
      <div class="deck-card-compact">
        <span class="deck-card-counter">${counter}</span>
        <span class="deck-card-name deck-card-name-inline"${nameStyle}>${escapeHTML(item.name)}</span>
        <span class="deck-card-compact-target">${compactTarget}</span>
        ${statusBadge}
      </div>
    `;
    card.addEventListener('click', () => onFocus(item.index));
  }
}
