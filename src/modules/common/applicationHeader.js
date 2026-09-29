// src/modules/common/applicationHeader.js
// Handles the shared top header bar actions: theme, language, logo clicks, and synchronization/backup badge.
// It owns the markup of the `#app-header` shell. The ☰ menu has five places: training sessions,
// client directory, exercises and routines, data management, settings. Inside the sandbox only, a
// sixth entry, *Leave the sandbox*, is added.
// It also owns `#dialog-settings` (language and theme switchers, the trainer's details, the app
// version, the sandbox, help and legal) and the dialogs `#dialog-about` and `#dialog-terms`.
//
// deps: {
//   getState(),
//   t,
//   saveToLocalStorage(),
//   changeLanguage(lang),
//   navigateToPath(path),
// }

import { driveSyncStatus } from "../../data/driveSyncService.js";
import { ISSUE_TRACKER_URL } from "../../data/publicUrls.js";
import { isDemoOnlyStore } from "../../data/seedProvenance.js";
import { SANDBOX, WORKING, isSandbox } from "../../data/workspace.js";
import { TRANSLATIONS, dictionaryFor, resolveLang } from "../../i18n/index.js";
import { countedText } from "../../i18n/plural.js";
import { isGuideSurface, renderMarkupOnce } from "./dom.js";
import { syncGlyphFor } from "./syncStatusGlyph.js";
import { setupThemeSwitcher } from "./theme.js";

let deps = null;

export function initApplicationHeader(d) {
  deps = d;
}

let isOfflineCached = false;

export function setOfflineCachedState(val) {
  isOfflineCached = val;
  renderSyncBadge();
}

export function isOfflineCachedActive() {
  return isOfflineCached;
}

const SYNC_BUTTON_BASE_LABEL = "Sync & Backup Data";

/** Repaints the header cloud's overlay glyph for the current sync state, and says in the button's
 * aria-label what that glyph MEANS — the shape alone would be a hover tooltip's problem in another
 * costume, unreachable on touch and silent to a screen reader. */
function renderSyncCloudIcon(status) {
  const wrap = document.getElementById("sync-cloud-icon");
  const overlay = document.getElementById("sync-cloud-overlay");
  if (!wrap || !overlay) return;

  const glyph = syncGlyphFor(status);
  wrap.className = `cloud-sync-icon ${glyph.stateClass}`;
  overlay.className = glyph.overlayIcon;

  const stateLabel = deps?.t ? deps.t(glyph.labelKey) || glyph.labelFallback : glyph.labelFallback;
  // The base in the chosen language too; only the state half was translated.
  const baseLabel = deps?.t?.("backup_center") || SYNC_BUTTON_BASE_LABEL;
  document.getElementById("backup-btn")?.setAttribute("aria-label", `${baseLabel} — ${stateLabel}`);
}

/** The unbacked-data warning, driven by backupHealthController's assessment.
 *
 * **Spelled out, never an icon alone**, for the same reason the PREVIEW badge spells itself out: a
 * bare coloured triangle is an unexplained warning whose meaning lives only in an aria-label, which
 * is the hover problem in another costume — and this one is about losing a
 * trainer's entire client history.
 *
 * **Static, never animated.** A permanent pulse in a fixed header is ignored within a day, competes
 * with the live session for peripheral attention, and would devalue the PREVIEW badge beside it.
 * Escalation is carried by colour and wording, and only `urgent` — the browser reporting this
 * origin's storage as evictable — earns the loud treatment.
 */
export function renderBackupBadge(health) {
  const badge = document.getElementById("unbacked-badge");
  if (!badge) return;

  const level = health?.level || "none";
  badge.classList.toggle("hidden", level === "none");
  badge.classList.toggle("unbacked-badge-urgent", level === "urgent");
  if (level === "none") return;

  const count = health.unbackedCount;
  const label =
    level === "urgent"
      ? deps?.t
        ? deps.t("unbacked_urgent")
        : "AT RISK — BACK UP"
      : deps?.t
        ? deps.t("unbacked_due")
        : "NOT BACKED UP";
  // Static markup, then textContent for the one dynamic part — the label never reaches an HTML sink,
  // so there is nothing here for an escaping audit to have to reason about.
  badge.innerHTML =
    '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i>' +
    '<span class="unbacked-badge-label"></span>';
  badge.querySelector(".unbacked-badge-label").textContent = label;
  // The count rides in the accessible name rather than the pill, which stays narrow beside PREVIEW —
  // and "23 changes" is the part that makes the warning concrete when read aloud.
  // Both the noun and the VERB agree: "1 change exist" is the kind of wrongness a screen-reader
  // user hears in full, on the one message that is asking them to act.
  const changes = count === 1 ? "1 change exists" : `${count} changes exist`;
  badge.setAttribute(
    "aria-label",
    `${label} — ${changes} only on this device. Open Sync & Backup.`,
  );
}

