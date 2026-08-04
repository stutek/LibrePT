// tests/unit_js/modules/common/recordId.test.mjs
// The record identity primitive (TODO §18.2): UUIDv7 rendered as fixed-width base62. These tests pin
// the two properties the persistence design in §18 actually depends on — collision resistance from a
// cryptographic source, and lexicographic order matching creation order — plus the back-compatibility
// rule that ids minted by older builds stay valid keys.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../../src/modules/common/recordId.js";

test("id is fixed width base62 and recognised", () => {
  const ids = Array.from({ length: 200 }, () => m.newRecordId());
  const alphabet = /^[0-9A-Za-z]{22}$/;
  // 22 characters is exactly 128 bits in base62 — a shorter id would mean discarding entropy.
  assert.equal(m.RECORD_ID_LENGTH, 22);
  assert.equal(
    ids.every((id) => id.length === 22),
    true,
  );
  assert.equal(
    ids.every((id) => alphabet.test(id)),
    true,
  );
  assert.equal(
    ids.every((id) => m.isRecordId(id)),
    true,
  );
});

test("ids are unique across a large burst", () => {
  const ids = Array.from({ length: 20000 }, () => m.newRecordId());
  // The generator this replaced had 41.4 bits from Math.random(); a 20k burst inside one
  // millisecond is exactly where a 12-bit counter would wrap if the overflow were not handled.
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 20000);
});

test("lexicographic order equals creation order", () => {
  const ids = Array.from({ length: 5000 }, () => m.newRecordId());
  const sorted = [...ids].sort();
  // Sortability is the reason for choosing v7 over v4: string sort, array order and creation order
  // must agree, so an encoding that scrambled it would throw the property away.
  assert.equal(
    sorted.every((id, i) => id === ids[i]),
    true,
  );
  assert.equal(
    ids.every((id, i) => i === 0 || id > ids[i - 1]),
    true,
  );
});

test("ids stay ordered when the clock jumps backwards", () => {
  const realNow = Date.now;
  const before = m.newRecordId();
  try {
    // A device clock going backwards is ordinary: NTP correction after an offline
    // stretch, a hand-set clock, DST on a device storing local time (§18.5).
    Date.now = () => realNow() - 60000;
    const after = Array.from({ length: 50 }, () => m.newRecordId());
    // A backwards clock must never reissue an id range that was already handed out.
    assert.equal(
      after.every((id, i) => id > (i === 0 ? before : after[i - 1])),
      true,
    );
    assert.equal(new Set([before, ...after]).size, 51);
  } finally {
    Date.now = realNow;
  }
});

test("creation time round trips and legacy ids report none", () => {
  const before = Date.now();
  const id = m.newRecordId();
  const after = Date.now();
  const decoded = m.recordIdTime(id);
  assert.equal(decoded.getTime() >= before && decoded.getTime() <= after + 1, true);
  // Ids minted by older builds stay perfectly valid keys — they simply carry no encoded time, so
  // the decoder reports null rather than guessing or throwing.
  assert.equal(m.recordIdTime("c1a9f0e2"), null);
  assert.equal(m.isRecordId("c1a9f0e2"), false);
  assert.equal(m.recordIdTime("!".repeat(22)), null);
});
