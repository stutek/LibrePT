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

    // The splash's dismiss X is on screen from first paint, but the handler behind it is wired by
    // modules/splash/splashScreen.js at the END of app.js's init(). A tap before that lands on a
    // button that does nothing and is simply lost. Record it here — this script is the only thing
    // running that early — and let the splash honour it the moment the app is ready. The close is
    // DELAYED until the app can actually be used, never dropped. Delegated on `document` because
    // the button does not exist yet when this runs.
    document.addEventListener("click", (event) => {
      if (event.target.closest?.("#splash-dismiss")) {
        window.librePtSplashCloseRequested = true;
      }
    });
  } catch (e) {
    console.warn("Theme bootstrap script error:", e);
  }
})();