/**
 * Names the build state the trainer is actually in: DEMO while the store holds nothing but the
 * seeded demo, PREVIEW otherwise.
 *
 * One slot, two competing claims, and `isDemoOnlyStore` is where the ordering is argued. The badge
 * keeps its link to the data-loss notice in both of THOSE states — it is still a preview build
 * either way, and that notice is the only place the risk is explained without signal.
 *
 * **In the sandbox it is a marker and nothing else** (ruled 2026-09-10): a notice about
 * losing the trainer's data is the wrong destination from a workspace whose contents are sample
 * data, and what a trainer in there needs to read is one tap away in the feed's leading card.
 * The `href` is removed rather than pointed somewhere else — an `<a>` without one is not
 * focusable and not clickable, so the badge stops offering what it cannot honour — and it is put
 * back on the way out, because the same element serves every state.
 *
 * A demo is not a hazard, so the demo state drops the warning triangle and the pulse the CSS gives
 * the amber pill; it states a fact, in a word, at the same size.
 */
export function renderBuildStateBadge(state) {
  const badge = document.getElementById("preview-badge");
  if (!badge) return;

  // The SANDBOX claim outranks both, and unlike the other two it is a fact rather than
  // a reading of the records: the workspace either is the sandbox or it is not. `isDemoOnlyStore`
  // still answers for the working workspace, which a `?init=demo_data_load` link can fill with
  // sample data without any workspace being involved.
  const sandbox = isSandbox();
  const showingDemo = sandbox || isDemoOnlyStore(state);
  badge.classList.toggle("is-demo", showingDemo);
  if (sandbox) {
    badge.removeAttribute("href");
    badge.removeAttribute("target");
    // Announced as what it now is: a status, not a link somebody could follow.
    badge.setAttribute("role", "status");
  } else {
    badge.setAttribute("href", "./preview.html");
    badge.setAttribute("target", "_blank");
    badge.removeAttribute("role");
  }
  // The one place the label is written, in every state and every language: a second writer (the
  // static translation pass used to map `preview_badge` here too) would put "Preview" back over the
  // sandbox or the demo on the next language change.
  const t = deps?.t || ((key) => key);
  badge.querySelector(".preview-badge-label").textContent = t(
    sandbox ? "sandbox_badge" : showingDemo ? "demo_badge" : "preview_badge",
  );
  badge.querySelector("i").className = showingDemo
    ? "fa-solid fa-flask"
    : "fa-solid fa-triangle-exclamation";
  badge.setAttribute(
    "aria-label",
    t(sandbox ? "sandbox_badge_desc" : showingDemo ? "demo_badge_desc" : "preview_badge_desc"),
  );
}

/**
 * Everything on the shell that says WHICH workspace the trainer is in: the tint on the
 * whole header, and the menu item's words.
 *
 * **The tint, not only the badge.** A badge read at arm's length, one-handed, between sets is not
 * enough to stop somebody logging a real set into the sandbox. The colour is on the `<body>` so a
 * stylesheet can carry it across the header and anything else that needs it, rather than each
 * surface asking where it is.
 *
 * The menu item's words flip with the same fact, so the way out is labelled as the way out.
 */
export function renderWorkspaceChrome() {
  const sandbox = isSandbox();
  document.body?.classList.toggle("in-sandbox", sandbox);

  // Rebuilding is offered only from inside. Toggled HERE rather than at the two call
  // sites that switch workspaces, so an item that must never be reachable from the trainer's own
  // work cannot be left behind by a path that forgot: this is the one function that repaints on
  // every switch.
  document.getElementById("menu-sandbox-reset")?.classList.toggle("hidden", !sandbox);
  document.getElementById("menu-sandbox-leave")?.classList.toggle("hidden", !sandbox);

  const label = document.getElementById("menu-sandbox-text");
  if (!label) return;
  const key = sandbox ? "menu_sandbox_leave" : "menu_sandbox_enter";
  // The attribute stays in step with the text, or the next language switch repaints the item with
  // whichever direction happened to be in the markup (i18n/domMappings.js reads this).
  label.setAttribute("data-i18n", key);
  label.textContent = deps?.t?.(key) || label.textContent;
}

