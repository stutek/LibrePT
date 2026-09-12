// tests/unit_js/data/seedOrigin.test.mjs
// Which switch wrote a seeded record, and whether test rows have reached the trainer's own database
// (src/data/seedProvenance.js, TODO §46.7).
//
// The origin can only be recorded at the moment the row is written — a demo row and a test row are
// byte-identical afterwards — so these are the assertions standing between "test data escaped" and
// "nobody can tell any more".

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEMO_ORIGIN,
  TEST_ORIGIN,
  escapedTestRecords,
  isSeedRecord,
  seedOriginOf,
  stampAsSeeded,
} from "../../../src/data/seedProvenance.js";

test("a stamped record says where it came from", () => {
  assert.equal(seedOriginOf(stampAsSeeded({ id: "c1" }, DEMO_ORIGIN)), DEMO_ORIGIN);
  assert.equal(seedOriginOf(stampAsSeeded({ id: "c1" }, TEST_ORIGIN)), TEST_ORIGIN);
  assert.equal(seedOriginOf({ id: "mine" }), null);
});

test("stamping copies rather than marks the seed itself", () => {
  const original = { id: "c1" };
  stampAsSeeded(original, TEST_ORIGIN);
  assert.equal(seedOriginOf(original), null, "the module constant must stay unstamped");
});

test("a record from a build before origins is read as a demo, not guessed into an alarm", () => {
  assert.equal(seedOriginOf({ id: "c1", testData: true }), DEMO_ORIGIN);
  assert.equal(seedOriginOf({ id: "c1", seededDemo: true }), DEMO_ORIGIN);
});

test("either origin still counts as seeded, and an explicit false is the trainer's own", () => {
  assert.equal(isSeedRecord("clients", stampAsSeeded({ id: "x" }, TEST_ORIGIN)), true);
  assert.equal(isSeedRecord("clients", stampAsSeeded({ id: "x" }, DEMO_ORIGIN)), true);
  // A record a trainer made that collides with a seed id is theirs, and saying so must be possible.
  assert.equal(isSeedRecord("clients", { id: "c1a9f0e2", testData: false }), false);
});

test("only TEST rows count as an escape, and it says how many and where", () => {
  const state = {
    clients: [{ id: "c1", testData: TEST_ORIGIN }, { id: "mine" }],
    sessions: [{ id: "s1", testData: TEST_ORIGIN }],
    routines: [{ id: "r1", testData: DEMO_ORIGIN }],
  };
  const escaped = escapedTestRecords(state);
  assert.equal(escaped.count, 2);
  assert.deepEqual(escaped.collections, ["clients", "sessions"]);
  // A store holding only the sample gym is not an escape: the trainer asked to see it.
  assert.deepEqual(escapedTestRecords({ routines: [{ id: "r1", testData: DEMO_ORIGIN }] }), {
    count: 0,
    collections: [],
  });
});
