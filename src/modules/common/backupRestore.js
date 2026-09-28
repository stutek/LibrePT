// src/modules/common/backupRestore.js
// Component that manages the data backup, JSON export, and JSON file import actions.
//
// **An exported file is encrypted whenever this workspace has a backup password**
// (data/backupEncryption.js), and setting one is part of the first export rather than a setting
// somewhere else: the export is the moment the trainer is thinking about the file, and a password
// asked for later is a password nobody sets. Declining the dialog cancels the export — it does NOT
// quietly write a plain file, which would be the failure the encryption exists to prevent.
//
// **The sandbox asks too, and it has its own password.** It was exempt for one day and that was
// wrong twice over. The sandbox is where a trainer learns the app, so a rehearsal that leaves out the
// one irreversible step rehearses nothing; and its records are sample data only by default — nothing
// stops a trainer typing a real client in there, which is exactly what the app invites them to do.
// The password is per workspace because the key lives in that workspace's own database, so the state
// line says which workspace it is talking about.
//
// deps: {
//   getState(),
//   setState(newState),
//   saveToLocalStorage(),
//   renderClientsList(),
//   renderRoutinesList(),
//   renderExercisesList(),
//   populateDropdownSelectors(),
//   renderSessions(),   // for the dialog's Sync Data button, which reseeds state.sessions
//   openEncryptedFileReader(),   // the dialog's "Open an encrypted file" card
//   t
// }

import { AES_GCM_CONTAINER, decryptBackup, encryptBackup } from "../../data/backupEncryption.js";
import {
  ENCRYPTED_BACKUP_FORMAT,
  buildBackupPayload,
  refusesRestoreInto,
  resolveBackupFormat,
  summarizeReplacement,
} from "../../data/backupFile.js";
import { backupKeyForWriting, hasBackupPassword } from "../../data/backupKeyStore.js";
import {
  applySuppressions,
  mergeSuppressionLists,
  readSuppressionList,
  writeSuppressionList,
} from "../../data/erasureSuppression.js";
import { DEFAULT_SESSIONS } from "../../data/index.js";
import { bringsDataForward, describeMigration, migrateState } from "../../data/schemaMigrations.js";
import { recordBackupTaken } from "../../data/stateStore.js";
import { SANDBOX, activeWorkspace } from "../../data/workspace.js";
import { countedText } from "../../i18n/plural.js";
import { BUILD_INFO } from "../../version.js";
import { isOfflineCachedActive } from "./applicationHeader.js";
import {
  askToSet,
  askToUnlock,
  ensureBackupPassword,
  forgetOnThisDevice,
} from "./backupPassword.js";
import { renderMarkupOnce } from "./dom.js";
import { downloadFile } from "./download.js";
import { handleHeaderCloudTap } from "./driveSyncUi.js";

let deps = null;

// A parsed, migrated database waiting for the trainer to confirm it may replace what they have.
// Held here rather than re-read from the file input, which browsers clear on re-render.
let pendingRestore = null;
let pendingSummary = null;
let confirmedRestore = false;

// Async because the erasure register has to be applied to the INCOMING data before it becomes the
// live database — not after, which would leave a window where the app holds names their owners
// asked to have removed, and would write them to disk on the way through.
async function applyRestoredState(restored) {
  const merged = mergeSuppressionLists(readSuppressionList(), restored?.erasureSuppressions);
  writeSuppressionList(merged);
  const { state: filtered, reErased } = await applySuppressions(restored, merged);
  // The register is not part of the database; it lives in localStorage and is written back into a
  // file only at export time. Destructured out rather than deleted so the live state never carries
  // a key the schema does not declare.
  const { erasureSuppressions: _register, ...database } = filtered;

  deps.setState(database);
  deps.saveToLocalStorage();
  pendingRestore = null;
  confirmedRestore = false;
  return reErased;
}

