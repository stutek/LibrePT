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

import { getShareParams } from "../../helper/shareLink.js";

let deps = null;

let mockSyncState = { local: 2, remote: 1 };
let syncTrackingReady = false;

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

export function incrementLocalSync() {
  if (syncTrackingReady) {
    mockSyncState.local += 1;
    renderSyncBadge();
  }
}

export function resetSyncState() {
  mockSyncState = { local: 0, remote: 0 };
  renderSyncBadge();
}

export function setSyncTrackingReady(val) {
  syncTrackingReady = val;
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
    badge.innerHTML = `<span class="sync-offline" title="${deps?.t ? deps.t("offline_cached_desc") : "HTTP server unreachable. Running on cached code."}"><i class="fa-solid fa-wifi-slash"></i> Offline</span>`;
    badge.setAttribute(
      "aria-label",
      deps?.t ? deps.t("offline_cached_desc") : "HTTP server unreachable. Running on cached code.",
    );
    return;
  }

  const { local, remote } = mockSyncState;
  if (local === 0 && remote === 0) {
    badge.classList.add("hidden");
    badge.textContent = "";
    badge.removeAttribute("aria-label");
    return;
  }
  // Past 9, a second arrow stands in for the digit (↑↑ / ↓↓) so the pill stays narrow and reads
  // as "lots to sync"; the exact counts still ride along in the aria-label below.
  const cell = (n, dir) => {
    const arrow = `<i class="fa-solid fa-arrow-${dir}"></i>`;
    return n > 9 ? arrow + arrow : arrow + String(n);
  };
  badge.classList.remove("hidden");
  badge.innerHTML =
    `<span class="sync-ahead">${cell(local, "up")}</span>` +
    `<span class="sync-behind">${cell(remote, "down")}</span>`;
  badge.setAttribute(
    "aria-label",
    `${local} local change${local === 1 ? "" : "s"} to push, ${remote} remote change${remote === 1 ? "" : "s"} to pull`,
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

export function setupApplicationHeader() {
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

  const openDialog = (id) => {
    const d = document.getElementById(id);
    if (d) d.showModal();
  };
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
  // Connect cloud storage — placeholder, no backend yet.
  on("menu-connect-cloud", () => {
    closeMenu();
    alert(deps.t("menu_coming_soon"));
  });
  // Export data — reuse the existing Sync & Backup modal (it holds JSON export/restore).
  on("menu-export-data", () => {
    closeMenu();
    const b = document.getElementById("backup-btn");
    if (b) b.click();
  });
  // GitHub project and Privacy statement are real <a target="_blank">; just dismiss the menu.
  on("menu-github", () => closeMenu());
  on("menu-privacy", () => closeMenu());
  // About / Terms open their modals.
  on("menu-about", () => {
    closeMenu();
    openDialog("dialog-about");
  });
  on("menu-terms", () => {
    closeMenu();
    openDialog("dialog-terms");
  });

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
