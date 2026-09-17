// tests/unit_js/data/openRecordEdits.test.mjs
// A record open in a form is written as it is typed, but counts only once the form is left
// (TODO §50.2, src/data/openRecordEdits.js). These tests pin what the counts see and what Cancel
// gets back.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  beginRecordEdit,
  endRecordEdit,
  recordBeforeEdit,
  resetOpenRecordEdits,
  withoutOpenEdits,
} from "../../../src/data/openRecordEdits.js";
import { COLLECTIONS } from "../../../src/data/recordProjections.js";
import { countChangedRecords } from "../../../src/data/syncMerge.js";

const synced = { clients: [{ id: "c1", name: "Ana" }], exercises: [], routines: [] };

test("a record being added does not count until its form is left", () => {
  resetOpenRecordEdits();
  const live = { ...synced, clients: [...synced.clients, { id: "c2", name: "Bo" }] };

  beginRecordEdit("clients", "c2", null);
  assert.equal(countChangedRecords(COLLECTIONS, synced, withoutOpenEdits(live)), 0);

  endRecordEdit("clients", "c2");
  assert.equal(countChangedRecords(COLLECTIONS, synced, withoutOpenEdits(live)), 1);
});

test("a record being edited counts as its old self until its form is left", () => {
  resetOpenRecordEdits();
  beginRecordEdit("clients", "c1", synced.clients[0]);
  const live = { ...synced, clients: [{ id: "c1", name: "Ana Novak" }] };

  assert.equal(countChangedRecords(COLLECTIONS, synced, withoutOpenEdits(live)), 0);

  endRecordEdit("clients", "c1");
  assert.equal(countChangedRecords(COLLECTIONS, synced, withoutOpenEdits(live)), 1);
});

test("Cancel gets back a copy of the record as the form found it", () => {
  resetOpenRecordEdits();
  const client = { id: "c1", name: "Ana", weightHistory: [70] };
  beginRecordEdit("clients", "c1", client);
  client.name = "typed";
  client.weightHistory.push(71);

  const before = recordBeforeEdit("clients", "c1");
  assert.deepEqual(before, { id: "c1", name: "Ana", weightHistory: [70] });
  before.name = "changed by the caller";
  assert.equal(recordBeforeEdit("clients", "c1").name, "Ana");
  assert.equal(recordBeforeEdit("exercises", "c1"), null);
});

test("nothing open leaves the state untouched", () => {
  resetOpenRecordEdits();
  assert.equal(withoutOpenEdits(synced), synced);
});