export function renderSyncBadge() {
  const badge = document.getElementById("sync-badge");
  if (!badge) return;

  if (isOfflineCached) {
    // Repaint the cloud before returning, or it keeps whatever it last showed — a sync that was in
    // flight when the server went away would leave the arrows spinning here forever, and an idle
    // grant would keep claiming a connection that cannot possibly work. Running from cached code
    // means no sync can succeed whatever the grant says, which is the not-connected glyph.
    renderSyncCloudIcon({ configured: false });
    badge.classList.remove("hidden");
    badge.innerHTML = `<span class="sync-offline" title="${deps?.t ? deps.t("offline_cached_desc") : "HTTP server unreachable. Running on cached code."}"><i class="fa-solid fa-plug-circle-xmark"></i> Offline</span>`;
    badge.setAttribute(
      "aria-label",
      deps?.t ? deps.t("offline_cached_desc") : "HTTP server unreachable. Running on cached code.",
    );
    return;
  }

  // Real counts, no longer a mock: `local` is how many of THIS device's own
  // records differ from the last Drive-synced ancestor (0 with no Drive target configured — see
  // driveSyncService.js's getAheadCount doc comment); `remote` is a read-only diff against the same
  // ancestor, kept fresh by periodic/resume counter refreshes rather than a background sync (syncing
  // itself is manual-only) — "unknown" ("?" below) only when cloud is unreachable or unconfigured.
  const status = driveSyncStatus();
  renderSyncCloudIcon(status);
  const {
    ahead: local,
    behind: remote,
    configured: isCloudConfigured,
    reachable: isCloudReachable,
  } = status;

  // When cloud is unreachable or not configured, display '?' for behind count
  const isUnreachable = !isCloudConfigured || !isCloudReachable;

  // Past 9 the digit is dropped so the pill stays narrow, and the two directions use DIFFERENT
  // stand-ins on purpose. Ahead gets `↑!`: those edits exist only on this device, so
  // "many" is the point. Behind keeps `↓↓`, because behind means Drive holds changes not pulled yet
  // — nothing is at risk — and an alarm glyph there would flatten the distinction that makes the
  // ahead one mean anything.
  const cell = (n, dir, isBehind = false) => {
    if (isBehind && isUnreachable) {
      return `<i class="fa-solid fa-arrow-down"></i>?`;
    }
    const arrow = `<i class="fa-solid fa-arrow-${dir}"></i>`;
    if (n <= 9) return arrow + String(n);
    return arrow + (isBehind ? arrow : "!");
  };

  const aheadClass = local === 0 ? "sync-zero" : "sync-ahead";
  const behindClass = remote === 0 && !isUnreachable ? "sync-zero" : "sync-behind";

  badge.classList.remove("hidden");
  // The counters go quiet with the cloud when there is nothing to sync WITH (wanted 2026-08-18).
  // Set here rather than derived in CSS from a sibling's state: the answer is already known at this
  // point, and a `:has()` selector reaching across the header would make the colour depend on the
  // markup's ORDER, which nothing else about it does.
  badge.classList.toggle("is-disconnected", !isCloudConfigured || !isCloudReachable);
  badge.innerHTML =
    `<span class="${aheadClass}">${cell(local, "up")}</span>` +
    `<span class="${behindClass}">${cell(remote, "down", true)}</span>`;
  const t = deps?.t || ((key) => key);
  const lang = document.documentElement.lang;
  const remoteText = isUnreachable
    ? t("sync_badge_behind_unknown")
    : countedText(t, lang, "sync_badge_behind", remote);
  badge.setAttribute(
    "aria-label",
    `${countedText(t, lang, "sync_badge_ahead", local)}, ${remoteText}`,
  );
}

