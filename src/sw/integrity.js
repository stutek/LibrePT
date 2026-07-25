// src/sw/integrity.js — verify a downloaded shell asset against the SHA-256 integrity catalog.
// Single responsibility: load the catalog, and decide whether a response's bytes match their catalogued
// hash. Knows nothing about caching or install orchestration. Loaded via importScripts into the classic
// service worker; exposes its API on self.swIntegrity.
//
// The catalog (integrity.json) is a hash of every shell file keyed by its served path: in production the
// build artifact from build.generate_integrity_catalog; in local dev computed live from src/ by
// deploy/local_http_server.py — so verification runs identically in dev, e2e, and production. It is
// NEVER optional: precache treats an absent/unreachable catalog as a hard failure, never a silent skip
// (a check that can quietly disable itself is exactly how a bad build reaches production). See README
// "Architectural Invariants".
self.swIntegrity = (() => {
  // Fetched no-store so an update always verifies against the CURRENT catalog. Runs only at install
  // time (a new sw.js = a new deploy), which already needs the network — so it adds no offline
  // dependency: an already-installed app never re-fetches this and runs fully from cache.
  async function loadCatalog() {
    try {
      const res = await fetch("./integrity.json", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.files ? data.files : null;
    } catch (err) {
      return null; // unreachable / unparseable — install treats this as a hard error, never a skip
    }
  }

  // Map a SHELL_ASSETS entry ("./", "./app.js", "./fonts/x.woff2") to its catalog key (the served,
  // root-relative path the catalog hashed it under). The app shell "./" is served as index.html.
  function catalogKeyFor(asset) {
    const key = asset.replace(/^\.\//, "");
    return key === "" ? "index.html" : key;
  }

  async function sha256Hex(buffer) {
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Throw if `response` does not match its catalogued hash (or has no catalog entry). The caller aborts
  // the atomic install on any throw, so a corrupted download OR a stale file from a different build
  // (a version skew) can never be cached alongside the fresh ones.
  async function assertMatchesCatalog(catalog, asset, response) {
    const expected = catalog[catalogKeyFor(asset)];
    if (!expected) throw new Error(`No integrity hash catalogued for ${asset}`);
    const actual = await sha256Hex(await response.clone().arrayBuffer());
    if (actual !== expected) {
      throw new Error(`Integrity mismatch for ${asset} (expected ${expected}, got ${actual})`);
    }
  }

  return { loadCatalog, assertMatchesCatalog };
})();
