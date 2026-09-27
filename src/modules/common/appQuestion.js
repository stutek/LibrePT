// src/modules/common/appQuestion.js — a yes/no question or a message, drawn by the app.
//
// Single responsibility: replace the browser's `confirm()` and `alert()`. Those windows are drawn
// by the browser, not the app: their buttons are in the DEVICE's language ("OK", "Cancel" on a
// Slovenian page), no theme reaches them, and while one is open the page does nothing else. Two in
// a row at the end of a session left a tab that answered nothing.
//
// A question names its action on the confirm button ("Delete session"), never "OK": a step that asks
// for an action says the action. Dismissing the dialog — Escape, Back — is a no.
//
// Injected dependencies: `t` (per call).

import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

const DIALOG_ID = "dialog-app-question";

function renderQuestionDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${DIALOG_ID}`),
    `
<dialog id="${DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-form">
    <p id="app-question-text" class="text-sm"></p>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="app-question-cancel"></button>
      <button type="button" class="btn primary-btn" id="app-question-confirm"></button>
    </div>
  </div>
</dialog>
`,
  );
}

function show({ message, confirmLabel, cancelLabel, danger }) {
  renderQuestionDialog();
  const dialog = document.getElementById(DIALOG_ID);
  if (!dialog) return Promise.resolve(false);
  document.getElementById("app-question-text").textContent = message;
  const confirm = document.getElementById("app-question-confirm");
  const cancel = document.getElementById("app-question-cancel");
  confirm.textContent = confirmLabel;
  confirm.classList.toggle("danger-btn", Boolean(danger));
  confirm.classList.toggle("primary-btn", !danger);
  cancel.textContent = cancelLabel || "";
  cancel.hidden = !cancelLabel;

  return new Promise((resolve) => {
    let answer = false;
    const onConfirm = () => {
      answer = true;
      closeModal(DIALOG_ID);
    };
    const onCancel = () => closeModal(DIALOG_ID);
    confirm.addEventListener("click", onConfirm);
    cancel.addEventListener("click", onCancel);
    dialog.addEventListener(
      "close",
      () => {
        confirm.removeEventListener("click", onConfirm);
        cancel.removeEventListener("click", onCancel);
        resolve(answer);
      },
      { once: true },
    );
    openModal(DIALOG_ID);
  });
}

/** Ask a yes/no question. Resolves true only when the confirm button is pressed. */
export function askInApp({ t, message, confirmKey, danger = false }) {
  return show({ message, confirmLabel: t(confirmKey), cancelLabel: t("btn_cancel"), danger });
}

/** Say something that needs no answer. Resolves when the trainer closes it. */
export async function tellInApp({ t, message }) {
  await show({ message, confirmLabel: t("dialog_ok") });
}
