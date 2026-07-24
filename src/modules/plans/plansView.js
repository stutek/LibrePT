// src/views/routinesView.js - Domain module for routines catalog and template editor builder
import {
  formatMetricValue,
  modalityOf,
  primaryMetricOf,
  usesLoad,
} from "../common/exerciseModality.js";
import {
  formatLoad,
  formatReps,
  loadInputHTML,
  loadUnitForEquipment,
} from "../common/repsAndLoad.js";
import { escapeHTML } from "../common/utils.js";

export function renderRoutinesList({ state, t, openWorkoutSetupModal }) {
  const container = document.getElementById("routines-list");
  if (!container) return;
  container.innerHTML = "";

  if (state.routines.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="grid-column: 1/-1;">${t("no_routines_found")}</div>`;
    return;
  }

  for (const routine of state.routines) {
    const card = document.createElement("div");
    card.className = "routine-card card glassmorphic";

    const tags = routine.exercises
      .map((item) => {
        const ex = state.exercises.find((e) => e.id === item.id);
        const name = escapeHTML(ex ? ex.name : "Unknown Exercise");
        // Strength "3×8 · 60kg", isometric "3×0:45 · 20kg" (load-bearing modalities show a load);
        // cardio/holds/agility "1×20 cal" / "3×500 m" / "1×0:30" — the metric, no load.
        const metric = primaryMetricOf(ex);
        const primary =
          metric === "reps" ? formatReps(item.reps) : formatMetricValue(item.reps, metric);
        const load = usesLoad(modalityOf(ex))
          ? formatLoad(item.weight, loadUnitForEquipment(ex?.equipment))
          : "";
        const detail = `${item.sets}×${primary}${load ? ` · ${load}` : ""}`;
        return `<span class="preview-tag">${name} <span class="preview-tag-detail">${escapeHTML(detail)}</span></span>`;
      })
      .slice(0, 4)
      .join("");

    const moreCount = routine.exercises.length > 4 ? `+${routine.exercises.length - 4} more` : "";

    card.innerHTML = `
      <div class="routine-title-info">
        <h3>${escapeHTML(routine.name)}</h3>
        <p>${escapeHTML(routine.description || t("no_description"))}</p>
        <div class="routine-exercise-preview-tags">
          ${tags}
          ${moreCount ? `<span class="preview-tag" style="background:var(--primary-light); color:var(--primary); font-weight:700">${moreCount}</span>` : ""}
        </div>
      </div>
      <button class="btn secondary-btn btn-sm w-full btn-launch-routine">
        <i class="fa-solid fa-circle-play"></i> ${t("btn_start_group_session")}
      </button>
    `;

    card.querySelector(".btn-launch-routine").addEventListener("click", (e) => {
      e.stopPropagation();
      openWorkoutSetupModal(null, routine.id);
    });

    card.addEventListener("click", () => {
      openRoutineEditorModal({ routineId: routine.id, state });
    });

    container.appendChild(card);
  }
}

export function openRoutineEditorModal({ routineId, state }) {
  const routine = state.routines.find((r) => r.id === routineId);
  if (!routine) return;

  const dialog = document.getElementById("dialog-routine");
  const builderList = document.getElementById("routine-exercises-list");
  if (!dialog || !builderList) return;

  document.getElementById("routine-modal-title").textContent = "Edit Routine Template";
  document.getElementById("routine-form-id").value = routine.id;
  document.getElementById("routine-name").value = routine.name;
  document.getElementById("routine-desc").value = routine.description || "";

  // Collapse the add-exercise picker; edit starts from the existing rows.
  document.getElementById("routine-ex-picker")?.classList.add("hidden");

  builderList.innerHTML = "";
  for (const item of routine.exercises) {
    addRoutineExerciseRow({ preset: item, state });
  }

  dialog.showModal();
}

export function addRoutineExerciseRow({ preset = null, state }) {
  const builderList = document.getElementById("routine-exercises-list");
  if (!builderList) return;
  const row = document.createElement("div");
  row.className = "routine-builder-row";

  const optionsHTML = state.exercises
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (ex) =>
        `<option value="${ex.id}" ${preset && preset.id === ex.id ? "selected" : ""}>${escapeHTML(ex.name)} (${ex.category})</option>`,
    )
    .join("");

  const presetEx = preset ? state.exercises.find((e) => e.id === preset.id) : null;

  row.innerHTML = `
    <select class="form-control select-ex" required>
      <option value="" disabled ${!preset ? "selected" : ""}>Select Exercise</option>
      ${optionsHTML}
    </select>
    <div class="form-group" style="gap:2px">
      <input type="number" min="1" placeholder="Sets" class="form-control input-sets" value="${preset ? preset.sets : "3"}" required aria-label="Sets quantity">
    </div>
    <div class="form-group" style="gap:2px">
      <input type="text" placeholder="Reps" class="form-control input-reps" list="reps-presets" value="${preset ? escapeHTML(String(preset.reps)) : "10"}" required aria-label="Reps target (number, range like 8-12, time like 30s, or 'max' to failure)">
    </div>
    <div class="form-group load-cell" style="gap:2px"></div>
    <div class="form-group" style="gap:2px">
      <input type="number" min="0" step="5" placeholder="Rest" class="form-control input-rest" value="${preset ? preset.rest : "60"}" required aria-label="Rest duration in seconds">
    </div>
    <button type="button" class="btn-remove-row" aria-label="Remove exercise from routine"><i class="fa-solid fa-trash-can"></i></button>
  `;

  // The load control adapts to the selected movement's equipment: kg for free weights/machines,
  // a stack level for cables, a resistance-band strength, or bodyweight (+ optional added kg).
  const loadCell = row.querySelector(".load-cell");
  const renderLoad = (unit, value) => {
    loadCell.innerHTML = loadInputHTML({
      unit,
      value,
      cls: "form-control input-weight",
      escapeHTML,
      ariaLabel: "Load",
    });
  };
  renderLoad(loadUnitForEquipment(presetEx?.equipment), preset ? preset.weight : "");

  const sel = row.querySelector(".select-ex");
  sel.addEventListener("change", () => {
    const chosen = state.exercises.find((e) => e.id === sel.value);
    renderLoad(loadUnitForEquipment(chosen?.equipment), "");
  });

  row.querySelector(".btn-remove-row").addEventListener("click", () => {
    row.remove();
  });

  builderList.appendChild(row);
  builderList.scrollTop = builderList.scrollHeight;
}
