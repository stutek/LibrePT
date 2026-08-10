// src/data/seedProvenance.js — is this record demo data, or the trainer's own?
// Single responsibility: answer that for one record, by two independent means. Pure: no DOM, no
// storage.
//
// Why two means, not one:
//
//   1. **A stamp**, written at seed time (`seedMockData`). Unambiguous, and the right answer going
//      forward — a record either says it was seeded or it does not.
//   2. **The committed seed id set**, derived from the DEFAULT_* exports themselves. Needed because
//      databases seeded by earlier builds carry no stamp, and two preview instances are demoed on
//      real PTs' devices right now. A cleanup that only understood the stamp would tell those two
//      trainers they have no demo data to remove, which is exactly wrong.
//
// Deliberately NOT id SHAPE. Seed ids are 8 characters and real ones are 22 (recordId.js), which
// looks like a free discriminator — but 8-char ids were also minted by older builds for REAL
// records, so shape would classify a trainer's earliest genuine clients as demo data and offer to
// delete them. The id SET is exact where the shape is merely suggestive.
//
// The set is derived from the seed modules rather than hardcoded, so it cannot drift: adding a demo
// client makes it demo-identifiable in the same commit, with nothing to remember.
// Injected dependencies: none.

import {
  DEFAULT_CLIENTS,
  DEFAULT_EXERCISES,
  DEFAULT_HISTORY,
  DEFAULT_MESSAGES,
  DEFAULT_PLAN_UPDATES,
  DEFAULT_ROUTINES,
  DEFAULT_SESSIONS,
} from "./index.js";

// The flag written onto every seeded record. Named for what it means to a reader of raw stored
// JSON, not for the function that sets it.
export const SEED_PROVENANCE_FIELD = "seededDemo";

const SEED_RECORDS_BY_COLLECTION = {
  clients: DEFAULT_CLIENTS,
  exercises: DEFAULT_EXERCISES,
  routines: DEFAULT_ROUTINES,
  history: DEFAULT_HISTORY,
  planUpdates: DEFAULT_PLAN_UPDATES,
  sessions: DEFAULT_SESSIONS,
  notifications: DEFAULT_MESSAGES,
};

const SEED_IDS_BY_COLLECTION = Object.fromEntries(
  Object.entries(SEED_RECORDS_BY_COLLECTION).map(([collection, records]) => [
    collection,
    new Set((records || []).map((record) => record.id).filter(Boolean)),
  ]),
);

export function seedIdsFor(collection) {
  return SEED_IDS_BY_COLLECTION[collection] ?? new Set();
}

/** Every collection that ships seed records — what a cleanup sweeps. */
export function seededCollections() {
  return Object.keys(SEED_RECORDS_BY_COLLECTION);
}

/**
 * Whether `record` came from the demo seed.
 *
 * The stamp wins when present, including when it is explicitly false: a record a trainer created
 * that happens to collide with a seed id is theirs, and saying so must be possible.
 */
export function isSeedRecord(collection, record) {
  if (!record || typeof record !== "object") return false;
  const stamped = record[SEED_PROVENANCE_FIELD];
  if (typeof stamped === "boolean") return stamped;
  return seedIdsFor(collection).has(record.id);
}

/**
 * A copy of `record` stamped as seeded. Copies rather than mutates: the DEFAULT_* arrays are module
 * singletons, and stamping them in place would mark the seed data itself for the lifetime of the
 * page — including the copy a later reseed hands out.
 */
export function stampAsSeeded(record) {
  return { ...record, [SEED_PROVENANCE_FIELD]: true };
}