// The one place a successful import's status line is built, so the confirmed path cannot drift from
// the direct one. It once did: a hardcoded "Import successful!" on the confirm branch silently
// dropped the migration report — the very thing a trainer needs to see when old data moves.
// A restore that silently differs from the file the trainer chose is exactly the surprise this
// codebase keeps refusing to ship. If the erasure register filtered the incoming data, say so.
function erasureNotice(reErased) {
  if (!reErased || reErased.length === 0) return "";
  return countedText(deps.t, document.documentElement.lang, "import_reerased", reErased.length);
}

/** The status line after a successful import, in the trainer's language. */
function importSuccessText(migrated, summary, reErased) {
  return [
    migrated
      ? deps.t("import_success_upgraded").replace("{version}", String(summary.fromVersion))
      : deps.t("import_success"),
    erasureNotice(reErased),
  ]
    .filter(Boolean)
    .join(" ");
}

function renderImportSuccess(summary, reErased) {
  const importStatus = document.getElementById("import-status");
  if (!importStatus) return;
  importStatus.textContent = importSuccessText(
    Boolean(summary && summary.fromVersion !== summary.toVersion),
    summary,
    reErased,
  );
  importStatus.className = "status-msg text-emerald";
}

/** "12 clients", "3 stranke": a collection's count in the trainer's language. A collection with
 *  no name of its own in the dictionary keeps its key, so nothing is hidden from the trainer. */
function collectionCount(collection, count) {
  const key = `restore_count_${collection}`;
  const text = countedText(deps.t, document.documentElement.lang, key, count);
  return text.startsWith(key) ? `${count} ${collection}` : text;
}

// Names what is about to be overwritten, per collection. "Replace 12 clients and 40 sessions?" is a
// sentence a trainer can weigh; "Are you sure?" is not.
function showReplaceConfirmation(replacing, migrationSummary) {
  const box = document.getElementById("restore-confirm");
  const detail = document.getElementById("restore-confirm-detail");
  if (!box || !detail) return;

  // What the import does to the FILE, shown whether or not there is anything on this device to lose.
  const forward = document.getElementById("restore-confirm-forward");
  const forwardText = document.getElementById("restore-confirm-forward-text");
  const movingForward = bringsDataForward(migrationSummary);
  if (forward && forwardText) {
    forward.hidden = !movingForward;
    if (movingForward) {
      // The steps in the trainer's own words, then the consequence. `describeMigration` already
      // produces the per-step notes the import banner shows.
      forwardText.textContent = `${describeMigration(migrationSummary).join("; ")} — ${
        deps.t("restore_brings_forward") ||
        "this brings the file's data forward, and it will no longer open in older builds of LibrePT."
      }`;
    }
  }
  // The replace half is only about THIS device, so it hides when there is nothing here to lose.
  const replaceLine = document.getElementById("restore-confirm-replace");
  if (replaceLine) replaceLine.hidden = replacing.total === 0;
  const parts = Object.entries(replacing.counts).map(([collection, count]) =>
    collectionCount(collection, count),
  );
  // Preview-only collections are named SEPARATELY, because they are worse off than the rest: every
  // other collection is replaced by whatever the file holds, while these are simply gone — a file
  // written at the stable schema has nowhere to put them (the staging area in recordSchemas.js).
  // This is the warning DATA_MODEL §1 says a preview shape needs; it had none until 2026-08-17.
  const lost = (replacing.notCarried || []).map((collection) =>
    collectionCount(collection, replacing.counts[collection]),
  );
  detail.textContent = lost.length
    ? `${parts.join(", ")} — ${deps.t("restore_preview_only_lost") || "and these are not in the file and cannot come back"}: ${lost.join(", ")}`
    : parts.join(", ");
  box.hidden = false;
}

/** The export card's own status line — what the last tap on Export did, in one sentence. */
function setExportStatus(key, tone = "") {
  const line = document.getElementById("export-status");
  if (!line) return;
  line.textContent = key ? deps.t(key) || key : "";
  line.className = tone ? `status-msg ${tone}` : "status-msg";
}

