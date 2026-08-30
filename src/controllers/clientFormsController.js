// Owns the Client create/edit dialog: its markup (renderClientDialog) and its wiring
// (setupClientForms — open/edit triggers, save, and the client-list search box).
// Split 2026-08-01 out of the old formsController.js, which bundled Client, Routine, and Exercise
// forms in one file despite the three sharing nothing but boilerplate.

import { clientDisambiguator, clientsSharingName } from "../data/clientErasure.js";
import { newRecordId } from "../data/recordId.js";
import { readTrainerIdentity } from "../data/trainerIdentity.js";
import {
  consentSectionMarkup,
  fillConsentSection,
  initClientConsentSection,
  readConsentFromSection,
  setupClientConsentSection,
} from "../modules/clients/clientConsentSection.js";
import {
  getActiveDetailClientId,
  renderClientsList,
  showClientDetails,
} from "../modules/clients/clientsView.js";
import { browserInvitePlatform, sendIntakeInvite } from "../modules/clients/intakeInvite.js";
import {
  initIntakeInviteDialog,
  openIntakeInviteDialog,
} from "../modules/clients/intakeInviteDialog.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../modules/common/dom.js";
import { keepFormDraft } from "../modules/common/formDraft.js";
import { getInitials } from "../modules/common/utils.js";

export function renderClientDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-client"),
    `
<dialog id="dialog-client" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="client-modal-title" data-i18n="add_new_client">Add New Client</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-client" method="dialog" class="modal-form">
      <input type="hidden" id="client-form-id">

      <div class="form-group">
        <label for="client-name" data-i18n="client_full_name">Full Name *</label>
        <input type="text" id="client-name" required placeholder="e.g. Jane Doe" data-i18n-placeholder="client_name_placeholder" class="form-control">
      </div>

      <div class="form-group">
        <label for="client-alias" data-i18n="client_alias">Alias (only if two clients share a name)</label>
        <input type="text" id="client-alias" placeholder="e.g. morning, Novak, the runner" data-i18n-placeholder="client_alias_placeholder" class="form-control">
        <p class="form-hint" id="client-name-collision" hidden></p>
      </div>

      <div class="form-group">
        <label for="client-email" data-i18n="client_email">Email</label>
        <input type="email" id="client-email" placeholder="e.g. jane.doe@example.com" data-i18n-placeholder="client_email_placeholder" class="form-control">
      </div>

      <div class="form-group">
        <label for="client-phone" data-i18n="client_phone">Phone Number</label>
        <input type="tel" id="client-phone" placeholder="e.g. +386 40 123 456" data-i18n-placeholder="client_phone_placeholder" class="form-control">
      </div>

      <div class="form-group">
        <label for="client-goals" data-i18n="goals">Fitness Goals</label>
        <textarea id="client-goals" rows="2" placeholder="e.g. Strength gain, consistency..." data-i18n-placeholder="goals_placeholder" class="form-control"></textarea>
      </div>

      <div class="form-group">
        <label for="client-notes" data-i18n="notes_injuries">Trainer Notes & Injuries (Alert banner shows during workout)</label>
        <textarea id="client-notes" rows="3" placeholder="e.g. Left knee issue; monitor squat depth..." data-i18n-placeholder="notes_placeholder" class="form-control"></textarea>
      </div>

${consentSectionMarkup()}
      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel" data-i18n="btn_cancel">Cancel</button>
        <button type="submit" class="btn primary-btn" data-i18n="save_client">Save Client</button>
      </div>
    </form>
  </dialog>
`,
  );
}

// Two clients called Jane Doe is ordinary in a gym, and it is the case where every data-rights
// surface downstream (the erasure confirmation, the export picker) risks acting on the wrong
// person. The alias is the trainer's own answer to that, so the form asks for one at the exact
// moment the collision appears rather than leaving them to discover it during an erasure.
function renderNameCollisionHint(state, client) {
  const hint = $id("client-name-collision");
  if (!hint) return;
  const namesakes = client?.name ? clientsSharingName(state, client) : [];
  hint.hidden = namesakes.length === 0;
  if (namesakes.length === 0) return;
  hint.textContent = `${namesakes.length} other client${namesakes.length === 1 ? " has" : "s have"} this name (${namesakes
    .map((namesake) => clientDisambiguator(namesake))
    .join("; ")}). Add an alias so you can tell them apart.`;
}

