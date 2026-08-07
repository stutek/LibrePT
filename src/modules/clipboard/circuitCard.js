// components/circuitCard.js
// Renders one circuit/giantset card: a grouped block of exercises with a round counter. It shows an
// optional title, a round badge over the circuit's series, every exercise (and any rest break)
// listed with a per-exercise feedback trio (Too Easy / Too Hard / Note), and a "Complete round"
// button that advances the counter (and finishes the circuit on the last round). Feedback stays
// tied to the exercise — logQuickSignal/openFeedbackModal receive that exercise's id.
//
// CircuitDeckCard is a DeckCard subclass (see deckCard.js): render() is the base class's fixed
// skeleton (collapsed vs. focused, then wire); this file supplies the four hooks.
//
// ctx: {
//   round, activeClientId, pastExpanded, isFutureSession,
//   t, escapeHTML, getExerciseSignalColor, hasQuickSignal(clientId, exerciseName, tag),
//   logQuickSignal(tag, exId), openFeedbackModal(exId),
//   completeCircuitRound(circuitId), onFocus(firstExerciseIndex)
// }

import { formatLoad, hasLoad, isFailureReps } from "../../domain/repsAndLoad.js";
import { isRestRecord } from "../../domain/sessionItemRecord.js";
import { DeckCard } from "./deckCard.js";

function buildCircuitBreakRowHTML(ex, t) {
  return `<button type="button" class="circuit-break-row" data-rest="${ex.rest}"><i class="fa-solid fa-hourglass-half"></i> <span class="circuit-break-label">${t("rest_label")}</span> <span class="circuit-ex-reps">${ex.rest}s</span> <i class="fa-solid fa-stopwatch circuit-break-play"></i></button>`;
}

function buildFailureRepsHTML(ex, activeClientState, round, escapeHTML) {
  const currentLog = activeClientState?.logs[ex.id]?.[round - 1];
  const actualReps = typeof currentLog?.reps === "number" ? currentLog.reps : "";
  return `
          <div class="circuit-failure-stepper" data-ex-id="${escapeHTML(ex.id)}" style="display: inline-flex; align-items: center; gap: 4px;">
            <span style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Fail Reps:</span>
            <button type="button" class="stepper-btn minus" style="width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: var(--text-color); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: pointer; user-select: none;">-</button>
            <input type="number" class="circuit-failure-input" value="${actualReps}" placeholder="Max" style="width: 38px; height: 22px; padding: 0; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.3); color: var(--primary); font-size: 11px; font-weight: 700; text-align: center;">
            <button type="button" class="stepper-btn plus" style="width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: var(--text-color); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: pointer; user-select: none;">+</button>
          </div>
        `;
}

function buildCircuitExerciseRowHTML(ex, ctx, isFirstExercise) {
  const {
    round,
    activeClientId,
    activeClientState,
    t,
    escapeHTML,
    getExerciseSignalColor,
    hasQuickSignal,
  } = ctx;
  const sig = getExerciseSignalColor(activeClientId, ex.name);
  const nameStyle = sig ? ` style="color:${sig};"` : "";
  const isMax = isFailureReps(ex.repsTarget);
  const repsHTML = isMax
    ? buildFailureRepsHTML(ex, activeClientState, round, escapeHTML)
    : `<span class="circuit-ex-reps">${escapeHTML(String(ex.repsTarget))}</span>`;

  const repLabel = hasLoad(ex.weightTarget, ex.loadUnit)
    ? ` · ${escapeHTML(formatLoad(ex.weightTarget, ex.loadUnit))}`
    : "";
  const idAttr = isFirstExercise ? ' id="btn-log-feedback"' : "";
  // Too Easy / Too Hard are toggles: pressed state mirrors whether THIS exact quick-signal
  // is already logged for this exercise, so a second tap (which un-logs it) reads right.
  const isEasyActive = hasQuickSignal(activeClientId, ex.name, "Too Easy - Increase Load");
  const isHardActive = hasQuickSignal(activeClientId, ex.name, "Too Hard - Reduce Load");

  return `
        <div class="circuit-ex-row" data-ex-id="${escapeHTML(ex.id)}">
          <div class="circuit-ex-head">
            <span class="circuit-ex-name"${nameStyle}>${escapeHTML(ex.name)}</span>
            <span class="circuit-ex-target">${repsHTML}${repLabel ? `<span class="circuit-ex-reps">${repLabel}</span>` : ""}</span>
          </div>
          <div class="circuit-ex-actions">
            <button type="button" class="circuit-sig easy${isEasyActive ? " active" : ""}" data-sig="easy" aria-pressed="${isEasyActive}" aria-label="${t("signal_too_easy")}">
              <i class="fa-solid fa-feather"></i><span>${t("signal_too_easy")}</span>
            </button>
            <button type="button" class="circuit-sig hard${isHardActive ? " active" : ""}" data-sig="hard" aria-pressed="${isHardActive}" aria-label="${t("signal_too_hard")}">
              <i class="fa-solid fa-weight-hanging"></i><span>${t("signal_too_hard")}</span>
            </button>
            <button type="button"${idAttr} class="circuit-sig note" data-sig="note" aria-label="${t("btn_log_feedback")}">
              <i class="fa-solid fa-note-sticky"></i><span>${t("feedback_short")}</span>
            </button>
          </div>
        </div>`;
}

export class CircuitDeckCard extends DeckCard {
  // An open past log defocuses the live card too, so the circuit renders compact — the same rule
  // ExerciseDeckCard applies, and the one place this card's focus differs from the plain base.
  get isInFocus() {
    return this.item.isInFocus && !this.ctx.pastExpanded;
  }

