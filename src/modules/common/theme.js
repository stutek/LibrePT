// src/modules/common/theme.js — the one theme service: resolve, apply, persist, localize.
//
// It lives in modules/common/ rather than controllers/ because it orchestrates nothing: it is a
// leaf service that any UI module may call. That placement is the whole point of this file's
// existence. It used to sit in controllers/, which agent_tools/import_layers.py correctly forbids
// modules/common/ from importing — so applicationHeader.js, needing exactly this behaviour for the
// #theme-switcher, carried a verbatim COPY of all five tables plus its own resolveTheme/applyTheme.
// Both ran in the same page and had already diverged (one wrote documentElement.className, the
// other only touched body), leaving the root element on the boot theme after any switch. A layer
// gate cannot see a copy-paste; the fix is to put the callee in the layer its callers can reach.
//
// The <html> class is also set, earlier and independently, by the render-blocking src/theme-boot.js
// — that script must stay import-free to run before first paint, so its small copy of the map is
// deliberate and is the ONE duplication here that earns its keep. Everything after boot goes
// through this module.
//
// deps: none — reads window.location / localStorage and writes the document directly.

import { getShareParams } from "./shareLink.js";

export const DEFAULT_THEME = "daylight";

export const THEME_BODY_CLASS = {
  midnight: "midnight-theme",
  daylight: "daylight-theme",
  red: "red-theme",
  blossom: "blossom-theme",
  nebula: "nebula-theme",
};

export const THEME_META_COLOR = {
  midnight: "#09090b",
  daylight: "#f6f7fb",
  red: "#2a0407",
  blossom: "#fdf2f8",
  nebula: "#0b0a1f",
};

// Themes renamed once already. A saved preference or a shared link minted before the rename must
// still resolve to the theme it named, not silently fall back to the default.
export const LEGACY_THEME_MAP = {
  dark: "midnight",
  light: "daylight",
  rose: "blossom",
  violet: "nebula",
};

// Theme names are proper nouns, not UI copy, so they live here beside the theme table rather than
// in the i18n dictionaries — a new theme is one edit, not two files.
export const THEME_SWITCHER_LABELS = {
  en: {
    midnight: "Midnight",
    daylight: "Daylight",
    red: "Red",
    blossom: "Blossom",
    nebula: "Nebula",
  },
  sl: {
    midnight: "Polnoč",
    daylight: "Dan",
    red: "Rdeča",
    blossom: "Cvet",
    nebula: "Nebula",
  },
};

export function resolveTheme(requestedTheme) {
  const mapped = LEGACY_THEME_MAP[requestedTheme] || requestedTheme;
  return THEME_BODY_CLASS[mapped] ? mapped : DEFAULT_THEME;
}

// A share link's ?theme= wins over the saved preference for this visit, so a recipient sees the app
// exactly as it was shared without that choice being written over their own.
export function getInitialTheme() {
  try {
    return resolveTheme(getShareParams().theme || localStorage.getItem("librept-theme"));
  } catch (err) {
    console.warn("Failed to retrieve initial theme from localStorage or query params:", err);
    return DEFAULT_THEME;
  }
}

// Both <html> and <body> carry the theme class: every theme stylesheet declares its tokens against
// `html.X, body.X`, and theme-boot.js can only reach <html> (it runs before <body> exists). Updating
// one and not the other is what left the root on a stale theme.
//
// classList.remove/add, never `className =`: the root and body are shared surfaces — assigning the
// whole attribute would silently drop any other class a feature had put there.
export function applyTheme(themeKey) {
  const resolved = resolveTheme(themeKey);

  for (const themeClass of Object.values(THEME_BODY_CLASS)) {
    document.documentElement.classList.remove(themeClass);
    document.body?.classList.remove(themeClass);
  }
  document.documentElement.classList.add(THEME_BODY_CLASS[resolved]);
  document.body?.classList.add(THEME_BODY_CLASS[resolved]);

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor && THEME_META_COLOR[resolved]) {
    metaThemeColor.setAttribute("content", THEME_META_COLOR[resolved]);
  }

  const themeSwitcher = document.getElementById("theme-switcher");
  if (themeSwitcher) themeSwitcher.value = resolved;

  try {
    localStorage.setItem("librept-theme", resolved);
  } catch (err) {
    console.warn("Failed to persist theme choice to localStorage:", err);
  }

  return resolved;
}

export function applyThemeSwitcherLabels(lang = "en") {
  const themeSwitcher = document.getElementById("theme-switcher");
  if (!themeSwitcher) return;
  const labels = THEME_SWITCHER_LABELS[lang] || THEME_SWITCHER_LABELS.en;
  for (const option of themeSwitcher.options) {
    if (labels[option.value]) option.textContent = labels[option.value];
  }
}

// The #theme-switcher's own wiring. Called by the header once its shell exists; re-applies the
// resolved theme so the <select> and the document agree even if boot resolved from a share link.
export function setupThemeSwitcher(lang = "en") {
  applyTheme(getInitialTheme());
  const themeSwitcher = document.getElementById("theme-switcher");
  themeSwitcher?.addEventListener("change", () => applyTheme(themeSwitcher.value));
  applyThemeSwitcherLabels(lang);
}

// Applies the theme before the first render, so nothing paints in the wrong one.
export function initTheme() {
  return applyTheme(getInitialTheme());
}
