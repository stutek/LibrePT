// src/controllers/themeController.js - Unified Theme & Visual Appearance Manager
// Single responsibility: Single source of truth for resolving, applying, persisting, and localizing theme styles.

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

export const LEGACY_THEME_MAP = {
  dark: "midnight",
  light: "daylight",
  rose: "blossom",
  violet: "nebula",
};

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
  const t = requestedTheme || "daylight";
  const mapped = LEGACY_THEME_MAP[t] || t;
  return THEME_BODY_CLASS[mapped] ? mapped : DEFAULT_THEME;
}

export function getInitialTheme() {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramTheme = params.get("theme");
    const storedTheme = localStorage.getItem("librept-theme");
    return resolveTheme(paramTheme || storedTheme);
  } catch (_) {
    return DEFAULT_THEME;
  }
}

export function applyTheme(themeKey) {
  const resolved = resolveTheme(themeKey);
  const themeClass = THEME_BODY_CLASS[resolved];

  document.documentElement.className = themeClass;
  if (document.body) {
    document.body.className = themeClass;
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor && THEME_META_COLOR[resolved]) {
    metaThemeColor.setAttribute("content", THEME_META_COLOR[resolved]);
  }

  const themeSwitcher = document.getElementById("theme-switcher");
  if (themeSwitcher) {
    themeSwitcher.value = resolved;
  }

  try {
    localStorage.setItem("librept-theme", resolved);
  } catch (_) {}

  return resolved;
}

export function applyThemeSwitcherLabels(lang = "en") {
  const themeSwitcher = document.getElementById("theme-switcher");
  if (!themeSwitcher) return;
  const labels = THEME_SWITCHER_LABELS[lang] || THEME_SWITCHER_LABELS.en;
  for (const option of themeSwitcher.options) {
    const themeKey = option.value;
    if (labels[themeKey]) {
      option.textContent = labels[themeKey];
    }
  }
}

// Immediate execution helper to apply initial theme before render, preventing flash of unstyled content
export function initTheme() {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);
}
