// src/modules/common/sandboxDialogs.js — the things the sandbox has to say out loud (TODO §40).
//
// Single responsibility: the offer to rebuild a sandbox that has gone flat (§40.4), the same offer
// made deliberately from the menu, and the card that names a timer which finished back in the
// trainer's own work while they are in here (§40.11). Each is one question with two answers, and
// each is ABOUT the sandbox — so they share a module rather than being scattered next to whatever
// raised them.
//
// **Asked-because-stale and asked-for are two dialogs, not one with a flag.** They differ in the
// only part that matters: the stale one explains why it is interrupting and its "no" starts a
// cooldown, while the menu one was asked for and its "no" means nothing at all. One dialog wearing
// both would have to explain a staleness the trainer did not raise.
//
// **A dialog and not a `confirm()`.** The precedent in this codebase is that a plain yes/no about
// one thing may use `confirm()` (editSessionControl.js), and a decision with consequences a trainer
// must be able to READ may not (demoCleanupDialog.js). Both of these are the second kind: one throws
// away everything they did in the sandbox, and the other has to name whose rest is over. A
// `confirm()` also cannot label its own buttons, and a step that asks for an action has to say the
// action rather than "OK".
//
// **Neither dialog ever touches storage.** The caller performs the reset, the navigation and the
// discard; this module asks and reports the answer. That is what lets the whole of §40.4's timing be
// tested without a browser.
//
// Injected dependencies: `t` (per call).

import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

const STALE_DIALOG_ID = "dialog-sandbox-stale";
const TIMER_DIALOG_ID = "dialog-sandbox-timer";
const RESET_DIALOG_ID = "dialog-sandbox-reset";

function renderStaleDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${STALE_DIALOG_ID}`),
    `
<dialog id="${STALE_DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="sandbox-stale-title" data-i18n="sandbox_stale_title"></h3>
  </div>
  <div class="modal-form">
    <p id="sandbox-stale-body" class="text-sm" data-i18n="sandbox_stale_body"></p>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="sandbox-stale-decline" data-i18n="sandbox_stale_decline"></button>
      <button type="button" class="btn danger-btn" id="sandbox-stale-confirm" data-i18n="sandbox_stale_confirm"></button>
    </div>
  </div>
</dialog>
`,
  );
}

function renderResetDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${RESET_DIALOG_ID}`),
    `
<dialog id="${RESET_DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="sandbox-reset-title" data-i18n="sandbox_reset_title"></h3>
  </div>
  <div class="modal-form">
    <p id="sandbox-reset-body" class="text-sm" data-i18n="sandbox_reset_body"></p>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="sandbox-reset-decline" data-i18n="sandbox_reset_decline"></button>
      <button type="button" class="btn danger-btn" id="sandbox-reset-confirm" data-i18n="sandbox_stale_confirm"></button>
    </div>
  </div>
</dialog>
`,
  );
}

function renderTimerDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${TIMER_DIALOG_ID}`),
    `
<dialog id="${TIMER_DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="sandbox-timer-title" data-i18n="sandbox_timer_expired_title"></h3>
  </div>
  <div class="modal-form">
    <p id="sandbox-timer-which" class="text-sm font-semibold"></p>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="sandbox-timer-discard" data-i18n="sandbox_timer_discard"></button>
      <button type="button" class="btn primary-btn" id="sandbox-timer-return" data-i18n="sandbox_timer_return"></button>
    </div>
  </div>
</dialog>
`,
  );
}

// One listener per opening, replaced by cloning the node: these dialogs are opened repeatedly over
// the life of a page (a timer can finish twice) and adding a second listener would run the previous
// answer's handler again.
function wire(id, handler) {
  const button = document.getElementById(id);
  if (!button) return;
  const fresh = button.cloneNode(true);
  button.replaceWith(fresh);
  fresh.addEventListener("click", handler);
}

function fill(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

/**
 * Offer to rebuild a sandbox whose seeded day has passed (TODO §40.4).
 *
 * `onConfirm` throws the sandbox away and builds a fresh one; `onDecline` starts the three-hour
 * cooldown. Closing the dialog any other way counts as declining — a question dismissed is not a
 * question answered yes, and the cooldown is what stops it being asked again immediately.
 */
export function openStaleSandboxDialog({ t, onConfirm, onDecline }) {
  renderStaleDialog();
  const dialog = document.getElementById(STALE_DIALOG_ID);
  if (!dialog) return;

  fill("sandbox-stale-title", t("sandbox_stale_title"));
  fill("sandbox-stale-body", t("sandbox_stale_body"));
  fill("sandbox-stale-decline", t("sandbox_stale_decline"));
  fill("sandbox-stale-confirm", t("sandbox_stale_confirm"));

  let answered = false;
  const answer = (fn) => {
    answered = true;
    closeModal(STALE_DIALOG_ID);
    fn?.();
  };
  wire("sandbox-stale-confirm", () => answer(onConfirm));
  wire("sandbox-stale-decline", () => answer(onDecline));
  dialog.addEventListener(
    "close",
    () => {
      if (!answered) onDecline?.();
    },
    { once: true },
  );

  openModal(STALE_DIALOG_ID);
}

/**
 * Throw the sandbox away and build a fresh one, asked for from the menu rather than offered
 * (TODO §40.4).
 *
 * Dismissing it is a NO and nothing else: unlike the stale offer, nobody interrupted the trainer, so
 * there is no cooldown to start and no answer to remember. It shares the stale dialog's confirm
 * label because it performs the identical act, and says on its own body what survives — the sandbox
 * is not where the trainer's work, their own details or their cloud connection live, and a dialog
 * with a red button has to say so before it is pressed.
 */
export function openResetSandboxDialog({ t, onConfirm }) {
  renderResetDialog();
  const dialog = document.getElementById(RESET_DIALOG_ID);
  if (!dialog) return;

  fill("sandbox-reset-title", t("sandbox_reset_title"));
  fill("sandbox-reset-body", t("sandbox_reset_body"));
  fill("sandbox-reset-decline", t("sandbox_reset_decline"));
  fill("sandbox-reset-confirm", t("sandbox_stale_confirm"));

  wire("sandbox-reset-confirm", () => {
    closeModal(RESET_DIALOG_ID);
    onConfirm?.();
  });
  wire("sandbox-reset-decline", () => closeModal(RESET_DIALOG_ID));

  openModal(RESET_DIALOG_ID);
}

/**
 * Say that a timer finished in the trainer's own work while they are in the sandbox (TODO §40.11),
 * and name whose it was — "a timer somewhere finished" is not something anybody can act on.
 *
 * Two ways on, neither of them a trap: go back to that work, or ignore this timer and stay. A
 * dismissal is an ignore, for the same reason as above.
 */
export function openSandboxTimerDialog({ t, which, onReturn, onDiscard }) {
  renderTimerDialog();
  const dialog = document.getElementById(TIMER_DIALOG_ID);
  if (!dialog) return;

  fill("sandbox-timer-title", t("sandbox_timer_expired_title"));
  fill("sandbox-timer-which", which);
  fill("sandbox-timer-discard", t("sandbox_timer_discard"));
  fill("sandbox-timer-return", t("sandbox_timer_return"));

  let answered = false;
  const answer = (fn) => {
    answered = true;
    closeModal(TIMER_DIALOG_ID);
    fn?.();
  };
  wire("sandbox-timer-return", () => answer(onReturn));
  wire("sandbox-timer-discard", () => answer(onDiscard));
  dialog.addEventListener(
    "close",
    () => {
      if (!answered) onDiscard?.();
    },
    { once: true },
  );

  openModal(TIMER_DIALOG_ID);
}
