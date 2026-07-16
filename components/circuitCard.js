// components/circuitCard.js
// Renders one circuit card: a grouped block of exercises with a round counter. It shows an
// optional title, a round badge over the circuit's series, every exercise (and any rest break)
// listed with a per-exercise feedback trio (Too Easy / Too Hard / Note), and a "Complete round"
// button that advances the counter (and finishes the circuit on the last round). Feedback stays
// tied to the exercise — logQuickSignal/openFeedbackModal receive that exercise's id.
//
// The caller creates the `card` element and appends it; this component only fills it in.
// ctx: {
//   round, activeClientId, pastExpanded, isFutureSession,
//   t, escapeHTML, getExerciseSignalColor,
//   logQuickSignal(tag, exId), openFeedbackModal(exId),
//   completeCircuitRound(circuitId), onFocus(firstExerciseIndex)
// }

export function renderCircuitCard(card, item, ctx) {
  const {
    round, activeClientId, pastExpanded, isFutureSession,
    t, escapeHTML, getExerciseSignalColor, logQuickSignal, openFeedbackModal,
    completeCircuitRound, onFocus
  } = ctx;

  const showInFocus = item.isInFocus && !pastExpanded;
  card.className = `exercise-deck-card circuit-card ${showInFocus ? 'in-focus' : (item.isCompleted ? 'completed' : '')}${isFutureSession ? ' future-session' : ''}`;
  const title = item.title ? escapeHTML(item.title) : t('combo_round_title');

  if (showInFocus) {
    const rows = [];
    item.items.forEach(ex => {
      const sig = getExerciseSignalColor(activeClientId, ex.name);
      const nameStyle = sig ? ` style="color:${sig};"` : '';
      const repLabel = `${escapeHTML(String(ex.repsTarget))}${ex.weightTarget > 0 ? ` · ${escapeHTML(String(ex.weightTarget))}${t('kg')}` : ''}`;
      rows.push(`
        <div class="circuit-ex-row" data-ex-id="${escapeHTML(ex.id)}">
          <div class="circuit-ex-head">
            <span class="circuit-ex-name"${nameStyle}>${escapeHTML(ex.name)}</span>
            <span class="circuit-ex-reps">${repLabel}</span>
          </div>
          <div class="circuit-ex-actions">
            <button type="button" class="circuit-sig easy" data-sig="easy" aria-label="${t('signal_too_easy')}"><i class="fa-solid fa-arrow-up"></i></button>
            <button type="button" class="circuit-sig hard" data-sig="hard" aria-label="${t('signal_too_hard')}"><i class="fa-solid fa-arrow-down"></i></button>
            <button type="button" class="circuit-sig note" data-sig="note" aria-label="${t('btn_log_feedback')}"><i class="fa-solid fa-file-lines"></i></button>
          </div>
        </div>`);
      if (ex.rest > 0) rows.push(`<div class="circuit-break-row"><i class="fa-solid fa-hourglass-half"></i> Rest ${ex.rest}s</div>`);
    });
    const isLastRound = round >= item.series;
    const footer = item.isCompleted
      ? `<div class="circuit-done"><i class="fa-solid fa-circle-check"></i> ${t('session_completed')}</div>`
      : `<button type="button" class="btn success-btn btn-sm circuit-complete-btn"><i class="fa-solid fa-check"></i> ${isLastRound ? 'Finish circuit' : `Complete round ${round} of ${item.series}`}</button>`;
    card.innerHTML = `
      <div class="deck-card-top">
        <span class="circuit-title"><i class="fa-solid fa-layer-group"></i> ${title}</span>
        <span class="circuit-round-badge">Round ${round}/${item.series}</span>
      </div>
      <div class="circuit-ex-list">${rows.join('')}</div>
      ${footer}
    `;
    card.querySelectorAll('.circuit-ex-row').forEach(rowEl => {
      const exId = rowEl.getAttribute('data-ex-id');
      rowEl.querySelector('.circuit-sig.easy').addEventListener('click', (e) => { e.stopPropagation(); logQuickSignal('Too Easy - Increase Load', exId); });
      rowEl.querySelector('.circuit-sig.hard').addEventListener('click', (e) => { e.stopPropagation(); logQuickSignal('Too Hard - Reduce Load', exId); });
      rowEl.querySelector('.circuit-sig.note').addEventListener('click', (e) => { e.stopPropagation(); openFeedbackModal(exId); });
    });
    const completeBtn = card.querySelector('.circuit-complete-btn');
    if (completeBtn) completeBtn.addEventListener('click', (e) => { e.stopPropagation(); completeCircuitRound(item.circuitId); });
  } else {
    card.innerHTML = `
      <div class="deck-card-compact">
        <span class="deck-card-counter"><i class="fa-solid fa-layer-group"></i></span>
        <span class="deck-card-name deck-card-name-inline">${title}</span>
        <span class="deck-card-compact-target">${item.items.length} ex · R${round}/${item.series}</span>
        ${item.isCompleted ? `<span class="badge badge-emerald deck-card-status">${t('session_completed')}</span>` : `<span class="badge deck-card-status deck-card-status-upcoming">Circuit</span>`}
      </div>`;
    // Focus the circuit by pointing the active index at its first exercise
    card.addEventListener('click', () => onFocus(item.items[0].index));
  }
}
