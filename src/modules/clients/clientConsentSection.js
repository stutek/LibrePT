// src/modules/clients/clientConsentSection.js — the GDPR consent block inside the Add/Edit Client
// dialog: the signed-checkbox, the date the client actually signed, the two delivery buttons
// (email compose / SMS link), and the "who keeps the paper" info dialog.
//
// Single responsibility: everything about consent INSIDE the client form. The controller
// (controllers/clientFormsController.js) owns the rest of the form and calls in here to render,
// fill, and read back the block, so consent wording and consent storage shape live in one place
// instead of being spliced through the save handler.
//
// Two decisions worth not re-deriving:
//   * The DATE is a real field, not the write timestamp. Consent lives on paper (TODO §3.5) and the
//     paper is routinely signed before anyone opens the app — at the first session, on a clipboard
//     at the desk. An invisible `timestamp` of when a checkbox got ticked is not the date the
//     client consented, and it is the client's date a supervisory authority asks about.
//   * The archiving reminder is a DIALOG, not a `title` tooltip. This app is used on a phone, where
//     a tooltip is unreachable (AGENT_RULES §2.D.1) — and "you, not LibrePT, hold the signed form"
//     is exactly the sentence a trainer must not be able to miss.
//
// deps: injected { t } via initClientConsentSection; reads/writes only its own form controls.

import {
  consentSignedDate,
  isConsentActive,
  isConsentWithdrawn,
  withdrawConsent,
} from "../../data/clientConsent.js";
import { CONSENT_LANG_LABELS } from "../../i18n/consent/index.js";
import {
  CONSENT_FORM_VERSION,
  consentEmailHref,
  consentSmsHref,
  resolveConsentLang,
} from "../common/consentForm.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../common/dom.js";

let translate = (_key, fallback) => fallback;
// An accessor, not a value: the trainer can switch UI language between two openings of the dialog,
// and the default offered has to follow (AGENT_RULES §5.3).
let readUiLang = () => null;
// The client currently in the form, so a language change can rebuild the delivery links without the
// controller having to re-open the dialog.
let editedClient = null;

export function initClientConsentSection({ t, getLang } = {}) {
  if (typeof t === "function") translate = (key, fallback) => t(key) || fallback;
  if (typeof getLang === "function") readUiLang = getLang;
}

// Inlined into the client dialog's form markup rather than injected afterwards, so the block is
// part of the same `renderMarkupOnce` pass and cannot render half a form.
export function consentSectionMarkup() {
  return `
      <fieldset class="consent-fieldset">
        <legend id="client-consent-legend">Data Protection (GDPR)</legend>

        <div class="form-group checkbox-group consent-checkbox">
          <input type="checkbox" id="client-gdpr-consent" class="form-checkbox">
          <label for="client-gdpr-consent" id="label-client-gdpr-consent">
            Client signed the consent form (data storage &amp; cloud sync)
          </label>
        </div>

        <div class="form-group consent-date-group" id="client-consent-date-group" hidden>
          <label for="client-consent-date" id="label-client-consent-date">Date signed</label>
          <input type="date" id="client-consent-date" class="form-control">
          <p class="consent-meta" id="client-consent-version"></p>
        </div>

        <div class="form-group consent-date-group" id="client-withdrawn-date-group" hidden>
          <label for="client-withdrawn-date" id="label-client-withdrawn-date">Date withdrawn</label>
          <input type="date" id="client-withdrawn-date" class="form-control">
          <p class="consent-meta" id="client-withdrawn-note"></p>
        </div>

        <div class="form-group consent-lang-group">
          <label for="client-consent-lang" id="label-client-consent-lang">Form language</label>
          <select id="client-consent-lang" class="form-control">
${Object.entries(CONSENT_LANG_LABELS)
  .map(([code, label]) => `            <option value="${code}">${label}</option>`)
  .join("\n")}
          </select>
        </div>

        <div class="consent-actions">
          <a id="btn-consent-email" class="btn secondary-btn btn-sm">
            <i class="fa-solid fa-envelope"></i> <span id="btn-consent-email-text">Email form</span>
          </a>
          <a id="btn-consent-sms" class="btn secondary-btn btn-sm">
            <i class="fa-solid fa-comment"></i> <span id="btn-consent-sms-text">Send link by SMS</span>
          </a>
          <button type="button" id="btn-consent-info" class="btn secondary-btn btn-sm" aria-haspopup="dialog">
            <i class="fa-solid fa-circle-info"></i> <span id="btn-consent-info-text">Who keeps the form?</span>
          </button>
        </div>
      </fieldset>
`;
}

