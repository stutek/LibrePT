// src/modules/splash/splashScreen.js — the cold-start splash: holds the app mark on screen for a
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

// The `?demo=` value is imported rather than spelled again here: the splash writes the link and
// app.js's boot step reads it, and a typo in either would produce a button that silently starts
// nothing.
import { DEMO_WALKTHROUGH } from "../common/shareLink.js";

// How long the mark stays up, measured from navigation start rather than from the moment boot
// finishes: a slow cold boot should be absorbed by this window, not added on top of it. So the
// splash is visible for max(this, boot time) — 5s on a normal boot, longer only if the app is not
// ready yet, never a 5s delay bolted onto the end of a slow one.
const DEFAULT_MINIMUM_VISIBLE_MS = 5000;

// Matches the transition in splashScreen.css. Kept in sync by hand — the element is removed from
// the layout after fading, and reading the duration back out of getComputedStyle to save one
// constant would cost a layout flush on every boot.
const FADE_OUT_MS = 320;

const SPLASH_ID = "app-splash";
const DISMISS_ID = "splash-dismiss";
const PROGRESS_ID = "app-splash-progress";
const ONBOARDING_ID = "app-splash-onboarding";
const LANGUAGE_ID = "app-splash-language";
const DISMISSING_CLASS = "is-dismissing";
const ONBOARDING_CLASS = "is-onboarding";

// The hold is a first-impression, not a toll. Once it has been paid, every later load in the same
// tab session skips straight past it — a reload, a deep link opened from a message, or bouncing
// back into the app all show the splash for as long as the boot actually needs and no longer.
// sessionStorage rather than localStorage on purpose: relaunching the installed PWA is a genuinely
// new session and gets the full moment again, while re-entering the running app never does.
const HELD_THIS_SESSION_KEY = "librept_splash_held";

const DEMO_INIT_PARAM = "init";
const DEMO_INIT_VALUE = "demo_data_load";
const SPLASH_PARAM = "splash";
const SPLASH_OPT_OUT = "off";
const WALKTHROUGH_PARAM = "demo";

/** `?splash=off` turns the splash off entirely — no hold, and no onboarding offer either. It is
 *  the "put me straight into the app" parameter, the same deep-link convention as `?init`, `?lang`
 *  and `?theme`. Demo links use it.
 *
 *  The browser suite deliberately does NOT: it clicks the real X instead (tests/conftest.py's
 *  dismiss_splash), so its ~100 navigations exercise the production boot rather than a bypass, and
 *  so appending a parameter to every URL cannot disturb the route assertions. Measured, the bypass
 *  would save ~384ms per navigation — ~5s of a 177s stage once spread across the xdist workers,
 *  which does not buy either of those. */
export function isSplashDisabled(search = window.location.search) {
  return new URLSearchParams(search).get(SPLASH_PARAM) === SPLASH_OPT_OUT;
}

/** Whether `?splash=off` actually suppresses the splash here (TODO §28.11).
 *
 * The parameter is honoured everywhere except one case: a FIRST RUN that the link brought nothing
 * to. Clearing browser data does not clear the address bar, so the reload arrives carrying whatever
 * URL was open — and `?splash=off` is set by every demo link and carried forward by every later
 * navigation, so a trainer who clears their data is dropped into an empty app having been asked no
 * language and offered no demo. There the parameter is a leftover, not a choice.
 *
 * `linkBringsContent` is the carve-out and it matters: `?init=` seeds the demo, `?demo=` runs the
 * walkthrough, `?evt=` carries an invitation a client is answering. Those links furnish the app, so
 * they get exactly what they asked for — stopping a client on a fresh phone to pick a language
 * before they can answer an invitation would be a worse bug than the one this fixes.
 */
export function splashSuppressed({
  search = window.location.search,
  firstRun = false,
  linkBringsContent = false,
} = {}) {
  if (!isSplashDisabled(search)) return false;
  return linkBringsContent || !firstRun;
}

export function hasHeldThisSession() {
  return sessionStorage.getItem(HELD_THIS_SESSION_KEY) === "1";
}

function rememberHeldThisSession() {
  sessionStorage.setItem(HELD_THIS_SESSION_KEY, "1");
}

