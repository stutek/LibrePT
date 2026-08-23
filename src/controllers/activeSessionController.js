// src/controllers/activeSessionController.js — the live gym-floor session's composition root. Single
// responsibility: WIRE the session up — hand the board everything it paints with, wire the overlay's
// title-bar chrome, own edit mode, and present one import surface for the session to the rest of the
// app. The work itself lives in the sibling modules it re-exports from (activeSessionStore.js,
// activeSessionCache.js, sessionLifecycle.js, sessionTimers.js, sessionQuickSignals.js,
// sessionCircuits.js, sessionPlanEditing.js, sessionFocusUrl.js). Injected dependencies: everything
// app.js supplies, merged into activeSessionStore.js's appDeps.
//
// The re-exports are deliberate and not a transitional shim: app.js, appBoot.js, the router, the deck
// and the medium tests are all wired against this module's names, and the split moved the code, not
// the seam.

import { newRecordId } from "../data/recordId.js";
import {
  bindingFor,
  boundClientRoutines,
  unboundClientRoutines,
  withBinding,
  withoutBinding,
} from "../domain/participantBinding.js";
import { copyPlanForParticipant } from "../domain/planCopy.js";
import { focusIndexFromRef, isCircuitFocus } from "../domain/sessionFocus.js";
import { clampFocusIndex, ensureRestItems, isRestItem } from "../domain/sessionPlanFactory.js";
import {
  initActiveSessionBoard,
  renderActiveSessionBoard,
} from "../modules/clipboard/activeSessionBoard.js";
import {
  renderActiveSessionOverlayShell,
  renderAddSessionExerciseDialog,
  renderCatalogPickerDialog,
} from "../modules/clipboard/activeSessionOverlayView.js";
import {
  isClipboardEditMode,
  markEditorRow,
  setClipboardEditModeFlag,
} from "../modules/clipboard/editModeState.js";
import { updateClientTabsFadeState } from "../modules/common/activeUsersList.js";
import { isGuideSurface } from "../modules/common/dom.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import {
  currentPlanMode,
  getActiveSession,
  getAppDeps,
  mergeAppDeps,
} from "./activeSessionStore.js";
import { buildCircuitUnits, completeCircuitRound } from "./sessionCircuits.js";
import { focusExerciseByIndex, syncSessionFocusUrl } from "./sessionFocusUrl.js";
import {
  beginWorkoutSession,
  cancelWorkoutSession,
  deleteScheduledSession,
  finishWorkoutSession,
} from "./sessionLifecycle.js";
import {
  clearActivePlan,
  navigateToSessionDialog,
  openAddSessionExerciseDialog,
  openCatalogPicker,
  wireAddExerciseAndCatalogDialogs,
} from "./sessionPlanEditing.js";
import {
  getExerciseSignalColor,
  hasExerciseNote,
  hasQuickSignal,
  logQuickSignal,
} from "./sessionQuickSignals.js";
import { startClientTimer } from "./sessionTimers.js";

// ---- The session's public surface --------------------------------------------------------------
// Re-exported rather than moved off this module: the callers were already wired against these names,
// and `isRestItem` / `focusIndexFromRef` / `isCircuitFocus` are pure domain rules the router and the
// deck reach through here.
export { isRestItem };
export { focusIndexFromRef, isCircuitFocus };
export { getActiveExercise, getActiveSession, setActiveSession } from "./activeSessionStore.js";
export { saveActiveSessionToCache } from "./activeSessionCache.js";
export { sessionFocusPath, syncSessionFocusUrl, focusExerciseByIndex } from "./sessionFocusUrl.js";
export { startSessionTimer, updateOverlaySessionTimer } from "./sessionTimers.js";
export {
  enforceQuickSignalExclusivity,
  getExerciseSignalColor,
  hasExerciseNote,
  hasQuickSignal,
  logQuickSignal,
} from "./sessionQuickSignals.js";
export { buildCircuitUnits, completeCircuitRound } from "./sessionCircuits.js";
export { clearActivePlan, openCatalogPicker } from "./sessionPlanEditing.js";
export {
  beginWorkoutSession,
  cancelWorkoutSession,
  deleteScheduledSession,
  finishWorkoutSession,
  openSessionFromHistory,
  recoverActiveSession,
  startWorkoutSession,
} from "./sessionLifecycle.js";

