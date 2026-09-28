// src/data/backupKeyStore.js — the backup password's key, and where it is kept.
// Single responsibility: decide what is stored for the backup password and hand out the key. The
// container is [backupEncryption.js](./backupEncryption.js), the KDF is
// [passphraseKey.js](./passphraseKey.js), the record lives in the meta store through
// [stateStore.js](./stateStore.js), and the typing belongs to the dialog.
//
// **What is stored: a non-extractable key, a salt and an iteration count. Never the password.**
// There is no encrypted copy of the password, no hash of it, and no hint. The reason is the threat
// this is for: the thing worth attacking is a backup file on Drive or in a mailbox, and anything
// stored here that could be turned back into the password would travel with the browser profile and
// unlock every one of those files. A non-extractable key can encrypt on this device and cannot leave
// it.
//
// **What this does not protect against, said plainly:** somebody holding the unlocked phone can open
// the app and export or restore, because the app can use the key. It protects the file that leaves
// the phone, and the key from being copied off the phone.
//
// **Why a password at all rather than a random key.** A backup exists for the day the phone is gone,
// so the key must be reproducible without it. A password the trainer keeps on paper is; a random key
// stored only on the phone is not, and would turn every Drive copy into an unreadable file on the day
// it was needed. Fingerprint or face unlock (the WebAuthn `prf` extension) is a second way to reach
// the same key and is not built yet; it cannot be the only way, because Firefox and older Safari do
// not support it and a trainer on those browsers would have no path at all.
//
// Injected dependencies: `cryptoImpl` (browser `crypto`, Node's `webcrypto` in tests) and `store`
// (the three meta-store functions), so the policy is testable without IndexedDB.

import { deriveKeyForEnvelope } from "./backupEncryption.js";
import { KDF_ITERATIONS, deriveAesKey, randomSalt } from "./passphraseKey.js";
import { clearBackupKeyRecord, readBackupKeyRecord, writeBackupKeyRecord } from "./stateStore.js";

const DEFAULT_STORE = {
  read: readBackupKeyRecord,
  write: writeBackupKeyRecord,
  clear: clearBackupKeyRecord,
};

/** Whether this device can write an encrypted backup without asking anybody anything. */
export async function hasBackupPassword({ store = DEFAULT_STORE } = {}) {
  return Boolean(await store.read());
}

/**
 * Set or change the backup password on this device.
 *
 * A fresh salt every time, so changing the password produces an unrelated key. **Files already
 * written keep the password they were written with** — nothing can reach into a file on Drive or in
 * somebody's mailbox and re-encrypt it, so the old password stays the one that opens the old files.
 * The dialog says this; it is the kind of thing a trainer discovers at the worst moment otherwise.
 */
export async function setBackupPassword(
  passphrase,
  { store = DEFAULT_STORE, cryptoImpl = globalThis.crypto, now = Date.now() } = {},
) {
  if (!passphrase) throw new Error("a backup password is required");
  const salt = randomSalt(cryptoImpl);
  const key = await deriveAesKey(passphrase, salt, { cryptoImpl });
  const record = { key, salt, iterations: KDF_ITERATIONS, setAt: now };
  await store.write(record);
  return record;
}

/** The key to write the next backup with, or null when no password is set on this device. */
export async function backupKeyForWriting({ store = DEFAULT_STORE } = {}) {
  const record = await store.read();
  if (!record?.key) return null;
  return { key: record.key, salt: record.salt, iterations: record.iterations || KDF_ITERATIONS };
}

/**
 * Open an envelope with a password typed now — the new-phone path, and the path after *forget the
 * password*.
 *
 * `remember` keeps the derived key on this device so the trainer types it once rather than at every
 * restore and every export. The key is derived from the FILE's salt and iteration count, which is
 * what makes it the same key that wrote the file; a later `setBackupPassword` with a fresh salt would
 * produce a different key from the same words, and could not open this file.
 */
export async function unlockWithPassword(
  envelope,
  passphrase,
  {
    store = DEFAULT_STORE,
    cryptoImpl = globalThis.crypto,
    remember = false,
    now = Date.now(),
  } = {},
) {
  if (!passphrase) throw new Error("a backup password is required");
  const { key, salt, iterations } = await deriveKeyForEnvelope(envelope, passphrase, {
    cryptoImpl,
  });
  if (remember) await store.write({ key, salt, iterations, setAt: now });
  return { key, salt, iterations };
}

/** Forget the password on this device. Other devices keep theirs; the files stay encrypted. */
export async function forgetBackupPassword({ store = DEFAULT_STORE } = {}) {
  await store.clear();
}