export function requestedMinimumVisibleMs(
  search = window.location.search,
  alreadyHeld = hasHeldThisSession(),
) {
  if (isSplashDisabled(search) || alreadyHeld) return 0;
  return DEFAULT_MINIMUM_VISIBLE_MS;
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

/** The URL that starts the guided walkthrough (TODO §9.5): the demo dataset, plus the `?demo=`
 *  value app.js's last boot step reads.
 *
 *  It carries the demo data deliberately — the walkthrough drives the seeded group session, so a
 *  walkthrough over an empty app would be a panel pointing at nothing. That is also why this is the
 *  same reload as the demo link and not a mode toggled in place. */
export function walkthroughUrl(href = window.location.href) {
  const url = new URL(demoDataUrl(href));
  url.searchParams.set(WALKTHROUGH_PARAM, DEMO_WALKTHROUGH);
  return url.toString();
}

function fadeOut(splash, resolve) {
  splash.classList.add(DISMISSING_CLASS);
  window.setTimeout(() => {
    splash.hidden = true;
    resolve();
  }, FADE_OUT_MS);
}

/**
 * The language step: shown ahead of the hold and ahead of onboarding, with the X withdrawn.
 *
 * No exit on purpose, and this is the one screen where that is right — every other word the app
 * would show is in a language nobody has chosen, so there is nothing useful to dismiss TO. It is
 * also two taps at most, once ever.
 */
function revealLanguageChoice(splash, { onChooseLanguage, afterChoice }) {
  const languageStep = document.getElementById(LANGUAGE_ID);
  if (!languageStep) return afterChoice();

  document.getElementById(PROGRESS_ID)?.setAttribute("hidden", "");
  document.getElementById(DISMISS_ID)?.setAttribute("hidden", "");
  languageStep.hidden = false;

  for (const button of languageStep.querySelectorAll("[data-splash-lang]")) {
    button.addEventListener(
      "click",
      () => {
        onChooseLanguage(button.dataset.splashLang);
        languageStep.hidden = true;
        document.getElementById(DISMISS_ID)?.removeAttribute("hidden");
        afterChoice();
      },
      { once: true },
    );
  }
}

function revealOnboarding(splash, resolve) {
  const onboarding = document.getElementById(ONBOARDING_ID);
  // Never trap the trainer behind a panel that failed to render: fall back to just leaving.
  if (!onboarding) return fadeOut(splash, resolve);

  document.getElementById(PROGRESS_ID)?.setAttribute("hidden", "");
  // The X stays. The offer does not auto-close — there is a choice to make and nothing should make
  // it by timing out — but the trainer is never held here against their will either.
  onboarding.hidden = false;
  splash.classList.add(ONBOARDING_CLASS);

  document.getElementById("splash-load-demo")?.addEventListener("click", () => {
    window.location.assign(demoDataUrl());
  });
  document.getElementById("splash-walkthrough")?.addEventListener("click", () => {
    window.location.assign(walkthroughUrl());
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
  alreadyHeld = hasHeldThisSession(),
  minimumVisibleMs = requestedMinimumVisibleMs(window.location.search, alreadyHeld),
  offerOnboarding = false,
  needsLanguageChoice = false,
  linkBringsContent = false,
  onChooseLanguage = () => {},
} = {}) {
  const splash = document.getElementById(SPLASH_ID);
  if (!splash) return Promise.resolve();

  // Note this call is made from the LAST step of init(): the splash covers the whole boot either
  // way, so a load that skips the hold still waits for a fully wired app before it lifts.
  rememberHeldThisSession();

  // Both first-run screens honour the same override: `?splash=off` cannot skip them on an arrival
  // that brought nothing (TODO §28.11). The language step in particular has never had an exit —
  // there is nothing to dismiss TO when every word on screen is in a language nobody chose — and a
  // query parameter must not become the way around it that the dismiss X deliberately is not.
  const suppressed = splashSuppressed({
    firstRun: needsLanguageChoice || offerOnboarding,
    linkBringsContent,
  });
  const askForLanguage = needsLanguageChoice && !suppressed;

  // A tap on the X that landed while the app was still booting, captured by theme-boot.js because
  // this module was not loaded yet to hear it. Honouring it here is what makes that close DELAYED
  // rather than lost: the trainer asked to leave, and the first moment leaving is possible is now.
  //
  // It cannot skip the language step, though. That step has no X precisely because there is
  // nothing to dismiss to, and an early tap landing where the X will eventually be must not become
  // a way around it — the app would come up in a language nobody picked.
  if (window.librePtSplashCloseRequested && !askForLanguage) {
    return new Promise((resolve) => fadeOut(splash, resolve));
  }

  const onboarding = offerOnboarding && !suppressed;
  return new Promise((resolve) => {
    const continueAfterLanguage = () => {
      // The hold is measured from navigation start, so whatever the language step consumed already
      // counts towards it — answering a prompt is not made to be followed by a wait.
      const remaining = remainingHoldMs(minimumVisibleMs, performance.now());
      const holdTimer = window.setTimeout(() => {
        if (onboarding) revealOnboarding(splash, resolve);
        else fadeOut(splash, resolve);
      }, remaining);

      // The X wins over whatever the splash is doing — it cancels a hold in progress rather than
      // waiting it out, so the escape is immediate at any point.
      document.getElementById(DISMISS_ID)?.addEventListener(
        "click",
        () => {
          window.clearTimeout(holdTimer);
          fadeOut(splash, resolve);
        },
        { once: true },
      );
    };

    if (askForLanguage) {
      revealLanguageChoice(splash, { onChooseLanguage, afterChoice: continueAfterLanguage });
    } else {
      continueAfterLanguage();
    }
  });
}
