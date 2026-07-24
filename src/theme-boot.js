// theme-boot.js — synchronous, render-blocking theme bootstrap.
//
// MUST load as a classic (non-module, non-deferred) <script> in <head> so it runs BEFORE the
// body paints: it sets the resolved theme class on <html> up front to prevent a flash of the
// wrong theme (FOUC). Kept as an external file — instead of an inline <script> — so the Content-
// Security-Policy can drop 'unsafe-inline' from script-src (see AGENT_RULES §2.A.3 / ZAP 10055).
// It also force-upgrades http→https on non-localhost origins before anything else loads.
(() => {
  try {
    if (
      location.protocol === "http:" &&
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      location.replace(
        `https://${location.host}${location.pathname}${location.search}${location.hash}`,
      );
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const t = params.get("theme") || localStorage.getItem("librept-theme") || "daylight";
    const map = { dark: "midnight", light: "daylight", rose: "blossom", violet: "nebula" };
    const valid = {
      midnight: "midnight-theme",
      daylight: "daylight-theme",
      red: "red-theme",
      blossom: "blossom-theme",
      nebula: "nebula-theme",
    };
    const resolved = map[t] || t;
    const themeClass = valid[resolved] || "daylight-theme";
    document.documentElement.className = themeClass;
  } catch (e) {
    console.warn("Theme bootstrap script error:", e);
  }
})();
