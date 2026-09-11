// src/modules/clients/intakeInviteDialog.js — sending the intake link to one particular person
// (TODO §26.3 step 2).
//
// Single responsibility: take the one thing the trainer has — a number or an address — and put the
// invitation into the phone's own composer, addressed. What the link says is intakeInvite.js; which
// channel a typed contact implies is domain/contactChannel.js; nothing here creates a record.
//
// **One field for both channels.** A trainer who has just been asked about training is holding one
// contact detail, and the text of it already says which kind it is. Two fields would be two chances
// to fill in the wrong one, with a phone in one hand.
//
// **The composer opens; this app never sends.** `sms:` and `mailto:` hand the message to the
// trainer's own messaging app with the words already in it, and they press send there. So the
// invitation leaves from their number, lands in their sent items, and LibrePT touches no carrier and
// no mail server — the same arrangement the consent letter uses, for the same reason.
//
// **The share sheet stays** as the second way out: it reaches WhatsApp, Viber, Signal and everything
// else the phone has, and it is the only route that needs no contact detail at all. The order is
// §26.3's — the addressed send first now that there is somewhere to address it, the sheet behind it.
//
// **Nothing is stored.** The contact typed here is used to build one link and is gone when the
// dialog closes: a person exists in the register only once they have sent their own details and the
// trainer has accepted them (§26.5), and a half-remembered phone number sitting in storage would be
// a client record nobody consented to.
//
// Injected dependencies: `t`, `getLang()`, `getTrainer()` (who signs the invitation) and `onShare()`
// (the share-sheet/clipboard route, so this module owns no `navigator`).

import { closeModal, openModal, renderMarkupOnce } from "../common/dom.js";
import { qrCodePath } from "../common/qrCode.js";
import { intakeInviteHref, intakeInviteUrl } from "./intakeInvite.js";

let deps = null;

export function initIntakeInviteDialog(injected) {
  deps = injected;
}

export function renderIntakeInviteDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-intake-invite"),
    `
<dialog id="dialog-intake-invite" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="intake-invite-title"></h3>
    <button class="modal-close-btn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="intake-invite-lede" class="text-sm"></p>
    <label class="form-label" for="intake-invite-contact" id="intake-invite-contact-label"></label>
    <input type="text" id="intake-invite-contact" class="form-input" autocomplete="off"
           inputmode="email" enterkeyhint="send" />
    <p id="intake-invite-channel" class="text-sm intake-invite-channel"></p>
    <div class="modal-actions intake-invite-actions">
      <a id="intake-invite-send" class="btn primary-btn disabled" role="button"><span></span></a>
      <button type="button" class="btn secondary-btn" id="intake-invite-share"></button>
    </div>
    <input type="text" id="intake-invite-link" class="form-input hidden" readonly />
    <!-- The code the trainer holds up, for the person standing in front of them: no number typed,
         no address spelled out, no channel at all (TODO §26.3 step 3). White ground and black
         modules whatever the theme is set to - this is a picture for somebody else's camera, not a
         surface of this app.
         DRAWN ON OPEN, with nothing to tap first (asked 2026-09-11). It was behind a button until
         then, guarded against a code left up from the last invitation being scanned by the next
         person - and that guard protected nothing: the code carries the TRAINER and names no
         client, so it is the same code for everybody. A route that needs no typing should not need
         a tap to appear either. -->
    <div id="intake-invite-qr" class="intake-invite-qr">
      <svg id="intake-invite-qr-svg" class="intake-invite-qr-svg" role="img" viewBox="0 0 1 1">
        <path id="intake-invite-qr-path"></path>
      </svg>
      <p id="intake-invite-qr-hint" class="text-sm"></p>
    </div>
  </div>
</dialog>
`,
  );
}

/** The send control, kept in step with what has been typed.
 *
 * A disabled-looking anchor rather than a hidden one, and a line under the field saying which way it
 * will go: "there is a way to send this, you have just not given me somewhere to send it" is the
 * useful message, and on a phone it has to be on screen rather than in a tooltip (§7.2).
 */
