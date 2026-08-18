// src/modules/common/applicationHeader.js
// Handles the shared top header bar actions: theme, language, logo clicks, and synchronization/backup badge.
//
// deps: {
//   getState(),
//   t,
//   saveToLocalStorage(),
//   applyTranslations(lang),
//   navigateToPath(path),
//   renderClientsList(),
//   renderRoutinesList(),
//   renderExercisesList(),
//   renderGlobalHistory(),
//   renderPendingPlanAdjustments(),
//   renderSessions(),
//   populateDropdownSelectors(),
//   getActiveSession(),
//   renderActiveGroupBoard(),
//   renderClipboardBar()
// }

import { driveSyncStatus } from "../../data/driveSyncService.js";
import { ISSUE_TRACKER_URL } from "../../data/publicUrls.js";
import { isDemoOnlyStore } from "../../data/seedProvenance.js";
import { resolveLang } from "../../i18n/index.js";
import { renderMarkupOnce } from "./dom.js";
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
 * costume (AGENT_RULES §2.D.1), unreachable on touch and silent to a screen reader. */
function renderSyncCloudIcon(status) {
  const wrap = document.getElementById("sync-cloud-icon");
  const overlay = document.getElementById("sync-cloud-overlay");
  if (!wrap || !overlay) return;

  const glyph = syncGlyphFor(status);
  wrap.className = `cloud-sync-icon ${glyph.stateClass}`;
  overlay.className = glyph.overlayIcon;

  const stateLabel = deps?.t ? deps.t(glyph.labelKey) || glyph.labelFallback : glyph.labelFallback;
  document
    .getElementById("backup-btn")
    ?.setAttribute("aria-label", `${SYNC_BUTTON_BASE_LABEL} — ${stateLabel}`);
}

/** The unbacked-data warning (TODO §3.8), driven by backupHealthController's assessment.
 *
 * **Spelled out, never an icon alone**, for the same reason the PREVIEW badge spells itself out: a
 * bare coloured triangle is an unexplained warning whose meaning lives only in an aria-label, which
 * is the hover problem in another costume (AGENT_RULES §2.D.1) — and this one is about losing a
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
 * seeded demo, PREVIEW otherwise (TODO §28.9).
 *
 * One slot, two competing claims, and `isDemoOnlyStore` is where the ordering is argued. The badge
 * keeps its link to the data-loss notice in BOTH states — it is still a preview build either way,
 * and that notice is the only place the risk is explained without signal.
 *
 * A demo is not a hazard, so the demo state drops the warning triangle and the pulse the CSS gives
 * the amber pill; it states a fact, in a word, at the same size.
 */
