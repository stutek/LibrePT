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
  const CACHE_NAME = "librept-v35";
  const ASSETS = [
    "./",
    "./index.html",
    "./index.css",
    // Per-module stylesheets (TODO §14.5 / §18.10) — index.css's shared foundation is loaded
    // first; these add only what their module owns.
    "./modules/clipboard/activeSessionOverlay.css",
    "./modules/clipboard/clipboardEditor.css",
    "./modules/clipboard/exerciseDeck.css",
    "./modules/clipboard/exerciseCard.css",
    "./modules/clipboard/circuitCard.css",
    "./modules/clipboard/exerciseAndRestTimer.css",
    "./modules/common/activeUsersList.css",
    "./app.js",
    "./theme-boot.js",
    "./version.js",
    "./manifest.json",
    // Themes
    "./modules/themes/blossom.css",
    "./modules/themes/daylight.css",
    "./modules/themes/midnight.css",
    "./modules/themes/nebula.css",
    "./modules/themes/red.css",
    // Common modules & helpers
    "./modules/common/utils.js",
    "./modules/common/recordId.js",
    "./modules/common/releaseIdentity.js",
    "./modules/common/dom.js",
    "./modules/common/repsAndLoad.js",
    "./modules/common/exerciseModality.js",
    "./modules/common/exerciseStandard.js",
    "./modules/common/sessionItemOrder.js",
    "./modules/common/sessionItemRecord.js",
    "./modules/common/sessionCache.js",
    "./modules/common/wakeLock.js",
    "./modules/common/shareLink.js",
    "./modules/common/activeUsersList.js",
    "./modules/common/applicationHeader.js",
    "./modules/common/backupRestore.js",
    "./modules/common/feedbackModal.js",
    "./modules/common/notificationArea.js",
    "./modules/common/versionMessages.js",
    "./modules/common/buildInfoDialog.js",
    // Seed data & stores
    "./data/index.js",
    "./data/exercises.js",
    "./data/clients.js",
    "./data/routines.js",
    "./data/history.js",
    "./data/planUpdates.js",
    "./data/sessions.js",
    "./data/messages.js",
    "./data/stateStore.js",
    "./data/storageNamespace.js",
    "./data/indexedDb.js",
    "./data/storageDurability.js",
    "./data/writeQueue.js",
    "./data/schemaMigrations.js",
    "./data/migrationSteps.js",
    "./data/recordSchemas.js",
    "./data/recordProjections.js",
    "./data/versionCatalog.js",
    // Translations (one file per locale, registered in i18n/index.js)
    "./i18n/index.js",
    "./i18n/en.js",
    "./i18n/sl.js",
    "./i18n/domMappings.js",
    // Domain modules
    "./modules/clipboard/clipboardEditor.js",
    "./modules/clipboard/exerciseAndRestTimer.js",
    "./modules/clipboard/exerciseCard.js",
    "./modules/clipboard/exerciseDeck.js",
    "./modules/clipboard/circuitCard.js",
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
    "./modules/session/sessionTitleBar.js",
    "./modules/sessionList/daySelector.js",
    "./modules/sessionList/sessionCard.js",
    "./modules/sessionList/sessionList.js",
    "./modules/sessionList/sessionsView.js",
    // Domain controllers
    "./controllers/appLifecycleController.js",
    "./controllers/formsController.js",
    "./controllers/activeSessionController.js",
    "./controllers/gestureController.js",
    "./controllers/routerController.js",
    "./controllers/routes/route.js",
    "./controllers/routes/routeRegistry.js",
    "./controllers/routes/dialogRoute.js",
    "./controllers/routes/viewRoute.js",
    "./controllers/routes/sessionRoutes.js",
    "./controllers/routes/routeTable.js",
    "./controllers/themeController.js",
    // Icons & Fonts
    "./icons/icon-192.png",
    "./icons/icon-512.png",
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
    // Font Awesome is still CDN-hosted (best-effort external cache — see EXTERNAL_ASSETS).
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2",
  ];

  // The same-origin app shell is the version-coherent module graph — it MUST precache as one atomic,
  // integrity-verified unit. Third-party libs (the Font Awesome CDN) are NOT part of that graph and are
  // cached best-effort: a blocked/failed cross-origin fetch (a CSP without connect-src, or being offline
  // at install) must not fail the whole precache. They fall back to network/cache at runtime regardless.
  const SHELL_ASSETS = ASSETS.filter((u) => !/^https?:/i.test(u));
  const EXTERNAL_ASSETS = ASSETS.filter((u) => /^https?:/i.test(u));

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
    EXTERNAL_ASSETS,
    openAppCache,
    deleteObsoleteCaches,
    putInCache,
  };
})();
