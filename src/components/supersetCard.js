// components/supersetCard.js
// Renders one superset/giantset card: a grouped block of exercises with a round counter. It shows an
// optional title, a round badge over the superset's series, every exercise (and any rest break)
// listed with a per-exercise feedback trio (Too Easy / Too Hard / Note), and a "Complete round"
// button that advances the counter (and finishes the superset on the last round). Feedback stays
// tied to the exercise — logQuickSignal/openFeedbackModal receive that exercise's id.
//
// The caller creates the `card` element and appends it; this component only fills it in.
// ctx: {
//   round, activeClientId, pastExpanded, isFutureSession,
//   t, escapeHTML, getExerciseSignalColor,
//   logQuickSignal(tag, exId), openFeedbackModal(exId),
//   completeSupersetRound(circuitId), onFocus(firstExerciseIndex)
// }

export function renderSupersetCard(card, item, ctx) {
  const {
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
    saveSessionState,
    onFocus,
    startRestTimer,
  } = ctx;
  const WORK_TIMER_DEFAULT = 60; // seconds, when timing a superset (no work-duration field yet)

  const showInFocus = item.isInFocus && !pastExpanded;
  card.className = `exercise-deck-card superset-card ${showInFocus ? "in-focus" : item.isCompleted ? "completed" : ""}${isFutureSession ? " future-session" : ""}`;
  const title = item.title ? escapeHTML(item.title) : t("combo_round_title");

  if (showInFocus) {
    const rows = [];
    let firstExerciseSeen = false;
    {
      let idx = 0;
      for (const ex of item.items) {
        // A rest is a first-class item inside the circuit — render it as a break row and skip the
        // exercise markup/wiring below.
        if (ex.type === "rest") {
          rows.push(
            `<button type="button" class="superset-break-row" data-rest="${ex.rest}"><i class="fa-solid fa-hourglass-half"></i> <span class="superset-break-label">${t("rest_label")}</span> <span class="superset-ex-reps">${ex.rest}s</span> <i class="fa-solid fa-play superset-break-play"></i></button>`,
          );
          continue;
        }
        const isFirstExercise = !firstExerciseSeen;
        firstExerciseSeen = true;
        const sig = getExerciseSignalColor(activeClientId, ex.name);
        const nameStyle = sig ? ` style="color:${sig};"` : "";
        const isMax = String(ex.repsTarget).toLowerCase() === "max";

        let repsHTML = "";
        if (isMax) {
          const currentLog =
            activeClientState?.logs[ex.id] && activeClientState.logs[ex.id][round - 1];
          const actualReps =
            currentLog && typeof currentLog.reps === "number" ? currentLog.reps : "";
          repsHTML = `
          <div class="superset-failure-stepper" data-ex-id="${escapeHTML(ex.id)}" style="display: inline-flex; align-items: center; gap: 4px;">
            <span style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Fail Reps:</span>
            <button type="button" class="stepper-btn minus" style="width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: var(--text-color); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: pointer; user-select: none;">-</button>
            <input type="number" class="superset-failure-input" value="${actualReps}" placeholder="Max" style="width: 38px; height: 22px; padding: 0; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.3); color: var(--primary); font-size: 11px; font-weight: 700; text-align: center;">
            <button type="button" class="stepper-btn plus" style="width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: var(--text-color); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: pointer; user-select: none;">+</button>
          </div>
        `;
        } else {
          repsHTML = `<span class="superset-ex-reps">${escapeHTML(String(ex.repsTarget))}</span>`;
        }

        const repLabel =
          ex.weightTarget > 0 ? ` · ${escapeHTML(String(ex.weightTarget))}${t("kg")}` : "";
        const idAttr = isFirstExercise ? ' id="btn-log-feedback"' : "";

        rows.push(`
        <div class="superset-ex-row" data-ex-id="${escapeHTML(ex.id)}">
          <div class="superset-ex-head">
            <span class="superset-ex-name"${nameStyle}>${escapeHTML(ex.name)}</span>
            <span class="superset-ex-target">${repsHTML}${repLabel ? `<span class="superset-ex-reps">${repLabel}</span>` : ""}</span>
          </div>
          <div class="superset-ex-actions">
            <button type="button" class="superset-sig easy" data-sig="easy" aria-label="${t("signal_too_easy")}">
              <i class="fa-solid fa-feather"></i><span>${t("signal_too_easy")}</span>
            </button>
            <button type="button" class="superset-sig hard" data-sig="hard" aria-label="${t("signal_too_hard")}">
              <i class="fa-solid fa-weight-hanging"></i><span>${t("signal_too_hard")}</span>
            </button>
            <button type="button"${idAttr} class="superset-sig note" data-sig="note" aria-label="${t("btn_log_feedback")}">
              <i class="fa-solid fa-triangle-exclamation"></i><span>${t("feedback_short")}</span>
            </button>
          </div>
        </div>`);
        idx++;
      }
    }
    const isLastRound = round >= item.series;
    const footer = item.isCompleted
      ? `<div class="superset-done"><i class="fa-solid fa-circle-check"></i> ${t("session_completed")}</div>`
      : `<button type="button" class="btn success-btn btn-sm superset-complete-btn"><i class="fa-solid fa-check"></i> ${isLastRound ? t("finish_superset") : `${t("complete_round")} ${round} / ${item.series}`}</button>`;
    card.innerHTML = `
      <div class="deck-card-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span class="superset-title" style="font-weight: 700; font-size: 13px;"><i class="fa-solid fa-layer-group"></i> ${title}</span>
        <span class="deck-card-top-right">
          <span class="superset-round-badge">${t("round_label")} ${round} / ${item.series}</span>
          <button type="button" class="deck-card-timer" aria-label="${t("rest_timer")}" title="${t("rest_timer")}"><i class="fa-solid fa-stopwatch"></i></button>
        </span>
      </div>
      <div class="superset-ex-list">${rows.join("")}</div>
      ${footer}
    `;
    for (const rowEl of card.querySelectorAll(".superset-ex-row")) {
      const exId = rowEl.getAttribute("data-ex-id");
      rowEl.querySelector(".superset-sig.easy").addEventListener("click", (e) => {
        e.stopPropagation();
        logQuickSignal("Too Easy - Increase Load", exId);
      });
      rowEl.querySelector(".superset-sig.hard").addEventListener("click", (e) => {
        e.stopPropagation();
        logQuickSignal("Too Hard - Reduce Load", exId);
      });
      rowEl.querySelector(".superset-sig.note").addEventListener("click", (e) => {
        e.stopPropagation();
        openFeedbackModal(exId);
      });

      const stepper = rowEl.querySelector(".superset-failure-stepper");
      if (stepper) {
        const input = stepper.querySelector(".superset-failure-input");

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
    const completeBtn = card.querySelector(".superset-complete-btn");
    if (completeBtn)
      completeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        completeSupersetRound(item.circuitId);
      });
    // Timing is a card feature: the ⏱ header button times the circuit; each rest row runs its own duration.
    if (startRestTimer) {
      const timerBtn = card.querySelector(".deck-card-timer");
      if (timerBtn)
        timerBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          startRestTimer(WORK_TIMER_DEFAULT);
        });
      for (const br of card.querySelectorAll(".superset-break-row")) {
        br.addEventListener("click", (e) => {
          e.stopPropagation();
          startRestTimer(parseInt(br.dataset.rest, 10) || 0);
        });
      }
    }
  } else {
    card.innerHTML = `
      <div class="deck-card-compact">
        <span class="deck-card-counter"><i class="fa-solid fa-layer-group"></i></span>
        <span class="deck-card-name deck-card-name-inline">${title}</span>
        ${item.isCompleted ? `<span class="badge badge-emerald deck-card-status">${t("session_completed")}</span>` : `<span class="badge deck-card-status deck-card-status-upcoming">Round ${round} of ${item.series}</span>`}
      </div>`;
    // Focus the circuit by pointing the active index at its first exercise (skip any leading rest)
    const firstEx = item.items.find((it) => it.type !== "rest") || item.items[0];
    card.addEventListener("click", () => onFocus(firstEx.index));
  }
}
