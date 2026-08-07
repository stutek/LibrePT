// src/data/stateStore.js - Application State Management & Storage Persistence
// Single responsibility: Manages central app state object, default state initialization,
// demo data seeding, IndexedDB-backed persistence (TODO §18.6 part 4), and database resets.
//
// The read model stays synchronous on purpose (see writeQueue.js's header): getState() always
// returns a fully hydrated, directly-mutable object shaped exactly as it always has, so none of
// the app's ~115 existing `state.<collection>.push(...)`-style call sites need to change. Only
// loading at boot and persisting on write move onto IndexedDB. True lazy per-client loading
// (§17.1's further win) is deliberately NOT part of this — it needs those call sites converted to
// an async per-client fetch, which is separate, larger follow-up work.

import {
  DEFAULT_CLIENTS,
  DEFAULT_EXERCISES,
  DEFAULT_HISTORY,
  DEFAULT_MESSAGES,
  DEFAULT_PLAN_UPDATES,
  DEFAULT_ROUTINES,
  DEFAULT_SESSIONS,
} from "./index.js";
import {
  COLLECTION_INDEX,
  DATABASE_NAME,
  META_STORE,
  deleteDatabase,
  get,
  getAll,
  getAllKeysFromIndex,
  openDatabase,
  storeNameForSchema,
  withTransaction,
} from "./indexedDb.js";
import { CURRENT_SCHEMA_VERSION } from "./migrationSteps.js";
import { COLLECTIONS, groupRecordsByCollection, projectCollection } from "./recordProjections.js";
import { LIVE_SCHEMAS, NEWEST_SCHEMA } from "./recordSchemas.js";
import { describeMigration, migrateState } from "./schemaMigrations.js";
import { readVersionScoped, writeVersionScoped } from "./storageNamespace.js";
import { enqueueWrite } from "./writeQueue.js";

let state = emptyState();
// What the last load's schema migration did (or refused to do) — read by the UI so an upgrade can
// be explained to the PT instead of happening invisibly. Null until a stored database is loaded.
let lastMigrationSummary = null;

export function getState() {
  return state;
}

export function getLastMigrationSummary() {
  return lastMigrationSummary;
}

export function setState(newState) {
  state = newState;
}

export function emptyState() {
  return {
    // Stamped so a database created by this build is never mistaken for a legacy (v1) one.
    schemaVersion: CURRENT_SCHEMA_VERSION,
    clients: [],
    exercises: [],
    routines: [],
    history: [],
    planUpdates: [],
    sessions: [],
    notifications: [],
    // null, not "en": the language nobody has chosen yet must stay distinguishable from a chosen
    // English, or the splash cannot tell who to offer the choice to (see i18n/index.js).
    lang: null,
  };
}

export function stateHasData(s = state) {
  return ["clients", "exercises", "routines", "history", "planUpdates", "sessions"].some(
    (k) => Array.isArray(s[k]) && s[k].length > 0,
  );
}

export function seedMockData() {
  const currentLang = state.lang || "en";
  state.clients = [...DEFAULT_CLIENTS];
  state.exercises = [...DEFAULT_EXERCISES];
  state.routines = [...DEFAULT_ROUTINES];
  state.history = [...DEFAULT_HISTORY];
  state.planUpdates = [...DEFAULT_PLAN_UPDATES];
  state.sessions = [...DEFAULT_SESSIONS];
  state.notifications = [...DEFAULT_MESSAGES];
  state.lang = currentLang;
  saveToLocalStorage();
}

// The plain localStorage key every build before this engine wrote (data/storageNamespace.js — no
// release-tag axis any more, TODO §16.5). It is the IMPORT SOURCE for the one-time move onto
// IndexedDB below — once imported it is never written to again, which is what keeps it a valid
// rollback snapshot for a build revert.
const DB_KEY = "librept_db";
const ACTIVE_SESSION_KEY = "librept_active_session";

const SCHEMAS = Object.keys(LIVE_SCHEMAS).map(Number);
const NEWEST_STORE = storeNameForSchema(NEWEST_SCHEMA);
const IMPORTED_META_KEY = "imported";
const LANG_META_KEY = "lang";

// Cached so boot and every subsequent save share one open connection rather than reopening it.
let dbPromise = null;

function indexedDbSupported() {
  return typeof globalThis.indexedDB !== "undefined" && globalThis.indexedDB !== null;
}

