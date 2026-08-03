// src/data/syncMerge.js — three-way merge for Google Drive appDataFolder sync (TODO §1.5, §3.3).
// Single responsibility: given a common-ancestor snapshot and two descendants (this device's local
// state, the state just downloaded from Drive), produce the merged state plus the list of conflicts
// that could not be resolved automatically.
//
// Per TODO §1.5: NOT wall-clock last-write-wins (DATA_MODEL.md's invariants already establish the
// device clock is not trustworthy for ordering). This is a per-record-id three-way merge against the
// last-synced snapshot as the common ancestor instead — deterministic, clock-free, and same-record
// conflicts are always surfaced rather than silently guessed.
//
// Why no persisted tombstone records: a soft-delete marker exists to stop a merge from resurrecting a
// record a stale peer never heard was deleted. Here that risk doesn't arise because (a) `remote` is
// always the Drive file's *current* content, fetched fresh on every sync, never reconstructed from a
// cache, and (b) Drive's own history is linear — the appDataFolder file is written only by this merge
// function, sequentially, so a device's stored `base` (however old) is always a genuine ancestor of
// the current Drive content. An id absent from a freshly-fetched `remote` that was present in `base`
// IS the deletion signal; nothing needs to survive independently of the snapshot chain to express it.
// This would need revisiting only if something else ever wrote to the same Drive file out of band.
//
// Injected dependencies: none — pure functions over plain objects.

// Deterministic deep-equality for change detection: two records built from the same domain object
// must compare equal even if key insertion order differs (e.g. one round-tripped through JSON, the
// other didn't), so equality is over a canonical (sorted-key) serialization, not raw JSON.stringify.
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function recordsEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

function byId(records) {
  const map = new Map();
  for (const record of records || []) map.set(record.id, record);
  return map;
}

// Every resolver returns `{ record, conflict }` — `record` is undefined when the id should be
// dropped from the merge, `conflict` is undefined when both sides agree. Keeping one resolver per
// presence pattern (rather than one long if-chain) is what keeps each function's branch count low:
// mergeCollection's loop below does a single object-key dispatch, no branching of its own.

function keepOneSided(record) {
  return { record };
}

function resolveAddAdd(collection, id, localRecord, remoteRecord) {
  if (recordsEqual(localRecord, remoteRecord)) return { record: localRecord };
  // Same id minted independently on both sides (collision-resistant ids make this vanishingly
  // rare) — treated like the both-changed-since-base case below, base being implicitly empty.
  return {
    record: localRecord,
    conflict: { collection, id, type: "add-add", local: localRecord, remote: remoteRecord },
  };
}

// Shared by both one-sided-deletion cases (§DATA_MODEL 5: never silently destroy). `survivorField`
// ("local" or "remote") is which side of the reported conflict actually holds the edited record —
// the other side reports null, meaning "this side deleted it".
function resolveDeletionVsEdit(collection, id, baseRecord, survivor, survivorField, conflictType) {
  if (recordsEqual(baseRecord, survivor)) return {}; // untouched since base — honour the deletion
  const conflict = {
    collection,
    id,
    type: conflictType,
    local: null,
    remote: null,
    [survivorField]: survivor,
  };
  return { record: survivor, conflict };
}

function resolveAllThreePresent(collection, id, baseRecord, localRecord, remoteRecord) {
  const localChanged = !recordsEqual(baseRecord, localRecord);
  const remoteChanged = !recordsEqual(baseRecord, remoteRecord);
  if (!localChanged) return { record: remoteChanged ? remoteRecord : baseRecord };
  if (!remoteChanged) return { record: localRecord };
  if (recordsEqual(localRecord, remoteRecord)) return { record: localRecord }; // same edit, both sides
  // Real conflict: both sides changed the same record differently. Local wins by default (a
  // device's own most recent edit is the one the trainer is looking at right now) but the remote
  // version travels alongside it so a future review surface can offer the choice — never guessed
  // away silently.
  return {
    record: localRecord,
    conflict: { collection, id, type: "edit-vs-edit", local: localRecord, remote: remoteRecord },
  };
}

// Keyed by `${inBase}${inLocal}${inRemote}` as "0"/"1" digits. "000" never occurs (an id only enters
// `allIds` by being present in at least one map).
const PRESENCE_RESOLVERS = {
  "010": (_c, _id, _b, local) => keepOneSided(local),
  "001": (_c, _id, _b, _l, remote) => keepOneSided(remote),
  "011": (c, id, _b, local, remote) => resolveAddAdd(c, id, local, remote),
  100: () => ({}),
  101: (c, id, base, _l, remote) =>
    resolveDeletionVsEdit(c, id, base, remote, "remote", "delete-vs-edit"),
  110: (c, id, base, local) => resolveDeletionVsEdit(c, id, base, local, "local", "edit-vs-delete"),
  111: (c, id, base, local, remote) => resolveAllThreePresent(c, id, base, local, remote),
};

/**
 * Merge one collection's three snapshots (arrays of records with a stable `id`).
 * Returns `{ merged, conflicts }` — `merged` is the resolved array, `conflicts` describes every
 * id where local and remote disagreed and neither side was silently preferred without a flag.
 */
export function mergeCollection(collection, { base, local, remote }) {
  const baseMap = byId(base);
  const localMap = byId(local);
  const remoteMap = byId(remote);
  const allIds = new Set([...baseMap.keys(), ...localMap.keys(), ...remoteMap.keys()]);

  const merged = [];
  const conflicts = [];

  for (const id of allIds) {
    const presence = `${baseMap.has(id) ? 1 : 0}${localMap.has(id) ? 1 : 0}${remoteMap.has(id) ? 1 : 0}`;
    const { record, conflict } = PRESENCE_RESOLVERS[presence](
      collection,
      id,
      baseMap.get(id),
      localMap.get(id),
      remoteMap.get(id),
    );
    if (record !== undefined) merged.push(record);
    if (conflict) conflicts.push(conflict);
  }

  return { merged, conflicts };
}

/**
 * Merge every collection in a domain state snapshot. `collections` is the list of top-level array
 * keys to merge (recordProjections.js's `COLLECTIONS` — the same set a star write fans out).
 */
export function mergeState(collections, { base, local, remote }) {
  const mergedState = {};
  const conflicts = [];
  for (const collection of collections) {
    const { merged, conflicts: collectionConflicts } = mergeCollection(collection, {
      base: base?.[collection],
      local: local?.[collection],
      remote: remote?.[collection],
    });
    mergedState[collection] = merged;
    conflicts.push(...collectionConflicts);
  }
  return { mergedState, conflicts };
}

/**
 * How many records differ between two snapshots of one collection — added, removed, or changed all
 * count as one each. A one-sided diff, not a merge: used for the header's real ahead/behind counts
 * (driveSyncService.js), where what's wanted is "how many", not a resolved value per id.
 */
function countChangedInCollection(collection, from, to) {
  const fromMap = byId(from);
  const toMap = byId(to);
  const ids = new Set([...fromMap.keys(), ...toMap.keys()]);
  let count = 0;
  for (const id of ids) {
    if (!recordsEqual(fromMap.get(id), toMap.get(id))) count += 1;
  }
  return count;
}

/** Same idea as `countChangedInCollection`, summed across every collection in a domain state. */
export function countChangedRecords(collections, from, to) {
  let count = 0;
  for (const collection of collections) {
    count += countChangedInCollection(collection, from?.[collection], to?.[collection]);
  }
  return count;
}
