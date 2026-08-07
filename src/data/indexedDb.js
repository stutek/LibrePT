// src/data/indexedDb.js — the low-level IndexedDB adapter (TODO §18.6).
// Single responsibility: open the database with the right shape, and wrap IndexedDB's event-based
// API in promises. It knows nothing about clients, sessions or schemas' MEANING — only that a schema
// major names an object store.
//
// **Why IndexedDB.** §3.7 deferred a real engine until "the 5 MB cap looms"; §17.1 shipped the full
// structured program record and it now does — a very busy PT reaches ~16.6 MiB/yr in a single bucket
// (§18.6's sizing), and §18's star writes multiply that by the number of live schemas. IndexedDB adds
// **zero bytes** to the install (it is the platform, present in every browser and mobile webview),
// works offline and inside the Service Worker, and its quota is orders of magnitude clear of those
// figures. SQLite-in-wasm was rejected: it would roughly double a 1,040 KB `src/`, and it brings the
// binary/VFS/header configuration this design is specifically trying not to have.
//
// **The layout is a correctness constraint, not a preference (§18.6).** ONE database, with one object
// store per schema major. IndexedDB transactions cannot span *databases* — so giving each schema its
// own database would make an atomic star write impossible by construction, and that is expensive to
// discover later. One database means a single transaction can write every live schema at once, which
// is what makes the fan-out crash-safe when the phone locks mid-session.
//
// **The transaction gotcha, stated once here because it is silent when you get it wrong (§18.9):** an
// IndexedDB transaction auto-closes as soon as the event loop yields to anything that is not one of
// its own requests. `await`ing a fetch, a timer, or any non-IDB promise inside a transaction ends it,
// and the writes that follow throw `TransactionInactiveError` — or worse, were never going to run.
// `withTransaction` below therefore hands the callback the transaction and expects it to issue IDB
// requests only; do the computing before you open it.
//
// Injected dependencies: `factory` (defaults to globalThis.indexedDB) and `name`, so tests can run
// against a throwaway database without touching the app's.

export const DATABASE_NAME = "librept";

// Records carry their collection and owner alongside the payload so one store per schema can serve
// three distinct query shapes without a second store per collection:
//   - COLLECTION_INDEX  "the whole exercise catalog" — no client dimension at all.
//   - CLIENT_INDEX      "everything about client X, any collection" — §17.3 erasure/anonymization
//                        needs exactly this: every record type touched for one client, unnarrowed.
//   - CLIENT_COLLECTION_INDEX  "client X's HISTORY specifically" — §17.1's actual stated need.
//     CLIENT_INDEX alone cannot serve this: a client with both history and planUpdates records
//     returns both collections interleaved, so isolating one would cost deserialising and then
//     filtering out records the caller never wanted. The compound index answers it as one exact
//     index hit instead (see test_indexed_db.py, which pins the isolation against a fixture where
//     one client has both a history record and a planUpdates record).
export const COLLECTION_INDEX = "byCollection";
export const CLIENT_INDEX = "byClient";
export const CLIENT_COLLECTION_INDEX = "byClientAndCollection";

// Bookkeeping that belongs to no single schema: the migration id mapping (§18.2), and per-bucket
// counters. Kept in its own store so a schema store holds only records.
export const META_STORE = "meta";

export function storeNameForSchema(schema) {
  return `schema${schema}`;
}

/**
 * The IndexedDB version number for a given set of live schemas.
 *
 * Derived from the highest schema rather than maintained by hand: provisioning a new schema is the
 * only thing that changes the store layout, so it is also the only thing that should trigger
 * `onupgradeneeded`. IndexedDB requires this to increase monotonically, which it does — schemas are
 * only ever added, and retiring an old one does not lower the maximum.
 */
