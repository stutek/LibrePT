// src/views/historyView.js - Domain module for global and client workout history logs
import { openSessionFromHistory } from "../../controllers/activeSessionController.js";
import { formatMetricValue } from "../common/exerciseModality.js";
import { formatLoad, formatReps } from "../common/repsAndLoad.js";
import { escapeHTML, formatDateStr } from "../common/utils.js";

export function renderGlobalHistory({ state, t }) {
  const container = document.getElementById("global-history-list");
  if (!container) return;
  container.innerHTML = "";

  const sorted = [...state.history].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">${t("no_workouts_history")}</div>`;
    return;
  }

  renderHistoryItems({ historyList: sorted, container, t });
}

export function renderHistoryItems({ historyList, container, t }) {
  const fragment = document.createDocumentFragment();
  for (const log of historyList) {
    const card = document.createElement("div");
    card.className = "history-card card glassmorphic";

    const minutes = Math.floor(log.duration / 60);
    const durationText = minutes > 0 ? `${minutes} ${t("min_session")}` : t("less_than_minute");

    let exercisesLogHTML = "";
    for (const ex of log.exercises) {
      const metric = ex.metric || "reps";
      const setsText = ex.sets
        .map((s) => {
          const note = s.note ? ` (${s.note})` : ""; // setsText is escapeHTML'd whole at insertion
          // Cardio/holds logged one magnitude per set (time/distance/cal/watts/hold); strength keeps
          // its "load×reps" form.
          if (metric !== "reps") return `${formatMetricValue(s.reps, metric)}${note}`;
          const load = formatLoad(s.weight, ex.loadUnit);
          return `${load ? `${load}×` : ""}${formatReps(s.reps)}${note}`;
        })
        .join(", ");

      const feedbackItems = (log.feedback || []).filter((f) => f.exerciseName === ex.name);
      let feedbackIconsHTML = "";

      for (const f of feedbackItems) {
        let iconClass = "fa-solid fa-comment-dots text-primary";
        const title = f.tag;

        if (f.tag.includes("Too Easy") || f.tag.includes("Increase Load")) {
          iconClass = "fa-solid fa-rocket text-success";
        } else if (f.tag.includes("Too Hard") || f.tag.includes("Reduce Load")) {
          iconClass = "fa-solid fa-triangle-exclamation text-warning";
        } else if (
          f.tag.includes("Form Break") ||
          f.tag.includes("Focus") ||
          f.tag.includes("Form")
        ) {
          iconClass = "fa-solid fa-microscope text-warning";
        } else if (f.tag.includes("Pain") || f.tag.includes("Discomfort")) {
          iconClass = "fa-solid fa-fire text-danger";
        } else if (
          f.tag.includes("easily") ||
          f.tag.includes("Progression") ||
          f.tag.includes("Completed reps")
        ) {
          iconClass = "fa-solid fa-dumbbell text-success";
        }

        const tooltipTitle = title;
        const tooltipBody = f.note ? escapeHTML(f.note) : t("no_details_specified");

        feedbackIconsHTML += `
          <span class="history-feedback-icon">
            <i class="${iconClass}"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${escapeHTML(tooltipTitle)}</div>
              <div class="tooltip-body">${tooltipBody}</div>
            </span>
          </span>
        `;
      }

      const setNotes = ex.sets.filter((s) => s.note);
      if (setNotes.length > 0) {
        const notesListHTML = setNotes
          .map(
            (s, idx) =>
              `<div><strong>${t("set_label")} ${idx + 1}:</strong> ${escapeHTML(s.note)}</div>`,
          )
          .join("");
        feedbackIconsHTML += `
          <span class="history-feedback-icon">
            <i class="fa-solid fa-sticky-note text-primary"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${t("trainer_set_notes")}</div>
              <div class="tooltip-body">${notesListHTML}</div>
            </span>
          </span>
        `;
      }

      exercisesLogHTML += `
        <div class="history-ex-row" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px; margin-bottom: 6px;">
          <div>
            <strong>${escapeHTML(ex.name)}</strong>: <span>${escapeHTML(setsText)}</span>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            ${feedbackIconsHTML}
          </div>
        </div>
      `;
    }

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
