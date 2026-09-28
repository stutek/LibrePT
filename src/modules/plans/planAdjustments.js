// src/modules/plans/planAdjustments.js
// Logic for displaying the pending plan adjustments widget on the dashboard,
// as well as launching and submitting the interactive Apply Plan Adjustment Dialog wizard.
import { libraryExercises } from "../../data/exerciseLibrary.js";
import { performedTarget, suggestedTarget } from "../../domain/adjustmentSuggestion.js";
import { feedbackTagText, readFeedbackTag } from "../../domain/feedbackTags.js";
import { DECIMAL_PATTERN, parseDecimal } from "../../domain/repsAndLoad.js";
import { renderMarkupOnce } from "../common/dom.js";
import { mountExercisePicker, pickerLabels } from "../exercises/exercisePicker.js";

/**
 * Renders the pending plan adjustments alert cards.
 * @param {HTMLElement} container - The list container element.
 * @param {HTMLElement} countBadge - The notification badge showing adjustment count.
 * @param {Object} ctx - Context holding state, translation, and navigation helpers.
 */
export function renderAdjustmentsViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-adjustments"),
    `
<section id="view-adjustments" class="app-view">
      <div class="view-header view-titlebar">
        <button class="view-grabber" type="button" data-i18n-label="view_grabber_home" aria-label="Return to home"></button>
        <h2 id="pending-adjustments-title"><i class="fa-solid fa-bell-concierge text-emerald mr-1"></i> Pending Review</h2>
        <span class="badge adjustment-count-badge" id="badge-adjustments-count">0</span>
      </div>
      <div id="dashboard-adjustments-list" class="stack-list mb-6">
        <!-- Injected via JS - cards with feedback tags to update programs -->
      </div>
    </section>
`,
  );
}

const BADGE_CLASS = {
  joint_pain: "badge-danger",
  too_hard: "badge-warning",
  too_easy: "badge-success",
  progression: "badge-success",
};

function resolveAdjustmentBadgeClass(tag) {
  return BADGE_CLASS[readFeedbackTag(tag).known?.id] || "badge-primary";
}

function buildAdjustmentCard(u, ctx) {
  const { state, t, escapeHTML, navigateToPath, urlFor } = ctx;

  const card = document.createElement("div");
  card.className = "adjustment-card card glassmorphic";

  const info = document.createElement("div");
  info.className = "adjustment-card-info";
  const badgeClass = resolveAdjustmentBadgeClass(u.tag);
  info.innerHTML = `
      <div class="adjustment-card-row">
        <strong class="adjustment-client-name">${escapeHTML(u.clientName)}</strong>
        <span class="badge ${badgeClass} adjustment-tag-badge">${escapeHTML(feedbackTagText(u.tag, t))}</span>
      </div>
      <div class="adjustment-exercise-line">
        ${t("exercise_of")}: <span class="font-semibold adjustment-exercise-name">${escapeHTML(u.exerciseName)}</span>
      </div>
    `;

  // Icon-only actions (matching the clipboard's own compact .icon-btn edit control) — a card
  // per unresolved alert already carries client name + tag + exercise, so labelled buttons here
  // were pure repetition; the icon + tooltip says enough.
  const actions = document.createElement("div");
  actions.className = "adjustment-card-actions";

  // The pencil opens the routine that holds this exercise, so it is shown only when one does. A
  // session built on the floor from an empty plan belongs to no routine, and the pencil then did
  // nothing when pressed.
  const exercise = libraryExercises(state).find((e) => e.name === u.exerciseName);
  const routine = exercise
    ? state.routines.find((r) => r.exercises.some((ex) => ex.id === exercise.id))
    : null;
  if (routine) {
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn btn-edit-plan-alert";
    editBtn.title = t("edit_plan");
    editBtn.setAttribute("aria-label", t("edit_plan"));
    editBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>`;
    editBtn.addEventListener("click", () => {
      navigateToPath(urlFor("routine.edit", { routineId: routine.id }));
    });
    actions.appendChild(editBtn);
  }

  const resolveBtn = document.createElement("button");
  resolveBtn.type = "button";
  resolveBtn.className = "icon-btn btn-resolve-alert";
  resolveBtn.title = t("btn_resolve");
  resolveBtn.setAttribute("aria-label", t("btn_resolve"));
  resolveBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
  // The wizard is a route (`/adjustments/{updateId}`), so Back backs out of it and a link opens
  // the one alert being resolved.
  resolveBtn.addEventListener("click", () => {
    navigateToPath(urlFor("adjustment.apply", { updateId: u.id }));
  });

  actions.appendChild(resolveBtn);

  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

export function renderPendingPlanAdjustmentsComponent(container, countBadge, ctx) {
  const { state, t, escapeHTML, navigateToPath, urlFor } = ctx;

  if (!container) return;
  container.innerHTML = "";

  const unresolved = (state.planUpdates || []).filter((u) => !u.resolved);

  if (countBadge) {
    countBadge.textContent = unresolved.length;
    countBadge.classList.toggle("hidden", unresolved.length === 0);
  }

  if (unresolved.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted adjustments-empty-state">${t("no_pending_adjustments")}</div>`;
    return;
  }

  for (const u of unresolved) {
    container.appendChild(buildAdjustmentCard(u, ctx));
  }
}

