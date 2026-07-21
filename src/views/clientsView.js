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

  const hasConsent = Boolean(client.gdprConsent?.cloudSync);
  const statusEl = document.getElementById("profile-gdpr-status");
  if (statusEl) {
    statusEl.innerHTML = hasConsent
      ? `<span class="badge badge-success"><i class="fa-solid fa-check mr-1"></i> Consented (${client.gdprConsent.timestamp ? client.gdprConsent.timestamp.split("T")[0] : "Verified"})</span>`
      : `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Not Consented (Local Only)</span>`;
  }

  const mailtoBtn = document.getElementById("btn-send-consent-email");
  if (mailtoBtn) {
    const subject = encodeURIComponent("Personal Training — Data Privacy & Cloud Storage Consent");
    const body = encodeURIComponent(
      `Hi ${client.name},\n\nTo prepare our workout schedules, track your strength progression, and ensure safe training, I use LibrePT to log our session results, exercise weights, and any relevant mobility or injury notes.\n\nIn accordance with data protection regulations (GDPR), I want to make sure you are fully informed about how your coaching data is managed:\n\n1. Storage & Security: Your workout logs and training notes are stored securely on my device and backed up in encrypted form to my personal cloud storage strictly for coaching continuity and preparation.\n2. No Third-Party Tracking or Selling: Your data is never sold, shared with advertisers, or transferred to third parties.\n3. Artificial Intelligence Safety: If I utilize AI tools to assist in periodizing or analyzing workout volume, your records are strictly anonymized (all names and identifying personal information are stripped) prior to analysis.\n4. Your Rights: You have the right at any time to request a complete export of your workout history, request corrections, or ask for your personal records to be permanently deleted.\n\nPlease reply "I CONSENT" to this email to confirm that you understand and agree to these privacy practices for our personal training sessions.\n\nBest regards,\nYour Personal Trainer`,
    );
    mailtoBtn.href = client.email
      ? `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`
      : "#";
    if (!client.email) {
      mailtoBtn.classList.add("disabled");
      mailtoBtn.title = "No email address on client profile";
    } else {
      mailtoBtn.classList.remove("disabled");
      mailtoBtn.title = `Send consent request to ${client.email}`;
    }
  }

  const aiCopyBtn = document.getElementById("btn-ai-safe-copy");
  if (aiCopyBtn) {
    aiCopyBtn.replaceWith(aiCopyBtn.cloneNode(true));
    document.getElementById("btn-ai-safe-copy").addEventListener("click", () => {
      const clientHistory = state.history.filter((log) => log.clientId === client.id);
      const historyText =
        clientHistory.length > 0
          ? clientHistory
              .slice(0, 10)
              .map((h) => {
                const exList = (h.completedExercises || [])
                  .map(
                    (ex) =>
                      `- ${ex.name}: ${ex.completedReps} reps @ ${ex.weightUsed || "BW"} (Outcome: ${ex.outcome || "Completed"})`,
                  )
                  .join("\n");
                return `### Session on ${h.date}\n${exList}`;
              })
              .join("\n\n")
          : "_No session history recorded._";

      const anonymizedSummary = `# Anonymized Client Performance Summary
- Entity: Client #${client.id}
- Goals: ${client.goals || "N/A"}
- Health & Mobility Notes: ${client.notes || "None"}
- Total Logged Sessions: ${clientHistory.length}

## Recent Workout Logs
${historyText}`;

      navigator.clipboard.writeText(anonymizedSummary).then(() => {
        alert("Anonymized client summary copied to clipboard! Safe to use with AI assistants.");
      });
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
