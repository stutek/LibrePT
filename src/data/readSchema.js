// src/data/readSchema.js — which live schema THIS INSTALL reads from, and keeping every other one
// ready to be read.
//
// The upgrade a trainer sees is a TOGGLE, not a wait. That is possible because the star-write
// fan-out already writes every live schema on every save (stateStore.js), so a newer schema's store
// is continuously current rather than something built at the moment of switching. Moving between
// schemas is therefore a read re-point: instantaneous, reversible, and incapable of losing a record
// because nothing is deleted and nothing is transformed in place.
//
// The one piece of real work is the BACKFILL. A store provisioned by an upgrade starts empty and
// only becomes current at the next save, so a newly live schema is filled once from the schema this
// install is reading today. That runs PRE-EMPTIVELY at boot — before the trainer opts into
// anything, per docs/DATA_MODEL.md §4 — so by the time the offer is made there is nothing left to
// do. It goes through the normal projection path (`read record → toDomainObject → projectCollection`)
// rather than copying rows, so the day a schema change needs a genuine transform, there is one
// place it lands and no second transform to drift from the write path.
//
// ONE TRANSACTION, not a resumable cursor. §4 describes a resumable backfill with the meta store
// holding a cursor; measured, this database does not need one — a full fan-out of the 90-record demo
// dataset takes ~22ms, and ~3,000 records (a busy trainer after several years) lands near 400ms.
// A single transaction is atomic, so an interruption commits nothing and the boot after it simply
// runs the backfill again. Revisit if a real install ever approaches ~50k records, where a single
// transaction starts to be a stall the trainer would notice.
//
// Injected dependencies: none — it takes an open database handle from its caller.

import {
  META_STORE,
  getAll,
  get as getMetaEntry,
  storeNameForSchema,
  withTransaction,
} from "./indexedDb.js";
import { COLLECTIONS, projectCollection, toDomainObject } from "./recordProjections.js";
import { DEFAULT_READ_SCHEMA, LIVE_SCHEMAS } from "./recordSchemas.js";

// localStorage, not the database: boot has to know WHICH store to read before it can read anything,
// so this cannot live in the thing it selects.
const READ_SCHEMA_KEY = "librept_read_schema";

// One marker per schema — "this store has been filled from an existing one and is safe to read".
// Absent means either never provisioned or interrupted mid-backfill; both want the same answer.
const BACKFILLED_KEY_PREFIX = "backfilled:";

export function liveSchemas() {
  return Object.keys(LIVE_SCHEMAS)
    .map(Number)
    .sort((a, b) => a - b);
}

function isLiveSchema(schema) {
  return liveSchemas().includes(Number(schema));
}

/**
 * The schema this install reads. Falls back to the build's default whenever the stored value is
 * absent, unparseable, or names a schema this build no longer carries — a build that retires a
 * schema must not strand an install that had opted into it.
 */
export function getReadSchema() {
  try {
    const stored = Number(localStorage.getItem(READ_SCHEMA_KEY));
    return isLiveSchema(stored) ? stored : DEFAULT_READ_SCHEMA;
  } catch {
    return DEFAULT_READ_SCHEMA;
  }
}

export function readStoreName() {
  return storeNameForSchema(getReadSchema());
}

/** Schemas above the one being read — what an "upgrade available" offer is built from. */
export function upgradableSchemas() {
  const current = getReadSchema();
  return liveSchemas().filter((schema) => schema > current);
}

function backfilledKey(schema) {
  return `${BACKFILLED_KEY_PREFIX}${schema}`;
}

async function isBackfilled(db, schema) {
  const entry = await getMetaEntry(
    db.transaction([META_STORE], "readonly").objectStore(META_STORE),
    backfilledKey(schema),
  );
  return entry?.value === true;
}

/**
 * Fill `schema`'s store from `sourceSchema`'s, marking it done in the SAME transaction as the
 * records — a marker written afterwards would let a kill between the two leave a store that claims
 * to be complete and is not.
 */
async function backfillSchema(db, schema, sourceSchema) {
  const sourceStore = storeNameForSchema(sourceSchema);
  const targetStore = storeNameForSchema(schema);
  const records = await getAll(db.transaction([sourceStore], "readonly").objectStore(sourceStore));

  await withTransaction(db, [targetStore, META_STORE], "readwrite", ({ store }) => {
    for (const record of records) {
      // Through the projection path rather than a row copy: this is where a real schema change's
      // transform will live, and routing it here now means the write path and the backfill can
      // never disagree about what a record of this schema looks like.
      const { collection } = record;
      if (!COLLECTIONS.includes(collection)) continue;
      store(targetStore).put(projectCollection(collection, toDomainObject(record)));
    }
    store(META_STORE).put({ key: backfilledKey(schema), value: true });
  });
}

/**
 * Pre-emptively ready every live schema, so an upgrade offer is never followed by a wait. Runs at
 * boot; a no-op on every boot after the first for a given schema, costing one meta read each.
 *
 * The schema currently being read is the source and is authoritative by definition — it is never
 * itself backfilled, which is what stops a newly provisioned empty store from overwriting the data.
 */
export async function ensureLiveSchemasBackfilled(db) {
  const source = getReadSchema();
  for (const schema of liveSchemas()) {
    if (schema === source) continue;
    if (await isBackfilled(db, schema)) continue;
    await backfillSchema(db, schema, source);
  }
}

/**
 * Move this install onto `schema`. Backfills first if the boot pass has not already — so the switch
 * cannot land on a store that is not ready — then persists the choice. Reversible: the schema being
 * left is still written by every save, so switching back is the same operation in reverse and needs
 * no migration either way.
 */
export async function setReadSchema(db, schema) {
  const target = Number(schema);
  if (!isLiveSchema(target)) {
    throw new Error(`schema ${schema} is not live in this build`);
  }
  if (target !== getReadSchema() && !(await isBackfilled(db, target))) {
    await backfillSchema(db, target, getReadSchema());
  }
  localStorage.setItem(READ_SCHEMA_KEY, String(target));
  return target;
}