/**
 * Opens and initializes the Apply Plan Adjustment interactive dialog form.
 * @param {string} updateId - The adjustment update model's unique ID.
 * @param {Object} ctx - Context holding state, translation, and UI refresh callbacks.
 */
export function renderApplyAdjustmentDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-apply-adjustment"),
    `
<dialog id="dialog-apply-adjustment" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 data-i18n="adjust_title">Apply Program Adjustment</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close adjustment modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-apply-adjustment" method="dialog" class="modal-form">
      <input type="hidden" id="adjust-update-id">
      <input type="hidden" id="adjust-client-id">
      <input type="hidden" id="adjust-routine-id">
      <input type="hidden" id="adjust-exercise-id">
      
      <div class="form-group adjust-summary-panel">
        <div class="adjust-summary-row">
          <strong class="adjust-summary-label" data-i18n="adjust_client">Client:</strong> <span id="adjust-client-name" class="font-semibold text-emerald"></span>
        </div>
        <div class="adjust-summary-row">
          <strong class="adjust-summary-label" data-i18n="adjust_feedback">Feedback:</strong> <span id="adjust-feedback-tag" class="font-semibold text-primary"></span>
        </div>
        <div class="adjust-summary-row-last">
          <strong class="adjust-summary-label" data-i18n="adjust_details">Details:</strong> <span id="adjust-details" class="italic text-color"></span>
        </div>
      </div>

      <div class="form-group">
        <label for="adjust-action-type" data-i18n="adjust_action_label">Adjustment Action</label>
        <select id="adjust-action-type" class="form-control adjust-action-type-select">
          <option value="modify" data-i18n="adjust_action_modify">Modify Target Load & Reps</option>
          <option value="swap" data-i18n="adjust_action_swap">Swap Exercise (Regression/Progression)</option>
          <option value="dismiss" data-i18n="adjust_action_dismiss">Dismiss Alert Only (No Changes)</option>
        </select>
      </div>

      <!-- PANEL: Modify load & reps -->
      <div id="adjust-panel-modify" class="adjust-action-panel">
        <div class="adjust-modify-grid">
          <div class="form-group">
            <label for="adjust-weight" data-i18n="adjust_target_weight">Target Weight (kg)</label>
            <input type="text" inputmode="decimal" pattern="${DECIMAL_PATTERN}" id="adjust-weight" class="form-control">
          </div>
          <div class="form-group">
            <label for="adjust-reps" data-i18n="adjust_target_reps">Target Reps</label>
            <input type="text" id="adjust-reps" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label for="adjust-sets" data-i18n="adjust_target_sets">Target Sets Count</label>
          <input type="number" id="adjust-sets" class="form-control">
        </div>
      </div>

      <!-- PANEL: Swap exercise -->
      <div id="adjust-panel-swap" class="adjust-action-panel hidden">
        <div class="form-group">
          <label><span data-i18n="adjust_replacement">Replacement Exercise</span> <span class="swap-hint text-muted" data-i18n="adjust_replacement_hint">— same muscle group keeps volume tracking intact</span></label>
          <input type="hidden" id="adjust-exercise-swap">
          <div id="adjust-swap-picker" class="exercise-picker"></div>
        </div>
      </div>

      <div class="modal-actions adjust-modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel" data-i18n="btn_cancel">Cancel</button>
        <button type="submit" class="btn primary-btn" data-i18n="adjust_apply">Apply & Resolve</button>
      </div>
    </form>
  </dialog>
`,
  );
}

// Find target exercise & routine database links.
function resolveAdjustmentTargets(state, update) {
  const exercise = libraryExercises(state).find((e) => e.name === update.exerciseName);
  const exerciseId = exercise ? exercise.id : "";
  const routine = state.routines.find((r) => r.exercises.some((ex) => ex.id === exerciseId));
  const exMapping = routine ? routine.exercises.find((ex) => ex.id === exerciseId) : null;
  return { exercise, exerciseId, routine, exMapping };
}

// Pre-fill the target the trainer can still override (domain/adjustmentSuggestion.js decides it).
function prefillAdjustmentFields(exMapping, update, state) {
  const target = suggestedTarget({
    routineEntry: exMapping,
    performed: performedTarget(state.history, update),
    tagId: readFeedbackTag(update.tag).known?.id,
  });
  document.getElementById("adjust-weight").value = target.weight;
  document.getElementById("adjust-reps").value = target.reps;
  document.getElementById("adjust-sets").value = target.sets;
}