/**
 * Open an encrypted backup: the key this device already holds, or a password typed now.
 *
 * Returns the payload, or null when it could not be opened — which is NOT an error about the file.
 * Every null path leaves a message saying what happened and leaves the database untouched.
 *
 * The stored key is tried first and its failure is silent on purpose: a trainer restoring a file
 * written under an older password should be asked for that password, not told their own device is
 * broken.
 */
async function openEncryptedBackup(envelope) {
  const stored = await backupKeyForWriting();
  if (stored) {
    try {
      return await decryptBackup(envelope, { key: stored.key });
    } catch {
      /* Written with a different password. Ask for that one. */
    }
  }

  const key = await askToUnlock(envelope);
  if (!key) {
    setImportStatus("restore_nothing_changed");
    return null;
  }
  try {
    return await decryptBackup(envelope, { key });
  } catch {
    setImportStatus("backup_pw_wrong", "text-danger");
    return null;
  }
}

/**
 * The text of a chosen file, turned into a backup payload.
 *
 * **The envelope is read FIRST, before anything else touches the file** — including before any key
 * work. A version this build does not know may be compressed, or encrypted in a way this build cannot
 * open, and a collection check run first would see no arrays and the importer would write an empty
 * database over the trainer's real one. Refusing is the only safe answer to "I cannot open this".
 *
 * Returns null for a file that is locked and stayed locked, which is not a bad file and does not
 * throw: `openEncryptedBackup` has already said what happened.
 */
async function readImportedFile(text) {
  const parsed = JSON.parse(text);
  const format = resolveBackupFormat(parsed);
  if (format.unsupported) {
    throw new Error(
      `This backup is format version ${format.formatVersion}, which this version of LibrePT cannot open. Update LibrePT and try again — the file is unchanged.`,
    );
  }
  if (format.container !== AES_GCM_CONTAINER) return parsed;
  return openEncryptedBackup(parsed);
}

/** The import card's status line, so the encrypted paths report the way every other one does. */
function setImportStatus(key, tone = "") {
  const line = document.getElementById("import-status");
  if (!line) return;
  line.textContent = deps.t(key) || key;
  line.className = tone ? `status-msg ${tone}` : "status-msg";
}

/**
 * Say whether backups from this device are encrypted, and offer the two acts that change it.
 *
 * Read from the store on every dialog open rather than remembered: the password can be set on
 * another surface, forgotten here, or wiped with the database, and a remembered answer would be the
 * one thing on the card that is out of date.
 */
async function refreshEncryptionState() {
  const line = document.getElementById("backup-encryption-state");
  const manage = document.getElementById("btn-backup-pw-manage");
  const forget = document.getElementById("btn-backup-pw-forget");
  if (!line) return;

  const set = await hasBackupPassword();
  // Which workspace this answer is about. The sandbox is a second database with its own key, so a
  // password set here does not protect the trainer's own work and must not read as though it does.
  const inSandbox = activeWorkspace() === SANDBOX;
  line.textContent = inSandbox
    ? deps.t(set ? "backup_pw_sandbox_on" : "backup_pw_sandbox_off")
    : deps.t(set ? "backup_pw_state_on" : "backup_pw_state_off");
  line.className = set ? "status-msg text-emerald" : "status-msg text-danger";
  if (manage) {
    manage.hidden = false;
    const label = document.getElementById("btn-backup-pw-manage-text");
    if (label) label.textContent = deps.t(set ? "backup_pw_change" : "backup_pw_set");
  }
  if (forget) forget.hidden = !set;
}

export function initBackupRestore(d) {
  deps = d;
}

