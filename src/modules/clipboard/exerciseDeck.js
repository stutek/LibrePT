// components/exerciseDeck.js
// Renders the active-session exercise stack (the vertical scroll deck): the client's most-recent
// past session as tappable history cards, then the current routine folded into circuit units
// (one card per circuit), standalone exercise cards, and standalone rest cards. Every card type is
// a DeckCard subclass (see deckCard.js) — this module builds the deck items, constructs the right
// subclass per item, and calls `.render(card)` uniformly; it wires no click/focus/timer behaviour
// itself, and scrolls the acted-on card into view. Dependencies are injected by the caller
// (renderActiveGroupBoard in app.js) so it stays decoupled from app.js internals.
//
// deckContainer: the #active-exercise-scroll-deck element
// deps: {
//   activeSession, activeClientState, activeClientId, state,
//   t, escapeHTML, buildCircuitUnits, getExerciseSignalColor, hasQuickSignal,
//   logQuickSignal, openFeedbackModal, completeCircuitRound, focusExerciseByIndex,
//   saveActiveSessionToCache, saveToLocalStorage,
//   onRerender()   // re-render the whole board (past-card toggle / circuit save)
// }

import { formatMetricValue, usesLoad } from "../common/exerciseModality.js";
import { newRecordId } from "../common/recordId.js";
import { formatLoad, formatReps } from "../common/repsAndLoad.js";
import { exerciseRecordsOf, isRestRecord } from "../common/sessionItemRecord.js";
import { CircuitDeckCard } from "./circuitCard.js";
import { ExerciseDeckCard } from "./exerciseCard.js";
import { PastDeckCard } from "./pastDeckCard.js";
import { RestDeckCard } from "./restDeckCard.js";

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
    hasQuickSignal,
    logQuickSignal,
    openFeedbackModal,
    completeCircuitRound,
    focusExerciseByIndex,
    saveActiveSessionToCache,
    saveToLocalStorage,
    onRerender,
    startRestTimer,
    enterEditMode,
  } = deps;

  deckContainer.innerHTML = "";

  // A launched future-day session is a plan, not a live workout — its exercises get the
  // same amber tint the dashboard uses for future days (mirrors the purple past history).
  const launchedDay = activeSession.sourceSession ? activeSession.sourceSession.day : null;
  const isFutureSession = launchedDay === "tomorrow" || launchedDay === "upcoming";

  // Single focus across the whole deck: while a past log is open, the live exercise card
  // collapses too, so exactly one card is ever expanded (the active-exercise pointer is
  // untouched, so it re-expands the moment the past card is closed).
  const pastExpanded = !!activeSession.expandedPastId;

  const formatDateStr = (dateIso) => {
    if (!dateIso) return "";
    const d = new Date(dateIso);
    return d.toLocaleDateString(state.lang === "sl" ? "sl-SI" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Past session exercises. Excludes isPlanning drafts (syncPlanningSnapshotToHistory writes them
  // with an ever-fresh `date` on every save) — a drafted-but-unrun plan is not a performed session,
  // and would otherwise eclipse the client's actual most recent workout here.
  const clientHistory = (state.history || []).filter(
    (h) => h.clientId === activeClientId && !h.isPlanning,
  );
  clientHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  const pastExList = [];
  if (clientHistory.length > 0) {
    const pastSession = clientHistory[0];
    const dateStr = formatDateStr(pastSession.date);
    {
      let pIdx = 0;
      // The last-performance reference lists movements only — flatten past rests/circuit scaffolding
      // to their exercise leaves (structured records) while legacy flat rows pass through unchanged.
      for (const ex of exerciseRecordsOf(pastSession.exercises)) {
        pastExList.push({
          id: `past-${pastSession.id}-${ex.id}-${pIdx}`,
          name: ex.name,
          type: "past",
          sessionDate: dateStr,
          sets: ex.sets,
          loadUnit: ex.loadUnit || "kg",
          metric: ex.metric || "reps",
          modality: ex.modality || "strength",
          routineName: pastSession.routineName,
        });
        pIdx++;
      }
    }
  }

  // Current routine exercises
  const currentExIdx = activeClientState.activeExerciseIndex;
  const currentExList = activeClientState.exercises.map((ex, idx) => {
    // Rest is a first-class plan item: isInFocus is computed the SAME way for every item type —
    // idx === currentExIdx — no more hardcoded exception for rests (TODO §8.6).
    if (isRestRecord(ex)) {
      return {
        id: ex.id,
        index: idx,
        type: "rest",
        rest: ex.rest || 0,
        circuitId: ex.circuitId || null,
        circuitTitle: ex.circuitTitle || "",
        circuitSeries: ex.circuitSeries || 1,
        isInFocus: idx === currentExIdx,
        // Still true regardless of focus: keeps a rest from blocking a circuit's "all members
        // complete" aggregation in buildCircuitUnits — a rest has nothing to complete.
        isCompleted: true,
      };
    }

    const logsList = activeClientState.logs[ex.id] || [];
    const isCompleted = logsList.length > 0 && logsList.every((l) => l.completed);
    const isInFocus = idx === currentExIdx;

    return {
      id: ex.id,
      index: idx,
      name: ex.name,
      type: "current",
      isCompleted,
      isInFocus,
      instructions: ex.instructions,
      setsTarget: ex.setsTargetCount || ex.sets || 3,
      repsTarget: ex.repsTarget ?? ex.reps ?? 10,
      weightTarget: ex.weightTarget ?? ex.weight ?? 0,
      loadUnit: ex.loadUnit || "kg",
      modality: ex.modality || "strength",
      metric: ex.metric || "reps",
      rest: ex.rest || 0,
      circuitId: ex.circuitId || null,
      circuitTitle: ex.circuitTitle || "",
      circuitSeries: ex.circuitSeries || 1,
    };
  });

  // Fold consecutive exercises that share a circuitId into a single circuit/giantset unit; ungrouped
  // exercises stay as their own 'current' cards. Circuits render one card per group.
  const renderUnits = buildCircuitUnits(currentExList);
  const allDeckItems = [...pastExList, ...renderUnits];

  const onFocus = (index) => focusExerciseByIndex(index);

  for (const item of allDeckItems) {
    const card = document.createElement("div");

    // Which DeckCard subclass owns this item — the only place item.type is branched on. Every
    // decision after this point (render, focus rule, click wiring) is polymorphic, not branchy.
    let deckCard;
    if (item.type === "past") {
      deckCard = new PastDeckCard(item, {
        activeSession,
        t,
        escapeHTML,
        formatLoad,
        formatReps,
        formatMetricValue,
        usesLoad,
        onRerender,
      });
    } else if (item.type === "rest") {
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
        pastExpanded,
        isFutureSession,
        t,
        escapeHTML,
        getExerciseSignalColor,
        hasQuickSignal,
        logQuickSignal,
        openFeedbackModal,
        completeCircuitRound,
        startRestTimer,
        saveSessionState: () => {
          saveActiveSessionToCache();
          saveToLocalStorage();
          onRerender();
        },
        onFocus,
      });
    } else {
      deckCard = new ExerciseDeckCard(item, {
        currentCount: currentExList.length,
        activeClientId,
        pastExpanded,
        isFutureSession,
        t,
        escapeHTML,
        getExerciseSignalColor,
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
      const insertFastAdjustment = (type, activeItem) => {
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
        } else if (type === "circuit") {
          const newCircuitId = `c-${newRecordId()}`;
          const id = newRecordId();
          newItemId = id;
          activeClientState.logs[id] = Array.from({ length: 3 }, () => ({
            reps: 10,
            weight: 0,
            completed: false,
            note: "",
          }));
          activeClientState.exercises.splice(newIdx, 0, {
            id,
            name: "",
            setsTargetCount: 3,
            repsTarget: 10,
            weightTarget: 0,
            circuitId: newCircuitId,
            circuitTitle: "",
            circuitSeries: 3,
          });
        } else {
          // exercise
          const id = newRecordId();
          newItemId = id;
          activeClientState.logs[id] = Array.from({ length: 3 }, () => ({
            reps: 10,
            weight: 0,
            completed: false,
            note: "",
          }));
          activeClientState.exercises.splice(newIdx, 0, {
            id,
            name: "",
            setsTargetCount: 3,
            repsTarget: 10,
            weightTarget: 0,
            circuitId: cid,
            circuitTitle: circuitTitle,
            circuitSeries: circuitSeries,
          });
        }

        activeClientState.activeExerciseIndex = newIdx;

        saveActiveSessionToCache();
        if (saveToLocalStorage) saveToLocalStorage();

        if (enterEditMode) {
          enterEditMode(newItemId);
        } else {
          onRerender();
        }
      };

      const adjustBar = document.createElement("div");
      adjustBar.className = "fast-adjust-bar";
      adjustBar.innerHTML = `
        <button type="button" class="btn btn-sm secondary-btn fast-adj-ex">
          <i class="fa-solid fa-plus"></i> ${t("exercise") || "Exercise"}
        </button>
        <button type="button" class="btn btn-sm secondary-btn fast-adj-circuit">
          <i class="fa-solid fa-plus"></i><i class="fa-solid fa-layer-group"></i> ${t("circuit") || "Circuit"}
        </button>
        <button type="button" class="btn btn-sm secondary-btn fast-adj-rest">
          <i class="fa-solid fa-plus"></i><i class="fa-solid fa-hourglass-half"></i> ${t("rest_label") || "Rest"}
        </button>
      `;

      adjustBar.querySelector(".fast-adj-ex").addEventListener("click", (e) => {
        e.stopPropagation();
        insertFastAdjustment("exercise", item);
      });
      adjustBar.querySelector(".fast-adj-circuit").addEventListener("click", (e) => {
        e.stopPropagation();
        insertFastAdjustment("circuit", item);
      });
      adjustBar.querySelector(".fast-adj-rest").addEventListener("click", (e) => {
        e.stopPropagation();
        insertFastAdjustment("rest", item);
      });

      deckContainer.appendChild(adjustBar);
    }
  }

  // Bring whatever the trainer just acted on into view: a freshly expanded past card if
  // there is one, otherwise the in-focus current exercise.
  setTimeout(() => {
    const focusEl =
      deckContainer.querySelector(".exercise-deck-card.past-expanded") ||
      deckContainer.querySelector(".exercise-deck-card.in-focus");
    if (focusEl) {
      focusEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, 100);
}
