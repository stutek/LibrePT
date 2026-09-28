// src/data/backupEncryption.js — the encrypted container a backup travels in.
// Single responsibility: wrap a backup payload in AES-GCM and unwrap it again. Pure: no DOM, no
// storage, no download. It does not know what a client or a session is, and it never asks for a
// passphrase — [backupKeyStore.js](./backupKeyStore.js) owns the key, the dialog owns the typing.
//
// **Why the backup and not the live database.** The backup is the artifact that leaves the phone —
// Google Drive, e-mail, a USB stick — and is where a disclosure actually happens. The live store is
// protected by the phone's own encryption when it is locked, and encrypting it would mean a forgotten
// passphrase destroys a solo trainer's business records outright. Encrypting the file that travels
// costs nothing that cannot be recovered: the live database is still there.
//
// **The cost this DOES create, said plainly because the feature exists for exactly this case:** a
// backup is for the day the phone is gone. If the key exists only on that phone, the copy on Drive
// cannot be opened on the new one. That is why the key is derived from a passphrase the trainer can
// keep on paper (passphraseKey.js) and not generated at random — every envelope carries the salt and
// iteration count needed to derive the same key again from that passphrase, on any device, in any
// build. The app says so when the passphrase is set.
//
// **Everything outside the ciphertext is the minimum a reader needs to open the box**, and nothing
// else. `formatVersion` first, so the version check in backupFile.js runs before any key work; the
// KDF parameters, because a file openable only by the build that wrote it is not a backup; one line
// of English saying what the file is, naming nobody. There is no date, no build SHA and no record
// count out here: those live inside, where they cannot be read off a stolen file and cannot be
// altered without the ciphertext failing to authenticate.
//
// **`schemaVersion` moved inside, and that is an improvement.** A plain backup states its record
// schema in the payload; an encrypted one has it under the ciphertext, and BACKUP_FORMATS' row for
// this container names the schema instead. So the record shape of an encrypted file cannot be lied
// about by editing a byte.
//
// Injected dependencies: `cryptoImpl` (browser `crypto`, Node's `webcrypto` in tests).

import {
  KDF_HASH,
  KDF_ITERATIONS,
  deriveAesKey,
  fromBase64,
  randomIv,
  toBase64,
} from "./passphraseKey.js";

/** The container name recorded in BACKUP_FORMATS, and the value the envelope declares. One string,
 *  imported by the format table rather than written twice. */
export const AES_GCM_CONTAINER = "aes-gcm";

/** Plaintext on purpose, and the only prose out here: a trainer looking at three files in a Drive
 *  folder needs to know which is which WITHOUT the passphrase. It names no person and no gym — that
 *  would defeat the encryption for anyone reading a file listing. English, because the person
 *  reading it may be a support engineer or a future build, not the trainer. */
const HINT = "Encrypted LibrePT backup. Open it in LibrePT with your backup password.";

/** Whether a parsed file is an encrypted backup envelope, decided without touching any key. */
export function isEncryptedBackup(parsed) {
  return (
    Boolean(parsed) &&
    typeof parsed === "object" &&
    parsed.container === AES_GCM_CONTAINER &&
    typeof parsed.ciphertext === "string"
  );
}

/**
 * Wrap `payload` for `key`, recording `salt` and `iterations` so the same key can be derived again.
 *
 * `formatVersion` is the caller's, not this module's: the version integer belongs to the format
 * table in backupFile.js, and a second literal here is the one place the two could drift apart.
 *
 * A fresh random IV per call is what makes it safe to encrypt every backup with one stored key.
 */
export async function encryptBackup(
  payload,
  { key, salt, iterations = KDF_ITERATIONS, formatVersion, cryptoImpl = globalThis.crypto },
) {
  if (!key) throw new Error("an encryption key is required to write an encrypted backup");
  if (!salt) throw new Error("the key's salt is required, or the file cannot be opened elsewhere");
  if (!formatVersion) throw new Error("the caller states the format version");
  const iv = randomIv(cryptoImpl);
  const ciphertext = await cryptoImpl.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  return {
    formatVersion,
    container: AES_GCM_CONTAINER,
    kdf: { name: "PBKDF2", hash: KDF_HASH, iterations },
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    hint: HINT,
  };
}

/**
 * Unwrap an envelope with a key that is already in hand — the stored key on this device.
 *
 * A wrong key and an altered file are indistinguishable here: AES-GCM fails authentication either
 * way. The error says both are possible rather than asserting the password is wrong, which would
 * send a trainer hunting for a typo that does not exist.
 */
export async function decryptBackup(envelope, { key, cryptoImpl = globalThis.crypto }) {
  if (!isEncryptedBackup(envelope)) throw new Error("not an encrypted LibrePT backup");
  try {
    const plaintext = await cryptoImpl.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    throw new Error("wrong backup password, or the file was altered");
  }
}

/**
 * Derive this envelope's key from a typed passphrase — the new-phone path.
 *
 * It reads the KDF parameters from the FILE, never from this build's constants: a file written when
 * the iteration count was lower must still open, and raising the count for new files must not lock
 * old ones out.
 *
 * `extractable` stays false. Nothing needs the bytes, and a key that cannot be exported cannot be
 * copied out of the browser by a script, an extension, or anyone reading the profile off the disk.
 */
export async function deriveKeyForEnvelope(
  envelope,
  passphrase,
  { cryptoImpl = globalThis.crypto } = {},
) {
  if (!isEncryptedBackup(envelope)) throw new Error("not an encrypted LibrePT backup");
  const salt = fromBase64(envelope.salt);
  const iterations = envelope.kdf?.iterations || KDF_ITERATIONS;
  const key = await deriveAesKey(passphrase, salt, { iterations, cryptoImpl });
  return { key, salt, iterations };
}