function getDb() {
  if (!dbPromise) dbPromise = openDatabase({ schemas: SCHEMAS });
  return dbPromise;
}

async function readMeta(db, key) {
  const tx = db.transaction([META_STORE], "readonly");
  return get(tx.objectStore(META_STORE), key);
}

// A save is a full re-projection of the current state, same as today's localStorage write already
// re-serializes the whole blob every call — but a per-record store cannot get that for free the way
// one blob key can: a record removed from `currentState[collection]` must be explicitly deleted, or
// it lingers in IndexedDB forever and reappears on the next read (this is the reconciliation the
// old engine got automatically from overwriting one key). Reads the CURRENT id set per collection
// from the newest schema store — every live schema shares the same id set by construction, so one
// read suffices for all of them — then star-writes the fan-out (put every current record) and the
// delete set (every id no longer present) into every live schema store plus meta bookkeeping, in
// one transaction (TODO §18's fan-out).
async function starWrite(db, currentState) {
  const staleIdsByCollection = {};
  const readTx = db.transaction([NEWEST_STORE], "readonly");
  const readStore = readTx.objectStore(NEWEST_STORE);
  for (const collection of COLLECTIONS) {
    const existingIds = await getAllKeysFromIndex(readStore, COLLECTION_INDEX, collection);
    const currentIds = new Set((currentState[collection] || []).map((record) => record.id));
    staleIdsByCollection[collection] = existingIds.filter((id) => !currentIds.has(id));
  }

  const storeNames = [...SCHEMAS.map(storeNameForSchema), META_STORE];
  return withTransaction(db, storeNames, "readwrite", ({ store }) => {
    for (const collection of COLLECTIONS) {
      for (const record of currentState[collection] || []) {
        const projected = projectCollection(collection, record);
        for (const schema of SCHEMAS) {
          store(storeNameForSchema(schema)).put(projected);
        }
      }
      for (const id of staleIdsByCollection[collection]) {
        for (const schema of SCHEMAS) {
          store(storeNameForSchema(schema)).delete(id);
        }
      }
    }
    store(META_STORE).put({ key: IMPORTED_META_KEY, value: true });
    // Persist the CHOSEN language verbatim, null included — coercing to "en" here would silently
    // record a choice the trainer never made, on the very first save.
    store(META_STORE).put({ key: LANG_META_KEY, value: currentState.lang ?? null });
  });
}

// Reassemble the in-memory `state` shape from the newest live schema's bucket — it is the
// lossless, canonical store; every older live schema is a pure projection of it (TODO §18.7).
async function readStateFromIndexedDb(db) {
  const tx = db.transaction([NEWEST_STORE], "readonly");
  const records = await getAll(tx.objectStore(NEWEST_STORE));
  const langEntry = await readMeta(db, LANG_META_KEY);
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...groupRecordsByCollection(records),
    lang: langEntry?.value ?? null,
  };
}

// Read the legacy localStorage blob, handling the pre-rename shim (openpt_* → librept_*).
function readLegacyBlob() {
  let savedData = readVersionScoped(DB_KEY);
  if (!savedData) {
    // Pre-rename shim (openpt_* → librept_*): it predates the "librept_" rename entirely.
    savedData = localStorage.getItem("openpt_db");
    if (savedData) {
      localStorage.setItem(DB_KEY, savedData);
      localStorage.removeItem("openpt_db");

      const activeSessionData = localStorage.getItem("openpt_active_session");
      if (activeSessionData) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionData);
        localStorage.removeItem("openpt_active_session");
      }
    }
  }
  return savedData;
}

// Parse + chain-migrate a legacy blob to CURRENT_SCHEMA_VERSION. Never throws: `ok:false` means
// the data must not be written back anywhere, per the same rule the old engine followed.
function migrateLegacyBlob(savedData) {
  if (!savedData) return { ok: true, state: emptyState(), summary: null };
  try {
    const parsed = JSON.parse(savedData);
    const { ok, state: migrated, summary } = migrateState(parsed);
    if (ok) return { ok: true, state: migrated, summary };
    console.error("Schema migration refused:", describeMigration(summary));
    return { ok: false, state: parsed, summary };
  } catch (e) {
    console.error("Error parsing local storage database. Starting empty.", e);
    return { ok: true, state: emptyState(), summary: null };
  }
}

