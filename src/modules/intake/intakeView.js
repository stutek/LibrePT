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
//   away leaves nothing behind on their own device. What they type is held for the life of the TAB
//   (sessionStorage, §38.12), so a reload does not cost them the form; closing the page ends it.
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
import {
  VCARD_MEDIA_TYPE,
  buildTrainerVcard,
  trainerVcardFileName,
} from "../../data/trainerVcard.js";
import { dialledForm } from "../../domain/contactChannel.js";
import { senderFromFragment } from "../../domain/intakeSender.js";
import { $id, renderMarkupOnce } from "../common/dom.js";
import { downloadFile } from "../common/download.js";
import { keepFormDraft } from "../common/formDraft.js";
import {
  buildSignupFile,
  canShareSignupFile,
  saveSignupFile,
  sendSignupFile,
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

      <!-- Who this link says it came from, read from the URL fragment and only ever DISPLAYED
           (domain/intakeSender.js). It proves nothing — anybody can craft a link naming anybody —
           and it is not meant to: it gives the reader something to CHECK, which is the name in the
           message, the name here and the person they just spoke to all agreeing. Without it the
           page asked a stranger for health details while identifying nobody, which is the shape of
           a phishing attempt (asked 2026-08-23). -->
      <div id="intake-sender" class="intake-sender" hidden>
        <p id="intake-sender-for" class="intake-sender-for"></p>
        <!-- The contact itself, tappable (asked 2026-09-11). The client usually does NOT have the
             trainer's number when the invitation arrives: it rides in the signature of a message
             that an email, a forward, or a share sheet keeping the link and dropping the text does
             not carry. This page is then the one place it appears, and a number to be copied off a
             screen with a thumb is one nobody copies. The .hidden CLASS again, not the attribute,
             for the reason spelled out at the buttons below. (No backticks in this comment: the
             markup is a template literal.) -->
        <p class="intake-sender-contact">
          <a id="intake-sender-phone" class="intake-sender-link hidden"></a>
          <a id="intake-sender-email" class="intake-sender-link hidden"></a>
        </p>
        <button type="button" id="intake-sender-save"
                class="btn secondary-btn intake-sender-save hidden"></button>
        <p id="intake-sender-check" class="intake-hint"></p>
      </div>

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
            <input type="checkbox" id="intake-consent" data-draft="never">
            <span id="intake-consent-label"></span>
          </label>
          <p class="intake-consent-links">
            <a id="intake-notice-link" href="#" target="_blank" rel="noopener"></a>
            <span aria-hidden="true"> · </span>
            <a id="intake-form-link" href="#" target="_blank" rel="noopener"></a>
          </p>
        </div>

        <p id="intake-status" class="intake-status" role="status" hidden></p>
        <!-- What the BROWSER said, when a share was refused (TODO §45.4). Kept apart from the
             sentence above because it is not addressed to the same reader: the status line tells the
             client what to do, this tells whoever is helping them WHY, and without it a refusal
             arriving from a stranger's phone carries nothing back at all. Hidden unless there is
             something to say. -->
        <p id="intake-status-detail" class="intake-status-detail" hidden></p>

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
        <!-- The saved file still has to reach somebody, and until 2026-09-11 the page said only
             "share it with your trainer" - leaving a stranger to find an address this page already
             knew. Revealed after the SAVE and not before: an email with nothing attached is the one
             outcome worse than typing the address by hand. Not offered for the share route, which
             has already delivered the file, and not as a text message, which cannot carry one. -->
        <div id="intake-send-to" class="intake-send-to hidden">
          <a id="intake-send-to-email" class="btn primary-btn intake-btn"></a>
          <p id="intake-send-to-hint" class="intake-hint"></p>
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
  "intake-sender-check": "intake_sender_check",
};