export function databaseVersion(schemas) {
  return Math.max(1, ...schemas.map(Number));
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createSchemaStore(db, schema) {
  const store = db.createObjectStore(storeNameForSchema(schema), { keyPath: "id" });
  store.createIndex(COLLECTION_INDEX, "collection", { unique: false });
  // Non-unique and sparse: records with no owner (the exercise catalog) simply do not appear in it,
  // which is what makes a per-client load cheap rather than a full scan with a filter.
  store.createIndex(CLIENT_INDEX, "clientId", { unique: false });
  // Compound, in [clientId, collection] order: a record missing EITHER path is absent from a
  // multi-path index (same sparseness as CLIENT_INDEX, extended), and client-first is what would
  // let a future range query ask "everything for this client" through this same index too, should
  // CLIENT_INDEX's whole-client scan ever need to be ordered rather than just enumerated.
  store.createIndex(CLIENT_COLLECTION_INDEX, ["clientId", "collection"], { unique: false });
  return store;
}

/**
 * Open the database, provisioning a store for every schema in `schemas`.
 *
 * Provisioning is additive and idempotent: stores for schemas that already exist are left untouched,
 * so opening with a longer list only ever adds. Retired schemas are NOT dropped here — deleting a
 * bucket is a deliberate act with its own confirmation (§16.2's per-version discard), never a side
 * effect of an app that happens to boot with a shorter list.
 */
// `version` is normally derived from the schema list, because provisioning a store is the only
// thing that should trigger an upgrade. The preview database (data/previewSchema.js) overrides it:
// its store set is keyed by commit rather than by schema number, so it is REPLACED (deleted and
// recreated at version 1) rather than upgraded — and it must never pull the main database's
// monotonically-increasing version along with it.
export function openDatabase({
  schemas,
  factory = globalThis.indexedDB,
  name = DATABASE_NAME,
  version = null,
} = {}) {
  if (!factory) return Promise.reject(new Error("IndexedDB is unavailable"));
  if (!Array.isArray(schemas) || schemas.length === 0) {
    return Promise.reject(new Error("openDatabase needs at least one schema"));
  }

  const request = factory.open(name, version ?? databaseVersion(schemas));

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(META_STORE)) {
      db.createObjectStore(META_STORE, { keyPath: "key" });
    }
    for (const schema of schemas) {
      if (!db.objectStoreNames.contains(storeNameForSchema(schema))) {
        createSchemaStore(db, schema);
      }
    }
  };

  return requestToPromise(request);
}

/**
 * Run `work` inside one transaction spanning `storeNames`, resolving once the transaction COMMITS.
 *
 * Resolving on commit rather than on the last request's success is the point: a request can succeed
 * and the transaction still abort afterwards (quota, a later failure in the same transaction), and a
 * caller that treated request-success as durable would report a write that did not happen.
 *
 * `work` receives a `store(name)` accessor and must issue IDB requests only — see the transaction
 * gotcha in this module's header.
 */
export function withTransaction(db, storeNames, mode, work) {
  return new Promise((resolve, reject) => {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const tx = db.transaction(names, mode);
    let result;

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("transaction aborted"));

    try {
      result = work({
        store: (name) => tx.objectStore(name),
        transaction: tx,
      });
    } catch (err) {
      // An exception in `work` must not leave the transaction to commit a partial write.
      try {
        tx.abort();
      } catch {
        /* already aborting */
      }
      reject(err);
    }
  });
}

// ---- Request helpers ---------------------------------------------------------------------------
// Thin promise wrappers over the IDBRequest forms this app actually uses. They are only safe to
// await OUTSIDE a transaction callback; inside one, issue the request and let the transaction's
// completion be the thing you wait on.

export function put(store, record) {
  return requestToPromise(store.put(record));
}

export function get(store, key) {
  return requestToPromise(store.get(key));
}

export function getAllFromIndex(store, indexName, key) {
  return requestToPromise(store.index(indexName).getAll(key));
}

// Keys only, no deserialization — cheap enough to compute "what's currently in this collection" on
// every save, which is what lets a save RECONCILE (delete records no longer present) rather than
// only ever add/update (TODO §18.6 part 4's star write must remove, not just append).
export function getAllKeysFromIndex(store, indexName, key) {
  return requestToPromise(store.index(indexName).getAllKeys(key));
}

// Every record in a store, unfiltered — the boot-time read that reassembles the in-memory `state`
// object from the newest schema's bucket (TODO §18.6 part 4). Safe to await outside a transaction
// callback, same as the other request helpers in this section.
export function getAll(store) {
  return requestToPromise(store.getAll());
}

export function countInIndex(store, indexName, key) {
  return requestToPromise(store.index(indexName).count(key));
}

export function countAll(store) {
  return requestToPromise(store.count());
}

export function deleteDatabase(name = DATABASE_NAME, factory = globalThis.indexedDB) {
  return requestToPromise(factory.deleteDatabase(name));
}
