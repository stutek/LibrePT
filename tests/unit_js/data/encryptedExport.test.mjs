// tests/unit_js/data/encryptedExport.test.mjs
// The encrypted envelope a data-subject export travels in (src/data/encryptedExport.js).
//
// `btoa`/`atob` and WebCrypto are all present in Node 24, so this runs here rather than in a browser
// tier — which is the point of injecting `cryptoImpl` rather than reaching for `window.crypto`.
//
// The load-bearing assertion is the negative one: that no fragment of the plaintext survives into
// the envelope. A "working" encryption that leaves a name in a metadata field is worse than none,
// because it is trusted.

import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";

import {
  decryptEnvelope,
  encryptPayload,
  generatePassphrase,
  isEncryptedEnvelope,
} from "../../../src/data/encryptedExport.js";

const PAYLOAD = {
  subject: { name: "Jane Doe", email: "jane@example.com", injuryNotes: "L4 disc herniation" },
  history: [{ id: "h1", exercises: [] }],
};

test("a payload survives the round trip byte for byte", async () => {
  const envelope = await encryptPayload(PAYLOAD, "correct-horse-battery", webcrypto);

  assert.deepEqual(await decryptEnvelope(envelope, "correct-horse-battery", webcrypto), PAYLOAD);
});

test("nothing of the plaintext appears anywhere in the envelope", async () => {
  const envelope = await encryptPayload(PAYLOAD, "tempo-hinge-sprint", webcrypto);
  const serialized = JSON.stringify(envelope);

  for (const secret of ["Jane", "jane@example.com", "L4 disc", "herniation"]) {
    assert.ok(!serialized.includes(secret), `"${secret}" leaked into the envelope`);
  }
  // The one plaintext field is a fixed hint that names no person — a recipient staring at an
  // attachment needs to know what it is without the passphrase.
  assert.match(envelope.hint, /^Encrypted personal-data export/);
});

test("the envelope carries everything needed to decrypt except the passphrase", async () => {
  // A file only the build that wrote it can open is not a portable export.
  const envelope = await encryptPayload(PAYLOAD, "warmup-lever-quadrant", webcrypto);

  assert.equal(envelope.cipher, "AES-GCM");
  assert.equal(envelope.kdf.name, "PBKDF2");
  assert.equal(envelope.kdf.hash, "SHA-256");
  assert.ok(envelope.kdf.iterations >= 600000, "OWASP's SHA-256 floor is 600k");
  assert.ok(envelope.salt && envelope.iv && envelope.ciphertext);
  assert.ok(isEncryptedEnvelope(envelope));
});

test("two encryptions of the same payload differ", async () => {
  // Fresh salt and IV per file: reusing either across two exports is the classic AES-GCM own-goal.
  const first = await encryptPayload(PAYLOAD, "same-passphrase", webcrypto);
  const second = await encryptPayload(PAYLOAD, "same-passphrase", webcrypto);

  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
});

test("a wrong passphrase fails closed, with an error that does not mislead", async () => {
  const envelope = await encryptPayload(PAYLOAD, "the-right-one", webcrypto);

  await assert.rejects(
    () => decryptEnvelope(envelope, "the-wrong-one", webcrypto),
    // Wrong passphrase and tampering are indistinguishable under GCM, so the message says both
    // rather than sending someone hunting for a typo that does not exist.
    /wrong passphrase, or the file was altered/,
  );
});

test("a tampered ciphertext will not decrypt at all", async () => {
  const envelope = await encryptPayload(PAYLOAD, "tempo-hinge-sprint", webcrypto);
  const flipped = envelope.ciphertext.startsWith("A") ? "B" : "A";
  const tampered = { ...envelope, ciphertext: flipped + envelope.ciphertext.slice(1) };

  // GCM authenticates: a truncated or edited attachment fails rather than yielding plausible junk.
  await assert.rejects(() => decryptEnvelope(tampered, "tempo-hinge-sprint", webcrypto));
});

test("a file that is not one of ours is refused before any key work", async () => {
  await assert.rejects(
    () => decryptEnvelope({ format: "something-else" }, "x", webcrypto),
    /not a LibrePT encrypted export/,
  );
  assert.equal(isEncryptedEnvelope(null), false);
  assert.equal(isEncryptedEnvelope({ format: "librept-encrypted-export" }), false);
});

test("encrypting without a passphrase is refused rather than defaulting to one", async () => {
  await assert.rejects(() => encryptPayload(PAYLOAD, "", webcrypto), /passphrase is required/);
});

test("the generated passphrase is readable aloud and not the same twice", () => {
  const passphrase = generatePassphrase(webcrypto);

  // Readable down a bad phone line is the actual design constraint — see the module header.
  assert.match(passphrase, /^[a-z]+(-[a-z]+){5}$/);
  assert.notEqual(passphrase, generatePassphrase(webcrypto));
});
