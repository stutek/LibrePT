// src/components/exercisePicker.js — reusable, low-friction exercise picker.
// Renders muscle-group + equipment filter chips over a single-tap list of movements (name +
// taxonomy badges). Powers the fast-selection flows called for in TODO §13.2: Scenario A
// (routine builder — filter then drop standardized IDs into a template) and Scenario B (gym-floor
// swap — pre-filtered to the same muscle group so the substitute inherits the correct volume bucket).
import { escapeHTML } from "../../helper/utils.js";

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Recovery"];
const EQUIPMENT = ["All", "Barbell", "Dumbbell", "Cable", "Machine", "Band", "Bodyweight"];

/**
 * Mounts (or re-mounts) a filtered exercise picker into `container`.
 * @param {HTMLElement} container - Target element; its contents are replaced.
 * @param {Object}   opts
 * @param {Object}   opts.state            - App state (reads `state.exercises`).
 * @param {string}  [opts.excludeId]       - Exercise id to omit (e.g. the one being swapped).
 * @param {string}  [opts.defaultCategory] - Muscle-group chip to pre-select (default "All").
 * @param {boolean} [opts.autoSelectFirst] - Pre-select the first match and fire onSelect (swap mode).
 * @param {boolean} [opts.keepSelection]   - Keep a persistent highlight on the chosen item (swap mode).
 * @param {(exercise: Object) => void} opts.onSelect - Called with the chosen exercise on tap.
 */
export function mountExercisePicker(
  container,
  {
    state,
    excludeId = null,
    defaultCategory = "All",
    autoSelectFirst = false,
    keepSelection = false,
    onSelect,
  },
) {
  if (!container) return;

  const filters = {
    muscle: MUSCLE_GROUPS.includes(defaultCategory) ? defaultCategory : "All",
    equipment: "All",
  };
  let selectedId = null;

  const chipRow = (name, values, active) =>
    `<div class="picker-chips" data-axis="${name}">${values
      .map(
        (v) =>
          `<button type="button" class="chip chip-sm ${v === active ? "active" : ""}" data-value="${escapeHTML(
            v,
          )}">${escapeHTML(v)}</button>`,
      )
      .join("")}</div>`;

  container.classList.add("exercise-picker");
  container.innerHTML = `
    ${chipRow("muscle", MUSCLE_GROUPS, filters.muscle)}
    ${chipRow("equipment", EQUIPMENT, filters.equipment)}
    <div class="picker-count"></div>
    <div class="picker-list"></div>
  `;

  const listEl = container.querySelector(".picker-list");
  const countEl = container.querySelector(".picker-count");

  const getMatches = () =>
    state.exercises
      .filter((e) => e.id !== excludeId)
      .filter((e) => filters.muscle === "All" || e.category === filters.muscle)
      .filter((e) => filters.equipment === "All" || e.equipment === filters.equipment)
      .sort((a, b) => a.name.localeCompare(b.name));

  const renderList = () => {
    const matches = getMatches();
    countEl.textContent = matches.length
      ? `${matches.length} movement${matches.length === 1 ? "" : "s"}`
      : "";
    if (matches.length === 0) {
      listEl.innerHTML = `<div class="picker-empty text-muted">No movements match this filter.</div>`;
      return;
    }
    listEl.innerHTML = matches
      .map((ex) => {
        const badges = [ex.equipment, ex.pattern]
          .filter(Boolean)
          .map((v) => `<span class="taxonomy-badge">${escapeHTML(v)}</span>`)
          .join("");
        return `
          <button type="button" class="picker-item ${
            keepSelection && ex.id === selectedId ? "selected" : ""
          }" data-id="${ex.id}">
            <span class="picker-item-name">${escapeHTML(ex.name)}</span>
            <span class="picker-item-badges">${badges}</span>
          </button>`;
      })
      .join("");
  };

  // Chip filtering (delegated).
  for (const row of container.querySelectorAll(".picker-chips")) {
    row.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const axis = row.getAttribute("data-axis");
      filters[axis] = chip.getAttribute("data-value");
      for (const c of row.querySelectorAll(".chip")) c.classList.remove("active");
      chip.classList.add("active");
      renderList();
    });
  }

  // Item selection (delegated).
  listEl.addEventListener("click", (e) => {
    const item = e.target.closest(".picker-item");
    if (!item) return;
    const ex = state.exercises.find((x) => x.id === item.getAttribute("data-id"));
    if (!ex) return;
    selectedId = ex.id;
    if (keepSelection) {
      for (const el of listEl.querySelectorAll(".picker-item")) el.classList.remove("selected");
      item.classList.add("selected");
    } else {
      // Momentary confirmation pulse for "drop into template" flows.
      item.classList.add("just-added");
      setTimeout(() => item.classList.remove("just-added"), 350);
    }
    onSelect?.(ex);
  });

  renderList();

  if (autoSelectFirst) {
    const first = getMatches()[0];
    if (first) {
      selectedId = first.id;
      if (keepSelection) {
        const el = listEl.querySelector(`.picker-item[data-id="${first.id}"]`);
        el?.classList.add("selected");
      }
      onSelect?.(first);
    } else {
      onSelect?.(null);
    }
  }
}
