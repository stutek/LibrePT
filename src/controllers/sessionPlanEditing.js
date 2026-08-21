// src/controllers/sessionPlanEditing.js — changing WHAT is in the plan while a session is open:
// adding a movement (typed or from the taxonomy), swapping the movement on an existing row, and
// emptying the plan outright. Single responsibility: those plan mutations and the two dialogs that
// drive them. Injected dependencies: `state`, `t`, `navigateToPath`, `urlFor`, `saveToLocalStorage`
// and `activeRouteIsDialog` arrive through activeSessionStore.js; the picker itself is
// modules/exercises/exercisePicker.js.

import { newRecordId } from "../data/recordId.js";
import { modalityOf, primaryMetricOf } from "../domain/exerciseModality.js";
import { loadUnitForEquipment } from "../domain/repsAndLoad.js";
import { renderActiveSessionBoard } from "../modules/clipboard/activeSessionBoard.js";
import { markEditorRow } from "../modules/clipboard/editModeState.js";
import { mountExercisePicker } from "../modules/exercises/exercisePicker.js";
import { saveActiveSessionToCache } from "./activeSessionCache.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

// Opens the existing "add exercise to session" dialog (also used by the in-clipboard editor).
export function openAddSessionExerciseDialog() {
  const modal = document.getElementById("dialog-add-session-exercise");
  const form = document.getElementById("form-add-session-exercise");
  if (!modal || !form) return;
  form.reset();
  modal.showModal();
}

// Navigate to a dialog that hangs off the session the trainer is in. Returns false when there is no
// session to hang it off, so callers can fall back to opening it directly.
export function navigateToSessionDialog(routeName, params = {}) {
  const activeSession = getActiveSession();
  const { navigateToPath, urlFor } = getAppDeps();
  if (!activeSession || !navigateToPath || !urlFor) return false;
  const clientId = activeSession.activeClientId || activeSession.participants[0];
  navigateToPath(urlFor(routeName, { sessionId: activeSession.id, clientId, ...params }));
  return true;
}

// A change made from inside a routed dialog must not re-render the view behind it: the dialog is
// about to close, that close routes, and the routing render is the one the trainer actually sees. A
// render spent behind the dialog also spends the one-shot call-out, so the row would lose its mark.
function renderBoardUnlessDialogIsOpen() {
  if (getAppDeps().activeRouteIsDialog?.()) return;
  renderActiveSessionBoard();
}

// Append a movement to the active client's plan as a fresh, taxonomy-aware item (its own slot id, so
// the same catalog movement can appear twice without colliding logs), then re-render. Shared by the
// typed add-exercise form and the catalog picker.
function injectExerciseIntoActivePlan(baseEx, { sets, reps, weight, rest }) {
  const activeSession = getActiveSession();
  if (!activeSession || !baseEx) return;
  const activeClientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[activeClientId];
  if (!clientState) return;
  const slotId = newRecordId();
  clientState.exercises.push({
    id: slotId,
    exerciseId: baseEx.id,
    name: baseEx.name,
    category: baseEx.category,
    pattern: baseEx.pattern || "",
    instructions: baseEx.instructions || "",
    loadUnit: loadUnitForEquipment(baseEx.equipment),
    modality: modalityOf(baseEx),
    metric: primaryMetricOf(baseEx),
    setsTargetCount: sets,
    repsTarget: reps,
    weightTarget: weight,
    rest,
  });
  clientState.logs[slotId] = Array.from({ length: sets }, () => ({
    reps,
    weight,
    completed: false,
    note: "",
  }));
  clientState.activeExerciseIndex = clientState.exercises.length - 1;
  clientState.deckAllCollapsed = false;
  // Called out in the editor so the injected movement isn't lost in the list. No focus: the catalog
  // already filled the name in, so there is nothing to type.
  markEditorRow(slotId, { kind: "new", focus: false });
  saveActiveSessionToCache();
  renderBoardUnlessDialogIsOpen();
}

// Retarget an existing plan row at a different movement, keeping the slot: the id, the sets and the
// logs already written against them survive, so a swap changes WHAT is done, never what was done.
function swapPlanItemMovement(slotId, baseEx) {
  const activeSession = getActiveSession();
  if (!activeSession || !baseEx) return;
  const clientState = activeSession.clientRoutines[activeSession.activeClientId];
  const item = clientState?.exercises?.find((e) => e.id === slotId);
  if (!item) return;
  item.exerciseId = baseEx.id;
  item.name = baseEx.name;
  item.category = baseEx.category;
  item.pattern = baseEx.pattern || "";
  item.instructions = baseEx.instructions || "";
  item.loadUnit = loadUnitForEquipment(baseEx.equipment);
  item.modality = modalityOf(baseEx);
  item.metric = primaryMetricOf(baseEx);
  markEditorRow(slotId, { kind: "swap", focus: false });
  saveActiveSessionToCache();
  const { saveToLocalStorage } = getAppDeps();
  if (saveToLocalStorage) saveToLocalStorage();
  renderBoardUnlessDialogIsOpen();
}

