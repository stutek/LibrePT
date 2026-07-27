// src/modules/clipboard/pastDeckCard.js — the client's most recent past session, shown as a
// tappable reference card in the deck: a compact one-line summary, or (tapped) every set as
// logged. Extracted verbatim from exerciseDeck.js's inline dispatch (2026-07-27) into the
// DeckCard hierarchy (see deckCard.js).
//
// Its "focus" is deliberately NOT activeExerciseIndex — a past record isn't part of the live plan
// sequence at all — so it overrides `isInFocus` to read `expandedPastId` instead. This is the
// concrete case the polymorphism buys: a call site that just does `card.render(el)` never needs to
// know that THIS card type answers "am I focused?" a different way than every other card does.
//
// ctx: { activeSession, t, escapeHTML, formatLoad, formatReps, formatMetricValue, usesLoad, onRerender }

import { DeckCard } from "./deckCard.js";

export class PastDeckCard extends DeckCard {
  get isInFocus() {
    return this.ctx.activeSession.expandedPastId === this.item.id;
  }

  get className() {
    return `exercise-deck-card past-session${this.isInFocus ? " past-expanded" : ""}`;
  }

  renderFocused(card) {
    const { t, escapeHTML, formatLoad, formatReps, formatMetricValue, usesLoad } = this.ctx;
    const item = this.item;
    // Logged history, not a target: every set is listed as-is rather than reduced to one
    // sets/reps/weight triplet, since loads and reps often vary across the sets.
    const metric = item.metric || "reps";
    const showLoad = usesLoad(item.modality || "strength");
    const setRows = item.sets
      .map((s, sIdx) => {
        // Load-bearing modalities (strength, isometric) list a load column; cardio/holds/agility
        // collapse to their single logged magnitude (time/distance/cal/watts/hold) with no load.
        const loadCol = showLoad
          ? `<span class="deck-history-load">${escapeHTML(formatLoad(s.weight, item.loadUnit) || "—")}</span>`
          : "";
        const valueCol =
          metric === "reps"
            ? `${escapeHTML(formatReps(s.reps))} reps`
            : escapeHTML(formatMetricValue(s.reps, metric));
        return `
        <div class="deck-history-set-row">
          <strong>S${sIdx + 1}</strong>
          ${loadCol}
          <span class="deck-history-reps">${valueCol}</span>
          ${s.note ? `<span class="deck-history-note">${escapeHTML(s.note)}</span>` : ""}
        </div>`;
      })
      .join("");
    card.innerHTML = `
        <div class="deck-card-top">
          <span class="badge deck-card-status deck-card-status-past">Past: ${escapeHTML(item.sessionDate)}</span>
          <i class="fa-solid fa-chevron-up deck-history-collapse" aria-hidden="true"></i>
        </div>
        <h5 class="deck-card-name">${escapeHTML(item.name)}</h5>
        <div class="deck-history-sets">${setRows}</div>
        <div class="deck-history-meta">${escapeHTML(item.routineName || "Completed Session")}</div>
      `;
  }

  renderCollapsed(card) {
    const { escapeHTML, formatLoad, formatReps } = this.ctx;
    const item = this.item;
    const setsSummary = item.sets
      .map((s) => {
        const load = formatLoad(s.weight, item.loadUnit);
        return `${load ? `${load} x ` : ""}${formatReps(s.reps)}`;
      })
      .join(", ");
    card.innerHTML = `
        <div class="deck-card-compact">
          <span class="badge deck-card-status deck-card-status-past">Past: ${escapeHTML(item.sessionDate)}</span>
          <span class="deck-card-name deck-card-name-inline">${escapeHTML(item.name)}</span>
          <span class="deck-card-compact-target">${escapeHTML(setsSummary)}</span>
        </div>
      `;
  }

  // Both states share one behaviour: tap toggles the review panel open in place — there is no
  // separate "bring into focus, then act" step, unlike every other card type.
  wireFocused(card) {
    card.addEventListener("click", () => this.#toggle());
  }

  wireCollapsed(card) {
    card.addEventListener("click", () => this.#toggle());
  }

  #toggle() {
    const { activeSession, onRerender } = this.ctx;
    activeSession.expandedPastId = this.isInFocus ? null : this.item.id;
    onRerender();
  }
}
