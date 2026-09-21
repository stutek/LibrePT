// src/modules/splash/splashScreen.js — the cold-start splash: holds the app mark on screen for a
// minimum time, then either fades out or, for a trainer with no data yet, turns into the
// onboarding entry point.
//
// Injected dependencies: `offerOnboarding` (whether the database is still empty — the caller owns
// that question, see data/stateStore.js's stateHasData), `mountTrainerDetails(container)`, which
// fills the details form beside the onboarding choices (TODO §45.2), `languages` (every dictionary
// this build ships, each named in itself) and `chapters` + `t` (the demo story's table of contents,
// and the words for it). Everything else it needs is its own markup and the URL, so it stays
// mountable without the rest of the app — and that is why all four arrive as parameters rather than
// imports: the details form reads and writes the identity store, the languages come from the i18n
// registry and the chapters from a quarter of a megabyte of demo script, and the file that paints
// before the app exists must reach into none of them.
//
// The splash is in the STATIC HTML and visible by default, not created here — it has to be on
// screen from first paint, and a module that runs after app.js parses would appear too late to
// cover anything. This module only takes it away.

// The `?demo=` value is imported rather than spelled again here: the splash writes the link and
// app.js's boot step reads it, and a typo in either would produce a button that silently starts
// nothing.
import { DEMO_STORY, SHARE_CHAPTER_PARAM, SHARE_STEP_PARAM } from "../common/shareLink.js";

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
const TRAINER_DETAILS_ID = "splash-trainer-details";
const LANGUAGE_ID = "app-splash-language";
const CHAPTERS_ID = "splash-chapters";
const CHAPTER_LIST_ID = "splash-chapter-list";
const DISMISSING_CLASS = "is-dismissing";
const ONBOARDING_CLASS = "is-onboarding";

// The hold is a first-impression, not a toll. Once it has been paid, every later load in the same
// tab session skips straight past it — a reload, a deep link opened from a message, or bouncing
// back into the app all show the splash for as long as the boot actually needs and no longer.
// sessionStorage rather than localStorage on purpose: relaunching the installed PWA is a genuinely
// new session and gets the full moment again, while re-entering the running app never does.
const HELD_THIS_SESSION_KEY = "librept_splash_held";

// Cleared rather than set: a promo link may carry `?init=demo_data_load` from before this changed,
// and leaving it on would seed the trainer's own workspace on the way into the sandbox.
const DEMO_INIT_PARAM = "init";
const WORKSPACE_PARAM = "workspace";
const SANDBOX_WORKSPACE = "sandbox";
const SPLASH_PARAM = "splash";
const SPLASH_OPT_OUT = "off";
const DEMO_SCRIPT_PARAM = "demo";

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

/** The URL that opens the sandbox: `?workspace=sandbox` (TODO §40.9), with the splash suppressed so
 *  the reload lands straight on a populated app.
 *
 *  It used to carry `?init=demo_data_load`, which seeded the sample people into the database the
 *  trainer was about to start working in — the very thing §40 exists to end. The parameter itself
 *  still means what it always did and is still what the e2e suite runs on; only where this OFFER
 *  leads has changed.
 *
 *  Reloading rather than seeding in place is deliberate. app.js seeds during init(), before the
 *  router and the views are wired, so calling seedMockData() from here would leave the app
 *  rendered against the empty state it booted with — and the alternative, injecting a re-render of
 *  everything into this module, would couple the splash to the whole app. A reload reuses the boot
 *  path that is already tested. */
export function demoDataUrl(href = window.location.href, rootPath = appRootPathname()) {
  const url = new URL(href);
  // Start at the app root — the sessions list — rather than wherever the trainer happened to be
  // (wanted 2026-08-18). The offer is now reachable from the message feed as well as the splash, so
  // it can be tapped from a client page or a live clipboard, and a walkthrough whose first step
  // looks for a session card must not begin somewhere without one. The QUERY survives: a promo link
  // keeps its language and theme.
  if (rootPath) url.pathname = rootPath;
  url.searchParams.delete(DEMO_INIT_PARAM);
  url.searchParams.set(WORKSPACE_PARAM, SANDBOX_WORKSPACE);
  url.searchParams.set(SPLASH_PARAM, SPLASH_OPT_OUT);
  return url.toString();
}

/** The URL behind every "show me around" offer — the splash's and the message feed's: the demo
 *  dataset, plus the `?demo=` value app.js's boot step reads.
 *
 *  It starts the STORY (§35), not the four-step gym-floor tour (`?demo=walkthrough`) these buttons
 *  started until 2026-08-25. Both run in the same guided panel, so the mistake was invisible from
 *  the code and plain on screen: a trainer who accepted the offer was counted "1 / 4" through the
 *  wedge that predates the story, and never saw the 31 steps the demo now IS. The old tour keeps
 *  its own link for the tests that exercise the engine; nothing offers it.
 *
 *  It carries the demo data deliberately — the script drives the seeded sessions, so a guide over an
 *  empty app would be a panel pointing at nothing. That is also why this is the same reload as the
 *  demo link and not a mode toggled in place. */
export function guidedDemoUrl(href = window.location.href, rootPath = appRootPathname()) {
  const url = new URL(demoDataUrl(href, rootPath));
  url.searchParams.set(DEMO_SCRIPT_PARAM, DEMO_STORY);
  return url.toString();
}

