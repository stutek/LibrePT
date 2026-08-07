// src/data/previewSchema.js — opt-in preview of an in-development data shape.
//
// A trainer opts in, works normally against the next schema's shape, and opts back out. NO SEQUENCE
// OF TOGGLES MAY LOSE A RECORD. That guarantee is structural rather than careful, and rests on
// three things, none of which live in this file by accident:
//
//   1. Reads are pinned to a DECLARED schema (recordSchemas.js's READ_SCHEMA), never derived from
//      registry membership — so a preview store can never become canonical by accident.
//   2. Writes star-fan-out and compare no versions (stateStore.js's starWrite) — so a record
//      created while previewing is ALREADY in the canonical store. Opting back out is therefore
//      NOT A MIGRATION: it is a read re-point plus a database delete.
//   3. This store is DISPOSABLE, so it can be keyed by the commit that built it (BUILD_INFO.commit)
//      and thrown away whenever that changes. Rebuilding is never data loss, only recomputation.
//
// Its own IndexedDB database, not a store inside the main one. A preview shape changes with every
// build, and a new store inside the shared database would mean an `onupgradeneeded` — and therefore
// a permanent version bump on the database holding the trainer's real data — on every preview
// release. Fifty previews would leave that database at version 50-something, diverging per install,
// with `databaseVersion` never again derivable from schema numbers. A separate database is deleted
// and recreated atomically, costs the real one nothing, and stays at version 1 forever because it
// is replaced rather than upgraded.
//
// RESTARTABLE, NOT RESUMABLE. The projection is ONE transaction, so an interruption commits
// nothing and leaves no partial state to resume from; recovery is simply to rebuild from the
// canonical store, which is intact by construction. This is why there is no progress bookkeeping
// here, and why chunking the projection behind an "X of Y" progress bar would REMOVE the property
// rather than report on it. Measured for scale: a full fan-out of the 90-record demo dataset into
// two stores takes ~22ms; ~3,000 records lands near 400ms.
//
// Injected dependencies: none — it owns its own database handle, and takes the records to project
// as an argument so it never reaches into app state.

import { BUILD_INFO } from "../version.js";
import {
  DATABASE_NAME,
  META_STORE,
  deleteDatabase,
  get,
  getAll,
  openDatabase,
  storeNameForSchema,
  withTransaction,
} from "./indexedDb.js";
import { LIVE_SCHEMAS, READ_SCHEMA } from "./recordSchemas.js";

export const PREVIEW_DB_NAME = "librept-preview";

// The store label inside the preview database. A string, never a number: it must be impossible for
// this to be mistaken for a schema major, and `Math.max` over the numbered registry must never be
// able to see it (a numeric sentinel like 999999 would pin the real database's version forever —
// verified: opening at 999999 then at 4 fails with VersionError).
const PREVIEW_LABEL = "preview";
const PREVIEW_STORE = storeNameForSchema(PREVIEW_LABEL);

// Replaced, never upgraded — so the version is a constant rather than derived from anything.
const PREVIEW_DB_VERSION = 1;

export const PRODUCED_BY_META_KEY = "producedBy";
export const COMPLETE_META_KEY = "complete";

// The opt-in itself lives in localStorage, not in either database: it must be readable before any
// database is opened (boot decides which store to read FROM), and it must survive the preview
// database being deleted underneath it.
const OPT_IN_KEY = "librept_preview_optin";

let previewDbPromise = null;

export function isPreviewEnabled() {
  try {
    return localStorage.getItem(OPT_IN_KEY) === "1";
  } catch {
    // A hostile private mode with no storage simply has no preview mode.
    return false;
  }
}

function setOptIn(enabled) {
  if (enabled) localStorage.setItem(OPT_IN_KEY, "1");
  else localStorage.removeItem(OPT_IN_KEY);
}

function openPreviewDb() {
  if (!previewDbPromise) {
    previewDbPromise = openDatabase({
      schemas: [PREVIEW_LABEL],
      name: PREVIEW_DB_NAME,
      version: PREVIEW_DB_VERSION,
    });
  }
  return previewDbPromise;
}

// Closing the cached handle FIRST is not tidiness — `deleteDatabase` resolves on `onsuccess`, which
// never fires while any connection is open (the request goes `onblocked` and stays pending forever).
// The boot path hits this every time: the "is this store current?" probe opens the database, and the
// rebuild that its answer triggers would then wait on itself.
async function dropPreviewDb() {
  const pending = previewDbPromise;
  previewDbPromise = null;
  if (pending) {
    try {
      (await pending).close();
    } catch {
      // Already closed, or never opened — either way there is nothing holding the delete.
    }
  }
  try {
    await deleteDatabase(PREVIEW_DB_NAME);
  } catch (e) {
    console.error("Failed to delete the preview database.", e);
  }
}

/**
 * The canonical records, read straight from the main database's READ_SCHEMA store.
 *
 * Read here rather than passed in by stateStore, because stateStore imports THIS module — taking
 * the records as an argument would push the sourcing onto every caller and make `enablePreview()`
 * impossible to call on its own. Opening by name with the same schema list computes the same
 * version, so this is an extra connection to the same database, never an upgrade of it.
 */
