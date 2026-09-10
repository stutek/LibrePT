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
//   demo   what to do with the demo script once the app has booted, one of two explicit values
//          (modules/demo/). Both need demo data, so both are ignored unless the app has something
//          to demonstrate.
//            gym_floor    plays itself: drives the real controls with a visible pointer — the
//                         automated replacement for the screen recording §23.5 asked for, and the
//                         same script the e2e suite replays.
//            walkthrough  the trainer drives, one step at a time, with the guided panel over the
//                         real app (§9.5). Same script; who taps is the only difference.
//            story        the long demo (§35): a chaptered scenario that plays itself, narrated by
//                         cards between the taps. `chapter` names one chapter to play alone.
//   chapter  which chapter of ?demo=story to play, e.g. floor. Absent or unknown plays the whole
//            story — a mistyped chapter in a pasted link should still show a stranger the demo.
//   workspace  which of the two databases to open (TODO §40): `sandbox` opens the sandbox, seeding
//          it on first entry. This is what the app's own "show me around" offers carry — sample
//          people belong in the sandbox, not in the database the trainer is about to work in.
//          Anything else opens the trainer's own work, which is also what an absent param means.
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
export const SHARE_CHAPTER_PARAM = "chapter";
/** The step a demo link lands on. A story is watched in interruptions — a reload, a phone that
 * locked, a link sent to a colleague mid-way — and without this the viewer starts again. */
export const SHARE_STEP_PARAM = "step";
/** Which workspace to open (TODO §40.9). Deliberately NOT folded into `?init=`: that parameter keeps
 * meaning "seed the workspace I am in", which is what the whole e2e suite runs on (§40.7), and one
 * parameter carrying two decisions is how the tests would have quietly moved off the app the trainer
 * uses. */
export const SHARE_WORKSPACE_PARAM = "workspace";

// The single recognized value for ?init=. Any other value is treated as absent.
export const INIT_DEMO_DATA = "demo_data_load";

// The recognized values for ?demo=. Anything else is treated as absent, same as ?init=. Two named
// constants rather than one value plus a mode flag: each is read by its own boot step, so a link
// that asks for one cannot accidentally start the other.
export const DEMO_TOUR_GYM_FLOOR = "gym_floor";
export const DEMO_WALKTHROUGH = "walkthrough";
export const DEMO_STORY = "story";

// Read the preselected language/theme/init from the current URL. Absent params return null so
// callers can distinguish "share link asked for X" from "use the saved/default value".
export function getShareParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    lang: p.get(SHARE_LANG_PARAM),
    theme: p.get(SHARE_THEME_PARAM),
    init: p.get(SHARE_INIT_PARAM),
    demo: p.get(SHARE_DEMO_PARAM),
    chapter: p.get(SHARE_CHAPTER_PARAM),
    step: p.get(SHARE_STEP_PARAM),
    workspace: p.get(SHARE_WORKSPACE_PARAM),
  };
}
