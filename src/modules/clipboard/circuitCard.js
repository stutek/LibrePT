// src/modules/clipboard/circuitCard.js
// Renders one circuit/giant-set card: a grouped block of exercises with a round counter. It shows
// the circuit's title with the round it is on, and every member — exercises and any rest between
// them — as one line each, name and target. The card in focus is that same list plus what it takes
// to work through it: a feedback trio per exercise, a field where the target is reps to failure, a
// ⏱ for the circuit, a play control on each rest, and the "Complete round" button. Feedback stays
// tied to the exercise — logQuickSignal/openFeedbackModal receive that exercise's id.
//
// CircuitDeckCard is a DeckCard subclass (see deckCard.js): render() is the base class's fixed
// skeleton (the one design, then what focus adds, then wire); this file supplies the hooks.
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

// One line for a rest inside the circuit. A rest is a member like any other and has no name or
// reps, so it says what it is instead — asking it for a name printed `undefined` under every
// circuit in the deck (TODO §42.6).
function buildCircuitRestRowHTML(ex, t, escapeHTML) {
  return `
        <div class="circuit-ex-row circuit-ex-rest" data-rest="${escapeHTML(String(ex.rest))}">
          <div class="circuit-ex-head">
            <span class="circuit-ex-name"><i class="fa-solid fa-hourglass-half"></i> ${t("rest_label")}</span>
            <span class="circuit-ex-sep">·</span>
            <span class="circuit-ex-target"><span class="circuit-ex-reps">${escapeHTML(String(ex.rest))}s</span></span>
          </div>
        </div>`;
}

// One line per movement, name and target in the same phrase (TODO §42.6): the target follows the
// name the way the collapsed exercise card writes its own ("S4 × R6 × 60kg"), so nothing has to be
// aligned with anything.
function buildCircuitExerciseRowHTML(ex, ctx) {
  const { activeClientId, escapeHTML, getExerciseSignalColor } = ctx;
  const sig = getExerciseSignalColor(activeClientId, ex.name);
  const nameClass = sig ? " has-signal-color" : "";
  const nameStyle = sig ? ` style="--signal-color:${sig};"` : "";
  const load = hasLoad(ex.weightTarget, ex.loadUnit)
    ? ` · ${escapeHTML(formatLoad(ex.weightTarget, ex.loadUnit))}`
    : "";
  return `
        <div class="circuit-ex-row" data-ex-id="${escapeHTML(ex.id)}">
          <div class="circuit-ex-head">
            <span class="circuit-ex-name${nameClass}"${nameStyle}>${escapeHTML(ex.name)}</span>
            <span class="circuit-ex-sep">·</span>
            <span class="circuit-ex-target"><span class="circuit-ex-reps">${escapeHTML(String(ex.repsTarget))}${load}</span></span>
          </div>
        </div>`;
}

// The field for an exercise whose target is "as many as you can": it replaces that row's target,
// in place, on the focused card only.
function buildFailureRepsHTML(exId, activeClientState, round, escapeHTML, t) {
  const currentLog = activeClientState?.logs[exId]?.[round - 1];
  const actualReps = typeof currentLog?.reps === "number" ? currentLog.reps : "";
  return `
          <div class="circuit-failure-stepper" data-ex-id="${escapeHTML(exId)}">
            <span class="circuit-failure-label">${t("failure_reps_label")}</span>
            <button type="button" class="stepper-btn minus" aria-label="-">-</button>
            <input type="number" class="circuit-failure-input" value="${actualReps}" placeholder="${t("failure_reps_placeholder")}" aria-label="${t("failure_reps_label")}">
            <button type="button" class="stepper-btn plus" aria-label="+">+</button>
          </div>
        `;
}