// Cancel / close buttons (close-btn sits outside the form, so clone it to avoid stacking
// listeners across repeat opens; the in-form cancel button is refreshed separately via the form
// clone in openAdjustmentWizardComponent).
function wireDialogCloseButtons(dialog) {
  for (const btn of dialog.querySelectorAll(".modal-cancel, .modal-close-btn")) {
    btn.replaceWith(btn.cloneNode(true));
  }
  for (const btn of dialog.querySelectorAll(".modal-cancel, .modal-close-btn")) {
    btn.addEventListener("click", () => dialog.close());
  }
}

export function openAdjustmentWizardComponent(updateId, ctx) {
  renderApplyAdjustmentDialog();
  const {
    state,
    t,
    escapeHTML,
    saveToLocalStorage,
    renderRoutinesList,
    renderPendingPlanAdjustments,
  } = ctx;

  const update = state.planUpdates.find((u) => u.id === updateId);
  if (!update) return;

  const dialog = document.getElementById("dialog-apply-adjustment");
  if (!dialog) return;

  // Set inputs
  document.getElementById("adjust-update-id").value = updateId;
  document.getElementById("adjust-client-id").value = update.clientId;

  // Set text labels
  document.getElementById("adjust-client-name").textContent = update.clientName;
  // The tag in the trainer's language, and the note they typed after it, if any.
  const { known, note } = readFeedbackTag(update.tag);
  document.getElementById("adjust-feedback-tag").textContent = feedbackTagText(update.tag, t);
  document.getElementById("adjust-details").textContent = known
    ? note || t("no_details_specified")
    : update.tag;

  const { exercise, exerciseId, routine, exMapping } = resolveAdjustmentTargets(state, update);

  document.getElementById("adjust-routine-id").value = routine ? routine.id : "";
  document.getElementById("adjust-exercise-id").value = exerciseId;

  // Default panel action setup
  document.getElementById("adjust-action-type").value = "modify";
  document.getElementById("adjust-panel-modify").classList.remove("hidden");
  document.getElementById("adjust-panel-swap").classList.add("hidden");

  prefillAdjustmentFields(exMapping, update, state);

  // Reset all stale listeners in one shot by cloning the form, THEN wire every interactive
  // element against the fresh DOM. (The action select, cancel button, and swap picker all live
  // inside the form, so any listener attached before this clone would be silently dropped.)
  const form = document.getElementById("form-apply-adjustment");
  form.replaceWith(form.cloneNode(true));
  const newForm = document.getElementById("form-apply-adjustment");

  // Action select toggles which panel is shown.
  const actionTypeSelect = document.getElementById("adjust-action-type");
  actionTypeSelect.addEventListener("change", () => {
    const action = actionTypeSelect.value;
    if (action === "modify") {
      document.getElementById("adjust-panel-modify").classList.remove("hidden");
      document.getElementById("adjust-panel-swap").classList.add("hidden");
    } else if (action === "swap") {
      document.getElementById("adjust-panel-modify").classList.add("hidden");
      document.getElementById("adjust-panel-swap").classList.remove("hidden");
    } else {
      document.getElementById("adjust-panel-modify").classList.add("hidden");
      document.getElementById("adjust-panel-swap").classList.add("hidden");
    }
  });

  wireDialogCloseButtons(dialog);

  // Swap picker — pre-filtered to the same muscle group so the replacement inherits the correct
  // volume bucket. The chosen id lands in the hidden #adjust-exercise-swap.
  const swapSelect = document.getElementById("adjust-exercise-swap");
  swapSelect.value = "";
  mountExercisePicker(document.getElementById("adjust-swap-picker"), {
    state,
    excludeId: exerciseId,
    defaultCategory: exercise ? exercise.category : "All",
    autoSelectFirst: true,
    keepSelection: true,
    ...pickerLabels(t),
    onSelect: (ex) => {
      swapSelect.value = ex ? ex.id : "";
    },
  });

  newForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const action = actionTypeSelect.value;
    const rId = document.getElementById("adjust-routine-id").value;
    const exId = document.getElementById("adjust-exercise-id").value;

    const targetRoutine = state.routines.find((r) => r.id === rId);

    if (action === "modify" && targetRoutine) {
      const targetEx = targetRoutine.exercises.find((ex) => ex.id === exId);
      if (targetEx) {
        targetEx.weight = parseDecimal(document.getElementById("adjust-weight").value) || 0;
        targetEx.reps = document.getElementById("adjust-reps").value;
        targetEx.sets = parseInt(document.getElementById("adjust-sets").value) || 3;
      }
    } else if (action === "swap" && targetRoutine) {
      const idx = targetRoutine.exercises.findIndex((ex) => ex.id === exId);
      if (idx !== -1) {
        const swapExId = swapSelect.value;
        targetRoutine.exercises[idx].id = swapExId;
      }
    }

    // Resolve alert
    const updateIdx = state.planUpdates.findIndex((u) => u.id === updateId);
    if (updateIdx !== -1) {
      state.planUpdates[updateIdx].resolved = true;
    }

    saveToLocalStorage();
    renderPendingPlanAdjustments();
    renderRoutinesList();
    dialog.close();
  });

  dialog.showModal();
}
