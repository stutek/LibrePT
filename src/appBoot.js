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
import { initAppLifecycle } from "./controllers/appLifecycleController.js";
import { setupClientForms } from "./controllers/clientFormsController.js";
import { setupViewDismiss } from "./controllers/gestureController.js";
import { initRouter } from "./controllers/routerController.js";
import { initClientDataRights, setupClientDataRights } from "./modules/clients/clientDataRights.js";
import { initRestTimer, setupRestTimer } from "./modules/clipboard/exerciseAndRestTimer.js";
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
  initNotificationArea,
  setupNotificationGestures,
} from "./modules/common/notificationArea.js";
import { renderIntakeViewShell, setupIntakeForm } from "./modules/intake/intakeView.js";
import { initPlansView } from "./modules/plans/plansView.js";
import { initWorkoutSetup, setupWorkoutSetup } from "./modules/session/editSessionControl.js";
import { renderWorkoutSetupView } from "./modules/session/editSessionView.js";
import { initSessionBar, renderClipboardBarShell } from "./modules/session/sessionBar.js";
import { initSessionInviteDialog } from "./modules/session/sessionInviteDialog.js";
import { initSessionTitleBar } from "./modules/session/sessionTitleBar.js";
import { initSessionTimeline } from "./modules/sessionList/sessionTimeline.js";
import { dismissSplashWhenReady } from "./modules/splash/splashScreen.js";

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

export function bootBackupRestore(deps) {
  initBackupRestore(deps);
  setupBackupRestore();
}

export function bootDriveSyncUi(deps) {
  initDriveSyncUi(deps);
  setupDriveSyncUi();
}

export function bootHeader(deps) {
  initApplicationHeader(deps);
  setupApplicationHeader();
}

export function bootSessionTimeline(deps) {
  initSessionTimeline(deps);
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

// The client intake page (TODO §1.7/§26) — the ONE boot path whose user is not the trainer.
//
// **A separate boot, not a flag threaded through the normal one.** §26.1's constraint is that intake
// renders on a stock, cold browser: no state load, no demo seed, no service worker, no first-run
// agreement, no splash hold, and above all no write — a stranger who fills this in and walks away
// leaves nothing on their own phone. Every one of those is something the trainer's boot deliberately
// does, so the two paths share the document and nothing else. Written as a branch inside `init()`
// instead, each of those steps would need its own "unless this is a client" condition, and the day
// one of them was missed a prospective client would get a terms modal in front of the form, or an
// IndexedDB database on their phone (AGENT_RULES §5.9).
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
  return view;
}

// The guided walkthrough (TODO §9.5) — the same script as bootDemoTour, driven by the trainer.
//
// Its own boot step rather than a mode inside the one above: they share the script and the tap, and
// nothing else. One reads a URL value and plays; the other mounts a panel that outlives init() and
// waits for someone. Folding them together would mean a branch in a boot step for the benefit of one
// shared import (AGENT_RULES §5.9).
//
// Returns the walkthrough handle (`{ stop }`) so a caller can end it; null when the URL did not ask.
export async function bootWalkthrough({ shareDemo, hasData, t } = {}) {
  const { DEMO_WALKTHROUGH } = await import("./modules/common/shareLink.js");
  if (shareDemo !== DEMO_WALKTHROUGH || !hasData) return null;

  const [{ startGuidedWalkthrough }, { GYM_FLOOR_TOUR }] = await Promise.all([
    import("./modules/demo/walkthroughOverlay.js"),
    import("./modules/demo/gymFloorTour.js"),
  ]);

  return startGuidedWalkthrough({ tour: GYM_FLOOR_TOUR, t });
}
