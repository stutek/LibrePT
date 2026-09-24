// src/modules/plans/planAdjustments.js
// Logic for displaying the pending plan adjustments widget on the dashboard,
// as well as launching and submitting the interactive Apply Plan Adjustment Dialog wizard.
import { libraryExercises } from "../../data/exerciseLibrary.js";
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

function resolveAdjustmentBadgeClass(tag) {
  if (tag.includes("Pain") || tag.includes("Discomfort")) return "badge-danger";
  if (tag.includes("Hard")) return "badge-warning";
  if (tag.includes("Easy") || tag.includes("Progression")) return "badge-success";
  return "badge-primary";
}

function buildVoiceNoteHTML(u) {
  if (!u.hasVoiceNote) return "";
  return `
        <div class="mini-audio-note">
          <button type="button" class="btn-play-adjustment-audio" data-id="${u.id}"><i class="fa-solid fa-circle-play adjustment-audio-play-icon"></i></button>
          <span class="audio-status-label">voice_memo.wav (0:04)</span>
        </div>
      `;
}

// Toggles the mini play/pause icon on the voice-memo preview — a fixed 3s "playing" state, no real
// audio (there is no recorded file to play back yet; TODO tracks wiring a real one).
function wireAdjustmentAudioPreview(card, t) {
  const playBtn = card.querySelector(".btn-play-adjustment-audio");
  const audioStatus = card.querySelector(".audio-status-label");
  if (!playBtn || !audioStatus) return;
  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const playIcon = playBtn.querySelector("i");
    if (!playIcon.classList.contains("fa-circle-play")) {
      playIcon.className = "fa-solid fa-circle-play";
      audioStatus.textContent = "voice_memo.wav (0:04)";
      return;
    }
    playIcon.className = "fa-solid fa-circle-pause";
    audioStatus.textContent = t("voice_playing");
    setTimeout(() => {
      playIcon.className = "fa-solid fa-circle-play";
      audioStatus.textContent = "voice_memo.wav (0:04)";
    }, 3000);
  });
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
        <span class="badge ${badgeClass} adjustment-tag-badge">${escapeHTML(u.tag)}</span>
      </div>
      <div class="adjustment-exercise-line">
        ${t("exercise_of")}: <span class="font-semibold adjustment-exercise-name">${escapeHTML(u.exerciseName)}</span>
      </div>
      ${buildVoiceNoteHTML(u)}
    `;

  // Icon-only actions (matching the clipboard's own compact .icon-btn edit control) — a card
  // per unresolved alert already carries client name + tag + exercise, so labelled buttons here
  // were pure repetition; the icon + tooltip says enough.
  const actions = document.createElement("div");
  actions.className = "adjustment-card-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn btn-edit-plan-alert";
  editBtn.title = t("edit_plan");
  editBtn.setAttribute("aria-label", t("edit_plan"));
  editBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>`;
  editBtn.addEventListener("click", () => {
    const exercise = libraryExercises(state).find((e) => e.name === u.exerciseName);
    const routine = exercise
      ? state.routines.find((r) => r.exercises.some((ex) => ex.id === exercise.id))
      : null;
    if (routine) navigateToPath(urlFor("routine.edit", { routineId: routine.id }));
  });

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

  actions.appendChild(editBtn);
  actions.appendChild(resolveBtn);

  card.appendChild(info);
  card.appendChild(actions);

  wireAdjustmentAudioPreview(card, t);

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
        <div id="adjust-voice-player-container" class="hidden adjust-voice-row">
          <strong class="adjust-voice-label" data-i18n="adjust_voice">Voice:</strong>
          <button type="button" id="adjust-btn-play-voice" class="adjust-voice-play-btn"><i class="fa-solid fa-circle-play adjust-voice-play-icon"></i></button>
          <span class="adjust-voice-duration-label">voice_memo.wav (0:04)</span>
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
            <input type="number" step="0.5" id="adjust-weight" class="form-control">
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

// A feedback tag can carry a free-text detail after " - " (e.g. "Too Hard - knee twinge on rep 4");
// when it does, the short tag and the detail are shown separately.
function parseAdjustmentNote(tag) {
  if (!tag.includes(" - ")) return { label: tag, detail: tag };
  const parts = tag.split(" - ");
  return { label: parts[0], detail: parts.slice(1).join(" - ") };
}

function wireVoiceNotePreview(update, voiceContainer) {
  if (!update.hasVoiceNote) {
    voiceContainer.classList.add("hidden");
    return;
  }
  voiceContainer.classList.remove("hidden");
  const playBtn = document.getElementById("adjust-btn-play-voice");
  // reset listener
  playBtn.replaceWith(playBtn.cloneNode(true));
  const newPlayBtn = document.getElementById("adjust-btn-play-voice");
  newPlayBtn.addEventListener("click", () => {
    const icon = newPlayBtn.querySelector("i");
    if (!icon.classList.contains("fa-circle-play")) {
      icon.className = "fa-solid fa-circle-play";
      return;
    }
    icon.className = "fa-solid fa-circle-pause";
    setTimeout(() => {
      icon.className = "fa-solid fa-circle-play";
    }, 3000);
  });
}

// Find target exercise & routine database links.
function resolveAdjustmentTargets(state, update) {
  const exercise = libraryExercises(state).find((e) => e.name === update.exerciseName);
  const exerciseId = exercise ? exercise.id : "";
  const routine = state.routines.find((r) => r.exercises.some((ex) => ex.id === exerciseId));
  const exMapping = routine ? routine.exercises.find((ex) => ex.id === exerciseId) : null;
  return { exercise, exerciseId, routine, exMapping };
}

// Pre-fill parameters, with a smart load offset recommendation: +2.5kg if the tag is "Too Easy",
// -2.5kg (floored at 0) if "Too Hard" — a starting suggestion the trainer can still override.
function prefillAdjustmentFields(exMapping, tag) {
  document.getElementById("adjust-weight").value = exMapping ? exMapping.weight : 0;
  document.getElementById("adjust-reps").value = exMapping ? exMapping.reps : 10;
  document.getElementById("adjust-sets").value = exMapping ? exMapping.sets : 3;

  if (tag.includes("Easy")) {
    document.getElementById("adjust-weight").value = exMapping ? exMapping.weight + 2.5 : 2.5;
  } else if (tag.includes("Hard")) {
    document.getElementById("adjust-weight").value = exMapping
      ? Math.max(0, exMapping.weight - 2.5)
      : 0;
  }
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
  document.getElementById("adjust-feedback-tag").textContent = update.tag;

  // Parse note details for display
  const { label, detail } = parseAdjustmentNote(update.tag);
  document.getElementById("adjust-feedback-tag").textContent = label;
  document.getElementById("adjust-details").textContent = detail;

  wireVoiceNotePreview(update, document.getElementById("adjust-voice-player-container"));

  const { exercise, exerciseId, routine, exMapping } = resolveAdjustmentTargets(state, update);

  document.getElementById("adjust-routine-id").value = routine ? routine.id : "";
  document.getElementById("adjust-exercise-id").value = exerciseId;

  // Default panel action setup
  document.getElementById("adjust-action-type").value = "modify";
  document.getElementById("adjust-panel-modify").classList.remove("hidden");
  document.getElementById("adjust-panel-swap").classList.add("hidden");

  prefillAdjustmentFields(exMapping, update.tag);

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
  // volume bucket (TODO §13.2 Scenario B). The chosen id lands in the hidden #adjust-exercise-swap.
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
        targetEx.weight = parseFloat(document.getElementById("adjust-weight").value) || 0;
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
