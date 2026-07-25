// src/sw/runtimeFetch.js — how the RUNNING app answers requests. Single responsibility: the fetch
// strategy. Network-first for our own app shell (so a deploy's changes show up immediately, never a
// stale build) with a cache fallback (so a signal-less basement gym stays fully offline-capable), and
// cache-first for immutable third-party assets. Loaded via importScripts after cacheManifest (whose
// putInCache it uses); exposes its API on self.swRuntimeFetch.
//
// There is deliberately NO per-file stale-while-revalidate layer: serving some files fresh and others
// stale within one load is exactly the version skew the atomic cache exists to prevent.
self.swRuntimeFetch = (() => {
  // Let open pages know a response came from cache (offline), so the UI can show the offline state.
  function notifyOfflineCacheUsed() {
    self.clients.matchAll().then((clients) => {
      for (const client of clients) client.postMessage({ type: "OFFLINE_CACHE_USED" });
    });
  }

  // Offline fallback: serve `matchTarget` from cache if present (flagging offline), else a network error.
  function respondFromCache(matchTarget) {
    return caches.match(matchTarget).then((cached) => {
      if (cached) {
        notifyOfflineCacheUsed();
        return cached;
      }
      return Response.error();
    });
  }

  function handleFetch(event) {
    const request = event.request;
    if (request.method !== "GET") return;

    let url;
    try {
      url = new URL(request.url);
    } catch (err) {
      return; // unparseable URL — leave it to the browser default
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    const putInCache = self.swCacheManifest.putInCache;

    if (url.origin === self.location.origin) {
      // Navigations resolve to the SPA shell so a clean deep-link URL boots the app, which then
      // resolves the route client-side (or shows the in-app not-found view for an unknown one).
      if (request.mode === "navigate") {
        event.respondWith(
          fetch("./index.html", { cache: "no-store" })
            .then((response) => putInCache(new Request("./index.html"), response))
            .catch(() => respondFromCache("./index.html")),
        );
        return;
      }

      // Network-first for our own app shell, cache only as the offline fallback.
      event.respondWith(
        fetch(request, { cache: "no-store" })
          .then((response) => putInCache(request, response))
          .catch(() => respondFromCache(request)),
      );
      return;
    }

    // Cache-first for immutable third-party assets (Font Awesome CSS and its webfonts).
    event.respondWith(
      caches
        .match(request)
        .then(
          (cached) => cached || fetch(request).then((response) => putInCache(request, response)),
        ),
    );
  }

  return { handleFetch };
})();
