// src/views/clientsView.js - Domain module for client directory and detail views
import { renderClientsDirectory } from "../components/clientsDirectory.js";
import {
  escapeHTML,
  formatDateStr,
  getClientDisplayNameHTML,
  getInitials,
  truncateString,
} from "../helper/utils.js";
import { renderHistoryItems } from "./historyView.js";

let activeDetailClientId = null;

export function getActiveDetailClientId() {
  return activeDetailClientId;
}

export function setActiveDetailClientId(id) {
  activeDetailClientId = id;
}

export function renderClientsList({ state, t, navigateToPath, filterQuery = "" }) {
  const container = document.getElementById("clients-list");
  if (!container) return;
  renderClientsDirectory(container, {
    clients: state.clients,
    filterQuery,
    t,
    escapeHTML,
    getInitials,
    getClientDisplayNameHTML,
    truncateString,
    onOpenClient: (id) => navigateToPath(`/clients/${id}`),
  });
}

export function showClientDetails({
  clientId,
  state,
  t,
  showErrorView,
  switchView,
  openWorkoutSetupModal,
}) {
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) {
    showErrorView(window.location.pathname);
    return;
  }

  activeDetailClientId = clientId;
  document.getElementById("detail-client-name").innerHTML = getClientDisplayNameHTML(client);
  document.getElementById("detail-client-avatar").textContent =
    client.avatar || getInitials(client.name);
  document.getElementById("profile-name").innerHTML = getClientDisplayNameHTML(client);
  document.getElementById("profile-joined-date").textContent =
    `${t("joined")} ${formatDateStr(client.joinedDate)}`;
  document.getElementById("profile-goals").textContent = client.goals || t("no_goals_specified");
  document.getElementById("profile-notes").textContent = client.notes || t("no_notes_specified");
  document.getElementById("profile-email").textContent = client.email || t("not_specified");
  document.getElementById("profile-phone").textContent = client.phone || t("not_specified");

  const startBtn = document.getElementById("btn-start-client-workout");
  if (startBtn) {
    startBtn.replaceWith(startBtn.cloneNode(true));
    document.getElementById("btn-start-client-workout").addEventListener("click", () => {
      openWorkoutSetupModal(clientId);
    });
  }

  const planBtn = document.getElementById("btn-plan-client-program");
  if (planBtn) {
    planBtn.replaceWith(planBtn.cloneNode(true));
    document.getElementById("btn-plan-client-program").addEventListener("click", () => {
      openWorkoutSetupModal(clientId, null, null, true);
    });
  }

  renderClientWorkoutHistory({ client, state, t });
  switchView("client-detail");
}

export function renderClientWorkoutHistory({ client, state, t }) {
  const container = document.getElementById("client-history-list");
  if (!container) return;
  container.innerHTML = "";

  const clientHistory = state.history
    .filter((log) => log.clientId === client.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (clientHistory.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted text-sm">${t("no_workouts_logged")}</div>`;
    return;
  }

  renderHistoryItems({ historyList: clientHistory, container, t });
}
