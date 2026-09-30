// Owns the Client create/edit dialog: its markup (renderClientDialog) and its wiring
// (setupClientForms — open/edit triggers, save, and the client-list search box).
// Split 2026-08-01 out of the old formsController.js, which bundled Client, Routine, and Exercise
// forms in one file despite the three sharing nothing but boilerplate.

import { localDateString } from "../data/calendarDay.js";
import { clientDisambiguator, clientsSharingName } from "../data/clientErasure.js";
import { newRecordId } from "../data/recordId.js";
import { readTrainerIdentity } from "../data/trainerIdentity.js";
import { countedText } from "../i18n/plural.js";
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
import { openSignupReview } from "../modules/clients/signupReviewDialog.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../modules/common/dom.js";
import { keepRecordLive } from "../modules/common/liveRecordForm.js";
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

      <!-- Its own field, because what is written here is what the clipboard warns about during a
           session. Written into the shared notes it never raised the warning at all. -->
      <div class="form-group">
        <label for="client-injury" data-i18n="injury_label">Injuries and limits</label>
        <textarea id="client-injury" rows="2" placeholder="e.g. Right knee surgery 2023; no deep squats" data-i18n-placeholder="injury_placeholder" class="form-control"></textarea>
      </div>

      <div class="form-group">
        <label for="client-notes" data-i18n="notes_label">Notes</label>
        <textarea id="client-notes" rows="2" placeholder="e.g. prefers mornings; homework: daily stretching" data-i18n-placeholder="notes_placeholder" class="form-control"></textarea>
      </div>

${consentSectionMarkup()}
      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel" data-i18n="btn_cancel">Cancel</button>
        <button type="submit" formnovalidate class="btn primary-btn" data-i18n="btn_save">Save</button>
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
function renderNameCollisionHint(state, client, t) {
  const hint = $id("client-name-collision");
  if (!hint) return;
  const namesakes = client?.name ? clientsSharingName(state, client) : [];
  hint.hidden = namesakes.length === 0;
  if (namesakes.length === 0) return;
  const others = namesakes
    .map((namesake) => clientDisambiguator(namesake, t("disambiguator_joined")))
    .join("; ");
  hint.textContent = countedText(
    t,
    document.documentElement.lang,
    "name_collision_hint",
    namesakes.length,
  ).replace("{others}", others);
}

let openNewClientDialog = null;

/** Opens the new-client dialog from another screen: `name` is filled in, and `onCreated(client)`
 *  is called when the dialog is left with the client kept (null when nothing was kept). The session
 *  form uses it when a search finds nobody of that name. */
export function openNewClient(options) {
  openNewClientDialog?.(options);
}

