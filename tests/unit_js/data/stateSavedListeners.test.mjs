// tests/unit_js/data/stateSavedListeners.test.mjs
// `onStateSaved` notifies EVERY registered listener, not only the most recent one.
//
// Written after that was false. The seam stored a single listener in one slot, which was
// indistinguishable from correct while the ahead/behind badge was its only consumer. TODO §3.8's
// unbacked-data warning registered a second, silently unsubscribed the first, and the sync badge
// stopped updating on every write — showing whatever it had last rendered. Nothing threw; a
// subscribe call simply did not subscribe, and the only symptom was a number that had been right a
// moment ago.
//
// A DOM-free test because the property has nothing to do with badges: it is that a publish/subscribe
// seam does not lose subscribers.

import assert from "node:assert/strict";
import { test } from "node:test";
import "../helpers/webStorageStub.mjs";
import { onStateSaved, saveToLocalStorage } from "../../../src/data/stateStore.js";

test("every registered listener is notified, not just the last one", () => {
  const fired = [];
  onStateSaved(() => fired.push("first"));
  onStateSaved(() => fired.push("second"));

  saveToLocalStorage();

  assert.deepEqual(
    fired,
    ["first", "second"],
    "a second subscriber must not replace the first — that is how the sync badge went stale",
  );
});
