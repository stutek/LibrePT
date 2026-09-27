// src/modules/common/otherTabNotice.js — the notice a tab shows once another tab has taken over.
//
// Single responsibility: cover this tab and offer the way back. The tab has already stopped saving
// (data/tabOwnership.js); the notice tells the trainer why nothing they do here would be kept, and
// cannot be dismissed, because a tab that looked usable would take changes it then drops.
//
// "Use it here" reloads the page. A reload reads what the other tab saved and claims the turn at
// boot, which is the one order that cannot start from a stale copy.
//
// Injected dependencies: `t` (per call).

import { renderMarkupOnce } from "./dom.js";

const DIALOG_ID = "dialog-other-tab";

function renderNotice() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${DIALOG_ID}`),
    `
<dialog id="${DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="other-tab-title"></h3>
  </div>
  <div class="modal-form">
    <p id="other-tab-body" class="text-sm"></p>
    <div class="modal-actions">
      <button type="button" class="btn primary-btn" id="other-tab-use-here"></button>
    </div>
  </div>
</dialog>
`,
  );
}

export function showOtherTabNotice({ t }) {
  renderNotice();
  const dialog = document.getElementById(DIALOG_ID);
  if (!dialog || dialog.open) return;
  document.getElementById("other-tab-title").textContent = t("other_tab_title");
  document.getElementById("other-tab-body").textContent = t("other_tab_body");
  const useHere = document.getElementById("other-tab-use-here");
  useHere.textContent = t("other_tab_use_here");
  useHere.addEventListener("click", () => window.location.reload(), { once: true });
  // Escape closes a modal dialog by default; this one must stay until the trainer chooses.
  dialog.addEventListener("cancel", (event) => event.preventDefault());
  dialog.showModal();
}
