// src/modules/common/encryptedFileReader.js — opening an encrypted personal-data export.
//
// This is the half of the export feature that belongs to the CLIENT, not the trainer. An encrypted
// attachment nobody can open is worse than no export at all: the trainer has honoured Art. 15 on
// paper and the person still cannot read their own data.
//
// Why it lives in the app rather than as a self-decrypting HTML attachment: an HTML file with inline
// script is exactly the shape mail gateways strip, and asking a gym client to install anything is a
// non-starter. LibrePT is already a public URL that runs entirely in the browser — so "open the app,
// pick the file, type the passphrase" needs no install, no account, and no upload. The decryption
// happens in the page; the file never leaves the device, which is the sentence the dialog leads with
// because a person about to paste their medical history somewhere deserves to know that.
//
// Reachable from the header menu, deliberately NOT from a client record: the reader is for someone
// who has no client record, on their own phone.
//
// Injected dependencies: `t`, for the status messages (uses the global `crypto`); the file arrives
// through an <input>.

import { renderClientExportMarkdown } from "../../data/clientDataExport.js";
import { decryptEnvelope, isEncryptedEnvelope } from "../../data/encryptedExport.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "./dom.js";

// The app's dictionary, injected at boot. Until then a key stands in, so a missing entry is visible.
let t = (key) => key;

function tr(key) {
  return t(key) || key;
}

export function renderEncryptedFileReader() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-open-encrypted"),
    `
<dialog id="dialog-open-encrypted" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="open-encrypted-title" data-i18n="encrypted_title">Open an encrypted file</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body data-rights-body">
      <p class="data-rights-note"><span data-i18n="encrypted_lead">For a personal-data export your trainer sent you.</span> <strong data-i18n="encrypted_local">The file is opened on this device only. Nothing is uploaded, and LibrePT keeps no copy.</strong></p>

      <div class="form-group">
        <label for="open-encrypted-file" data-i18n="encrypted_file_label">The file</label>
        <input type="file" id="open-encrypted-file" accept=".json,application/json" class="form-control">
      </div>

      <div class="form-group">
        <label for="open-encrypted-passphrase" data-i18n="encrypted_passphrase_label">The passphrase your trainer sent separately</label>
        <input type="text" id="open-encrypted-passphrase" class="form-control" autocomplete="off" data-i18n-placeholder="encrypted_passphrase_placeholder" placeholder="e.g. tempo-hinge-sprint-…">
      </div>

      <p id="open-encrypted-status" class="data-rights-warning" hidden></p>
      <pre id="open-encrypted-output" class="data-rights-output" hidden></pre>
    </div>
    <div class="modal-actions data-rights-actions">
      <button type="button" class="btn secondary-btn modal-cancel" data-i18n="close">Close</button>
      <button type="button" id="btn-open-encrypted" class="btn primary-btn" data-i18n="encrypted_open">Open</button>
    </div>
  </dialog>
`,
  );
}

function setStatus(message) {
  const status = $id("open-encrypted-status");
  if (!status) return;
  status.hidden = !message;
  status.textContent = message || "";
}

async function openSelectedFile() {
  const file = $id("open-encrypted-file")?.files?.[0];
  const passphrase = $id("open-encrypted-passphrase")?.value || "";
  const output = $id("open-encrypted-output");
  output.hidden = true;
  setStatus("");

  if (!file) return setStatus(tr("encrypted_choose_file"));
  if (!passphrase) return setStatus(tr("encrypted_enter_passphrase"));

  let envelope;
  try {
    envelope = JSON.parse(await file.text());
  } catch {
    return setStatus(tr("encrypted_unreadable"));
  }
  if (!isEncryptedEnvelope(envelope)) {
    return setStatus(tr("encrypted_not_export"));
  }

  try {
    const payload = await decryptEnvelope(envelope, passphrase);
    // textContent, never innerHTML: this renders a file that arrived from outside the app, and the
    // whole point of the reader is that it is safe to open something a stranger emailed you.
    output.textContent = renderClientExportMarkdown(payload) || JSON.stringify(payload, null, 2);
    output.hidden = false;
  } catch {
    // The envelope was checked above, so decryption fails only on a wrong passphrase or a changed
    // file (encryptedExport.js). Said in the reader's language rather than the data layer's English.
    setStatus(tr("encrypted_cannot_open"));
  }
}

export function setupEncryptedFileReader(injected = {}) {
  t = injected.t || t;
  renderEncryptedFileReader();
  const dialog = $id("dialog-open-encrypted");
  if (!dialog) return;

  for (const closer of dialog.querySelectorAll(".modal-cancel, .modal-close-btn")) {
    closer.addEventListener("click", () => closeModal("dialog-open-encrypted"));
  }
  $id("btn-open-encrypted")?.addEventListener("click", () => {
    openSelectedFile();
  });
}

export function openEncryptedFileReader() {
  openModal("dialog-open-encrypted");
}
