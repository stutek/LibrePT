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
import { COLLECTIONS } from "./recordProjections.js";

// The flag written onto every seeded record. Named for what it means to a reader of raw stored
// JSON, not for the function that sets it.
//
// Renamed from `seededDemo` on 2026-09-12, because that name was not true of every record carrying
// it: the same stamp goes on the rows the browser test suite seeds through `?init=demo_data_load`,
// and those are not a demo of anything. `testData` is true of both, and it is the word someone
// reading a backup file needs — a trainer's exported data with these rows in it can be handed to
// anything that strips them, and the field has to say plainly which rows are not the trainer's.
export const SEED_PROVENANCE_FIELD = "testData";

/** Where a seeded record came from, written into the stamp so the two cases can be told apart
 * afterwards. They look identical in the database and are wanted in different places:
 *
 *  - `demo` — the sample gym the trainer asked to see. It belongs in the sandbox, and a trainer
 *    who loaded it there did so on purpose.
 *  - `test` — the same rows written by the browser suite through `?init=demo_data_load`. Those
 *    belong in a test run and NOWHERE else; finding them in the working database means test data
 *    escaped into the trainer's own records (`escapedTestRecords` below).
 *
 * The origin can only be recorded when the record is WRITTEN — the rows are byte-identical, so
 * nothing can work it out later. */
export const DEMO_ORIGIN = "demo";
export const TEST_ORIGIN = "test";

// What the same stamp was called before that. Read, never written: two preview installs are on
// real trainers' devices with it in their databases, and they are already at schema "P", so the
// migration chain never runs over them again. Removable once neither of those two databases is
// live — which nothing in the app can detect, so it is a decision, not a check.
const LEGACY_PROVENANCE_FIELD = "seededDemo";

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
  const stamped = record[SEED_PROVENANCE_FIELD] ?? record[LEGACY_PROVENANCE_FIELD];
  // Any origin string, or the plain `true` older builds wrote. An explicit `false` is a record the
  // trainer made that happens to collide with a seed id, and it stays theirs.
  if (stamped === false) return false;
  if (stamped) return true;
  return seedIdsFor(collection).has(record.id);
}

/**
 * A copy of `record` stamped as seeded. Copies rather than mutates: the DEFAULT_* arrays are module
 * singletons, and stamping them in place would mark the seed data itself for the lifetime of the
 * page — including the copy a later reseed hands out.
 */
export function stampAsSeeded(record, origin = DEMO_ORIGIN) {
  return { ...record, [SEED_PROVENANCE_FIELD]: origin };
}

/** Where this record came from — `demo`, `test`, or null for a record that is nobody's seed.
 *
 * A record stamped by a build before the origin existed says `true`, which is honest about being
 * seeded and silent about which kind; it is read as a demo, the older and harmless of the two,
 * because raising the escape alarm on a database that predates the distinction would be a guess
 * dressed as a finding. */
export function seedOriginOf(record) {
  const stamped = record?.[SEED_PROVENANCE_FIELD] ?? record?.[LEGACY_PROVENANCE_FIELD];
  if (stamped === TEST_ORIGIN) return TEST_ORIGIN;
  if (stamped === DEMO_ORIGIN || stamped === true) return DEMO_ORIGIN;
  return null;
}

/**
 * The same state with every seeded record removed — "what of this is the trainer's own work?".
 *
 * Both counters that answer a question ABOUT THE TRAINER read state through this (TODO §28.5,
 * §28.6): §3.9's ahead count ("records not on Drive") and §3.8's unbacked-data warning ("this
 * exists in one evictable place"). Loading the demo tripped both, which was true about the records
 * and wrong about the person — a sales demo is not work to protect, and an indicator that fires
 * over one is an indicator a trainer learns to ignore.
 *
 * Non-collection fields (`lang`, `theme`, …) pass through, so the result stays state-shaped and can
 * be handed to anything that reads a whole state.
 */
/**
 * Whether this store is the demo and nothing else — the header badge's question (TODO §28.9).
 *
 * "Only the demo" rather than "any demo", because the badge names ONE state and PREVIEW is the
 * other candidate: a build that may lose data. Both are true after `?init=demo` on a fresh device,
 * and DEMO wins there because there is nothing of the trainer's to lose. The first record they
 * create makes the loss real, and PREVIEW takes the slot back.
 *
 * The seeded exercise catalog does not count as demo presence. `demoDataRemoval.js` keeps it by
 * default for the reason it states — 48 movements are a starter catalog, not a stain — so a trainer
 * who cleared the fake people has finished evaluating, and calling that a demo would be wrong.
 */
export function isDemoOnlyStore(state) {
  const demoPeopleAndWork = seededCollections()
    .filter((collection) => collection !== "exercises")
    .some((collection) =>
      (state?.[collection] || []).some((record) => isSeedRecord(collection, record)),
    );
  if (!demoPeopleAndWork) return false;

  const theirs = withoutSeedRecords(state);
  return COLLECTIONS.every((collection) => (theirs[collection] || []).length === 0);
}

/**
 * Test rows sitting in the trainer's own database — the safety valve (TODO §46.7).
 *
 * Returns `{ count, collections }`, both empty when the store is clean. A row counts only when its
 * stamp says `test`: those are written by `?init=demo_data_load` and belong to a test run and
 * nothing else. Demo rows are not counted — a trainer who loaded the sample gym did so on purpose,
 * and it lives in the sandbox.
 *
 * **This cannot tell you whether a test is running, and does not try.** Nothing in a browser can:
 * the app is the same app under Playwright as under a thumb. What it reads is a fact already
 * written down — which switch wrote this row — and the CALLER supplies the other half: the working
 * workspace, and a boot that carries no `?init=`. A test run carries that switch on every
 * navigation, so it never sees the alarm; a trainer's install never carries it, so a single test
 * row shows up the moment the app opens.
 */
export function escapedTestRecords(state) {
  const collections = COLLECTIONS.filter((collection) =>
    (state?.[collection] || []).some((record) => seedOriginOf(record) === TEST_ORIGIN),
  );
  const count = collections.reduce(
    (total, collection) =>
      total +
      (state[collection] || []).filter((record) => seedOriginOf(record) === TEST_ORIGIN).length,
    0,
  );
  return { count, collections };
}

export function withoutSeedRecords(state) {
  const mine = { ...state };
  for (const collection of COLLECTIONS) {
    mine[collection] = (state?.[collection] || []).filter(
      (record) => !isSeedRecord(collection, record),
    );
  }
  return mine;
}
