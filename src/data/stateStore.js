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

import { BUILD_INFO } from "../version.js";
import { fingerprintState } from "./backupHealth.js";
import { applyDemoRemoval, brokenDependenciesAfter, planDemoRemoval } from "./demoDataRemoval.js";
import { localiseDemoRecords } from "./demoText.js";
import {
  DEFAULT_CLIENTS,
  DEFAULT_EXERCISES,
  DEFAULT_HISTORY,
  DEFAULT_MESSAGES,
  DEFAULT_PLAN_UPDATES,
  DEFAULT_ROUTINES,
  DEFAULT_SESSIONS,
  DEFAULT_SESSION_SERIES,
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
import {
  ensureLiveSchemasBackfilled,
  liveSchemas,
  readStoreName,
  rebuildPreviewSchemaIfBuildChanged,
} from "./readSchema.js";
import {
  COLLECTIONS,
  groupRecordsByCollection,
  projectCollection,
  schemaAcceptsCollection,
} from "./recordProjections.js";
import { LIVE_SCHEMAS } from "./recordSchemas.js";
import { describeMigration, migrateState } from "./schemaMigrations.js";
import { DEMO_ORIGIN, stampAsSeeded } from "./seedProvenance.js";
import { clearWorkspaceKeys, readVersionScoped, writeVersionScoped } from "./storageNamespace.js";
import {
  SANDBOX,
  activeWorkspace,
  databaseNameFor,
  isWorkspace,
  setActiveWorkspace,
} from "./workspace.js";
import { enqueueWrite, flushWrites } from "./writeQueue.js";

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
    // Invitations sent, and the answers that came back (TODO §1.6). Separate from `sessions` because
    // an RSVP is a fact about a message, and separate from `clients` because the same person answers
    // differently per session.
    invites: [],
    // Repeating sessions (TODO §35.3a): the RULE only. The evenings it produces are derived at read
    // time (domain/sessionSeries.js), and an evening the trainer moved, cancelled or ran is a row in
    // `sessions` above that speaks for it.
    sessionSeries: [],
    notifications: [],
    // null, not "en": the language nobody has chosen yet must stay distinguishable from a chosen
    // English, or the splash cannot tell who to offer the choice to (see i18n/index.js).
    lang: null,
  };
}

export function stateHasData(s = state) {
  return [
    "clients",
    "exercises",
    "routines",
    "history",
    "planUpdates",
    "sessions",
    "sessionSeries",
  ].some((k) => Array.isArray(s[k]) && s[k].length > 0);
}

// Every seeded record is STAMPED (data/seedProvenance.js) so a later "clear the demo data" can tell
// it from the trainer's own work without inferring anything from ids. Stamping copies rather than
// mutates: DEFAULT_* are module singletons, and marking them in place would leave the seed arrays
// flagged for the lifetime of the page.
export function seedMockData({ origin = DEMO_ORIGIN } = {}) {
  // The demo is written in the language that is set RIGHT NOW, and stays in it (TODO §46.4). It is
  // a snapshot, not a live translation: from here on these are ordinary records the trainer may
  // edit, and rewriting them on a later language switch would throw that away. `lang` may still be
  // null here — nobody has chosen yet — and the seed's own English is then what gets written.
  const seeded = (records) =>
    localiseDemoRecords(records, state.lang).map((record) => stampAsSeeded(record, origin));
  state.clients = seeded(DEFAULT_CLIENTS);
  state.exercises = seeded(DEFAULT_EXERCISES);
  state.routines = seeded(DEFAULT_ROUTINES);
  state.history = seeded(DEFAULT_HISTORY);
  state.planUpdates = seeded(DEFAULT_PLAN_UPDATES);
  state.sessions = seeded(DEFAULT_SESSIONS);
  state.sessionSeries = seeded(DEFAULT_SESSION_SERIES);
  state.notifications = seeded(DEFAULT_MESSAGES);
  // `lang` is deliberately UNTOUCHED. It used to be defaulted to "en" here, which made seeding the
  // demo answer the splash's language question on a store that had never chosen one — so a trainer
  // who cleared their browser and opened a demo link was never asked, and got a narrated demo in a
  // language they may not read (reported 2026-08-21). Seeding is about RECORDS; a preference is
  // the person's to give.
  saveToLocalStorage();
}