export function renderBuildStateBadge(state) {
  const badge = document.getElementById("preview-badge");
  if (!badge) return;

  const showingDemo = isDemoOnlyStore(state);
  badge.classList.toggle("is-demo", showingDemo);
  badge.querySelector(".preview-badge-label").textContent = showingDemo ? "DEMO" : "PREVIEW";
  badge.querySelector("i").className = showingDemo
    ? "fa-solid fa-flask"
    : "fa-solid fa-triangle-exclamation";
  badge.setAttribute(
    "aria-label",
    showingDemo
      ? "Demo data — nothing here is your own work. Open the risks & data-loss notice."
      : "Preview build — pre-release, may lose data. Open the risks & data-loss notice.",
  );
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

  // Real counts (TODO §3.9/§3.3/§19, no longer a mock): `local` is how many of THIS device's own
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
  // stand-ins on purpose (TODO §3.11). Ahead gets `↑!`: those edits exist only on this device, so
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
  const remoteText = isUnreachable
    ? "cloud status unknown"
    : `${remote} remote change${remote === 1 ? "" : "s"} to pull`;
  badge.setAttribute(
    "aria-label",
    `${local} local change${local === 1 ? "" : "s"} to push, ${remoteText}`,
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
      <button class="modal-close-btn" aria-label="Close about modal"><i class="fa-solid fa-xmark"></i></button>
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
           on a touch device would mean not present at all (AGENT_RULES §2.D.1).
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

export function renderTermsDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-terms"),
    `
<dialog id="dialog-terms" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3 id="terms-title">Terms &amp; Disclaimer</h3>
      <button class="modal-close-btn" aria-label="Close terms modal"><i class="fa-solid fa-xmark"></i></button>
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
           (AGENT_RULES §2.D.1) for what is a data-loss warning. -->
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
        <!-- TODO §3.8. Hidden until there is unbacked work worth naming; filled by
             renderBackupBadge(). A BUTTON, not a link to an explainer: the remedy is the Sync &
             Backup dialog, which offers both a downloaded file and a Drive sync, so tapping the
             warning lands on the two things that resolve it rather than on prose about them. -->
        <button type="button" id="unbacked-badge" class="unbacked-badge hidden" aria-haspopup="dialog"></button>
        <!-- Tappable: the long build identity used to live in a \`title\` tooltip, which a phone
             cannot reach. Opens #dialog-build-info instead. -->
        <button type="button" id="app-version" class="app-version" aria-label="Build version — tap for details" aria-haspopup="dialog"></button>
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
            <!-- GitHub-style ahead/behind counters, real (driveSyncService.js, TODO §3.9): local
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
              <!-- Language + theme controls live here (same view on desktop and mobile) so the
                   header bar stays compact. Same <select> elements as before, just relocated. -->
              <div class="menu-control-row">
                <label class="menu-control-label" for="lang-switcher"><i class="fa-solid fa-language" aria-hidden="true"></i> <span id="menu-label-lang">Language</span></label>
                <select id="lang-switcher" class="form-control menu-select" aria-label="Switch Language / Zamenjaj jezik">
                  <option value="en">EN</option>
                  <option value="sl">SL</option>
                </select>
              </div>
              <div class="menu-control-row">
                <label class="menu-control-label" for="theme-switcher"><i class="fa-solid fa-palette" aria-hidden="true"></i> <span id="menu-label-theme">Theme</span></label>
                <select id="theme-switcher" class="form-control menu-select" aria-label="Theme / Tema">
                  <option value="daylight" selected>Daylight</option>
                  <option value="midnight">Midnight</option>
                  <option value="red">Red</option>
                  <option value="blossom">Blossom</option>
                  <option value="nebula">Nebula</option>
                </select>
              </div>
              <div class="menu-divider" role="separator"></div>
              <button id="menu-clients-register" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-users"></i> <span id="menu-clients-register-text" data-i18n="menu_clients_register">Clients Directory</span>
              </button>
              <button id="menu-adjustments" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-bell-concierge"></i> <span id="menu-adjustments-text" data-i18n="menu_adjustments">Pending Review</span>
                <span class="badge badge-push-right hidden" id="menu-badge-adjustments-count">0</span>
              </button>
              <button id="menu-routines" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-clipboard-list"></i> Routines
              </button>
              <button id="menu-exercises" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-dumbbell"></i> Exercises
              </button>
              <button id="menu-history" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-clock-rotate-left"></i> History
              </button>
              <div class="menu-divider" role="separator"></div>
              <button id="menu-connect-cloud" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-cloud-arrow-up"></i> Connect cloud storage
              </button>
              <button id="menu-export-data" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-file-export"></i> Export data as a file
              </button>
              <button id="menu-review-signup" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-user-check"></i> Add a client from their own details
              </button>
              <button id="menu-open-encrypted" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-lock-open"></i> Open an encrypted file
              </button>
              <a id="menu-github" class="session-menu-item" role="menuitem" target="_blank" rel="noopener noreferrer">
                <i class="fa-brands fa-github"></i> GitHub project
              </a>
              <a id="menu-bug-report" class="session-menu-item" role="menuitem" href="./bug-reporting.html" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-bug"></i> Bug Reporting
              </a>
              <button id="menu-about" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-circle-info"></i> About
              </button>
              <button id="menu-terms" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-shield-halved"></i> Terms &amp; disclaimer
              </button>
              <a id="menu-privacy" class="session-menu-item" role="menuitem" href="./privacy.html" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-lock"></i> Privacy &amp; GDPR Statement
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
`,
  );
}

