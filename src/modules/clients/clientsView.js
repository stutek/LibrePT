import { consentEmailHref } from "../common/consentForm.js";
import { renderMarkupOnce } from "../common/dom.js";
import {
  escapeHTML,
  formatDateStr,
  getClientDisplayNameHTML,
  getInitials,
  truncateString,
} from "../common/utils.js";
import { renderHistoryItems } from "../history/historyView.js";
import { renderClientsDirectory } from "./clientsDirectory.js";

let activeDetailClientId = null;

export function getActiveDetailClientId() {
  return activeDetailClientId;
}

export function setActiveDetailClientId(id) {
  activeDetailClientId = id;
}

export function renderClientDirectoryViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-client-directory"),
    `
<section id="view-client-directory" class="app-view">
      <div class="view-header view-titlebar">
        <button class="view-grabber" type="button" aria-label="Return to home"></button>
        <h2>Client Directory</h2>
        <button id="btn-add-client" class="btn primary-btn btn-sm">
          <i class="fa-solid fa-user-plus"></i> Add Client
        </button>
      </div>

      <div class="search-bar-container">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="search-clients" placeholder="Search clients..." class="search-input">
      </div>

      <div id="clients-list" class="grid-list">
        <!-- Injected via JS -->
      </div>
    </section>
`,
  );
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

export function renderClientDetailViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-client-detail"),
    `
<section id="view-client-detail" class="app-view">
      <div class="view-header-back view-titlebar">
        <button class="view-grabber" type="button" aria-label="Return to home"></button>
        <button id="btn-back-to-clients" class="btn secondary-btn btn-sm">
          <i class="fa-solid fa-arrow-left"></i> Back
        </button>
        <h2 id="detail-client-name">Client Details</h2>
        <button id="btn-edit-client" class="btn secondary-btn btn-sm">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
      </div>
      
      <div class="client-detail-card card glassmorphic">
        <div class="client-profile-header">
          <div id="detail-client-avatar" class="avatar-large">JD</div>
          <div class="profile-meta">
            <h3 id="profile-name">Jane Doe</h3>
            <p id="profile-joined-date">Joined March 15, 2026</p>
          </div>
        </div>
        
        <div class="profile-info-grid">
          <div class="info-block">
            <label>Current Goals</label>
            <p id="profile-goals">Goals details go here.</p>
          </div>
          <div class="info-block">
            <label>Health & Injury Notes</label>
            <p id="profile-notes">Notes details go here.</p>
          </div>
          <div class="info-block">
            <label id="label-profile-email">Email</label>
            <p id="profile-email">Email goes here.</p>
          </div>
          <div class="info-block">
            <label id="label-profile-phone">Phone Number</label>
            <p id="profile-phone">Phone goes here.</p>
          </div>
          <div class="info-block">
            <label>GDPR Cloud Sync Consent</label>
            <p id="profile-gdpr-status"><span class="badge">Checking...</span></p>
          </div>
        </div>

        <div class="quick-workout-action" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button id="btn-plan-client-program" class="btn primary-btn" style="flex: 1; min-width: 150px;">
            <i class="fa-solid fa-calendar-plus"></i> Plan Program
          </button>
          <a id="btn-send-consent-email" class="btn secondary-btn" style="flex: 1; min-width: 150px; text-decoration: none; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <i class="fa-solid fa-envelope"></i> <span id="btn-send-consent-email-text">Send Consent Form</span>
          </a>
          <button id="btn-ai-safe-copy" class="btn secondary-btn" style="flex: 1; min-width: 150px;">
            <i class="fa-solid fa-user-shield"></i> AI Safe Copy
          </button>
        </div>
      </div>



      <div class="section-title">
        <h3>Training History</h3>
      </div>
      <div class="history-list" id="client-history-list"></div>
    </section>
`,
  );
}

export function showClientDetails({
  clientId,
  state,
  t,
  showErrorView,
  switchView,
  openWorkoutSetupModal,
  openSessionFromHistory,
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

  renderConsentStatus(client);
  renderConsentDelivery(client, client.gdprConsent?.formLang || state.lang);

  const aiCopyBtn = document.getElementById("btn-ai-safe-copy");
  if (aiCopyBtn) {
    aiCopyBtn.replaceWith(aiCopyBtn.cloneNode(true));
    document.getElementById("btn-ai-safe-copy").addEventListener("click", () => {
      // Excludes isPlanning drafts — a plan awaiting a session is not a "logged session" for a
      // performance summary (it inflates the count and has no completed reps/outcomes to report).
      const clientHistory = state.history.filter(
        (log) => log.clientId === client.id && !log.isPlanning,
      );
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

  renderClientWorkoutHistory({ client, state, t, openSessionFromHistory });
  switchView("client-detail");
}

// The badge answers the two questions a trainer is actually asked: did they consent, and to WHICH
// wording. `consentDate` is the date on the signed paper; a record predating that field falls back
// to the write timestamp's date (see clientConsentSection.js).
function renderConsentStatus(client) {
  const statusEl = document.getElementById("profile-gdpr-status");
  if (!statusEl) return;

  const consent = client.gdprConsent;
  if (!consent?.cloudSync) {
    statusEl.innerHTML = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Not Consented (Local Only)</span>`;
    return;
  }

  const signedOn = consent.consentDate || (consent.timestamp || "").split("T")[0];
  const detail = [signedOn, consent.formVersion && `v${consent.formVersion}`]
    .filter(Boolean)
    .join(" · ");
  // A local const, not an inline expression: the HTML-sink audit reads the escaping at the
  // interpolation site (build/frontend_audit.py).
  const safeDetail = escapeHTML(detail || "Verified");
  statusEl.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-check mr-1"></i> Consented (${safeDetail})</span>`;
}

// The language the client was (or will be) sent the form in — their recorded one if there is one,
// otherwise the trainer's UI language, same default the dialog's selector offers.
function renderConsentDelivery(client, lang) {
  const mailtoBtn = document.getElementById("btn-send-consent-email");
  if (!mailtoBtn) return;

  const href = consentEmailHref(client, lang);
  mailtoBtn.href = href || "#";
  mailtoBtn.classList.toggle("disabled", !href);
  // The label carries the reason, not only the tooltip — a phone cannot hover (AGENT_RULES §2.D.1).
  const label = mailtoBtn.querySelector("span");
  if (label) label.textContent = href ? "Send Consent Form" : "No email on file";
}

export function renderClientWorkoutHistory({ client, state, t, openSessionFromHistory }) {
  const container = document.getElementById("client-history-list");
  if (!container) return;
  container.innerHTML = "";

  // Excludes isPlanning drafts (see the Global History view for those, historyView.js) — this
  // widget is the client's actual workout history, not their in-progress plans.
  const clientHistory = state.history
    .filter((log) => log.clientId === client.id && !log.isPlanning)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (clientHistory.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted text-sm">${t("no_workouts_logged")}</div>`;
    return;
  }

  renderHistoryItems({ historyList: clientHistory, container, t, openSessionFromHistory });
}
