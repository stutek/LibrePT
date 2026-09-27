// src/modules/common/connectedAccountsDialog.js — Settings' *Connected accounts*: every outside
// service the app can hold a credential for, and the two ways to let go of one.
//
// Single responsibility: the surface over data/connectedAccounts.js. For each service it says whether
// this device is connected, and offers **Clear from this device** (the connection is forgotten here;
// other devices keep their access) and **Revoke access** (the app's access ends at the service, for
// every device). When a revoke cannot reach the service it says so, and gives the service's own page
// for removing the access by hand — the trainer must not believe a grant is gone when it may stand.
//
// Named for the trainer, who never typed a key: accounts they connected, not "API keys".
//
// Every word goes in with `textContent`; the markup carries no text of its own.
//
// Injected dependencies: `t` (translate), `onChanged()` (repaint what shows the connection — the
// header cloud, the Drive card), and `accounts()` so a test can hand in its own list.

import { connectedAccounts } from "../../data/connectedAccounts.js";
import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

const DIALOG_ID = "dialog-connected-accounts";
let deps = null;

export function initConnectedAccountsDialog(injected) {
  deps = { accounts: connectedAccounts, onChanged: () => {}, ...injected };
}

function renderDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector(`#${DIALOG_ID}`),
    `
<dialog id="${DIALOG_ID}" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="connected-accounts-title"></h3>
    <button class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="connected-accounts-lede" class="text-sm"></p>
    <div id="connected-accounts-list" class="settings-list"></div>
  </div>
</dialog>
`,
  );
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** What a revoke that did not reach the service says, with the page to finish it by hand. */
function unreachableNote(service) {
  const { t } = deps;
  const note = element("p", "text-sm text-danger", t("account_revoke_unreachable"));
  note.dataset.accountNote = service.id;
  const link = element("a", "", t("account_manage_link"));
  link.href = service.manageUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  note.append(" ", link);
  return note;
}

function serviceRow(service, message) {
  const { t } = deps;
  const connected = service.isConnected();
  const row = element("div", "connected-account");
  row.dataset.account = service.id;
  row.append(element("h4", "settings-heading", t(service.nameKey)));
  row.append(element("p", "text-sm", t(connected ? "account_connected" : "account_not_connected")));

  if (connected) {
    const clear = element("button", "btn secondary-btn w-full", t("account_clear"));
    clear.type = "button";
    clear.dataset.accountAction = "clear";
    clear.addEventListener("click", () => {
      service.clear();
      changed(service.id, "cleared");
    });
    const revoke = element("button", "btn secondary-btn w-full", t("account_revoke"));
    revoke.type = "button";
    revoke.dataset.accountAction = "revoke";
    revoke.addEventListener("click", async () => {
      revoke.disabled = true;
      const outcome = await service.revoke();
      changed(service.id, outcome);
    });
    row.append(clear, revoke);
  }

  if (message === "unreachable") row.append(unreachableNote(service));
  else if (message === "revoked" || message === "cleared") {
    const done = element("p", "text-sm", t(`account_${message}`));
    done.dataset.accountNote = service.id;
    done.setAttribute("role", "status");
    row.append(done);
  }
  return row;
}

let messages = {};

function changed(id, outcome) {
  messages = { ...messages, [id]: outcome };
  deps.onChanged();
  renderList();
}

function renderList() {
  const list = document.getElementById("connected-accounts-list");
  list.replaceChildren();
  const services = deps.accounts();
  if (services.length === 0) {
    list.append(element("p", "text-sm", deps.t("accounts_none")));
    return;
  }
  for (const service of services) list.append(serviceRow(service, messages[service.id]));
}

export function openConnectedAccountsDialog() {
  renderDialog();
  const { t } = deps;
  messages = {};
  document.getElementById("connected-accounts-title").textContent = t("menu_connected_accounts");
  document.getElementById("connected-accounts-lede").textContent = t("accounts_lede");
  // Written here rather than as `data-i18n-label` in the markup: this dialog's markup does not exist
  // until the first time it is opened, after the boot's translation pass has run.
  const close = document.querySelector(`#${DIALOG_ID} .modal-close-btn`);
  close.setAttribute("aria-label", t("close"));
  close.onclick = () => closeModal(DIALOG_ID);
  renderList();
  openModal(DIALOG_ID);
}
