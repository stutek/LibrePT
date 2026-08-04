// tests/unit_js/data/recordReferences.test.mjs
// The cross-collection reference graph (TODO §18.5) must be acyclic: migration replay order means
// correct order of foreign-key availability, so a convenience back-reference added later could
// otherwise deadlock migration or silently pick an arbitrary order — caught here instead of by a
// trainer. §17.4 (saving a past session as a routine template) is flagged as the first realistic
// cycle risk.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/data/recordReferences.js";

test("the declared reference graph has no cycles", () => {
  const cycle = m.findCycle();
  assert.equal(cycle, null, `cyclic reference graph: ${cycle}`);
});

test("a cycle is actually detected not just never triggered", () => {
  // A graph that always returns "acyclic" because it never runs the walk correctly would pass
  // the test above for the wrong reason. Prove the detector actually catches a real cycle.
  const selfLoop = { a: { ownerId: "a" } };
  const twoCycle = { a: { bId: "b" }, b: { aId: "a" } };
  const indirect = { a: { bId: "b" }, b: { cId: "c" }, c: { aId: "a" } };
  const clean = { history: { clientId: "clients" }, planUpdates: { clientId: "clients" } };

  assert.notEqual(m.findCycle(selfLoop), null);
  assert.notEqual(m.findCycle(twoCycle), null);
  assert.notEqual(m.findCycle(indirect), null);
  assert.equal(m.isAcyclic(clean), true);
});