/** The same guided link, aimed at ONE chapter of the story (§35's `?demo=story&chapter=…`).
 *
 *  This is what a table of contents links to: the story is six chapters and four to six minutes, and
 *  a trainer who wants to see the evening after a session should not have to watch the morning
 *  first.
 *
 *  It drops `?step=`, and that is not tidying. Every step of a running story writes its own id into
 *  the URL (appBoot.js's `rememberStep`), so a link built from the current address while the story
 *  is playing would carry a step of the chapter being LEFT — and the guide, handed a step list for
 *  the chosen chapter and a start id from another one, would begin wherever it could. Naming a
 *  chapter means starting at its first step. */
export function guidedChapterUrl(
  chapterId,
  href = window.location.href,
  rootPath = appRootPathname(),
) {
  const url = new URL(guidedDemoUrl(href, rootPath));
  url.searchParams.set(SHARE_CHAPTER_PARAM, chapterId);
  url.searchParams.delete(SHARE_STEP_PARAM);
  return url.toString();
}

/** The app's own root, read from the `<base>` the server rewrites per deployment. Null where there
 * is no document at all (the Node unit tests), so a caller passing an explicit href there keeps the
 * path it passed rather than having one invented for it. */
function appRootPathname() {
  if (typeof document === "undefined" || !document.baseURI) return null;
  return new URL("./", document.baseURI).pathname;
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
function revealLanguageChoice(splash, { onChooseLanguage, afterChoice, languages }) {
  const languageStep = document.getElementById(LANGUAGE_ID);
  if (!languageStep) return afterChoice();

  fillLanguageChoices(languageStep, languages);

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

/**
 * Fill the walkthrough's table of contents, and show it, open (§35's chapters, asked 2026-09-21).
 *
 * The chapters are HANDED IN as `{ id, titleKey }`, in playing order — the splash may not import the
 * story any more than it may import the identity store, and the story is a quarter of a megabyte of
 * script it must never wait for. Their words are looked up at the moment they are drawn, so the list
 * is in the language the trainer chose two taps ago; `data-i18n` goes on as well, so a later
 * language switch repaints it the same way it repaints every other label.
 *
 * Nothing is shown when there are no chapters to show: a heading over an empty list tells a trainer
 * nothing at all.
 */
function fillChapterIndex(chapters, t) {
  const index = document.getElementById(CHAPTERS_ID);
  const list = document.getElementById(CHAPTER_LIST_ID);
  if (!index || !list || !chapters?.length) return;

  list.replaceChildren();
  for (const { id, titleKey } of chapters) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-splash-chapter";
    button.dataset.splashChapter = id;
    button.dataset.i18n = titleKey;
    button.textContent = t(titleKey);
    button.addEventListener("click", () => {
      window.location.assign(guidedChapterUrl(id));
    });
    item.append(button);
    list.append(item);
  }
  index.hidden = false;
}

/**
 * Put the language buttons up from the registry of dictionaries the build actually ships.
 *
 * `languages` is `{ code, label }` in the order they are offered, and each label is that language's
 * name IN ITSELF — the choice has to be legible to someone who cannot read the language currently on
 * screen. Adding a language is then adding its dictionary and nothing else; nobody has to remember
 * this screen.
 *
 * An empty list leaves the markup's own two buttons alone. That is the fallback, not the path: a
 * splash whose buttons were replaced by nothing would be a screen with no way out at all, and this
 * one deliberately has no X.
 */
function fillLanguageChoices(languageStep, languages) {
  const options = languageStep.querySelector(".app-splash-language-options");
  if (!options || !languages?.length) return;

  options.replaceChildren();
  for (const { code, label } of languages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-splash-action";
    button.dataset.splashLang = code;
    button.lang = code;
    button.textContent = label;
    options.append(button);
  }
}

function revealOnboarding(splash, resolve, mountTrainerDetails, chapters, t) {
  const onboarding = document.getElementById(ONBOARDING_ID);
  // Never trap the trainer behind a panel that failed to render: fall back to just leaving.
  if (!onboarding) return fadeOut(splash, resolve);

  // The trainer's own details, offered beside the three choices (TODO §45.2, asked 2026-09-11).
  // INJECTED rather than imported: this module reaches for nothing but its own markup and the URL,
  // which is what keeps it mountable — and a splash that pulled in the identity store would drag the
  // data layer into the one file that has to paint before the app exists.
  mountTrainerDetails?.(document.getElementById(TRAINER_DETAILS_ID));

  document.getElementById(PROGRESS_ID)?.setAttribute("hidden", "");
  // The X stays. The offer does not auto-close — there is a choice to make and nothing should make
  // it by timing out — but the trainer is never held here against their will either.
  onboarding.hidden = false;
  splash.classList.add(ONBOARDING_CLASS);

  document.getElementById("splash-load-demo")?.addEventListener("click", () => {
    window.location.assign(demoDataUrl());
  });
  fillChapterIndex(chapters, t);
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
  mountTrainerDetails = null,
  // Which languages this build ships, and which chapters its demo story has. Both are handed in for
  // the same reason the trainer's details form is: this module paints before the app exists, so it
  // reaches for its own markup and the URL and nothing else.
  languages = [],
  chapters = [],
  t = (key) => key,
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
        if (onboarding) revealOnboarding(splash, resolve, mountTrainerDetails, chapters, t);
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
      revealLanguageChoice(splash, {
        onChooseLanguage,
        afterChoice: continueAfterLanguage,
        languages,
      });
    } else {
      continueAfterLanguage();
    }
  });
}