function syncSendControl() {
  const { t } = deps;
  const contact = document.getElementById("intake-invite-contact")?.value || "";
  const ready = intakeInviteHref({
    contact,
    lang: deps.getLang(),
    t,
    trainer: deps.getTrainer?.(),
  });
  const anchor = document.getElementById("intake-invite-send");
  const label = anchor?.querySelector("span");
  const channelLine = document.getElementById("intake-invite-channel");

  anchor?.classList.toggle("disabled", !ready);
  // WHICH channel, said in a way that is not a sentence. The button's words change with the contact
  // the trainer typed — a number gets a text message, an address gets an email — and until
  // 2026-08-30 the demo asserted that by reading those words, so the story could not be completed in
  // any language but English (TODO §38.19). What the app chose is a fact about the app, not a
  // translation of one.
  if (anchor) anchor.dataset.channel = ready ? ready.channel : "";
  if (ready) anchor?.setAttribute("href", ready.href);
  else anchor?.removeAttribute("href");
  if (label) {
    label.textContent = ready
      ? t(ready.channel === "sms" ? "intake_invite_send_sms" : "intake_invite_send_email")
      : t("intake_invite_send_disabled");
  }
  if (channelLine) {
    channelLine.textContent = ready
      ? t(ready.channel === "sms" ? "intake_invite_opens_sms" : "intake_invite_opens_email")
      : t("intake_invite_needs_contact");
  }
}

export function openIntakeInviteDialog() {
  renderIntakeInviteDialog();
  const { t } = deps;

  for (const [id, key] of [
    ["intake-invite-title", "intake_invite_title"],
    ["intake-invite-lede", "intake_invite_lede"],
    ["intake-invite-contact-label", "intake_invite_contact_label"],
    ["intake-invite-share", "intake_invite_other_ways"],
  ]) {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
  }

  document.getElementById("intake-invite-qr-hint").textContent = t("intake_invite_qr_hint");
  document
    .getElementById("intake-invite-qr-svg")
    .setAttribute("aria-label", t("intake_invite_qr_label"));
  showCode();

  const field = document.getElementById("intake-invite-contact");
  // Emptied on every open: this is the next person, not the last one, and a number left in the box
  // is how the wrong client gets invited twice.
  field.value = "";
  field.oninput = () => syncSendControl();
  document.getElementById("intake-invite-link").classList.add("hidden");
  syncSendControl();

  document.getElementById("intake-invite-share").onclick = () => shareAnyWay();
  document.querySelector("#dialog-intake-invite .modal-close-btn").onclick = () =>
    closeModal("dialog-intake-invite");

  openModal("dialog-intake-invite");
  field.focus();
}

/** The code on the trainer's own screen, as the alternative to typing anything at all (§26.4).
 *
 * **Drawn here rather than printed on a leaflet.** A static QR is the same file for every install,
 * so it can carry no `#from=` — it would name nobody, which is the state the intake page was
 * deliberately moved out of. This one carries the trainer's name, number and address, so the person
 * scanning it sees who it is from and can save the contact.
 *
 * Redrawn on every open rather than once, because the trainer's own name, number and address and the
 * app's language are all settings they can change between one invitation and the next.
 */
function showCode() {
  const url = intakeInviteUrl({ lang: deps.getLang(), trainer: deps.getTrainer?.() });
  const code = qrCodePath(url);
  if (!code) return;
  document.getElementById("intake-invite-qr-svg").setAttribute("viewBox", code.viewBox);
  document.getElementById("intake-invite-qr-path").setAttribute("d", code.d);
}

/** The way out that needs no contact detail: the phone's own share sheet, the clipboard behind it,
 * and the link on screen when a browser refuses both — a trainer standing in front of somebody is
 * never left with nothing (§26.3). */
async function shareAnyWay() {
  const outcome = await deps.onShare();
  const said = {
    shared: "intake_invite_sent",
    copied: "intake_invite_copied",
    unavailable: "intake_invite_ready",
  }[outcome];
  const button = document.getElementById("intake-invite-share");
  if (said) {
    button.textContent = deps.t(said);
    button.dataset.inviteSaid = outcome;
  }
  if (outcome === "unavailable") {
    const field = document.getElementById("intake-invite-link");
    field.value = intakeInviteUrl({ lang: deps.getLang(), trainer: deps.getTrainer?.() });
    field.classList.remove("hidden");
    field.select();
  }
}
