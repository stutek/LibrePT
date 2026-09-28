// src/modules/common/backupPassword.js — setting the backup password, and typing it to open a file.
//
// One dialog, two jobs, because they are the same three controls and a trainer meets them minutes
// apart: **set** a password so backups can be written encrypted, and **unlock** a file that was
// written with one. A second dialog would mean a second markup block, a second set of strings and two
// places for the same warning to go out of date.
//
// **The warning this dialog exists to deliver.** A backup is for the day the phone is gone. The
// password is the only way to open one, and nothing in LibrePT or at Google can recover it. So the
// password is generated here (readable words, not characters), it is shown in the clear rather than as
// dots, it can be copied in one tap, and the button that saves it says what saving means. A password
// the trainer cannot read is a password they cannot write down.
//
// **The password is not stored.** Only a key derived from it, which the browser will not let any
// script read back — see [backupKeyStore.js](../../data/backupKeyStore.js) for what that protects and
// what it does not.
//
// **Shown in the clear on purpose, and that is a real trade-off**: somebody standing next to the
// trainer can read it off the screen. The alternative is worse — dots produce a password nobody copies
// onto paper, and the loss this feature can cause is a trainer who cannot open their own backup.
//
// deps: { t }. The key work is in the data layer; this module owns the markup, the typing and the
// status lines only.

import {
  forgetBackupPassword,
  hasBackupPassword,
  setBackupPassword,
  unlockWithPassword,
} from "../../data/backupKeyStore.js";
import { generatePassphrase } from "../../data/passphraseKey.js";
import { $id, closeModal, openModal, renderMarkupOnce } from "./dom.js";

let deps = { t: (key) => key };

function tr(key) {
  return deps.t(key) || key;
}

// The dialog resolves one promise per opening: the caller (an export, an import, a sync) is waiting
// to find out whether it may proceed. Held here because a <dialog> has no return value of its own.
let pending = null;

// The envelope an unlock is being attempted against, so the key is derived from the FILE's salt.
let unlockingEnvelope = null;
// Set when the caller cannot work with a key that is not kept — Drive sync, which needs the key again
// on the next pass and every pass after it.
let unlockMustRemember = false;

function settle(value) {
  const resolve = pending;
  pending = null;
  unlockingEnvelope = null;
  unlockMustRemember = false;
  closeModal("dialog-backup-password");
  if (resolve) resolve(value);
}

export function renderBackupPasswordDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-backup-password"),
    `
<dialog id="dialog-backup-password" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="backup-pw-title" data-i18n="backup_pw_title">Backup password</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <p id="backup-pw-lead" class="dialog-desc" data-i18n="backup_pw_lead">Your backups are locked with this password. Without it nobody can read them — not Google, and not anyone who finds the file.</p>

      <div class="form-group">
        <label for="backup-pw-value" data-i18n="backup_pw_label">The password</label>
        <!-- type=text, not password: a password shown as dots is a password nobody copies onto
             paper, and paper is the whole recovery story here. -->
        <input type="text" id="backup-pw-value" class="form-control" autocomplete="off" spellcheck="false">
      </div>

      <div class="backup-pw-actions-row">
        <button type="button" id="btn-backup-pw-generate" class="btn secondary-btn"><i class="fa-solid fa-dice"></i> <span data-i18n="backup_pw_new">Another one</span></button>
        <button type="button" id="btn-backup-pw-copy" class="btn secondary-btn"><i class="fa-solid fa-copy"></i> <span data-i18n="backup_pw_copy">Copy</span></button>
      </div>

      <p id="backup-pw-keep" class="restore-confirm"><i class="fa-solid fa-triangle-exclamation"></i>
        <span data-i18n="backup_pw_write_it_down">Write this password down somewhere other than this phone. A backup is for the day this phone is gone, and this password is the only way to open it. LibrePT cannot get it back for you, and neither can Google.</span>
      </p>

      <label id="backup-pw-remember-row" class="backup-pw-remember" hidden>
        <input type="checkbox" id="backup-pw-remember" checked>
        <span data-i18n="backup_pw_remember">Remember it on this device</span>
      </label>

      <p id="backup-pw-status" class="status-msg"></p>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn secondary-btn modal-cancel" id="btn-backup-pw-cancel" data-i18n="close">Close</button>
      <button type="button" id="btn-backup-pw-confirm" class="btn primary-btn" data-i18n="backup_pw_save">I wrote it down — save</button>
    </div>
  </dialog>
`,
  );
}

function setStatus(key, tone = "") {
  const status = $id("backup-pw-status");
  if (!status) return;
  status.textContent = key ? tr(key) : "";
  status.className = tone ? `status-msg ${tone}` : "status-msg";
}

