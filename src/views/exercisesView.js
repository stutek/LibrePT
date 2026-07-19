// src/views/exercisesView.js - Domain module for exercise catalog and filter logic
import { escapeHTML } from "../helper/utils.js";

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
    card.innerHTML = `
      <div class="exercise-item-header">
        <h3>${escapeHTML(ex.name)}</h3>
        <span class="muscle-badge">${ex.category}</span>
      </div>
      <p class="exercise-instructions">${escapeHTML(ex.instructions || t("no_instructions"))}</p>
    `;
    fragment.appendChild(card);
  }
  container.appendChild(fragment);
}
