// src/modules/clients/clientDataRights.js — the two dialogs behind a data-subject request:
// "export this client's data" (Art. 15/20) and "erase this client" (Art. 17).
//
// They live together because they share the one property that matters on this surface: BOTH act on
// exactly one named person, and both are unrecoverable if aimed at the wrong one — an export sends
// the wrong client's health data to a stranger, an erasure destroys the right client's record. So
// every screen here identifies its target with `clientDisambiguator()` rather than the name alone,
// and the erasure requires the trainer to re-type a confirmation word after reading it.
//
// What the app deliberately does NOT do:
//   * attach the export to an email itself — a `mailto:` cannot carry an attachment, on any
//     platform. Pretending otherwise would produce an email with nothing in it, so the flow is
//     download → compose → attach, stated in that order on screen.
//   * send the passphrase with the file. It is shown for the trainer to pass on by SMS or in
//     person; putting it in the same email as the ciphertext would make the encryption decorative.
//
// Injected dependencies (initClientDataRights): { getState, saveState, t, onErased }.

import {
  buildClientExport,
  clientExportFilename,
  renderClientExportMarkdown,
} from "../../data/clientDataExport.js";
import { clientDisambiguator, eraseClientInState } from "../../data/clientErasure.js";
import { encryptPayload, generatePassphrase } from "../../data/encryptedExport.js";
import { externalErasureChecklist, renderErasureReceipt } from "../../data/erasureChecklist.js";
import {
  readSuppressionList,
  withSuppressedClient,
  writeSuppressionList,
} from "../../data/erasureSuppression.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "../common/dom.js";
import { downloadFile } from "../common/download.js";
import { escapeHTML } from "../common/utils.js";

const ERASE_CONFIRMATION_WORD = "ERASE";

let deps = {};
let subjectId = null;

export function initClientDataRights(injected) {
  deps = injected || {};
}

function subject() {
  return (deps.getState?.().clients || []).find((client) => client.id === subjectId) || null;
}

export function renderDataRightsDialogs() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-client-export"),
    `
<dialog id="dialog-client-export" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="client-export-title">Export this client's data</h3>
      <button class="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body data-rights-body">
      <p class="data-rights-subject" id="client-export-subject"></p>
      <p class="data-rights-note" id="client-export-scope"></p>

      <div class="form-group">
        <label for="client-export-notes">Your notes about this client (disclosed)</label>
        <textarea id="client-export-notes" rows="3" class="form-control"></textarea>
        <p class="form-hint">Your notes are <strong>their</strong> personal data and must be disclosed. Edit only to remove information about <em>other</em> people — the file will say that something was withheld.</p>
      </div>

      <div class="form-group">
        <label for="client-export-passphrase">Passphrase for the encrypted file</label>
        <div class="data-rights-passphrase-row">
          <input type="text" id="client-export-passphrase" class="form-control" readonly>
          <button type="button" id="btn-export-copy-passphrase" class="btn secondary-btn btn-sm">Copy</button>
          <button type="button" id="btn-export-new-passphrase" class="btn secondary-btn btn-sm">New</button>
        </div>
        <p class="form-hint"><strong>Send this by SMS or say it in person — never in the same email as the file.</strong> Without it the file cannot be opened, by anyone, including you.</p>
      </div>

      <ol class="data-rights-steps">
        <li>Download the encrypted file.</li>
        <li>Compose an email to the client and <strong>attach it yourself</strong> — an app cannot attach a file to your mail for you.</li>
        <li>Send the passphrase separately.</li>
      </ol>
    </div>
    <div class="modal-actions data-rights-actions">
      <button type="button" class="btn secondary-btn modal-cancel">Close</button>
      <button type="button" id="btn-export-download-plain" class="btn secondary-btn">Readable copy</button>
      <button type="button" id="btn-export-download" class="btn primary-btn">Download encrypted</button>
      <a id="btn-export-compose" class="btn primary-btn">Compose email</a>
    </div>
  </dialog>

<dialog id="dialog-client-erase" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="client-erase-title">Erase this client (GDPR request)</h3>
      <button class="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body data-rights-body">
      <p class="data-rights-subject" id="client-erase-subject"></p>
      <p class="data-rights-warning" id="client-erase-namesakes" hidden></p>
      <p class="data-rights-note">Their name, contact details, goals, notes, injuries and body-weight history are replaced with an anonymous label. The training records stay, keyed to an id that no longer resolves to a person. <strong>This cannot be undone</strong> — nothing is kept that could reverse it.</p>

      <div class="form-group">
        <label for="client-erase-requested">Date they asked</label>
        <input type="date" id="client-erase-requested" class="form-control">
      </div>

      <div class="form-group">
        <label for="client-erase-confirm">Type ${ERASE_CONFIRMATION_WORD} to confirm</label>
        <input type="text" id="client-erase-confirm" class="form-control" autocomplete="off" placeholder="${ERASE_CONFIRMATION_WORD}">
      </div>

      <div id="client-erase-receipt" class="data-rights-receipt" hidden></div>
    </div>
    <div class="modal-actions data-rights-actions">
      <button type="button" class="btn secondary-btn modal-cancel">Cancel</button>
      <button type="button" id="btn-erase-copy-receipt" class="btn secondary-btn" hidden>Copy receipt</button>
      <button type="button" id="btn-erase-confirm" class="btn danger-btn" disabled>Erase permanently</button>
    </div>
  </dialog>
`,
  );
}