// ---- Rest as a first-class plan item ----------------------------------------------------------
// The plan (clientState.exercises) is an ordered mix of exercise items and rest items. A rest item
// is { id, type:'rest', rest:<seconds>, circuitId, circuitTitle, circuitSeries } — it carries the
// circuit fields so a rest inside a circuit stays grouped with it. Exercise items have no `type`.
//
// Rests are first-class: `activeExerciseIndex` may point at one exactly like any exercise or
// circuit member (TODO §8.6). The plan's shape, and everything that builds one, lives in
// domain/sessionPlanFactory.js.

// `newItemId` names a plan item the caller just created (the live deck's +Exercise/+Circuit/+Rest
// bar), so the editor opens with that row called out instead of dropping the trainer into an
// otherwise-identical list.
export function enterClipboardEditMode(newItemId = null) {
  setClipboardEditModeFlag(true);
  markEditorRow(newItemId, { kind: "new", focus: true });
  // Re-entering edit mode resets the accordion to its default (one row open) unless a callout row
  // is being inserted — toggling a row closed sets editorExpandedId to null, which must stick until
  // the trainer leaves and re-enters edit mode.
  const activeSession = getActiveSession();
  if (!newItemId && activeSession) {
    const cs = activeSession.clientRoutines[activeSession.activeClientId];
    if (cs) cs.editorExpandedId = undefined;
  }
  renderActiveGroupBoard();
}

export function exitClipboardEditMode() {
  setClipboardEditModeFlag(false);
  renderActiveGroupBoard();
}

// Set the edit-mode flag WITHOUT re-rendering — for the router restoring edit mode from an `/edit`
// deep link, where the caller (showSessionView) already renders the board once afterwards. Use
// enter/exitClipboardEditMode for in-app toggles that must render immediately.
export function setClipboardEditMode(on, slotId = null) {
  setClipboardEditModeFlag(on);
  if (!on) return;
  // No row in the URL does not mean "no row": a swap made from the catalog dialog marks its row and
  // then routes BACK to a slot-less `/edit` entry, and that pop must not erase the mark it just set.
  // The URL is authoritative only when it actually names a row.
  if (!slotId) return;
  // A row id from a URL may name a row that has since been deleted. Like a stale focus card, it is
  // ignored rather than erroring — syncSessionFocusUrl then drops the segment on the next render.
  const activeSession = getActiveSession();
  const plan = activeSession?.clientRoutines?.[activeSession.activeClientId]?.exercises;
  const known = plan?.some((item) => item.id === slotId) ? slotId : null;
  // Restoring from a URL, not reacting to an edit: highlight and scroll to the row so the trainer
  // finds their place, but take no caret and show no badge. A reload is not the moment the row
  // appeared — announcing it as New would be a lie, and stealing focus would pop the phone keyboard
  // on a page the trainer may have reloaded for some other reason entirely.
  markEditorRow(known, { kind: "restored", focus: false });
}

export function initActiveSessionController(deps) {
  mergeAppDeps(deps);
}

// The board paints; this controller orchestrates. Everything it needs is injected rather than
// imported back up a layer — see agent_tools/import_layers.py and the board's own header.
initActiveSessionBoard({
  getActiveSession,
  getAppDeps,
  currentPlanMode,
  syncSessionFocusUrl: () => syncSessionFocusUrl(),
  ensureRestItems,
  clampFocusIndex,
  rerender: () => renderActiveGroupBoard(),
  enterEditMode: enterClipboardEditMode,
  exitEditMode: exitClipboardEditMode,
  saveActiveSessionToCache: () => saveActiveSessionToCache(),
  openAddExercise: () => openAddSessionExerciseDialog(),
  // Routed so a reload reopens the picker. `query`/`category` are transient typing state and stay
  // out of the URL; the route re-derives the filter from the row it is swapping.
  openCatalogPicker: (opts = {}) =>
    navigateToSessionDialog(
      opts.slotId ? "session.catalog.slot" : "session.catalog",
      opts.slotId ? { slotId: opts.slotId } : {},
    ) || openCatalogPicker(opts),
  buildCircuitUnits,
  getExerciseSignalColor,
  hasExerciseNote,
  hasQuickSignal,
  logQuickSignal,
  completeCircuitRound,
  focusExerciseByIndex,
  startRestTimer: (seconds, type, label) => startClientTimer(seconds, type, label),
  newRecordId,
});

// The board render itself lives in modules/clipboard/activeSessionBoard.js (TODO §24.3). Kept as a
// named export here because app.js and the router already call renderActiveGroupBoard() — the seam
// moved, the entry point did not.
export function renderActiveGroupBoard() {
  renderActiveSessionBoard();
}

