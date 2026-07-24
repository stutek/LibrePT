// sw.js - LibrePT Service Worker for Offline Functionality
//
// INVARIANT — module-version coherence (see README "Architectural Invariants"): the app is a graph of
// cross-importing ES modules, so every module in a single load must be the SAME build; a mix of cached
// (old) and network (new) files is a version skew that breaks at runtime. The cache is therefore
// atomic — the WHOLE ASSETS set is precached with addAll (all-or-nothing), fetch is network-first so an
// online load is one deployed version, and CACHE_NAME is bumped every release so `activate` purges old
// caches wholesale. Adding a runtime module? Add it to ASSETS AND bump CACHE_NAME, or offline loads a
// version-skewed app.
const CACHE_NAME = "librept-v18";
const ASSETS = [
  "./",
  "./index.html",
  "./index.css",
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
  "./modules/common/dom.js",
  "./modules/common/repsAndLoad.js",
  "./modules/common/exerciseModality.js",
  "./modules/common/sessionItemRecord.js",
  "./modules/common/sessionCache.js",
  "./modules/common/wakeLock.js",
  "./modules/common/shareLink.js",
  "./modules/common/activeUsersList.js",
  "./modules/common/applicationHeader.js",
  "./modules/common/backupRestore.js",
  "./modules/common/feedbackModal.js",
  "./modules/common/notificationArea.js",
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
  "./modules/clipboard/supersetCard.js",
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
  "./controllers/themeController.js",
  // Icons & Fonts
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

function cachePut(request, response) {
  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    console.warn("ServiceWorker: Unable to parse request URL for caching:", request.url, err);
    return response;
  }

  // Cache Storage API only supports http: and https: schemes.
  // Non-HTTP requests (e.g. chrome-extension://, moz-extension://, data:, blob:) are skipped.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return response;
  }

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

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Intercept page navigation requests and respond with the cached index.html
    // shell to support clean URL paths in a client-side SPA.
    if (e.request.mode === "navigate") {
      e.respondWith(
        fetch("./index.html", { cache: "no-store" })
          .then((response) => cachePut(new Request("./index.html"), response))
          .catch(() =>
            caches.match("./index.html").then((cached) => {
              if (cached) {
                self.clients.matchAll().then((clients) => {
                  for (const client of clients) {
                    client.postMessage({ type: "OFFLINE_CACHE_USED" });
                  }
                });
                return cached;
              }
              return Response.error();
            }),
          ),
      );
      return;
    }

    // Network-first for our own app shell. A stale-while-revalidate cache serves the previous
    // build on every load after a deploy, which silently hides shipped changes from trainers.
    // Falling back to cache keeps a basement gym with no signal fully offline-capable.
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((response) => cachePut(e.request, response))
        .catch(() =>
          caches.match(e.request).then((cached) => {
            if (cached) {
              self.clients.matchAll().then((clients) => {
                for (const client of clients) {
                  client.postMessage({ type: "OFFLINE_CACHE_USED" });
                }
              });
              return cached;
            }
            return Response.error();
          }),
        ),
    );
    return;
  }

  // Cache-first for immutable third-party assets (Font Awesome CSS and its webfonts)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => cachePut(e.request, response));
    }),
  );
});
