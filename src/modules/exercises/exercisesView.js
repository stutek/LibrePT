// src/views/exercisesView.js - Domain module for exercise catalog and filter logic
import { modalityOf } from "../common/exerciseModality.js";
import { escapeHTML } from "../common/utils.js";

export function renderExercisesViewShell() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent || document.getElementById("view-exercises")) return;
  mainContent.insertAdjacentHTML(
    "beforeend",
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
      
      <div class="filter-chips">
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

export function renderExercisesList({ state, t, filterQuery = "", categoryFilter = "All" }) {
  const container = document.getElementById("exercises-list");
  if (!container) return;
  container.innerHTML = "";

  let filtered = state.exercises;

  if (categoryFilter !== "All") {
    filtered = filtered.filter((e) => e.category === categoryFilter);
  }

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
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