// The dashboard mini-bar's own expand affordance + click-through, and its Enter/Space keyboard
// equivalent. Leaving the clipboard is handled globally by the title-bar grab handle + swipe-down
// gesture (setupViewDismiss in app.js), shared with every other view.
function wireSessionExpandBar(navigateToPath) {
  const clientTabsBar = document.getElementById("active-session-client-tabs");
  if (clientTabsBar) {
    clientTabsBar.addEventListener("scroll", updateClientTabsFadeState);
  }

  const btnExpandSession = document.getElementById("btn-expand-session");
  if (btnExpandSession) {
    btnExpandSession.addEventListener("click", (e) => {
      e.stopPropagation();
      const activeSession = getActiveSession();
      const activeClientId = activeSession
        ? activeSession.activeClientId || activeSession.participants[0]
        : "";
      const sessionId = activeSession ? activeSession.id || "session" : "session";
      if (navigateToPath) navigateToPath(`/session/${sessionId}/client/${activeClientId}`);
    });
  }
}

// The title bar's ⋯ overflow menu, its Edit-plan trigger, and the Start/Complete/Delete actions
// that hang off it — all of a single overlay-chrome piece, wired together because closeSessionMenu
// is shared between the menu's own outside-tap dismissal and the Delete action inside it.
function wireSessionMenuAndActions(t) {
  const sessionMenuBtn = document.getElementById("btn-session-menu");
  const sessionMenu = document.getElementById("session-menu");
  const closeSessionMenu = () => {
    if (sessionMenu) sessionMenu.classList.add("hidden");
    if (sessionMenuBtn) sessionMenuBtn.setAttribute("aria-expanded", "false");
    // The "copy to whom" list closes with the menu that holds it — reopening ⋯ to find a submenu
    // already unfolded from last time reads as the app having remembered a decision nobody made.
    document.getElementById("copy-plan-targets")?.classList.add("hidden");
  };
  if (sessionMenuBtn && sessionMenu) {
    sessionMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !sessionMenu.classList.contains("hidden");
      sessionMenu.classList.toggle("hidden", isOpen);
      sessionMenuBtn.setAttribute("aria-expanded", String(!isOpen));
    });
    document.addEventListener("click", (e) => {
      // The guide is not the app (modules/common/dom.js): a tap on Show me must not close the menu
      // the next step is about to point at.
      if (isGuideSurface(e.target)) return;
      if (!sessionMenu.classList.contains("hidden") && !e.target.closest(".session-menu-wrap")) {
        closeSessionMenu();
      }
    });
  }

  /** Puts every participant on the plan currently on screen — or gives them their own back (TODO §8.1).
   *
   * Applied to the live session immediately, so the very next set logged counts for the whole group:
   * bound participants SHARE one plan object (domain/participantBinding.js), which is what makes one
   * tap do the work of three without a single logging site knowing that bindings exist.
   */
  function toggleParticipantBinding() {
    const activeSession = getActiveSession();
    if (!activeSession) return;
    const participants = activeSession.participants || [];
    if (participants.length < 2) return;

    const group = bindingFor(activeSession.bindings, activeSession.activeClientId);
    if (group) {
      // Everyone in the group goes back to their own plan — a COPY of what they were training, since
      // dropping the binding alone would leave them holding one object and the next set logged would
      // still appear for both.
      activeSession.bindings = group.reduce(
        (bindings, clientId) => withoutBinding(bindings, clientId),
        activeSession.bindings,
      );
      activeSession.clientRoutines = unboundClientRoutines(activeSession.clientRoutines, group);
    } else {
      activeSession.bindings = withBinding(activeSession.bindings, participants);
      // Applied here rather than at render: the identity of these objects IS the binding, and a
      // render that rebuilt it would quietly discard whatever was logged into the shared plan.
      activeSession.clientRoutines = boundClientRoutines(
        activeSession.clientRoutines,
        activeSession.bindings,
      );
    }
    saveActiveSessionToCache();
    renderActiveGroupBoard();
  }

  /** Lists who tonight's plan can be given to, inside the ⋯ menu (TODO §8.8).
   *
   * Names rather than a single "copy" action, because *to whom* is the entire question — the common
   * case is a walk-in joining a session already underway, and a menu item that guessed would be
   * answering it for the trainer. Built with createElement and textContent: these are client names.
   */
  function renderCopyPlanTargets() {
    const list = document.getElementById("copy-plan-targets");
    const activeSession = getActiveSession();
    if (!list || !activeSession) return;
    const { state, t } = getAppDeps();
    list.textContent = "";

    const others = (activeSession.participants || []).filter(
      (clientId) => clientId !== activeSession.activeClientId,
    );
    for (const clientId of others) {
      const client = (state.clients || []).find((row) => row.id === clientId);
      const option = document.createElement("button");
      option.type = "button";
      option.className = "session-menu-item";
      option.setAttribute("role", "menuitem");
      option.dataset.copyTo = clientId;
      option.textContent = client?.name || t("unknown_client");
      option.addEventListener("click", () => {
        closeSessionMenu();
        copyPlanTo(clientId);
      });
      list.appendChild(option);
    }
    // Nobody to copy to is a menu that says so rather than an empty box that looks broken.
    if (others.length === 0) {
      const empty = document.createElement("p");
      empty.className = "session-menu-empty";
      empty.textContent = t("copy_plan_nobody");
      list.appendChild(empty);
    }
  }

  /** Gives another participant a copy of the plan on screen.
   *
   * A COPY, never a share: the two diverge from this moment on (domain/planCopy.js), which is the
   * difference from binding them (§8.1) and the reason both controls exist. What travels is the
   * prescription; what stays behind is what anybody did.
   */
  function copyPlanTo(clientId) {
    const activeSession = getActiveSession();
    const source = activeSession?.clientRoutines?.[activeSession.activeClientId];
    const target = activeSession?.clientRoutines?.[clientId];
    if (!source || !target) return;

    target.exercises = copyPlanForParticipant(source.exercises, { newId: newRecordId });
    // Their own logs are dropped with the plan they belonged to: the old ones name items that no
    // longer exist, and leaving them would attach this person's history to nothing.
    target.logs = {};
    target.activeExerciseIndex = 0;
    target.routineName = source.routineName;
    saveActiveSessionToCache();
    renderActiveGroupBoard();
  }

  document.getElementById("btn-copy-plan")?.addEventListener("click", (e) => {
    e.stopPropagation();
    renderCopyPlanTargets();
    document.getElementById("copy-plan-targets")?.classList.toggle("hidden");
  });

  document.getElementById("btn-edit-plan")?.addEventListener("click", (e) => {
    e.stopPropagation();
    // Closing the menu is part of choosing from it, exactly as Delete below does. It became
    // load-bearing when Edit moved INTO the menu (2026-08-18): left open, the panel sits over the
    // editor it just opened, and the trainer's next tap on ⋯ reads as "nothing happened" because it
    // is toggling a menu they thought was already gone.
    closeSessionMenu();
    enterClipboardEditMode();
  });

  // Everyone on one plan, and back again (TODO §8.1). One control rather than two: the trainer is
  // answering a single question — are these people doing the same thing right now — and a menu that
  // offers both directions at once makes them read which one applies before they can answer it.
  document.getElementById("btn-bind-participants")?.addEventListener("click", () => {
    closeSessionMenu();
    toggleParticipantBinding();
  });

  document.getElementById("btn-delete-session")?.addEventListener("click", () => {
    closeSessionMenu();
    // While editing, this button deletes the PLAN (clears its exercises) and stays in the session;
    // otherwise it cancels the whole session. The label is swapped to match in renderActiveGroupBoard.
    if (isClipboardEditMode()) {
      if (confirm(t("confirm_delete_plan"))) clearActivePlan();
      return;
    }
    // A planning draft has no scheduled slot to take off the board, so deleting one IS just
    // discarding the clipboard; a real session's delete has to remove the row behind it too.
    if (getActiveSession()?.sourceSession?.isPlanning) {
      if (confirm(t("confirm_cancel"))) cancelWorkoutSession();
    } else if (confirm(t("confirm_delete_session"))) {
      deleteScheduledSession();
    }
  });

  document
    .getElementById("btn-start-session")
    ?.addEventListener("click", () => beginWorkoutSession());
  document
    .getElementById("btn-finish-session")
    ?.addEventListener("click", () => finishWorkoutSession());
}

export function setupActiveSession(deps) {
  mergeAppDeps(deps);
  renderActiveSessionOverlayShell();
  renderAddSessionExerciseDialog();
  renderCatalogPickerDialog();
  const { state, t, navigateToPath } = getAppDeps();

  wireSessionExpandBar(navigateToPath);
  wireSessionMenuAndActions(t);
  wireAddExerciseAndCatalogDialogs(state);
}