export function renderAboutDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-about"),
    `
<dialog id="dialog-about" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="about-title">About LibrePT</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close about modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body-scroll">
      <p id="about-body" class="dialog-desc">LibrePT is a free, open-source, offline-first clipboard for personal trainers — schedule sessions, run them on the gym floor, and track client progress. All data stays on your device.</p>
      <a id="about-repo-link" class="btn secondary-btn w-full" target="_blank" rel="noopener noreferrer">
        <i class="fa-brands fa-github"></i> View the project on GitHub
      </a>
      <!-- Attribution has to be reachable from the INSTALLED app, not only the repository:
           THIRD_PARTY_NOTICES.md lives at the repo root and run_build copies only src/, so a phone
           user would never see it. CC BY 4.0 requires attribution and the SIL OFL requires its
           notice to travel with each redistributed copy — and these fonts are redistributed to
           every visitor. A <details> keeps it one tap away instead of hidden behind a hover, which
           on a touch device would mean not present at all.
           Copyright lines and licence names are deliberately NOT translated: they are legal
           identifiers, and altering them defeats the notice. Only the summary label is. -->
      <details class="about-attribution">
        <summary id="about-licenses-label">Licences &amp; attribution</summary>
        <p class="dialog-desc">
          LibrePT is MIT-licensed. Copyright &copy; 2026 Simon Tutek.
        </p>
        <p class="dialog-desc">
          Icons: <a href="https://fontawesome.com/license/free" target="_blank" rel="noopener noreferrer">Font Awesome Free 6.4.0</a>,
          copyright 2023 Fonticons, Inc. — icons CC BY 4.0, fonts SIL OFL 1.1, code MIT.
          The stylesheet was modified (local paths, unused faces removed); the fonts are unmodified.
        </p>
        <p class="dialog-desc">
          Typefaces, all under the <a href="https://openfontlicense.org" target="_blank" rel="noopener noreferrer">SIL Open Font License 1.1</a>,
          subset to latin + latin-ext:
          DM&nbsp;Sans (copyright 2014 The DM Sans Project Authors),
          Outfit (copyright 2021 The Outfit Project Authors),
          JetBrains&nbsp;Mono (copyright 2020 The JetBrains Mono Project Authors).
        </p>
      </details>
    </div>
  </dialog>
`,
  );
}

/** Settings: everything the ☰ menu held that is not a place to work in — the language, the theme,
 *  the trainer's details, the app version, the sandbox, and help and legal. Routed (`/settings`), so
 *  Back closes it. The controls keep the ids they had in the menu, so their wiring (setupAppMenu and
 *  the language and theme switchers above) did not move with them. */
export function renderSettingsDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-settings"),
    `
<dialog id="dialog-settings" class="dialog-modal card glassmorphic">
  <div class="modal-header">
    <h3 data-i18n="menu_settings">Settings</h3>
    <button class="modal-close-btn" data-i18n-label="close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="settings-list">
    <div class="menu-control-row">
      <label class="menu-control-label" for="lang-switcher"><i class="fa-solid fa-language" aria-hidden="true"></i> <span id="menu-label-lang">Language</span></label>
      <!-- Options come from the registry of shipped dictionaries (i18n/index.js), the same
           way the theme options come from theme.js: a language is added by adding its
           file, and this menu has nothing to remember. -->
      <select id="lang-switcher" class="form-control menu-select" aria-label="Switch Language / Zamenjaj jezik"></select>
    </div>
    <div class="menu-control-row">
      <label class="menu-control-label" for="theme-switcher"><i class="fa-solid fa-palette" aria-hidden="true"></i> <span id="menu-label-theme">Theme</span></label>
      <!-- Options come from THEMES (theme.js), so a theme is listed in one place. -->
      <select id="theme-switcher" class="form-control menu-select" aria-label="Theme / Tema"></select>
    </div>
    <!-- The trainer's own name, phone and address. With the settings rather than with the clients:
         there is one trainer per install, and what they type here signs every invitation. -->
    <button id="menu-trainer-details" class="session-menu-item">
      <i class="fa-solid fa-id-card"></i> <span data-i18n="menu_trainer_details">My details</span>
    </button>
    <!-- Which supported version of the app this device runs. Choosing one reloads the app. -->
    <button id="menu-app-version" class="session-menu-item">
      <i class="fa-solid fa-code-compare"></i> <span data-i18n="menu_app_version">App version</span>
    </button>
    <!-- Every outside service the app holds a credential for, each one clearable or revocable. -->
    <button id="menu-connected-accounts" class="session-menu-item">
      <i class="fa-solid fa-link"></i> <span data-i18n="menu_connected_accounts">Connected accounts</span>
    </button>
    <!-- One control, both directions: its label says which one it is. -->
    <button id="menu-sandbox" class="session-menu-item">
      <i class="fa-solid fa-flask"></i> <span id="menu-sandbox-text" data-i18n="menu_sandbox_enter">Enter the sandbox</span>
    </button>
    <!-- Only ever shown INSIDE the sandbox: from the trainer's own work it would be an offer to
         rebuild a workspace they are not looking at. -->
    <button id="menu-sandbox-reset" class="session-menu-item hidden">
      <i class="fa-solid fa-arrows-rotate"></i> <span id="menu-sandbox-reset-text" data-i18n="menu_sandbox_reset">Reset sandbox data</span>
    </button>
    <h4 class="settings-heading" data-i18n="settings_help_heading">Help and legal</h4>
    <a id="menu-github" class="session-menu-item" target="_blank" rel="noopener noreferrer">
      <i class="fa-brands fa-github"></i> GitHub project
    </a>
    <!-- The route out for someone with no GitHub account, which is most personal trainers. Above
         the bug-reporting page because most of what a trainer wants to say is not a bug. -->
    <button id="menu-feedback" class="session-menu-item">
      <i class="fa-solid fa-comment-dots"></i> <span data-i18n="menu_feedback">Send feedback</span>
    </button>
    <a id="menu-bug-report" class="session-menu-item" href="./bug-reporting.html" target="_blank" rel="noopener noreferrer">
      <i class="fa-solid fa-bug"></i> Bug Reporting
    </a>
    <button id="menu-about" class="session-menu-item">
      <i class="fa-solid fa-circle-info"></i> About
    </button>
    <button id="menu-terms" class="session-menu-item">
      <i class="fa-solid fa-shield-halved"></i> Terms &amp; disclaimer
    </button>
    <a id="menu-privacy" class="session-menu-item" href="./privacy.html" target="_blank" rel="noopener noreferrer">
      <i class="fa-solid fa-lock"></i> Privacy &amp; GDPR Statement
    </a>
  </div>
</dialog>
`,
  );
}

