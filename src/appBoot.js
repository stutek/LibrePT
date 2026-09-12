// src/appBoot.js — extracted, independently callable boot steps for app.js's init() sequence.
// Single responsibility: wrap each feature's initXyz()+setupXyz() pair from app.js's init() as a
// named, exported function taking one explicit deps object. No defaults are baked in here and
// nothing runs at import time — app.js still assembles the real production deps (unchanged) and
// calls these in the same order it always has; a test can import this module directly (importing
// it alone does nothing) and call one function with fakes, without ever running the real init().
//
// Why this exists: a test that wants to mount just the notification footer, or just the build-info
// dialog, has no other way to do that — app.js itself has zero exports and triggers the full real
// boot on DOMContentLoaded the moment it's imported. Extracting each step here, verbatim, means a
// test calls the exact function production calls, not a hand-duplicated stand-in that could drift.

import {
  initActiveSessionController,
  setupActiveSession,
} from "./controllers/activeSessionController.js";
import {
  captureUncaughtErrors,
  crashLog,
  initAppLifecycle,
} from "./controllers/appLifecycleController.js";
import { setupClientForms } from "./controllers/clientFormsController.js";
import { setupViewDismiss } from "./controllers/gestureController.js";
import { initRouter } from "./controllers/routerController.js";
import { ISSUE_TRACKER_URL } from "./data/publicUrls.js";
import { resolveLang } from "./i18n/index.js";
import { initClientDataRights, setupClientDataRights } from "./modules/clients/clientDataRights.js";
import { receiveSharedSubmissions } from "./modules/clients/signupInbox.js";
import {
  initSignupReview,
  openSignupReview,
  reviewSignupText,
  setupSignupReview,
} from "./modules/clients/signupReviewDialog.js";
import {
  initRestTimer,
  rebindTimersToWorkspace,
  setupRestTimer,
} from "./modules/clipboard/exerciseAndRestTimer.js";
import {
  initApplicationHeader,
  setupApplicationHeader,
} from "./modules/common/applicationHeader.js";
import { initBackupRestore, setupBackupRestore } from "./modules/common/backupRestore.js";
import { initBuildInfoDialog, setupBuildInfoDialog } from "./modules/common/buildInfoDialog.js";
import {
  initDemoCleanupDialog,
  openDemoCleanupDialog,
} from "./modules/common/demoCleanupDialog.js";
import { initDriveSyncUi, setupDriveSyncUi } from "./modules/common/driveSyncUi.js";
import { setupEncryptedFileReader } from "./modules/common/encryptedFileReader.js";
import { initFeedbackModal, setupFeedbackForms } from "./modules/common/feedbackModal.js";
import {
  initFeedbackRouteDialog,
  openFeedbackRouteDialog,
} from "./modules/common/feedbackRouteDialog.js";
import {
  initNotificationArea,
  setupNotificationGestures,
} from "./modules/common/notificationArea.js";
import {
  initTrainerDetailsDialog,
  openTrainerDetailsDialog,
} from "./modules/common/trainerDetailsDialog.js";
import { renderIntakeViewShell, setupIntakeForm } from "./modules/intake/intakeView.js";
import { initPlansView } from "./modules/plans/plansView.js";
import {
  initProgramImportDialog,
  openProgramImportDialog,
} from "./modules/plans/programImportDialog.js";
import { renderRsvpViewShell, setupRsvpReply } from "./modules/rsvp/rsvpView.js";
import { initWorkoutSetup, setupWorkoutSetup } from "./modules/session/editSessionControl.js";
import { renderWorkoutSetupView } from "./modules/session/editSessionView.js";
import { initSessionBar, renderClipboardBarShell } from "./modules/session/sessionBar.js";
import { initSessionInviteDialog } from "./modules/session/sessionInviteDialog.js";
import { initSessionTitleBar } from "./modules/session/sessionTitleBar.js";
import { initSessionFilterBar } from "./modules/sessionList/sessionFilterBar.js";
import { initSessionTimeline } from "./modules/sessionList/sessionTimeline.js";
import { dismissSplashWhenReady } from "./modules/splash/splashScreen.js";
import { BUILD_INFO } from "./version.js";

