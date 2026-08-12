// tests/unit_js/data/erasureRegisterSync.test.mjs
// The erasure register across devices and across wipes (src/data/erasureRegisterSync.js).
//
// Drive is injected as four stub functions, so this pins the MERGE SEMANTICS — which is where the
// correctness lives — without a network, a token, or a browser. The property being defended is that
// the register is a grow-only set: union everywhere, so two devices offline at once converge, and no
// pass can ever shrink it. A register that can shrink is a promise that can be un-made.

import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";

import { syncErasureRegister } from "../../../src/data/erasureRegisterSync.js";
import {
  registerFromErasedClients,
  registerHealth,
  withSuppressedClient,
} from "../../../src/data/erasureSuppression.js";

const { subtle } = webcrypto;

// A stub Drive holding at most one register file, recording what was written to it.
function fakeDrive(initialContent = null) {
  const drive = {
    content: initialContent,
    created: 0,
    updated: 0,
    findFile: async () => (drive.content ? { id: "file-1" } : null),
    downloadFile: async () => drive.content,
    createFile: async (_token, content) => {
      drive.created += 1;
      drive.content = content;
      return { id: "file-1" };
    },
    updateFile: async (_token, _id, content) => {
      drive.updated += 1;
      drive.content = content;
    },
  };
  return drive;
}

const NO_CLIENTS = { clients: [] };

test("the first sync creates the file from this device's register", async () => {
  const drive = fakeDrive();
  const localList = await withSuppressedClient(null, "c-jane", subtle, webcrypto);

  const result = await syncErasureRegister("token", {
    localList,
    state: NO_CLIENTS,
    subtle,
    drive,
  });

  assert.equal(drive.created, 1);
  assert.equal(result.list.entries.length, 1);
  // The high-water count travels with the file so a later shortfall is detectable.
  assert.equal(drive.content.highWaterCount, 1);
});

test("two devices' erasures both survive — neither overwrites the other", async () => {
  // The whole point. Phone erases Jane, tablet erases Marko, both sync: both are erased everywhere.
  const phone = await withSuppressedClient(null, "c-jane", subtle, webcrypto);
  const tablet = await withSuppressedClient(null, "c-marko", subtle, webcrypto);
  const drive = fakeDrive();

  await syncErasureRegister("token", { localList: phone, state: NO_CLIENTS, subtle, drive });
  const second = await syncErasureRegister("token", {
    localList: tablet,
    state: NO_CLIENTS,
    subtle,
    drive,
  });

  assert.equal(second.list.entries.length, 2);
  assert.equal(drive.content.entries.length, 2);
});

test("a device that lost its register gets it back from Drive", async () => {
  // Site data cleared, or a fresh install on a new phone: local is empty, Drive is not.
  const drive = fakeDrive();
  await syncErasureRegister("token", {
    localList: await withSuppressedClient(null, "c-jane", subtle, webcrypto),
    state: NO_CLIENTS,
    subtle,
    drive,
  });

  const wiped = await syncErasureRegister("token", {
    localList: { entries: [] },
    state: NO_CLIENTS,
    subtle,
    drive,
  });

  assert.equal(wiped.list.entries.length, 1);
  // Nothing was pushed: the union already equalled the remote copy, so a quiet sync leaves the file
  // alone rather than rewriting it on every pass.
  assert.equal(wiped.pushed, false);
});

test("the register heals from the erased records themselves", async () => {
  // No local register, no Drive file — but the anonymised client in the database is its own proof
  // that a request was honoured, so the entry is re-derived rather than lost.
  const drive = fakeDrive();
  const state = {
    clients: [
      { id: "c-jane", name: "Client #C-JANE", erasure: { erasedAt: "2026-08-01T00:00:00.000Z" } },
      { id: "c-marko", name: "Marko Novak" },
    ],
  };

  const result = await syncErasureRegister("token", {
    localList: { entries: [] },
    state,
    subtle,
    drive,
  });

  assert.equal(result.list.entries.length, 1);
  assert.equal(drive.created, 1);
});

test("syncing twice changes nothing the second time", async () => {
  // Idempotent by construction — a union with itself. Without this, every poll would rewrite the
  // Drive file and burn a request for no change.
  const drive = fakeDrive();
  const localList = await withSuppressedClient(null, "c-jane", subtle, webcrypto);

  await syncErasureRegister("token", { localList, state: NO_CLIENTS, subtle, drive });
  const writesAfterFirst = drive.created + drive.updated;
  const again = await syncErasureRegister("token", {
    localList,
    state: NO_CLIENTS,
    subtle,
    drive,
  });

  assert.equal(drive.created + drive.updated, writesAfterFirst);
  assert.equal(again.pushed, false);
  assert.equal(again.list.entries.length, 1);
});

test("a remote register never shrinks, whatever this device sends", async () => {
  const drive = fakeDrive();
  await syncErasureRegister("token", {
    localList: await withSuppressedClient(null, "c-jane", subtle, webcrypto),
    state: NO_CLIENTS,
    subtle,
    drive,
  });

  // A device arriving with an EMPTY register — the shape a wipe leaves behind — must not be able to
  // clear the account's copy. Grow-only means the union can only ever be >= what was there.
  await syncErasureRegister("token", { localList: null, state: NO_CLIENTS, subtle, drive });

  assert.equal(drive.content.entries.length, 1);
});

test("registerHealth reports a shortfall rather than accusing anyone", async () => {
  const list = await withSuppressedClient(null, "c-jane", subtle, webcrypto);

  assert.deepEqual(registerHealth(list, 1), { count: 1, highWater: 1, lost: 0, healthy: true });
  // Two entries were seen by this account, one is here: a loss to be healed by a sync, not proof of
  // tampering — the person holding the device is the one legally responsible for it.
  assert.deepEqual(registerHealth(list, 2), { count: 1, highWater: 2, lost: 1, healthy: false });
  // The high-water can only rise.
  assert.equal(registerHealth(list, 0).highWater, 1);
});

test("re-deriving from records is idempotent per client, not per call", async () => {
  const state = {
    clients: [
      { id: "c-jane", erasure: { erasedAt: "2026-08-01T00:00:00.000Z" } },
      { id: "c-ana", erasure: { erasedAt: "2026-08-02T00:00:00.000Z" } },
      { id: "c-marko" },
    ],
  };

  const rebuilt = await registerFromErasedClients(state, subtle, webcrypto);

  assert.equal(rebuilt.entries.length, 2);
});