/**
 * Remove the demo records a trainer no longer wants, keeping everything their own work depends on
 * (data/demoDataRemoval.js plans it; this applies and persists it).
 *
 * Goes through the ordinary save path on purpose: star-write already reconciles a removed record
 * out of every live schema store, so there is no separate deletion path to keep in step with it.
 */
export function removeDemoData(options = {}) {
  const plan = planDemoRemoval(state, options);
  const broken = brokenDependenciesAfter(state, plan);
  if (broken.length > 0) {
    // Refuse rather than write a database whose records point at rows that no longer exist. Only
    // reachable via a caller-edited plan; a plan straight from planDemoRemoval cannot break one.
    return { ok: false, plan, broken };
  }
  setState(applyDemoRemoval(state, plan));
  saveToLocalStorage();
  return { ok: true, plan, broken: [] };
}

// The plain localStorage key every build before this engine wrote (data/storageNamespace.js — no
// release-tag axis any more, TODO §16.5). It is the IMPORT SOURCE for the one-time move onto
// IndexedDB below — once imported it is never written to again, which is what keeps it a valid
// rollback snapshot for a build revert.
const DB_KEY = "librept_db";
const ACTIVE_SESSION_KEY = "librept_active_session";

// Via liveSchemas(), NOT `Object.keys(LIVE_SCHEMAS).map(Number)`. Schema keys are no longer all
// numbers — "P" coerces to NaN, every store name became "schemaNaN", and the boot transaction threw
// against a store that does not exist, so the app never finished loading.
const SCHEMAS = liveSchemas();
const IMPORTED_META_KEY = "imported";
const LANG_META_KEY = "lang";

// The chosen language is the PERSON's, not a workspace's (TODO §40.1) — the same reasoning that
// already puts the theme and the accepted terms in plain, unscoped localStorage
// (storageNamespace.js's ORIGIN_GLOBAL_KEYS). It used to live only in each database's meta store,
// which was invisible until there were two databases: stepping into the sandbox produced a store
// with no language in it, and the splash asked a trainer who had answered that question already.
//
// The meta copy is still written, and is still read when this key is absent — that is what carries
// an install that chose its language before this existed.
const LANG_KEY = "librept_lang";