  get className() {
    const checkedClass = this.isInFocus ? "in-focus" : this.item.isCompleted ? "completed" : "";
    return `exercise-deck-card circuit-card ${checkedClass}${this.ctx.isFutureSession ? " future-session" : ""}`;
  }

  renderFocused(card) {
    const { round, t, escapeHTML } = this.ctx;
    const item = this.item;
    const title = item.title ? escapeHTML(item.title) : t("combo_round_title");
    const rows = [];
    let firstExerciseSeen = false;
    for (const ex of item.items) {
      // A rest is a first-class item inside the circuit — render it as a break row and skip the
      // exercise markup/wiring below.
      if (isRestRecord(ex)) {
        rows.push(buildCircuitBreakRowHTML(ex, t));
        continue;
      }
      const isFirstExercise = !firstExerciseSeen;
      firstExerciseSeen = true;
      rows.push(buildCircuitExerciseRowHTML(ex, this.ctx, isFirstExercise));
    }
    const isLastRound = round >= item.series;
    const footer = item.isCompleted
      ? `<div class="circuit-done"><i class="fa-solid fa-circle-check"></i> ${t("session_completed")}</div>`
      : `<button type="button" class="btn success-btn btn-sm circuit-complete-btn"><i class="fa-solid fa-check"></i> ${isLastRound ? t("finish_circuit") : `${t("complete_round")} ${round} / ${item.series}`}</button>`;
    card.innerHTML = `
      <div class="deck-card-top">
        <span class="circuit-title"><i class="fa-solid fa-layer-group"></i> ${title}</span>
        <span class="deck-card-top-right">
          <span class="circuit-round-badge">${t("round_label")} ${round} / ${item.series}</span>
          <button type="button" class="deck-card-timer" aria-label="${t("rest_timer")}" title="${t("rest_timer")}"><i class="fa-solid fa-stopwatch"></i></button>
        </span>
      </div>
      <div class="circuit-ex-list">${rows.join("")}</div>
      ${footer}
    `;
  }

  wireFocused(card) {
    const {
      round,
      activeClientState,
      logQuickSignal,
      openFeedbackModal,
      completeCircuitRound,
      saveSessionState,
      startRestTimer,
    } = this.ctx;
    const item = this.item;

    for (const rowEl of card.querySelectorAll(".circuit-ex-row")) {
      const exId = rowEl.getAttribute("data-ex-id");
      rowEl.querySelector(".circuit-sig.easy").addEventListener("click", (e) => {
        e.stopPropagation();
        logQuickSignal("Too Easy - Increase Load", exId);
      });
      rowEl.querySelector(".circuit-sig.hard").addEventListener("click", (e) => {
        e.stopPropagation();
        logQuickSignal("Too Hard - Reduce Load", exId);
      });
      rowEl.querySelector(".circuit-sig.note").addEventListener("click", (e) => {
        e.stopPropagation();
        openFeedbackModal(exId);
      });

      const stepper = rowEl.querySelector(".circuit-failure-stepper");
      if (stepper) {
        const input = stepper.querySelector(".circuit-failure-input");

        const updateVal = (newVal) => {
          input.value = newVal;
          if (activeClientState) {
            const logsList = activeClientState.logs[exId];
            if (logsList?.[round - 1]) {
              logsList[round - 1].reps = newVal;
              logsList[round - 1].completed = true;
              if (saveSessionState) saveSessionState();
            }
          }
        };

        stepper.querySelector(".minus").addEventListener("click", (e) => {
          e.stopPropagation();
          let v = parseInt(input.value, 10);
          if (isNaN(v)) v = 10;
          updateVal(Math.max(0, v - 1));
        });
        stepper.querySelector(".plus").addEventListener("click", (e) => {
          e.stopPropagation();
          let v = parseInt(input.value, 10);
          if (isNaN(v)) v = 10;
          updateVal(v + 1);
        });
        input.addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val)) {
            updateVal(val);
          }
        });
      }
    }
    const completeBtn = card.querySelector(".circuit-complete-btn");
    if (completeBtn)
      completeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        completeCircuitRound(item.circuitId);
      });
    // Timing is a card feature: the ⏱ header button times the circuit; each rest row runs its own duration.
    if (startRestTimer) {
      const timerBtn = card.querySelector(".deck-card-timer");
      if (timerBtn)
        timerBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          // Use the item's prescribed duration for countdown; if none, count up (elapsed stopwatch).
          startRestTimer(item.workDuration || 0, "exercise", item.title || "");
        });
      for (const br of card.querySelectorAll(".circuit-break-row")) {
        br.addEventListener("click", (e) => {
          e.stopPropagation();
          startRestTimer(parseInt(br.dataset.rest, 10) || 0, "rest");
        });
      }
    }
  }

  renderCollapsed(card) {
    const { round, t, escapeHTML } = this.ctx;
    const item = this.item;
    const title = item.title ? escapeHTML(item.title) : t("combo_round_title");
    card.innerHTML = `
      <div class="deck-card-compact">
        <span class="deck-card-counter"><i class="fa-solid fa-layer-group"></i></span>
        <span class="deck-card-name deck-card-name-inline">${title}</span>
        ${item.isCompleted ? `<span class="badge badge-emerald deck-card-status">${t("session_completed")}</span>` : `<span class="badge deck-card-status deck-card-status-upcoming">Round ${round} of ${item.series}</span>`}
      </div>`;
  }

  // A circuit unit has no single .index of its own (only its members do), so collapsed tap can't
  // use the base class's default — it focuses the first non-rest member instead, same as before.
  wireCollapsed(card) {
    const firstEx = this.item.items.find((it) => !isRestRecord(it)) || this.item.items[0];
    card.addEventListener("click", () => this.ctx.onFocus(firstEx.index));
  }
}
