// src/modules/exercises/exercisePicker.js — reusable, low-friction exercise picker.
// Renders muscle-group + equipment filter chips over a single-tap list of movements (name +
// taxonomy badges). Powers the fast-selection flows called for in TODO §13.2: Scenario A
// (routine builder — filter then drop standardized IDs into a template) and Scenario B (gym-floor
// swap — pre-filtered to the same muscle group so the substitute inherits the correct volume bucket).
import { modalityOf } from "../../domain/exerciseModality.js";
import { escapeHTML } from "../common/utils.js";

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Recovery",
  "Cardio",
];
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
 * @param {string}  [opts.initialQuery]    - Seed the search box (e.g. what the PT already typed).
 * @param {boolean} [opts.autoFocusSearch] - Put the caret in the search box on mount.
 * @param {string}  [opts.searchLabel]     - Translated placeholder/aria-label for the search box.
 * @param {string}  [opts.muscleLabel]     - Translated label for the muscle-group filter row.
 * @param {string}  [opts.equipmentLabel]  - Translated label for the equipment filter row.
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
    initialQuery = "",
    autoFocusSearch = false,
    searchLabel = "Search movements",
    muscleLabel = "Muscle",
    equipmentLabel = "Equipment",
    onSelect,
  },
) {
  if (!container) return;

  const filters = {
    muscle: MUSCLE_GROUPS.includes(defaultCategory) ? defaultCategory : "All",
    equipment: "All",
    // Typing beats scrolling a 100-movement list on a phone: the search narrows by name, pattern or
    // equipment, so "rom dead" or "band" lands on the target in one gesture.
    query: (initialQuery || "").trim(),
  };
  let selectedId = null;

  // Each chip row is labelled with the axis it filters: two unlabelled rows of chips read as one
  // undifferentiated wall, and "All" appearing twice is only unambiguous once each row is named.
  const chipRow = (name, values, active, label) =>
    `<div class="picker-chips" data-axis="${name}">
      <span class="picker-chips-label">${escapeHTML(label)}</span>${values
        .map(
          (v) =>
            `<button type="button" class="chip chip-sm ${v === active ? "active" : ""}" data-value="${escapeHTML(
              v,
            )}">${escapeHTML(v)}</button>`,
        )
        .join("")}</div>`;

  container.classList.add("exercise-picker");
  container.innerHTML = `
    <div class="picker-search-wrap">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="search" class="picker-search" value="${escapeHTML(filters.query)}"
             placeholder="${escapeHTML(searchLabel)}" aria-label="${escapeHTML(searchLabel)}">
    </div>
    ${chipRow("muscle", MUSCLE_GROUPS, filters.muscle, muscleLabel)}
    ${chipRow("equipment", EQUIPMENT, filters.equipment, equipmentLabel)}
    <div class="picker-count"></div>
    <div class="picker-list"></div>
  `;

  const listEl = container.querySelector(".picker-list");
  const countEl = container.querySelector(".picker-count");
  const searchEl = container.querySelector(".picker-search");

  const matchesQuery = (ex) => {
    if (!filters.query) return true;
    const needle = filters.query.toLowerCase();
    return [ex.name, ex.pattern, ex.equipment, ex.category]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(needle));
  };

  const getMatches = () =>
    state.exercises
      .filter((e) => e.id !== excludeId)
      .filter((e) => filters.muscle === "All" || e.category === filters.muscle)
      .filter((e) => filters.equipment === "All" || e.equipment === filters.equipment)
      .filter(matchesQuery)
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
        const modality = modalityOf(ex);
        // A non-strength movement leads with a highlighted modality badge so cardio/stretch/balance
        // work is spottable at a glance in the list.
        const modalityBadge =
          modality === "strength"
            ? ""
            : `<span class="taxonomy-badge taxonomy-badge-modality">${escapeHTML(modality)}</span>`;
        const badges =
          modalityBadge +
          [ex.equipment, ex.pattern]
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

  // Live search: filter as the PT types — no submit, no waiting.
  searchEl.addEventListener("input", () => {
    filters.query = searchEl.value.trim();
    renderList();
  });
  // Enter takes the single obvious match, so a typed swap never needs a second aimed tap.
  searchEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    listEl.querySelector(".picker-item")?.click();
  });

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

  if (autoFocusSearch) {
    // Deferred: a dialog that has just been shown steals focus back to itself on the same tick.
    setTimeout(() => {
      searchEl.focus();
      searchEl.select();
    }, 0);
  }

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
