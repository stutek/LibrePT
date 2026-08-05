// src/data/recordProjections.js — domain object → IndexedDB record, one schema (TODO §18.1).
//
// The star-write model projects a live domain object DIRECTLY into every live schema, never through
// a chain (see docs/DATA_MODEL.md §4). Today there is exactly one live schema (recordSchemas.js's
// SCHEMA_2), so each projection here is necessarily small — pick the record's collection and stamp
// the IndexedDB routing fields (`collection`, and `clientId` where the collection is owned by a
// client) onto the domain object. That triviality is not a shortcut: §18.1 predicts it directly — a
// "downgrade" is just a projection that was already being written all along, and the day a second
// schema is cut, ITS projection is where the real transform work lands, not here.
//
// Record shape matches indexedDb.js exactly: `{ id, collection, ...domain fields, spread flat }` —
// not nested under a `payload` key. `collection` is applied last so it always wins over any
// same-named domain field, though none of today's collections have one.
//
// Injected dependencies: none — pure functions over plain objects, the live domain shapes already
// held in `state` and `clientState`.

import { SCHEMA_2, fieldIssues } from "./recordSchemas.js";

function toRecord(collection, domainObject) {
  return { ...domainObject, collection };
}

export const projectClient = (client) => toRecord("clients", client);
export const projectExercise = (exercise) => toRecord("exercises", exercise);
export const projectRoutine = (routine) => toRecord("routines", routine);
export const projectSession = (session) => toRecord("sessions", session);
export const projectHistory = (historyEntry) => toRecord("history", historyEntry);
export const projectPlanUpdate = (update) => toRecord("planUpdates", update);
export const projectNotification = (notification) => toRecord("notifications", notification);

const PROJECTORS = {
  clients: projectClient,
  exercises: projectExercise,
  routines: projectRoutine,
  sessions: projectSession,
  history: projectHistory,
  planUpdates: projectPlanUpdate,
  notifications: projectNotification,
};

export function projectCollection(collection, domainObject) {
  const projector = PROJECTORS[collection];
  if (!projector) throw new Error(`no projection declared for collection "${collection}"`);
  return projector(domainObject);
}

// Structural problems in a projected record against a schema — empty means clean. This is §18.4's
// "projections must be pure and total" made checkable: every record this build actually produces
// must conform to the schema it targets, and this is what a CI fixture or a fuzz corpus calls.
export function projectionIssues(collection, domainObject, schema = SCHEMA_2) {
  const shape = schema[collection];
  if (!shape) return [`no schema declared for collection "${collection}"`];
  return fieldIssues(projectCollection(collection, domainObject), shape);
}

// Every collection this build projects — the boot-time read (TODO §18.6 part 4) groups a flat
// IndexedDB record list back into this shape, so it needs the same set PROJECTORS was built from.
export const COLLECTIONS = Object.keys(PROJECTORS);

// Inverse of projectCollection: drop the routing field a stored record carries, recovering the
// domain object exactly as it was before projection. `collection` is redundant once a record has
// been sorted into its bucket, so nothing else needs to change shape here.
export function toDomainObject(record) {
  const { collection: _collection, ...domainObject } = record;
  return domainObject;
}

// Reassemble a flat list of IndexedDB records (each stamped with `collection`) into the
// per-collection shape stateStore.js keeps in memory. Every known collection is present, even if
// empty, so a fresh database reads back exactly like `emptyState()`.
// `record.collection` is DATA — it arrives from IndexedDB, which is fed by imported backups — and
// this function deliberately accepts collection names it does not know, so a backup written by a
// newer build survives a round trip through an older one. A plain-object accumulator cannot hold
// that combination safely: `grouped["__proto__"]` reads back Object.prototype rather than
// undefined, so the "not seen yet" check passes, and the push then lands on Object.prototype and
// throws. The same goes for `constructor` and every other inherited member. That is a crash on the
// BOOT path from a merely corrupt file, not just a malicious one.
//
// A null-prototype accumulator removes the class of problem instead of blocklisting the names:
// with no inherited members, every collection name is an ordinary data key and the unknown-name
// behaviour above stays exactly as intended.
export function groupRecordsByCollection(records) {
  const grouped = Object.assign(
    Object.create(null),
    Object.fromEntries(COLLECTIONS.map((collection) => [collection, []])),
  );
  for (const record of records) {
    if (!grouped[record.collection]) grouped[record.collection] = [];
    grouped[record.collection].push(toDomainObject(record));
  }
  return grouped;
}