export function renderConsentInfoDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-consent-info"),
    `
<dialog id="dialog-consent-info" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="consent-info-title">You keep the signed form</h3>
      <button class="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body consent-info-body">
      <p id="consent-info-body-text">LibrePT records only that consent was given and on which date — never a photo, scan, or signature. As the data controller you are responsible for archiving the signed form yourself, for as long as you hold this client's records, so you can prove the consent if you are ever asked to. If the client withdraws consent, untick the box above — that records the withdrawal and stops further processing while keeping proof that consent was once given. Withdrawal is not the same as erasure: delete their records only if they ask you to.</p>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn primary-btn modal-cancel" id="btn-consent-info-close">Got it</button>
    </div>
  </dialog>
`,
  );
}

export function setupClientConsentSection() {
  renderConsentInfoDialog();

  const checkbox = $id("client-gdpr-consent");
  if (checkbox) checkbox.addEventListener("change", () => syncConsentDateVisibility());

  const langSelect = $id("client-consent-lang");
  if (langSelect) langSelect.addEventListener("change", () => applyDeliveryLinks(editedClient));

  const infoBtn = $id("btn-consent-info");
  if (infoBtn) infoBtn.addEventListener("click", () => openModal("dialog-consent-info"));

  const infoDialog = $id("dialog-consent-info");
  if (infoDialog) {
    for (const closer of infoDialog.querySelectorAll(".modal-cancel, .modal-close-btn")) {
      closer.addEventListener("click", () => closeModal("dialog-consent-info"));
    }
  }
}

export function todayDateString() {
  return new Date().toISOString().substring(0, 10);
}

// Called on every dialog open (add and edit alike): `form.reset()` restores the checkbox but not
// the derived visibility or the delivery hrefs, both of which depend on the record being edited.
export function fillConsentSection(client) {
  editedClient = client;
  const consent = client?.gdprConsent;
  const checkbox = $id("client-gdpr-consent");
  if (checkbox) checkbox.checked = Boolean(consent?.cloudSync);

  const dateInput = $id("client-consent-date");
  if (dateInput) dateInput.value = consent?.consentDate || legacyConsentDate(consent) || "";

  const langSelect = $id("client-consent-lang");
  // A client already sent the form in one language keeps it — re-sending in a language they did not
  // read the first time is worse than not re-sending. Otherwise the UI language, which is the right
  // guess for a trainer's local clientele and wrong only for the exceptions they can see on screen.
  if (langSelect) langSelect.value = resolveConsentLang(consent?.formLang || readUiLang());

  syncConsentDateVisibility(consent?.formVersion);
  syncWithdrawalVisibility(consent);
  applyDeliveryLinks(client);
}

export function withdrawalDateFromSection() {
  return $id("client-withdrawn-date")?.value || todayDateString();
}

// Shown only when there is something to end or something already ended. A date-withdrawn field on a
// client who never consented is a question with no meaning, and on the Add dialog it is noise in a
// form a trainer fills in with a client waiting.
function syncWithdrawalVisibility(consent) {
  const group = $id("client-withdrawn-date-group");
  const dateInput = $id("client-withdrawn-date");
  const note = $id("client-withdrawn-note");
  if (!group || !dateInput) return;

  const withdrawn = isConsentWithdrawn(consent);
  group.hidden = !withdrawn;
  dateInput.value = withdrawn ? consent.withdrawnDate : "";

  if (note) {
    // The signed date is what a supervisory authority asks about, so it stays legible next to the
    // withdrawal rather than being replaced by it.
    const signed = consentSignedDate(consent);
    note.textContent =
      withdrawn && signed ? `${translate("consent_date_label", "Date signed")}: ${signed}` : "";
  }
}

