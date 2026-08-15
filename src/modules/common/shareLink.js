// src/modules/common/shareLink.js
// Promo/share deep-links for the demo instance. A link may carry a preselected UI language and
// colour theme, plus an optional demo-data initializer, in the query string, e.g.
//
//   https://<demo-host>/?lang=sl&theme=nebula&init=demo_data_load
//
// Opening such a link applies these on first paint, so a recipient sees the app exactly as it was
// shared — the intended way to promote the demo. All params are optional and independent.
//
//   lang   language code from i18n/index.js TRANSLATIONS (e.g. en, sl). Unknown → saved/default.
//   theme  colour theme (daylight, midnight, red, blossom, nebula) or a legacy alias. Unknown or
//          since-renamed → default theme. Validation lives at the point of application
//          (applicationHeader resolveTheme for theme; app.js init for lang).
//   demo   scripted tour to play once the app has booted. `demo=gym_floor` drives the real
//          controls with a visible pointer (modules/demo/) — the automated replacement for the
//          screen recording §23.5 asked for, and the same script the e2e suite replays. Requires
//          demo data, so it is ignored unless the app has something to demonstrate.
//   init   demo-data initializer. The app boots to a clean, empty slate; init=demo_data_load
//          populates the full demo dataset — but ONLY on a genuinely empty app. When any data is
//          already present it is ignored, so it never overwrites a real user's records. Applied
//          in app.js init() (see INIT_DEMO_DATA).
//
// deps: none — reads window.location only.

export const SHARE_LANG_PARAM = "lang";
export const SHARE_THEME_PARAM = "theme";
export const SHARE_INIT_PARAM = "init";
export const SHARE_DEMO_PARAM = "demo";

// The single recognized value for ?init=. Any other value is treated as absent.
export const INIT_DEMO_DATA = "demo_data_load";

// The single recognized value for ?demo=. Any other value is treated as absent, same as ?init=.
export const DEMO_TOUR_GYM_FLOOR = "gym_floor";

// Read the preselected language/theme/init from the current URL. Absent params return null so
// callers can distinguish "share link asked for X" from "use the saved/default value".
export function getShareParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    lang: p.get(SHARE_LANG_PARAM),
    theme: p.get(SHARE_THEME_PARAM),
    init: p.get(SHARE_INIT_PARAM),
    demo: p.get(SHARE_DEMO_PARAM),
  };
}
