// src/modules/history/historyView.js — how a client's completed sessions are drawn on their page.
//
// History is shown in one place: a client's page (clientsView.js calls renderHistoryItems). The view
// that listed every client's sessions together was removed — a trainer reads one person's history,
// not everyone's.
//
// It draws programs and their exercise notes as data/trainingRecords.js reads them; where they are
// stored is that module's business.
import { orderedItems } from "../../data/sessionItemOrder.js";
import { textOfTag } from "../../data/sessionModelConversion.js";
import { programDate, programNameIn } from "../../data/trainingRecords.js";
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

// `notes` are the program's own exercise notes.
function buildFeedbackIconsHTML(notes, ex, t) {
  let html = "";
  for (const note of notes.filter((entry) => entry.exerciseName === ex.name)) {
    const tooltipBody = note.text ? escapeHTML(note.text) : t("no_details_specified");
    // The note stores the tag's id; these readers take its English text.
    const tagText = textOfTag(note.tag);
    html += `
          <span class="history-feedback-icon">
            <i class="${resolveFeedbackIconClass(tagText)}"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${escapeHTML(feedbackTagText(tagText, t))}</div>
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
function buildExerciseSetsText(ex, metric, modality) {
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

function addSaveAsRoutineButton({ card, program, t, saveAsRoutine }) {
  if (!saveAsRoutine || program.status === "planned") return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn secondary-btn btn-sm history-save-routine";
  button.textContent = t("history_save_as_routine");
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    saveAsRoutine(program);
  });
  card.appendChild(button);
}

// `openSessionFromHistory` arrives as a parameter rather than an import: it lives in
// activeSessionController, and a view importing its own controller inverts the layering the app is
// built on (controllers orchestrate views, not the reverse) — gated by
// agent_tools/import_layers.py. Injected, this file stays independently mountable.
//
// `saveAsRoutine(program)` is injected for the same reason: it stores a routine and opens the
// editor, which are the controllers' business. Without it, no button is drawn.
//
// `notes` may hold other programs' notes too; each card shows only those written on its program.
// `clientName` heads every card: the programs are one client's.
export function renderHistoryItems({
  programs,
  notes = [],
  clientName = "",
  container,
  t,
  openSessionFromHistory,
  saveAsRoutine,
}) {
  const fragment = document.createDocumentFragment();
  for (const program of programs) {
    const card = document.createElement("div");
    card.className = "history-card card glassmorphic";
    const planned = program.status === "planned";
    const programNotes = notes.filter((note) => note.programId === program.id);

    const minutes = Math.floor(program.duration / 60);
    const durationText = minutes > 0 ? `${minutes} ${t("min_session")}` : t("less_than_minute");

    // One logged exercise row — greyed with a "skipped" badge when the movement was prescribed but
    // not performed (completed:false); legacy rows have no flag and render as completed.
    const renderExerciseRow = (ex) => {
      const metric = ex.metric || "reps";
      const modality = ex.modality || "strength";
      const skipped = isSkippedRecord(ex);
      const setsText = skipped ? "" : buildExerciseSetsText(ex, metric, modality);
      const feedbackIconsHTML = buildFeedbackIconsHTML(programNotes, ex, t);
      const skipBadge = skipped ? `<span class="history-skip-badge">${t("skipped")}</span>` : "";
      return `
        <div class="history-ex-row${skipped ? " history-ex-skipped" : ""}">
          <div>
            <strong>${escapeHTML(ex.name)}</strong>${skipped ? " " : `: <span>${escapeHTML(setsText)}</span>`}${skipBadge}
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
    for (const item of orderedItems(program.exercises)) {
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
          <h4>${escapeHTML(clientName)}</h4>
          <p>${escapeHTML(programNameIn(program.routineName, t))}${planned ? "" : ` • ${durationText}`}</p>
        </div>
        <div class="history-date">${planned ? t("planned_program") || "Planned Program" : formatDateStr(programDate(program))}</div>
      </div>
      <div class="history-exercise-log">
        ${exercisesLogHTML}
      </div>
    `;

    card.addEventListener("click", () => {
      openSessionFromHistory(program);
    });

    // A performed session can seed a routine; a planned one already is a prescription.
    addSaveAsRoutineButton({ card, program, t, saveAsRoutine });

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