function setStatus(t, key, tone, { detail = "", file = "" } = {}) {
  const status = $id("intake-status");
  if (!status) return;
  status.hidden = !key;
  // `{file}` rather than a sentence built by joining: the saved file's name sits mid-sentence in
  // English and at a different place in Slovenian, and a client who has to find it among their
  // downloads needs to read the name this page actually gave it.
  status.textContent = key ? t(key).replace("{file}", file) : "";
  status.classList.toggle("is-error", tone === "error");
  // A warning is its own tone (ruled 2026-09-17): a share that was refused and a file that was saved
  // instead is not a failure to report in red — the client is holding what they need and has one
  // more thing to do. Red would tell them to stop.
  status.classList.toggle("is-warn", tone === "warn");
  status.classList.toggle("is-done", tone === "done");

  // The browser's own words, verbatim and untranslated — a message this app did not write and must
  // not paraphrase. It is the only evidence of a refusal that happened on somebody else's phone.
  const detailLine = $id("intake-status-detail");
  if (!detailLine) return;
  detailLine.hidden = !detail;
  detailLine.textContent = detail ? `${t("intake_send_failed_detail")} ${detail}` : "";
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

/** Who this link says it came from, and how to reach them.
 *
 * **The sentence names one thing, and the contact details are their own lines.** A number written
 * into the middle of a sentence is a number to be read out and typed by hand, which on a phone
 * nobody does; as a `tel:` line it is one tap, and as a saved card it is there tomorrow too.
 *
 * Everything here is a stranger's text (domain/intakeSender.js): it is written with `textContent`,
 * and the two links are BUILT from it rather than taken from it — a crafted address carrying its own
 * `?subject=` must not be able to write the client's mail for them.
 */
function showSender(sender, t) {
  $id("intake-sender-for").textContent = t("intake_sender_for").replace(
    "{who}",
    sender.name || sender.phone || sender.email,
  );

  const phone = $id("intake-sender-phone");
  phone.classList.toggle("hidden", !sender.phone);
  phone.textContent = sender.phone;
  // The written number keeps its spaces on screen and loses them in the link: `dialledForm` is the
  // one place in the app that decides what a dialled number looks like (domain/contactChannel.js).
  phone.href = `tel:${dialledForm(sender.phone)}`;

  const email = $id("intake-sender-email");
  email.classList.toggle("hidden", !sender.email);
  email.textContent = sender.email;
  email.href = `mailto:${encodeURIComponent(sender.email)}`;

  // Offered only when there is a name to put on the card — data/trainerVcard.js says why a nameless
  // one is worse than none.
  const save = $id("intake-sender-save");
  save.textContent = t("intake_sender_save");
  save.classList.toggle("hidden", !buildTrainerVcard(sender));
}

/** The saved file, pre-addressed to the trainer the link named.
 *
 * **A `mailto:` cannot carry the file**, which is the whole shape of this: the composer opens with
 * the address, the subject and a sentence already in it, and the client attaches what they just
 * saved. Offered only when the link carried an address — a text message cannot hold a file at all,
 * so there is no phone equivalent to fall back to.
 *
 * The subject and the body are BUILT here and percent-encoded, because the address is a stranger's
 * text out of a URL fragment: one carrying its own `?body=` must not get to write the message.
 */
function offerToEmailTheTrainer(t, fileName) {
  const sender = senderFromFragment(window.location.hash);
  const box = $id("intake-send-to");
  if (!box) return;
  box.classList.toggle("hidden", !sender?.email);
  if (!sender?.email) return;

  const subject = encodeURIComponent(t("intake_send_to_subject"));
  const body = encodeURIComponent(t("intake_send_to_body"));
  const link = $id("intake-send-to-email");
  link.href = `mailto:${encodeURIComponent(sender.email)}?subject=${subject}&body=${body}`;
  link.textContent = t("intake_send_to_email").replace("{who}", sender.name || sender.email);
  $id("intake-send-to-hint").textContent = t("intake_send_to_hint").replace("{file}", fileName);
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

  // What the saved file was called, so a language switch after the save redraws the pre-addressed
  // email in the language the reader has just asked for rather than leaving half the page behind.
  let savedFileName = null;

  function applyLanguage() {
    const current = lang();
    document.documentElement.lang = current;
    for (const [id, key] of Object.entries(TEXT_BY_ELEMENT)) {
      const element = $id(id);
      if (element) element.textContent = t(key);
    }
    // The sender's own words are theirs, not ours, so they are set apart from the translated line:
    // `{who}` is replaced rather than concatenated, because word order differs between languages.
    const sender = senderFromFragment(window.location.hash);
    const senderBox = $id("intake-sender");
    if (senderBox) {
      senderBox.hidden = !sender;
      if (sender) showSender(sender, t);
    }
    const notice = $id("intake-notice-link");
    if (notice) notice.href = noticeUrlFor(current);
    const form = $id("intake-form-link");
    if (form) form.href = formUrlFor(current);

    for (const button of document.querySelectorAll("[data-intake-lang]")) {
      button.classList.toggle("is-active", button.dataset.intakeLang === current);
      button.setAttribute("aria-pressed", String(button.dataset.intakeLang === current));
    }
    if (savedFileName) offerToEmailTheTrainer(t, savedFileName);
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

  // What she has typed survives a reload — a locked phone, a browser reclaiming memory, a mis-tap on
  // the address bar — and dies with the tab (TODO §38.12). This form is longer than anything else a
  // stranger is asked to fill in on their own phone, and there is no second copy of it anywhere: a
  // reload used to take the name, the email, the phone number and both paragraphs with it. The
  // consent tick is the one field that does NOT come back — agreement is given, not restored.
  const draft = keepFormDraft($id("intake-form"), () => "intake");
  draft.restore();

  // Built on this phone out of what the link carried: nothing is fetched, nothing is sent, and the
  // page stays what it promises to be. Read fresh at tap time rather than closed over, so it cannot
  // hand over a card from a fragment that has since changed.
  $id("intake-sender-save")?.addEventListener("click", () => {
    const sender = senderFromFragment(window.location.hash) || {};
    const card = buildTrainerVcard(sender);
    if (card) downloadFile(card, trainerVcardFileName(sender), VCARD_MEDIA_TYPE);
  });

  $id("intake-send")?.addEventListener("click", async () => {
    const file = currentFile();
    if (!file) return;
    const outcome = await sendSignupFile(file, {
      title: t("intake_share_title"),
      text: t("intake_share_text"),
      platform,
    });
    // A cancelled share leaves the form exactly as it was, with nothing said: the client chose to
    // stop, and telling them something went wrong would be false.
    // Delivered means the form did what it was for. A refused share has left the file in their
    // downloads instead (signupDelivery.js), so what is said here is not "it failed" but where the
    // file is and what to do with it — and the draft STAYS (ruled 2026-09-17), because a reload on
    // the page they are still standing on must not make them type the introduction again.
    if (outcome.delivered) {
      draft.forget();
      setStatus(t, "intake_sent", "done");
    } else if (outcome.saved) {
      setStatus(t, "intake_send_failed_saved", "warn", {
        detail: outcome.reason || "",
        file: file.name,
      });
      savedFileName = file.name;
      offerToEmailTheTrainer(t, savedFileName);
    }
  });

  $id("intake-save")?.addEventListener("click", () => {
    const file = currentFile();
    if (!file) return;
    saveSignupFile(file, platform);
    draft.forget();
    setStatus(t, "intake_saved", "done");
    savedFileName = file.name;
    offerToEmailTheTrainer(t, savedFileName);
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
