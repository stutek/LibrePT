// src/data/readSchema.js — which live schema THIS INSTALL reads from, and keeping every other one
// ready to be read.
//
// Every install reads the newest numbered schema, whatever app version the trainer runs (TODO §76);
// the per-install choice kept here is for the test passes that read PREVIEW or pin the released
// shape, and nothing offers it to a trainer. Moving between stores is a read re-point: the star-write
// fan-out writes every live schema on every save (stateStore.js), so every filled store is current.
//
// The one piece of real work is the BACKFILL. A store a new build provisions starts empty and only
// becomes current at the next save, so a newly live schema is filled once, at boot and before
// anything reads, from the numbered schema just below it (`ensureLiveSchemasBackfilled`). It goes
// through the normal projection path (`read record → toDomainObject → projectCollection`) rather
// than copying rows, so the day a schema change needs a genuine transform, there is one place it
// lands and no second transform to drift from the write path.
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
import { PREVIEW_VERSION } from "./migrationSteps.js";
import { COLLECTIONS, projectCollection, toDomainObject } from "./recordProjections.js";
import {
  DEFAULT_READ_SCHEMA,
  LIVE_SCHEMAS,
  STABLE_SCHEMA,
  narrowToSchema,
} from "./recordSchemas.js";

// localStorage, not the database: boot has to know WHICH store to read before it can read anything,
// so this cannot live in the thing it selects.
const READ_SCHEMA_KEY = "librept_read_schema";

// One marker per schema — "this store has been filled from an existing one and is safe to read".
// Absent means either never provisioned or interrupted mid-backfill; both want the same answer.
const BACKFILLED_KEY_PREFIX = "backfilled:";

// Numbered schemas first, ascending, with PREVIEW last — it is the newest shape by construction, and
// ordering it by string would put it before every number.
export function liveSchemas() {
  const keys = Object.keys(LIVE_SCHEMAS);
  const numbered = keys
    .filter((key) => Number.isFinite(Number(key)))
    .map(Number)
    .sort((a, b) => a - b);
  const named = keys.filter((key) => !Number.isFinite(Number(key)));
  return [...numbered, ...named];
}

function isLiveSchema(schema) {
  // Compared as strings: a schema is either a number or "PREVIEW", and Number("PREVIEW") is NaN.
  return liveSchemas().some((live) => String(live) === String(schema));
}

/**
 * The schema this install reads. Falls back to the build's default whenever the stored value is
 * absent, unparseable, or names a schema this build no longer carries — a build that retires a
 * schema must not strand an install that had opted into it.
 */
export function getReadSchema() {
  try {
    const stored = localStorage.getItem(READ_SCHEMA_KEY);
    if (!isLiveSchema(stored)) return DEFAULT_READ_SCHEMA;
    // Hand back the live key itself, so a numbered schema stays a number and PREVIEW stays a string.
    return liveSchemas().find((live) => String(live) === String(stored));
  } catch {
    return DEFAULT_READ_SCHEMA;
  }
}

export function readStoreName() {
  return storeNameForSchema(getReadSchema());
}

/** Schemas above the one being read — what an "upgrade available" offer is built from. */
/** Schemas listed after the one being read — what an "upgrade available" offer is built from. */
export function upgradableSchemas() {
  const ordered = liveSchemas();
  return ordered.slice(ordered.indexOf(getReadSchema()) + 1);
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
      store(targetStore).put(
        narrowToSchema(projectCollection(collection, toDomainObject(record)), collection, schema),
      );
    }
    store(META_STORE).put({ key: backfilledKey(schema), value: true });
  });
}

/**
 * Fill every NUMBERED live schema that this install has never filled, each from the numbered schema
 * just below it, before anything reads. Runs at boot; a no-op on every boot after the first for a
 * given schema, costing one meta read each.
 *
 * **The source is the schema BELOW, never the schema being read.** The two were the same thing while
 * every install read the lowest schema. The day a build reads a NEW schema (TODO §76: every install
 * reads the newest), the schema being read is the empty one — taking it as the source copied nothing
 * into it, marked the older store as filled from it, and the trainer saw an empty app. The schema
 * below is complete on every install that ran the build before this one, because that build's star
 * write kept every live store current. Ascending order carries a jump of two numbers: 5 is filled
 * from 4 before 6 is filled from 5. The lowest numbered schema is the one data has always been in,
 * and is never a target.
 *
 * PREVIEW is left out: it is emptied when the build changes and filled only for an install that reads
 * it (`refreshPreviewStoreIfBuildChanged`), or at activation, so filling it here would be work undone.
 */