// ---------------------------------------------------------------- export ----

function currentExportPayload() {
  const client = subject();
  if (!client) return null;
  const notes = $id("client-export-notes")?.value ?? "";
  const redactions = notes === (client.notes || "") ? {} : { trainerNotes: notes };
  return buildClientExport(deps.getState(), client.id, { redactions });
}

export function openClientExportDialog(clientId) {
  subjectId = clientId;
  const client = subject();
  if (!client) return;

  const payload = buildClientExport(deps.getState(), clientId);
  $id("client-export-subject").textContent = `${client.name} — ${clientDisambiguator(client)}`;
  $id("client-export-scope").textContent =
    `${payload.counts.loggedSessions} logged session(s), ${payload.counts.sessions} booking(s), ${payload.counts.planUpdates} plan update(s). Other clients' data is never included — a group session appears only as its size.`;
  $id("client-export-notes").value = client.notes || "";
  $id("client-export-passphrase").value = generatePassphrase();
  updateComposeLink(client);
  openModal("dialog-client-export");
}

function updateComposeLink(client) {
  const compose = $id("btn-export-compose");
  if (!compose) return;
  const subjectLine = encodeURIComponent("Your personal data — as you requested");
  const body = encodeURIComponent(
    `Hi ${client.name},\n\nAttached is the copy of the personal data I hold about you, as you asked.\n\nThe file is encrypted. I will send you the passphrase separately — by text message, not in this email — because an email carrying both would protect nothing.\n\nTo open it: go to ${location.origin}${location.pathname}, choose "Open an encrypted file" from the menu, pick the attachment and enter the passphrase. Nothing is uploaded anywhere; it opens on your own device.\n\nIf anything in it is wrong, tell me and I will correct it.\n`,
  );
  const href = client.email
    ? `mailto:${encodeURIComponent(client.email)}?subject=${subjectLine}&body=${body}`
    : "";
  compose.classList.toggle("disabled", !href);
  if (href) compose.setAttribute("href", href);
  else compose.removeAttribute("href");
  compose.textContent = href ? "Compose email" : "No email on file";
}

async function downloadEncryptedExport() {
  const client = subject();
  const payload = currentExportPayload();
  const passphrase = $id("client-export-passphrase")?.value;
  if (!client || !payload || !passphrase) return;

  const envelope = await encryptPayload(payload, passphrase);
  downloadFile(
    JSON.stringify(envelope, null, 2),
    clientExportFilename(client, { extension: "librept.json" }),
    "application/json",
  );
}

function downloadReadableExport() {
  const client = subject();
  const payload = currentExportPayload();
  if (!client || !payload) return;
  // Unencrypted, for handing over in person or printing — offered because encryption is protection
  // for the EMAIL hop, and a client sitting in front of you does not need a passphrase ceremony.
  downloadFile(
    renderClientExportMarkdown(payload),
    clientExportFilename(client, { extension: "md" }),
    "text/markdown",
  );
}

// ---------------------------------------------------------------- erasure ----

