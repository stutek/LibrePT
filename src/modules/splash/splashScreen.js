// modules/common/splashScreen.js — the cold-start splash: holds the app mark on screen for a
// minimum time, then fades it out once the app has finished booting.
//
// Injected dependencies: none. It owns exactly one element (#app-splash, static markup in
// index.html) and reads only the URL, so it stays mountable without the rest of the app.
//
// The splash is in the STATIC HTML and visible by default, not created here — it has to be on
// screen from first paint, and a module that runs after app.js parses would appear too late to
// cover anything. This module only takes it away.

// How long the mark stays up, measured from navigation start rather than from the moment boot
// finishes: a slow cold boot should be absorbed by this window, not added on top of it. So the
// splash is visible for max(this, boot time) — 4s on a normal boot, longer only if the app is not
// ready yet, never a 4s delay bolted onto the end of a slow one.
const DEFAULT_MINIMUM_VISIBLE_MS = 4000;

// Matches the transition in splashScreen.css. Kept in sync by hand — the element is removed from
// the layout after fading, and reading the duration back out of getComputedStyle to save one
// constant would cost a layout flush on every boot.
const FADE_OUT_MS = 320;

const SPLASH_ID = "app-splash";
const DISMISSING_CLASS = "is-dismissing";

/** `?splash=off` skips the hold entirely — the same deep-link convention as `?init`, `?lang` and
 *  `?theme`. It exists for demo links that need to land on the app immediately, and the browser
 *  test suite uses it so a 2s hold is not paid on every one of the ~100 e2e page loads. */
export function requestedMinimumVisibleMs(search = window.location.search) {
  return new URLSearchParams(search).get("splash") === "off" ? 0 : DEFAULT_MINIMUM_VISIBLE_MS;
}

/** ms still owed to the minimum, given how long the document has already been open. */
export function remainingHoldMs(minimumVisibleMs, elapsedMs) {
  return Math.max(0, minimumVisibleMs - elapsedMs);
}

/**
 * Fade the splash out, no earlier than `minimumVisibleMs` after navigation start.
 * Resolves once it is gone, so a caller can await a genuinely interactive app.
 */
export function dismissSplashWhenReady({ minimumVisibleMs = requestedMinimumVisibleMs() } = {}) {
  const splash = document.getElementById(SPLASH_ID);
  if (!splash) return Promise.resolve();

  const remaining = remainingHoldMs(minimumVisibleMs, performance.now());
  return new Promise((resolve) => {
    window.setTimeout(() => {
      splash.classList.add(DISMISSING_CLASS);
      window.setTimeout(() => {
        splash.hidden = true;
        resolve();
      }, FADE_OUT_MS);
    }, remaining);
  });
}
