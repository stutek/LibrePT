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