export function setupApplicationHeader() {
  renderHeaderShell();
  renderAboutDialog();
  renderTermsDialog();

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
    // resolveLang, not the raw value: an unchosen language is null, and assigning null to a
    // <select> leaves it showing nothing at all.
    langSwitcher.value = resolveLang(deps.getState().lang);
    langSwitcher.addEventListener("change", (e) => {
      const newLang = e.target.value;
      deps.getState().lang = newLang;
      deps.saveToLocalStorage();
      deps.applyTranslations(newLang);

      // Re-render views to apply translations
      deps.renderClientsList();
      deps.renderRoutinesList();
      deps.renderExercisesList();
      deps.renderGlobalHistory();
      deps.renderPendingPlanAdjustments();
      deps.renderSessions();
      deps.populateDropdownSelectors();

      const activeSession = deps.getActiveSession();
      if (activeSession) {
        deps.renderActiveGroupBoard();
        deps.renderClipboardBar();
      }
    });
  }

  // Theme switcher setup — owned by modules/common/theme.js, which is also what app.js boots the
  // initial theme through, so the switcher and the boot path can no longer disagree.
  setupThemeSwitcher(resolveLang(deps.getState().lang));

  // Application overflow (☰) menu
  setupAppMenu();

  // First-run disclaimer + user agreement
  setupFirstRunTerms();
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
  // Dismiss on any outside click.
  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("hidden") && !e.target.closest(".app-menu-wrap")) {
      closeMenu();
    }
  });

  const on = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
  };

  // Client Directory / Pending Adjustments / Routines / Exercises / History — each its own
  // first-class view+route (see TODO 4.8); moved out of the header bar into this menu.
  const goto = (route) => {
    closeMenu();
    if (deps?.navigateToPath) deps.navigateToPath(route);
  };
  on("menu-clients-register", () => goto("/clients"));
  on("menu-adjustments", () => goto("/adjustments"));
  on("menu-routines", () => goto("/routines"));
  on("menu-exercises", () => goto("/exercises"));
  on("menu-history", () => goto("/history"));
  // Connect cloud storage — opens the Sync & Backup dialog's Google Drive card (driveSyncUi.js),
  // which itself reports "not configured" honestly on a deployment with no OAuth client id set.
  // Both open the Sync & Backup dialog, and both navigate to its route rather than synthesising a
  // click on #backup-btn — which is what they used to do, and what broke the moment that button
  // learned to sync (TODO §3.11): for a CONNECTED trainer the simulated click ran a sync and never
  // opened the dialog, so "Export data as a file" silently did something else entirely. The header
  // button's behaviour is now state-dependent; these two are not, so they must not borrow it.
  on("menu-connect-cloud", () => goto(deps.urlFor("backup")));
  // The warning's remedy, one tap away: the dialog holds both a downloaded backup and a Drive sync,
  // and §3.8 turns on either being available — not on connecting Google.
  on("unbacked-badge", () => goto(deps.urlFor("backup")));
  // Export data — reuse the existing Sync & Backup modal (it holds JSON export/restore).
  on("menu-export-data", () => goto(deps.urlFor("backup")));
  // For a CLIENT who was emailed their data export, not for the trainer — which is why it sits in
  // the app menu and not on a client record: the person opening it has no client record.
  // A submission a prospective client sent in (TODO §26.5). Sits in the app menu beside the encrypted
  // reader because both answer "someone sent me a file" — but this one is FOR the trainer, and what it
  // produces is a client record, which is why the review is a deliberate act and never an auto-import.
  on("menu-review-signup", () => {
    closeMenu();
    deps.openSignupReview?.();
  });
  on("menu-open-encrypted", () => {
    closeMenu();
    deps.openEncryptedFileReader?.();
  });
  // GitHub project, Bug reporting, and Privacy statement are real <a target="_blank">; just dismiss the menu.
  on("menu-github", () => closeMenu());
  on("menu-bug-report", () => closeMenu());
  on("menu-privacy", () => closeMenu());
  // About / Terms are routes, not just modals: the router opens the dialog, so Back closes it and a
  // reload reopens it. Their ✕ buttons below need no change — closing pops the entry (see
  // routerController's close-capture hook).
  on("menu-about", () => goto(deps.urlFor("about")));
  on("menu-terms", () => goto(deps.urlFor("terms")));

  // Modal close (×) buttons for the About / Terms dialogs.
  for (const btn of document.querySelectorAll(
    "#dialog-about .modal-close-btn, #dialog-terms .modal-close-btn",
  )) {
    btn.addEventListener("click", () => btn.closest("dialog").close());
  }
}

const TERMS_ACCEPTED_KEY = "librept_terms_accepted";

// First-run no-liability disclaimer + agreement (10.2). Shown once when no acceptance is
// stored; "I agree" persists it. On first run the modal is made mandatory — the ✕ is hidden
// (via .first-run in CSS) and Escape is blocked — so the user must agree to dismiss it. When
// later reopened from the ☰ menu it behaves as a normal, dismissable modal.
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

  if (!localStorage.getItem(TERMS_ACCEPTED_KEY)) {
    dlg.classList.add("first-run");
    if (!dlg.open) dlg.showModal();
  }
}
