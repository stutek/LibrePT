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
    <div id="app-question-slide" class="slide-confirm" hidden>
      <label id="app-question-slide-label" for="app-question-slider" class="slide-confirm-label"></label>
      <input type="range" id="app-question-slider" class="slide-confirm-range" min="0" max="100" step="10" value="0">
    </div>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="app-question-cancel"></button>
      <button type="button" class="btn primary-btn" id="app-question-confirm"></button>
    </div>
  </div>
</dialog>
`,
  );
}

const SLIDE_END = 100;
// How far along the track, as a share of its width, a touch may begin and still count as grabbing
// the handle. A range input jumps to wherever it is touched, so without this one tap at the far end
// of the track would confirm — which is the touch in a pocket the slide exists to refuse.
const GRAB_ZONE = 0.2;

// A slide instead of a button. The range input keeps the keyboard and screen-reader path: arrow keys
// step it, End jumps to the end, and reaching the end confirms. A pointer that lets go short of the
// end sends it back to the start, so a slide that was not finished confirms nothing.
function wireSlider(slider, onConfirm) {
  const setFill = () => slider.style.setProperty("--slide-fill", `${slider.value}%`);
  const reset = () => {
    slider.value = "0";
    setFill();
  };
  reset();
  let grabbed = true;
  const onPointerDown = (event) => {
    const box = slider.getBoundingClientRect();
    grabbed = box.width > 0 && (event.clientX - box.left) / box.width <= GRAB_ZONE;
  };
  // A key press is deliberate, whatever a pointer did before it.
  const onKeyDown = () => {
    grabbed = true;
  };
  const springBack = () => {
    if (Number(slider.value) < SLIDE_END) reset();
  };
  const onChange = () => {
    if (Number(slider.value) < SLIDE_END) return;
    if (grabbed) onConfirm();
    else reset();
  };
  const listeners = {
    input: setFill,
    change: onChange,
    pointerdown: onPointerDown,
    keydown: onKeyDown,
    pointerup: springBack,
    pointercancel: springBack,
  };
  for (const [type, listener] of Object.entries(listeners)) {
    slider.addEventListener(type, listener);
  }
  return () => {
    for (const [type, listener] of Object.entries(listeners)) {
      slider.removeEventListener(type, listener);
    }
  };
}

function show({ message, confirmLabel, cancelLabel, danger, slideLabel }) {
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
  const slideBox = document.getElementById("app-question-slide");
  const slider = document.getElementById("app-question-slider");
  slideBox.hidden = !slideLabel;
  confirm.hidden = Boolean(slideLabel);
  document.getElementById("app-question-slide-label").textContent = slideLabel || "";

  return new Promise((resolve) => {
    let answer = false;
    const onConfirm = () => {
      answer = true;
      closeModal(DIALOG_ID);
    };
    const onCancel = () => closeModal(DIALOG_ID);
    const unwireSlider = slideLabel ? wireSlider(slider, onConfirm) : () => {};
    confirm.addEventListener("click", onConfirm);
    cancel.addEventListener("click", onCancel);
    dialog.addEventListener(
      "close",
      () => {
        confirm.removeEventListener("click", onConfirm);
        cancel.removeEventListener("click", onCancel);
        unwireSlider();
        resolve(answer);
      },
      { once: true },
    );
    openModal(DIALOG_ID);
  });
}

/** Ask a yes/no question. Resolves true only when the confirm button is pressed, or, with `slide`,
 *  when the slider is moved to its end (the button is then not offered). */
export function askInApp({ t, message, confirmKey, danger = false, slide = false }) {
  return show({
    message,
    confirmLabel: t(confirmKey),
    cancelLabel: t("btn_cancel"),
    danger,
    slideLabel: slide ? t("delete_slide_label") : "",
  });
}

/** Say something that needs no answer. Resolves when the trainer closes it. */
export async function tellInApp({ t, message }) {
  await show({ message, confirmLabel: t("dialog_ok") });
}
