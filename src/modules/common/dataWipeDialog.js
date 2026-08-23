// src/modules/common/dataWipeDialog.js — the support data-wipe, and the only thing that authorises
// it (TODO §31).
//
// Single responsibility: show a trainer exactly what is about to be removed from THIS device, and
// remove it if they say so. What would be removed is planned by data/dataWipe.js, which is pure; the
// deletion itself is the browser's own, done here because it is the one place the answer is yes.
//
// **The link carries no authority.** Support sends `…/wipe` by SMS or email, and opening it can only
// ever open this dialog — never wipe anything. That makes the dialog the entire security boundary,
// which is why it lists what it found rather than announcing what it assumes, and why the confirming
// action is a deliberate second tap rather than the act of arriving.
//
// **Not advertised anywhere in the app** (decided 2026-08-19: *"link should not be advocated"*).
// There is no menu item and no button: a trainer who has not been sent here by someone helping them
// has no reason to be here, and a permanent "delete everything" control on a phone used one-handed
// on a gym floor is a mis-tap waiting to happen.
//
// **Per schema store, plus everything belonging to none.** A long-lived install accumulates stores
// from builds this one has never heard of, and "wipe my data" that left them behind would be a lie.
// Nothing is matched against the current build's schema list for exactly that reason.
//
// **What the app cannot reach is stated every time, never conditionally.** Downloaded backups, a
// Drive copy, an export already in somebody's mailbox: the app erases what it holds and nothing
// more, and a support wipe that implied otherwise would be worse than none.
//
// Injected dependencies: `t`, `storeNames()`, `localStorageKeys()`, `clearStores(names)`,
// `removeKeys(keys)`, `reload()`.

import { planDataWipe, wipeOperations, wipeSummary } from "../../data/dataWipe.js";
import { closeModal, openModal, renderMarkupOnce } from "./dom.js";

let deps = null;
let plan = null;

export function initDataWipeDialog(injected) {
  deps = injected;
}

export function renderDataWipeDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-data-wipe"),
    `
<dialog id="dialog-data-wipe" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 id="data-wipe-title">Erase this device's LibrePT data</h3>
    <button class="modal-close-btn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="modal-form">
    <p id="data-wipe-lede" class="text-sm"></p>
    <p id="data-wipe-found-label" class="text-sm font-semibold"></p>
    <div id="data-wipe-targets" class="data-wipe-targets"></div>
    <p id="data-wipe-unreachable-label" class="text-sm font-semibold"></p>
    <ul id="data-wipe-unreachable" class="data-wipe-unreachable"></ul>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn" id="data-wipe-cancel"></button>
      <button type="button" class="btn danger-btn" id="data-wipe-confirm"></button>
    </div>
  </div>
</dialog>
`,
  );
}

/** One row per thing that can be erased, ticked by default.
 *
 * A support wipe is not a shopping trip — the trainer is on the phone to someone because the app is
 * broken — so "all of it" is the default and deselecting is for the rarer case where support wants
 * one store kept to look at.
 */
function renderTargets() {
  const list = document.getElementById("data-wipe-targets");
  const { t } = deps;
  list.textContent = "";

  for (const target of plan.targets) {
    const row = document.createElement("label");
    row.className = "data-wipe-target";
    const tick = document.createElement("input");
    tick.type = "checkbox";
    tick.checked = target.selected;
    tick.dataset.wipeTarget = target.id;
    tick.addEventListener("change", () => {
      target.selected = tick.checked;
      syncConfirmState();
    });
    const label = document.createElement("span");
    label.textContent =
      target.kind === "unversioned"
        ? t("data_wipe_unversioned")
        : t("data_wipe_schema_store").replace("{store}", target.id);
    row.append(tick, label);
    list.appendChild(row);
  }
}

/** Erasing nothing is not a wipe, and a button that would do nothing must not look ready. */
function syncConfirmState() {
  const summary = wipeSummary(plan);
  document.getElementById("data-wipe-confirm").disabled = summary.nothingSelected;
}

export function openDataWipeDialog() {
  renderDataWipeDialog();
  const { t } = deps;

  for (const [id, key] of [
    ["data-wipe-title", "data_wipe_title"],
    ["data-wipe-lede", "data_wipe_lede"],
    ["data-wipe-found-label", "data_wipe_found"],
    ["data-wipe-unreachable-label", "data_wipe_unreachable"],
    ["data-wipe-cancel", "btn_cancel"],
    ["data-wipe-confirm", "data_wipe_confirm"],
  ]) {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
  }

  return Promise.all([deps.storeNames(), deps.localStorageKeys()]).then(
    ([storeNames, localStorageKeys]) => {
      plan = planDataWipe({ storeNames, localStorageKeys });
      renderTargets();

      const unreachable = document.getElementById("data-wipe-unreachable");
      unreachable.textContent = "";
      for (const line of wipeSummary(plan).unreachable) {
        const entry = document.createElement("li");
        entry.textContent = line;
        unreachable.appendChild(entry);
      }

      // Nothing to erase is worth saying plainly: a trainer told "there is nothing here" has learned
      // something, while an empty dialog looks like the app failing again.
      if (!plan.hasAnything) {
        document.getElementById("data-wipe-found-label").textContent = t("data_wipe_nothing");
      }
      syncConfirmState();

      document.getElementById("data-wipe-cancel").onclick = () => closeModal("dialog-data-wipe");
      document.querySelector("#dialog-data-wipe .modal-close-btn").onclick = () =>
        closeModal("dialog-data-wipe");
      document.getElementById("data-wipe-confirm").onclick = () => confirmWipe();

      openModal("dialog-data-wipe");
      return plan;
    },
  );
}

/** Does it, then reloads.
 *
 * Reloading rather than re-rendering: every module in this page is holding state read from a
 * database that no longer exists, and asking them to notice would be a dozen places to be wrong
 * about. A boot from nothing is the state the trainer asked for anyway.
 */
async function confirmWipe() {
  const operations = wipeOperations(plan);
  document.getElementById("data-wipe-confirm").disabled = true;
  await deps.clearStores(operations.stores);
  deps.removeKeys(operations.localStorageKeys);
  closeModal("dialog-data-wipe");
  deps.reload();
}
