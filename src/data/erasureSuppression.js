// src/data/erasureSuppression.js — the record of who has been erased, so a restored backup cannot
// resurrect them (TODO §18.11).
//
// The gap this closes: erasure rewrites the live database, and a backup taken the day before still
// contains "Jane Doe". Restore that file and the erasure is undone — silently, by a trainer doing a
// perfectly ordinary recovery. §18.7 wants backups restorable indefinitely, so "old backups rotate
// away" is not available as a defence here. Something has to outlive the restore and re-apply the
// erasure on the way in.
//
// Four properties it needs, each of which was a way to get this wrong:
//   1. **Applied AT IMPORT, not only at erasure.** Rewriting the live store is what a restore
//      overwrites; the check has to run on the incoming payload.
//   2. **MERGED on import, never replaced.** The list travels inside backup files too — that is how
//      it survives a reinstall on a new device — but a file is a snapshot of one moment, and a
//      restore that adopted the file's list wholesale would DROP every erasure performed since.
//      Union is always the safe direction: the list is append-only and every entry is a promise
//      already made to a real person.
//   3. **Keyed on the record id, and storing nothing else.** A list of erased people's names would
//      be a list of erased people — the thing the erasure removed. What is kept is a salted SHA-256
//      of the opaque record id: enough to recognise a record, useless as a description of anyone.
//   4. **A fresh salt PER ENTRY, carried with it.** A single per-install salt cannot survive a
//      merge — two devices' lists would be hashed in different namespaces and could never be
//      unioned into one. Per-entry salts make the list portable AND strictly stronger: two entries
//      for the same id under different salts do not even look alike, so the list cannot be scanned
//      for repeats.
//
// Surviving a reinstall, concretely: localStorage holds the working copy, every backup file carries
// the list, and a restore unions the two. A trainer who reinstalls and restores yesterday's backup
// gets their erasures back; one who restores a file predating an erasure has the client re-erased
// on the way in. What is NOT covered yet is a Drive-only recovery with no local list and no file —
// the synced snapshot is already anonymised, so the data is right, but the list itself does not
// ride along (TODO §18.11).
//
// Injected dependencies: a WebCrypto-shaped `subtle` (browser `crypto.subtle`, Node's
// `webcrypto.subtle` in tests) — passed in rather than reached for, so the hashing is testable
// without a DOM.

import { eraseClientInState } from "./clientErasure.js";

