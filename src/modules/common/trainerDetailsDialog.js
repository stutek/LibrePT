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
// **Two places, one form.** It opens from the app (☰) menu, and it is also offered on the cold-start
// splash beside the three onboarding choices (asked 2026-09-11). The fields, their labels, the
// saving and the one validation rule are built here for both, parameterised by an id prefix — two
// copies of a form is two places for the rule to drift, and the ids have to differ because both can
// exist in the document at once.
//
// **On the splash it is an OFFER, never a gate.** Every field is optional, the three choices beside
// it work whether or not anything was typed, and the form says so in its own words. This app's first
// promise is that there is no account and no signup, and a form on the first screen is exactly what a
// stranger reads as one — so it must be visibly skippable or the promise is broken by the screen that
// makes it.
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

const DIALOG_PREFIX = "trainer-details";
const SPLASH_PREFIX = "splash-trainer";
const FIELDS = ["name", "phone", "email"];

let deps = null;

export function initTrainerDetailsDialog(injected) {
  deps = {
    read: readTrainerIdentity,
    write: writeTrainerIdentity,
    ...injected,
  };
}

/** The three fields, for either host.
 *
 * Nothing carries English text: every label is written from the dictionary by `applyFieldLabels`.
 * Markup that seeded its own English would be text no language choice can reach — the §45.1 defect
 * — and agent_tools/ui_strings.py counts it as one either way.
 */
function fieldsHtml(prefix) {
  return `
    <div class="form-group">
      <label for="${prefix}-name" id="${prefix}-name-label"></label>
      <input type="text" id="${prefix}-name" class="form-control" autocomplete="name">
    </div>
    <div class="form-group">
      <label for="${prefix}-phone" id="${prefix}-phone-label"></label>
      <input type="tel" id="${prefix}-phone" class="form-control" autocomplete="tel">
    </div>
    <div class="form-group">
      <label for="${prefix}-email" id="${prefix}-email-label"></label>
      <input type="email" id="${prefix}-email" class="form-control" autocomplete="email">
      <p id="${prefix}-email-error" class="text-sm form-error" hidden></p>
    </div>`;
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function applyFieldLabels(prefix) {
  const { t } = deps;
  setText(`${prefix}-name-label`, t("trainer_details_name"));
  setText(`${prefix}-phone-label`, t("trainer_details_phone"));
  setText(`${prefix}-email-label`, t("trainer_details_email"));
  setText(`${prefix}-email-error`, t("trainer_details_email_invalid"));
}

function prefillFields(prefix) {
  const stored = deps.read();
  for (const field of FIELDS) {
    const input = document.getElementById(`${prefix}-${field}`);
    if (input) input.value = stored[field] || "";
  }
  document.getElementById(`${prefix}-email-error`).hidden = true;
}

function fieldValue(prefix, field) {
  return document.getElementById(`${prefix}-${field}`)?.value.trim() || "";
}

/** What the form would store, and what is wrong with it — separated from the saving itself so the
 *  rule can be read, and tested, without a form on screen. */
export function trainerDetailsFromForm(values) {
  const email = values.email.trim();
  return {
    details: { name: values.name.trim(), phone: values.phone.trim(), email },
    emailIsUnusable: email !== "" && !looksLikeEmail(email),
  };
}

/** Stores what was typed, or refuses and says why. Returns whether it stored. */
function saveFields(prefix) {
  const { details, emailIsUnusable } = trainerDetailsFromForm({
    name: fieldValue(prefix, "name"),
    phone: fieldValue(prefix, "phone"),
    email: fieldValue(prefix, "email"),
  });

  document.getElementById(`${prefix}-email-error`).hidden = !emailIsUnusable;
  if (emailIsUnusable) {
    document.getElementById(`${prefix}-email`).focus();
    return false;
  }

  deps.write(details);
  return true;
}

export function renderTrainerDetailsDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-trainer-details"),
    `
<dialog id="dialog-trainer-details" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="trainer-details-title"></h3>
    <button class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="trainer-details-lede" class="text-sm"></p>
    ${fieldsHtml(DIALOG_PREFIX)}
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="trainer-details-cancel"></button>
      <button type="button" class="btn primary-btn" id="trainer-details-save"></button>
    </div>
  </div>
</dialog>
`,
  );
}

export function openTrainerDetailsDialog() {
  renderTrainerDetailsDialog();
  const { t } = deps;

  setText("trainer-details-title", t("trainer_details_title"));
  setText("trainer-details-lede", t("trainer_details_lede"));
  setText("trainer-details-cancel", t("btn_cancel"));
  setText("trainer-details-save", t("trainer_details_save"));
  applyFieldLabels(DIALOG_PREFIX);

  // Written here rather than as `data-i18n-label` in the markup: the static mapping pass runs at
  // boot and on a language change, and this dialog's markup does not exist until the first time it
  // is opened — so the attribute would be set on nothing.
  const close = document.querySelector("#dialog-trainer-details .modal-close-btn");
  close.setAttribute("aria-label", t("close"));
  close.onclick = () => closeModal("dialog-trainer-details");

  prefillFields(DIALOG_PREFIX);
  document.getElementById("trainer-details-cancel").onclick = () =>
    closeModal("dialog-trainer-details");
  document.getElementById("trainer-details-save").onclick = () => {
    if (saveFields(DIALOG_PREFIX)) closeModal("dialog-trainer-details");
  };

  openModal("dialog-trainer-details");
}

/** The same form, on the cold-start splash, under the three onboarding choices.
 *
 * **Under them, not above.** The first thing a new trainer should be able to reach is the thing that
 * shows them the app working; a form placed ahead of that would be read as the price of entry.
 *
 * Saving does NOT dismiss the splash and does not choose for them: the three choices are still
 * there afterwards, so the only thing that happened is that the app now knows their name. The
 * confirmation line is what says so — a save with no visible result is one a trainer repeats.
 *
 * Called by splashScreen.js through an injected `mountTrainerDetails`, so the splash keeps importing
 * nothing but its own markup and the URL.
 */
export function mountTrainerDetailsOnSplash(container) {
  if (!container || !deps) return;
  const { t } = deps;

  container.innerHTML = `
    <p id="${SPLASH_PREFIX}-lede" class="app-splash-details-lede"></p>
    ${fieldsHtml(SPLASH_PREFIX)}
    <button type="button" id="${SPLASH_PREFIX}-save" class="app-splash-action"></button>
    <p id="${SPLASH_PREFIX}-saved" class="app-splash-details-saved" role="status" hidden></p>`;

  setText(`${SPLASH_PREFIX}-lede`, t("trainer_details_splash_lede"));
  setText(`${SPLASH_PREFIX}-save`, t("trainer_details_save"));
  setText(`${SPLASH_PREFIX}-saved`, t("trainer_details_saved"));
  applyFieldLabels(SPLASH_PREFIX);
  prefillFields(SPLASH_PREFIX);

  const saved = document.getElementById(`${SPLASH_PREFIX}-saved`);
  document.getElementById(`${SPLASH_PREFIX}-save`).onclick = () => {
    saved.hidden = !saveFields(SPLASH_PREFIX);
  };
}
