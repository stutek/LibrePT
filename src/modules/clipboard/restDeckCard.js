// src/modules/clipboard/restDeckCard.js — a standalone rest between movements, first-class in the
// deck exactly like an exercise or circuit. Extracted from exerciseDeckOfCards.js's inline dispatch
// (2026-07-27) into the DeckCard hierarchy (see deckCard.js) as part of making rests first-class,
// focusable plan items — see TODO for the design.
//
// This is the fix for the reported bug: a collapsed rest card used to start its timer on ANY tap,
// with no focus concept at all standing in the way. Under the base class's Template Method skeleton
// that is now structurally impossible — renderCard/wireCollapsed never touch the timer, and the
// Start button is only ever ADDED by addFocusElements, reached by tapping the card first like any
// other card.
//
// ctx: { t, escapeHTML, isFutureSession, startRestTimer }
// (onFocus comes from the base class's default wireCollapsed — no override needed here.)

import { DeckCard } from "./deckCard.js";

export class RestDeckCard extends DeckCard {
  get className() {
    return `exercise-deck-card rest-card${this.isInFocus ? " in-focus" : ""}${this.ctx.isFutureSession ? " future-session" : ""}`;
  }

  // The card, in every state (TODO §42.3). The focused rest used to throw this row away and draw
  // the duration again at 42px with a Start button under it — a very tall card saying the one thing
  // the row already said.
  renderCard(card) {
    const { t, escapeHTML } = this.ctx;
    const item = this.item;
    card.innerHTML = `
      <div class="deck-card-compact rest-card-inner">
        <span class="deck-card-counter"><i class="fa-solid fa-hourglass-half"></i></span>
        <span class="deck-card-name deck-card-name-inline">${t("rest_label")}</span>
        <span class="deck-card-compact-target">${escapeHTML(String(item.rest))}s</span>
      </div>`;
  }

  // What focus adds: the one thing a rest can be asked to do.
  addFocusElements(card) {
    const { t } = this.ctx;
    card.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="btn primary-btn rest-card-start">
        <i class="fa-solid fa-stopwatch"></i> ${t("start_rest")}
      </button>`,
    );
  }

  wireFocused(card) {
    const { startRestTimer, isFutureSession } = this.ctx;
    const startBtn = card.querySelector(".rest-card-start");
    if (startBtn && startRestTimer && !isFutureSession) {
      startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startRestTimer(this.item.rest, "rest");
      });
    }
  }

  // wireCollapsed: the base class default (tap → onFocus(item.index)) is exactly right — this is
  // the fix. Starting the timer is now only reachable from the focused state above.
}
