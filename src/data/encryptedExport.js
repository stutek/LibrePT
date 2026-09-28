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
// Scheme: the shared passphrase KDF in [passphraseKey.js](./passphraseKey.js) — PBKDF2-HMAC-SHA-256
// into an AES-GCM key. It lives there rather than here because the encrypted backup container uses
// the same primitive, and two copies of a KDF is two iteration counts with the weaker one deciding
// how hard the file is to attack. Everything needed to decrypt EXCEPT the passphrase travels in the
// envelope, because a file that can only be opened by the build that wrote it is not a portable
// export.
//
// The envelope is JSON with base64 fields rather than a binary blob: it survives every mail gateway,
// quoted-printable transform and copy-paste that a `.bin` does not, and a human can see what it is.
//
// Injected dependencies: `cryptoImpl` (browser `crypto`, Node's `webcrypto` in tests) — passed in so
// the whole module is testable without a DOM.

import {
  KDF_ITERATIONS,
  deriveAesKey,
  fromBase64,
  randomIv,
  randomSalt,
  toBase64,
} from "./passphraseKey.js";

export const ENVELOPE_FORMAT = "librept-encrypted-export";
export const ENVELOPE_VERSION = 1;

/** Encrypt any JSON-serialisable payload into a self-describing envelope. */
export async function encryptPayload(payload, passphrase, cryptoImpl = globalThis.crypto) {
  if (!passphrase) throw new Error("a passphrase is required to encrypt an export");
  const salt = randomSalt(cryptoImpl);
  const iv = randomIv(cryptoImpl);
  const key = await deriveAesKey(passphrase, salt, { cryptoImpl });
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
  const key = await deriveAesKey(passphrase, fromBase64(envelope.salt), { iterations, cryptoImpl });
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
