// src/data/erasureRegisterSync.js — the erasure register, across devices and across wipes.
//
// The problem this exists for: an erasure performed on the trainer's phone was, until now, known
// only to that phone. Their tablet would keep the client's name until a backup file happened to
// travel between the two, and clearing site data lost the register outright. Neither is acceptable
// for a promise made to a person — "we forgot you on one of my devices" is not forgetting.
//
// **The register is a grow-only set (G-Set), and that is the whole design.** Entries are only ever
// added; nothing is ever removed or edited. So merging two copies is a union, which is associative,
// commutative and idempotent — no ancestor to diff against, no last-writer-wins, no conflict for a
// trainer to resolve. It is the opposite of the main snapshot, which genuinely needs a three-way
// merge (syncMerge.js) because its records change. Two devices erasing two different clients while
// offline converge on both erasures; the same device syncing twice converges on itself.
//
// **Its own Drive file, never a key inside the snapshot.** The snapshot is replaced wholesale by a
// restore and rewritten by every merge; a register living inside it would be rolled back by exactly
// the operation it exists to filter. As a separate file in the same `appDataFolder` it rides the
// same OAuth grant, costs one extra round trip per sync, and cannot regress.
//
// Four sources are unioned on every pass, and each covers a hole the others leave:
//   1. **local storage** — this device's working copy;
//   2. **the Drive file** — what every other device on this account has erased;
//   3. **the records themselves** — self-healing, since an anonymised client is its own proof
//      (erasureSuppression.js's registerFromErasedClients);
//   4. **backup files** — handled elsewhere, on import (backupRestore.js).
//
// What none of this can do, stated because the alternative is implying otherwise: a device with the
// register cleared, no Drive account, and only a PRE-erasure backup to restore has no surviving
// record of the request. Nothing short of an off-device copy can help there — which is the argument
// for connecting Drive, not a gap to paper over.
//
// Injected dependencies: `{ findFile, downloadFile, createFile, updateFile }` (driveAppData.js's
// functions, passed in so this is testable without a network) and a WebCrypto `subtle`.

import { ERASURE_REGISTER_FILENAME } from "./driveAppData.js";
import { mergeSuppressionLists, registerFromErasedClients } from "./erasureSuppression.js";

/**
 * Union the local register with Drive's copy and with whatever the records themselves prove, push
 * the result back, and hand it to the caller to persist and apply.
 *
 * Returns `{ list, remoteCount, pushed }` — `pushed` is false when the union already equalled the
 * remote copy, so a quiet sync does not rewrite a file nobody changed.
 */
export async function syncErasureRegister(
  accessToken,
  { localList, state, subtle, drive, fetchImpl } = {},
) {
  const options = { fetchImpl, filename: ERASURE_REGISTER_FILENAME };
  const existing = await drive.findFile(accessToken, options);

  const remoteList = existing
    ? await drive.downloadFile(accessToken, existing.id, { fetchImpl })
    : null;
  const healed = await registerFromErasedClients(state, subtle);
  const union = mergeSuppressionLists(mergeSuppressionLists(localList, remoteList), healed);

  const remoteCount = (remoteList?.entries || []).length;
  const pushed = union.entries.length !== remoteCount;
  if (pushed) {
    // The high-water count travels WITH the file: a device that comes back to a shorter register
    // than the account has seen can say so (erasureSuppression.js's registerHealth) instead of
    // treating the loss as normal.
    const content = { ...union, highWaterCount: union.entries.length };
    if (existing) await drive.updateFile(accessToken, existing.id, content, { fetchImpl });
    else await drive.createFile(accessToken, content, options);
  }

  return { list: union, remoteCount, pushed };
}
