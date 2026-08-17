// src/modules/intake/intakeView.js — the page a prospective client fills in on their own phone
// (TODO §1.7/§26).
//
// Single responsibility: the form and its two send buttons. What a submission IS is
// data/clientSignup.js, the artifact is data/signupFile.js, and handing it over is
// signupDelivery.js — this module collects input and reports what happened.
//
// **This is the only surface in LibrePT whose user is not the trainer.** Everything about it follows
// from that:
//
// - **It is stateless by design** (§26.1). The client's phone gets no database, no demo seed, no
//   service worker and no first-run agreement — appBoot's `bootIntake` is a separate boot path
//   precisely so none of that runs. Nothing the client types is persisted anywhere; it exists in the
//   form until they send it, and then in the file they sent. A stranger who fills this in and walks
//   away leaves nothing behind on their own device.
// - **The client chooses their own language**, because it is the language their consent is given in
//   (`formLang`) and the one the notice they are agreeing to is written in. It is not inherited from
//   whatever the trainer's device was set to.
// - **Goals and an injury are offered, never demanded** (ruled 2026-08-17). Both are optional, both
//   say so on screen, and the copy states where the answer goes — a person disclosing a knee
//   reconstruction to someone they have not trained with yet is entitled to know that.
// - **Consent is stamped with what they were actually shown**: today's date on THEIR calendar, the
//   wording version live at that moment, and the language of the notice they read. Art. 7(1) needs
//   consent to be demonstrable, and a date typed later by the trainer demonstrates nothing.
//
// **Static markup, values read from inputs.** Nothing is interpolated into HTML, so there is no
// escaping question anywhere in this file (build/frontend_audit.py) even though every field is
// stranger-supplied text.
//
// Injected dependencies: `t`, `lang`, `onChooseLanguage`, `platform`, `todayIso`, `consentVersion`,
// `noticeUrlFor`, `formUrlFor`.

import { buildClientSignup } from "../../data/clientSignup.js";
import { $id, renderMarkupOnce } from "../common/dom.js";
import {
  buildSignupFile,
  canShareSignupFile,
  saveSignupFile,
  shareSignupFile,
} from "./signupDelivery.js";

export function renderIntakeViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-intake"),
    `
<section id="view-intake" class="app-view intake-view">
      <header class="intake-header">
        <p class="intake-brand">Libre<span class="intake-brand-accent">PT</span></p>
        <div class="intake-langs" id="intake-langs">
          <button type="button" class="intake-lang" data-intake-lang="en" lang="en">English</button>
          <button type="button" class="intake-lang" data-intake-lang="sl" lang="sl">Slovenščina</button>
        </div>
      </header>

      <h1 id="intake-title" class="intake-title"></h1>
      <p id="intake-lede" class="intake-lede"></p>

      <form id="intake-form" class="intake-form" novalidate>
        <div class="form-group">
          <label id="intake-name-label" for="intake-name"></label>
          <input type="text" id="intake-name" class="form-control" autocomplete="name" required>
        </div>
        <div class="form-group">
          <label id="intake-email-label" for="intake-email"></label>
          <input type="email" id="intake-email" class="form-control" autocomplete="email" inputmode="email">
        </div>
        <div class="form-group">
          <label id="intake-phone-label" for="intake-phone"></label>
          <input type="tel" id="intake-phone" class="form-control" autocomplete="tel" inputmode="tel">
        </div>
        <p id="intake-contact-hint" class="intake-hint"></p>

        <div class="form-group">
          <label id="intake-goals-label" for="intake-goals"></label>
          <textarea id="intake-goals" class="form-control" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label id="intake-injury-label" for="intake-injury"></label>
          <textarea id="intake-injury" class="form-control" rows="3"></textarea>
          <p id="intake-health-hint" class="intake-hint"></p>
        </div>

        <div class="intake-consent">
          <label class="intake-consent-row" for="intake-consent">
            <input type="checkbox" id="intake-consent">
            <span id="intake-consent-label"></span>
          </label>
          <p class="intake-consent-links">
            <a id="intake-notice-link" href="#" target="_blank" rel="noopener"></a>
            <span aria-hidden="true"> · </span>
            <a id="intake-form-link" href="#" target="_blank" rel="noopener"></a>
          </p>
        </div>

        <p id="intake-status" class="intake-status" role="status" hidden></p>

        <div class="intake-actions">
          <!-- The .hidden CLASS (index.css, display:none !important), NOT the hidden attribute:
               every .btn in this app sets display:flex, which beats the UA stylesheet's
               [hidden] rule. A test-first medium case caught it — the property was set, the
               attribute was in the DOM, and the button was on screen anyway, so a desktop visitor
               would have been offered a share that cannot work.
               (No backticks in this comment: the markup is a template literal.) -->
          <button type="button" id="intake-send" class="btn primary-btn intake-btn hidden"></button>
          <button type="button" id="intake-save" class="btn secondary-btn intake-btn"></button>
        </div>
        <p id="intake-privacy-note" class="intake-hint intake-privacy-note"></p>
      </form>
    </section>
`,
  );
}

