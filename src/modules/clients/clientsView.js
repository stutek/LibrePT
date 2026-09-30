// src/modules/clients/clientsView.js — renders the client directory and the client profile.
// Modular view renderer. It owns the markup of `#view-client-directory` and `#view-client-detail`.

import {
  consentSignedDate,
  isConsentActive,
  isConsentWithdrawn,
} from "../../data/clientConsent.js";
import { isErased } from "../../data/clientErasure.js";
import { readTrainerIdentity } from "../../data/trainerIdentity.js";
import { aiClientSummary } from "../../domain/aiClientSummary.js";
import { tellInApp } from "../common/appQuestion.js";
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
let historyActions = {};

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
        <!-- Let the person fill their own details in. Beside Add Client rather than
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
      <!-- The other end of Invite a client: the person filled their details in on their own phone and
           sent them back. Its own row, under the title, because a third button does not fit beside
           the two above on a phone. It opens the review, where the trainer reads one record before
           it enters the register (modules/clients/signupReviewDialog.js). -->
      <div class="view-subactions">
        <button id="btn-review-signup" class="btn secondary-btn btn-sm">
          <i class="fa-solid fa-user-check"></i> <span data-i18n="btn_review_signup">Add a client from their own details</span>
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
            <label data-i18n="injury_label">Injuries and limits</label>
            <p id="profile-injury"></p>
          </div>
          <div class="info-block">
            <label data-i18n="notes_label">Notes</label>
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

        <div id="client-detail-actions" class="quick-workout-action">
          <button id="btn-plan-client-program" class="btn primary-btn">
            <i class="fa-solid fa-calendar-plus"></i> <span data-i18n="btn_plan_program">Plan Program</span>
          </button>
          <a id="btn-send-consent-email" class="btn secondary-btn">
            <i class="fa-solid fa-envelope"></i> <span id="btn-send-consent-email-text"></span>
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

/** The profile's plain text fields, each with what it says when the trainer left it empty. */
function fillProfileText(client, t) {
  const fields = [
    ["profile-goals", client.goals, "no_goals_specified"],
    ["profile-injury", client.injury, "not_specified"],
    ["profile-notes", client.notes, "no_notes_specified"],
    ["profile-email", client.email, "not_specified"],
    ["profile-phone", client.phone, "not_specified"],
  ];
  for (const [id, value, emptyKey] of fields) {
    document.getElementById(id).textContent = value || t(emptyKey);
  }
}

