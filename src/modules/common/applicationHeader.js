// components/applicationHeader.js
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
//   renderActiveSessionBarLabels()
// }

import { driveSyncStatus } from "../../data/driveSyncService.js";
import { renderMarkupOnce } from "./dom.js";
import { getShareParams } from "./shareLink.js";

let deps = null;

const DEFAULT_THEME = "daylight";
const THEME_BODY_CLASS = {
  midnight: "midnight-theme",
  daylight: "daylight-theme",
  red: "red-theme",
  blossom: "blossom-theme",
  nebula: "nebula-theme",
};
const THEME_META_COLOR = {
  midnight: "#09090b",
  daylight: "#f6f7fb",
  red: "#2a0407",
  blossom: "#fdf2f8",
  nebula: "#0b0a1f",
};
const THEME_SWITCHER_LABELS = {
  en: {
    midnight: "Midnight",
    daylight: "Daylight",
    red: "Red",
    blossom: "Blossom",
    nebula: "Nebula",
  },
  sl: { midnight: "Polnoč", daylight: "Dan", red: "Rdeča", blossom: "Cvet", nebula: "Nebula" },
};
const LEGACY_THEME_MAP = {
  dark: "midnight",
  light: "daylight",
  rose: "blossom",
  violet: "nebula",
};

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

