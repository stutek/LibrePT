// src/data/previewTransfer.js — the one-time move of records only a P store holds into schema 4 (TODO §61).
//
// Single responsibility: on an install that still has a `schemaP` store, copy into `schema4` every
// record the P store has and `schema4` does not, once, and remember that it was done.
//
// **Why it exists.** Until 2026-09-17 two collections — invitations and the rules of repeating
// sessions — were declared only in the preview schema P, so every install held them in its P store
// alone, and no backup carried them. Ruled that day (Simon): schema 4 is the live schema, it takes
// both collections, and nothing an install holds may be lost. Declaring them in schema 4 makes every
// LATER write reach it; this brings over what was written before.
//
// **P is not PREVIEW.** P here means the preview store existing installs were written with. The
// PREVIEW schema that replaces it is a different thing — a dead branch for CI and previews, never a
// step between two live versions — and this transfer has nothing to do with it.
//
// **Dead code on an install with no P store**, which is every install created after P is gone: it
// returns before reading anything. Records the P store holds that `schema4` already has are left
// alone; the star write has kept those two copies equal on every save.
//
// Not a step of `migrateState`: that chain runs on backup files and on an install's first move into
// IndexedDB, never on a phone's later boots, which is where this data sits.
//
// Injected dependencies: the open database.

import {
  META_STORE,
  getAll,
  get as getMetaEntry,
  storeNameForSchema,
  withTransaction,
} from "./indexedDb.js";
import {
  COLLECTIONS,
  projectCollection,
  schemaAcceptsCollection,
  toDomainObject,
} from "./recordProjections.js";
import { LIVE_SCHEMAS, STABLE_SCHEMA } from "./recordSchemas.js";

const LEGACY_PREVIEW = "P";
const TRANSFERRED_KEY = "transferredFromP";

/** Copies what only the P store holds into the stable store, once. Returns how many records moved. */
export async function transferRecordsOnlyInPreview(db) {
  const source = storeNameForSchema(LEGACY_PREVIEW);
  const target = storeNameForSchema(STABLE_SCHEMA);
  if (!db.objectStoreNames.contains(source) || !db.objectStoreNames.contains(target)) return 0;

  const done = await getMetaEntry(
    db.transaction([META_STORE], "readonly").objectStore(META_STORE),
    TRANSFERRED_KEY,
  );
  if (done?.value === true) return 0;

  const inPreview = await getAll(db.transaction([source], "readonly").objectStore(source));
  const inStable = new Set(
    (await getAll(db.transaction([target], "readonly").objectStore(target))).map(
      (record) => record.id,
    ),
  );
  const stable = LIVE_SCHEMAS[STABLE_SCHEMA];
  const missing = inPreview.filter(
    (record) =>
      !inStable.has(record.id) &&
      COLLECTIONS.includes(record.collection) &&
      schemaAcceptsCollection(stable, record.collection),
  );

  // The records and the marker in ONE transaction: a kill between the two must leave either both
  // or neither, or a later boot would find the marker and never move what was left behind.
  await withTransaction(db, [target, META_STORE], "readwrite", ({ store }) => {
    for (const record of missing) {
      store(target).put(projectCollection(record.collection, toDomainObject(record)));
    }
    store(META_STORE).put({ key: TRANSFERRED_KEY, value: true });
  });
  return missing.length;
}
