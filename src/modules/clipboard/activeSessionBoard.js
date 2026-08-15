// src/modules/clipboard/activeSessionBoard.js — everything the active-session clipboard PAINTS:
// the client tab bar, the injury banner, the client focus panel, the title bar's edit-mode chrome,
// the Start/Complete visibility, and the deck-or-editor body.
//
// It lived in controllers/activeSessionController.js until TODO §24.3. Everything else in
// controllers/ orchestrates; this paints, and 250 lines of rendering inside a 1,668-line controller
// is also why tests/medium/ could not mount the board without dragging the whole session lifecycle
// in with it. Extracted the way agent_tools/import_layers.py requires — by injection, never by
// importing back up into controllers/ — so the board stays independently mountable.
//
// deps (via initActiveSessionBoard):
//   getActiveSession()      — accessor, because the controller REASSIGNS its activeSession
//   getAppDeps()            — accessor for the controller's live dep bag ({ state, t, … })
//   currentPlanMode()       — "live" | "future" | "planning"; labels edit mode
//   syncSessionFocusUrl()   — the focus↔URL write, run before the body renders
//   ensureRestItems(cs), clampFocusIndex(cs)  — plan normalisation, applied before painting
//   rerender()              — re-render this board (what the editor/deck call after a mutation)
//   enterEditMode(), exitEditMode()           — mode switches that render
//   saveActiveSessionToCache()
//   openAddExercise(), openCatalogPicker(opts)
//   buildCircuitUnits, getExerciseSignalColor, hasExerciseNote, hasQuickSignal, logQuickSignal,
//   completeCircuitRound, focusExerciseByIndex, startRestTimer  — deck card callbacks
//   newRecordId()

import { renderActiveUsersList } from "../common/activeUsersList.js";
import { openFeedbackModal } from "../common/feedbackModal.js";
import { escapeHTML, getClientDisplayNameHTML, getInitials } from "../common/utils.js";
import { renderClipboardEditor } from "./clipboardEditor.js";
import { isClipboardEditMode, markEditorRow, takePendingCallout } from "./editModeState.js";
import { renderExerciseDeck } from "./exerciseDeck.js";

let deps = {};

// Holds the session title bar's normal content while edit mode repurposes it, so exiting restores
// it verbatim rather than reconstructing it.
let savedSessionTitleHTML = null;

// Detaches the previous editor render's document listeners before the next render installs new ones.
let editorCleanup = null;

export function initActiveSessionBoard(injected) {
  deps = { ...deps, ...injected };
}

function renderClientTabsBar(activeClientId) {
  const { state, navigateToPath } = deps.getAppDeps();
  const tabsContainer = document.getElementById("active-session-client-tabs");
  if (!tabsContainer) return;
  renderActiveUsersList(tabsContainer, deps.getActiveSession(), {
    clients: state.clients,
    activeClientId,
    getInitials,
    getClientDisplayNameHTML,
    navigateToPath,
  });
}

function renderInjuryAlertBanner(activeClient) {
  const alertBanner = document.getElementById("clipboard-client-alert");
  const alertText = document.getElementById("clipboard-client-notes-text");
  if (!alertBanner || !activeClient) return;
  if (activeClient.hasInjury && (activeClient.injury || activeClient.notes)) {
    alertText.textContent = activeClient.injury || activeClient.notes;
    alertBanner.classList.remove("hidden");
  } else {
    alertBanner.classList.add("hidden");
  }
}

// Only shown while editing the plan (CSS-gated by .editing-plan), so it's cheap to keep populated
// on every render.
function renderClientFocusPanel(activeClient) {
  if (!activeClient) return;
  const { t } = deps.getAppDeps();
  const goalsLabel = document.getElementById("client-focus-goals-label");
  const notesLabel = document.getElementById("client-focus-notes-label");
  const goalsEl = document.getElementById("client-focus-goals");
  const notesEl = document.getElementById("client-focus-notes");
  if (goalsLabel) goalsLabel.textContent = t("goals") || "Training Goals";
  if (notesLabel) notesLabel.textContent = t("notes_injuries") || "Notes";
  if (goalsEl) goalsEl.textContent = activeClient.goals || t("no_goals_specified") || "";
  if (notesEl) notesEl.textContent = activeClient.notes || t("no_notes_specified") || "";
}

