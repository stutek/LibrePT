// components/exerciseDeck.js
// Renders the active-session exercise stack (the vertical scroll deck): the client's most-recent
// past session as tappable history cards, then the current routine folded into superset units
// (one card per circuit) and standalone exercise cards. Card rendering is delegated to
// supersetCard/exerciseCard; this module builds the deck items, wires their callbacks, and
// scrolls the acted-on card into view. Dependencies are injected by the caller
// (renderActiveGroupBoard in app.js) so it stays decoupled from app.js internals.
//
// deckContainer: the #active-exercise-scroll-deck element
// deps: {
//   activeSession, activeClientState, activeClientId, state,
//   t, escapeHTML, buildSupersetUnits, getExerciseSignalColor,
//   logQuickSignal, openFeedbackModal, completeSupersetRound, focusExerciseByIndex,
//   saveActiveSessionToCache, saveToLocalStorage,
//   onRerender()   // re-render the whole board (past-card toggle / superset save)
// }

import { renderSupersetCard } from './supersetCard.js';
import { renderExerciseCard } from './exerciseCard.js';

export function renderExerciseDeck(deckContainer, deps) {
  if (!deckContainer) return;
  const {
    activeSession, activeClientState, activeClientId, state,
    t, escapeHTML, buildSupersetUnits, getExerciseSignalColor,
    logQuickSignal, openFeedbackModal, completeSupersetRound, focusExerciseByIndex,
    saveActiveSessionToCache, saveToLocalStorage, onRerender, onEdit
  } = deps;

  deckContainer.innerHTML = '';

  // A launched future-day session is a plan, not a live workout — its exercises get the
  // same amber tint the dashboard uses for future days (mirrors the purple past history).
  const launchedDay = activeSession.booking ? activeSession.booking.day : null;
  const isFutureSession = launchedDay === 'tomorrow' || launchedDay === 'upcoming';

  // Single focus across the whole deck: while a past log is open, the live exercise card
  // collapses too, so exactly one card is ever expanded (the active-exercise pointer is
  // untouched, so it re-expands the moment the past card is closed).
  const pastExpanded = !!activeSession.expandedPastId;

  const formatDateStr = (dateIso) => {
    if (!dateIso) return '';
    const d = new Date(dateIso);
    return d.toLocaleDateString(state.lang === 'sl' ? 'sl-SI' : 'en-US', { month: 'short', day: 'numeric' });
  };

  // Past session exercises
  const clientHistory = (state.history || []).filter(h => h.clientId === activeClientId);
  clientHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  const pastExList = [];
  if (clientHistory.length > 0) {
    const pastSession = clientHistory[0];
    const dateStr = formatDateStr(pastSession.date);
    pastSession.exercises.forEach((ex, pIdx) => {
      pastExList.push({
        id: `past-${pastSession.id}-${ex.id}-${pIdx}`,
        name: ex.name,
        type: 'past',
        sessionDate: dateStr,
        sets: ex.sets,
        routineName: pastSession.routineName
      });
    });
  }

  // Current routine exercises
  const currentExIdx = activeClientState.activeExerciseIndex;
  const currentExList = activeClientState.exercises.map((ex, idx) => {
    // A rest is a first-class plan item (never focusable/loggable). It renders as a break row inside
    // its superset, or a standalone rest card in the deck. isCompleted:true keeps it from blocking a
    // circuit's "all members complete" aggregation in buildSupersetUnits.
    if (ex.type === 'rest') {
      return {
        id: ex.id, index: idx, type: 'rest', rest: ex.rest || 0,
        circuitId: ex.circuitId || null, circuitTitle: ex.circuitTitle || '', circuitSeries: ex.circuitSeries || 1,
        isInFocus: false, isCompleted: true
      };
    }

    const logsList = activeClientState.logs[ex.id] || [];
    const isCompleted = logsList.length > 0 && logsList.every(l => l.completed);
    const isInFocus = (idx === currentExIdx);

    return {
      id: ex.id,
      index: idx,
      name: ex.name,
      type: 'current',
      isCompleted,
      isInFocus,
      instructions: ex.instructions,
      setsTarget: ex.setsTargetCount || ex.sets || 3,
      repsTarget: ex.repsTarget || ex.reps || 10,
      weightTarget: ex.weightTarget || ex.weight || 0,
      rest: ex.rest || 0,
      circuitId: ex.circuitId || null,
      circuitTitle: ex.circuitTitle || '',
      circuitSeries: ex.circuitSeries || 1
    };
  });

  // Fold consecutive exercises that share a circuitId into a single superset/giantset unit; ungrouped
  // exercises stay as their own 'current' cards. Supersets render one card per group.
  const renderUnits = buildSupersetUnits(currentExList);
  const allDeckItems = [...pastExList, ...renderUnits];
  allDeckItems.forEach(item => {
    const card = document.createElement('div');

    if (item.type === 'past') {
      // Tap toggles the card open in place, right in the deck — no separate review panel
      const isExpanded = activeSession.expandedPastId === item.id;
      card.className = 'exercise-deck-card past-session' + (isExpanded ? ' past-expanded' : '');
      if (isExpanded) {
        // Logged history, not a target: every set is listed as-is rather than reduced to
        // one sets/reps/weight triplet, since loads and reps often vary across the sets
        const setRows = item.sets.map((s, sIdx) => `
            <div class="deck-history-set-row">
              <strong>S${sIdx + 1}</strong>
              <span class="deck-history-load">${escapeHTML(String(s.weight))} kg</span>
              <span class="deck-history-reps">${escapeHTML(String(s.reps))} reps</span>
              ${s.note ? `<span class="deck-history-note">${escapeHTML(s.note)}</span>` : ''}
            </div>`).join('');
        card.innerHTML = `
            <div class="deck-card-top">
              <span class="badge deck-card-status deck-card-status-past">Past: ${escapeHTML(item.sessionDate)}</span>
              <i class="fa-solid fa-chevron-up deck-history-collapse" aria-hidden="true"></i>
            </div>
            <h5 class="deck-card-name">${escapeHTML(item.name)}</h5>
            <div class="deck-history-sets">${setRows}</div>
            <div class="deck-history-meta">${escapeHTML(item.routineName || 'Completed Session')}</div>
          `;
      } else {
        const setsSummary = item.sets.map(s => `${s.weight}kg x ${s.reps}`).join(', ');
        card.innerHTML = `
            <div class="deck-card-compact">
              <span class="badge deck-card-status deck-card-status-past">Past: ${escapeHTML(item.sessionDate)}</span>
              <span class="deck-card-name deck-card-name-inline">${escapeHTML(item.name)}</span>
              <span class="deck-card-compact-target">${escapeHTML(setsSummary)}</span>
            </div>
          `;
      }
      card.addEventListener('click', () => {
        activeSession.expandedPastId = isExpanded ? null : item.id;
        onRerender();
      });
    } else if (item.type === 'rest') {
      // Standalone rest between movements — a non-interactive marker card.
      card.className = 'exercise-deck-card rest-card' + (isFutureSession ? ' future-session' : '');
      card.innerHTML = `
        <div class="deck-card-compact rest-card-inner">
          <span class="deck-card-counter"><i class="fa-solid fa-hourglass-half"></i></span>
          <span class="deck-card-name deck-card-name-inline">${t('rest_label')}</span>
          <span class="deck-card-compact-target">${escapeHTML(String(item.rest))}s</span>
        </div>`;
    } else if (item.type === 'circuit') {
      // Superset / Giant Set card render lives in components/supersetCard.js
      const round = (activeClientState.circuitRounds && activeClientState.circuitRounds[item.circuitId]) || 1;
      renderSupersetCard(card, item, {
        round,
        activeClientId,
        activeClientState,
        pastExpanded,
        isFutureSession,
        t,
        escapeHTML,
        getExerciseSignalColor,
        logQuickSignal,
        openFeedbackModal,
        completeSupersetRound,
        onEdit,
        saveSessionState: () => {
          saveActiveSessionToCache();
          saveToLocalStorage();
          onRerender();
        },
        onFocus: (index) => focusExerciseByIndex(index)
      });
    } else {
      // Standalone exercise card render lives in components/exerciseCard.js
      renderExerciseCard(card, item, {
        currentCount: currentExList.length,
        activeClientId,
        pastExpanded,
        isFutureSession,
        t,
        escapeHTML,
        getExerciseSignalColor,
        logQuickSignal,
        openFeedbackModal,
        onEdit,
        onFocus: (index) => focusExerciseByIndex(index)
      });
    }
    deckContainer.appendChild(card);
  });

  // Bring whatever the trainer just acted on into view: a freshly expanded past card if
  // there is one, otherwise the in-focus current exercise.
  setTimeout(() => {
    const focusEl = deckContainer.querySelector('.exercise-deck-card.past-expanded')
      || deckContainer.querySelector('.exercise-deck-card.in-focus');
    if (focusEl) {
      focusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}