export function setupClientForms({
  state,
  t,
  navigateToPath,
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
  initClientConsentSection({ t, getLang: () => state.lang });
  setupClientConsentSection();
  const cancelBtn = dialog.querySelector(".modal-cancel");
  const closeBtn = dialog.querySelector(".modal-close-btn");

  // Half a client's details survive a reload, and go back into the form the next time it opens for
  // the SAME subject (TODO §38.12). Keyed by who is being edited, because this one form is "add a
  // client" one moment and "edit Jane" the next — a draft that did not know the difference would
  // spill half of Jane's details into the next person's form. Dies with the tab, and is dropped the
  // moment the form is submitted, which is what `keepFormDraft` does on its own.
  const draft = keepFormDraft(form, () => `client:${$id("client-form-id").value || "new"}`);

  // The link that lets someone fill their own details in (TODO §26.3). The button OPENS the
  // sending dialog rather than sending: since 2026-08-23 the trainer can address the invitation to
  // the number or the email they were just given, which is the ordinary case — they are standing in
  // front of the person. The share sheet is still in there, one tap further in, for every channel a
  // phone has and for when there is no contact detail at all.
  $id("btn-invite-client")?.addEventListener("click", () => {
    initIntakeInviteDialog({
      t,
      getLang: () => state.lang,
      getTrainer: () => readTrainerIdentity(),
      onShare: () =>
        sendIntakeInvite({
          platform: browserInvitePlatform(),
          t,
          lang: state.lang,
          trainer: readTrainerIdentity(),
        }),
    });
    openIntakeInviteDialog();
  });

  $id("btn-add-client").addEventListener("click", () => {
    $id("client-modal-title").textContent = t("add_new_client");
    $id("client-form-id").value = "";
    openModal("dialog-client", { resetForm: true, formId: "form-client" });
    // After the reset, never before: reset() would otherwise wipe the date the block just derived.
    fillConsentSection(null);
    renderNameCollisionHint(state, null);
    // Last of all, so a half-typed client interrupted by a reload comes back on top of the empty
    // form rather than under it.
    draft.restore();
  });

  $id("btn-edit-client").addEventListener("click", () => {
    const activeId = getActiveDetailClientId();
    const client = state.clients.find((c) => c.id === activeId);
    if (!client) return;

    $id("client-modal-title").textContent = t("edit_client_profile");
    $id("client-form-id").value = client.id;
    $id("client-name").value = client.name;
    $id("client-alias").value = client.alias || "";
    $id("client-email").value = client.email || "";
    $id("client-phone").value = client.phone || "";
    $id("client-goals").value = client.goals || "";
    $id("client-notes").value = client.notes || "";
    fillConsentSection(client);
    renderNameCollisionHint(state, client);

    openModal("dialog-client");
    // After the stored values, never before: what is in the draft is what the trainer had typed and
    // not yet saved, so it is the NEWER of the two and must win.
    draft.restore();
  });

  // Cancel and ✕ mean "throw this away", so they do: only a reload — the thing nobody chose — brings
  // a half-filled form back. A draft that survived an explicit cancel would put words the trainer
  // deliberately abandoned in front of the next person they add.
  const handleClose = () => {
    draft.forget();
    closeModal("dialog-client");
  };
  if (cancelBtn) cancelBtn.addEventListener("click", handleClose);
  if (closeBtn) closeBtn.addEventListener("click", handleClose);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $id("client-form-id").value;
    const name = $id("client-name").value.trim();
    const alias = $id("client-alias").value.trim();
    const email = $id("client-email").value.trim();
    const phone = $id("client-phone").value.trim();
    const goals = $id("client-goals").value.trim();
    const notes = $id("client-notes").value.trim();
    const nowIso = new Date().toISOString();

    if (!name) return;

    const todayStr = nowIso.substring(0, 10);

    if (id) {
      const client = state.clients.find((c) => c.id === id);
      if (client) {
        client.name = name;
        client.alias = alias;
        client.email = email;
        client.phone = phone;
        client.goals = goals;
        client.notes = notes;
        client.gdprConsent = readConsentFromSection(client.gdprConsent);
      }
    } else {
      const newId = newRecordId();
      const newClient = {
        id: newId,
        name: name,
        alias: alias,
        avatar: getInitials(name),
        joinedDate: todayStr,
        email: email,
        phone: phone,
        goals: goals,
        weightHistory: [],
        notes: notes,
        gdprConsent: readConsentFromSection(null),
        active: true,
      };
      state.clients.push(newClient);
    }

    saveToLocalStorage();
    renderClientsList({ state, t, navigateToPath });
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

  // Live, not only on save: the moment a trainer types a name that already exists, the alias field
  // above is the thing they should be filling in — telling them afterwards means going back.
  const nameInput = $id("client-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const editingId = $id("client-form-id").value;
      const editing = state.clients.find((c) => c.id === editingId) || null;
      renderNameCollisionHint(state, { ...(editing || {}), id: editingId, name: nameInput.value });
    });
  }

  const searchClientsEl = $id("search-clients");
  if (searchClientsEl) {
    searchClientsEl.addEventListener("input", (e) => {
      // navigateToPath is not optional: renderClientsList wires it onto every card's click, so a
      // re-render without it leaves the filtered grid looking correct and throwing on the first tap.
      renderClientsList({ state, t, navigateToPath, filterQuery: e.target.value });
    });
  }
}