function finalizeLoadedState(candidate) {
  if (!candidate.sessions) candidate.sessions = [];
  // `lang` is deliberately NOT defaulted here. An install that predates the language prompt has
  // "en" already written to its meta store and reads back as chosen; a fresh one reads null and
  // gets asked. Filling it in would erase that difference again.
  if (candidate.lang === undefined) candidate.lang = null;
  return candidate;
}

// The pre-IndexedDB engine, kept as the capability fallback for a browser/context with no
// IndexedDB (old browser, hostile private mode) — same behaviour the app always had.
function loadSavedStateFromLocalStorageOnly() {
  const { ok, state: result, summary } = migrateLegacyBlob(readLegacyBlob());
  lastMigrationSummary = summary;
  state = finalizeLoadedState(result);
  if (!ok) return state;
  return state;
}

export async function loadSavedState() {
  if (!indexedDbSupported()) {
    return loadSavedStateFromLocalStorageOnly();
  }

  let db;
  try {
    db = await getDb();
  } catch (e) {
    console.error("IndexedDB unavailable, falling back to localStorage.", e);
    dbPromise = null;
    return loadSavedStateFromLocalStorageOnly();
  }

  const imported = await readMeta(db, IMPORTED_META_KEY);
  if (!imported) {
    const { ok, state: migrated, summary } = migrateLegacyBlob(readLegacyBlob());
    lastMigrationSummary = summary;
    if (!ok) {
      // Never write back a database we could not migrate: leave IndexedDB empty so the next boot
      // retries, and use the raw data in memory for this session only.
      state = finalizeLoadedState(migrated);
      return state;
    }
    // Leave the localStorage bucket untouched — it is the rollback snapshot for a build revert
    // that still reads localStorage.
    await starWrite(db, migrated);
  }

  state = finalizeLoadedState(await readStateFromIndexedDb(db));
  return state;
}

// TODO §3.9's actual fix: a listener registered ONCE (app.js, at boot) rather than a callback each
// of the ~60 call sites across the app must remember to pass. `saveToLocalStorage()` is the one seam
// every write already goes through — some via this exact function imported directly, some via
// app.js's `saveState()` wrapper — so notifying here is notifying for all of them, unconditionally.
// The previous design (an optional `incrementLocalSyncFn` parameter) under-reported for exactly the
// reason a call-site-by-call-site convention always does: most callers didn't pass it.
let stateSavedListener = null;

export function onStateSaved(listener) {
  stateSavedListener = listener;
}

export function saveToLocalStorage() {
  if (indexedDbSupported()) {
    enqueueWrite(async () => {
      const db = await getDb();
      await starWrite(db, state);
    }, "state");
  } else {
    writeVersionScoped(DB_KEY, JSON.stringify(state));
  }
  // Fired immediately, not after the (possibly still-queued) IndexedDB write completes: `state` is
  // already mutated in memory at this point, which is all a live ahead-count diff needs.
  if (typeof stateSavedListener === "function") stateSavedListener();
}

// Google Drive sync's own bookkeeping (TODO §1.5/§3.3): the Drive file id and the merge ancestor
// snapshot (the state as of the last successful sync, used as the common ancestor for the next
// three-way merge — see syncMerge.js). Lives in META_STORE, not localStorage: the ancestor is a full
// domain snapshot, the same size class as the main database, and localStorage's ~5-10MB origin cap is
// exactly what IndexedDB was adopted to get away from (§18.6).
const DRIVE_SYNC_META_KEY = "driveSync";

export async function readDriveSyncMeta() {
  if (!indexedDbSupported()) return null;
  const db = await getDb();
  const entry = await readMeta(db, DRIVE_SYNC_META_KEY);
  return entry?.value || null;
}

export async function writeDriveSyncMeta(meta) {
  if (!indexedDbSupported()) return;
  const db = await getDb();
  await withTransaction(db, [META_STORE], "readwrite", ({ store }) => {
    store(META_STORE).put({ key: DRIVE_SYNC_META_KEY, value: meta });
  });
}

export async function resetLibrePTData(options = {}) {
  const { demo = true } = options || {};
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("librept") || k.startsWith("openpt")) localStorage.removeItem(k);
  }
  if (indexedDbSupported()) {
    dbPromise = null;
    try {
      await deleteDatabase(DATABASE_NAME);
    } catch (e) {
      console.error("Failed to delete IndexedDB database during reset.", e);
    }
  }
  const url = new URL(window.location.href);
  if (demo) {
    url.searchParams.set("init", "demo_data_load");
  } else {
    url.searchParams.delete("init");
  }
  window.location.href = url.toString();
}
