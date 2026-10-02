// src/modules/clipboard/exerciseDeckOfCards.js
// Renders the active-session exercise stack (the vertical scroll deck): ONE session's own plan and
// nothing else — the current routine folded into circuit units
// (one card per circuit), standalone exercise cards, and standalone rest cards. Every card type is
// a DeckCard subclass (see deckCard.js) — this module builds the deck items, constructs the right
// subclass per item, and calls `.render(card)` uniformly; it wires no click/focus/timer behaviour
// itself, and scrolls the acted-on card into view. Dependencies are injected by the caller
// (renderActiveGroupBoard in app.js) so it stays decoupled from app.js internals.
//
// deckContainer: the #active-exercise-scroll-deck element
// deps: {
//   activeSession, activeClientState, activeClientId, state,
//   t, escapeHTML, buildCircuitUnits, getExerciseSignalColor, hasExerciseNote, hasQuickSignal,
//   logQuickSignal, openFeedbackModal, completeCircuitRound, focusExerciseByIndex,
//   activateExerciseByScroll(index)   // the trainer scrolled another card to the focus line
//   saveActiveSession, savePlanEdit, saveToLocalStorage,
//   onRerender()   // re-render the whole board (a circuit save)
// }

import { newRecordId } from "../../data/recordId.js";
import { isRestRecord } from "../../domain/sessionItemRecord.js";
import { blankExercise } from "../../domain/sessionPlanFactory.js";
import { sessionDayOf } from "../../domain/sessionRecord.js";
import { CircuitDeckCard } from "./circuitCard.js";
import { trackDeckScroll } from "./deckScrollFocus.js";
import { ExerciseDeckCard } from "./exerciseCard.js";
import { RestDeckCard } from "./restDeckCard.js";

function buildRestDeckItem(ex, idx, currentExIdx, activeIdx) {
  return {
    id: ex.id,
    index: idx,
    type: "rest",
    rest: ex.rest || 0,
    circuitId: ex.circuitId || null,
    circuitTitle: ex.circuitTitle || "",
    circuitSeries: ex.circuitSeries || 1,
    // Rest is a first-class plan item: isInFocus is computed the SAME way for every item type —
    // idx === currentExIdx — no more hardcoded exception for rests.
    isInFocus: idx === currentExIdx,
    isActive: idx === activeIdx,
    // Still true regardless of focus: keeps a rest from blocking a circuit's "all members
    // complete" aggregation in buildCircuitUnits — a rest has nothing to complete.
    isCompleted: true,
  };
}

function resolveExerciseTargets(ex) {
  return {
    setsTarget: ex.setsTargetCount || ex.sets || 3,
    repsTarget: ex.repsTarget ?? ex.reps ?? 10,
    weightTarget: ex.weightTarget ?? ex.weight ?? 0,
  };
}

function buildCurrentExerciseDeckItem(ex, idx, currentExIdx, activeClientState) {
  const activeIdx = activeClientState.activeExerciseIndex;
  const logsList = activeClientState.logs[ex.id] || [];
  const isCompleted = logsList.length > 0 && logsList.every((l) => l.completed);
  return {
    id: ex.id,
    index: idx,
    name: ex.name,
    type: "current",
    isCompleted,
    isInFocus: idx === currentExIdx,
    isActive: idx === activeIdx,
    instructions: ex.instructions,
    ...resolveExerciseTargets(ex),
    loadUnit: ex.loadUnit || "kg",
    modality: ex.modality || "strength",
    metric: ex.metric || "reps",
    rest: ex.rest || 0,
    circuitId: ex.circuitId || null,
    circuitTitle: ex.circuitTitle || "",
    circuitSeries: ex.circuitSeries || 1,
  };
}

