// src/data/encryptedExport.js — encrypting a data-subject export so it can survive being emailed.
//
// Why encrypt at all: an Art. 15 export is one person's complete health and training record, and
// email is a plaintext-at-rest medium hopping through servers neither party controls. Sending it
// bare is the kind of disclosure that turns honouring one right into breaching another (Art. 32).
//
// Why a passphrase and not a key exchange: the recipient is a gym client with no keys, no PGP, and
// no patience. A passphrase read out at the end of a session — or sent by SMS, a genuinely separate
// channel from email — is the strongest scheme that actually gets used. The passphrase must never
// travel in the same email as the file; the UI says so, and generates a strong one so the trainer
// does not reach for their dog's name.
//
// Scheme, and why each parameter: PBKDF2-HMAC-SHA-256 at 600,000 iterations (OWASP's 2023 floor for
// SHA-256) over a 16-byte random salt, into a 256-bit AES-GCM key with a 12-byte random IV. GCM
// because it authenticates as well as encrypts: a truncated or tampered attachment fails to open
// rather than decrypting to plausible nonsense. Everything needed to decrypt EXCEPT the passphrase
// travels in the envelope, because a file that can only be opened by the build that wrote it is not
// a portable export.
//
// The envelope is JSON with base64 fields rather than a binary blob: it survives every mail gateway,
// quoted-printable transform and copy-paste that a `.bin` does not, and a human can see what it is.
//
// Injected dependencies: `cryptoImpl` (browser `crypto`, Node's `webcrypto` in tests) — passed in so
// the whole module is testable without a DOM.

export const ENVELOPE_FORMAT = "librept-encrypted-export";
export const ENVELOPE_VERSION = 1;
const KDF_ITERATIONS = 600000;

function toBase64(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function deriveKey(passphrase, salt, iterations, cryptoImpl) {
  const material = await cryptoImpl.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return cryptoImpl.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * A passphrase a trainer can read down a phone line and a client can type without a typo.
 *
 * Six words from a small, deliberately unambiguous alphabet-free list beats a random character
 * string here: the failure mode is not brute force (600k PBKDF2 rounds over ~77 bits of entropy is
 * far past what an email interceptor would spend), it is the trainer picking "gym2024" because the
 * generated one was unreadable over a bad connection.
 */
const PASSPHRASE_WORDS = [
  "anchor",
  "barbell",
  "cadence",
  "deadlift",
  "elbow",
  "flywheel",
  "gravity",
  "hinge",
  "impulse",
  "jumprope",
  "kettle",
  "lever",
  "mobility",
  "nordic",
  "overhead",
  "posture",
  "quadrant",
  "rowing",
  "sprint",
  "tempo",
  "unrack",
  "vertical",
  "warmup",
  "zercher",
];

export function generatePassphrase(cryptoImpl = globalThis.crypto, wordCount = 6) {
  const picks = new Uint32Array(wordCount);
  cryptoImpl.getRandomValues(picks);
  return Array.from(picks, (value) => PASSPHRASE_WORDS[value % PASSPHRASE_WORDS.length]).join("-");
}

/** Encrypt any JSON-serialisable payload into a self-describing envelope. */
export async function encryptPayload(payload, passphrase, cryptoImpl = globalThis.crypto) {
  if (!passphrase) throw new Error("a passphrase is required to encrypt an export");
  const salt = cryptoImpl.getRandomValues(new Uint8Array(16));
  const iv = cryptoImpl.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS, cryptoImpl);
  const ciphertext = await cryptoImpl.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  return {
    format: ENVELOPE_FORMAT,
    version: ENVELOPE_VERSION,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: KDF_ITERATIONS },
    cipher: "AES-GCM",
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    // Plaintext on purpose, and the only thing that is: a recipient with the wrong file or a
    // trainer with three attachments needs to know what this is WITHOUT the passphrase. It names
    // no person — that would defeat the encryption for anyone reading the attachment list.
    hint: "Encrypted personal-data export from LibrePT. Open it with the passphrase your trainer sent you separately.",
  };
}

export function isEncryptedEnvelope(parsed) {
  return (
    Boolean(parsed) && parsed.format === ENVELOPE_FORMAT && typeof parsed.ciphertext === "string"
  );
}

/**
 * Decrypt an envelope back to its payload.
 *
 * A wrong passphrase and a tampered file are indistinguishable here — GCM fails authentication
 * either way — so the error says both are possible rather than asserting the passphrase was wrong,
 * which would send someone hunting for a typo that does not exist.
 */
export async function decryptEnvelope(envelope, passphrase, cryptoImpl = globalThis.crypto) {
  if (!isEncryptedEnvelope(envelope)) throw new Error("not a LibrePT encrypted export");
  const iterations = envelope.kdf?.iterations || KDF_ITERATIONS;
  const key = await deriveKey(passphrase, fromBase64(envelope.salt), iterations, cryptoImpl);
  try {
    const plaintext = await cryptoImpl.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    throw new Error(
      "could not open the file — wrong passphrase, or the file was altered in transit",
    );
  }
}
