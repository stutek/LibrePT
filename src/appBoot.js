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