// Clear the previous import's status line. Called by the backup route before it shows the dialog.
export function prepareBackupDialog() {
  const importStatus = document.getElementById("import-status");
  if (importStatus) {
    importStatus.textContent = "";
    importStatus.className = "status-msg";
  }
  setExportStatus("");
  // Not awaited: the dialog shows now and the line fills a tick later. Holding the dialog on an
  // IndexedDB read would put a wait in front of every open of the backup centre.
  refreshEncryptionState();
}

export function renderBackupDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-backup"),
    `
<dialog id="dialog-backup" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 data-i18n="backup_center">Sync &amp; Backup Center</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close sync & backup modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body-scroll">
      <p class="dialog-desc" data-i18n="backup_desc">LibrePT stores your logs directly on this device. Sync the latest session schedule, download a backup file to keep your history safe, or import it to move to another phone.</p>

      <!-- Preview-build warning. A backup is written at the newest NUMBERED schema so any build can
           restore it, which means anything the preview shape added on top is NOT in the file. That
           is a real gap and it is stated here rather than left to be discovered after a restore.
           Spelled out in full, not an icon: this is the one thing a trainer needs to have read. -->
      <!-- Shown only when a restore would overwrite existing records. Hidden by default so the
           common case (restoring onto an empty device) stays one step. -->
      <div id="restore-confirm" class="restore-confirm" hidden>
        <p id="restore-confirm-replace"><i class="fa-solid fa-triangle-exclamation"></i>
          <strong data-i18n="restore_replaces_all">Restoring replaces everything on this device.</strong>
          <span data-i18n="restore_you_would_lose">You would lose:</span> <span id="restore-confirm-detail"></span>.
        </p>
        <!-- The other half of the consent: what the import does to the FILE. Bringing an
             older backup forward means it stops being openable by an older build the trainer may still
             have on a second phone — a one-way door, and one they should be told about before walking
             through it rather than after. Shown independently of the replace warning, because a restore
             onto an EMPTY device still walks through it. -->
        <p id="restore-confirm-forward" hidden><i class="fa-solid fa-arrow-up-right-dots"></i>
          <span id="restore-confirm-forward-text"></span>
        </p>
        <div class="restore-confirm-actions">
          <button type="button" class="btn-secondary" id="btn-restore-cancel" data-i18n="restore_keep">Keep what I have</button>
          <button type="button" class="btn-danger" id="btn-restore-confirm" data-i18n="restore_replace">Replace it</button>
        </div>
      </div>

      <p class="backup-preview-warning" id="backup-preview-warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span id="backup-preview-warning-text" data-i18n="backup_preview_warning">This is a preview build. Backups and sync are written in the last stable format, so anything added by this preview is not included. Keep your own copy of anything you cannot lose.</span>
      </p>

      <div class="backup-actions">
        <div class="action-card card">
          <i class="fa-solid fa-arrows-rotate backup-icon-large text-primary"></i>
          <h4 id="sync-data-title" data-i18n="sync_session_title">Sync Session Data</h4>
          <p id="sync-data-desc" data-i18n="sync_session_desc">Pull the latest bookings and session schedule from your connected calendar.</p>
          <button id="btn-sync-data" class="btn primary-btn w-full">
            <i class="fa-solid fa-arrows-rotate"></i> <span id="btn-sync-data-text" data-i18n="btn_sync_data">Sync Data</span>
          </button>
          <p id="sync-status" class="status-msg"></p>
        </div>

        <!-- The description, the connect button and the conflicts button are empty here: driveSyncUi.js
             writes all three from the dictionary on every render, by connection state. -->
        <div class="action-card card" id="drive-sync-card">
          <i class="fa-brands fa-google-drive backup-icon-large text-primary"></i>
          <h4 id="drive-sync-title" data-i18n="drive_sync_title">Cloud Backup (Google Drive)</h4>
          <p id="drive-sync-desc"></p>
          <!-- Sync carries the SAME stable-format limitation as a downloaded backup, and needs the
               warning more: an export is something a trainer chooses in the moment, while sync runs
               unattended, so there is no point at which they would otherwise be told. -->
          <p class="backup-preview-warning" id="drive-sync-preview-warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span id="drive-sync-preview-warning-text" data-i18n="drive_sync_preview_warning">Preview build: sync writes the last stable format, so anything this preview added is not mirrored.</span>
          </p>
          <button id="btn-drive-connect" class="btn primary-btn w-full">
            <i class="fa-brands fa-google-drive"></i> <span id="btn-drive-connect-text"></span>
          </button>
          <button id="btn-drive-disconnect" class="btn secondary-btn w-full hidden" data-i18n="drive_sync_disconnect">Disconnect</button>
          <div id="drive-sync-interval-row" class="drive-sync-interval-row hidden">
            <label for="drive-sync-interval" id="drive-sync-interval-label" data-i18n="drive_sync_interval_label">Sync every</label>
            <input type="number" id="drive-sync-interval" class="form-control drive-sync-interval-input" min="1" max="60" step="1">
            <span id="drive-sync-interval-unit" data-i18n="drive_sync_interval_unit">min</span>
          </div>
          <p id="drive-sync-status" class="status-msg"></p>
          <!-- Syncing FROM the sandbox writes its own file in the same Drive
               folder and spends the same grant. Said here, or a trainer reads "synced" and
               believes their own work is safe. Hidden outside the sandbox. -->
          <p id="drive-sync-sandbox-note" class="status-msg" data-i18n="sync_sandbox_note" hidden></p>
          <!-- Shown only when the copy in Drive is encrypted and this device has no key for it
               (driveSyncUi.js). It asks for the password THAT file was written with, which a newly
               set password cannot be. -->
          <button type="button" id="btn-drive-unlock" class="btn primary-btn w-full hidden"><i class="fa-solid fa-key"></i> <span id="btn-drive-unlock-text"></span></button>
          <button id="btn-drive-review-conflicts" class="btn secondary-btn w-full hidden"><i class="fa-solid fa-code-compare"></i> <span id="btn-drive-review-conflicts-text"></span></button>
        </div>

        <div class="action-card card">
          <i class="fa-solid fa-file-export backup-icon-large text-emerald"></i>
          <h4 id="backup-export-title" data-i18n="backup_export_title">Export Data Backup</h4>
          <p id="backup-export-desc" data-i18n="backup_export_desc">Download your clients, routines, and workout logs as a single JSON file.</p>
          <!-- Whether the file that leaves this device can be read by whoever finds it. Filled by
               refreshEncryptionState() on every open, because the answer is kept in the database and
               can change on another surface. -->
          <p id="backup-encryption-state" class="status-msg"></p>
          <button id="btn-export-db" class="btn primary-btn w-full" data-i18n="btn_export_json">Export JSON</button>
          <button type="button" id="btn-backup-pw-manage" class="btn secondary-btn w-full" hidden><i class="fa-solid fa-key"></i> <span id="btn-backup-pw-manage-text"></span></button>
          <button type="button" id="btn-backup-pw-forget" class="btn secondary-btn w-full" hidden data-i18n="backup_pw_forget">Forget it on this device</button>
          <p id="export-status" class="status-msg"></p>
        </div>

        <div class="action-card card">
          <i class="fa-solid fa-file-import backup-icon-large text-indigo"></i>
          <h4 id="backup-import-title" data-i18n="backup_import_title">Import Data Backup</h4>
          <p id="backup-import-desc" data-i18n="backup_import_desc">Load an existing \`.json\` backup file. This will merge or overwrite your current database.</p>
          <div class="file-upload-wrapper">
            <button type="button" id="btn-select-json" class="btn secondary-btn w-full file-trigger" data-i18n="btn_select_json">Select JSON File</button>
            <input type="file" id="import-db-file" accept=".json" class="file-input-hidden">
          </div>
          <p id="import-status" class="status-msg"></p>
        </div>

        <!-- A client's personal-data export, encrypted with a passphrase the trainer sent separately.
             Here with the rest of the data, and opened by modules/common/encryptedFileReader.js. -->
        <div class="action-card card">
          <i class="fa-solid fa-lock-open backup-icon-large text-indigo"></i>
          <h4 data-i18n="encrypted_title">Open an encrypted file</h4>
          <p data-i18n="encrypted_lead">For a personal-data export your trainer sent you.</p>
          <button type="button" id="btn-backup-open-encrypted" class="btn secondary-btn w-full" data-i18n="encrypted_open">Open</button>
        </div>
      </div>
    </div>
  </dialog>
`,
  );
}