// Global error capture (TODO §12.4). Its own step, called before every other one: the crash worth
// catching most is the one that happens while the app is still starting.
export function bootCrashCapture(deps) {
  captureUncaughtErrors(deps);
}

// Re-EXPORTED, not merely imported: `appBoot.crashLog` was undefined until this line existed, so the
// feed asked for the crash log, got nothing, and rendered no offer — silently, because a missing
// optional dep looks exactly like "no crashes yet". An e2e case pins it now.
export { crashLog };

export function bootAppLifecycle(deps) {
  initAppLifecycle(deps);
}

export function bootRouter(deps) {
  initRouter(deps);
}

export function bootPlansView(deps) {
  initPlansView(deps);
}

export function bootSessionInviteDialog(deps) {
  initSessionInviteDialog(deps);
}

export function bootWorkoutSetup(deps) {
  renderWorkoutSetupView();
  initWorkoutSetup(deps);
  setupWorkoutSetup();
}

// The add/edit client dialog AND the directory's live search box — the search listener lives in
// this controller rather than in the view module, so the two only work together.
export function bootClientForms(deps) {
  setupClientForms(deps);
}

// The two data-subject-request dialogs (export / erase). Separate from bootClientForms because they
// need write access to the WHOLE state — an erasure fans out across four collections — where the
// client form only ever edits one record.
export function bootEncryptedFileReader() {
  setupEncryptedFileReader();
}

// The review dialog for a submission a client sent in (TODO §26.5). Boots with the client feature
// rather than with intake: the person using it is the trainer, and what it produces is a client record.
export function bootSignupReview(deps) {
  initSignupReview(deps);
  setupSignupReview();
}

// The two ways a submission arrives without anybody going looking for it: shared into the app from
// the messaging app it came in, or opened by tapping the file itself (§38.22).
//
// AFTER the splash, not during boot. A `<dialog>` opened with showModal() makes the rest of the page
// inert — including the splash's own dismiss button — so a submission that opened during boot left
// the trainer looking at a splash screen they could not get past, with the dialog behind it. Found
// the first time the e2e test drove a real share through the real worker.
export function bootSharedSubmissions() {
  return receiveSharedSubmissions({
    openReview: openSignupReview,
    reviewText: reviewSignupText,
  });
}

export function bootClientDataRights(deps) {
  initClientDataRights(deps);
  setupClientDataRights();
}

// The live clipboard: the overlay shell plus every listener the deck, the inline plan editor and
// the ⋯ session menu hang off. `setupActiveSession`'s deps are a strict subset of the controller's
// init deps, so one object serves both — app.js used to pass two hand-maintained lists that had to
// be kept in agreement.
export function bootActiveSession(deps) {
  initActiveSessionController(deps);
  setupActiveSession(deps);
}

export function bootFeedbackModal(deps) {
  initFeedbackModal(deps);
  setupFeedbackForms();
}

export function bootRestTimer(deps) {
  initRestTimer(deps);
  setupRestTimer();
}

/** Re-read both workspaces' timers after a switch (TODO §40.11). Re-exported here so app.js reaches
 * the timer stack the same way it reaches everything else it boots. */
export function rebindTimers() {
  rebindTimersToWorkspace();
}

export function bootBackupRestore(deps) {
  initBackupRestore(deps);
  setupBackupRestore();
}

export function bootDriveSyncUi(deps) {
  initDriveSyncUi(deps);
  setupDriveSyncUi();
}

export function bootHeader(deps) {
  // Both of the header menu's own dialogs are wired here, for the same reason: their entry points
  // are menu items, and neither needs anything else booted first.
  initProgramImportDialog({
    t: deps.t,
    getState: deps.getState,
    onImport: deps.onProgramImported,
    // Injected rather than reached for, so nothing in the dialog touches a FileReader — and a test
    // hands it a string instead of a file.
    readFileText: (file) => file.text(),
  });

  // The feedback route rides along with the header because that is where its menu entry lives, and
  // it needs nothing else booted (TODO §23.5).
  initFeedbackRouteDialog({
    t: deps.t,
    getState: deps.getState,
    buildSha: () => BUILD_INFO.commit,
    route: () => window.location.pathname + window.location.search,
    repoUrl: ISSUE_TRACKER_URL,
  });
  // The trainer's own name, phone and address (TODO §45.2) — another menu item with no other
  // prerequisite, and its store is plain localStorage rather than anything that has to be booted.
  initTrainerDetailsDialog({ t: deps.t });

  initApplicationHeader({
    ...deps,
    openFeedbackRoute: openFeedbackRouteDialog,
    openProgramImport: openProgramImportDialog,
    openTrainerDetails: openTrainerDetailsDialog,
  });
  setupApplicationHeader();
}

