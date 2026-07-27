// src/modules/clipboard/restDeckCard.js — a standalone rest between movements, first-class in the
// deck exactly like an exercise or circuit. Extracted from exerciseDeck.js's inline dispatch
// (2026-07-27) into the DeckCard hierarchy (see deckCard.js) as part of making rests first-class,
// focusable plan items — see TODO for the design.
//
// This is the fix for the reported bug: a collapsed rest card used to start its timer on ANY tap,
// with no focus concept at all standing in the way. Under the base class's Template Method skeleton
// that is now structurally impossible — renderCollapsed/wireCollapsed never touch the timer, only
// the focused template does, reached by tapping the collapsed card first like every other card.
//
// ctx: { t, escapeHTML, isFutureSession, startRestTimer }
// (onFocus comes from the base class's default wireCollapsed — no override needed here.)

import { DeckCard } from "./deckCard.js";

export class RestDeckCard extends DeckCard {
  get className() {
    return `exercise-deck-card rest-card${this.isInFocus ? " in-focus" : ""}${this.ctx.isFutureSession ? " future-session" : ""}`;
  }

  renderFocused(card) {
    const { t, escapeHTML } = this.ctx;
    const item = this.item;
    card.innerHTML = `
      <div class="deck-card-top">
        <span class="deck-card-counter"><i class="fa-solid fa-hourglass-half"></i></span>
        <span class="deck-card-top-right">
          <span class="badge badge-primary deck-card-status">In Focus</span>
        </span>
      </div>
      <h5 class="deck-card-name">${t("rest_label")}</h5>
      <div class="rest-card-duration">${escapeHTML(String(item.rest))}<span class="rest-card-duration-unit">s</span></div>
      <button type="button" class="btn primary-btn rest-card-start">
        <i class="fa-solid fa-stopwatch"></i> ${t("start_rest")}
      </button>
    `;
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

  renderCollapsed(card) {
    const { t, escapeHTML } = this.ctx;
    const item = this.item;
    card.innerHTML = `
      <div class="deck-card-compact rest-card-inner">
        <span class="deck-card-counter"><i class="fa-solid fa-hourglass-half"></i></span>
        <span class="deck-card-name deck-card-name-inline">${t("rest_label")}</span>
        <span class="deck-card-compact-target">${escapeHTML(String(item.rest))}s</span>
      </div>`;
  }

  // wireCollapsed: the base class default (tap → onFocus(item.index)) is exactly right — this is
  // the fix. Starting the timer is now only reachable from the focused state above.
}
