// src/modules/common/trainerDetailsDialog.js — where the trainer writes down who they are.
//
// Single responsibility: put a form in front of the four values data/trainerIdentity.js stores —
// first name, last name, phone, email — check them, and hand them back to it. It decides nothing
// about what they are for; every reader of them (the calendar invite's ORGANIZER, the signature on a
// client invitation) already exists and is unchanged by this file.
//
// **Two places, one form.** It opens from the app (☰) menu, and it is a step of the welcome screen on
// the first launch. The fields, their labels, the saving and the rules are built here for both,
// parameterised by an id prefix — two copies of a form is two places for a rule to drift, and the ids
// have to differ because both can exist in the document at once.
//
// **All four are required, in both places.** The welcome screen asks for them before the sandbox is
// even offered, because everything the trainer sends a client is signed with them: an invitation
// from nobody, with no number to answer, is one a client ignores. The menu's form holds the same rule
// — a save there that blanked a field would undo the welcome screen's.
//
// **What is wrong is said at the field, and nothing is written until all four are right.** Silently
// dropping what somebody deliberately typed would leave them believing it was saved. The phone is
// checked the way the send control checks a contact (domain/contactChannel.js): enough digits to be
// dialled, written any of the dozen ways people write a number.
//
// Injected dependencies: `t` (translate), and `read`/`write` over the identity store so a test needs
// no browser storage.

import {
  looksLikeEmail,
  readTrainerIdentity,
  writeTrainerIdentity,
} from "../../data/trainerIdentity.js";
import { contactChannelFor } from "../../domain/contactChannel.js";
import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

const DIALOG_PREFIX = "trainer-details";
const SPLASH_PREFIX = "splash-trainer";
const FIELDS = [
  {
    name: "firstName",
    input: "text",
    autocomplete: "given-name",
    label: "trainer_details_first_name",
  },
  {
    name: "lastName",
    input: "text",
    autocomplete: "family-name",
    label: "trainer_details_last_name",
  },
  { name: "phone", input: "tel", autocomplete: "tel", label: "trainer_details_phone" },
  { name: "email", input: "email", autocomplete: "email", label: "trainer_details_email" },
];
// What each problem says at its field.
const PROBLEM_TEXT = {
  required: "trainer_details_required",
  phone: "trainer_details_phone_invalid",
  email: "trainer_details_email_invalid",
};

let deps = null;

export function initTrainerDetailsDialog(injected) {
  deps = {
    read: readTrainerIdentity,
    write: writeTrainerIdentity,
    ...injected,
  };
}

/** What is wrong with a set of details, field by field: `{ phone: "phone" }`, `{}` when nothing. */
export function trainerDetailsProblems(values) {
  const problems = {};
  for (const { name } of FIELDS) {
    if (!String(values[name] || "").trim()) problems[name] = "required";
  }
  if (!problems.phone && contactChannelFor(values.phone) !== "sms") problems.phone = "phone";
  if (!problems.email && !looksLikeEmail(values.email)) problems.email = "email";
  return problems;
}

/** Whether the stored details are complete — what decides that the welcome screen asks for them. */
export function trainerDetailsComplete(identity = readTrainerIdentity()) {
  return Object.keys(trainerDetailsProblems(identity)).length === 0;
}

/** The four fields, for either host.
 *
 * Nothing carries English text: every label is written from the dictionary by `applyFieldLabels`.
 * Markup that seeded its own English would be text no language choice can reach, and
 * agent_tools/ui_strings.py counts it as one either way.
 */
function fieldsHtml(prefix) {
  return FIELDS.map(
    ({ name, input, autocomplete }) => `
    <div class="form-group">
      <label for="${prefix}-${name}" id="${prefix}-${name}-label"></label>
      <input type="${input}" id="${prefix}-${name}" class="form-control" autocomplete="${autocomplete}" required>
      <p id="${prefix}-${name}-error" class="text-sm form-error" hidden></p>
    </div>`,
  ).join("");
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function applyFieldLabels(prefix) {
  for (const { name, label } of FIELDS) setText(`${prefix}-${name}-label`, deps.t(label));
}

/** An install that stored one name before the first and last name were asked for separately gets it
 *  back split at the first space, for the trainer to confirm or correct — never saved unseen. */
function storedForForm() {
  const stored = deps.read();
  if (stored.firstName || stored.lastName || !stored.name) return stored;
  const [first, ...rest] = stored.name.split(/\s+/);
  return { ...stored, firstName: first, lastName: rest.join(" ") };
}

function prefillFields(prefix) {
  const stored = storedForForm();
  for (const { name } of FIELDS) {
    const input = document.getElementById(`${prefix}-${name}`);
    if (input) input.value = stored[name] || "";
    const error = document.getElementById(`${prefix}-${name}-error`);
    if (error) error.hidden = true;
  }
}

function formValues(prefix) {
  const values = {};
  for (const { name } of FIELDS) {
    values[name] = document.getElementById(`${prefix}-${name}`)?.value.trim() || "";
  }
  return values;
}

/** Stores what was typed, or says at each field what is wrong and stores nothing. Returns whether it
 *  stored. */
function saveFields(prefix) {
  const values = formValues(prefix);
  const problems = trainerDetailsProblems(values);

  for (const { name } of FIELDS) {
    const error = document.getElementById(`${prefix}-${name}-error`);
    if (!error) continue;
    error.hidden = !problems[name];
    if (problems[name]) error.textContent = deps.t(PROBLEM_TEXT[problems[name]]);
  }
  const first = FIELDS.find(({ name }) => problems[name]);
  if (first) {
    document.getElementById(`${prefix}-${first.name}`)?.focus();
    return false;
  }

  deps.write(values);
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

/** The same form as a step of the welcome screen, calling `onComplete` once all four are saved.
 *
 * Called by splashScreen.js through an injected `mountTrainerDetails`, so the splash keeps importing
 * nothing but its own markup and the URL.
 */
export function mountTrainerDetailsOnSplash(container, onComplete = () => {}) {
  if (!container || !deps) return;
  const { t } = deps;

  container.innerHTML = `
    <p id="${SPLASH_PREFIX}-lede" class="app-splash-details-lede"></p>
    ${fieldsHtml(SPLASH_PREFIX)}
    <button type="button" id="${SPLASH_PREFIX}-save" class="app-splash-action app-splash-action-primary"></button>`;

  setText(`${SPLASH_PREFIX}-lede`, t("trainer_details_splash_lede"));
  setText(`${SPLASH_PREFIX}-save`, t("trainer_details_save_continue"));
  applyFieldLabels(SPLASH_PREFIX);
  prefillFields(SPLASH_PREFIX);

  document.getElementById(`${SPLASH_PREFIX}-save`).onclick = () => {
    if (saveFields(SPLASH_PREFIX)) onComplete();
  };
}