export function renderTermsDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-terms"),
    `
<dialog id="dialog-terms" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="terms-title">Terms &amp; Disclaimer</h3>
      <button class="modal-close-btn" data-i18n-label="modal_close" aria-label="Close terms modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body-scroll">
      <p id="terms-body" class="dialog-desc">LibrePT is provided "as is", without warranty of any kind. It is not medical, health, or professional training advice. Your data stays on your device and you are responsible for backing it up. Use at your own risk.</p>
    </div>
    <div class="modal-actions">
      <button id="btn-terms-agree" class="btn primary-btn w-full">I agree</button>
    </div>
  </dialog>
`,
  );
}

export function renderHeaderShell() {
  renderMarkupOnce(
    "app-header",
    (header) => header.querySelector(".header-container"),
    `
    <div class="header-container">
      <!-- An anchor, not a div with a click handler (reported 2026-08-18: "does not link to
           homepage"). It was literally not a link — nothing to focus, nothing to open in a new tab,
           and a screen reader announced it as nothing. The href is the app's own root and the
           handler below cancels the browser's navigation, so it stays a single-page app: a real
           page load in a basement gym is the one thing that must never be required. -->
      <a class="logo-area" id="logo-area" href="./">
        <img class="logo-icon" src="icons/icon-96.png" alt="" width="34" height="34">
        <h1>LibrePT</h1>
      </a>

      <!-- Both build markers stack here, PREVIEW over the version stamp: they answer the same
           question ("what am I running?"), and side by side in the logo row the pill was taking
           horizontal space out of <h1> on narrow phones (Galaxy S23 Ultra and similar). Stacked,
           it costs height the header already has instead of width it does not.
           The word PREVIEW is spelled out, not reduced to an icon. It briefly wasn't — a bare
           pulsing triangle is an unexplained warning, with its meaning reachable only through an
           aria-label and an external link, which is the hover problem in another costume
           for what is a data-loss warning. -->
      <div class="header-build-stack">
        <!-- The data-loss notice ships as a page (agent_tools/render_docs.py). It used to open
             github.com, which needs signal — so the one warning that tells a trainer their data can
             vanish was itself unreachable in the basement gym this app is built for. -->
        <a id="preview-badge" class="preview-badge"
           href="./preview.html"
           target="_blank" rel="noopener noreferrer"
           aria-label="Preview build — pre-release, may lose data. Open the risks & data-loss notice.">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <span id="preview-badge-label" class="preview-badge-label">PREVIEW</span>
        </a>
        <!-- Hidden until there is unbacked work worth naming; filled by
             renderBackupBadge(). A BUTTON, not a link to an explainer: the remedy is the Sync &
             Backup dialog, which offers both a downloaded file and a Drive sync, so tapping the
             warning lands on the two things that resolve it rather than on prose about them. -->
        <button type="button" id="unbacked-badge" class="unbacked-badge hidden" aria-haspopup="dialog"></button>
        <!-- Tappable: the long build identity used to live in a \`title\` tooltip, which a phone
             cannot reach. Opens #dialog-build-info instead. -->
        <button type="button" id="app-version" class="app-version" data-i18n-label="app_version_button_label" aria-label="Build version — tap for details" aria-haspopup="dialog"></button>
      </div>

      <div class="header-actions">
        <!-- Normal view actions -->
        <div class="normal-header-actions">
          <button id="backup-btn" class="icon-btn sync-backup-btn" aria-label="Sync & Backup Data">
            <!-- Cloud + recycle: this one control now covers both syncing session data and
                 backup/restore (the separate home-page Sync button was merged in here). -->
            <!-- The overlay glyph is state-driven (renderSyncCloudIcon): spinning arrows while
                 syncing, a warning triangle after a failure, a slash when not connected. Its
                 markup here is the idle state, so a build that never boots the header still shows
                 something coherent. -->
            <span id="sync-cloud-icon" class="cloud-sync-icon is-idle" aria-hidden="true">
              <i class="fa-solid fa-cloud"></i>
              <i id="sync-cloud-overlay" class="fa-solid fa-arrows-rotate"></i>
            </span>
            <!-- GitHub-style ahead/behind counters, real (driveSyncService.js): local
                 edits since the last Drive sync / remote changes not yet pulled, filled in by
                 renderSyncBadge(). -->
            <span id="sync-badge" class="sync-badge hidden"></span>
          </button>
          <!-- Application overflow menu (☰): app-level actions, mirrors the .session-menu
               dropdown pattern (toggle + close-on-outside-click), wired in applicationHeader.js. -->
          <div class="app-menu-wrap">
            <button id="btn-app-menu" class="icon-btn" aria-label="Menu / Meni" aria-haspopup="true" aria-expanded="false">
              <i class="fa-solid fa-bars"></i>
            </button>
            <div id="app-menu" class="session-menu hidden" role="menu">
              <!-- Five entries: the places the trainer works in, then one place for the data and one
                   for everything else. Each row opens a place; none acts on its own. -->
              <!-- Only INSIDE the sandbox, and first: leaving it may be needed with a session about
                   to start, and a way out that has to be hunted for is a way out that is not there.
                   Entering it is occasional, so that lives in Settings. -->
              <button id="menu-sandbox-leave" class="session-menu-item hidden" role="menuitem">
                <i class="fa-solid fa-flask"></i> <span data-i18n="menu_sandbox_leave">Leave the sandbox</span>
              </button>
              <button id="menu-sessions" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-calendar-days"></i> <span data-i18n="menu_sessions">Training sessions</span>
              </button>
              <button id="menu-clients-register" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-users"></i> <span id="menu-clients-register-text" data-i18n="menu_clients_register">Clients Directory</span>
              </button>
              <button id="menu-library" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-dumbbell"></i> <span data-i18n="menu_library">Exercises and routines</span>
              </button>
              <button id="menu-data" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-database"></i> <span data-i18n="menu_data">Data management</span>
              </button>
              <button id="menu-settings" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-gear"></i> <span data-i18n="menu_settings">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
`,
  );
}

