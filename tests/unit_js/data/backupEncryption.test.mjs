// tests/unit_js/data/backupEncryption.test.mjs
// The encrypted container a backup travels in (src/data/backupEncryption.js).
//
// What these tests are about: a backup file is the one artifact that leaves the phone, so the
// promises worth pinning are what a person who OBTAINS the file can learn from it, and that a trainer
// on a new phone can still open it with nothing but the password.
//
// `webcrypto` stands in for the browser's `crypto`, which is what every function here takes as an
// injected dependency.

import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";

import {
  AES_GCM_CONTAINER,
  decryptBackup,
  deriveKeyForEnvelope,
  encryptBackup,
  isEncryptedBackup,
} from "../../../src/data/backupEncryption.js";
import { deriveAesKey, randomSalt } from "../../../src/data/passphraseKey.js";

const PASSWORD = "tempo-hinge-sprint-kettle-nordic-warmup";
const FORMAT = 6;

// A payload with the two things a leak would actually expose: a person's name and their health note.
const PAYLOAD = {
  formatVersion: 5,
  schemaVersion: 5,
  clients: [{ id: "c1", name: "Jana Novak", notes: "L4 disc herniation" }],
  exercises: [],
};

async function freshKey() {
  const salt = randomSalt(webcrypto);
  const key = await deriveAesKey(PASSWORD, salt, { cryptoImpl: webcrypto });
  return { key, salt };
}

async function sealed() {
  const { key, salt } = await freshKey();
  const envelope = await encryptBackup(PAYLOAD, {
    key,
    salt,
    formatVersion: FORMAT,
    cryptoImpl: webcrypto,
  });
  return { envelope, key };
}

test("a sealed backup comes back exactly as it went in", async () => {
  const { envelope, key } = await sealed();
  assert.deepEqual(await decryptBackup(envelope, { key, cryptoImpl: webcrypto }), PAYLOAD);
});

test("nothing about the trainer's clients is readable in the file", async () => {
  const { envelope } = await sealed();
  const onTheWire = JSON.stringify(envelope);
  assert.ok(!onTheWire.includes("Jana"), "the client's name is in the file");
  assert.ok(!onTheWire.includes("herniation"), "the client's health note is in the file");
  // Not even how many clients there are, or which collections exist.
  assert.ok(!onTheWire.includes("clients"), "the collection names are in the file");
});

test("the version is readable without the password, so an unopenable file can still be refused", async () => {
  const { envelope } = await sealed();
  assert.equal(envelope.formatVersion, FORMAT);
  assert.equal(envelope.container, AES_GCM_CONTAINER);
  assert.ok(isEncryptedBackup(envelope));
});

test("the record schema is NOT stated outside the ciphertext, so it cannot be altered", async () => {
  const { envelope } = await sealed();
  assert.equal(envelope.schemaVersion, undefined);
});

test("a password typed on another device opens the file", async () => {
  const { envelope } = await sealed();
  // Nothing from the writing device is carried over — only the words and the file itself.
  const { key } = await deriveKeyForEnvelope(envelope, PASSWORD, { cryptoImpl: webcrypto });
  assert.deepEqual(await decryptBackup(envelope, { key, cryptoImpl: webcrypto }), PAYLOAD);
});

test("a key derived here cannot be read out of the browser", async () => {
  const { key } = await freshKey();
  assert.equal(key.extractable, false);
  await assert.rejects(() => webcrypto.subtle.exportKey("raw", key));
});

test("the wrong password does not open it, and says so without blaming the typing", async () => {
  const { envelope } = await sealed();
  const { key } = await deriveKeyForEnvelope(envelope, "tempo-hinge-sprint-kettle-nordic-tempo", {
    cryptoImpl: webcrypto,
  });
  await assert.rejects(
    () => decryptBackup(envelope, { key, cryptoImpl: webcrypto }),
    /wrong backup password, or the file was altered/,
  );
});

test("an altered file does not decrypt to something plausible — it does not decrypt at all", async () => {
  const { envelope, key } = await sealed();
  const bytes = Buffer.from(envelope.ciphertext, "base64");
  bytes[10] ^= 0xff;
  const tampered = { ...envelope, ciphertext: bytes.toString("base64") };
  await assert.rejects(() => decryptBackup(tampered, { key, cryptoImpl: webcrypto }));
});

test("two backups of the same data never reuse an IV", async () => {
  const { key, salt } = await freshKey();
  const seal = () =>
    encryptBackup(PAYLOAD, { key, salt, formatVersion: FORMAT, cryptoImpl: webcrypto });
  const [first, second] = [await seal(), await seal()];
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
});

test("a file written at a lower iteration count still opens at that count", async () => {
  const salt = randomSalt(webcrypto);
  const key = await deriveAesKey(PASSWORD, salt, { iterations: 1000, cryptoImpl: webcrypto });
  const envelope = await encryptBackup(PAYLOAD, {
    key,
    salt,
    iterations: 1000,
    formatVersion: FORMAT,
    cryptoImpl: webcrypto,
  });
  assert.equal(envelope.kdf.iterations, 1000);
  const reopened = await deriveKeyForEnvelope(envelope, PASSWORD, { cryptoImpl: webcrypto });
  assert.deepEqual(
    await decryptBackup(envelope, { key: reopened.key, cryptoImpl: webcrypto }),
    PAYLOAD,
  );
});

test("writing without a key or without its salt is refused rather than written unencrypted", async () => {
  const { key, salt } = await freshKey();
  await assert.rejects(() => encryptBackup(PAYLOAD, { salt, formatVersion: FORMAT }), /key/);
  await assert.rejects(() => encryptBackup(PAYLOAD, { key, formatVersion: FORMAT }), /salt/);
  await assert.rejects(() => encryptBackup(PAYLOAD, { key, salt }), /format version/);
});

test("a plain backup is not mistaken for an encrypted one", () => {
  assert.equal(isEncryptedBackup(PAYLOAD), false);
  assert.equal(isEncryptedBackup(null), false);
  assert.equal(isEncryptedBackup({ container: AES_GCM_CONTAINER }), false);
});