export function openClientEraseDialog(clientId) {
  subjectId = clientId;
  const client = subject();
  if (!client) return;

  const state = deps.getState();
  $id("client-erase-subject").textContent = `${client.name} — ${clientDisambiguator(client)}`;
  const namesakeEl = $id("client-erase-namesakes");
  const namesakes = (state.clients || []).filter(
    (candidate) =>
      candidate.id !== client.id &&
      (candidate.name || "").trim().toLowerCase() === (client.name || "").trim().toLowerCase(),
  );
  namesakeEl.hidden = namesakes.length === 0;
  if (namesakes.length > 0) {
    // The trainer is about to erase one of two identically-named people. Naming the OTHER one, with
    // its distinguishing details, is what lets them notice they have the wrong record open.
    namesakeEl.textContent = `⚠ Another client has this exact name: ${namesakes
      .map((namesake) => clientDisambiguator(namesake))
      .join("; ")}. Check you have the right person open — this erases only the one above.`;
  }

  $id("client-erase-requested").value = new Date().toISOString().substring(0, 10);
  $id("client-erase-confirm").value = "";
  $id("btn-erase-confirm").disabled = true;
  $id("btn-erase-confirm").hidden = false;
  $id("btn-erase-copy-receipt").hidden = true;
  const receipt = $id("client-erase-receipt");
  receipt.hidden = true;
  receipt.textContent = "";
  openModal("dialog-client-erase");
}

async function performErasure() {
  const client = subject();
  if (!client) return;
  const requestedOn = $id("client-erase-requested")?.value || "";
  const { state, summary } = eraseClientInState(deps.getState(), client.id, { requestedOn });
  if (!summary) return;

  // Persist the suppression entry BEFORE the erased state, so a crash between the two leaves the
  // list ahead of the database rather than behind it: an extra entry re-erases an already-erased
  // record (a no-op), a missing one lets a restore resurrect them.
  const list = await withSuppressedClient(readSuppressionList(), client.id);
  writeSuppressionList(list);

  deps.saveState?.(state);

  const checklist = externalErasureChecklist(state, client, {
    driveConfigured: Boolean(deps.isDriveConfigured?.()),
  });
  renderReceipt(summary, checklist, client);
  deps.onErased?.(client.id);
}

function renderReceipt(summary, checklist, client) {
  const receipt = $id("client-erase-receipt");
  if (!receipt) return;

  const rows = checklist
    .map(
      (item) =>
        `<li class="${item.blocking ? "todo" : "info"}"><strong>${escapeHTML(item.surface)}</strong> — ${escapeHTML(item.action)}<br><span class="why">${escapeHTML(item.why)}</span></li>`,
    )
    .join("");
  const warning =
    summary.reviewSessionIds.length > 0
      ? `<p class="data-rights-warning">${escapeHTML(String(summary.reviewSessionIds.length))} session title(s) still mention this name and were left alone — a rewrite could have hit the wrong person. Open and edit them yourself.</p>`
      : "";

  receipt.innerHTML = `
    <p class="data-rights-done">Erased in the app as <strong>${escapeHTML(summary.pseudonym)}</strong>.</p>
    ${warning}
    <p class="data-rights-note">The rest is yours — LibrePT cannot reach these:</p>
    <ul class="data-rights-checklist">${rows}</ul>`;
  receipt.hidden = false;

  const copyBtn = $id("btn-erase-copy-receipt");
  copyBtn.hidden = false;
  copyBtn.dataset.receipt = renderErasureReceipt(summary, checklist, client);
  $id("btn-erase-confirm").hidden = true;
}

// ---------------------------------------------------------------- wiring ----

export function setupClientDataRights() {
  renderDataRightsDialogs();

  for (const dialogId of ["dialog-client-export", "dialog-client-erase"]) {
    const dialog = $id(dialogId);
    if (!dialog) continue;
    for (const closer of dialog.querySelectorAll(".modal-cancel, .modal-close-btn")) {
      closer.addEventListener("click", () => closeModal(dialogId));
    }
  }

  $id("btn-export-download")?.addEventListener("click", () => {
    downloadEncryptedExport();
  });
  $id("btn-export-download-plain")?.addEventListener("click", downloadReadableExport);
  $id("btn-export-new-passphrase")?.addEventListener("click", () => {
    $id("client-export-passphrase").value = generatePassphrase();
  });
  $id("btn-export-copy-passphrase")?.addEventListener("click", () => {
    navigator.clipboard?.writeText($id("client-export-passphrase").value);
  });

  const confirmInput = $id("client-erase-confirm");
  confirmInput?.addEventListener("input", () => {
    // Case-sensitive on purpose: the point of the ceremony is that it cannot be completed by
    // reflex, and lowercase "erase" is what a reflex types.
    $id("btn-erase-confirm").disabled = confirmInput.value !== ERASE_CONFIRMATION_WORD;
  });
  $id("btn-erase-confirm")?.addEventListener("click", () => {
    performErasure();
  });
  $id("btn-erase-copy-receipt")?.addEventListener("click", (event) => {
    navigator.clipboard?.writeText(event.currentTarget.dataset.receipt || "");
  });
}
