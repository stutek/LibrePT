// src/modules/plans/planAdjustments.js
// The Pending Review list: one card per signal the next plan waits for, with what the trainer
// noted, the exercise and the client.
//
// An adjustment is an exercise note the next plan waits for (data/trainingRecords.js pendingNotes).
// Its tag and remark are shown as one line, `noteTagLine`, the form the feedback form has always
// stored and these screens have always shown.
//
// **The app sets no training targets** (ruled 2026-10-03, Simon): a card shows the signal and is
// resolved; it changes no plan. An "Apply Program Adjustment" dialog used to propose a load from the
// last session and write it, or a swapped exercise, into the routine — and wrote nothing at all for a
// session built without one. The trainer is the expert and sets an exercise's parameters when
// building the plan; the pencil opens the routine that holds the exercise for that.
import { libraryExercises } from "../../data/exerciseLibrary.js";
import { noteTagLine, pendingNotes } from "../../data/trainingRecords.js";
import { feedbackTagText, readFeedbackTag } from "../../domain/feedbackTags.js";
import { renderMarkupOnce } from "../common/dom.js";

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
        <!-- Injected via JS - one card per signal waiting for review -->
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

// The client's name as the client list holds it now.
function clientNameOf(state, clientId) {
  return (state.clients || []).find((client) => client.id === clientId)?.name;
}

function buildAdjustmentCard(u, ctx) {
  const { state, t, escapeHTML, navigateToPath, urlFor, onResolve } = ctx;

  const card = document.createElement("div");
  card.className = "adjustment-card card glassmorphic";

  const info = document.createElement("div");
  info.className = "adjustment-card-info";
  const tagLine = noteTagLine(u);
  const badgeClass = resolveAdjustmentBadgeClass(tagLine);
  // What the trainer typed with the signal, on the card itself: it was shown only in the dialog
  // that resolving opened, which is gone.
  const { known, note } = readFeedbackTag(tagLine);
  const remark = known ? note : "";
  info.innerHTML = `
      <div class="adjustment-card-row">
        <strong class="adjustment-client-name">${escapeHTML(clientNameOf(state, u.clientId))}</strong>
        <span class="badge ${badgeClass} adjustment-tag-badge">${escapeHTML(feedbackTagText(tagLine, t))}</span>
      </div>
      <div class="adjustment-exercise-line">
        ${t("exercise_of")}: <span class="font-semibold adjustment-exercise-name">${escapeHTML(u.exerciseName)}</span>
      </div>
      ${remark ? `<p class="adjustment-remark">${escapeHTML(remark)}</p>` : ""}
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

  // One tap: the trainer has read the signal and dealt with it in the plan, or decided it needs
  // nothing. The note stays stored, marked resolved.
  const resolveBtn = document.createElement("button");
  resolveBtn.type = "button";
  resolveBtn.className = "icon-btn btn-resolve-alert";
  resolveBtn.title = t("btn_resolve");
  resolveBtn.setAttribute("aria-label", t("btn_resolve"));
  resolveBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
  resolveBtn.addEventListener("click", () => onResolve?.(u.id));

  actions.appendChild(resolveBtn);

  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

/**
 * Renders the Pending Review cards.
 * @param {HTMLElement} container - The list container element.
 * @param {HTMLElement} countBadge - The badge showing how many signals wait.
 * @param {Object} ctx - state, t, escapeHTML, navigateToPath, urlFor, and `onResolve(noteId)`.
 */
export function renderPendingPlanAdjustmentsComponent(container, countBadge, ctx) {
  const { state, t } = ctx;

  if (!container) return;
  container.innerHTML = "";

  const unresolved = pendingNotes(state);

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