export async function ensureLiveSchemasBackfilled(db) {
  const numbered = liveSchemas().filter((schema) => String(schema) !== String(PREVIEW_VERSION));
  for (let index = 1; index < numbered.length; index++) {
    const schema = numbered[index];
    if (await isBackfilled(db, schema)) continue;
    await backfillSchema(db, schema, numbered[index - 1]);
  }
}

// The build that last wrote the preview store. Absent means unknown, which counts as changed.
const PREVIEW_BUILD_KEY = "previewBuild";

/**
 * Throw the PREVIEW store away when the build has changed, and refill it only for an install that
 * reads it.
 *
 * Ruled 2026-09-17/18 (Simon, TODO §61): PREVIEW is for CI and for previewing an upcoming version,
 * never live for a client, and it is emptied when the build number changes. Within one build it is
 * kept, because a preview session spans reloads — CI's second pass reads it across every navigation,
 * and emptying at every start left it reading an empty store.
 *
 * Filled only where it is READ: at activation (`setReadSchema`) or here, for an install already on it.
 * Filling a store nobody has asked for would put a projection pass on every start for every trainer —
 * measured at 22ms for the 90-record demo set and about 400ms at 3,000 records.
 *
 * An ABSENT marker counts as changed: a database written before this bookkeeping existed cannot say
 * which build produced it, and "unknown" must resolve to the safe branch. Its fields can change on any
 * commit, so a store written by another build cannot be trusted to have the shape this build expects —
 * and there is no migration to fix that, because PREVIEW is never a version migrations run between.
 * Anything that exists only in PREVIEW, such as `previewProbe`, goes with the discard, which is the
 * same cost the backup and sync surfaces warn about.
 */
export async function refreshPreviewStoreIfBuildChanged(db, currentBuildSha) {
  const previewStore = storeNameForSchema(PREVIEW_VERSION);
  if (!db.objectStoreNames.contains(previewStore)) return { cleared: false, filled: false };

  const entry = await getMetaEntry(
    db.transaction([META_STORE], "readonly").objectStore(META_STORE),
    PREVIEW_BUILD_KEY,
  );
  const storedBuild = entry?.value ?? null;
  const stale = !(storedBuild && currentBuildSha && storedBuild === currentBuildSha);

  if (stale) {
    // The rows, the "backfilled" marker and the build stamp go in ONE transaction: a kill between
    // them would leave an empty store still claiming to be complete, which a later activation reads
    // as ready.
    await withTransaction(db, [previewStore, META_STORE], "readwrite", ({ store }) => {
      store(previewStore).clear();
      store(META_STORE).delete(backfilledKey(PREVIEW_VERSION));
      store(META_STORE).put({ key: PREVIEW_BUILD_KEY, value: currentBuildSha ?? null });
    });
  }

  if (String(getReadSchema()) !== String(PREVIEW_VERSION)) return { cleared: stale, filled: false };
  // Fill it whenever this install READS preview and the store is not ready — emptied a moment ago,
  // or provisioned empty by this very boot. Without the second case an install already on PREVIEW
  // came up reading an empty store the first time this build gave it one (found 2026-09-19 by the
  // PREVIEW pass of §62, on the frozen P-era device database).
  if (await isBackfilled(db, PREVIEW_VERSION)) return { cleared: stale, filled: false };
  await backfillSchema(db, PREVIEW_VERSION, STABLE_SCHEMA);
  return { cleared: stale, filled: true };
}

/**
 * Move this install onto `schema` — the ACTIVATION a preview schema is filled by (TODO §61). Backfills
 * first if the boot pass has not already — so the switch cannot land on a store that is not ready —
 * then persists the choice. Reversible: the schema being
 * left is still written by every save, so switching back is the same operation in reverse and needs
 * no migration either way.
 */
export async function setReadSchema(db, schema) {
  const target = liveSchemas().find((live) => String(live) === String(schema)) ?? schema;
  if (!isLiveSchema(target)) {
    throw new Error(`schema ${schema} is not live in this build`);
  }
  if (target !== getReadSchema() && !(await isBackfilled(db, target))) {
    await backfillSchema(db, target, getReadSchema());
  }
  localStorage.setItem(READ_SCHEMA_KEY, String(target));
  return target;
}