// The feedback trio for one member row. The same three actions as a standalone exercise card, with
// the same lookups, the same glyph swap and the same note mark (TODO §7.2) — or the trainer learns
// one vocabulary and meets another mid-session.
function buildCircuitActionsHTML(ex, ctx, isFirstExercise) {
  const { activeClientId, t, hasQuickSignal } = ctx;
  const isEasyActive = hasQuickSignal(activeClientId, ex.name, "Too Easy - Increase Load");
  const isHardActive = hasQuickSignal(activeClientId, ex.name, "Too Hard - Reduce Load");
  const hasNote = ctx.hasExerciseNote?.(activeClientId, ex.name) || false;
  const easyIcon = isEasyActive ? "fa-circle-check" : "fa-feather";
  const hardIcon = isHardActive ? "fa-circle-check" : "fa-weight-hanging";
  const idAttr = isFirstExercise ? ' id="btn-log-feedback"' : "";
  return `
          <div class="circuit-ex-actions">
            <button type="button" class="deck-action-btn deck-action-easy circuit-sig easy${isEasyActive ? " active" : ""}" data-sig="easy" aria-pressed="${isEasyActive}" aria-label="${t("signal_too_easy")}">
              <i class="fa-solid ${easyIcon}"></i><span>${t("signal_too_easy")}</span>
            </button>
            <button type="button" class="deck-action-btn deck-action-hard circuit-sig hard${isHardActive ? " active" : ""}" data-sig="hard" aria-pressed="${isHardActive}" aria-label="${t("signal_too_hard")}">
              <i class="fa-solid ${hardIcon}"></i><span>${t("signal_too_hard")}</span>
            </button>
            <button type="button"${idAttr} class="deck-action-btn deck-action-feedback circuit-sig note${hasNote ? " has-note" : ""}" data-sig="note" aria-label="${hasNote ? t("feedback_has_note") : t("btn_log_feedback")}">
              <i class="fa-solid fa-note-sticky"></i><span>${t("feedback_short")}</span>
            </button>
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

  // The card, in every state (TODO §42.3). One head row, the same one every other card draws
  // (§42.5) — the focused card used to open with a title bar of its own instead, so a circuit
  // looked like two different cards depending on whether the trainer was on it.
  renderCard(card) {
    const { round, t, escapeHTML } = this.ctx;
    const item = this.item;
    const title = item.title ? escapeHTML(item.title) : t("combo_round_title");
    const rows = (item.items || []).map((ex) =>
      isRestRecord(ex)
        ? buildCircuitRestRowHTML(ex, t, escapeHTML)
        : buildCircuitExerciseRowHTML(ex, this.ctx),
    );
    const badge = item.isCompleted
      ? `<span class="badge badge-emerald deck-card-status">${t("session_completed")}</span>`
      : `<span class="badge deck-card-status circuit-round-badge">${t("round_label")} ${round} / ${item.series}</span>`;
    card.innerHTML = `
      <div class="deck-card-compact">
        <span class="deck-card-counter"><i class="fa-solid fa-layer-group"></i></span>
        <span class="deck-card-name deck-card-name-inline">${title}</span>
        ${badge}
      </div>
      <div class="circuit-ex-list">${rows.join("")}</div>`;
  }

  // What focus adds: the ⏱ at the end of the head row, a feedback trio under each movement, a play
  // control on each rest, the failure field where the target asks for one, and the round button.
  addFocusElements(card) {
    const { round, activeClientState, t, escapeHTML } = this.ctx;
    const item = this.item;

    card
      .querySelector(".deck-card-compact")
      .insertAdjacentHTML(
        "beforeend",
        `<button type="button" class="deck-card-timer" aria-label="${t("rest_timer")}" title="${t("rest_timer")}"><i class="fa-solid fa-stopwatch"></i></button>`,
      );

    // Paired by DOM order rather than by looking each id up in a selector: renderCard drew one row
    // per member in this same order, so the two lists walk together and no id has to survive being
    // spliced into a selector.
    const rows = [...card.querySelectorAll(".circuit-ex-row[data-ex-id]")];
    const exercises = (item.items || []).filter((ex) => !isRestRecord(ex));
    for (const [i, ex] of exercises.entries()) {
      const row = rows[i];
      if (!row) continue;
      row.insertAdjacentHTML("beforeend", buildCircuitActionsHTML(ex, this.ctx, i === 0));
      if (isFailureReps(ex.repsTarget)) {
        row.querySelector(".circuit-ex-target").innerHTML = buildFailureRepsHTML(
          ex.id,
          activeClientState,
          round,
          escapeHTML,
          t,
        );
      }
    }

    for (const restRow of card.querySelectorAll(".circuit-ex-rest .circuit-ex-head")) {
      restRow.insertAdjacentHTML(
        "beforeend",
        `<button type="button" class="circuit-break-play" aria-label="${t("start_rest")}" title="${t("start_rest")}"><i class="fa-solid fa-stopwatch"></i></button>`,
      );
    }

    // Nothing to add when the circuit is done — the head row's badge already says so, where every
    // other finished card says it.
    if (item.isCompleted) return;
    const isLastRound = round >= item.series;
    card.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="btn success-btn btn-sm circuit-complete-btn"><i class="fa-solid fa-check"></i> ${isLastRound ? t("finish_circuit") : `${t("complete_round")} ${round} / ${item.series}`}</button>`,
    );
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

    for (const rowEl of card.querySelectorAll(".circuit-ex-row[data-ex-id]")) {
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
      for (const play of card.querySelectorAll(".circuit-break-play")) {
        play.addEventListener("click", (e) => {
          e.stopPropagation();
          startRestTimer(parseInt(play.closest(".circuit-ex-rest").dataset.rest, 10) || 0, "rest");
        });
      }
    }
  }

  // A circuit unit has no single .index of its own (only its members do), so collapsed tap can't
  // use the base class's default — it focuses the first non-rest member instead, same as before.
  wireCollapsed(card) {
    const firstEx = this.item.items.find((it) => !isRestRecord(it)) || this.item.items[0];
    card.addEventListener("click", () => this.ctx.onFocus(firstEx.index));
  }
}
