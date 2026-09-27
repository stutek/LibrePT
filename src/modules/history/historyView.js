// src/modules/history/historyView.js — how a client's completed sessions are drawn on their page.
//
// History is shown in one place: a client's page (clientsView.js calls renderHistoryItems). The view
// that listed every client's sessions together was removed — a trainer reads one person's history,
// not everyone's.
import { orderedItems } from "../../data/sessionItemOrder.js";
import {
  formatCompactDuration,
  formatMetricValue,
  usesLoad,
} from "../../domain/exerciseModality.js";
import { feedbackTagText, readFeedbackTag } from "../../domain/feedbackTags.js";
import { formatLoad, formatReps } from "../../domain/repsAndLoad.js";
import { isRestRecord, isSkippedRecord } from "../../domain/sessionItemRecord.js";
import { escapeHTML, formatDateStr } from "../common/utils.js";

const FEEDBACK_ICON_CLASS = {
  too_easy: "fa-solid fa-rocket text-success",
  too_hard: "fa-solid fa-triangle-exclamation text-warning",
  form_break: "fa-solid fa-microscope text-warning",
  joint_pain: "fa-solid fa-fire text-danger",
  progression: "fa-solid fa-dumbbell text-success",
};

// Read from the stored tag's key, never from its English words.
function resolveFeedbackIconClass(tag) {
  return (
    FEEDBACK_ICON_CLASS[readFeedbackTag(tag).known?.id] || "fa-solid fa-comment-dots text-primary"
  );
}

function buildFeedbackIconsHTML(log, ex, t) {
  const feedbackItems = (log.feedback || []).filter((f) => f.exerciseName === ex.name);
  let html = "";
  for (const f of feedbackItems) {
    const tooltipBody = f.note ? escapeHTML(f.note) : t("no_details_specified");
    html += `
          <span class="history-feedback-icon">
            <i class="${resolveFeedbackIconClass(f.tag)}"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${escapeHTML(feedbackTagText(f.tag, t))}</div>
              <div class="tooltip-body">${tooltipBody}</div>
            </span>
          </span>
        `;
  }

  const setNotes = (Array.isArray(ex.sets) ? ex.sets : []).filter((s) => s.note);
  if (setNotes.length === 0) return html;
  const notesListHTML = setNotes
    .map(
      (s, idx) => `<div><strong>${t("set_label")} ${idx + 1}:</strong> ${escapeHTML(s.note)}</div>`,
    )
    .join("");
  return `${html}
        <span class="history-feedback-icon">
            <i class="fa-solid fa-sticky-note text-primary"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${t("trainer_set_notes")}</div>
              <div class="tooltip-body">${notesListHTML}</div>
            </span>
          </span>
        `;
}

// Load-bearing modalities (strength, isometric) show "load×value" (e.g. "60×6", "20kg×0:45");
// cardio/holds/agility show the bare metric magnitude.
function buildExerciseSetsText(ex, metric, modality, skipped, t) {
  if (skipped) return t("skipped");
  const sets = Array.isArray(ex.sets) ? ex.sets : [];
  return sets
    .map((s) => {
      const note = s.note ? ` (${s.note})` : ""; // setsText is escapeHTML'd whole at insertion
      const primary = metric === "reps" ? formatReps(s.reps) : formatMetricValue(s.reps, metric);
      const load = usesLoad(modality) ? formatLoad(s.weight, ex.loadUnit) : "";
      return `${load ? `${load}×` : ""}${primary}${note}`;
    })
    .join(", ");
}

// `openSessionFromHistory` arrives as a parameter rather than an import: it lives in
// activeSessionController, and a view importing its own controller inverts the layering the app is
// built on (controllers orchestrate views, not the reverse) — gated by
// agent_tools/import_layers.py. Injected, this file stays independently mountable.
export function renderHistoryItems({ historyList, container, t, openSessionFromHistory }) {
  const fragment = document.createDocumentFragment();
  for (const log of historyList) {
    const card = document.createElement("div");
    card.className = "history-card card glassmorphic";

    const minutes = Math.floor(log.duration / 60);
    const durationText = minutes > 0 ? `${minutes} ${t("min_session")}` : t("less_than_minute");

    // One logged exercise row — greyed with a "skipped" badge when the movement was prescribed but
    // not performed (completed:false); legacy rows have no flag and render as completed.
    const renderExerciseRow = (ex) => {
      const metric = ex.metric || "reps";
      const modality = ex.modality || "strength";
      const skipped = isSkippedRecord(ex);
      const setsText = buildExerciseSetsText(ex, metric, modality, skipped, t);
      const feedbackIconsHTML = buildFeedbackIconsHTML(log, ex, t);
      const skipBadge = skipped ? `<span class="history-skip-badge">${t("skipped")}</span>` : "";
      return `
        <div class="history-ex-row${skipped ? " history-ex-skipped" : ""}">
          <div>
            <strong>${escapeHTML(ex.name)}</strong>: <span>${escapeHTML(setsText)}</span>${skipBadge}
          </div>
          <div class="history-ex-icons">
            ${feedbackIconsHTML}
          </div>
        </div>
      `;
    };

    // Walk the stored program: exercises render as rows, first-class rests as chips, and consecutive
    // items sharing a circuitId are wrapped in a circuit group. Legacy flat rows (no rests/circuits)
    // fall through as a plain list.
    let exercisesLogHTML = "";
    let openCircuit = null;
    const closeCircuit = () => {
      if (openCircuit !== null) {
        exercisesLogHTML += "</div>";
        openCircuit = null;
      }
    };
    // A restored or hand-edited backup can carry a log with no exercises — render the header
    // rather than throwing partway through the list.
    for (const item of orderedItems(log.exercises)) {
      const cid = item.circuitId || null;
      if (cid !== openCircuit) {
        closeCircuit();
        if (cid) {
          const title = item.circuitTitle || t("circuit") || "Circuit";
          exercisesLogHTML += `<div class="history-circuit"><div class="history-circuit-title"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(title)}</div>`;
          openCircuit = cid;
        }
      }
      if (isRestRecord(item)) {
        exercisesLogHTML += `<div class="history-rest-row"><i class="fa-solid fa-hourglass-half"></i> ${t("rest_label")} · ${formatCompactDuration(item.rest)}</div>`;
        continue;
      }
      exercisesLogHTML += renderExerciseRow(item);
    }
    closeCircuit();

    card.innerHTML = `
      <div class="history-card-header">
        <div class="history-header-meta">
          <h4>${escapeHTML(log.clientName)}</h4>
          <p>${escapeHTML(log.routineName)}${log.isPlanning ? "" : ` • ${durationText}`}</p>
        </div>
        <div class="history-date">${log.isPlanning ? t("planned_program") || "Planned Program" : formatDateStr(log.date)}</div>
      </div>
      <div class="history-exercise-log">
        ${exercisesLogHTML}
      </div>
    `;

    card.addEventListener("click", () => {
      openSessionFromHistory(log);
    });

    // Tap a feedback/notes icon to toggle its tooltip; stop the tap from also opening the
    // session (the card's own click). Replaces inline onclick= so CSP can forbid inline script.
    for (const icon of card.querySelectorAll(".history-feedback-icon")) {
      icon.addEventListener("click", (e) => {
        e.stopPropagation();
        icon.classList.toggle("active");
      });
    }

    fragment.appendChild(card);
  }
  container.appendChild(fragment);
}
