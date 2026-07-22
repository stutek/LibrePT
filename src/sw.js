// sw.js - LibrePT Service Worker for Offline Functionality
// Bump CACHE_NAME on release: `activate` purges every cache that does not match it.
const CACHE_NAME = "librept-v16";
const ASSETS = [
  "./",
  "./index.html",
  "./index.css",
  "./app.js",
  "./manifest.json",
  // Themes
  "./themes/blossom.css",
  "./themes/daylight.css",
  "./themes/midnight.css",
  "./themes/nebula.css",
  "./themes/red.css",
  // Helpers
  "./helper/utils.js",
  "./helper/dom.js",
  "./helper/repsAndLoad.js",
  "./helper/sessionCache.js",
  "./helper/wakeLock.js",
  // Seed data (split per entity under data/)
  "./data/index.js",
  "./data/exercises.js",
  "./data/clients.js",
  "./data/routines.js",
  "./data/history.js",
  "./data/planUpdates.js",
  "./data/sessions.js",
  // Translations (one file per locale, registered in i18n/index.js)
  "./i18n/index.js",
  "./i18n/en.js",
  "./i18n/sl.js",
  "./i18n/domMappings.js",
  // UI component modules
  "./components/sessionCard.js",
  "./components/sessionList.js",
  "./components/clientsDirectory.js",
  "./components/exerciseCard.js",
  "./components/supersetCard.js",
  "./components/exerciseDeck.js",
  "./components/sessionBar.js",
  "./components/daySelector.js",
  "./components/sessionTitleBar.js",
  "./components/activeUsersList.js",
  "./components/applicationHeader.js",
  "./components/planAdjustments.js",
  "./components/exercisePicker.js",
  "./components/exerciseAndRestTimer.js",
  "./components/backupRestore.js",
  "./components/editSessionControl.js",
  "./components/feedbackModal.js",
  // Domain views
  "./views/clientsView.js",
  "./views/routinesView.js",
  "./views/exercisesView.js",
  "./views/historyView.js",
  "./views/sessionsView.js",
  "./views/editSessionView.js",
  // Domain controllers
  "./controllers/formsController.js",
  "./controllers/activeSessionController.js",
  "./controllers/gestureController.js",
  "./controllers/routerController.js",
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
