// src/controllers/backupHealthController.js — keeps the header's unbacked-data warning current
// (TODO §3.8). Single responsibility: hold the two ASYNC inputs the assessment needs, so the
// assessment itself can run synchronously on every write.
//
// **Why a cache rather than reading on demand.** `assessBackupHealth` is pure and fast, but its
// inputs are not: the backup history is an IndexedDB read and durability is a `navigator.storage`
// estimate. Re-reading both on every save would put two async round-trips on the path of every edit
// a trainer makes on the gym floor, to answer a question whose answer changes on the order of days.
// So the slow half is read at boot and whenever a backup lands, and the fast half — fingerprint the
// current state, diff it, compare to the thresholds — runs on each write.
//
// Injected dependencies: `renderBackupBadge` is imported directly from the header module (a
// controller may import downward); everything else comes from the data layer.

import { assessBackupHealth, fingerprintState } from "../data/backupHealth.js";
import { withoutSeedRecords } from "../data/seedProvenance.js";
import { getState, readBackupHistory } from "../data/stateStore.js";
import { assessDurability } from "../data/storageDurability.js";
import { renderBackupBadge } from "../modules/common/applicationHeader.js";

let cachedHistory = null;
let cachedDurability = null;

/** Read the slow inputs and re-render. Call at boot, and whenever a backup is recorded. */
export async function primeBackupHealth() {
  cachedHistory = await readBackupHistory();
  // Never throws — a browser without the Storage API reports `supported: false`, which reads as
  // "no evidence of risk" rather than as risk. Absence of a signal must not manufacture a warning.
  cachedDurability = await assessDurability().catch(() => null);
  refreshBackupBadge();
}

/** Recompute from the cached inputs and the live state. Synchronous, so it is safe on every save. */
export function refreshBackupBadge() {
  renderBackupBadge(
    assessBackupHealth({
      history: withoutSeededHistory(cachedHistory),
      currentFingerprint: fingerprintState(withoutSeedRecords(getState())),
      durability: cachedDurability,
    }),
  );
}

/**
 * The stored fingerprint with the demo dropped from it too (TODO §28.5).
 *
 * Filtering only the live state would turn every seeded record in an older backup's fingerprint
 * into a phantom REMOVAL, so the warning this change exists to silence would fire even harder. The
 * fingerprint is `{id, h}` per record, which is enough: a record written before the seed stamp
 * existed is still recognised by the committed seed id set.
 */
function withoutSeededHistory(history) {
  if (!history?.fingerprint) return history;
  return { ...history, fingerprint: withoutSeedRecords(history.fingerprint) };
}
