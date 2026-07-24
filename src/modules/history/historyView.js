// src/views/historyView.js - Domain module for global and client workout history logs
import { openSessionFromHistory } from "../../controllers/activeSessionController.js";
import { formatDuration, formatMetricValue, usesLoad } from "../common/exerciseModality.js";
import { formatLoad, formatReps } from "../common/repsAndLoad.js";
import { isRestRecord, isSkippedRecord } from "../common/sessionItemRecord.js";
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

    // One logged exercise row — greyed with a "skipped" badge when the movement was prescribed but
    // not performed (completed:false); legacy rows have no flag and render as completed.
    const renderExerciseRow = (ex) => {
      const metric = ex.metric || "reps";
      const modality = ex.modality || "strength";
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      const skipped = isSkippedRecord(ex);
      const setsText = skipped
        ? t("skipped")
        : sets
            .map((s) => {
              const note = s.note ? ` (${s.note})` : ""; // setsText is escapeHTML'd whole at insertion
              // Load-bearing modalities (strength, isometric) show "load×value" (e.g. "60×6",
              // "20kg×0:45"); cardio/holds/agility show the bare metric magnitude.
              const primary =
                metric === "reps" ? formatReps(s.reps) : formatMetricValue(s.reps, metric);
              const load = usesLoad(modality) ? formatLoad(s.weight, ex.loadUnit) : "";
              return `${load ? `${load}×` : ""}${primary}${note}`;
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

      const setNotes = sets.filter((s) => s.note);
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
    // items sharing a circuitId are wrapped in a superset group. Legacy flat rows (no rests/circuits)
    // fall through as a plain list.
    let exercisesLogHTML = "";
    let openCircuit = null;
    const closeCircuit = () => {
      if (openCircuit !== null) {
        exercisesLogHTML += "</div>";
        openCircuit = null;
      }
    };
    for (const item of log.exercises) {
      const cid = item.circuitId || null;
      if (cid !== openCircuit) {
        closeCircuit();
        if (cid) {
          const title = item.circuitTitle || t("superset") || "Superset";
          exercisesLogHTML += `<div class="history-superset"><div class="history-superset-title"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(title)}</div>`;
          openCircuit = cid;
        }
      }
      if (isRestRecord(item)) {
        exercisesLogHTML += `<div class="history-rest-row"><i class="fa-solid fa-hourglass-half"></i> ${t("rest_label")} · ${formatDuration(item.rest)}</div>`;
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
