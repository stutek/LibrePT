// src/data/recordDependencies.js — which records a given record structurally DEPENDS ON.
// Single responsibility: for one record, name the ids in other collections it cannot survive
// without. Pure: no DOM, no storage, no knowledge of why the caller is asking.
//
// This is the companion to recordReferences.js, not a replacement. That module declares the
// collection-level graph and proves it acyclic, which is what migration replay order needs — a
// question about COLLECTIONS. This one answers a question about a RECORD: "delete these ids, does
// this record break?" Demo-data removal is the first caller; a future integrity check or a
// per-client export is the obvious second.
//
// Why a function rather than more entries in REFERENCES: that module's shape is
// `{collection: {field: targetCollection}}`, which can only describe a scalar field holding one id.
// Half the real dependencies in this domain are not that shape — `session.participants` is an ARRAY
// of client ids, and `routine.exercises` is an array of OBJECTS whose `id` is an exercise id. They
// were therefore absent from the graph entirely, which reads as "losing the referenced row merely
// stales a label". For `routineName` that is true. For `routineId` and the two arrays above it is
// not: a routine whose exercises have been deleted is an empty programme, and a session pointing at
// a deleted routine has nothing to run.
//
// Soft references are deliberately still excluded — `clientName`, `routineName`, `exerciseName` are
// denormalised labels (recordSchemas.js). A stale label is a cosmetic problem; a missing dependency
// is a broken record.
// Injected dependencies: none.

// One field naming the ids of one collection, as a list: an empty or absent field depends on nothing.
function ids(value) {
  const list = (Array.isArray(value) ? value : [value]).filter(Boolean);
  return list.length > 0 ? list : null;
}

// The dependencies each collection has, as `{ target collection: ids }` with empty entries dropped.
function dependencies(entries) {
  return Object.fromEntries(Object.entries(entries).filter(([, list]) => list));
}

const ownedByClient = (record) => dependencies({ clients: ids(record.clientId) });

// A circuit holds its exercises exactly as a routine does. `exercises` is an array of prescription
// objects, each carrying the exercise id as `id` — not an array of bare ids. Reading it as one would
// silently produce no dependencies at all.
const holdsExercises = (record) =>
  dependencies({ exercises: ids((record.exercises || []).map((item) => item?.id)) });

// clients and exercises are leaves: nothing in the domain sits below them, so they have no row here.
const DEPENDENCIES = {
  history: ownedByClient,
  planUpdates: ownedByClient,
  exerciseNotes: ownedByClient,
  clientNotes: ownedByClient,
  // A program and an attendance row belong to a client, and to the session they were run in.
  clientPrograms: (record) =>
    dependencies({ clients: ids(record.clientId), sessions: ids(record.sessionId) }),
  sessionAttendance: (record) =>
    dependencies({ clients: ids(record.clientId), sessions: ids(record.sessionId) }),
  groupSharedPrograms: (record) =>
    dependencies({ clients: ids(record.clientIds), sessions: ids(record.sessionId) }),
  sessions: (record) =>
    dependencies({ clients: ids(record.participants), routines: ids(record.routineId) }),
  circuits: holdsExercises,
  routines: holdsExercises,
};

/**
 * Ids this record depends on, as `{ collection: [id, ...] }`.
 *
 * Unknown collections return an empty map rather than throwing: a caller sweeping every collection
 * should not need to know which ones happen to have dependencies.
 */
export function dependenciesOf(collection, record) {
  if (!record || typeof record !== "object") return {};
  return DEPENDENCIES[collection]?.(record) ?? {};
}

/**
 * Every id depended on by any record in `records`, merged across collections.
 *
 * Returns `{ collection: Set<id> }` — a Set because callers ask "is this id needed?" per candidate,
 * and a linear scan per candidate is what makes a whole-database sweep quadratic.
 */
export function dependencyIndex(recordsByCollection) {
  const index = {};
  for (const [collection, records] of Object.entries(recordsByCollection || {})) {
    for (const record of records || []) {
      for (const [target, ids] of Object.entries(dependenciesOf(collection, record))) {
        index[target] ??= new Set();
        for (const id of ids) index[target].add(id);
      }
    }
  }
  return index;
}
