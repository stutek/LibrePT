// tests/unit_js/sw/cacheManifest.test.mjs
// The worker's activate-time purge on an origin LibrePT shares: stutek.github.io also serves
// LibrePTNotes, whose offline cache lives in the same CacheStorage. A deploy of LibrePT must clear
// its own superseded versions and leave every other app's cache where it is.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("../../../src/sw/cacheManifest.js", import.meta.url), "utf-8");

function loadWithCaches(keys) {
  const store = new Set(keys);
  const caches = {
    keys: async () => [...store],
    delete: async (key) => store.delete(key),
  };
  const self = {};
  vm.runInNewContext(SOURCE, { self, caches });
  return { manifest: self.swCacheManifest, store };
}

test("a deploy deletes LibrePT's superseded caches, the OpenPT-era one included", async () => {
  const { manifest, store } = loadWithCaches(["librept-v1", "openpt-v9", "librept-shared-inbox"]);
  store.add(manifest.CACHE_NAME);
  await manifest.deleteObsoleteCaches();
  assert.deepEqual([...store].sort(), [manifest.CACHE_NAME, "librept-shared-inbox"].sort());
});

test("a deploy leaves another app's caches on the shared origin alone", async () => {
  const { manifest, store } = loadWithCaches(["libreptnotes-v3", "some-other-app"]);
  await manifest.deleteObsoleteCaches();
  assert.deepEqual([...store].sort(), ["libreptnotes-v3", "some-other-app"]);
});