/** Measure the header and publish its height for everything that sits below it.
 *
 * Five surfaces need a NUMBER for the top of the app: the notification area's height, the clipboard
 * overlay's `top` and its height, and the guided walkthrough's card offset. They used to read a
 * height the header was TOLD to have — which made the bar's real size and the number two facts that
 * could disagree, and they did, quietly, whenever the bar's content changed.
 *
 * So the bar now has no height of its own (applicationHeader.css) and this reports what it turned
 * out to be. A ResizeObserver rather than one measurement at boot: the bar grows when a badge
 * appears, when a Slovenian label wraps, when the font loads.
 *
 * The same pattern sessionTimeline.js already uses for --sessions-header-sticky-top, for the same
 * reason and with the same shape.
 */
let headerHeightObserver = null;

export function publishHeaderHeight() {
  const header = document.getElementById("app-header");
  if (!header) return;
  const write = () => {
    const height = Math.round(header.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty("--hdr-height", `${height}px`);
    }
  };
  headerHeightObserver?.disconnect();
  headerHeightObserver = new ResizeObserver(write);
  headerHeightObserver.observe(header);
  write();
}

export function setupApplicationHeader() {
  renderHeaderShell();
  // Right after the shell exists and before anything else measures against it.
  publishHeaderHeight();
  renderAboutDialog();
  renderTermsDialog();
  // Before the language and theme switchers below, which live in it.
  renderSettingsDialog();

  // Both repository links read the ONE declaration (data/publicUrls.js) rather than carrying a copy in
  // markup — the address appeared in five places before 2026-08-18, and a moved repository would have
  // left the ones nobody grepped for. Assigned here rather than interpolated into the markup string,
  // which keeps the template free of anything build/frontend_audit.py has to read as a sink.
  for (const id of ["about-repo-link", "menu-github"]) {
    const link = document.getElementById(id);
    if (link) link.href = ISSUE_TRACKER_URL;
  }
  // The app name is the way home. It cancels the browser's own navigation and routes in place —
  // the href exists so this is a real link (focusable, openable in a new tab, announced as one),
  // not so a tap reloads the app.
  //
  // A modified click is left alone deliberately: ctrl/cmd/middle-click means "open a copy", and
  // swallowing that would be the second half of the same bug this fixes.
  const logoArea = document.getElementById("logo-area");
  if (logoArea) {
    logoArea.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      deps.navigateToPath("/");
    });
  }

  // Language switcher setup
  const langSwitcher = document.getElementById("lang-switcher");
  if (langSwitcher) {
    // Each language named in ITSELF, never translated: a trainer looking for their own language in
    // a menu written in one they cannot read has only the name to go by. Same rule as the splash's
    // language step.
    langSwitcher.replaceChildren();
    for (const code of Object.keys(TRANSLATIONS)) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = dictionaryFor(code).language_name || code.toUpperCase();
      langSwitcher.append(option);
    }
    // resolveLang, not the raw value: an unchosen language is null, and assigning null to a
    // <select> leaves it showing nothing at all.
    langSwitcher.value = resolveLang(deps.getState().lang);
    // The same function the welcome screen's language step calls: one list of views to re-draw, so
    // neither path can leave text built in code in the language it had before.
    langSwitcher.addEventListener("change", (e) => deps.changeLanguage(e.target.value));
  }

  // Theme switcher setup — owned by modules/common/theme.js, which is also what app.js boots the
  // initial theme through, so the switcher and the boot path can no longer disagree.
  setupThemeSwitcher(resolveLang(deps.getState().lang));

  // Application overflow (☰) menu
  setupAppMenu();

  // The disclaimer's own controls. On a first run the welcome screen asks for it as a step, after the
  // language — see askForTermsAgreement.
  setupFirstRunTerms();
}

