// src/data/workspace.js — which of the two databases this app is looking at (TODO §40).
// Single responsibility: name the active workspace, and turn that name into the storage identifiers
// everything else keys on — a database name and a localStorage key. Reads and writes one plain key;
// knows nothing about records, schemas or the UI.
//
// **Two workspaces, not many** (§40.1): the trainer's own work, and a sandbox to learn and
// experiment in. More would need naming, a list and a choice at boot; two keep the switch to one
// control.
//
// **The working workspace keeps today's exact names.** `librept` stays the database, and its
// localStorage keys stay unsuffixed. That is what makes the arrival of this feature a no-op for every
// device already out there: an install that has never heard of a workspace boots into the working one
// and finds its data exactly where it left it, with no migration to run and nothing to get wrong.
// Only the sandbox is new, and a sandbox that has never been entered does not exist at all.
//
// **The pointer itself is neither shared nor per workspace.** `librept_workspace` is the one key that
// says which workspace is open, so it cannot live inside a workspace — it is what selects one.
//
// Injected dependencies: none.

/** The trainer's own data. Today's database, today's keys. */
export const WORKING = "working";

/** Sample data to learn and experiment in. Its own database, suffixed keys. */
export const SANDBOX = "sandbox";

const WORKSPACES = [WORKING, SANDBOX];

// Deliberately not in storageNamespace.js's key lists: those are keys that BELONG to a workspace or
// to the person, and this one belongs to neither.
export const ACTIVE_WORKSPACE_KEY = "librept_workspace";

const WORKING_DATABASE = "librept";

/** Whether `name` is a workspace this build knows. Unknown names are never trusted: the value comes
 * out of localStorage and off a URL, and both can say anything. */
export function isWorkspace(name) {
  return WORKSPACES.includes(name);
}

/** The workspace currently open. Anything unreadable, missing or unrecognised is the working one —
 * the answer that shows the trainer their own data, which is the safe direction to fail in. */
export function activeWorkspace() {
  try {
    const stored = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    return isWorkspace(stored) ? stored : WORKING;
  } catch {
    return WORKING;
  }
}

/** Point the app at `name`. Storage only — the caller reloads state and re-renders (§40.3). */
export function setActiveWorkspace(name) {
  if (!isWorkspace(name)) return;
  if (name === WORKING) localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  else localStorage.setItem(ACTIVE_WORKSPACE_KEY, name);
}

export function isSandbox(name = activeWorkspace()) {
  return name === SANDBOX;
}

/**
 * The IndexedDB database holding `name`'s records.
 *
 * A separate DATABASE, not a store-name prefix inside the shared one (§40.2). Three reasons, and the
 * third is the one that keeps a mistake from being possible: an object store can only be created
 * inside `onupgradeneeded`, so a prefix would drag `indexedDb.js`'s version derivation onto a second
 * axis; resetting the sandbox is a recurring operation and here it is one `deleteDatabase` call that
 * cannot reach the trainer's records; and a handle pointing at another database CANNOT write real
 * data, where a guard inside the star write would only forbid it.
 */
export function databaseNameFor(name = activeWorkspace()) {
  return name === SANDBOX ? `${WORKING_DATABASE}_${SANDBOX}` : WORKING_DATABASE;
}

/**
 * The localStorage key `baseKey` takes in workspace `name`.
 *
 * Suffixed rather than prefixed so the app's own `librept`/`openpt` prefixes still identify every key
 * as ours — `resetLibrePTData` and the support wipe both sweep by prefix, and a key they stopped
 * recognising would survive a wipe that claims to remove everything.
 */
export function scopedKey(baseKey, name = activeWorkspace()) {
  return name === SANDBOX ? `${baseKey}__${SANDBOX}` : baseKey;
}