export function renderSyncBadge() {
  const badge = document.getElementById("sync-badge");
  if (!badge) return;

  if (isOfflineCached) {
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
  const {
    ahead: local,
    behind: remote,
    configured: isCloudConfigured,
    reachable: isCloudReachable,
  } = status;

  // When cloud is unreachable or not configured, display '?' for behind count
  const isUnreachable = !isCloudConfigured || !isCloudReachable;

  // Past 9, a second arrow stands in for the digit (↑↑ / ↓↓) so the pill stays narrow
  const cell = (n, dir, isBehind = false) => {
    if (isBehind && isUnreachable) {
      return `<i class="fa-solid fa-arrow-down"></i>?`;
    }
    const arrow = `<i class="fa-solid fa-arrow-${dir}"></i>`;
    const countStr = n > 9 ? arrow + arrow : arrow + String(n);
    return countStr;
  };

  const aheadClass = local === 0 ? "sync-zero" : "sync-ahead";
  const behindClass = remote === 0 && !isUnreachable ? "sync-zero" : "sync-behind";

  badge.classList.remove("hidden");
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

// Map any incoming theme name (current, legacy alias, or unknown) onto a theme that actually
// exists. Unknown names — including a theme that was later renamed and lives on only in an old
// share link or a stale localStorage value — resolve to the default so the app never lands in a
// broken/no-theme state.
function resolveTheme(theme) {
  const mapped = LEGACY_THEME_MAP[theme] || theme;
  return THEME_BODY_CLASS[mapped] ? mapped : DEFAULT_THEME;
}

function applyTheme(theme) {
  const activeTheme = resolveTheme(theme);
  for (const c of Object.values(THEME_BODY_CLASS)) {
    document.documentElement.classList.remove(c);
    document.body.classList.remove(c);
  }
  document.body.classList.add(THEME_BODY_CLASS[activeTheme]);
  localStorage.setItem("librept-theme", activeTheme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_META_COLOR[activeTheme]);
}

export function applyThemeSwitcherLabels() {
  const sel = document.getElementById("theme-switcher");
  if (!sel) return;
  const labels = THEME_SWITCHER_LABELS[deps.getState().lang] || THEME_SWITCHER_LABELS.en;
  for (const opt of Array.from(sel.options)) {
    if (labels[opt.value]) opt.textContent = labels[opt.value];
  }
}

function setupThemeSwitcher() {
  // A promo/share link's ?theme= wins over the saved preference on this visit, so the recipient
  // sees the app as it was shared. resolveTheme() reverts a renamed/unknown theme to the default.
  const shareTheme = getShareParams().theme;
  const active = resolveTheme(shareTheme || localStorage.getItem("librept-theme") || DEFAULT_THEME);
  applyTheme(active);
  const sel = document.getElementById("theme-switcher");
  if (sel) {
    sel.value = active;
    sel.addEventListener("change", () => applyTheme(sel.value));
  }
  applyThemeSwitcherLabels();
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
      <a id="about-repo-link" class="btn secondary-btn w-full" href="https://github.com/stutek/LibrePT" target="_blank" rel="noopener noreferrer">
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
      <div class="logo-area" id="logo-area">
        <span class="logo-icon-wrap">
          <i class="fa-solid fa-dumbbell logo-icon"></i>
          <!-- PREVIEW tag is a small corner badge on the logo icon instead of a pill sitting in the
               flex row beside the wordmark — on narrow phones (e.g. Galaxy S23 Ultra) the pill used
               to eat into <h1>'s width and force the title to truncate early. At badge size the
               "PREVIEW" wordmark itself would be illegible, so it's screen-reader text here; the
               full text still reads on the About/build-info surfaces. -->
          <a id="preview-ribbon" class="preview-ribbon"
             href="https://github.com/stutek/LibrePT/blob/main/docs/PREVIEW.md"
             target="_blank" rel="noopener noreferrer"
             aria-label="Preview build — pre-release, may lose data. Open the risks & data-loss notice.">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            <span id="preview-ribbon-label" class="sr-only">PREVIEW</span>
          </a>
        </span>
        <h1>LibrePT</h1>
      </div>

      <div class="header-build-stack">
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
            <span class="cloud-sync-icon" aria-hidden="true">
              <i class="fa-solid fa-cloud"></i>
              <i class="fa-solid fa-arrows-rotate"></i>
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
              <a id="menu-github" class="session-menu-item" role="menuitem" href="https://github.com/stutek/LibrePT" target="_blank" rel="noopener noreferrer">
                <i class="fa-brands fa-github"></i> GitHub project
              </a>
              <a id="menu-bug-report" class="session-menu-item" role="menuitem" href="https://github.com/stutek/LibrePT/blob/main/docs/BUG_REPORTING.md" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-bug"></i> Bug Reporting
              </a>
              <button id="menu-about" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-circle-info"></i> About
              </button>
              <button id="menu-terms" class="session-menu-item" role="menuitem">
                <i class="fa-solid fa-shield-halved"></i> Terms &amp; disclaimer
              </button>
              <a id="menu-privacy" class="session-menu-item" role="menuitem" href="https://github.com/stutek/LibrePT/blob/main/PRIVACY.md" target="_blank" rel="noopener noreferrer">
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
  // Logo Area home click handler
  const logoArea = document.getElementById("logo-area");
  if (logoArea) {
    logoArea.addEventListener("click", () => {
      deps.navigateToPath("/");
    });
  }

  // The PREVIEW tag lives inside the logo area but is its own link (risks/data-loss notice).
  // Stop its click from bubbling to the logo's home-navigation so it only opens the notice.
  const previewRibbon = document.getElementById("preview-ribbon");
  if (previewRibbon) {
    previewRibbon.addEventListener("click", (e) => e.stopPropagation());
  }

  // Language switcher setup
  const langSwitcher = document.getElementById("lang-switcher");
  if (langSwitcher) {
    langSwitcher.value = deps.getState().lang;
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
        deps.renderActiveSessionBarLabels();
      }
    });
  }

  // Theme switcher setup
  setupThemeSwitcher();

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
  on("menu-connect-cloud", () => {
    closeMenu();
    const b = document.getElementById("backup-btn");
    if (b) b.click();
  });
  // Export data — reuse the existing Sync & Backup modal (it holds JSON export/restore).
  on("menu-export-data", () => {
    closeMenu();
    const b = document.getElementById("backup-btn");
    if (b) b.click();
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
