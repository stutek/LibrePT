// tests/unit_js/data/demoOnlyStore.test.mjs
// "Is everything in here the demo?" — the question the header badge asks (TODO §28.9,
// src/data/seedProvenance.js).
//
// The badge names ONE state, so the two candidates had to be ordered. PREVIEW warns that a
// pre-release build may lose data; DEMO says nothing here is yours. Both are true after `?init=demo`
// on a fresh device, and DEMO wins there because there is nothing to lose. The moment the trainer
// creates a record of their own, data loss stops being hypothetical and PREVIEW takes the slot back
// — so the predicate is deliberately "only the demo", not "any demo".

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CLIENTS, DEFAULT_EXERCISES } from "../../../src/data/index.js";
import { isDemoOnlyStore, stampAsSeeded } from "../../../src/data/seedProvenance.js";

const realId = (suffix) => `${"0".repeat(22 - suffix.length)}${suffix}`;

const demoDataset = () => ({
  clients: DEFAULT_CLIENTS.map(stampAsSeeded),
  exercises: DEFAULT_EXERCISES.map(stampAsSeeded),
});

test("a freshly seeded demo store is the demo and nothing else", () => {
  assert.equal(isDemoOnlyStore(demoDataset()), true);
});

test("one record of the trainer's own is enough to stop being a demo", () => {
  const mixed = demoDataset();
  mixed.clients = [...mixed.clients, { id: realId("mine"), name: "Real Person" }];

  // Their work is now in the same evictable place the demo is, and that is the more urgent fact.
  assert.equal(isDemoOnlyStore(mixed), false);
});

test("an empty store is not a demo — there is no demo in it", () => {
  assert.equal(isDemoOnlyStore({ clients: [], exercises: [] }), false);
  assert.equal(isDemoOnlyStore({}), false);
  assert.equal(isDemoOnlyStore(null), false);
});

test("the seeded catalog alone is not a demo — the trainer cleared it and kept the movements", () => {
  // Exactly what demoDataRemoval leaves behind by default, and for the reason it states: 48 seeded
  // movements are a starter catalog, not a stain. A trainer who removed the fake people has
  // finished evaluating, and telling them they are still in a demo would be wrong.
  assert.equal(isDemoOnlyStore({ exercises: DEFAULT_EXERCISES.map(stampAsSeeded) }), false);
});