// The trainer inserting an exercise/circuit/rest right after the in-focus card mid-session — drops
// them into the editor pointed at the new (blank) item, same shape whichever kind was tapped.
function insertFastAdjustmentItem(type, activeItem, ctx) {
  const { activeClientState, savePlanEdit, saveToLocalStorage, enterEditMode, onRerender } = ctx;
  let insertIndex = -1;
  if (activeItem.type === "circuit") {
    const circuitId = activeItem.circuitId;
    let idx = 0;
    for (const ex of activeClientState.exercises) {
      if (ex.circuitId === circuitId) {
        insertIndex = idx;
      }
      idx++;
    }
  } else {
    insertIndex = activeItem.index;
  }

  const newIdx = insertIndex + 1;
  const cid = activeItem.type === "circuit" ? activeItem.circuitId : null;
  const circuitTitle = activeItem.type === "circuit" ? activeItem.title : "";
  const circuitSeries = activeItem.type === "circuit" ? activeItem.series : 1;

  // The insert drops the trainer into the editor mid-plan, where a blank row looks like every
  // other row. Hand the new item's id to edit mode so it can point at the one just created.
  let newItemId;

  if (type === "rest") {
    newItemId = `rest-${newRecordId()}`;
    activeClientState.exercises.splice(newIdx, 0, {
      id: newItemId,
      type: "rest",
      rest: 30,
      circuitId: cid,
      circuitTitle: circuitTitle,
      circuitSeries: circuitSeries,
    });
  } else {
    // An exercise joins the circuit in focus; a new circuit starts as one blank exercise of three
    // rounds.
    const { planItem, logs } =
      type === "circuit"
        ? blankExercise({ id: newRecordId(), circuitId: `c-${newRecordId()}`, circuitSeries: 3 })
        : blankExercise({ id: newRecordId(), circuitId: cid, circuitTitle, circuitSeries });
    newItemId = planItem.id;
    activeClientState.logs[planItem.id] = logs;
    activeClientState.exercises.splice(newIdx, 0, planItem);
  }

  activeClientState.activeExerciseIndex = newIdx;
  activeClientState.deckAllCollapsed = false;

  // A change to this client's plan: it takes them out of their group (sessionPrograms.js).
  savePlanEdit();
  if (saveToLocalStorage) saveToLocalStorage();

  if (enterEditMode) {
    enterEditMode(newItemId);
  } else {
    onRerender();
  }
}

// The in-focus card's own fast-adjustment bar: +Exercise / +Circuit / +Rest, inserted right after it.
function renderFastAdjustBar(deckContainer, item, ctx) {
  const adjustBar = document.createElement("div");
  adjustBar.className = "fast-adjust-bar";
  adjustBar.innerHTML = `
        <button type="button" class="btn btn-sm secondary-btn fast-adj-ex">
          <i class="fa-solid fa-plus"></i> ${ctx.t("exercise") || "Exercise"}
        </button>
        <button type="button" class="btn btn-sm secondary-btn fast-adj-circuit">
          <i class="fa-solid fa-plus"></i><i class="fa-solid fa-layer-group"></i> ${ctx.t("circuit") || "Circuit"}
        </button>
        <button type="button" class="btn btn-sm secondary-btn fast-adj-rest">
          <i class="fa-solid fa-plus"></i><i class="fa-solid fa-hourglass-half"></i> ${ctx.t("rest_label") || "Rest"}
        </button>
      `;

  adjustBar.querySelector(".fast-adj-ex").addEventListener("click", (e) => {
    e.stopPropagation();
    insertFastAdjustmentItem("exercise", item, ctx);
  });
  adjustBar.querySelector(".fast-adj-circuit").addEventListener("click", (e) => {
    e.stopPropagation();
    insertFastAdjustmentItem("circuit", item, ctx);
  });
  adjustBar.querySelector(".fast-adj-rest").addEventListener("click", (e) => {
    e.stopPropagation();
    insertFastAdjustmentItem("rest", item, ctx);
  });

  deckContainer.appendChild(adjustBar);
}