export function selectedConsentLang() {
  return resolveConsentLang($id("client-consent-lang")?.value || readUiLang());
}

// Records written before the date field existed carry only the ISO write timestamp. Showing its
// date part beats showing nothing: it is the closest thing to a consent date those records have,
// and the trainer can correct it in the field it now appears in.
function legacyConsentDate(consent) {
  return typeof consent?.timestamp === "string" ? consent.timestamp.substring(0, 10) : "";
}

function syncConsentDateVisibility(storedVersion) {
  const checkbox = $id("client-gdpr-consent");
  const group = $id("client-consent-date-group");
  if (!checkbox || !group) return;

  group.hidden = !checkbox.checked;
  if (!checkbox.checked) return;

  const dateInput = $id("client-consent-date");
  if (dateInput && !dateInput.value) dateInput.value = todayDateString();

  const versionEl = $id("client-consent-version");
  if (versionEl) {
    const label = translate("consent_form_version", "Consent form version");
    versionEl.textContent = `${label}: ${storedVersion || CONSENT_FORM_VERSION}`;
  }
}

// A disabled-looking anchor rather than a hidden one: "there is a way to send this, you just have
// no phone number for them yet" is the useful message, and it explains itself in the label instead
// of only in a tooltip no touch device can reach.
function applyDeliveryLinks(client) {
  const lang = selectedConsentLang();
  applyDeliveryLink($id("btn-consent-email"), consentEmailHref(client, lang), {
    ready: translate("consent_send_email", "Email form"),
    missing: translate("consent_no_email", "No email on file"),
  });
  applyDeliveryLink($id("btn-consent-sms"), consentSmsHref(client, lang), {
    ready: translate("consent_send_sms", "Send link by SMS"),
    missing: translate("consent_no_phone", "No phone on file"),
  });
}

function applyDeliveryLink(anchor, href, labels) {
  if (!anchor) return;
  const label = anchor.querySelector("span");
  anchor.classList.toggle("disabled", !href);
  if (href) anchor.setAttribute("href", href);
  else anchor.removeAttribute("href");
  if (label) label.textContent = href ? labels.ready : labels.missing;
}

// The shape persisted onto the client record. `timestamp` stays the app-write time (unchanged for a
// client who was already consented), `consentDate` is the date on the paper, and `formVersion`
// pins WHICH wording was signed — an existing consent keeps the version it was given under, so a
// later edit of the address does not silently claim the client agreed to newer text.
export function readConsentFromSection(previousConsent) {
  const consented = Boolean($id("client-gdpr-consent")?.checked);
  if (!consented) {
    // Unticking a client who HAD consent is how a trainer honours a withdrawal, so it records one
    // rather than blanking the record: Art. 7(1) asks them to demonstrate consent was obtained, and
    // the old blank-everything branch destroyed that proof at exactly the moment it was needed
    // (TODO §27.7). A client who never consented still has nothing on file.
    if (isConsentActive(previousConsent)) {
      return withdrawConsent(previousConsent, withdrawalDateFromSection());
    }
    return { cloudSync: false, timestamp: "", consentDate: "", formVersion: "", formLang: "" };
  }

  // Re-ticking is a NEW consent, not an undo: the client signed again, so the stale withdrawal date
  // must not ride along and claim this consent is already over.
  const { withdrawnDate: _endedEarlier, ...priorConsent } = previousConsent || {};

  return {
    ...priorConsent,
    cloudSync: true,
    timestamp: priorConsent.timestamp || new Date().toISOString(),
    consentDate: $id("client-consent-date")?.value || todayDateString(),
    formVersion: priorConsent.formVersion || CONSENT_FORM_VERSION,
    // The language chosen NOW, not the one first recorded: switching it is how a trainer corrects a
    // wrong guess, and the next re-send must follow the correction.
    formLang: selectedConsentLang(),
  };
}
