// src/modules/clipboard/exerciseCard.js
// Renders one standalone (non-circuit) exercise card inside the clipboard deck. It has two
// states: the in-focus card is the live logging surface (target sets/reps/weight plus the
// one-tap Too Easy / Too Hard / Feedback signals), and the compact row is a collapsed peek
// that taps to bring the exercise into focus.
//
// ExerciseDeckCard is a DeckCard subclass (see deckCard.js): render() is the base class's fixed
// skeleton (collapsed vs. focused, then wire); this file supplies the four hooks.
//
// ctx: {
//   currentCount, activeClientId, pastExpanded, isFutureSession,
//   t, escapeHTML, getExerciseSignalColor, hasQuickSignal(clientId, exerciseName, tag),
//   logQuickSignal(tag), openFeedbackModal(), onFocus(index)
// }

import {
  formatMetricValue,
  isTimeBasedMetric,
  metricLabelKey,
  toSeconds,
  usesLoad,
} from "../../domain/exerciseModality.js";
import { formatLoad, formatReps, hasLoad, loadParts } from "../../domain/repsAndLoad.js";
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

  // Values both renderFocused and renderCollapsed need — computed once per render call rather than
  // promoted to instance state, since only one of the two ever runs per invocation.
  #shared() {
    const { activeClientId, t, escapeHTML, getExerciseSignalColor, currentCount } = this.ctx;
    const item = this.item;
    const metric = item.metric || "reps";
    const modality = item.modality || "strength";
    const showLoad = usesLoad(modality);
    const primaryValue =
      metric === "reps" ? formatReps(item.repsTarget) : formatMetricValue(item.repsTarget, metric);
    const primaryLabel = t(metricLabelKey(metric));
    const load = loadParts(item.weightTarget, item.loadUnit);
    const counter = `${item.index + 1}/${currentCount}`;
    // Tint the title by any feedback logged for this exercise (see getExerciseSignalColor)
    const signalColor = getExerciseSignalColor(activeClientId, item.name);
    const nameStyle = signalColor ? ` style="color: ${signalColor};"` : "";
    let statusBadge = "";
    if (this.isInFocus) {
      statusBadge = `<span class="badge badge-primary deck-card-status">In Focus</span>`;
    } else if (item.isCompleted) {
      statusBadge = `<span class="badge badge-success deck-card-status">Completed</span>`;
    } else {
      statusBadge = `<span class="badge deck-card-status deck-card-status-upcoming">Upcoming</span>`;
    }
    return {
      metric,
      showLoad,
      primaryValue,
      primaryLabel,
      load,
      counter,
      nameStyle,
      statusBadge,
      escapeHTML,
      t,
    };
  }

  renderFocused(card) {
    const { activeClientId, hasQuickSignal, escapeHTML, t } = this.ctx;
    const item = this.item;
    const { showLoad, primaryValue, primaryLabel, load, counter, nameStyle, statusBadge } =
      this.#shared();

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

    // Expanded focus card is the primary logging surface: target stats plus the
    // one-tap outcome signals that replaced the per-set stepper grid
    card.innerHTML = `
      <div class="deck-card-top">
        <span class="deck-card-counter">${counter}</span>
        <span class="deck-card-top-right">
          ${statusBadge}
          <button type="button" class="deck-card-timer" aria-label="${t("rest_timer")}" title="${t("rest_timer")}"><i class="fa-solid fa-stopwatch"></i></button>
        </span>
      </div>
      <h5 class="deck-card-name"${nameStyle}>${escapeHTML(item.name)}</h5>
      <div class="deck-card-stats">
        <div class="deck-stat">
          <span class="deck-stat-value">${escapeHTML(String(item.setsTarget))}</span>
          <span class="deck-stat-label">${t("sets")}</span>
        </div>
        <div class="deck-stat">
          <span class="deck-stat-value">${escapeHTML(primaryValue)}</span>
          <span class="deck-stat-label">${escapeHTML(primaryLabel)}</span>
        </div>
        ${
          showLoad
            ? `<div class="deck-stat">
          <span class="deck-stat-value">${escapeHTML(load.value)}</span>
          <span class="deck-stat-label">${escapeHTML(load.label)}</span>
        </div>`
            : ""
        }
      </div>
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
    `;
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

  renderCollapsed(card) {
    const item = this.item;
    const { showLoad, primaryValue, counter, nameStyle, statusBadge, escapeHTML } = this.#shared();
    const metric = item.metric || "reps";

    // Compact row for the rest of the plan — tap to bring into focus. The target
    // is labelled S(ets) × R(eps) × weight so a collapsed, single-line card still
    // reads unambiguously (e.g. "S4 × R6 × 60kg").
    // Sets × the primary target, with a load axis only for load-bearing modalities:
    //   strength "S4 × R6 × 60kg", isometric "S3 × 0:45 × 20kg", cardio "S1 × 20 cal",
    //   stretch/balance "S2 × 0:30", agility "S4 × 0:10".
    const compactLoad =
      showLoad && hasLoad(item.weightTarget, item.loadUnit)
        ? ` × ${escapeHTML(formatLoad(item.weightTarget, item.loadUnit))}`
        : "";
    const primaryPart =
      metric === "reps" ? `R${escapeHTML(formatReps(item.repsTarget))}` : escapeHTML(primaryValue);
    const compactTarget = `S${escapeHTML(String(item.setsTarget))} × ${primaryPart}${compactLoad}`;
    card.innerHTML = `
      <div class="deck-card-compact">
        <span class="deck-card-counter">${counter}</span>
        <span class="deck-card-name deck-card-name-inline"${nameStyle}>${escapeHTML(item.name)}</span>
        <span class="deck-card-compact-target">${compactTarget}</span>
        ${statusBadge}
      </div>
    `;
  }

  // wireCollapsed: the base class default (tap → onFocus(item.index)) is exactly right here.
}