export function setupClientForms({
  getState,
  t,
  navigateToPath,
  saveToLocalStorage,
  populateDropdownSelectors,
  showErrorView,
  switchView,
  openWorkoutSetupModal,
  renderNotificationArea,
}) {
  renderClientDialog();
  const dialog = $id("dialog-client");
  const form = $id("form-client");
  if (!dialog || !form) return;
  initClientConsentSection({ t, getLang: () => getState().lang });
  setupClientConsentSection();
  const closeBtn = dialog.querySelector(".modal-close-btn");

  const repaint = (client) => {
    renderClientsList({ state: getState(), t, navigateToPath });
    populateDropdownSelectors();
    // The drawer's "nothing saved yet" welcome is judged from the state, and the first client
    // is what ends it; it went on greeting an empty app until the next reload.
    renderNotificationArea?.();
    if (client && getActiveDetailClientId() === client.id) {
      showClientDetails({
        clientId: client.id,
        state: getState(),
        t,
        showErrorView,
        switchView,
        openWorkoutSetupModal,
      });
    }
  };

  // Every keystroke goes into the client record, so a reload loses nothing. A new
  // client exists from the first character; an empty name is written as the placeholder.
  const live = keepRecordLive({
    dialog,
    form,
    collection: "clients",
    getState,
    saveToLocalStorage,
    createRecord: () => ({
      id: newRecordId(),
      name: t("placeholder_client_name"),
      alias: "",
      avatar: "",
      joinedDate: localDateString(),
      email: "",
      phone: "",
      goals: "",
      weightHistory: [],
      notes: "",
      gdprConsent: readConsentFromSection(null),
      active: true,
    }),
    writeFields: (client, before) => {
      client.name = $id("client-name").value.trim() || t("placeholder_client_name");
      client.alias = $id("client-alias").value.trim();
      client.email = $id("client-email").value.trim();
      client.phone = $id("client-phone").value.trim();
      client.goals = $id("client-goals").value.trim();
      // The flag the clipboard's warning reads is DERIVED from the field, as a client's own signup
      // derives it (clientSignup.js): written down means warned about.
      client.injury = $id("client-injury").value.trim();
      client.hasInjury = client.injury !== "";
      client.notes = $id("client-notes").value.trim();
      // Initials follow the name, on a rename as well as while the client is being added. They used
      // to be stamped once: a client saved as the placeholder and renamed straight afterwards kept
      // the placeholder's letters in the directory and on the clipboard, so the round badge beside
      // "SIM Ana Testna" read NS. Only initials are recomputed — an avatar the trainer set to
      // something else is not one of these.
      const derived = !client.avatar || client.avatar === getInitials(before?.name || "");
      if (!before || derived) client.avatar = getInitials(client.name);
      client.gdprConsent = readConsentFromSection(before?.gdprConsent ?? null);
    },
    isBlank: () =>
      ["name", "alias", "email", "phone", "goals", "injury", "notes"].every(
        (field) => !$id(`client-${field}`).value.trim(),
      ),
    onChange: repaint,
  });

  // The link that lets someone fill their own details in. The button OPENS the
  // sending dialog rather than sending: since 2026-08-23 the trainer can address the invitation to
  // the number or the email they were just given, which is the ordinary case — they are standing in
  // front of the person. The share sheet is still in there, one tap further in, for every channel a
  // phone has and for when there is no contact detail at all.
  $id("btn-invite-client")?.addEventListener("click", () => {
    initIntakeInviteDialog({
      t,
      getLang: () => getState().lang,
      getTrainer: () => readTrainerIdentity(),
      onShare: ({ lang, t: clientT }) =>
        sendIntakeInvite({
          platform: browserInvitePlatform(),
          t: clientT,
          lang,
          trainer: readTrainerIdentity(),
        }),
    });
    openIntakeInviteDialog();
  });

  $id("btn-review-signup")?.addEventListener("click", () => openSignupReview());

  openNewClientDialog = ({ name = "", onCreated = null } = {}) => {
    $id("client-modal-title").textContent = t("add_new_client");
    $id("client-form-id").value = "";
    openModal("dialog-client", { resetForm: true, formId: "form-client" });
    // After the reset, never before: reset() would otherwise wipe the date the block just derived.
    fillConsentSection(null);
    live.openNew(onCreated);
    if (name) {
      // A name handed over by the opener is written like a typed one, so Save alone keeps it.
      $id("client-name").value = name;
      form.dispatchEvent(new Event("recordchange"));
    }
    renderNameCollisionHint(getState(), null, t);
  };
  $id("btn-add-client").addEventListener("click", () => openNewClientDialog());

  $id("btn-edit-client").addEventListener("click", () => {
    const activeId = getActiveDetailClientId();
    const client = getState().clients.find((c) => c.id === activeId);
    if (!client) return;

    $id("client-modal-title").textContent = t("edit_client_profile");
    $id("client-form-id").value = client.id;
    $id("client-name").value = client.name;
    $id("client-alias").value = client.alias || "";
    $id("client-email").value = client.email || "";
    $id("client-phone").value = client.phone || "";
    $id("client-goals").value = client.goals || "";
    $id("client-injury").value = client.injury || "";
    $id("client-notes").value = client.notes || "";
    fillConsentSection(client);
    renderNameCollisionHint(getState(), client, t);

    openModal("dialog-client");
    live.openExisting(client);
  });

  // ✕ keeps what was typed, like Save; only Cancel undoes it (liveRecordForm.js).
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal("dialog-client"));

  // Live, not only on save: the moment a trainer types a name that already exists, the alias field
  // above is the thing they should be filling in — telling them afterwards means going back.
  const nameInput = $id("client-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const editingId = $id("client-form-id").value;
      const editing = getState().clients.find((c) => c.id === editingId) || null;
      renderNameCollisionHint(
        getState(),
        { ...(editing || {}), id: editingId, name: nameInput.value },
        t,
      );
    });
  }

  const searchClientsEl = $id("search-clients");
  if (searchClientsEl) {
    searchClientsEl.addEventListener("input", (e) => {
      // navigateToPath is not optional: renderClientsList wires it onto every card's click, so a
      // re-render without it leaves the filtered grid looking correct and throwing on the first tap.
      renderClientsList({ state: getState(), t, navigateToPath, filterQuery: e.target.value });
    });
  }
}