export function showClientDetails({
  clientId,
  state,
  t,
  showErrorView,
  switchView,
  openWorkoutSetupModal,
  openSessionFromHistory,
  saveSessionAsRoutine,
}) {
  // A repaint after the client was edited arrives without these; the last ones given still apply.
  historyActions = {
    openSessionFromHistory: openSessionFromHistory || historyActions.openSessionFromHistory,
    saveSessionAsRoutine: saveSessionAsRoutine || historyActions.saveSessionAsRoutine,
  };
  const client = state.clients.find((c) => c.id === clientId);
  if (!client) {
    showErrorView(window.location.pathname);
    return;
  }

  activeDetailClientId = clientId;
  const injuryLabel = t("injury_mark_label");
  document.getElementById("detail-client-name").innerHTML = getClientDisplayNameHTML(
    client,
    false,
    injuryLabel,
  );
  document.getElementById("detail-client-avatar").textContent =
    client.avatar || getInitials(client.name);
  document.getElementById("profile-name").innerHTML = getClientDisplayNameHTML(
    client,
    false,
    injuryLabel,
  );
  document.getElementById("profile-joined-date").textContent =
    `${t("joined")} ${formatDateStr(client.joinedDate)}`;
  fillProfileText(client, t);

  renderConsentStatus(client, t);
  renderConsentDelivery(client, client.gdprConsent?.formLang || state.lang, t);

  const aiCopyBtn = document.getElementById("btn-ai-safe-copy");
  if (aiCopyBtn) {
    aiCopyBtn.replaceWith(aiCopyBtn.cloneNode(true));
    document.getElementById("btn-ai-safe-copy").addEventListener("click", () => {
      // What goes in, and what is left out, is domain/aiClientSummary.js's decision.
      const anonymizedSummary = aiClientSummary(client, state.history);
      navigator.clipboard.writeText(anonymizedSummary).then(() => {
        tellInApp({ t, message: t("profile_ai_copied") });
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
      erasedBanner.textContent = t("profile_erased_banner").replace(
        "{date}",
        (client.erasure.erasedAt || "").substring(0, 10),
      );
    }
  }

  // What an erased record can still DO: be read. Every action on this page assumes a person — edit
  // their details, plan their programme, hand them their data, erase them again — and the page went
  // on offering all five afterwards, including an export that opened on three logged workouts for
  // somebody the app had just stopped being able to name. The anonymised history below stays: that
  // is what an erasure keeps on purpose.
  const erased = isErased(client);
  for (const id of ["btn-edit-client", "client-detail-actions"]) {
    const el = document.getElementById(id);
    if (el) el.hidden = erased;
  }

  const planBtn = document.getElementById("btn-plan-client-program");
  if (planBtn) {
    planBtn.replaceWith(planBtn.cloneNode(true));
    document.getElementById("btn-plan-client-program").addEventListener("click", () => {
      openWorkoutSetupModal(clientId, null, null, true);
    });
  }

  renderClientWorkoutHistory({ client, state, t, ...historyActions });
  switchView("client-detail");
}

// The badge answers the two questions a trainer is actually asked: did they consent, and to WHICH
// wording. `consentDate` is the date on the signed paper; a record predating that field falls back
// to the write timestamp's date (see clientConsentSection.js).
//
// Every label below is a local const, escaped where it is built: the HTML-sink audit reads the
// escaping at the interpolation site (build/frontend_audit.py).
function renderConsentStatus(client, t) {
  const statusEl = document.getElementById("profile-gdpr-status");
  if (!statusEl) return;

  const consent = client.gdprConsent;
  if (isConsentWithdrawn(consent)) {
    // Distinct from "never consented": processing must stop for both, but only one of them is a
    // client the trainer must still be able to prove once agreed (Art. 7(1)).
    // Both dates say which one they are. They used to be joined by an arrow alone — "2026-06-15 →
    // 2026-09-30" — and a reader had to guess which end was the signature and which the withdrawal,
    // on the one line that has to be right if a supervisory authority ever asks.
    const dates = [
      [t("consent_date_label"), consentSignedDate(consent)],
      [t("consent_withdrawn_label"), consent.withdrawnDate],
    ]
      .filter(([, value]) => Boolean(value))
      .map(([label, value]) => `${label}: ${value}`)
      .join(" · ");
    const safeLabel = escapeHTML(t("consent_badge_withdrawn").replace("{dates}", dates));
    statusEl.innerHTML = `<span class="badge badge-warning"><i class="fa-solid fa-ban mr-1"></i> ${safeLabel}</span>`;
    return;
  }
  if (!isConsentActive(consent)) {
    const safeLabel = escapeHTML(t("consent_badge_none"));
    statusEl.innerHTML = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ${safeLabel}</span>`;
    return;
  }

  const signedOn = consentSignedDate(consent);
  const detail = [signedOn, consent.formVersion && `v${consent.formVersion}`]
    .filter(Boolean)
    .join(" · ");
  const safeLabel = escapeHTML(
    t("consent_badge_given").replace("{detail}", detail || t("consent_badge_verified")),
  );
  statusEl.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-check mr-1"></i> ${safeLabel}</span>`;
}

// The language the client was (or will be) sent the form in — their recorded one if there is one,
// otherwise the trainer's UI language, same default the dialog's selector offers.
function renderConsentDelivery(client, lang, t) {
  const mailtoBtn = document.getElementById("btn-send-consent-email");
  if (!mailtoBtn) return;

  const href = consentEmailHref(client, lang, readTrainerIdentity());
  mailtoBtn.href = href || "#";
  mailtoBtn.classList.toggle("disabled", !href);
  // The label carries the reason, not only the tooltip — a phone cannot hover.
  const label = mailtoBtn.querySelector("span");
  if (label) label.textContent = t(href ? "profile_send_consent" : "consent_no_email");
}

export function renderClientWorkoutHistory({
  client,
  state,
  t,
  openSessionFromHistory,
  saveSessionAsRoutine,
}) {
  const container = document.getElementById("client-history-list");
  if (!container) return;
  container.innerHTML = "";

  // Excludes isPlanning drafts — this widget is the client's actual workout history, not their
  // in-progress plans, which the notification area offers to resume.
  const clientHistory = state.history
    .filter((log) => log.clientId === client.id && !log.isPlanning)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (clientHistory.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted text-sm">${t("no_workouts_logged")}</div>`;
    return;
  }

  renderHistoryItems({
    historyList: clientHistory,
    container,
    t,
    openSessionFromHistory,
    saveAsRoutine: saveSessionAsRoutine,
  });
}
