// Owns the Client create/edit dialog: its markup (renderClientDialog) and its wiring
// (setupClientForms — open/edit triggers, save, and the client-list search box).
// Split 2026-08-01 out of the old formsController.js, which bundled Client, Routine, and Exercise
// forms in one file despite the three sharing nothing but boilerplate (AGENT_RULES §5.1).

import {
  getActiveDetailClientId,
  renderClientsList,
  showClientDetails,
} from "../modules/clients/clientsView.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../modules/common/dom.js";
import { newRecordId } from "../modules/common/recordId.js";
import { getInitials } from "../modules/common/utils.js";

export function renderClientDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-client"),
    `
<dialog id="dialog-client" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="client-modal-title">Add New Client</h3>
      <button class="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-client" method="dialog" class="modal-form">
      <input type="hidden" id="client-form-id">

      <div class="form-group">
        <label for="client-name">Full Name *</label>
        <input type="text" id="client-name" required placeholder="e.g. Jane Doe" class="form-control">
      </div>

      <div class="form-group">
        <label for="client-email">Email</label>
        <input type="email" id="client-email" placeholder="e.g. jane.doe@example.com" class="form-control">
      </div>

      <div class="form-group">
        <label for="client-phone">Phone Number</label>
        <input type="tel" id="client-phone" placeholder="e.g. +386 40 123 456" class="form-control">
      </div>

      <div class="form-group">
        <label for="client-goals">Fitness Goals</label>
        <textarea id="client-goals" rows="2" placeholder="e.g. Strength gain, consistency..." class="form-control"></textarea>
      </div>

      <div class="form-group">
        <label for="client-notes">Trainer Notes & Injuries (Alert banner shows during workout)</label>
        <textarea id="client-notes" rows="3" placeholder="e.g. Left knee issue; monitor squat depth..." class="form-control"></textarea>
      </div>

      <div class="form-group checkbox-group" style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="client-gdpr-consent" class="form-checkbox">
        <label for="client-gdpr-consent" style="margin-bottom: 0; font-weight: normal; cursor: pointer;">
          Client consented to cloud sync & data storage (GDPR)
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel">Cancel</button>
        <button type="submit" class="btn primary-btn">Save Client</button>
      </div>
    </form>
  </dialog>
`,
  );
}

export function setupClientForms({
  state,
  t,
  saveToLocalStorage,
  populateDropdownSelectors,
  showErrorView,
  switchView,
  openWorkoutSetupModal,
}) {
  renderClientDialog();
  const dialog = $id("dialog-client");
  const form = $id("form-client");
  if (!dialog || !form) return;
  const cancelBtn = dialog.querySelector(".modal-cancel");
  const closeBtn = dialog.querySelector(".modal-close-btn");

  $id("btn-add-client").addEventListener("click", () => {
    $id("client-modal-title").textContent = "Add New Client";
    $id("client-form-id").value = "";
    openModal("dialog-client", { resetForm: true, formId: "form-client" });
  });

  $id("btn-edit-client").addEventListener("click", () => {
    const activeId = getActiveDetailClientId();
    const client = state.clients.find((c) => c.id === activeId);
    if (!client) return;

    $id("client-modal-title").textContent = "Edit Client Profile";
    $id("client-form-id").value = client.id;
    $id("client-name").value = client.name;
    $id("client-email").value = client.email || "";
    $id("client-phone").value = client.phone || "";
    $id("client-goals").value = client.goals || "";
    $id("client-notes").value = client.notes || "";
    $id("client-gdpr-consent").checked = Boolean(client.gdprConsent?.cloudSync);

    openModal("dialog-client");
  });

  const handleClose = () => closeModal("dialog-client");
  if (cancelBtn) cancelBtn.addEventListener("click", handleClose);
  if (closeBtn) closeBtn.addEventListener("click", handleClose);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $id("client-form-id").value;
    const name = $id("client-name").value.trim();
    const email = $id("client-email").value.trim();
    const phone = $id("client-phone").value.trim();
    const goals = $id("client-goals").value.trim();
    const notes = $id("client-notes").value.trim();
    const gdprConsentChecked = $id("client-gdpr-consent").checked;
    const nowIso = new Date().toISOString();

    if (!name) return;

    const todayStr = nowIso.substring(0, 10);

    if (id) {
      const client = state.clients.find((c) => c.id === id);
      if (client) {
        client.name = name;
        client.email = email;
        client.phone = phone;
        client.goals = goals;
        client.notes = notes;
        client.gdprConsent = {
          cloudSync: gdprConsentChecked,
          timestamp: gdprConsentChecked ? client.gdprConsent?.timestamp || nowIso : "",
        };
      }
    } else {
      const newId = newRecordId();
      const newClient = {
        id: newId,
        name: name,
        avatar: getInitials(name),
        joinedDate: todayStr,
        email: email,
        phone: phone,
        goals: goals,
        weightHistory: [],
        notes: notes,
        gdprConsent: {
          cloudSync: gdprConsentChecked,
          timestamp: gdprConsentChecked ? nowIso : "",
        },
        active: true,
      };
      state.clients.push(newClient);
    }

    saveToLocalStorage();
    renderClientsList({ state, t });
    populateDropdownSelectors();

    const activeId = getActiveDetailClientId();
    if (id && activeId === id) {
      showClientDetails({
        clientId: id,
        state,
        t,
        showErrorView,
        switchView,
        openWorkoutSetupModal,
      });
    }

    closeModal("dialog-client");
  });

  const searchClientsEl = $id("search-clients");
  if (searchClientsEl) {
    searchClientsEl.addEventListener("input", (e) => {
      renderClientsList({ state, t, filterQuery: e.target.value });
    });
  }
}