export function bootSessionTimeline(deps) {
  initSessionTimeline(deps);
  // The filter row rides with the timeline: both are chrome around the same board, both are
  // rendered by renderSessions(), and neither needs anything else booted first (TODO §45.6).
  initSessionFilterBar({
    t: deps.t,
    lang: () => resolveLang(deps.getState().lang),
    clients: () => deps.getState().clients || [],
    onChange: () => deps.rerenderSessions(),
  });
}

export function bootSessionTitleBar(deps) {
  initSessionTitleBar(deps);
}

// Must boot AFTER bootNotificationArea: the bar mounts into `#notification-handle-bar`, which the
// notification area's own shell renders.
export function bootSessionBar(deps) {
  initSessionBar(deps);
  renderClipboardBarShell();
}

export function bootBuildInfoDialog(deps) {
  initBuildInfoDialog(deps);
  setupBuildInfoDialog();
}

// The demo-cleanup dialog boots WITH the notification area because that feed is its only entry
// point (the demo-mode notice's primary action). Injected as a callback rather than imported by
// notificationArea.js, so the feed keeps knowing nothing about how the cleanup is presented.
export function bootNotificationArea(deps) {
  initDemoCleanupDialog(deps);
  initNotificationArea({ ...deps, openDemoCleanup: openDemoCleanupDialog });
  setupNotificationGestures();
}

export function bootViewDismiss(deps) {
  setupViewDismiss(deps);
}

// Last step of init(): everything the splash was covering is now wired, so start the fade — unless
// there is still something to ask (a language, or the empty-database onboarding offer). Returns the
// promise so a caller (a test, or any future "app is interactive" hook) can await it.
export function bootSplashScreen(deps) {
  return dismissSplashWhenReady(deps);
}

// The scripted demo tour (TODO §23.5). LAST boot step by construction: it drives the real controls,
// so every one of them has to be wired and rendered first — and unlike the other steps it is inert
// unless the URL asked for it, so ordering it late costs nothing on a normal boot.
//
// Failures are reported, never thrown: a tour that cannot run is a broken marketing asset, not a
// broken app, and a trainer who happened to open a stale link must still get their session.
export async function bootDemoTour({ shareDemo, hasData, onResults } = {}) {
  const { DEMO_TOUR_GYM_FLOOR } = await import("./modules/common/shareLink.js");
  if (shareDemo !== DEMO_TOUR_GYM_FLOOR || !hasData) return null;

  const [{ playTour }, { mountDemoHand }, { GYM_FLOOR_TOUR }] = await Promise.all([
    import("./modules/demo/demoTourPlayer.js"),
    import("./modules/demo/demoHand.js"),
    import("./modules/demo/gymFloorTour.js"),
  ]);

  const results = await playTour(GYM_FLOOR_TOUR, { hand: mountDemoHand() });
  onResults?.(results);
  return results;
}

// Everything a demo has to wait for before it may start: the splash gone, and the first-run
// agreement out of the way (reported 2026-08-21). A demo nobody can see is not a demo — on a
// cleared browser the tour used to play its whole script behind the mandatory terms modal, and the
// trainer agreed onto an app that had already finished showing itself.
//
// Takes the splash's own promise rather than polling for its absence: that promise is what already
// means "the app is on screen", including the language step it may have stopped to ask.
export async function whenDemoCanBeWatched(splashDown) {
  await splashDown;
  const { whenTermsAgreed } = await import("./modules/common/applicationHeader.js");
  await whenTermsAgreed();
}