/**
 * Leave Settings the way Back does, then `act`. The workspace switch remembers the address as the
 * view to come back to, and with Settings open that address is `/settings`: the trainer came back to
 * a dialog, and Settings stayed open over the workspace they had just entered. Going back first puts
 * the view underneath in the address bar, and the router closes Settings on the way. The router's
 * own popstate listener was added at boot, so it has run by the time this one does.
 */
function afterLeavingSettings(act) {
  const settings = document.getElementById("dialog-settings");
  if (!settings?.open || !settings.dataset.routeName) {
    act();
    return;
  }
  window.addEventListener("popstate", () => act(), { once: true });
  history.back();
}

// Wires the ☰ header menu: toggle + close-on-outside-click (mirrors the .session-menu
// pattern), plus each placeholder/real action and its About / Terms modals.
function setupAppMenu() {
  const menuBtn = document.getElementById("btn-app-menu");
  const menu = document.getElementById("app-menu");
  if (!menuBtn || !menu) return;

  const closeMenu = () => {
    menu.classList.add("hidden");
    menuBtn.setAttribute("aria-expanded", "false");
  };
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !menu.classList.contains("hidden");
    menu.classList.toggle("hidden", isOpen);
    menuBtn.setAttribute("aria-expanded", String(!isOpen));
  });
  // Dismiss on any outside click — except on the guide, which is not the app (dom.js explains why:
  // reported 2026-08-22, the demo's step 2 pointed at a menu item that Show me had just closed).
  document.addEventListener("click", (e) => {
    if (isGuideSurface(e.target)) return;
    if (!menu.classList.contains("hidden") && !e.target.closest(".app-menu-wrap")) {
      closeMenu();
    }
  });

  const on = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
  };

  // The five places. Each navigates to a route, so Back returns and a reload stays.
  const goto = (route) => {
    closeMenu();
    if (deps?.navigateToPath) deps.navigateToPath(route);
  };
  on("menu-sessions", () => goto("/"));
  on("menu-clients-register", () => goto("/clients"));
  // The library; its tab row leads on to the routines.
  on("menu-library", () => goto(deps.urlFor("exercises")));
  // The Sync & Backup dialog: the cloud, export, import and an encrypted client file. Navigated to
  // by its route rather than by a synthesised click on #backup-btn, whose behaviour depends on the
  // connection: for a CONNECTED trainer that click runs a sync and never opens the dialog.
  on("menu-data", () => goto(deps.urlFor("backup")));
  on("menu-settings", () => goto(deps.urlFor("settings")));
  // The warning's remedy, one tap away: the dialog holds both a downloaded backup and a Drive sync,
  // and the warning turns on either being available — not on connecting Google.
  on("unbacked-badge", () => goto(deps.urlFor("backup")));
  // One control, both directions — the menu item says which one it is, so there is no
  // second item to leave behind in the wrong state.
  on("menu-sandbox", () => {
    closeMenu();
    const target = isSandbox() ? WORKING : SANDBOX;
    afterLeavingSettings(() => deps.onSwitchWorkspace?.(target));
  });
  // The same way out, at the top of the menu — shown only inside the sandbox, and guarded as well.
  on("menu-sandbox-leave", () => {
    closeMenu();
    if (isSandbox()) deps.onSwitchWorkspace?.(WORKING);
  });
  // Guarded here as well as hidden: the item is in the markup either way, and a hidden control is a
  // styling fact, not a promise about what a click can do.
  on("menu-sandbox-reset", () => {
    closeMenu();
    if (isSandbox()) deps.onResetSandbox?.();
  });
  on("menu-trainer-details", () => {
    closeMenu();
    deps.openTrainerDetails?.();
  });
  on("menu-app-version", () => {
    closeMenu();
    deps.openAppVersion?.();
  });
  on("menu-connected-accounts", () => {
    closeMenu();
    deps.openConnectedAccounts?.();
  });
  // GitHub project, Bug reporting, and Privacy statement are real <a target="_blank">; just dismiss the menu.
  on("menu-github", () => closeMenu());
  on("menu-bug-report", () => closeMenu());
  on("menu-feedback", () => {
    closeMenu();
    deps.openFeedbackRoute?.();
  });
  on("menu-privacy", () => closeMenu());
  // About / Terms are routes, not just modals: the router opens the dialog, so Back closes it and a
  // reload reopens it. Their ✕ buttons below need no change — closing pops the entry (see
  // routerController's close-capture hook).
  on("menu-about", () => goto(deps.urlFor("about")));
  on("menu-terms", () => goto(deps.urlFor("terms")));

  // Modal close (×) buttons for the About / Terms dialogs.
  for (const btn of document.querySelectorAll(
    "#dialog-about .modal-close-btn, #dialog-terms .modal-close-btn, #dialog-settings .modal-close-btn",
  )) {
    btn.addEventListener("click", () => btn.closest("dialog").close());
  }
}

