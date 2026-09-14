// src/modules/clipboard/exerciseCard.js
// Renders one standalone (non-circuit) exercise card inside the clipboard deck: number, name,
// target and status on one row. The card in focus is the same row plus what it takes to log
// against it — the ⏱ rest timer and the one-tap Too Easy / Too Hard / Feedback signals.
//
// ExerciseDeckCard is a DeckCard subclass (see deckCard.js): render() is the base class's fixed
// skeleton (the one design, then what focus adds, then wire); this file supplies the hooks.
//
// ctx: {
//   currentCount, activeClientId, pastExpanded, isFutureSession,
//   t, escapeHTML, getExerciseSignalColor, hasQuickSignal(clientId, exerciseName, tag),
//   logQuickSignal(tag), openFeedbackModal(), onFocus(index)
// }

import {
  compactTargetString,
  isTimeBasedMetric,
  toSeconds,
} from "../../domain/exerciseModality.js";
import { DeckCard } from "./deckCard.js";

export class ExerciseDeckCard extends DeckCard {
  // An open past log defocuses the live card too, so the active exercise renders compact — the one
  // place this card's focus rule differs from the base class's plain item.isInFocus.
  get isInFocus() {
    return this.item.isInFocus && !this.ctx.pastExpanded;
  }

  get className() {
    const checkedClass = this.isInFocus ? "in-focus" : this.item.isCompleted ? "completed" : "";
    return `exercise-deck-card ${checkedClass}${this.ctx.isFutureSession ? " future-session" : ""}`;
  }

  // The card, in every state (TODO §42.3). There is no second, taller template: the block of three
  // big stat tiles the focused card used to draw said the same sets/reps/load this one line already
  // says, in a different design and 52px further down the card, so opening a card replaced what the
  // trainer was reading instead of adding to it.
  renderCard(card) {
    const { activeClientId, t, escapeHTML, getExerciseSignalColor, currentCount } = this.ctx;
    const item = this.item;
    const counter = `${item.index + 1}/${currentCount}`;
    // Tint the title by any feedback logged for this exercise (see getExerciseSignalColor)
    const signalColor = getExerciseSignalColor(activeClientId, item.name);
    const nameClass = signalColor ? " has-signal-color" : "";
    const nameStyle = signalColor ? ` style="--signal-color: ${signalColor};"` : "";
    // NO badge for the card in focus (ruled 2026-09-10): the tint and the border already say which
    // card it is, in every theme, and a word repeating what the colour has said costs a slot in the
    // title row that Completed and Upcoming actually need. Those two stay, because nothing else on
    // the card says them.
    let statusBadge = "";
    if (this.isInFocus) {
      statusBadge = "";
    } else if (item.isCompleted) {
      statusBadge = `<span class="badge badge-success deck-card-status">Completed</span>`;
    } else {
      statusBadge = `<span class="badge deck-card-status deck-card-status-upcoming">${t("upcoming")}</span>`;
    }

    // The target is labelled S(ets) × R(eps) × weight so one line reads unambiguously, with a load
    // axis only for load-bearing modalities — see compactTargetString's own doc for the examples.
    // Shared with the read-only plan sheet (planSheet.js, TODO §52.2 step 2) so the wording can
    // never drift between the live card and the sheet drawn under it.
    const compactTarget = escapeHTML(
      compactTargetString({
        setsTarget: item.setsTarget,
        repsTarget: item.repsTarget,
        metric: item.metric || "reps",
        modality: item.modality || "strength",
        weightTarget: item.weightTarget,
        loadUnit: item.loadUnit,
      }),
    );

    card.innerHTML = `
      <div class="deck-card-compact">
        <span class="deck-card-counter">${counter}</span>
        <span class="deck-card-name deck-card-name-inline${nameClass}"${nameStyle}>${escapeHTML(item.name)}</span>
        <span class="deck-card-compact-target">${compactTarget}</span>
        ${statusBadge}
      </div>
    `;
  }

