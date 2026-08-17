// src/modules/clients/signupReviewDialog.js — the trainer reading a submission a client sent them,
// and deciding what to do with it (TODO §26.5).
//
// Single responsibility: show one submission, offer the match if there is one, and write the record on
// accept. What a submission IS and how it maps to client fields are data/clientSignup.js; reading the
// file is data/signupFile.js.
//
// **This dialog is the trust boundary of the whole self-onboarding feature.** There is no signature to
// verify and deliberately never will be — signing needs a key exchange, which needs the server this
// project does not have (§26.8) — so anyone who photographs the QR on a gym wall can craft a file.
// What makes that acceptable is not cryptography; it is that a human being looks at one record before
// it enters their register. Hence: no auto-import, no "trust files from this sender", and every field
// on screen before Save is reachable.
//
// **The dedupe is an OFFER, never a decision.** A match on email or phone is very likely the same
// person, and a second Jane Doe in the register is a worse outcome than a question. But two people do
// share a phone number — a couple training together, a parent's number on a teenager's form — so the
// trainer can decline it, and only they know which case this is.
//
// **An update adds; it does not overwrite what the client did not mention.** The mapping omits skipped
// fields rather than blanking them (clientFieldsFromSignup), so a client who leaves the goals box
// alone cannot wipe the goal their trainer wrote after the last session.
//
// **Every value is rendered with textContent, never interpolated into markup.** This is the one screen
// in the trainer's app that displays a string a stranger wrote (build/frontend_audit.py).
//
// Injected dependencies: `getState`, `t`, `saveState`, `renderClientsList`, `newClientId`, `todayIso`.

import {
  clientFieldsFromSignup,
  findExistingClientForSignup,
  signupHasConsent,
} from "../../data/clientSignup.js";
import { readSignupFile } from "../../data/signupFile.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../common/dom.js";
import { getInitials } from "../common/utils.js";

const DIALOG_ID = "dialog-signup-review";

let deps = null;
// The submission currently under review. Cleared on close, so a declined file is GONE rather than left
// primed for a later stray tap on Save — the same rule §18.7's restore flow follows.
let reviewed = null;
let matchedClient = null;

export function initSignupReview(injected) {
  deps = injected;
}

export function renderSignupReviewDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-signup-review"),
    `
<dialog id="dialog-signup-review" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="signup-review-title">Review a client's details</h3>
      <button class="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <p id="signup-review-lede" class="signup-review-lede"></p>

      <div class="form-group">
        <label id="signup-review-file-label" for="signup-review-file"></label>
        <input type="file" id="signup-review-file" class="form-control" accept=".json,.librept-signup.json,application/json,application/vnd.librept.signup+json">
      </div>

      <p id="signup-review-status" class="signup-review-status" hidden></p>

      <dl id="signup-review-fields" class="signup-review-fields" hidden></dl>

      <div id="signup-review-match" class="signup-review-match" hidden>
        <label class="signup-review-match-row" for="signup-review-update-existing">
          <input type="checkbox" id="signup-review-update-existing" checked>
          <span id="signup-review-match-label"></span>
        </label>
      </div>
    </div>
    <div class="modal-actions">
      <button type="button" id="signup-review-cancel" class="btn secondary-btn modal-cancel"></button>
      <button type="button" id="signup-review-save" class="btn primary-btn" disabled></button>
    </div>
  </dialog>
`,
  );
}

function setStatus(key, isError = true) {
  const status = $id("signup-review-status");
  if (!status) return;
  status.hidden = !key;
  status.textContent = key ? deps.t(key) : "";
  status.classList.toggle("is-error", isError);
}

/** One labelled row. Built with createElement so a stranger's text cannot become markup. */
function appendRow(list, label, value) {
  if (!value) return;
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = value;
  list.append(term, detail);
}

