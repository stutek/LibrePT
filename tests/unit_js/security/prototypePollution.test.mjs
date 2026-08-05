// tests/unit_js/security/prototypePollution.test.mjs
// Attacker-controlled object KEYS, against the boot path that reassembles IndexedDB records
// (src/data/recordProjections.js).
//
// `record.collection` is data: records come out of IndexedDB, which is fed by imported backup
// files. groupRecordsByCollection is also deliberately open to collection names it does not know,
// so a backup written by a newer build survives a round trip through an older one. Those two facts
// together made the accumulator's prototype load-bearing — on a plain object,
// `grouped["__proto__"]` reads back Object.prototype instead of undefined, the "not seen yet"
// check passes, and the push lands on Object.prototype and throws.
//
// Confirmed against the pre-fix code: `__proto__`, `constructor` and `toString` each raised
// `TypeError: grouped[record.collection].push is not a function`. That is a crash on the BOOT path
// reachable from a merely CORRUPT file, not only a malicious one — denial of service against the
// trainer's own database. Neither ZAP (passive, network-facing) nor the HTML-sink audit (escaping,
// not property lookup) can see this class of bug.

import assert from "node:assert/strict";
import { test } from "node:test";

import { groupRecordsByCollection } from "../../../src/data/recordProjections.js";

// Every one of these is an inherited member of Object.prototype.
const PROTOTYPE_MEMBER_NAMES = [
  "__proto__",
  "constructor",
  "toString",
  "hasOwnProperty",
  "valueOf",
];

test("a record whose collection names a prototype member does not crash the boot path", () => {
  for (const collection of PROTOTYPE_MEMBER_NAMES) {
    const grouped = groupRecordsByCollection([{ id: "r1", collection, schema: 2 }]);
    assert.equal(
      Array.isArray(grouped[collection]),
      true,
      `${collection} did not produce an array bucket`,
    );
    assert.equal(grouped[collection].length, 1);
    assert.equal(grouped[collection][0].id, "r1");
  }
});

test("a hostile collection name cannot reach Object.prototype", () => {
  groupRecordsByCollection([
    { id: "r1", collection: "__proto__", polluted: true, schema: 2 },
    { id: "r2", collection: "constructor", polluted: true, schema: 2 },
  ]);

  assert.equal({}.polluted, undefined, "Object.prototype was polluted");
  assert.equal({}.id, undefined, "Object.prototype was polluted");
  assert.equal(Array.isArray([].polluted), false);
});

test("the fix is not a blocklist — unknown collections are still accepted", () => {
  // A backup from a NEWER build carries collections this one has never heard of; dropping them
  // would make an older build silently destroy data on a round trip. Rejecting hostile NAMES
  // instead of fixing the accumulator would have cost exactly that, so pin it.
  const grouped = groupRecordsByCollection([
    { id: "n1", collection: "futureCollection", schema: 2 },
  ]);
  assert.deepEqual(grouped.futureCollection, [{ id: "n1", schema: 2 }]);
});