  // What focus adds: the timer at the end of the head row — the slot §42.5 keeps for a card's own
  // control — and the logging row under it.
  addFocusElements(card) {
    const { activeClientId, hasQuickSignal, t } = this.ctx;
    const item = this.item;

    // Too Easy / Too Hard are toggles: pressed state mirrors whether THIS exact quick-signal is
    // already logged, so a second tap (which un-logs it) reads correctly the moment it lands.
    const isEasyActive = hasQuickSignal(activeClientId, item.name, "Too Easy - Increase Load");
    const isHardActive = hasQuickSignal(activeClientId, item.name, "Too Hard - Reduce Load");
    // A written or voice note is INDEPENDENT of any signal — a card can carry either, both or
    // neither — so the feedback button marks its own state rather than borrowing the signal's.
    const hasNote = this.ctx.hasExerciseNote?.(activeClientId, item.name) || false;

    // The SHAPE changes with state, not just the colour: on a sunlit gym floor, and for a
    // colour-blind trainer, a filled background alone is a lightness cue that a phone at an angle
    // can lose. Font Awesome's outline weight is not an option — the regular face was dropped from
    // src/fonts/fontawesome.css on 2026-08-06 and an `fa-regular` class silently renders solid — so
    // the state is carried by a different SOLID glyph, which costs no payload and reads in greyscale.
    const easyIcon = isEasyActive ? "fa-circle-check" : "fa-feather";
    const hardIcon = isHardActive ? "fa-circle-check" : "fa-weight-hanging";

    card
      .querySelector(".deck-card-compact")
      .insertAdjacentHTML(
        "beforeend",
        `<button type="button" class="deck-card-timer" aria-label="${t("rest_timer")}" title="${t("rest_timer")}"><i class="fa-solid fa-stopwatch"></i></button>`,
      );
    card.insertAdjacentHTML(
      "beforeend",
      `
      <div class="deck-card-actions">
        <button type="button" class="deck-action-btn deck-action-easy${isEasyActive ? " active" : ""}" aria-pressed="${isEasyActive}" aria-label="${t("signal_too_easy")}">
          <i class="fa-solid ${easyIcon}"></i><span>${t("signal_too_easy")}</span>
        </button>
        <button type="button" class="deck-action-btn deck-action-hard${isHardActive ? " active" : ""}" aria-pressed="${isHardActive}" aria-label="${t("signal_too_hard")}">
          <i class="fa-solid ${hardIcon}"></i><span>${t("signal_too_hard")}</span>
        </button>
        <button type="button" id="btn-log-feedback" class="deck-action-btn deck-action-feedback${hasNote ? " has-note" : ""}" aria-label="${hasNote ? t("feedback_has_note") : t("btn_log_feedback")}">
          <i class="fa-solid fa-note-sticky"></i><span>${t("feedback_short")}</span>
        </button>
      </div>
    `,
    );
  }

  wireFocused(card) {
    const { logQuickSignal, openFeedbackModal, startRestTimer } = this.ctx;
    const item = this.item;
    const metric = item.metric || "reps";
    card.querySelector(".deck-action-easy").addEventListener("click", (e) => {
      e.stopPropagation();
      logQuickSignal("Too Easy - Increase Load");
    });
    card.querySelector(".deck-action-hard").addEventListener("click", (e) => {
      e.stopPropagation();
      logQuickSignal("Too Hard - Reduce Load");
    });
    card.querySelector(".deck-action-feedback").addEventListener("click", (e) => {
      e.stopPropagation();
      openFeedbackModal();
    });
    const timerBtn = card.querySelector(".deck-card-timer");
    if (timerBtn && startRestTimer)
      timerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Time-bound work (cardio time / stretch & balance holds) seeds the timer with the target
        // duration so it counts DOWN the prescribed effort; everything else counts up as a stopwatch.
        const seconds = isTimeBasedMetric(metric)
          ? toSeconds(item.repsTarget)
          : item.workDuration || 0;
        startRestTimer(seconds, "exercise", item.name);
      });
  }

  // wireCollapsed: the base class default (tap → onFocus(item.index)) is exactly right here.
}
