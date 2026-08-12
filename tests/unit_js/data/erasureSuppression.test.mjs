// tests/unit_js/data/erasureSuppression.test.mjs
// The record of who has been erased (src/data/erasureSuppression.js), which exists for one scenario:
// a trainer erases a client, then restores last week's backup for an unrelated reason, and the
// erasure is silently undone. That is the test this file is really about — the rest guard the
// property that makes the list itself lawful, namely that it describes nobody.
//
// Node's webcrypto is passed in explicitly rather than relying on the module's `globalThis.crypto`
// default: the point of injecting it is that the browser's crypto is not the only implementation,
// and a test that leans on the default would not prove that.

import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";

import { eraseClientInState } from "../../../src/data/clientErasure.js";
import {
  applySuppressions,
  hashClientId,
  mergeSuppressionLists,
  newSuppressionSalt,
  readSuppressionList,
  withSuppressedClient,
} from "../../../src/data/erasureSuppression.js";

const { subtle } = webcrypto;

function backupState() {
  return {
    clients: [
      { id: "c-jane", name: "Jane Doe", email: "jane@example.com", notes: "L4 disc", active: true },
      { id: "c-marko", name: "Marko Novak", email: "marko@example.com", active: true },
    ],
    history: [{ id: "h1", clientId: "c-jane", clientName: "Jane Doe", exercises: [] }],
    planUpdates: [],
    sessions: [],
  };
}

test("the stored entry is a hash, not an identifier anyone could read", async () => {
  const list = await withSuppressedClient(null, "c-jane", subtle, webcrypto);

  assert.equal(list.entries.length, 1);
  assert.match(list.entries[0].hash, /^[0-9a-f]{64}$/);
  assert.match(list.entries[0].salt, /^[0-9a-f]{32}$/);
  // A list of erased people's ids would be a list of erased people — the thing erasure removed.
  assert.ok(!JSON.stringify(list).includes("c-jane"));
});

test("the same id hashes differently under two installs' salts", async () => {
  // So two trainers' lists cannot be cross-matched to learn that they share an erased client.
  const [saltA, saltB] = [newSuppressionSalt(webcrypto), newSuppressionSalt(webcrypto)];

  assert.notEqual(saltA, saltB);
  assert.notEqual(
    await hashClientId("c-jane", saltA, subtle),
    await hashClientId("c-jane", saltB, subtle),
  );
});

test("a repeat entry is indistinguishable from a different one, by design", async () => {
  // Each entry gets its OWN salt, which is what lets two devices' registers be merged. The cost is
  // that duplicates cannot be detected — and that is also the benefit: the list cannot be scanned
  // for repeats, so it reveals nothing about how often an id appears.
  const once = await withSuppressedClient(null, "c-jane", subtle, webcrypto);
  const twice = await withSuppressedClient(once, "c-jane", subtle, webcrypto);

  assert.equal(twice.entries.length, 2);
  assert.notEqual(twice.entries[0].hash, twice.entries[1].hash);
});

test("two devices' registers merge into their union, never replacing each other", async () => {
  // A backup carries the register, and a restore that ADOPTED the file's copy would drop every
  // erasure performed since the file was written — a promise silently broken.
  const deviceA = await withSuppressedClient(null, "c-jane", subtle, webcrypto);
  const deviceB = await withSuppressedClient(null, "c-marko", subtle, webcrypto);
  const merged = mergeSuppressionLists(deviceA, deviceB);

  assert.equal(merged.entries.length, 2);
  // Order-independent and idempotent: an import may run repeatedly, neither side is authoritative.
  assert.deepEqual(
    mergeSuppressionLists(deviceB, deviceA)
      .entries.map((entry) => entry.hash)
      .sort(),
    merged.entries.map((entry) => entry.hash).sort(),
  );
  assert.equal(mergeSuppressionLists(merged, merged).entries.length, 2);
});

test("a merged register erases the clients BOTH devices asked to forget", async () => {
  const merged = mergeSuppressionLists(
    await withSuppressedClient(null, "c-jane", subtle, webcrypto),
    await withSuppressedClient(null, "c-marko", subtle, webcrypto),
  );
  const { reErased } = await applySuppressions(backupState(), merged, subtle);

  assert.deepEqual(reErased.sort(), ["c-jane", "c-marko"]);
});

test("restoring a pre-erasure backup re-erases the client on the way in", async () => {
  // THE test. Without this, an ordinary recovery quietly resurrects someone who asked to be gone.
  const list = await withSuppressedClient(null, "c-jane", subtle, webcrypto);
  const { state, reErased } = await applySuppressions(backupState(), list, subtle);

  const jane = state.clients.find((client) => client.id === "c-jane");
  assert.ok(!jane.name.includes("Jane Doe"), "the restored record must not still name them");
  assert.equal(jane.email, "");
  assert.equal(jane.notes, "");
  assert.equal(state.history[0].clientName, jane.name, "and their history matches, not the backup");
  assert.deepEqual(reErased, ["c-jane"]);

  // Everyone else comes back from the backup untouched.
  assert.equal(state.clients.find((client) => client.id === "c-marko").email, "marko@example.com");
});

test("an empty list is a no-op, not a full sweep", async () => {
  const before = backupState();
  const { state, reErased } = await applySuppressions(before, { entries: [] }, subtle);

  assert.equal(state, before);
  assert.deepEqual(reErased, []);
});

test("an already-erased record survives a second pass unchanged", async () => {
  // Erasure has to be idempotent: the same file can be restored twice, and a suppression pass runs
  // over records that are already fixed points.
  const list = await withSuppressedClient(null, "c-jane", subtle, webcrypto);
  const first = await applySuppressions(backupState(), list, subtle);
  const second = await applySuppressions(first.state, list, subtle);

  assert.deepEqual(
    second.state.clients.find((client) => client.id === "c-jane"),
    first.state.clients.find((client) => client.id === "c-jane"),
  );
});

test("a corrupt stored list reads as empty instead of throwing at boot", () => {
  const storage = { getItem: () => "{not json", setItem: () => {} };

  assert.deepEqual(readSuppressionList(storage), { entries: [] });
});

test("suppression produces the same record the original erasure did", async () => {
  // If the two paths diverged, a restore would produce a differently-erased record than the live
  // one — two shapes of "erased", and no way to tell which a given database holds.
  const direct = eraseClientInState(backupState(), "c-jane", {}).state.clients[0];
  const list = await withSuppressedClient(null, "c-jane", subtle, webcrypto);
  const viaImport = (await applySuppressions(backupState(), list, subtle)).state.clients[0];

  assert.equal(direct.name, viaImport.name);
  assert.equal(direct.email, viaImport.email);
  assert.equal(direct.active, viaImport.active);
});