async function readCanonicalRecords() {
  const db = await openDatabase({
    schemas: Object.keys(LIVE_SCHEMAS).map(Number),
    name: DATABASE_NAME,
  });
  const storeName = storeNameForSchema(READ_SCHEMA);
  const records = await getAll(db.transaction([storeName], "readonly").objectStore(storeName));
  db.close();
  return records;
}

/**
 * Project the canonical records into a freshly rebuilt preview store.
 *
 * The completion marker is written INSIDE the same transaction as the records — that is what makes
 * "was this store finished?" answerable at all. Written afterwards, a kill between the two would
 * leave a store that looks complete and is not.
 */
async function projectIntoPreview() {
  const records = await readCanonicalRecords();
  await dropPreviewDb(); // rebuild from empty: stale ids must not survive a re-projection
  const db = await openPreviewDb();
  await withTransaction(db, [PREVIEW_STORE, META_STORE], "readwrite", ({ store }) => {
    for (const record of records) store(PREVIEW_STORE).put(record);
    store(META_STORE).put({ key: PRODUCED_BY_META_KEY, value: BUILD_INFO.commit });
    store(META_STORE).put({ key: COMPLETE_META_KEY, value: true });
  });
}

async function readPreviewMeta(key) {
  const db = await openPreviewDb();
  const entry = await get(db.transaction([META_STORE], "readonly").objectStore(META_STORE), key);
  return entry?.value ?? null;
}

/**
 * Whether the preview store is usable as-is: present, finished, and built by THIS commit. Anything
 * else is rebuilt rather than adopted — a store left by another build may hold a shape this one
 * does not understand, and a store that was never marked complete was interrupted mid-projection.
 */
async function previewStoreIsCurrent() {
  try {
    const [complete, producedBy] = await Promise.all([
      readPreviewMeta(COMPLETE_META_KEY),
      readPreviewMeta(PRODUCED_BY_META_KEY),
    ]);
    return complete === true && producedBy === BUILD_INFO.commit;
  } catch {
    return false;
  }
}

/**
 * Boot-time reconciliation, called with the canonical records once they are known. Rebuilds the
 * preview store when it is missing, unfinished, or from another build; leaves it alone otherwise.
 * A no-op when the trainer has not opted in — someone who never asked for preview pays nothing:
 * no database, no extra write per record, no boot probe beyond one localStorage read.
 */
export async function ensurePreviewStoreCurrent() {
  if (!isPreviewEnabled()) return false;
  if (await previewStoreIsCurrent()) return false;
  await projectIntoPreview();
  return true;
}

/** Opt in: provision and project, so the store is usable the moment this resolves. */
export async function enablePreview() {
  setOptIn(true);
  await projectIntoPreview();
}

/**
 * Opt out: stop reading preview FIRST, then delete. The order matters — a failure to delete must
 * leave the trainer on canonical data rather than reading a store the app no longer maintains.
 */
export async function disablePreview() {
  setOptIn(false);
  await dropPreviewDb();
}

/** Every record in the preview store, in the same flat shape the canonical read path returns. */
export async function readPreviewRecords() {
  const db = await openPreviewDb();
  return getAll(db.transaction([PREVIEW_STORE], "readonly").objectStore(PREVIEW_STORE));
}

/**
 * Mirror one save into the preview store. Deliberately a SEPARATE transaction from the canonical
 * star-write (different database — they cannot share one), and deliberately best-effort: the
 * canonical write has already committed by the time this runs, so a failure here costs a rebuild
 * on the next boot, never a record.
 */
export async function mirrorIntoPreview(records, staleIds) {
  if (!isPreviewEnabled()) return;
  try {
    const db = await openPreviewDb();
    await withTransaction(db, [PREVIEW_STORE], "readwrite", ({ store }) => {
      for (const record of records) store(PREVIEW_STORE).put(record);
      for (const id of staleIds) store(PREVIEW_STORE).delete(id);
    });
  } catch (e) {
    // Not fatal, and not silent: the store is marked stale so the next boot rebuilds it.
    console.error("Preview mirror failed; it will be rebuilt on next start.", e);
    await invalidatePreviewStore();
  }
}

async function invalidatePreviewStore() {
  try {
    const db = await openPreviewDb();
    await withTransaction(db, [META_STORE], "readwrite", ({ store }) => {
      store(META_STORE).put({ key: COMPLETE_META_KEY, value: false });
    });
  } catch {
    // If even that fails the database is unusable, which the next boot's probe treats as stale too.
  }
}

// --- test hooks -------------------------------------------------------------------------------
// Simulating "a store built by a different commit" and "killed mid-projection" has no honest route
// through the public API — both are states the app is built never to produce. Prefixed so they read
// as what they are at every call site.

export async function __setProducedByForTest(commit) {
  const db = await openPreviewDb();
  await withTransaction(db, [META_STORE], "readwrite", ({ store }) => {
    store(META_STORE).put({ key: PRODUCED_BY_META_KEY, value: commit });
  });
}

export function __producedByForTest() {
  return readPreviewMeta(PRODUCED_BY_META_KEY);
}

export async function __clearCompleteMarkerForTest() {
  await invalidatePreviewStore();
}

export async function __isCompleteForTest() {
  return (await readPreviewMeta(COMPLETE_META_KEY)) === true;
}
