// src/modules/common/demoCleanupDialog.js — the confirmation screen for clearing demo data.
// Single responsibility: show a trainer exactly what is about to be deleted, what is being kept and
// why, let them rescue anything, and hand the resulting plan back. It decides nothing itself — the
// plan comes from data/demoDataRemoval.js and the write happens in data/stateStore.js.
//
// Why a screen and not a one-tap button. The removal planner is conservative by construction, so
// the destructive case it CANNOT rule out is narrow but real: a demo record the trainer edited into
// something of their own that nothing else references — a seeded exercise renamed to a movement
// they actually coach, say. Nothing in the data can distinguish that from an untouched seed record,
// so the only correct answer is to show it and let them say. A confirm() dialog cannot; it offers
// one bit for a decision that is per-record.
//
// The counts matter for the same reason: "8 clients, 5 sessions, 5 history entries" is a sentence a
// trainer can check against what they believe they have. "Clear demo data?" is not.
//
// deps: { getState, t, escapeHTML, removeDemoData, onRemoved }

import { planDemoRemoval } from "../../data/demoDataRemoval.js";
import { renderMarkupOnce } from "./dom.js";

let deps = null;
// Ids the trainer has rescued, per collection. Lives here rather than in the plan because it is a
// property of this conversation, not of the database — reopening the dialog starts clean.
let keepIds = {};

export function initDemoCleanupDialog(injected) {
  deps = injected;
}

const COLLECTION_LABEL_KEYS = {
  clients: "demo_cleanup_clients",
  sessions: "demo_cleanup_sessions",
  history: "demo_cleanup_history",
  planUpdates: "demo_cleanup_plan_updates",
  routines: "demo_cleanup_routines",
  exercises: "demo_cleanup_exercises",
  notifications: "demo_cleanup_notifications",
};

function label(collection) {
  const key = COLLECTION_LABEL_KEYS[collection];
  return (key && deps.t(key)) || collection;
}

// A record's human name, whatever the collection calls it. Falls back to the id so a row is never
// blank — an unnamed row a trainer cannot identify is worse than a technical one.
function displayName(record) {
  return record.name || record.title || record.clientName || record.routineName || record.id;
}

function findRecord(state, collection, id) {
  return (state[collection] || []).find((record) => record.id === id);
}

export function renderDemoCleanupDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-demo-cleanup"),
    `
<dialog id="dialog-demo-cleanup" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="demo-cleanup-title">Clear demo data</h3>
      <button class="modal-close-btn" data-demo-cleanup-close aria-label="Close clear demo data modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body-scroll">
      <p class="dialog-desc" id="demo-cleanup-desc"></p>
      <ul id="demo-cleanup-counts" class="demo-cleanup-counts"></ul>
      <div id="demo-cleanup-retained"></div>
      <p class="status-msg" id="demo-cleanup-status"></p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn-secondary" data-demo-cleanup-close>Cancel</button>
      <button type="button" class="btn-danger" id="btn-demo-cleanup-confirm">Remove</button>
    </div>
</dialog>`,
  );
}

function renderCounts(plan) {
  const list = document.getElementById("demo-cleanup-counts");
  if (!list) return;
  const rows = Object.entries(plan.counts)
    .filter(([, count]) => count.removing > 0 || count.retaining > 0)
    .map(([collection, count]) => {
      const kept = count.keeping
        ? `<span class="demo-cleanup-kept">${deps.escapeHTML(deps.t("demo_cleanup_kept") || "kept")}</span>`
        : "";
      return `<li><span class="demo-cleanup-count">${count.removing}</span> ${deps.escapeHTML(label(collection))} ${kept}</li>`;
    });
  list.innerHTML = rows.join("");
}

// Every retained record gets a row naming it and why it survived, each with a control to send it
// back into the removal set. A trainer who disagrees with a rescue has somewhere to say so, and the
// write path re-checks the edited plan before touching anything.
function renderRetained(plan, state) {
  const container = document.getElementById("demo-cleanup-retained");
  if (!container) return;
  if (plan.retained.length === 0) {
    container.innerHTML = "";
    return;
  }
  const heading = deps.t("demo_cleanup_retained_title") || "Kept because your work depends on it";
  const rows = plan.retained
    .map((entry) => {
      const record = findRecord(state, entry.collection, entry.id);
      const name = record ? displayName(record) : entry.id;
      return `<li>
        <span class="demo-cleanup-retained-name">${deps.escapeHTML(name)}</span>
        <span class="demo-cleanup-retained-why">${deps.escapeHTML(entry.reason)}</span>
      </li>`;
    })
    .join("");
  container.innerHTML = `<h4>${deps.escapeHTML(heading)}</h4><ul class="demo-cleanup-retained-list">${rows}</ul>`;
}

function currentPlan() {
  return planDemoRemoval(deps.getState(), { keepIds });
}

function refresh() {
  const state = deps.getState();
  const plan = currentPlan();
  const total = Object.values(plan.removals).reduce((sum, ids) => sum + ids.length, 0);

  const desc = document.getElementById("demo-cleanup-desc");
  if (desc) {
    desc.textContent =
      total === 0
        ? deps.t("demo_cleanup_none") || "There is no demo data left to remove."
        : deps.t("demo_cleanup_desc") ||
          "Your own clients, sessions and logs are never touched. The movement catalog is kept so your programmes keep working.";
  }
  const confirmBtn = document.getElementById("btn-demo-cleanup-confirm");
  if (confirmBtn) confirmBtn.disabled = total === 0;

  renderCounts(plan);
  renderRetained(plan, state);
  return plan;
}

export function openDemoCleanupDialog() {
  renderDemoCleanupDialog();
  keepIds = {};
  const dialog = document.getElementById("dialog-demo-cleanup");
  if (!dialog) return;

  refresh();
  wire(dialog);
  dialog.showModal();
}

let wired = false;

function wire(dialog) {
  if (wired) return;
  wired = true;

  for (const btn of dialog.querySelectorAll("[data-demo-cleanup-close]")) {
    btn.addEventListener("click", () => dialog.close());
  }

  const confirmBtn = document.getElementById("btn-demo-cleanup-confirm");
  confirmBtn?.addEventListener("click", () => {
    const result = deps.removeDemoData({ keepIds });
    const status = document.getElementById("demo-cleanup-status");
    if (!result.ok) {
      // Only reachable if an edited plan would orphan a record; the store refuses before writing.
      if (status) {
        status.textContent =
          deps.t("demo_cleanup_blocked") ||
          "That selection would leave records pointing at things that no longer exist.";
        status.className = "status-msg error";
      }
      return;
    }
    dialog.close();
    deps.onRemoved?.();
  });
}