// The long demo (TODO §35) — the chaptered story, DRIVEN BY THE TRAINER with narration cards
// between the steps.
//
// **It is guided, not played** (decided 2026-08-22, Simon: "autoplay reduces the effect, a person
// loses focus; Show me is the best middle ground"). Four taps can be watched; four minutes cannot,
// and a viewer who is only watching stops watching. So the story runs on the same panel the
// walkthrough uses — the trainer performs each step, or asks to be shown it — and the narration
// cards are the storytelling around that.
//
// Its own boot step beside bootWalkthrough rather than a mode inside it: they share the guide and
// nothing else. The wedge is four taps at one screen; this one carries a narration surface, a
// persona label and a chapter chosen by the link.
//
// Failures are reported, never thrown, for the same reason the wedge's are: a story that cannot play
// is a broken marketing asset, not a broken app.
export async function bootDemoStory({
  shareDemo,
  shareChapter,
  shareStep,
  rememberStep,
  hasData,
  t,
  goHome,
  getLang,
} = {}) {
  const { DEMO_STORY: DEMO_STORY_PARAM } = await import("./modules/common/shareLink.js");
  if (shareDemo !== DEMO_STORY_PARAM || !hasData) return null;

  const [{ startGuidedWalkthrough }, { mountDemoNarrator }, { DEMO_STORY }, story] =
    await Promise.all([
      import("./modules/demo/walkthroughOverlay.js"),
      import("./modules/demo/demoNarratorCard.js"),
      import("./modules/demo/storyTour.js"),
      import("./domain/demoStory.js"),
    ]);

  const problems = story.validateStory(DEMO_STORY);
  if (problems.length > 0) {
    // A malformed script is a broken marketing asset, not a broken app — it says so where an
    // investigator looks, and the trainer keeps a working clipboard.
    console.warn(`[story] ${problems.join("; ")}`);
    return null;
  }

  // The way onward the last card offers (§30.2): the SAME dialog the demo notice in the feed
  // opens, not a second cleanup path that could drift from it.
  const narrator = mountDemoNarrator({
    t,
    onClearDemoData: openDemoCleanupDialog,
    // Tapping the attachment on the story's screenshot of the trainer's messages does what tapping
    // it on a phone does: LibrePT opens with the submission in the review dialog (§38.22). The same
    // entry point the share target uses — the demo cannot summon the operating system, but it must
    // not invent a path of its own either.
    onAttachment: (attachment) => {
      openSignupReview();
      reviewSignupText(attachment.text);
    },
  });
  // Flattened to one step list: a chapter is a tour, which is what lets the guide run it unchanged.
  const steps = story.storyStepsFor(DEMO_STORY, shareChapter, { t });
  return startGuidedWalkthrough({
    tour: { id: DEMO_STORY.id, steps },
    t,
    // The guide narrates through the surface the story already owns, so the card that says "you
    // have wandered off" is the same card as every other one the viewer has been reading (§38.10).
    narrator,
    navigate: goHome && ((path) => goHome(path)),
    startAtStepId: shareStep,
    // So the crossing to the client's phone takes the trainer's language with it: her page is a
    // separate boot with nothing to read a choice from (§39.2).
    getLang,
    // Each step names itself in the URL, so a reload — or a link sent to a colleague mid-story —
    // lands on the step being watched instead of restarting the tour (reported 2026-08-23: a reload
    // came back on another tour's first card). replaceState, not push: the browser's Back belongs to
    // the app's own navigation, and a 31-entry history of one demo would bury it.
    onStep: (step) => {
      rememberStep?.(step?.id);
      narrator.showStep(step);
    },
  });
}

// The client intake page (TODO §1.7/§26) — the ONE boot path whose user is not the trainer.
//
// **A separate boot, not a flag threaded through the normal one.** §26.1's constraint is that intake
// renders on a stock, cold browser: no state load, no demo seed, no service worker, no first-run
// agreement, no splash hold, and nothing written that outlives the tab — a stranger who fills this
// in and walks away leaves nothing on their own phone. What they type is held in sessionStorage
// while the tab is open, so a reload does not throw their work away (TODO §38.12); closing it takes
// the lot with it, which is what the page promises them in as many words. Every one of those is something the trainer's boot deliberately
// does, so the two paths share the document and nothing else. Written as a branch inside `init()`
// instead, each of those steps would need its own "unless this is a client" condition, and the day
// one of them was missed a prospective client would get a terms modal in front of the form, or an
// IndexedDB database on their phone.
//
// The splash is hidden rather than dismissed: it exists to cover a boot that, here, is not happening.
export function bootIntake(deps) {
  const splash = document.getElementById("app-splash");
  if (splash) splash.hidden = true;

  renderIntakeViewShell();
  const view = document.getElementById("view-intake");
  // No router on this path, so the view is activated directly — the class the stylesheet keys on.
  if (view) view.classList.add("active");
  setupIntakeForm(deps);
  bootIntakeStoryChapter(deps);
  return view;
}

