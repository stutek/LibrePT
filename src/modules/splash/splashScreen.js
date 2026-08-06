// modules/splash/splashScreen.js — the cold-start splash: holds the app mark on screen for a
// minimum time, then either fades out or, for a trainer with no data yet, turns into the
// onboarding entry point.
//
// Injected dependencies: `offerOnboarding` (whether the database is still empty — the caller owns
// that question, see data/stateStore.js's stateHasData). Everything else it needs is its own
// markup and the URL, so it stays mountable without the rest of the app.
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
const PROGRESS_ID = "app-splash-progress";
const ONBOARDING_ID = "app-splash-onboarding";
const DISMISSING_CLASS = "is-dismissing";
const ONBOARDING_CLASS = "is-onboarding";

const DEMO_INIT_PARAM = "init";
const DEMO_INIT_VALUE = "demo_data_load";
const SPLASH_PARAM = "splash";
const SPLASH_OPT_OUT = "off";

/** `?splash=off` turns the splash off entirely — no hold, and no onboarding offer either. It is
 *  the "put me straight into the app" parameter, the same deep-link convention as `?init`, `?lang`
 *  and `?theme`. Demo links use it, and the browser suite relies on it so a 4s hold and a blocking
 *  onboarding panel are not paid on every one of its ~84 navigations. */
export function isSplashDisabled(search = window.location.search) {
  return new URLSearchParams(search).get(SPLASH_PARAM) === SPLASH_OPT_OUT;
}

export function requestedMinimumVisibleMs(search = window.location.search) {
  return isSplashDisabled(search) ? 0 : DEFAULT_MINIMUM_VISIBLE_MS;
}

/** ms still owed to the minimum, given how long the document has already been open. */
export function remainingHoldMs(minimumVisibleMs, elapsedMs) {
  return Math.max(0, minimumVisibleMs - elapsedMs);
}

/** The URL that loads the demo dataset: the app's existing `?init=demo_data_load` deep link, with
 *  the splash suppressed so the reload lands straight on a populated app.
 *
 *  Reloading rather than seeding in place is deliberate. app.js seeds during init(), before the
 *  router and the views are wired, so calling seedMockData() from here would leave the app
 *  rendered against the empty state it booted with — and the alternative, injecting a re-render of
 *  everything into this module, would couple the splash to the whole app. A reload reuses the boot
 *  path that is already tested. */
export function demoDataUrl(href = window.location.href) {
  const url = new URL(href);
  url.searchParams.set(DEMO_INIT_PARAM, DEMO_INIT_VALUE);
  url.searchParams.set(SPLASH_PARAM, SPLASH_OPT_OUT);
  return url.toString();
}

function fadeOut(splash, resolve) {
  splash.classList.add(DISMISSING_CLASS);
  window.setTimeout(() => {
    splash.hidden = true;
    resolve();
  }, FADE_OUT_MS);
}

function revealOnboarding(splash, resolve) {
  const onboarding = document.getElementById(ONBOARDING_ID);
  // Never trap the trainer behind a panel that failed to render: fall back to just leaving.
  if (!onboarding) return fadeOut(splash, resolve);

  document.getElementById(PROGRESS_ID)?.setAttribute("hidden", "");
  onboarding.hidden = false;
  splash.classList.add(ONBOARDING_CLASS);

  document.getElementById("splash-load-demo")?.addEventListener("click", () => {
    window.location.assign(demoDataUrl());
  });
  document.getElementById("splash-start-empty")?.addEventListener("click", () => {
    fadeOut(splash, resolve);
  });
}

/**
 * Take the splash down, no earlier than `minimumVisibleMs` after navigation start.
 *
 * With `offerOnboarding`, the splash instead becomes the onboarding entry point and waits for the
 * trainer to choose — so the returned promise resolves on their action, not on a timer.
 */
export function dismissSplashWhenReady({
  minimumVisibleMs = requestedMinimumVisibleMs(),
  offerOnboarding = false,
} = {}) {
  const splash = document.getElementById(SPLASH_ID);
  if (!splash) return Promise.resolve();

  const onboarding = offerOnboarding && !isSplashDisabled();
  const remaining = remainingHoldMs(minimumVisibleMs, performance.now());
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (onboarding) revealOnboarding(splash, resolve);
      else fadeOut(splash, resolve);
    }, remaining);
  });
}
