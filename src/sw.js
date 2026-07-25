// sw.js — LibrePT service worker ENTRY. Thin lifecycle wiring only: it loads the worker's modules and
// binds the three lifecycle events to them. Every concern lives in its own single-responsibility module
// under src/sw/, loaded here via importScripts because this is a CLASSIC worker — chosen deliberately
// over a module worker (`{type:'module'}`) so offline caching keeps working on EVERY browser that can
// run the app, not only those supporting module service workers (Safari gained them only in 16.4).
//
// Responsibilities, one module each:
//   • sw/cacheManifest.js — the versioned cache identity + the exact app-shell file set + cache ops
//   • sw/integrity.js     — SHA-256 catalog load + per-asset hash verification
//   • sw/precache.js      — the install-time VERIFIED atomic precache (fails loud on an unverifiable build)
//   • sw/runtimeFetch.js  — the runtime fetch strategy (network-first shell + offline cache fallback)
//
// The worker's own sub-scripts are NOT part of the app-shell cache (ASSETS); they are the worker's
// script resources, kept coherent by the browser's SW-update mechanism (the page registers with
// updateViaCache:'none', so they are always revalidated). See README "Architectural Invariants" for the
// WHY behind module-version coherence and the verified precache.
importScripts(
  "./sw/cacheManifest.js",
  "./sw/integrity.js",
  "./sw/precache.js",
  "./sw/runtimeFetch.js",
);

// install: build one coherent, integrity-verified cache, then take over immediately.
self.addEventListener("install", (event) => {
  event.waitUntil(self.swPrecache.installVerifiedShell().then(() => self.skipWaiting()));
});

// activate: purge every non-current cache version, then control open pages.
self.addEventListener("activate", (event) => {
  event.waitUntil(self.swCacheManifest.deleteObsoleteCaches().then(() => self.clients.claim()));
});

// fetch: delegate to the runtime request strategy.
self.addEventListener("fetch", (event) => self.swRuntimeFetch.handleFetch(event));