// Repurpose the session title bar for edit mode: show WHICH client's plan is open and its temporal
// mode (Live / Upcoming / Planning). The ✎ icon rides up here as the mode indicator (the editor body
// no longer has its own header).
function buildEditModeTitleHTML(activeClient) {
  const { t } = deps.getAppDeps();
  const mode = deps.currentPlanMode();
  const b = deps.getActiveSession().sourceSession;
  // Concrete schedule beats a vague "Live": show the day + time of the booked session, or
  // "Unscheduled" for a date-less planning program. The chip's colour still encodes urgency.
  let chipLabel;
  if (mode === "planning") {
    chipLabel = t("unscheduled") || "Unscheduled";
  } else {
    const parts = [b?.day ? t(b.day) || b.day : "", b?.timeLabel || ""].filter(Boolean);
    chipLabel = parts.join(" · ") || t("live") || "Live";
  }
  const clientNm = activeClient ? escapeHTML(activeClient.name) : "";
  // A flex row, not a run of inline text, because the bar it lands in (#session-title-text) is
  // `white-space: nowrap; text-overflow: ellipsis` — and an ellipsis eats whole ELEMENTS, not just
  // the tail of a sentence. Laid out inline, the last item was 169px outside the box on a 390px
  // phone in both languages: entirely invisible, with no "…" to say anything was missing. Ordering
  // alone does not fix that, it only chooses the casualty — the chip trailing loses the chip, the
  // chip leading loses the client name.
  //
  // So each part declares whether it may shrink. The chip (is this session running RIGHT NOW?) and
  // the "Editing" label do not; the client NAME does, and being the ellipsised box itself it
  // truncates as text, with the affordance a trainer can actually see. Caught, and now kept honest,
  // by tests/e2e/test_layout_overflow.py.
  return `<span class="edit-mode-title">
    <span class="edit-mode-chip ${mode}">${escapeHTML(chipLabel)}</span>
    <i class="fa-solid fa-pen-to-square"></i>
    <span class="edit-mode-label">${escapeHTML(t("editing") || "Editing")}</span>${
      clientNm ? `<strong class="edit-mode-client">${clientNm}</strong>` : ""
    }
  </span>`;
}

// Swaps the title bar's own content between the normal session title and the edit-mode label,
// saving/restoring the original HTML verbatim so exiting edit mode never has to reconstruct it.
function swapTitleBarContent(titleEl, overlay, activeClient) {
  if (isClipboardEditMode()) {
    if (savedSessionTitleHTML === null) savedSessionTitleHTML = titleEl.innerHTML;
    titleEl.innerHTML = buildEditModeTitleHTML(activeClient);
    overlay.classList.add("editing-plan");
    return;
  }
  if (savedSessionTitleHTML !== null) {
    titleEl.innerHTML = savedSessionTitleHTML;
    savedSessionTitleHTML = null;
  }
  overlay.classList.remove("editing-plan");
}

// The rest of the title bar's chrome that reacts to edit mode: the ✎/Done button swap, and the
// ⋯ menu's destructive action relabelling itself between "Delete Session" and "Delete Plan".
function syncTitleBarEditChrome() {
  const { t } = deps.getAppDeps();
  const editing = isClipboardEditMode();
  // The ✎ trigger is redundant while editing (the ✎ mode icon now rides on the title, and Done
  // exits), and leaving it live would race the tap-outside handler; hide it during edit mode and
  // surface the title-bar Done button in its place.
  document.getElementById("btn-edit-plan")?.classList.toggle("hidden", editing);
  document.getElementById("btn-done-edit")?.classList.toggle("hidden", !editing);

  // In edit mode the ⋯ menu's destructive action targets the PLAN (clear its exercises), not the
  // whole session — relabel it so the trainer knows which one they're deleting. Preserve the icon.
  const delBtn = document.getElementById("btn-delete-session");
  if (!delBtn) return;
  const label = editing
    ? t("btn_delete_plan") || "Delete Plan"
    : t("btn_delete_session") || "Delete Session";
  const icon = delBtn.querySelector("i");
  delBtn.innerHTML = "";
  if (icon) delBtn.appendChild(icon);
  delBtn.appendChild(document.createTextNode(` ${label}`));
}

function renderTitleBarForEditMode(activeClient) {
  const titleEl = document.getElementById("session-title-text");
  const overlay = document.getElementById("active-session-overlay");
  if (!titleEl || !overlay) return;

  swapTitleBarContent(titleEl, overlay, activeClient);
  syncTitleBarEditChrome();
}

// Starting/completing are LIVE-session actions: starting begins the timer, completing logs the
// session to history. Both are wrong while the plan is being edited (Done exits edit mode
// instead) and wrong for a date-less planning programme that is never run.
function syncStartCompleteVisibility(canStartSession, started) {
  // Start lives on the title bar (session-timer-block) so it reads as part of the session's own
  // clock, not a footer action — it's the one thing that flips "00:00" into a running countdown.
  document
    .getElementById("btn-start-session")
    ?.classList.toggle("hidden", started || !canStartSession);
  document.getElementById("overlay-session-timer")?.classList.toggle("hidden", !started);

  // Complete stays a footer drawer, but now it's the footer's only occupant — hide the whole bar
  // (not just the button) until there's something running to complete, so no empty bar is left
  // behind; it comes back on exit because every mode change re-renders through here.
  const footer = document.querySelector("#active-session-overlay .session-actions-footer");
  if (footer) {
    footer.classList.toggle("hidden", !canStartSession || !started);
  }
}

