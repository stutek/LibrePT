// tests/unit_js/data/unsavedStateJournal.test.mjs
// The copy a closing page keeps when its save has not landed (src/data/unsavedStateJournal.js).
// What the next start depends on: the copy comes back whole, it belongs to the workspace that wrote
// it, and a store that refuses — full, or unreadable — never stops the page from closing.

import assert from "node:assert/strict";
import { test } from "node:test";
import { clearWorkspaceKeys } from "../../../src/data/storageNamespace.js";
import * as journal from "../../../src/data/unsavedStateJournal.js";
import { SANDBOX, WORKING, setActiveWorkspace } from "../../../src/data/workspace.js";

// node:test has no DOM; the module only ever touches these three methods.
function withLocalStorage({ refuseWrites = false } = {}) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      if (refuseWrites) throw new Error("QuotaExceededError");
      store.set(k, String(v));
    },
    removeItem: (k) => store.delete(k),
  };
  return store;
}

const STATE = { clients: [{ id: "c1", name: "Jane" }], planUpdates: [{ id: "u1", tag: "Pain" }] };

test("a kept state comes back whole at the next start", () => {
  withLocalStorage();
  setActiveWorkspace(WORKING);
  assert.equal(journal.unsavedState(), null);
  assert.equal(journal.keepUnsavedState(STATE), true);
  assert.deepEqual(journal.unsavedState(), STATE);
});

test("once forgotten, nothing comes back", () => {
  withLocalStorage();
  setActiveWorkspace(WORKING);
  journal.keepUnsavedState(STATE);
  journal.forgetUnsavedState();
  assert.equal(journal.unsavedState(), null);
});

test("the sandbox's copy is never the trainer's", () => {
  withLocalStorage();
  setActiveWorkspace(SANDBOX);
  journal.keepUnsavedState(STATE);
  setActiveWorkspace(WORKING);
  assert.equal(journal.unsavedState(), null);
});

test("a full store does not stop the page from closing", () => {
  withLocalStorage({ refuseWrites: true });
  setActiveWorkspace(WORKING);
  assert.equal(journal.keepUnsavedState(STATE), false);
});

test("an unreadable copy is no copy", () => {
  const store = withLocalStorage();
  setActiveWorkspace(WORKING);
  store.set(journal.UNSAVED_STATE_KEY, "{not json");
  assert.equal(journal.unsavedState(), null);
});

test("a sandbox reset clears the copy with the rest of the sandbox", () => {
  withLocalStorage();
  setActiveWorkspace(SANDBOX);
  journal.keepUnsavedState(STATE);
  clearWorkspaceKeys(SANDBOX);
  assert.equal(journal.unsavedState(), null);
});
