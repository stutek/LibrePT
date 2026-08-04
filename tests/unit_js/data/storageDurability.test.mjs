// tests/unit_js/data/storageDurability.test.mjs
// Storage durability reporting (TODO §18.6, §18.8): pure — every test here injects its own fake
// `storage` object, so none of it needs a real browser. The one test that doesn't (asserting the
// REAL Storage API reports a usable quota) stays in tests/e2e/test_storage_durability.py.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MINIMUM_WORKABLE_QUOTA_BYTES,
  assessDurability,
  requestPersistentStorage,
} from "../../../src/data/storageDurability.js";

test("persistence is requested and a prior grant short-circuits", async () => {
  let persistCalls = 0;
  const granted = await requestPersistentStorage({
    storage: {
      persisted: async () => true,
      persist: async () => {
        persistCalls += 1;
        return true;
      },
    },
  });
  const asked = await requestPersistentStorage({
    storage: {
      persisted: async () => false,
      persist: async () => {
        persistCalls += 1;
        return true;
      },
    },
  });
  const refused = await requestPersistentStorage({
    storage: { persisted: async () => false, persist: async () => false },
  });
  const unsupported = await requestPersistentStorage({ storage: {} });

  // An origin already exempt from eviction must not re-prompt.
  assert.deepEqual(granted, { supported: true, persisted: true, alreadyGranted: true });
  assert.equal(asked.persisted, true);
  // A refusal is the normal case until the app is installed — it must resolve, not throw.
  assert.deepEqual(refused, { supported: true, persisted: false });
  assert.deepEqual(unsupported, { supported: false, persisted: false });
  assert.equal(persistCalls, 1);
});

test("a throwing storage API is treated as a refusal", async () => {
  const r = await requestPersistentStorage({
    storage: {
      persisted: async () => {
        throw new Error("private mode");
      },
      persist: async () => {
        throw new Error("private mode");
      },
    },
  });
  // Some private modes throw rather than returning false; that is the same answer.
  assert.deepEqual(r, { supported: true, persisted: false });
});

test("durability reports the consequence that tripped it", async () => {
  const GB = 1024 * 1024 * 1024;
  const assess = (estimate, persisted) =>
    assessDurability({
      storage: { estimate: async () => estimate, persisted: async () => persisted },
    });

  const healthy = await assess({ quota: 2 * GB, usage: 1e6 }, true);
  assert.equal(healthy.atRisk, false);
  assert.equal(healthy.durable, true);
  assert.equal(healthy.reason, null);

  // A persisted origin with no room to grow is still a device that will start failing writes, so
  // quota is checked BEFORE persistence — saying "your storage is protected" there would be a lie.
  const tiny = await assess({ quota: 5 * 1024 * 1024, usage: 0 }, true);
  assert.equal(tiny.atRisk, true);
  assert.equal(tiny.reason, "tiny-quota");
  assert.equal(tiny.durable, true);

  // Works today, but the browser is free to reclaim it — the Safari seven-day case.
  const notPersisted = await assess({ quota: 2 * GB, usage: 1e6 }, false);
  assert.equal(notPersisted.atRisk, true);
  assert.equal(notPersisted.reason, "not-persisted");

  const noApi = await assessDurability({ storage: {} });
  assert.equal(noApi.atRisk, true);
  assert.equal(noApi.reason, "no-storage-api");

  // A very busy PT reaches ~16.6 MiB/yr in one bucket (§18.6), so the floor must clear that with
  // room for the star write's multiple.
  assert.equal(MINIMUM_WORKABLE_QUOTA_BYTES, 50 * 1024 * 1024);
});