// The dialog's "Sync Data" button. It lived in sessionsView.js's setupCalendarSessions until
// 2026-08-05 — the sessions dashboard wiring a button whose markup belongs to this
// dialog, which is why a test of the offline signal had to boot a sessions-module function to reach
// a backup-dialog button. import_layers.py cannot catch that: both sides were legal cross-feature
// imports and the problem was ownership, not direction.
//
// `state` and `renderSessions` come from deps rather than an import, so this module still knows
// nothing about the sessions feature beyond "re-render it when the data changes".
function setupCalendarSync() {
  const syncBtn = document.getElementById("btn-sync-data");
  if (!syncBtn) return;
  const { getState, t, saveToLocalStorage, renderSessions } = deps;

  syncBtn.addEventListener("click", () => {
    const icon = syncBtn.querySelector("i");
    const btnText = document.getElementById("btn-sync-data-text");
    const status = document.getElementById("sync-status");

    if (icon) icon.classList.add("fa-spin");
    if (btnText) btnText.textContent = t("syncing_calendar");
    if (status) {
      status.textContent = "";
      status.className = "status-msg";
    }
    syncBtn.disabled = true;

    if (isOfflineCachedActive() || !navigator.onLine) {
      if (status) {
        status.textContent = t("offline_cached_desc");
        status.className = "status-msg text-danger";
      }
      if (icon) icon.classList.remove("fa-spin");
      if (btnText) btnText.textContent = t("btn_sync_data");
      syncBtn.disabled = false;
      return;
    }

    setTimeout(() => {
      getState().sessions = [...DEFAULT_SESSIONS];

      // saveToLocalStorage() (deps.saveToLocalStorage — app.js's saveState()) fires
      // onStateSaved's listener on its own now, which re-renders the header badge with a real
      // ahead count — no separate reset call needed.
      saveToLocalStorage();
      renderSessions();

      if (icon) icon.classList.remove("fa-spin");
      if (btnText) btnText.textContent = t("btn_sync_data");
      syncBtn.disabled = false;
      if (status) {
        status.textContent = t("calendar_synced");
        status.className = "status-msg text-emerald";
      }
    }, 1200);
  });
}

