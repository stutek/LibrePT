// src/modules/common/appVersionDialog.js — where the trainer chooses which app version runs (TODO §76).
//
// Single responsibility: list the supported versions (data/appVersions.js), mark the one in use, and
// on a tap store the choice and reload. The reload is the whole switch: every screen is drawn again
// under the new version's behaviours, and nothing about which data is read changes.
//
// **Refused while a session is running**, with the reason on the screen: a reload in front of a client
// is the one moment the switch must not happen (TODO §18.12).
//
// Injected dependencies: `t` (translate), `isSessionRunning`, and `reload`, so a test can see a switch
// without the page going away.

import { APP_VERSIONS, activeAppVersion, setAppVersion } from "../../data/appVersions.js";
import { closeModal, openModal, renderMarkupOnce } from "./dom.js";
import { escapeHTML } from "./utils.js";

const DIALOG_ID = "dialog-app-version";

let deps = null;

export function initAppVersionDialog(injected) {
  deps = { reload: () => window.location.reload(), ...injected };
}

function renderShell() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${DIALOG_ID}`),
    `
<dialog id="${DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="app-version-title"></h3>
    <button class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="app-version-lede" class="text-sm"></p>
    <p id="app-version-refused" class="text-sm hidden"></p>
    <div id="app-version-list" class="app-version-list"></div>
  </div>
</dialog>
`,
  );
}

function optionHtml(version, inUse, refused) {
  const { t } = deps;
  // The version in use is not a choice; the rest are, unless a session is running.
  const disabled = inUse || refused ? " disabled" : "";
  const marker = inUse ? ` <span class="badge">${escapeHTML(t("app_version_in_use"))}</span>` : "";
  return `<button type="button" class="btn ${inUse ? "primary-btn" : "secondary-btn"} app-version-option"
    data-version="${escapeHTML(version.id)}" aria-pressed="${inUse}"${disabled}>
    <strong>${escapeHTML(version.id)}</strong>${marker}
    <span class="text-sm">${escapeHTML(t(version.descriptionKey))}</span>
  </button>`;
}

export function openAppVersionDialog() {
  renderShell();
  const { t } = deps;
  const refused = Boolean(deps.isSessionRunning?.());
  const current = activeAppVersion().id;

  document.getElementById("app-version-title").textContent = t("app_version_title");
  document.getElementById("app-version-lede").textContent = t("app_version_lede");
  const refusal = document.getElementById("app-version-refused");
  refusal.textContent = t("app_version_refused_in_session");
  refusal.classList.toggle("hidden", !refused);

  const list = document.getElementById("app-version-list");
  list.innerHTML = APP_VERSIONS.map((version) =>
    optionHtml(version, version.id === current, refused),
  ).join("");
  for (const button of list.querySelectorAll(".app-version-option")) {
    button.onclick = () => {
      if (button.disabled) return;
      setAppVersion(button.dataset.version);
      deps.reload();
    };
  }

  const close = document.querySelector(`#${DIALOG_ID} .modal-close-btn`);
  close.setAttribute("aria-label", t("close"));
  close.onclick = () => closeModal(DIALOG_ID);

  openModal(DIALOG_ID);
}