function renderPlanEditor(deckContainer, activeClientId, activeClientState, callout) {
  const { state, t, saveToLocalStorage } = deps.getAppDeps();
  const persist = () => {
    deps.saveActiveSessionToCache();
    saveToLocalStorage?.();
  };
  const editClient = state.clients.find((c) => c.id === activeClientId);
  return renderClipboardEditor(deckContainer, {
    activeClientState,
    clientName: editClient ? editClient.name : "",
    allExerciseNames: (state.exercises || []).map((e) => e.name),
    t,
    escapeHTML,
    save: persist,
    rerender: deps.rerender,
    openAddExercise: deps.openAddExercise,
    openCatalogPicker: deps.openCatalogPicker,
    exit: deps.exitEditMode,
    genId: deps.newRecordId,
    callout,
    markNewItem: (id) => markEditorRow(id, { kind: "new", focus: true }),
  });
}

function renderLiveDeck(deckContainer, activeClientId, activeClientState) {
  const appDeps = deps.getAppDeps();
  renderExerciseDeck(deckContainer, {
    activeSession: deps.getActiveSession(),
    activeClientState,
    activeClientId,
    state: appDeps.state,
    t: appDeps.t,
    escapeHTML,
    buildCircuitUnits: deps.buildCircuitUnits,
    getExerciseSignalColor: deps.getExerciseSignalColor,
    hasExerciseNote: deps.hasExerciseNote,
    hasQuickSignal: deps.hasQuickSignal,
    logQuickSignal: deps.logQuickSignal,
    openFeedbackModal,
    completeCircuitRound: deps.completeCircuitRound,
    focusExerciseByIndex: deps.focusExerciseByIndex,
    saveActiveSessionToCache: deps.saveActiveSessionToCache,
    saveToLocalStorage: appDeps.saveToLocalStorage,
    onRerender: deps.rerender,
    startRestTimer: deps.startRestTimer,
    enterEditMode: deps.enterEditMode,
  });
}

function renderDeckOrEditor(activeClientId, activeClientState) {
  // Detach any previous editor's document listeners before this render replaces the deck DOM.
  if (editorCleanup) {
    editorCleanup();
    editorCleanup = null;
  }

  const deckContainer = document.getElementById("active-exercise-scroll-deck");
  const callout = takePendingCallout();
  if (!deckContainer || !activeClientState) return;

  if (isClipboardEditMode()) {
    editorCleanup = renderPlanEditor(deckContainer, activeClientId, activeClientState, callout);
    return;
  }
  renderLiveDeck(deckContainer, activeClientId, activeClientState);
}

// The historical-review panel (repurposed as an empty-state placeholder when the active client
// has no plan at all — see showPastExerciseInFocus for its other use, populating it with a past
// session's read-only detail).
function renderClipboardLoggerContainer(activeClientState) {
  const { t } = deps.getAppDeps();
  const container = document.getElementById("clipboard-logger-container");
  if (!container) return;

  if (!activeClientState || activeClientState.exercises.length === 0) {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="clipboard-empty-state">
        <h4>${t("no_exercises_injected")}</h4>
        <p>${t("no_exercises_desc")}</p>
      </div>
    `;
    return;
  }

  container.classList.add("hidden");
  container.innerHTML = "";
}

export function renderActiveSessionBoard() {
  const activeSession = deps.getActiveSession();
  if (!activeSession) return;
  const { state, t } = deps.getAppDeps();
  if (!state || !t) return;

  const activeClientId = activeSession.activeClientId || activeSession.participants[0];
  activeSession.activeClientId = activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];

  // Rest is a first-class plan item: migrate any legacy exercise-level rest, then bounds-clamp focus
  // (only an out-of-range index needs correcting — a rest is a perfectly valid focus target).
  deps.ensureRestItems(activeClientState);
  deps.clampFocusIndex(activeClientState);

  deps.syncSessionFocusUrl();

  const activeClient = state.clients.find((c) => c.id === activeClientId);

  renderClientTabsBar(activeClientId);
  renderInjuryAlertBanner(activeClient);
  renderClientFocusPanel(activeClient);
  renderTitleBarForEditMode(activeClient);

  const started = !!activeSession.started;
  const canStartSession = !isClipboardEditMode() && deps.currentPlanMode() !== "planning";
  syncStartCompleteVisibility(canStartSession, started);

  renderDeckOrEditor(activeClientId, activeClientState);
  renderClipboardLoggerContainer(activeClientState);
}