const TERMS_ACCEPTED_KEY = "librept_terms_accepted";

// First-run no-liability disclaimer + agreement. "I agree" persists it. On the first run the modal is
// mandatory — the ✕ is hidden (via .first-run in CSS) and Escape is blocked — so the trainer must agree
// to dismiss it. Reopened later from the menu it behaves as a normal, dismissable modal.
//
// It does NOT open itself. It used to, during header wiring, which put it in the top layer above the
// welcome screen's language step: a trainer on a cleared browser had to accept English terms before
// "Slovenščina" could be tapped. The welcome screen now asks for it after the language, through
// askForTermsAgreement, so it opens already translated.
function setupFirstRunTerms() {
  const dlg = document.getElementById("dialog-terms");
  const agreeBtn = document.getElementById("btn-terms-agree");
  if (!dlg || !agreeBtn) return;

  agreeBtn.addEventListener("click", () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, "1");
    dlg.classList.remove("first-run");
    if (dlg.open) dlg.close();
  });
  // Block Escape/cancel while the agreement is mandatory.
  dlg.addEventListener("cancel", (e) => {
    if (dlg.classList.contains("first-run")) e.preventDefault();
  });
}

export function needsTermsAgreement() {
  return !localStorage.getItem(TERMS_ACCEPTED_KEY);
}

/** Opens the agreement as the mandatory first-run modal, and resolves when it closes. */
export function askForTermsAgreement() {
  const dlg = document.getElementById("dialog-terms");
  if (!dlg) return Promise.resolve();
  return new Promise((resolve) => {
    // The `close` event, not the button: Agree is one way out and the only one today, but a modal
    // that closes for any other reason must not leave the welcome screen waiting forever.
    dlg.addEventListener("close", () => resolve(), { once: true });
    dlg.classList.add("first-run");
    if (!dlg.open) dlg.showModal();
  });
}
