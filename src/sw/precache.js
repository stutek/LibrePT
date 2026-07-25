// src/sw/precache.js — the install-time VERIFIED atomic precache. Single responsibility: populate the
// cache with the WHOLE app shell — each asset fetched and integrity-verified — as one all-or-nothing
// unit, and surface a hard, visible failure (never a silent skip) when the build can't be verified.
// Loaded via importScripts after cacheManifest + integrity; exposes its API on self.swPrecache.
self.swPrecache = (() => {
  // Fresh network copy in production (never hash a stale HTTP-cached body against the new catalog); on
  // localhost reuse the page-load-warmed cache so install stays light for dev + the e2e suite.
  const IS_LOCAL_DEV = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);

  async function fetchVerifiedIntoCache(cache, asset, catalog) {
    const response = await fetch(asset, IS_LOCAL_DEV ? undefined : { cache: "no-store" });
    if (!response.ok) throw new Error(`Precache fetch failed (${response.status}) for ${asset}`);
    await self.swIntegrity.assertMatchesCatalog(catalog, asset, response);
    await cache.put(asset, response);
  }

  // Tell any open window the install failed verification, so the app can show the integrity error page.
  // includeUncontrolled reaches the window that triggered this update even though we don't control it yet.
  async function postIntegrityError(reason, detail) {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    for (const client of clients) {
      client.postMessage({ type: "INTEGRITY_ERROR", reason, detail });
    }
  }

  // Verified atomic precache: fetch + verify + cache the whole shell as one unit. Any rejection aborts
  // the install so nothing partial/version-skewed lands. A missing/unreachable catalog is a hard
  // failure (never a skip); both it and a hash mismatch message the page so it can show the error page.
  async function installVerifiedShell() {
    const { SHELL_ASSETS, EXTERNAL_ASSETS } = self.swCacheManifest;
    const cache = await self.swCacheManifest.openAppCache();
    const catalog = await self.swIntegrity.loadCatalog();
    if (!catalog) {
      await postIntegrityError("missing-catalog");
      throw new Error(
        "Integrity catalog missing or unreachable — run the full build (integrity.json).",
      );
    }
    try {
      await Promise.all(SHELL_ASSETS.map((asset) => fetchVerifiedIntoCache(cache, asset, catalog)));
    } catch (err) {
      await postIntegrityError("mismatch", err?.message ? err.message : String(err));
      throw err;
    }
    // Third-party libs (Font Awesome CDN) stay best-effort and are not integrity-verified here
    // (cross-origin, pinned immutable URLs); a blocked/offline fetch must not fail the shell install.
    await Promise.allSettled(EXTERNAL_ASSETS.map((u) => cache.add(u).catch(() => {})));
  }

  return { installVerifiedShell };
})();
