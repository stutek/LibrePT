// src/data/dataWipe.js — what a support data wipe would remove from THIS device (TODO §31).
//
// Single responsibility: turn what the device actually holds into a plan a dialog can show and a
// caller can execute. Pure — it is handed the store names and the browser keys rather than reading
// them, so the whole thing is testable without a database.
//
// **Why it plans instead of just deleting.** The wipe is reached by a link support sends over SMS or
// email (§31.1), and the link carries no authority: opening it can only ever open a dialog. That
// makes the dialog the entire security boundary, and a dialog can only be honest if it is told the
// truth about this device — including a store from a schema this build has never heard of, which is
// exactly what a long-lived install accumulates and exactly what "wipe my data" must not leave
// behind. Nothing here is matched against the current build's schema list for that reason.
//
// **What it cannot reach is part of the plan, not a footnote.** A downloaded backup, a Drive sync
// file, an encrypted export already in a client's mailbox: the app can erase what it holds and
// nothing more. A support wipe that implied otherwise would be worse than none, so the summary
// carries that list and the dialog is expected to show it.
//
// Injected dependencies: none.

/** The single target for everything belonging to no schema: the `meta` store and this app's own
 * browser keys — the active session, read-notification ids, the terms acceptance, the Drive sync
 * pointer. Per-device bookkeeping, which is why it travels as one thing. */
export const UNVERSIONED_TARGET = "unversioned";

// The store that holds bookkeeping rather than records. Named here rather than imported from
// indexedDb.js so this module stays a pure function of what it is given.
const META_STORE_NAME = "meta";

// This app's own keys, including the name it used to ship under. A stranger's key in the same origin
// is not ours to remove.
const OUR_KEY_PREFIXES = ["librept", "openpt"];

const isSchemaStore = (name) => name !== META_STORE_NAME;
const isOurKey = (key) => OUR_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));

/**
 * `{ targets, hasAnything }` for a device holding `storeNames` and `localStorageKeys`.
 *
 * Every target starts SELECTED. A support wipe is not a shopping trip — the trainer is on the phone
 * to someone because the app is broken — so the default is "all of it", and deselecting is there for
 * the rarer case where support wants to keep one schema to look at.
 */
export function planDataWipe({ storeNames = [], localStorageKeys = [] } = {}) {
  const schemaStores = storeNames.filter(isSchemaStore);
  const ourKeys = localStorageKeys.filter(isOurKey);
  const hasUnversioned = storeNames.includes(META_STORE_NAME) || ourKeys.length > 0;

  const targets = schemaStores.map((store) => ({
    id: store,
    kind: "schema",
    stores: [store],
    localStorageKeys: [],
    selected: true,
  }));

  if (hasUnversioned) {
    targets.push({
      id: UNVERSIONED_TARGET,
      kind: "unversioned",
      stores: storeNames.filter((name) => name === META_STORE_NAME),
      localStorageKeys: ourKeys,
      selected: true,
    });
  }

  return { targets, hasAnything: targets.length > 0 };
}

/** What the app cannot reach, in the trainer's terms. Stated on every wipe, never conditionally:
 * the moment it is omitted "because this device has no Drive connection", someone reads the dialog
 * as a promise about the copy they emailed last week. */
const UNREACHABLE = [
  "Backup files you have downloaded stay where they are.",
  "A copy synced to Google Drive stays in your Drive.",
  "Exports and consent letters already sent to someone else cannot be recalled.",
];

/** `{ selectedIds, nothingSelected, unreachable }` — everything the dialog needs to describe the
 * wipe it is about to perform, and to refuse to perform an empty one. */
export function wipeSummary(plan) {
  const selected = (plan?.targets || []).filter((target) => target.selected);
  return {
    selectedIds: selected.map((target) => target.id),
    nothingSelected: selected.length === 0,
    unreachable: [...UNREACHABLE],
  };
}

/** The stores and keys a selection actually clears, flattened for the caller that does the writing.
 * Separate from the plan so the executor never has to understand targets. */
export function wipeOperations(plan) {
  const selected = (plan?.targets || []).filter((target) => target.selected);
  return {
    stores: selected.flatMap((target) => target.stores),
    localStorageKeys: selected.flatMap((target) => target.localStorageKeys),
  };
}
