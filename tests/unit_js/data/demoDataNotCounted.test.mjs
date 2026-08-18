// tests/unit_js/data/demoDataNotCounted.test.mjs
// Demo records are not the trainer's work, so nothing that counts their work counts them
// (TODO §28.5, §28.6).
//
// Two separate surfaces reported the same complaint on 2026-08-18: loading the demo dataset pushed
// the header's ahead counter up (§3.9's "records not on Drive") and tripped the unbacked-data
// warning (§3.8's "this exists in one evictable place"). Both were factually right about the
// records and wrong about the person: seeded people, sessions and messages are a sales demo, and
// telling a trainer to back them up or sync them teaches them that both indicators mean nothing.
//
// The fix is one predicate applied at both call sites, so the tests here are about the predicate
// and about each counter agreeing with it.

import assert from "node:assert/strict";
import { test } from "node:test";
import { assessBackupHealth, fingerprintState } from "../../../src/data/backupHealth.js";
import { DEFAULT_CLIENTS, DEFAULT_EXERCISES, DEFAULT_MESSAGES } from "../../../src/data/index.js";
import { COLLECTIONS } from "../../../src/data/recordProjections.js";
import { stampAsSeeded, withoutSeedRecords } from "../../../src/data/seedProvenance.js";
import { countChangedRecords } from "../../../src/data/syncMerge.js";

// A 22-char base62 id, the shape recordId.js mints — never an 8-char seed id, so these records read
// as the trainer's own under either provenance test.
const realId = (suffix) => `${"0".repeat(22 - suffix.length)}${suffix}`;

/** What the store holds straight after `?init=demo`: every seed record, stamped as seeded. */
const demoDataset = () => ({
  clients: DEFAULT_CLIENTS.map(stampAsSeeded),
  exercises: DEFAULT_EXERCISES.map(stampAsSeeded),
  notifications: DEFAULT_MESSAGES.map(stampAsSeeded),
});

test("a demo dataset contains none of the trainer's own records", () => {
  const mine = withoutSeedRecords(demoDataset());

  for (const collection of COLLECTIONS) {
    assert.deepEqual(mine[collection] ?? [], [], `${collection} should hold nothing of theirs`);
  }
});

test("the trainer's own records survive alongside the demo they are working next to", () => {
  const mixed = demoDataset();
  const realClient = { id: realId("mine"), name: "Real Person" };
  mixed.clients = [...mixed.clients, realClient];

  const mine = withoutSeedRecords(mixed);

  assert.deepEqual(mine.clients, [realClient]);
  assert.deepEqual(mine.exercises, []);
});

test("state fields that are not record collections pass through untouched", () => {
  // The result is fed to counters that read a whole state, so it has to stay state-shaped.
  const mine = withoutSeedRecords({ ...demoDataset(), lang: "sl", theme: "dark" });

  assert.equal(mine.lang, "sl");
  assert.equal(mine.theme, "dark");
});

test("loading the demo adds nothing to the ahead counter", () => {
  // getAheadCount() diffs the last-synced ancestor (empty here — never synced) against the store.
  const ahead = (state) => countChangedRecords(COLLECTIONS, {}, withoutSeedRecords(state));

  assert.equal(ahead(demoDataset()), 0);

  const withRealWork = demoDataset();
  withRealWork.clients = [...withRealWork.clients, { id: realId("mine"), name: "Real Person" }];
  // One real client is one real change — the demo around it is still not counted.
  assert.equal(ahead(withRealWork), 1);
});

test("a backup taken while the demo was loaded does not later report it as work", () => {
  // The stored fingerprint is `{id, h}` per record, so a backup written before this rule shipped
  // still carries the demo — and the seed id set classifies it without needing the stamp.
  const backedUpWithDemo = fingerprintState(demoDataset());

  const health = assessBackupHealth({
    history: { at: Date.now(), kind: "file", fingerprint: withoutSeedRecords(backedUpWithDemo) },
    currentFingerprint: fingerprintState(withoutSeedRecords(demoDataset())),
  });

  // Neither side holds anything of theirs, so there is nothing pending — not 48 phantom removals.
  assert.equal(health.unbackedCount, 0);
  assert.equal(health.level, "none");
});

test("the demo dataset never asks to be backed up, however large it is", () => {
  // Comfortably past UNBACKED_CHANGE_THRESHOLD on record count alone: the seeded catalog is 48
  // exercises, which is exactly why this fired.
  const health = assessBackupHealth({
    history: null,
    currentFingerprint: fingerprintState(withoutSeedRecords(demoDataset())),
    durability: { atRisk: true },
  });

  assert.equal(health.level, "none");
  assert.equal(health.unbackedCount, 0);
});