export const SUPPRESSION_KEY = "librept_erasure_suppressions";

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function newSuppressionSalt(cryptoImpl = globalThis.crypto) {
  const bytes = new Uint8Array(16);
  cryptoImpl.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

/** Salted, one-way. The salt goes first so a raw-id collision cannot be probed without it. */
export async function hashClientId(clientId, salt, subtle = globalThis.crypto?.subtle) {
  const encoded = new TextEncoder().encode(`${salt}:${clientId}`);
  return toHex(await subtle.digest("SHA-256", encoded));
}

function entriesOf(list) {
  return Array.isArray(list?.entries) ? list.entries : [];
}

function entryKey(entry) {
  return `${entry.salt}:${entry.hash}`;
}

/** Add one erased id, under its own fresh salt. Pure — the caller persists the result. */
export async function withSuppressedClient(list, clientId, subtle, cryptoImpl = globalThis.crypto) {
  const entries = entriesOf(list);
  const salt = newSuppressionSalt(cryptoImpl);
  const hash = await hashClientId(clientId, salt, subtle);
  // No de-duplication against existing entries, and none is possible: a second erasure of the same
  // id under a new salt is indistinguishable from a different id, which is the property that makes
  // the list unscannable. A duplicate costs one extra digest per import and nothing else.
  return { entries: [...entries, { salt, hash }] };
}

/**
 * Union two lists. Order-independent and idempotent, because an import may run repeatedly and
 * because neither side is authoritative — both are partial views of "who asked to be forgotten".
 */
export function mergeSuppressionLists(left, right) {
  const byKey = new Map();
  for (const entry of [...entriesOf(left), ...entriesOf(right)]) {
    if (entry?.salt && entry?.hash) byKey.set(entryKey(entry), entry);
  }
  return { entries: [...byKey.values()] };
}

/**
 * Re-erase every client in `state` that this install has already erased.
 *
 * Runs over an INCOMING payload (a restored backup, a Drive snapshot). Returns the state plus the
 * ids it re-erased, so the import can tell the trainer that a restore was filtered rather than
 * quietly changing what their file contained.
 */
export async function applySuppressions(state, list, subtle) {
  const entries = entriesOf(list);
  if (entries.length === 0) return { state, reErased: [] };

  let next = state;
  const reErased = [];
  for (const client of state?.clients || []) {
    // Every entry carries its own salt, so a candidate id has to be hashed once per entry. That is
    // the price of a list that can be merged across devices; at realistic sizes (tens of entries,
    // tens of clients) it is a few hundred digests on an import that already parses a whole file.
    let matched = false;
    for (const entry of entries) {
      if ((await hashClientId(client.id, entry.salt, subtle)) === entry.hash) {
        matched = true;
        break;
      }
    }
    // Already-erased records are re-run deliberately: an erased record is a fixed point (its name
    // is already the pseudonym, its text fields already empty), so this costs nothing and means a
    // partially-erased record from an older build gets finished off.
    if (!matched) continue;
    const result = eraseClientInState(next, client.id, {
      requestedOn: client.erasure?.requestedOn || "",
    });
    if (result.summary) {
      next = result.state;
      reErased.push(client.id);
    }
  }
  return { state: next, reErased };
}

/**
 * Rebuild register entries from the records themselves — every client already carrying
 * `erasure.erasedAt` is its own proof that an erasure happened.
 *
 * This is what makes the register **self-healing**, and it costs nothing: the anonymised records ARE
 * a second copy of the register, held in the one place a trainer is most careful about. A device
 * whose localStorage was cleared, or one restored from a backup written by a build that predates the
 * register, re-derives its entries from the data it already has instead of silently forgetting who
 * asked to be forgotten.
 *
 * It cannot recover an erasure whose records are also gone — nothing can, short of the Drive copy.
 */
export async function registerFromErasedClients(state, subtle, cryptoImpl = globalThis.crypto) {
  let list = { entries: [] };
  for (const client of state?.clients || []) {
    if (!client?.erasure?.erasedAt) continue;
    list = await withSuppressedClient(list, client.id, subtle, cryptoImpl);
  }
  return list;
}

/**
 * Whether the register looks like it LOST entries since this device last saw it.
 *
 * The realistic adversary here is entropy, not the trainer: cleared site data, a half-finished
 * profile migration, a restore from a stale file. Since the register only ever grows, a count that
 * has gone down is evidence of loss — not proof of tampering, and deliberately not described as
 * such, because the person holding the device is also the person legally responsible for it and
 * accusing them of editing their own register would be both rude and useless.
 *
 * `highWater` is carried in the Drive copy and in local storage; the caller surfaces a shortfall so
 * a sync (which unions, and therefore heals) is the obvious next step.
 */
export function registerHealth(list, highWater = 0) {
  const count = entriesOf(list).length;
  return {
    count,
    highWater: Math.max(count, highWater),
    lost: Math.max(0, highWater - count),
    healthy: count >= highWater,
  };
}

export function readSuppressionList(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SUPPRESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.entries) ? parsed : { entries: [] };
  } catch {
    // A corrupt list must not block the app from booting, but it must not silently read as "nobody
    // was ever erased" either — the caller treats an empty list as "no suppressions", which is the
    // safe direction only because the live database is already erased. The import path is where the
    // loss would show, and a restore is always a deliberate, supervised act.
    return { entries: [] };
  }
}

export function writeSuppressionList(list, storage = globalThis.localStorage) {
  storage?.setItem(SUPPRESSION_KEY, JSON.stringify(list));
}