// The long story's client-side chapter, played on the client's own page (TODO §35.3e).
//
// It runs HERE rather than being folded into the trainer's walk because this is a different boot on
// a different device in the story — and because the client's screens are the real ones, which is the
// whole reason the handover navigates instead of drawing a phone. Everything the stateless boot
// promises still holds: the guide reads the form and points at it, and writes nothing.
async function bootIntakeStoryChapter({ shareDemo, shareChapter, t, lang } = {}) {
  const { DEMO_STORY: DEMO_STORY_PARAM } = await import("./modules/common/shareLink.js");
  if (shareDemo !== DEMO_STORY_PARAM) return null;

  const [{ startGuidedWalkthrough }, { mountDemoNarrator }, { DEMO_STORY }, story] =
    await Promise.all([
      import("./modules/demo/walkthroughOverlay.js"),
      import("./modules/demo/demoNarratorCard.js"),
      import("./modules/demo/storyTour.js"),
      import("./domain/demoStory.js"),
    ]);

  const steps = story.storyStepsFor(DEMO_STORY, shareChapter || "intake", {
    surface: "client",
    t,
  });
  if (steps.length === 0) return null;
  const narrator = mountDemoNarrator({ t });
  return startGuidedWalkthrough({
    tour: { id: "story-intake", steps },
    t,
    narrator,
    // The hand BACK carries it too: the trainer's own app has his choice in storage, but a viewer
    // who opened this chapter's link directly has told us the language only in that address.
    getLang: lang,
    onStep: (step) => narrator.showStep(step),
  });
}

// The invite-reply page (TODO §1.6's confirm link) — the second CLIENT-facing boot, and stateless for
// the same reason as bootIntake: this is not the trainer's device. Separate from bootIntake because the
// two share only the document; one collects a person's details, the other answers a session invite.
export function bootRsvpReply(deps) {
  const splash = document.getElementById("app-splash");
  if (splash) splash.hidden = true;

  renderRsvpViewShell();
  document.getElementById("view-rsvp")?.classList.add("active");
  return setupRsvpReply(deps);
}

// The guided walkthrough (TODO §9.5) — the same script as bootDemoTour, driven by the trainer.
//
// Its own boot step rather than a mode inside the one above: they share the script and the tap, and
// nothing else. One reads a URL value and plays; the other mounts a panel that outlives init() and
// waits for someone. Folding them together would mean a branch in a boot step for the benefit of one
// shared import.
//
// Returns the walkthrough handle (`{ stop }`) so a caller can end it; null when the URL did not ask.
export async function bootWalkthrough({ shareDemo, hasData, t, goHome } = {}) {
  const { DEMO_WALKTHROUGH } = await import("./modules/common/shareLink.js");
  if (shareDemo !== DEMO_WALKTHROUGH || !hasData) return null;

  const [{ startGuidedWalkthrough }, { GYM_FLOOR_TOUR }, { stepPreconditionMet }] =
    await Promise.all([
      import("./modules/demo/walkthroughOverlay.js"),
      import("./modules/demo/gymFloorTour.js"),
      import("./modules/demo/demoTourPlayer.js"),
    ]);

  // Put the app where the SCRIPT begins, not where the URL happened to point (TODO §30.3, reported
  // as "refreshing deep link starts demo at wrong step"). A pasted or refreshed `?demo=` link can
  // carry any route — a clipboard, a client — and step 1 asking the trainer to open a session that
  // is already open in front of them reads as a guide that has lost its place.
  if (!stepPreconditionMet(GYM_FLOOR_TOUR.steps[0])) goHome?.();

  // `navigate` is the same function, injected so the walkthrough can restore a step's own view when
  // the trainer walks Back into it — the overlay knows WHICH route from the script, and nothing
  // about how this app performs one.
  return startGuidedWalkthrough({ tour: GYM_FLOOR_TOUR, t, navigate: goHome && ((_) => goHome()) });
}
