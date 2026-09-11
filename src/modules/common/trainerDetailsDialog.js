// src/modules/common/trainerDetailsDialog.js — where the trainer writes down who they are
// (TODO §45.2).
//
// Single responsibility: put a form in front of the three values data/trainerIdentity.js already
// stores — name, phone, email — and hand what was typed back to it. It decides nothing about what
// they are for; every reader of them (the calendar invite's ORGANIZER, the signature on a client
// invitation) already exists and is unchanged by this file.
//
// **Why it had to exist.** The values were reachable from exactly one place, inside the session
// invite dialog, and only two of them: the NAME had no input anywhere in the app while
// intakeInvite.js was already putting it at the top of every invitation a client receives. So the
// app knew how to sign a message with a name it gave the trainer no way to enter — reported by the
// first trainer to use it as "there is nowhere to put my details".
//
// **A setting, so it sits with the settings.** It opens from the app (☰) menu beside language and
// theme rather than from a client screen: it belongs to this install, is entered once, and is not
// about anybody's training.
//
// **An address that is not one is refused, and said so at the field.** This is the opposite of the
// rule inside the invite dialog, which keeps the previously stored address when what was typed does
// not parse — right there, where the trainer is trying to send an invitation and must not be blocked
// by a typo, and wrong here, where silently discarding what somebody deliberately typed into their
// own details would leave them believing it was saved. A blank email is always allowed: not every
// trainer wants replies by mail.
//
// Injected dependencies: `t` (translate), and `read`/`write` over the identity store so a test needs
// no browser storage.

import {
  looksLikeEmail,
  readTrainerIdentity,
  writeTrainerIdentity,
} from "../../data/trainerIdentity.js";
import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

let deps = null;

export function initTrainerDetailsDialog(injected) {
  deps = {
    read: readTrainerIdentity,
    write: writeTrainerIdentity,
    ...injected,
  };
}

export function renderTrainerDetailsDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-trainer-details"),
    `
<dialog id="dialog-trainer-details" class="dialog-modal card glassmorphic">
  <!-- The title and the close button's label are left EMPTY here rather than seeded with English:
       every one of them is written by openTrainerDetailsDialog() from the dictionary, so English in
       the markup would be text no language choice can reach — the defect this same day's §45.1
       fixed on the splash — and would count against agent_tools/ui_strings.py either way. -->
  <div class="modal-header">
    <h3 id="trainer-details-title"></h3>
    <button class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="trainer-details-lede" class="text-sm"></p>
    <div class="form-group">
      <label for="trainer-details-name" id="trainer-details-name-label"></label>
      <input type="text" id="trainer-details-name" class="form-control" autocomplete="name">
    </div>
    <div class="form-group">
      <label for="trainer-details-phone" id="trainer-details-phone-label"></label>
      <input type="tel" id="trainer-details-phone" class="form-control" autocomplete="tel">
    </div>
    <div class="form-group">
      <label for="trainer-details-email" id="trainer-details-email-label"></label>
      <input type="email" id="trainer-details-email" class="form-control" autocomplete="email">
      <p id="trainer-details-email-error" class="text-sm form-error" hidden></p>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="trainer-details-cancel"></button>
      <button type="button" class="btn primary-btn" id="trainer-details-save"></button>
    </div>
  </div>
</dialog>
`,
  );
}

const FIELDS = ["name", "phone", "email"];

function fieldValue(field) {
  return document.getElementById(`trainer-details-${field}`)?.value.trim() || "";
}

/** What the form would store, and what is wrong with it — separated from the saving itself so the
 *  rule can be read, and tested, without a dialog on screen. */
export function trainerDetailsFromForm(values) {
  const email = values.email.trim();
  return {
    details: { name: values.name.trim(), phone: values.phone.trim(), email },
    emailIsUnusable: email !== "" && !looksLikeEmail(email),
  };
}

function save() {
  const { details, emailIsUnusable } = trainerDetailsFromForm({
    name: fieldValue("name"),
    phone: fieldValue("phone"),
    email: fieldValue("email"),
  });

  const error = document.getElementById("trainer-details-email-error");
  error.hidden = !emailIsUnusable;
  if (emailIsUnusable) {
    document.getElementById("trainer-details-email").focus();
    return;
  }

  deps.write(details);
  closeModal("dialog-trainer-details");
}

export function openTrainerDetailsDialog() {
  renderTrainerDetailsDialog();
  const { t } = deps;

  for (const [id, key] of [
    ["trainer-details-title", "trainer_details_title"],
    ["trainer-details-lede", "trainer_details_lede"],
    ["trainer-details-name-label", "trainer_details_name"],
    ["trainer-details-phone-label", "trainer_details_phone"],
    ["trainer-details-email-label", "trainer_details_email"],
    ["trainer-details-email-error", "trainer_details_email_invalid"],
    ["trainer-details-cancel", "btn_cancel"],
    ["trainer-details-save", "trainer_details_save"],
  ]) {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
  }

  // Written here rather than as `data-i18n-label` in the markup: the static mapping pass runs at
  // boot and on a language change, and this dialog's markup does not exist until the first time it
  // is opened — so the attribute would be set on nothing.
  document
    .querySelector("#dialog-trainer-details .modal-close-btn")
    .setAttribute("aria-label", t("close"));

  const stored = deps.read();
  for (const field of FIELDS) {
    document.getElementById(`trainer-details-${field}`).value = stored[field] || "";
  }
  document.getElementById("trainer-details-email-error").hidden = true;

  document.getElementById("trainer-details-cancel").onclick = () =>
    closeModal("dialog-trainer-details");
  document.querySelector("#dialog-trainer-details .modal-close-btn").onclick = () =>
    closeModal("dialog-trainer-details");
  document.getElementById("trainer-details-save").onclick = () => save();

  openModal("dialog-trainer-details");
}
