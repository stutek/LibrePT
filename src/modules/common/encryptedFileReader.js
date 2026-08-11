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
// Injected dependencies: none (uses the global `crypto`); the file arrives through an <input>.

import { renderClientExportMarkdown } from "../../data/clientDataExport.js";
import { decryptEnvelope, isEncryptedEnvelope } from "../../data/encryptedExport.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "./dom.js";

export function renderEncryptedFileReader() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-open-encrypted"),
    `
<dialog id="dialog-open-encrypted" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="open-encrypted-title">Open an encrypted file</h3>
      <button class="modal-close-btn" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body data-rights-body">
      <p class="data-rights-note">For a personal-data export your trainer sent you. <strong>The file is opened on this device only</strong> — nothing is uploaded, and LibrePT keeps no copy.</p>

      <div class="form-group">
        <label for="open-encrypted-file">The file</label>
        <input type="file" id="open-encrypted-file" accept=".json,application/json" class="form-control">
      </div>

      <div class="form-group">
        <label for="open-encrypted-passphrase">The passphrase your trainer sent separately</label>
        <input type="text" id="open-encrypted-passphrase" class="form-control" autocomplete="off" placeholder="e.g. tempo-hinge-sprint-…">
      </div>

      <p id="open-encrypted-status" class="data-rights-warning" hidden></p>
      <pre id="open-encrypted-output" class="data-rights-output" hidden></pre>
    </div>
    <div class="modal-actions data-rights-actions">
      <button type="button" class="btn secondary-btn modal-cancel">Close</button>
      <button type="button" id="btn-open-encrypted" class="btn primary-btn">Open</button>
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

  if (!file) return setStatus("Choose the file your trainer sent you first.");
  if (!passphrase) return setStatus("Enter the passphrase your trainer sent separately.");

  let envelope;
  try {
    envelope = JSON.parse(await file.text());
  } catch {
    return setStatus("That file is not readable — check you picked the right attachment.");
  }
  if (!isEncryptedEnvelope(envelope)) {
    return setStatus("That is not a LibrePT encrypted export.");
  }

  try {
    const payload = await decryptEnvelope(envelope, passphrase);
    // textContent, never innerHTML: this renders a file that arrived from outside the app, and the
    // whole point of the reader is that it is safe to open something a stranger emailed you.
    output.textContent = renderClientExportMarkdown(payload) || JSON.stringify(payload, null, 2);
    output.hidden = false;
  } catch (error) {
    setStatus(error.message);
  }
}

export function setupEncryptedFileReader() {
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
