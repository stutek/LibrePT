import {
  consentSignedDate,
  isConsentActive,
  isConsentWithdrawn,
} from "../../data/clientConsent.js";
import { isErased } from "../../data/clientErasure.js";
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
import { openClientEraseDialog, openClientExportDialog } from "./clientDataRights.js";
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
        <button class="view-grabber" type="button" data-i18n-label="view_grabber_home" aria-label="Return to home"></button>
        <h2 data-i18n="clients_title">Client Directory</h2>
        <!-- Let the person fill their own details in (TODO §26.3). Beside Add Client rather than
             replacing it: a trainer standing with someone at the desk still types the two fields
             themselves, and a trainer who has just been asked about training sends a link. It opens
             the sending dialog, which is where the contact detail and the copy-by-hand fallback
             live (modules/clients/intakeInviteDialog.js). -->
        <button id="btn-invite-client" class="btn secondary-btn btn-sm">
          <i class="fa-solid fa-share-nodes"></i> <span data-i18n="btn_invite_client">Invite a client</span>
        </button>
        <button id="btn-add-client" class="btn primary-btn btn-sm">
          <i class="fa-solid fa-user-plus"></i> <span data-i18n="btn_add_client">Add Client</span>
        </button>
      </div>

      <div class="search-bar-container">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="search-clients" data-i18n-placeholder="placeholder_search_clients" placeholder="Search clients..." class="search-input">
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
        <button class="view-grabber" type="button" data-i18n-label="view_grabber_home" aria-label="Return to home"></button>
        <button id="btn-back-to-clients" class="btn secondary-btn btn-sm">
          <i class="fa-solid fa-arrow-left"></i> <span data-i18n="btn_back">Back</span>
        </button>
        <!-- The name, avatar and profile fields below are empty in the markup: showClientDetails
             fills every one of them before the view is shown. -->
        <h2 id="detail-client-name"></h2>
        <button id="btn-edit-client" class="btn secondary-btn btn-sm">
          <i class="fa-solid fa-pen"></i> <span data-i18n="btn_edit_profile">Edit</span>
        </button>
      </div>

      <div class="client-detail-card card glassmorphic">
        <div class="client-profile-header">
          <div id="detail-client-avatar" class="avatar-large"></div>
          <div class="profile-meta">
            <h3 id="profile-name"></h3>
            <p id="profile-joined-date"></p>
          </div>
        </div>

        <p id="profile-erased" class="data-rights-warning" hidden></p>

        <div class="profile-info-grid">
          <div class="info-block">
            <label data-i18n="goals">Current Goals</label>
            <p id="profile-goals"></p>
          </div>
          <div class="info-block">
            <label data-i18n="notes_injuries">Health & Injury Notes</label>
            <p id="profile-notes"></p>
          </div>
          <div class="info-block">
            <label id="label-profile-email" data-i18n="client_email">Email</label>
            <p id="profile-email"></p>
          </div>
          <div class="info-block">
            <label id="label-profile-phone" data-i18n="client_phone">Phone Number</label>
            <p id="profile-phone"></p>
          </div>
          <div class="info-block">
            <label data-i18n="profile_consent_label">GDPR Cloud Sync Consent</label>
            <p id="profile-gdpr-status"></p>
          </div>
        </div>

        <div class="quick-workout-action">
          <button id="btn-plan-client-program" class="btn primary-btn">
            <i class="fa-solid fa-calendar-plus"></i> <span data-i18n="btn_plan_program">Plan Program</span>
          </button>
          <a id="btn-send-consent-email" class="btn secondary-btn">
            <i class="fa-solid fa-envelope"></i> <span id="btn-send-consent-email-text">Send Consent Form</span>
          </a>
          <button id="btn-ai-safe-copy" class="btn secondary-btn">
            <i class="fa-solid fa-user-shield"></i> <span data-i18n="profile_ai_safe_copy">AI Safe Copy</span>
          </button>
          <button id="btn-client-export" class="btn secondary-btn">
            <i class="fa-solid fa-file-export"></i> <span data-i18n="profile_export_data">Export data (GDPR)</span>
          </button>
          <button id="btn-client-erase" class="btn secondary-btn">
            <i class="fa-solid fa-user-slash"></i> <span data-i18n="profile_erase_client">Erase client (GDPR)</span>
          </button>
        </div>
      </div>



      <div class="section-title">
        <h3 data-i18n="client_history_header">Training History</h3>
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

  // Both data-rights actions are rebound per render (cloneNode drops the previous listener), the
  // same pattern the other buttons here use — they close over THIS client, and a stale listener
  // would aim an erasure at whoever was on screen before.
  for (const [id, open] of [
    ["btn-client-export", openClientExportDialog],
    ["btn-client-erase", openClientEraseDialog],
  ]) {
    const button = document.getElementById(id);
    if (!button) continue;
    button.replaceWith(button.cloneNode(true));
    document.getElementById(id).addEventListener("click", () => open(clientId));
  }

  const erasedBanner = document.getElementById("profile-erased");
  if (erasedBanner) {
    // An erased record still appears in the directory (a trainer asked "did you action it?" needs
    // to show that it was), so it has to say what it is at a glance.
    erasedBanner.hidden = !isErased(client);
    if (isErased(client)) {
      erasedBanner.textContent = `Erased on ${(client.erasure.erasedAt || "").substring(0, 10)} at the client's request. The training records below are anonymous.`;
    }
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
  if (isConsentWithdrawn(consent)) {
    // Distinct from "never consented": processing must stop for both, but only one of them is a
    // client the trainer must still be able to prove once agreed (Art. 7(1)).
    const dates = [consentSignedDate(consent), consent.withdrawnDate].filter(Boolean).join(" → ");
    const safeDates = escapeHTML(dates);
    statusEl.innerHTML = `<span class="badge badge-warning"><i class="fa-solid fa-ban mr-1"></i> Consent Withdrawn (${safeDates})</span>`;
    return;
  }
  if (!isConsentActive(consent)) {
    statusEl.innerHTML = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Not Consented (Local Only)</span>`;
    return;
  }

  const signedOn = consentSignedDate(consent);
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
  // The label carries the reason, not only the tooltip — a phone cannot hover.
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
