// tests/unit_js/controllers/appLifecycleController.test.mjs
// The integrity-retry cleanup on an origin LibrePT shares with LibrePTNotes: it must start LibrePT
// from a clean slate without unregistering the other app's worker or emptying its offline cache.

import assert from "node:assert/strict";
import { test } from "node:test";
import { clearOwnWorkerAndCaches } from "../../../src/controllers/appLifecycleController.js";

function fakeOrigin() {
  const unregistered = [];
  const registration = (scope) => ({ scope, unregister: async () => unregistered.push(scope) });
  const registrations = [
    registration("https://stutek.github.io/LibrePT/"),
    registration("https://stutek.github.io/LibrePTNotes/"),
  ];
  const store = new Set(["librept-v151", "openpt-v9", "libreptnotes-v3"]);
  return {
    unregistered,
    store,
    serviceWorker: {
      getRegistration: async () => registrations[0],
      getRegistrations: async () => registrations,
    },
    caches: { keys: async () => [...store], delete: async (key) => store.delete(key) },
  };
}

test("the retry unregisters only the worker controlling LibrePT", async () => {
  const origin = fakeOrigin();
  await clearOwnWorkerAndCaches(origin);
  assert.deepEqual(origin.unregistered, ["https://stutek.github.io/LibrePT/"]);
});

test("the retry empties LibrePT's caches and keeps LibrePTNotes' cache", async () => {
  const origin = fakeOrigin();
  await clearOwnWorkerAndCaches(origin);
  assert.deepEqual([...origin.store], ["libreptnotes-v3"]);
});
