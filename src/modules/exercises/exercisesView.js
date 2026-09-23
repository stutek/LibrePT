// src/modules/exercises/exercisesView.js - the exercise library view: its filters and its cards
import {
  ALL_SOURCES,
  CATALOG_SOURCE,
  OWN_SOURCE,
  libraryExercises,
  withSource,
} from "../../data/exerciseLibrary.js";
import { modalityOf } from "../../domain/exerciseModality.js";
import { renderMarkupOnce } from "../common/dom.js";
import { escapeHTML } from "../common/utils.js";
import { sourceBadge } from "./exercisePicker.js";

export function renderExercisesViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-exercises"),
    `
<section id="view-exercises" class="app-view">
      <div class="view-header view-titlebar">
        <button class="view-grabber" type="button" aria-label="Return to home"></button>
        <h2>Exercise Library</h2>
        <button id="btn-add-exercise" class="btn primary-btn btn-sm">
          <i class="fa-solid fa-plus"></i> Add Exercise
        </button>
      </div>
      
      <div class="search-bar-container">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="search-exercises" placeholder="Search exercises..." class="search-input">
      </div>
      
      <div class="filter-chips" data-axis="source">
        <span class="filter-chips-label" id="exercises-source-label" data-i18n="source">Source</span>
        <button class="chip active" data-filter="${ALL_SOURCES}" data-i18n="filter_all">All</button>
        <button class="chip" data-filter="${CATALOG_SOURCE}" data-i18n="source_librept">LibrePT</button>
        <button class="chip" data-filter="${OWN_SOURCE}" data-i18n="source_own">Mine</button>
      </div>

      <div class="filter-chips" data-axis="category">
        <span class="filter-chips-label" id="exercises-filter-label">Muscle</span>
        <button class="chip active" data-filter="All">All</button>
        <button class="chip" data-filter="Chest">Chest</button>
        <button class="chip" data-filter="Back">Back</button>
        <button class="chip" data-filter="Legs">Legs</button>
        <button class="chip" data-filter="Shoulders">Shoulders</button>
        <button class="chip" data-filter="Arms">Arms</button>
        <button class="chip" data-filter="Core">Core</button>
        <button class="chip" data-filter="Recovery">Recovery</button>
      </div>
      
      <div id="exercises-list" class="stack-list">
        <!-- Injected via JS -->
      </div>
    </section>
`,
  );
}

// The active filter has no copy in state — the search box and the chips ARE it. A caller that
// re-renders for its own reason (an exercise added, the language switched, a backup restored)
// passes no filter, and must get the list the visible controls describe rather than the whole
// catalog under a chip that still says Chest.
//
// Each row is read by its own axis: `.filter-chips` is also the class of the sessions list's filter
// row, so an unscoped `.chip.active` could answer with a chip from another screen or another row.
function activeChipValue(axis, fallback) {
  const chip = document.querySelector(
    `#view-exercises .filter-chips[data-axis="${axis}"] .chip.active`,
  );
  return chip ? chip.getAttribute("data-filter") : fallback;
}

function visibleFilter() {
  const search = document.getElementById("search-exercises");
  return {
    filterQuery: search ? search.value : "",
    categoryFilter: activeChipValue("category", "All"),
    sourceFilter: activeChipValue("source", ALL_SOURCES),
  };
}

export function renderExercisesList({ state, t, filterQuery, categoryFilter, sourceFilter }) {
  const container = document.getElementById("exercises-list");
  if (!container) return;
  container.innerHTML = "";

  const visible = visibleFilter();
  const query = filterQuery ?? visible.filterQuery;
  const category = categoryFilter ?? visible.categoryFilter;
  const source = sourceFilter ?? visible.sourceFilter;

  let filtered = withSource(libraryExercises(state), source);

  if (category !== "All") {
    filtered = filtered.filter((e) => e.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.equipment?.toLowerCase().includes(q) ||
        e.pattern?.toLowerCase().includes(q) ||
        e.instructions?.toLowerCase().includes(q),
    );
  }

  filtered.sort((a, b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">${t("no_exercises_matched")}</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const ex of filtered) {
    const card = document.createElement("div");
    card.className = "exercise-item card glassmorphic";
    const modality = modalityOf(ex);
    const modalityBadge =
      modality === "strength"
        ? ""
        : `<span class="taxonomy-badge taxonomy-badge-modality">${escapeHTML(modality)}</span>`;
    const meta =
      sourceBadge(ex, t("source_own_badge") || "Mine") +
      modalityBadge +
      [ex.equipment, ex.pattern]
        .filter(Boolean)
        .map((v) => `<span class="taxonomy-badge">${escapeHTML(v)}</span>`)
        .join("");
    card.innerHTML = `
      <div class="exercise-item-header">
        <h3>${escapeHTML(ex.name)}</h3>
        <span class="muscle-badge">${ex.category}</span>
      </div>
      <div class="exercise-item-meta">${meta}</div>
    `;
    fragment.appendChild(card);
  }
  container.appendChild(fragment);
}
