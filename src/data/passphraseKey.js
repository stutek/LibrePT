// src/data/passphraseKey.js — turning a typed passphrase into an AES-GCM key, in one place.
//
// Two features need the same primitive and must not disagree about it: the personal-data export a
// client opens ([encryptedExport.js](./encryptedExport.js)) and the encrypted backup container
// ([backupEncryption.js](./backupEncryption.js)). Two copies of a KDF is two iteration counts, and
// the weaker one decides how hard the file is to attack.
//
// Scheme, and why each parameter: PBKDF2-HMAC-SHA-256 at 600,000 iterations (OWASP's 2023 floor for
// SHA-256) over a 16-byte random salt, into a 256-bit AES-GCM key. GCM because it authenticates as
// well as encrypts: a truncated or tampered file fails to open rather than decrypting to plausible
// nonsense.
//
// **`extractable` is the whole point of the `extractable` argument, so it defaults to false.** A
// non-extractable `CryptoKey` can encrypt and decrypt but cannot be read out by `exportKey` — so a
// key kept for repeat use (the backup key, backupKeyStore.js) is unreadable to any script on the
// page, any browser extension, and anyone copying the browser profile off the disk. The export
// feature derives a key, uses it once and drops it, and passes false for the same reason: nothing
// needs the bytes.
//
// Argon2id would be the stronger KDF and is deliberately not used: it is not in WebCrypto, so it
// would mean shipping wasm into a repo whose install size is a stated constraint. PBKDF2 at this
// iteration count is what the platform gives for free.
//
// Injected dependencies: `cryptoImpl` (browser `crypto`, Node's `webcrypto` in tests) — passed in so
// every module built on this one is testable without a DOM.

/** OWASP's 2023 floor for PBKDF2-HMAC-SHA-256. Raising it is safe for NEW files only: an existing
 *  file carries the count it was written with, and is opened with that. */
export const KDF_ITERATIONS = 600000;
export const KDF_HASH = "SHA-256";
export const SALT_BYTES = 16;
/** 96 bits, the size AES-GCM is specified for. A random IV per encryption, never reused with the
 *  same key — which is what makes it safe to encrypt many backups with one stored key. */
export const IV_BYTES = 12;

export function toBase64(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function randomSalt(cryptoImpl = globalThis.crypto) {
  return cryptoImpl.getRandomValues(new Uint8Array(SALT_BYTES));
}

export function randomIv(cryptoImpl = globalThis.crypto) {
  return cryptoImpl.getRandomValues(new Uint8Array(IV_BYTES));
}

/**
 * Derive a 256-bit AES-GCM key from `passphrase` and `salt`.
 *
 * `iterations` is an argument rather than a constant read here, because opening an old file means
 * using the count that file was written with — the envelope carries it.
 */
export async function deriveAesKey(
  passphrase,
  salt,
  { iterations = KDF_ITERATIONS, extractable = false, cryptoImpl = globalThis.crypto } = {},
) {
  const material = await cryptoImpl.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return cryptoImpl.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: KDF_HASH },
    material,
    { name: "AES-GCM", length: 256 },
    extractable,
    ["encrypt", "decrypt"],
  );
}

/**
 * A passphrase a trainer can read down a phone line, a client can type without a typo, and a trainer
 * can copy onto paper for the day their phone is gone.
 *
 * Six words from a small, deliberately unambiguous alphabet-free list beat a random character string
 * here: the failure mode is not brute force (600k PBKDF2 rounds over ~77 bits of entropy is far past
 * what an email interceptor or a stolen backup file would spend), it is the trainer picking
 * "gym2024" because the generated one was unreadable over a bad connection or too long to write down.
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
