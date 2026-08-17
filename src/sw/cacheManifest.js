// src/sw/cacheManifest.js — the app's offline cache: its versioned identity, the exact set of files
// that constitute ONE coherent app-shell version, and the low-level cache read/write/purge operations.
// Single responsibility: WHAT is cached and under WHICH cache version. Loaded via importScripts into the
// classic service worker (sw.js); exposes its API on self.swCacheManifest.
//
// Module-version coherence (README "Architectural Invariants"): the app is a graph of cross-importing ES
// modules, so every file in one page load must be the SAME build — a stale module importing a fresh one
// is a version skew that breaks at runtime. The cache is therefore atomic (one whole coherent version or
// nothing). CONTRIBUTOR RULE: when you add or move a runtime module, add it to ASSETS here AND bump
// CACHE_NAME, so the precached set stays complete (test_project_layout enforces it) and refreshes as one
// atomic version. The worker's own sub-scripts (sw.js + this sw/ folder) are deliberately NOT in ASSETS:
// they are the worker's script resources, kept coherent by the browser's own SW-update mechanism.
self.swCacheManifest = (() => {
  const CACHE_NAME = "librept-v87";
  const ASSETS = [
    "./",
    "./index.html",
    "./index.css",
    // Generated documentation pages (agent_tools/render_docs.py) and their stylesheet. Cached for
    // the reason they were brought in-app at all: a trainer in a basement gym tapping "Privacy"
    // used to reach github.com, which needs signal. These must work with none.
    "./landing.html",
    "./privacy.html",
    "./preview.html",
    "./bug-reporting.html",
    "./consent-form-en.html",
    "./privacy-notice-en.html",
    "./consent-form-sl.html",
    "./privacy-notice-sl.html",
    "./docs.css",
    // Per-module stylesheets (TODO §14.5 / §18.10) — index.css's shared foundation is loaded
    // first; these add only what their module owns.
    "./modules/clipboard/activeSessionOverlay.css",
    "./modules/clipboard/clipboardEditor.css",
    "./modules/clipboard/exerciseDeck.css",
    "./modules/clipboard/exerciseCard.css",
    "./modules/intake/signupDelivery.js",
    "./modules/intake/intakeView.js",
    "./modules/intake/intakeRoute.js",
    "./modules/intake/intake.css",
    "./modules/rsvp/rsvpView.js",
    "./modules/rsvp/rsvp.css",
    "./modules/demo/demoHand.js",
    "./modules/demo/demoTour.css",
    "./modules/demo/demoTourPlayer.js",
    "./modules/demo/gymFloorTour.js",
    "./modules/demo/walkthroughOverlay.js",
    "./modules/demo/walkthrough.css",
    "./modules/clipboard/circuitCard.css",
    "./modules/clipboard/exerciseAndRestTimer.css",
    "./modules/common/activeUsersList.css",
    "./modules/common/applicationHeader.css",
    "./modules/common/notificationArea.css",
    "./modules/common/backupRestore.css",
    "./modules/common/driveSyncUi.css",
    "./modules/common/buildInfoDialog.css",
    "./modules/common/feedbackModal.css",
    "./modules/clients/clientsView.css",
    "./modules/plans/plansView.css",
    "./modules/exercises/exercisesView.css",
    "./modules/exercises/exercisePicker.css",
    "./modules/history/historyView.css",
    "./modules/session/editSessionView.css",
    "./modules/session/sessionInviteDialog.css",
    "./modules/sessionList/sessionsView.css",
    "./modules/splash/splashScreen.css",
    "./app.js",
    "./appBoot.js",
    "./theme-boot.js",
    "./version.js",
    "./manifest.json",
    // Themes
    "./modules/themes/blossom.css",
    "./modules/themes/daylight.css",
    "./modules/themes/midnight.css",
    "./modules/themes/nebula.css",
    "./modules/themes/red.css",
    // Domain: the training vocabulary — pure, no DOM, no storage
    "./domain/repsAndLoad.js",
    "./domain/exerciseModality.js",
    "./domain/exerciseStandard.js",
    "./domain/sessionItemRecord.js",
    "./domain/sessionClock.js",
    "./domain/sessionPlanFactory.js",
    "./domain/quickSignals.js",
    "./domain/sessionFocus.js",
    "./domain/sessionHistoryRecord.js",
    "./domain/circuitGrouping.js",
    "./domain/demoTour.js",
    "./domain/inviteExpiry.js",
    "./domain/walkthrough.js",
    "./domain/notificationItems.js",
    "./domain/overlapLanes.js",
    "./domain/timeRange.js",
    "./domain/scheduleConflicts.js",
    "./domain/sessionRecord.js",
    // Common modules & helpers
    "./modules/common/utils.js",
    "./modules/common/dom.js",
    "./modules/common/renderRegistry.js",
    "./modules/common/wakeLock.js",
    "./modules/common/shareLink.js",
    "./modules/common/syncStatusGlyph.js",
    "./modules/common/theme.js",
    "./modules/common/activeUsersList.js",
    "./modules/common/applicationHeader.js",
    "./modules/common/backupRestore.js",
    "./modules/common/demoCleanupDialog.js",
    "./modules/common/driveSyncUi.js",
    "./modules/common/feedbackModal.js",
    "./modules/common/notificationArea.js",
    "./modules/common/populateDropdownSelectors.js",
    "./modules/common/buildInfoDialog.js",
    "./modules/common/consentForm.js",
    "./modules/common/encryptedFileReader.js",
    "./modules/common/download.js",
    "./modules/common/eventTransports.js",
    // Seed data & stores
    "./data/index.js",
    "./data/exercises.js",
    "./data/clientConsent.js",
    "./data/clientSignup.js",
    "./data/inviteRecord.js",
    "./data/signupFile.js",
    "./data/clients.js",
    "./data/routines.js",
    "./data/history.js",
    "./data/planUpdates.js",
    "./data/sessions.js",
    "./data/messages.js",
    "./data/stateStore.js",
    "./data/recordId.js",
    "./data/sessionCache.js",
    "./data/sessionItemOrder.js",
    "./data/storageNamespace.js",
    "./data/indexedDb.js",
    "./data/storageDurability.js",
    "./data/backupHealth.js",
    "./data/writeQueue.js",
    "./data/schemaMigrations.js",
    "./data/migrationSteps.js",
    "./data/recordSchemas.js",
    "./data/clientErasure.js",
    "./data/clientDataExport.js",
    "./data/encryptedExport.js",
    "./data/erasureSuppression.js",
    "./data/erasureRegisterSync.js",
    "./data/erasureChecklist.js",
    "./data/readSchema.js",
    "./data/recordProjections.js",
    "./data/recordReferences.js",
    "./data/recordDependencies.js",
    "./data/seedProvenance.js",
    "./data/demoDataRemoval.js",
    "./data/backupFile.js",
    "./data/syncMerge.js",
    "./data/driveSyncConfig.js",
    "./data/calendarFreeBusy.js",
    "./data/driveAppData.js",
    "./data/googleApiError.js",
    "./data/driveSyncService.js",
    "./data/googleAuth.js",
    "./data/calendarInvite.js",
    "./data/trainerIdentity.js",
    "./data/sessionEventPayload.js",
    // Translations (one file per locale, registered in i18n/index.js)
    "./i18n/index.js",
    "./i18n/en.js",
    "./i18n/sl.js",
    "./i18n/consent/index.js",
    "./i18n/consent/en.js",
    "./i18n/consent/sl.js",
    "./i18n/domMappings.js",
    // Domain modules
    "./modules/clipboard/deckCard.js",
    "./modules/clipboard/activeSessionBoard.js",
    "./modules/clipboard/activeSessionOverlayView.js",
    "./modules/clipboard/editModeState.js",
    "./modules/clipboard/clipboardEditor.js",
    "./modules/clipboard/exerciseAndRestTimer.js",
    "./modules/clipboard/exerciseCard.js",
    "./modules/clipboard/exerciseDeck.js",
    "./modules/clipboard/circuitCard.js",
    "./modules/clipboard/restDeckCard.js",
    "./modules/clipboard/pastDeckCard.js",
    "./modules/clients/clientConsentSection.js",
    "./modules/clients/clientDataRights.js",
    "./modules/clients/signupReviewDialog.js",
    "./modules/clients/clientsDirectory.js",
    "./modules/clients/clientsView.js",
    "./modules/exercises/exercisePicker.js",
    "./modules/exercises/exercisesView.js",
    "./modules/history/historyView.js",
    "./modules/plans/planAdjustments.js",
    "./modules/plans/plansView.js",
    "./modules/session/editSessionControl.js",
    "./modules/session/editSessionView.js",
    "./modules/session/sessionBar.js",
    "./modules/session/sessionInviteDialog.js",
    "./modules/session/sessionStartTimeDialog.js",
    "./modules/session/sessionTitleBar.js",
    "./modules/sessionList/sessionCard.js",
    "./modules/sessionList/sessionTimeline.js",
    "./modules/sessionList/sessionsView.js",
    "./modules/splash/splashScreen.js",
    // Domain controllers
    "./controllers/appLifecycleController.js",
    "./controllers/backupHealthController.js",
    "./controllers/clientFormsController.js",
    "./controllers/routineFormsController.js",
    "./controllers/exerciseFormsController.js",
    "./controllers/activeSessionController.js",
    "./controllers/gestureController.js",
    "./controllers/routerController.js",
    "./controllers/routes/route.js",
    "./controllers/routes/routeRegistry.js",
    "./controllers/routes/dialogRoute.js",
    "./controllers/routes/viewRoute.js",
    "./controllers/routes/sessionRoutes.js",
    "./controllers/routes/routeTable.js",
    // Icons & Fonts
    "./icons/icon-32.png",
    "./icons/icon-96.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png",
    // Vendored webfonts — same-origin, so part of the atomic app shell (no third-party font origin).
    "./fonts/fonts.css",
    "./fonts/dmsans-normal-latin.woff2",
    "./fonts/dmsans-normal-latin-ext.woff2",
    "./fonts/dmsans-italic-latin.woff2",
    "./fonts/dmsans-italic-latin-ext.woff2",
    "./fonts/outfit-normal-latin.woff2",
    "./fonts/outfit-normal-latin-ext.woff2",
    "./fonts/jetbrainsmono-normal-latin.woff2",
    "./fonts/jetbrainsmono-normal-latin-ext.woff2",
    "./fonts/jetbrainsmono-italic-latin.woff2",
    "./fonts/jetbrainsmono-italic-latin-ext.woff2",
    // Font Awesome, vendored 2026-08-05 (TODO §12.6 / §21) — same-origin now, so it joins the
    // atomic, integrity-verified shell instead of being a best-effort external fetch.
    "./fonts/fontawesome.css",
    "./fonts/fa-solid-900.woff2",
    "./fonts/fa-brands-400.woff2",
  ];

  // Every asset is same-origin since Font Awesome was vendored (TODO §12.6), so the whole list IS
  // the version-coherent module graph and precaches as one atomic, integrity-verified unit. The old
  // best-effort EXTERNAL_ASSETS split is gone with the last cross-origin asset: an empty escape
  // hatch invites a future CDN entry to slip past integrity verification unnoticed.
  const SHELL_ASSETS = ASSETS;

  function openAppCache() {
    return caches.open(CACHE_NAME);
  }

  // Runs on activate: delete every cache that is not the current version, so a new deploy never leaves
  // old, version-skewed files behind to be picked up piecemeal.
  async function deleteObsoleteCaches() {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
  }

  // Best-effort write-through used by the runtime fetch strategy: cache a successful, cacheable copy.
  // Skips non-http(s) schemes the Cache API rejects (chrome-extension:, data:, blob:) and opaque/errored
  // responses. Returns the response untouched so it can be handed straight to respondWith.
  function putInCache(request, response) {
    let url;
    try {
      url = new URL(request.url);
    } catch (err) {
      console.warn("ServiceWorker: Unable to parse request URL for caching:", request.url, err);
      return response;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return response;
    if (response && response.status === 200 && response.type !== "opaque") {
      const copy = response.clone();
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.put(request, copy))
        .catch((err) => {
          console.warn("ServiceWorker: Failed to write to cache for", request.url, err);
        });
    }
    return response;
  }

  return {
    CACHE_NAME,
    ASSETS,
    SHELL_ASSETS,
    openAppCache,
    deleteObsoleteCaches,
    putInCache,
  };
})();