function readSharedLang() {
  try {
    return localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

// Never CLEARS the key, only sets it. A save whose state carries no language is a store that was
// never asked, not an answer being withdrawn — and the sandbox's very first save is exactly that: a
// fresh database, seeded empty, which was wiping the choice the trainer had already made and sending
// them back to the language step on the way in. Forgetting a language is a full reset's job, and
// that sweeps every `librept*` key anyway.
function writeSharedLang(lang) {
  if (!lang) return;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // A browser refusing localStorage still runs the app; it just asks for the language again.
  }
}

// Cached so boot and every subsequent save share one open connection rather than reopening it.
let dbPromise = null;

function indexedDbSupported() {
  return typeof globalThis.indexedDB !== "undefined" && globalThis.indexedDB !== null;
}

function getDb() {
  // Named for the ACTIVE workspace (TODO §40.2). The working workspace resolves to `librept`, which
  // is what every install already has — the sandbox is a second database that does not exist until
  // somebody enters it.
  if (!dbPromise) dbPromise = openDatabase({ schemas: SCHEMAS, name: databaseNameFor() });
  return dbPromise;
}

// Let go of the open connection before the workspace changes. A connection left open would keep
// serving the OLD database to anything still holding the promise, and — worse — would block the
// `deleteDatabase` a sandbox reset performs, which IndexedDB signals only by never completing.
async function closeDb() {
  if (!dbPromise) return;
  const pending = dbPromise;
  dbPromise = null;
  try {
    (await pending).close();
  } catch (e) {
    console.error("Failed to close the database before switching workspace.", e);
  }
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
  // Outside the transaction on purpose: it is a synchronous localStorage write, and anything that
  // is not an IDB request inside an open transaction ends it (see indexedDb.js's header).
  writeSharedLang(currentState.lang);
  const staleIdsByCollection = {};
  // Reconciled against the store this install READS (readSchema.js) — the one whose id set is
  // authoritative for what the trainer is actually looking at.
  const currentReadStore = readStoreName();
  const readTx = db.transaction([currentReadStore], "readonly");
  const readStore = readTx.objectStore(currentReadStore);
  for (const collection of COLLECTIONS) {
    const existingIds = await getAllKeysFromIndex(readStore, COLLECTION_INDEX, collection);
    const currentIds = new Set((currentState[collection] || []).map((record) => record.id));
    staleIdsByCollection[collection] = existingIds.filter((id) => !currentIds.has(id));
  }

  const storeNames = [...SCHEMAS.map(storeNameForSchema), META_STORE];
  await withTransaction(db, storeNames, "readwrite", ({ store }) => {
    for (const collection of COLLECTIONS) {
      // Only into stores whose schema DECLARES this collection (TODO §18.4's staging, enforced
      // 2026-08-17). Without this the fan-out wrote everything everywhere, so a preview-only
      // collection was preview-only in name and durable in fact — and nothing said so.
      const targets = SCHEMAS.filter((schema) =>
        schemaAcceptsCollection(LIVE_SCHEMAS[schema], collection),
      );
      for (const record of currentState[collection] || []) {
        const projected = projectCollection(collection, record);
        for (const schema of targets) {
          store(storeNameForSchema(schema)).put(projected);
        }
      }
      // Deletes follow the same set: a store that never held the record has nothing to reconcile,
      // and issuing the delete anyway would be a write to a shape that does not know the collection.
      for (const id of staleIdsByCollection[collection]) {
        for (const schema of targets) {
          store(storeNameForSchema(schema)).delete(id);
        }
      }
    }
    store(META_STORE).put({ key: IMPORTED_META_KEY, value: true });
    // Persist the CHOSEN language verbatim, null included — coercing to "en" here would silently
    // record a choice the trainer never made, on the very first save.
    store(META_STORE).put({ key: LANG_META_KEY, value: currentState.lang ?? null });
  });
  // Returned so the preview mirror deletes exactly what the canonical write just deleted, rather
  // than re-deriving the stale set against a store that has already moved on.
  return Object.values(staleIdsByCollection).flat();
}

// Reassemble the in-memory `state` shape from whichever live schema this install reads
// (readSchema.js). Every live schema is written by the fan-out on every save, so this is a pure
// read re-point — switching schemas needs no migration and loses nothing, because the store being
// left keeps being written too. `lang` comes from the meta store either way: it is a setting, not
// a record, and it belongs to the install rather than to a schema.
async function readStateFromIndexedDb(db) {
  const storeName = readStoreName();
  const records = await getAll(db.transaction([storeName], "readonly").objectStore(storeName));
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
  // The shared key wins over whatever this workspace's own store remembers: the trainer answered
  // the language question once, as themselves, not once per database.
  const shared = readSharedLang();
  if (shared) candidate.lang = shared;
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

  // Pre-emptive, before the trainer opts into anything (docs/DATA_MODEL.md §4): a store this build
  // just provisioned starts empty and would otherwise only become current at the next save. Filling
  // it here is what makes a later schema upgrade an instant toggle rather than a wait. A no-op on
  // every boot after the first for a given schema.
  await ensureLiveSchemasBackfilled(db);

  // AFTER the backfill, so a freshly provisioned stable store is populated before P is rebuilt from
  // it. P's shape can change on any commit and there is no migration between preview shapes, so a P
  // store written by a different build is discarded and re-projected from the durable schema4 copy.
  // Preview-only fields do not survive that, which is the cost the backup/sync warnings name.
  await rebuildPreviewSchemaIfBuildChanged(db, BUILD_INFO?.commit ?? null);

  state = finalizeLoadedState(await readStateFromIndexedDb(db));
  return state;
}

// TODO §3.9's actual fix: a listener registered ONCE (app.js, at boot) rather than a callback each
// of the ~60 call sites across the app must remember to pass. `saveToLocalStorage()` is the one seam
// every write already goes through — some via this exact function imported directly, some via
// app.js's `saveState()` wrapper — so notifying here is notifying for all of them, unconditionally.
// The previous design (an optional `incrementLocalSyncFn` parameter) under-reported for exactly the
// reason a call-site-by-call-site convention always does: most callers didn't pass it.
// **A list, not a single slot, and that distinction cost a shipped feature once.** This was
// `stateSavedListener = listener` — an assignment — while the doc above describes it as "a listener
// registered ONCE". Both were true with one consumer. When TODO §3.8's unbacked warning registered a
// second, it silently REPLACED the ahead/behind badge's, so the badge stopped updating on every
// write and simply showed whatever it last rendered. Nothing errored; a subscribe call just did not
// subscribe. Registering is now additive, so the next consumer cannot unsubscribe the previous one.
const stateSavedListeners = [];

export function onStateSaved(listener) {
  if (typeof listener === "function") stateSavedListeners.push(listener);
}

export function saveToLocalStorage() {
  if (indexedDbSupported()) {
    enqueueWrite(
      async () => {
        const db = await getDb();
        await starWrite(db, state);
      },
      "state",
      { readsLiveState: true },
    );
  } else {
    writeVersionScoped(DB_KEY, JSON.stringify(state));
  }
  // Fired immediately, not after the (possibly still-queued) IndexedDB write completes: `state` is
  // already mutated in memory at this point, which is all a live ahead-count diff needs.
  for (const listener of stateSavedListeners) listener();
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

// "When was this device's data last captured anywhere it could survive the browser evicting
// IndexedDB" — written by BOTH a completed Drive sync and a downloaded JSON backup (TODO §3.8).
//
// **Deliberately its own key, not a field on `driveSync` above.** That meta holds the merge
// ancestor, and a three-way merge is only correct if the ancestor is exactly the state Drive last
// saw; letting an export touch that record would silently corrupt the next merge. These two facts
// look adjacent and must not share a home.
//
// Local-only and never synced, because it is a fact about THIS device: a backup file downloaded on
// the trainer's phone does nothing for their tablet, so a synced value would claim safety the other
// device does not have.
const BACKUP_HISTORY_META_KEY = "backupHistory";

export async function readBackupHistory() {
  if (!indexedDbSupported()) return null;
  const db = await getDb();
  const entry = await readMeta(db, BACKUP_HISTORY_META_KEY);
  return entry?.value || null;
}

/** Record that the data reached durable storage. `kind` is "drive" or "file".
 *
 * Stores a FINGERPRINT of what was captured, not just when — `{id, h}` per record, which is what
 * lets TODO §3.8 count "changes since the last backup" without per-record timestamps and without
 * keeping a second full snapshot beside the Drive ancestor. See backupHealth.js for why the cheap
 * shape matters: a warning about storage eviction should not itself be a significant consumer.
 */
export async function recordBackupTaken(kind) {
  if (!indexedDbSupported()) return;
  const db = await getDb();
  const fingerprint = fingerprintState(state);
  await withTransaction(db, [META_STORE], "readwrite", ({ store }) => {
    store(META_STORE).put({
      key: BACKUP_HISTORY_META_KEY,
      value: { at: Date.now(), kind, fingerprint },
    });
  });
  if (typeof backupRecordedListener === "function") backupRecordedListener();
}

// A third single-listener seam, alongside onStateSaved above and driveSyncService's
// onSyncCountsChanged — same reasoning, a different event. TODO §3.8's badge has to clear the
// moment a backup lands, and a downloaded FILE never touches state, so `onStateSaved` cannot see it:
// without this the badge would keep warning until the trainer's next unrelated edit, which is
// exactly the "warning that ignores what you just did" that teaches people to ignore warnings.
let backupRecordedListener = null;

export function onBackupRecorded(listener) {
  backupRecordedListener = listener;
}

// The sandbox's own bookkeeping (TODO §40.4): when it was seeded, and when the trainer last declined
// the offer to reseed it. Both are facts about ONE workspace, so they live in that workspace's own
// meta store — which is also why a reset needs to remember neither: deleting the database takes them
// with it, and after a reset there is nothing to decline.
const SANDBOX_META_KEY = "sandbox";

export async function readSandboxMeta() {
  if (!indexedDbSupported()) return null;
  const db = await getDb();
  const entry = await readMeta(db, SANDBOX_META_KEY);
  return entry?.value || null;
}

async function writeSandboxMeta(patch) {
  if (!indexedDbSupported()) return;
  const db = await getDb();
  const current = (await readMeta(db, SANDBOX_META_KEY))?.value || {};
  const value = { ...current, ...patch };
  await withTransaction(db, [META_STORE], "readwrite", ({ store }) => {
    store(META_STORE).put({ key: SANDBOX_META_KEY, value });
  });
}

/** Record that the trainer said no to reseeding a stale sandbox, starting the cooldown (§40.4). */
export async function recordSandboxOfferDeclined(now = Date.now()) {
  await writeSandboxMeta({ staleOfferDeclinedAt: now });
}

// Fill an empty sandbox and stamp when that happened. `seededAt` is what staleness is measured
// against — the seed generates its sessions relative to "now" (data/sessions.js), so the age of the
// seeding is exactly the age of the board it produced.
async function seedSandbox(now = Date.now()) {
  seedMockData();
  await writeSandboxMeta({ seededAt: now, staleOfferDeclinedAt: null });
}

/**
 * Choose the workspace BOOT will load, before it loads (TODO §40.9).
 *
 * Separate from `switchWorkspace` below, which is the mid-session move and has a database open to
 * drain and close. At boot there is nothing open yet, so a deep link asking for the sandbox is one
 * assignment — and loading twice, once per workspace, is exactly the wasted work a first paint on a
 * phone cannot afford.
 */
export function prepareWorkspaceForBoot(name) {
  if (!isWorkspace(name) || name === activeWorkspace()) return;
  setActiveWorkspace(name);
}

/** Fill the sandbox the first time anybody opens it (TODO §40.4). A no-op anywhere else — the
 * working workspace is seeded only by an explicit `?init=demo_data_load` (§40.7). */
export async function ensureSandboxSeeded({ now = Date.now() } = {}) {
  if (activeWorkspace() !== SANDBOX || stateHasData()) return;
  await seedSandbox(now);
}

/**
 * Point the app at another workspace and load it (TODO §40.3).
 *
 * Re-renders rather than reloading the page: a reload costs the splash hold, the open view and any
 * half-filled dialog, and it puts a service-worker fetch in the path of a switch that may happen mid
 * session. The caller re-renders and resets the route; this function owns storage only.
 *
 * The queue is drained BEFORE the connection closes, or an enqueued write of the workspace being
 * left would flush against the database being entered.
 */
export async function switchWorkspace(name, { now = Date.now() } = {}) {
  if (!isWorkspace(name) || name === activeWorkspace()) return getState();
  await flushWrites();
  await closeDb();
  setActiveWorkspace(name);
  lastMigrationSummary = null;
  await loadSavedState();
  // An empty sandbox is one nobody has entered yet. The working workspace is never seeded here: it
  // is seeded only by an explicit `?init=demo_data_load` (§40.7), which is what keeps the existing
  // e2e suite testing the app the trainer will actually use.
  if (name === SANDBOX && !stateHasData()) await seedSandbox(now);
  return getState();
}

/** Delete the sandbox database and its keys outright, leaving nothing to build back — what a
 * support wipe removes (TODO §40). Safe from either workspace: it names the sandbox's database
 * explicitly and never touches the working one. */
export async function deleteSandboxDatabase() {
  if (activeWorkspace() === SANDBOX) await closeDb();
  clearWorkspaceKeys(SANDBOX);
  if (!indexedDbSupported()) return;
  try {
    await deleteDatabase(databaseNameFor(SANDBOX));
  } catch (e) {
    console.error("Failed to delete the sandbox database.", e);
  }
}

/**
 * Throw away the sandbox and build a fresh one (TODO §40.4).
 *
 * Deleting the whole database is the point: it is one call that CANNOT reach the trainer's own
 * records, where clearing by record or by name pattern inside a shared database could. Only ever
 * runs against the sandbox — a guard, because this is the one operation in the app whose name does
 * not say which database it deletes.
 */
export async function resetSandbox({ now = Date.now() } = {}) {
  if (activeWorkspace() !== SANDBOX) return getState();
  await flushWrites();
  await deleteSandboxDatabase();
  setState(emptyState());
  await loadSavedState();
  await seedSandbox(now);
  return getState();
}

export async function resetLibrePTData(options = {}) {
  const { demo = true } = options || {};
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("librept") || k.startsWith("openpt")) localStorage.removeItem(k);
  }
  if (indexedDbSupported()) {
    await closeDb();
    // BOTH databases (TODO §40). The key sweep above already takes the sandbox's suffixed keys and
    // the workspace pointer with it, so a reset that left the sandbox database standing would leave
    // a database nothing points at — and a trainer who was told everything was removed.
    for (const name of [DATABASE_NAME, databaseNameFor(SANDBOX)]) {
      try {
        await deleteDatabase(name);
      } catch (e) {
        console.error(`Failed to delete IndexedDB database "${name}" during reset.`, e);
      }
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