// Plan-edit taxonomy browse. Two modes, one dialog:
//  - no `slotId`: "Add from catalog" — inject the chosen movement with sensible defaults;
//  - with `slotId`: the row's 📖 button — swap THAT row's movement in place.
// The picker opens pre-filtered on the row's own muscle group and pre-seeded with whatever the PT
// had already typed in the name field, with the caret in the search box: the common case ("swap this
// press for another press") is then one tap, and a named target is type-then-Enter — no scrolling.
function catalogPickerTitle(slotId, t) {
  return slotId
    ? t("swap_movement") || "Swap movement"
    : t("catalog_picker_title") || "Add from Exercise Catalog";
}

// The movement already on the row is not a swap target. Plans authored before slots carried an
// `exerciseId` (routines, demo data) only know the movement by name, so fall back to that.
function resolveCurrentMovementId(item, state) {
  if (!item) return null;
  return item.exerciseId || state.exercises.find((e) => e.name === item.name)?.id || null;
}

export function openCatalogPicker({ slotId = null, query = "", category = "" } = {}) {
  const activeSession = getActiveSession();
  const dialog = document.getElementById("dialog-catalog-picker");
  const mount = document.getElementById("catalog-picker-mount");
  if (!dialog || !mount || !activeSession) return;
  const { state, t } = getAppDeps();
  const titleEl = document.getElementById("catalog-picker-title");
  if (titleEl) titleEl.textContent = catalogPickerTitle(slotId, t);

  const clientState = activeSession.clientRoutines[activeSession.activeClientId];
  const item = slotId ? clientState?.exercises?.find((e) => e.id === slotId) : null;
  const currentMovementId = resolveCurrentMovementId(item, state);
  mountExercisePicker(mount, {
    state,
    excludeId: currentMovementId,
    defaultCategory: category || item?.category || "All",
    initialQuery: query,
    autoFocusSearch: true,
    searchLabel: t("search_movements") || "Search movements",
    muscleLabel: t("muscle") || "Muscle",
    equipmentLabel: t("equipment") || "Equipment",
    onSelect: (ex) => {
      if (slotId) swapPlanItemMovement(slotId, ex);
      else injectExerciseIntoActivePlan(ex, { sets: 3, reps: 10, weight: 0, rest: 60 });
      dialog.close();
    },
  });
  dialog.showModal();
}

function handleAddSessionExerciseSubmit(e, state, addExModal) {
  e.preventDefault();
  const typed = document.getElementById("session-add-select-ex").value.trim();
  const sets = parseInt(document.getElementById("session-add-sets").value);
  const reps = parseInt(document.getElementById("session-add-reps").value);
  const weight = parseFloat(document.getElementById("session-add-weight").value);
  const rest = parseInt(document.getElementById("session-add-rest").value);

  if (!getActiveSession() || !typed || isNaN(sets)) return;

  let baseEx = state.exercises.find((ex) => ex.name.toLowerCase() === typed.toLowerCase());
  if (!baseEx) {
    baseEx = { id: newRecordId(), name: typed, category: "Custom", instructions: "" };
  }

  injectExerciseIntoActivePlan(baseEx, { sets, reps, weight, rest });
  addExModal.close();
}

export function wireAddExerciseAndCatalogDialogs(state) {
  const addExModal = document.getElementById("dialog-add-session-exercise");
  const addExForm = document.getElementById("form-add-session-exercise");
  if (!addExModal || !addExForm) return;

  const btnAddExToSession = document.getElementById("btn-add-exercise-to-session");
  if (btnAddExToSession) {
    btnAddExToSession.addEventListener("click", () => {
      addExForm.reset();
      addExModal.showModal();
    });
  }

  const cancelBtn = addExModal.querySelector(".modal-cancel");
  const closeBtn = addExModal.querySelector(".modal-close-btn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => addExModal.close());
  if (closeBtn) closeBtn.addEventListener("click", () => addExModal.close());

  // Catalog picker dialog: only needs a close affordance — selecting a movement injects + closes it.
  const catalogModal = document.getElementById("dialog-catalog-picker");
  const catalogCloseBtn = catalogModal?.querySelector(".modal-close-btn");
  if (catalogCloseBtn) catalogCloseBtn.addEventListener("click", () => catalogModal.close());

  addExForm.addEventListener("submit", (e) => handleAddSessionExerciseSubmit(e, state, addExModal));
}

// Edit-mode "Delete Plan": empty the active client's plan (exercises + their logs + circuit rounds)
// so the trainer can rebuild from scratch, keeping the session itself open and still in edit mode.
export function clearActivePlan() {
  const activeSession = getActiveSession();
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  cs.exercises = [];
  cs.logs = {};
  cs.circuitRounds = {};
  cs.activeExerciseIndex = 0;
  saveActiveSessionToCache();
  const { saveToLocalStorage } = getAppDeps();
  if (saveToLocalStorage) saveToLocalStorage();
  renderActiveSessionBoard();
}