/** Put the dialog in "set a password" shape, or in "type the one this file has" shape. */
function showFor(mode) {
  renderBackupPasswordDialog();
  const field = $id("backup-pw-value");
  const generate = $id("btn-backup-pw-generate");
  const copy = $id("btn-backup-pw-copy");
  const keep = $id("backup-pw-keep");
  const remember = $id("backup-pw-remember-row");
  const title = $id("backup-pw-title");
  const lead = $id("backup-pw-lead");
  const confirm = $id("btn-backup-pw-confirm");
  const unlocking = mode === "unlock";

  if (title) title.textContent = tr(unlocking ? "backup_pw_unlock_title" : "backup_pw_title");
  if (lead) lead.textContent = tr(unlocking ? "backup_pw_unlock_lead" : "backup_pw_lead");
  if (confirm) confirm.textContent = tr(unlocking ? "backup_pw_unlock_open" : "backup_pw_save");
  // Generating and copying belong to setting a password. Offering them while opening a file would
  // invite a trainer to replace the password the file was written with — which cannot work.
  if (generate) generate.hidden = unlocking;
  if (copy) copy.hidden = unlocking;
  if (keep) keep.hidden = unlocking;
  // Hidden where the choice is not real: a sync that cannot keep the key would ask for the password
  // again on the next pass, and every pass after it.
  if (remember) remember.hidden = !unlocking || unlockMustRemember;
  if (field) field.value = unlocking ? "" : generatePassphrase();
  setStatus("");
  openModal("dialog-backup-password");
  field?.focus();
}

/**
 * Make sure this device can write an encrypted backup, asking for a password if it cannot.
 *
 * Resolves true when there is a key to encrypt with, false when the trainer closed the dialog — in
 * which case the caller does NOT fall back to writing a plain file. A backup that silently comes out
 * unencrypted after the trainer declined to set a password is the failure this whole change is about.
 */
export async function ensureBackupPassword() {
  if (await hasBackupPassword()) return true;
  return askToSet();
}

/** Open the dialog to set or change the password. Resolves true when one was saved. */
export function askToSet({ changing = false } = {}) {
  return new Promise((resolve) => {
    pending = resolve;
    showFor("set");
    // Changing is the case with a consequence worth stating: files already written keep the old
    // password, because nothing here can reach a file on Drive or in somebody's mailbox.
    if (changing) setStatus("backup_pw_change_warning", "text-danger");
  });
}

/**
 * Ask for the password a file was written with. Resolves the derived key, or null if they gave up.
 *
 * The key comes from the file's own salt and iteration count (backupEncryption.js), which is what
 * makes it the same key that wrote the file.
 */
export function askToUnlock(envelope, { mustRemember = false } = {}) {
  return new Promise((resolve) => {
    pending = resolve;
    unlockingEnvelope = envelope;
    unlockMustRemember = mustRemember;
    showFor("unlock");
  });
}

/** Forget the password on this device. Resolves once it is gone. */
export async function forgetOnThisDevice() {
  await forgetBackupPassword();
}

async function onConfirm() {
  const typed = $id("backup-pw-value")?.value.trim() || "";
  if (!typed) return setStatus("backup_pw_empty", "text-danger");

  if (unlockingEnvelope) {
    const remember = unlockMustRemember || ($id("backup-pw-remember")?.checked ?? true);
    try {
      const { key } = await unlockWithPassword(unlockingEnvelope, typed, { remember });
      // Derivation always succeeds — a wrong password produces a key, not an error. Whether it is
      // the RIGHT key is decided by the decryption the caller runs next, which is where a wrong
      // password surfaces. Saying "opened" here would be a claim this dialog cannot make.
      settle(key);
    } catch {
      setStatus("backup_pw_wrong", "text-danger");
    }
    return;
  }

  try {
    await setBackupPassword(typed);
    settle(true);
  } catch {
    setStatus("backup_pw_failed", "text-danger");
  }
}

export function setupBackupPassword(d) {
  deps = d;
  renderBackupPasswordDialog();

  $id("btn-backup-pw-generate")?.addEventListener("click", () => {
    const field = $id("backup-pw-value");
    if (field) field.value = generatePassphrase();
    setStatus("");
  });

  $id("btn-backup-pw-copy")?.addEventListener("click", async () => {
    const value = $id("backup-pw-value")?.value || "";
    try {
      await navigator.clipboard.writeText(value);
      setStatus("backup_pw_copied", "text-emerald");
    } catch {
      // No clipboard permission, or an insecure context. The password is on screen in the clear, so
      // there is a way forward either way — say which one.
      setStatus("backup_pw_copy_failed", "text-danger");
    }
  });

  $id("btn-backup-pw-confirm")?.addEventListener("click", onConfirm);

  // Every way out of the dialog is a decline, and each has to settle the promise the caller is
  // waiting on — an export left waiting forever would look like a button that does nothing.
  $id("btn-backup-pw-cancel")?.addEventListener("click", () => settle(null));
  $id("dialog-backup-password")
    ?.querySelector(".modal-close-btn")
    ?.addEventListener("click", () => settle(null));
  // Escape closes a <dialog> without any button being tapped.
  $id("dialog-backup-password")?.addEventListener("close", () => {
    if (pending) settle(null);
  });
}