function renderSubmission(signup) {
  const list = $id("signup-review-fields");
  if (!list) return;
  list.textContent = "";
  const t = deps.t;

  appendRow(list, t("signup_review_name"), signup.name);
  appendRow(list, t("signup_review_email"), signup.email);
  appendRow(list, t("signup_review_phone"), signup.phone);
  appendRow(list, t("signup_review_goals"), signup.goals);
  appendRow(list, t("signup_review_injury"), signup.injury);

  // Consent as EVIDENCE, not as a yes: when, which wording, which language. That trio is what Art.
  // 7(1) asks a trainer to be able to produce, and a tick would show none of it.
  if (signupHasConsent(signup)) {
    const consent = signup.gdprConsent;
    appendRow(list, t("signup_review_consent_date"), consent.consentDate);
    appendRow(list, t("signup_review_consent_version"), consent.formVersion);
    appendRow(list, t("signup_review_consent_lang"), consent.formLang);
  } else {
    appendRow(list, t("signup_review_consent_date"), t("signup_review_no_consent"));
  }
  list.hidden = false;
}

function renderMatch(client) {
  const match = $id("signup-review-match");
  const label = $id("signup-review-match-label");
  if (!match || !label) return;

  if (!client) {
    match.hidden = true;
    return;
  }
  // The matched person is named, because "update the existing client" is unanswerable without knowing
  // WHICH existing client — and the alias exists precisely for telling two same-named people apart.
  const who = client.alias ? `${client.name} (${client.alias})` : client.name;
  label.textContent = `${deps.t("signup_review_match_label")} ${who}`;
  $id("signup-review-update-existing").checked = true;
  match.hidden = false;
}

function clearReview() {
  reviewed = null;
  matchedClient = null;
  const list = $id("signup-review-fields");
  if (list) {
    list.textContent = "";
    list.hidden = true;
  }
  const match = $id("signup-review-match");
  if (match) match.hidden = true;
  const save = $id("signup-review-save");
  if (save) save.disabled = true;
  const picker = $id("signup-review-file");
  if (picker) picker.value = "";
  setStatus("");
}

/** Reads one file's text into the review, returning the submission or null.
 *
 * Exported rather than reached through a `window` hook: the file input is the only production caller,
 * but a page cannot populate a file input, so tests/medium/ imports this directly. A test-only global
 * would have put a "hand me any submission" entry point into the shipped app for the convenience of
 * the suite.
 */
export function reviewSignupText(text) {
  const signup = readSignupFile(text);
  if (!signup) {
    clearReview();
    setStatus("signup_review_unreadable");
    return null;
  }

  reviewed = signup;
  matchedClient = findExistingClientForSignup(signup, deps.getState().clients || []);
  setStatus("");
  renderSubmission(signup);
  renderMatch(matchedClient);
  $id("signup-review-save").disabled = false;
  return signup;
}

function saveReviewed() {
  if (!reviewed) return;
  const state = deps.getState();
  const fields = clientFieldsFromSignup(reviewed);
  const updateExisting = $id("signup-review-update-existing")?.checked === true;

  if (matchedClient && updateExisting) {
    // Assign only what the client supplied: `fields` omits anything they skipped, so the trainer's own
    // notes and goals survive.
    Object.assign(matchedClient, fields);
  } else {
    state.clients.push({
      // The id is minted HERE and never taken from the file — otherwise a submission could name the
      // record it lands on, and a stranger could aim theirs at an existing client.
      id: deps.newClientId(),
      avatar: getInitials(fields.name),
      joinedDate: deps.todayIso(),
      weightHistory: [],
      active: true,
      ...fields,
    });
  }

  deps.saveState();
  deps.renderClientsList();
  closeModal(DIALOG_ID);
  clearReview();
}

export function setupSignupReview() {
  renderSignupReviewDialog();
  const dialog = $id(DIALOG_ID);
  if (!dialog) return;

  $id("signup-review-lede").textContent = deps.t("signup_review_lede");
  $id("signup-review-file-label").textContent = deps.t("signup_review_file");
  $id("signup-review-cancel").textContent = deps.t("btn_cancel");
  $id("signup-review-save").textContent = deps.t("signup_review_save");

  for (const closer of dialog.querySelectorAll(".modal-cancel, .modal-close-btn")) {
    closer.addEventListener("click", () => {
      closeModal(DIALOG_ID);
      clearReview();
    });
  }

  $id("signup-review-file")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    reviewSignupText(await file.text());
  });

  $id("signup-review-save")?.addEventListener("click", saveReviewed);
}

export function openSignupReview() {
  clearReview();
  openModal(DIALOG_ID);
}