export function setupBackupRestore() {
  renderBackupDialog();
  setupCalendarSync(); // after renderBackupDialog — #btn-sync-data is part of that markup
  const dialog = document.getElementById("dialog-backup");
  if (!dialog) return;

  document
    .getElementById("btn-backup-open-encrypted")
    ?.addEventListener("click", () => deps.openEncryptedFileReader?.());

  // Set the password, or change it. `changing` is what makes the dialog state the consequence a
  // change has and a first setting does not: the old files keep the old password.
  document.getElementById("btn-backup-pw-manage")?.addEventListener("click", async () => {
    const changing = await hasBackupPassword();
    const saved = await askToSet({ changing });
    if (saved) setExportStatus("backup_pw_saved", "text-emerald");
    await refreshEncryptionState();
  });

  document.getElementById("btn-backup-pw-forget")?.addEventListener("click", async () => {
    await forgetOnThisDevice();
    setExportStatus("backup_pw_forget_done");
    await refreshEncryptionState();
  });

  const importFile = document.getElementById("import-db-file");
  const importStatus = document.getElementById("import-status");

  // The dialog is a route: navigating opens it, so Back closes it and a reload reopens it. The
  // status line from a previous import is cleared by prepareBackupDialog(), which the route calls
  // before showing — a stale "restore failed" must not greet the next open.
  // ONE listener on the header cloud, not two. driveSyncUi.js used to add its own alongside this
  // one, so a connected tap both synced and opened the dialog — each listener correct on its own and
  // neither aware of the other. It now answers first, and this opens the dialog only for the taps it
  // declines: connected means sync directly; the dialog stays in the ☰ menu.
  const backupBtn = document.getElementById("backup-btn");
  if (backupBtn) {
    backupBtn.addEventListener("click", () => {
      if (handleHeaderCloudTap()) return;
      deps.navigateToPath(deps.urlFor("backup"));
    });
  }

  const closeBtn = dialog.querySelector(".modal-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => dialog.close());
  }

  // Restore confirmation. `confirmedRestore` is not a flag the import path checks forever — it is
  // cleared as soon as the pending state is applied, so a SECOND import still has to be confirmed.
  const restoreConfirmBtn = document.getElementById("btn-restore-confirm");
  if (restoreConfirmBtn) {
    restoreConfirmBtn.addEventListener("click", async () => {
      if (!pendingRestore) return;
      confirmedRestore = true;
      const summary = pendingSummary;
      const reErased = await applyRestoredState(pendingRestore);
      pendingSummary = null;
      const box = document.getElementById("restore-confirm");
      if (box) box.hidden = true;
      renderImportSuccess(summary, reErased);
      deps.renderClientsList();
      deps.renderRoutinesList();
      deps.renderExercisesList();
      deps.populateDropdownSelectors();
    });
  }

  const restoreCancelBtn = document.getElementById("btn-restore-cancel");
  if (restoreCancelBtn) {
    restoreCancelBtn.addEventListener("click", () => {
      // Discard the parsed file entirely rather than leaving it primed — a trainer who declined
      // once must not have it applied by an unrelated later click.
      pendingRestore = null;
      pendingSummary = null;
      confirmedRestore = false;
      const box = document.getElementById("restore-confirm");
      if (box) box.hidden = true;
      const status = document.getElementById("import-status");
      if (status) {
        status.textContent = deps.t("restore_nothing_changed") || "Nothing was changed.";
        status.className = "status-msg";
      }
    });
  }

  // Export JSON — the whole local database, for backup / device migration.
  const exportBtn = document.getElementById("btn-export-db");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      // Asked BEFORE the payload is built, so a declined dialog leaves no copy of the database in a
      // variable and nothing to accidentally write out.
      if (!(await ensureBackupPassword())) {
        setExportStatus("backup_pw_export_cancelled");
        return;
      }

      // Built at the newest NUMBERED schema, not at the runtime one (data/backupFile.js): a file
      // written at the unstable preview shape is restorable only by the build that wrote it.
      const payload = buildBackupPayload(deps.getState(), {
        // Stamped by the writer, so a restore never has to guess where a file came from.
        workspace: activeWorkspace(),
        buildSha: typeof BUILD_INFO?.commit === "string" ? BUILD_INFO.commit : null,
        // Carried so the erasure register survives a reinstall — see erasureSuppression.js.
        suppressions: readSuppressionList(),
      });

      const stored = await backupKeyForWriting();
      // Indented plain JSON stays indented: a trainer opening the file in a text editor to check it
      // is real is a thing that happens. An envelope has nothing in it to read, so it is written
      // compactly.
      const written = stored
        ? JSON.stringify(
            await encryptBackup(payload, {
              key: stored.key,
              salt: stored.salt,
              iterations: stored.iterations,
              formatVersion: ENCRYPTED_BACKUP_FORMAT,
            }),
          )
        : JSON.stringify(payload, null, 2);
      downloadFile(
        written,
        `librept_backup_${new Date().toISOString().substring(0, 10)}.json`,
        "application/json",
      );
      setExportStatus(stored ? "backup_pw_exported_encrypted" : "backup_pw_exported_plain");
      // A downloaded file is a real backup, so it answers the unbacked-data warning's "is this
      // data anywhere durable" exactly as a Drive sync does. Recording it is what keeps the
      // coming unbacked warning honest — a trainer who exports weekly must be able to clear it
      // WITHOUT connecting Google, or a safety indicator becomes a prompt to enable an integration.
      recordBackupTaken("file");
    });
  }

  // Trigger file click
  const fileTrigger = dialog.querySelector(".file-trigger");
  if (fileTrigger && importFile) {
    fileTrigger.addEventListener("click", () => {
      importFile.click();
    });
  }

  // Import JSON File
  if (importFile) {
    importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const importedData = await readImportedFile(evt.target.result);
          // Locked, and the trainer gave up or typed the wrong password. `readImportedFile` has
          // already said which; the database is untouched.
          if (!importedData) return;

          // Simple verification schema
          if (
            importedData &&
            Array.isArray(importedData.clients) &&
            Array.isArray(importedData.exercises)
          ) {
            // Refused WHOLE, and here rather than at the button: this is the seam
            // every file comes in through, and the erasure register is already filtered one line
            // further on for the same class of reason — something that must not come back in.
            // Sample data must never enter the trainer's own database; the other direction is fine.
            if (refusesRestoreInto(importedData, activeWorkspace())) {
              throw new Error(deps.t("restore_refused_sandbox_file"));
            }

            // A backup is restored WHOLE. Rebuilding a fixed set of collections here silently
            // dropped everything not listed — sessions, plan updates, notifications — so a restore
            // quietly destroyed data the export had faithfully written out. Anything the file
            // carries is kept, including keys a newer build added that this one does not know.
            const { ok, state: restored, summary } = migrateState(importedData);
            if (!ok) {
              // A backup from a NEWER build (or one this version cannot migrate) is refused rather
              // than half-imported over the trainer's live database.
              throw new Error(describeMigration(summary).join("; ") || "Unmigratable backup.");
            }

            // A restore REPLACES the database — the file is a snapshot, and merging two databases
            // without a common ancestor is guesswork (that ancestor is what Drive sync's three-way
            // merge has and a file import does not). Replacing is right; replacing SILENTLY is not:
            // a trainer setting up a new phone who has already entered a client would lose it with
            // no warning. So when there is anything to lose, the restore waits for a confirmation
            // that names what it is about to overwrite.
            // Consent is needed for either consequence: losing what is on this device, OR taking the
            // file through a one-way door. The second is why an empty device is no longer a silent
            // restore — it was the case that skipped the prompt entirely.
            const replacing = summarizeReplacement(deps.getState());
            if ((replacing.total > 0 || bringsDataForward(summary)) && !confirmedRestore) {
              pendingRestore = restored;
              pendingSummary = summary;
              showReplaceConfirmation(replacing, summary);
              return;
            }
            const reErased = await applyRestoredState(restored);

            // Re-render
            deps.renderClientsList();
            deps.renderRoutinesList();
            deps.renderExercisesList();
            deps.populateDropdownSelectors();

            if (importStatus) {
              importStatus.textContent = importSuccessText(
                summary.applied.length > 0,
                summary,
                reErased,
              );
              importStatus.className = "status-msg text-emerald";
            }
          } else {
            throw new Error("Missing core structure validation.");
          }
        } catch (err) {
          if (importStatus) {
            importStatus.textContent = "Error: Invalid backup file format.";
            importStatus.className = "status-msg text-danger";
          }
          console.error("Import file parse error:", err);
        }
      };
      reader.readAsText(file);
    });
  }
}