export function renderExerciseDeck(deckContainer, deps) {
  if (!deckContainer) return;
  const {
    activeSession,
    activeClientState,
    activeClientId,
    state,
    t,
    escapeHTML,
    buildCircuitUnits,
    getExerciseSignalColor,
    hasExerciseNote,
    hasQuickSignal,
    logQuickSignal,
    openFeedbackModal,
    completeCircuitRound,
    focusExerciseByIndex,
    activateExerciseByScroll,
    saveActiveSession,
    savePlanEdit,
    saveToLocalStorage,
    onRerender,
    startRestTimer,
    enterEditMode,
  } = deps;

  deckContainer.innerHTML = "";

  // A launched future-day session is a plan, not a live workout — its exercises get the
  // same amber tint the dashboard uses for future days (mirrors the purple past history).
  const launchedDay = sessionDayOf(activeSession.sourceSession);
  const isFutureSession = launchedDay === "tomorrow" || launchedDay === "upcoming";

  // ONE session's worth of cards, and nothing else (Simon, 2026-09-30). The client's most recent
  // past session used to be drawn at the top of this deck, which gave the vertical axis two
  // meanings at once: where the trainer is in today's session, and what happened last time. It now
  // has one. The previous session is reached sideways instead, by the blanket gesture
  // (modules/clipboard/planPeek.js), where it is aligned so the same movement sits level with the
  // exercise in focus — the question "what did they lift last time" answered beside the card that
  // asks it, rather than above it.
  //
  // It also cost a defect: the past cards carried no `data-plan-index`, so scrolling up into them
  // matched no card in deckScrollFocus.js and the ACTIVE exercise jumped back to the first of the
  // session. Looking back moved the trainer's place in the session.

  // Current routine exercises. activeExerciseIndex is the ACTIVE card, always marked; deckAllCollapsed
  // says no card is OPEN. A fresh open starts collapsed (startWorkoutSession /
  // openSessionFromHistory), a tap opens (focusExerciseByIndex), a scroll by the trainer closes
  // (activateExerciseByScroll) — -1 matches nothing, so `isInFocus: idx === currentExIdx` is false
  // for every item below without touching activeExerciseIndex itself.
  const currentExIdx = activeClientState.deckAllCollapsed
    ? -1
    : activeClientState.activeExerciseIndex;
  const currentExList = activeClientState.exercises.map((ex, idx) =>
    isRestRecord(ex)
      ? buildRestDeckItem(ex, idx, currentExIdx, activeClientState.activeExerciseIndex)
      : buildCurrentExerciseDeckItem(ex, idx, currentExIdx, activeClientState),
  );

  // Fold consecutive exercises that share a circuitId into a single circuit/giantset unit; ungrouped
  // exercises stay as their own 'current' cards. Circuits render one card per group.
  const renderUnits = buildCircuitUnits(currentExList);
  const onFocus = (index) => focusExerciseByIndex(index);

  for (const item of renderUnits) {
    const card = document.createElement("div");

    // Which DeckCard subclass owns this item — the only place item.type is branched on. Every
    // decision after this point (render, focus rule, click wiring) is polymorphic, not branchy.
    let deckCard;
    if (item.type === "rest") {
      deckCard = new RestDeckCard(item, {
        t,
        escapeHTML,
        isFutureSession,
        startRestTimer,
        onFocus,
      });
    } else if (item.type === "circuit") {
      const round = activeClientState.circuitRounds?.[item.circuitId] || 1;
      deckCard = new CircuitDeckCard(item, {
        round,
        activeClientId,
        activeClientState,
        isFutureSession,
        t,
        escapeHTML,
        getExerciseSignalColor,
        hasExerciseNote,
        hasQuickSignal,
        logQuickSignal,
        openFeedbackModal,
        completeCircuitRound,
        startRestTimer,
        saveSessionState: () => {
          saveActiveSession();
          saveToLocalStorage();
          onRerender();
        },
        onFocus,
      });
    } else {
      deckCard = new ExerciseDeckCard(item, {
        currentCount: currentExList.length,
        activeClientId,
        isFutureSession,
        t,
        escapeHTML,
        getExerciseSignalColor,
        hasExerciseNote,
        hasQuickSignal,
        logQuickSignal,
        openFeedbackModal,
        startRestTimer,
        onFocus,
      });
    }
    deckCard.render(card);
    deckContainer.appendChild(card);

    if (item.isInFocus && !isFutureSession) {
      renderFastAdjustBar(deckContainer, item, {
        activeClientState,
        savePlanEdit,
        saveToLocalStorage,
        enterEditMode,
        onRerender,
        t,
      });
    }
  }

  if (activateExerciseByScroll) {
    trackDeckScroll(deckContainer, { onScrollActivate: activateExerciseByScroll });
  }

  // Bring whatever the trainer just acted on into view: the open card, otherwise the active one —
  // which is what a switch back to this client returns to when nothing was open.
  setTimeout(() => {
    const focusEl =
      deckContainer.querySelector(".exercise-deck-card.in-focus") ||
      deckContainer.querySelector(".exercise-deck-card.is-active");
    if (focusEl) {
      focusEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, 100);
}
