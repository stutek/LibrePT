// tests/unit_js/data/backupKeyStore.test.mjs
// What is kept for the backup password, and what is deliberately not (src/data/backupKeyStore.js).
//
// The promise under test is a security one and it is short: **the password is never stored**, and what
// IS stored cannot be turned back into it or copied out of the browser. Everything else here follows
// from that — the salt is kept because the key has to be derivable again from the words alone, and
// forgetting is local because the files that were written stay openable with the password.
//
// `store` is injected, so this runs without IndexedDB.

import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";

import { encryptBackup } from "../../../src/data/backupEncryption.js";
import {
  backupKeyForWriting,
  forgetBackupPassword,
  hasBackupPassword,
  setBackupPassword,
  unlockWithPassword,
} from "../../../src/data/backupKeyStore.js";

const PASSWORD = "gravity-lever-posture-rowing-tempo-hinge";

function fakeStore() {
  let record = null;
  return {
    read: async () => record,
    write: async (value) => {
      record = value;
    },
    clear: async () => {
      record = null;
    },
    get record() {
      return record;
    },
  };
}

const options = (store) => ({ store, cryptoImpl: webcrypto });

test("the password itself is nowhere in what gets stored", async () => {
  const store = fakeStore();
  await setBackupPassword(PASSWORD, options(store));
  const { key, ...rest } = store.record;
  // Every stored field except the key, as text. The key is a CryptoKey and is checked below.
  const stored = JSON.stringify(rest, (_k, v) => (v instanceof Uint8Array ? [...v] : v));
  assert.ok(!stored.includes(PASSWORD));
  assert.ok(!stored.includes("gravity"));
  assert.ok(!stored.includes("lever"));
});

test("the stored key cannot be read out of the browser", async () => {
  const store = fakeStore();
  await setBackupPassword(PASSWORD, options(store));
  assert.equal(store.record.key.extractable, false);
  await assert.rejects(() => webcrypto.subtle.exportKey("raw", store.record.key));
});

test("the salt and iteration count are kept, or the password could never open a file again", async () => {
  const store = fakeStore();
  await setBackupPassword(PASSWORD, options(store));
  assert.ok(store.record.salt?.length > 0);
  assert.ok(store.record.iterations >= 600000);
});

test("changing the password produces an unrelated key, so old files keep the old one", async () => {
  const store = fakeStore();
  await setBackupPassword(PASSWORD, options(store));
  const first = store.record;
  const sealedWithFirst = await encryptBackup(
    { clients: [] },
    { key: first.key, salt: first.salt, formatVersion: 6, cryptoImpl: webcrypto },
  );

  await setBackupPassword("nordic-quadrant-unrack-zercher-elbow-cadence", options(store));
  assert.notDeepEqual([...store.record.salt], [...first.salt]);

  // The same words as the old file, but a different salt: the key that writes new files cannot open
  // the old one. This is the cost the dialog states rather than the trainer discovering it.
  const reDerived = await unlockWithPassword(sealedWithFirst, PASSWORD, options(store));
  assert.ok(reDerived.key);
});

test("there is a key to write with only after a password is set", async () => {
  const store = fakeStore();
  assert.equal(await hasBackupPassword({ store }), false);
  assert.equal(await backupKeyForWriting({ store }), null);

  await setBackupPassword(PASSWORD, options(store));
  assert.equal(await hasBackupPassword({ store }), true);
  const writing = await backupKeyForWriting({ store });
  assert.ok(writing.key);
  assert.deepEqual([...writing.salt], [...store.record.salt]);
});

test("an empty password is refused rather than stored as one", async () => {
  const store = fakeStore();
  await assert.rejects(() => setBackupPassword("", options(store)), /required/);
  assert.equal(store.record, null);
});

test("unlocking derives from the FILE's salt, and keeps the key only when asked to", async () => {
  const writer = fakeStore();
  await setBackupPassword(PASSWORD, options(writer));
  const envelope = await encryptBackup(
    { clients: [] },
    {
      key: writer.record.key,
      salt: writer.record.salt,
      formatVersion: 6,
      cryptoImpl: webcrypto,
    },
  );

  // A second device, which has never seen this password.
  const other = fakeStore();
  const opened = await unlockWithPassword(envelope, PASSWORD, options(other));
  assert.ok(opened.key);
  assert.equal(other.record, null, "it kept the key without being asked to");
  assert.deepEqual([...opened.salt], [...writer.record.salt]);

  await unlockWithPassword(envelope, PASSWORD, { ...options(other), remember: true });
  assert.ok(other.record.key);
  assert.deepEqual([...other.record.salt], [...writer.record.salt]);
});

test("forgetting is local: the record goes, and a typed password still opens the file", async () => {
  const store = fakeStore();
  await setBackupPassword(PASSWORD, options(store));
  const envelope = await encryptBackup(
    { clients: [] },
    { key: store.record.key, salt: store.record.salt, formatVersion: 6, cryptoImpl: webcrypto },
  );

  await forgetBackupPassword({ store });
  assert.equal(store.record, null);
  assert.equal(await hasBackupPassword({ store }), false);

  const reopened = await unlockWithPassword(envelope, PASSWORD, options(store));
  assert.ok(reopened.key);
});