// Every visible string in one place, so the language switch is a single re-render rather than a
// scatter of textContent writes in the handlers below.
const TEXT_BY_ELEMENT = {
  "intake-title": "intake_title",
  "intake-lede": "intake_lede",
  "intake-name-label": "intake_name",
  "intake-email-label": "intake_email",
  "intake-phone-label": "intake_phone",
  "intake-contact-hint": "intake_contact_hint",
  "intake-goals-label": "intake_goals",
  "intake-injury-label": "intake_injury",
  "intake-health-hint": "intake_health_hint",
  "intake-consent-label": "intake_consent",
  "intake-notice-link": "intake_notice_link",
  "intake-form-link": "intake_form_link",
  "intake-send": "intake_send",
  "intake-save": "intake_save",
  "intake-privacy-note": "intake_privacy_note",
};

function setStatus(t, key, tone) {
  const status = $id("intake-status");
  if (!status) return;
  status.hidden = !key;
  status.textContent = key ? t(key) : "";
  status.classList.toggle("is-error", tone === "error");
  status.classList.toggle("is-done", tone === "done");
}

/** What the client typed, as a submission — or null, with the reason already on screen. The refusals
 *  are the form's own rules, checked here rather than left to `required` attributes: a native
 *  validation bubble is unreadable at arm's length and disappears on the next tap. */
function readForm(t, { todayIso, consentVersion, lang }) {
  const consentTicked = $id("intake-consent")?.checked === true;
  const signup = buildClientSignup({
    name: $id("intake-name")?.value,
    email: $id("intake-email")?.value,
    phone: $id("intake-phone")?.value,
    goals: $id("intake-goals")?.value,
    injury: $id("intake-injury")?.value,
    gdprConsent: consentTicked
      ? {
          cloudSync: true,
          // The client's own calendar date, not UTC — the same correction made for trainer-captured
          // consent on 2026-08-10. A person in Ljubljana signing at 00:30 signed today, not yesterday.
          consentDate: todayIso(),
          formVersion: consentVersion,
          formLang: lang(),
        }
      : null,
  });

  if (!signup) {
    setStatus(t, "intake_err_identity", "error");
    return null;
  }
  // Consent is refused as a separate message, because "you left a field blank" and "you have not
  // agreed to anything yet" are different problems and a single generic error would hide which.
  if (!consentTicked) {
    setStatus(t, "intake_err_consent", "error");
    return null;
  }
  return signup;
}

export function setupIntakeForm(deps) {
  const {
    t,
    lang,
    onChooseLanguage,
    platform,
    todayIso,
    consentVersion,
    noticeUrlFor,
    formUrlFor,
  } = deps;

  function applyLanguage() {
    const current = lang();
    document.documentElement.lang = current;
    for (const [id, key] of Object.entries(TEXT_BY_ELEMENT)) {
      const element = $id(id);
      if (element) element.textContent = t(key);
    }
    const notice = $id("intake-notice-link");
    if (notice) notice.href = noticeUrlFor(current);
    const form = $id("intake-form-link");
    if (form) form.href = formUrlFor(current);

    for (const button of document.querySelectorAll("[data-intake-lang]")) {
      button.classList.toggle("is-active", button.dataset.intakeLang === current);
      button.setAttribute("aria-pressed", String(button.dataset.intakeLang === current));
    }
  }

  function currentFile() {
    const signup = readForm(t, { todayIso, consentVersion, lang });
    if (!signup) return null;
    return buildSignupFile(signup, todayIso());
  }

  for (const button of document.querySelectorAll("[data-intake-lang]")) {
    button.addEventListener("click", () => {
      onChooseLanguage(button.dataset.intakeLang);
      applyLanguage();
    });
  }

  $id("intake-send")?.addEventListener("click", async () => {
    const file = currentFile();
    if (!file) return;
    const outcome = await shareSignupFile(file, {
      title: t("intake_share_title"),
      text: t("intake_share_text"),
      platform,
    });
    // A cancelled share leaves the form exactly as it was, with nothing said: the client chose to
    // stop, and telling them something went wrong would be false.
    if (outcome.delivered) setStatus(t, "intake_sent", "done");
    else if (!outcome.cancelled) setStatus(t, "intake_send_failed", "error");
  });

  $id("intake-save")?.addEventListener("click", () => {
    const file = currentFile();
    if (!file) return;
    saveSignupFile(file, platform);
    setStatus(t, "intake_saved", "done");
  });

  applyLanguage();
  // The one-tap route is offered only where the platform actually has it — on a desktop or an older
  // iPhone the save button is the whole flow, and a share button that throws would be worse than
  // its absence. Probed with a real file so the answer is about THIS file type, not about sharing
  // in general.
  const probe = buildSignupFile({ v: 1, name: "probe", email: "probe@example.com" }, todayIso());
  const send = $id("intake-send");
  // The `.hidden` CLASS, for the reason spelled out in the markup above: `.btn { display: flex }`
  // overrides the `hidden` attribute, so setting the property alone leaves the button on screen.
  if (send) send.classList.toggle("hidden", !canShareSignupFile(probe, platform));
}
