// tests/unit_js/data/sandboxWorkspace.test.mjs
// The two workspaces and the sandbox's staleness clock (TODO §40, src/data/workspace.js,
// src/data/sandboxStaleness.js).
//
// What these pin is the promise the whole design rests on: the working workspace keeps the database
// and the keys every install already has, so arriving on this build moves nobody's data — and the
// sandbox is a different database, not a filter over the same one. Names are the isolation here, so
// they are asserted literally rather than derived the same way the code derives them.

import assert from "node:assert/strict";
import { test } from "node:test";
import { backupWorkspace, refusesRestoreInto } from "../../../src/data/backupFile.js";
import {
  OFFER_COOLDOWN_MS,
  STALE_AFTER_MS,
  sandboxStaleness,
} from "../../../src/data/sandboxStaleness.js";
import { VERSION_SCOPED_KEYS, clearWorkspaceKeys } from "../../../src/data/storageNamespace.js";
import {
  ACTIVE_WORKSPACE_KEY,
  SANDBOX,
  WORKING,
  activeWorkspace,
  databaseNameFor,
  isSandbox,
  isWorkspace,
  scopedKey,
  setActiveWorkspace,
} from "../../../src/data/workspace.js";

// node:test has no DOM; the module only ever touches these three methods.
function withLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  return store;
}

test("the working workspace keeps the database every install already has", () => {
  assert.equal(databaseNameFor(WORKING), "librept");
  assert.equal(databaseNameFor(SANDBOX), "librept_sandbox");
});

test("the working workspace keeps its keys unsuffixed, so nothing has to be migrated", () => {
  assert.equal(scopedKey("librept_active_session", WORKING), "librept_active_session");
  assert.equal(scopedKey("librept_active_session", SANDBOX), "librept_active_session__sandbox");
});

test("a scoped key still starts with the app's own prefix", () => {
  // resetLibrePTData and the support wipe both sweep by prefix. A key they stopped recognising
  // would survive a wipe that told the trainer everything was removed.
  assert.ok(scopedKey("librept_active_timers", SANDBOX).startsWith("librept"));
});

test("rebuilding the sandbox keeps the trainer's own details and their cloud connection", () => {
  // The promise the menu's "Reset sandbox data" makes (TODO §40.4), pinned where it is decided
  // rather than where it is worded: a reset clears the sandbox's own per-workspace keys and the
  // sandbox database, and the trainer's identity and Drive connection belong to the PERSON, so they
  // are unscoped and must survive (§40.1). Asserted by NAME, because the isolation here is naming:
  // the day one of these is added to VERSION_SCOPED_KEYS it starts being swept, silently.
  const survives = [
    "librept_trainer_name",
    "librept_trainer_email",
    "librept_trainer_phone",
    "librept_invite_expiry_hours",
    "librept_drive_connected",
  ];
  for (const key of survives) {
    assert.ok(
      !VERSION_SCOPED_KEYS.includes(key),
      `${key} belongs to the person, so a sandbox reset must not be able to reach it`,
    );
  }

  const store = withLocalStorage(
    Object.fromEntries([
      ...survives.map((k) => [k, "keep me"]),
      ...VERSION_SCOPED_KEYS.map((k) => [scopedKey(k, SANDBOX), "sandbox"]),
      ...VERSION_SCOPED_KEYS.map((k) => [scopedKey(k, WORKING), "the trainer's own"]),
    ]),
  );

  clearWorkspaceKeys(SANDBOX);

  for (const key of survives) assert.equal(store.get(key), "keep me", key);
  for (const key of VERSION_SCOPED_KEYS) {
    assert.equal(store.get(scopedKey(key, SANDBOX)), undefined, key);
    assert.equal(store.get(scopedKey(key, WORKING)), "the trainer's own", key);
  }
});

test("an unreadable or unknown stored workspace reads as the working one", () => {
  withLocalStorage({ [ACTIVE_WORKSPACE_KEY]: "somewhere_else" });
  assert.equal(activeWorkspace(), WORKING);

  withLocalStorage();
  assert.equal(activeWorkspace(), WORKING);

  globalThis.localStorage = {
    getItem() {
      throw new Error("storage disabled");
    },
    setItem() {},
    removeItem() {},
  };
  assert.equal(activeWorkspace(), WORKING);
});

test("returning to the working workspace removes the pointer rather than storing a default", () => {
  const store = withLocalStorage();
  setActiveWorkspace(SANDBOX);
  assert.equal(store.get(ACTIVE_WORKSPACE_KEY), SANDBOX);
  assert.ok(isSandbox(activeWorkspace()));

  setActiveWorkspace(WORKING);
  assert.equal(store.has(ACTIVE_WORKSPACE_KEY), false);
  assert.equal(activeWorkspace(), WORKING);
});

test("a workspace name that is not one of the two is refused outright", () => {
  const store = withLocalStorage();
  setActiveWorkspace("production");
  assert.equal(store.has(ACTIVE_WORKSPACE_KEY), false);
  assert.equal(isWorkspace("production"), false);
});

test("the sandbox is stale after twelve hours, not before", () => {
  const seededAt = 1_000_000_000_000;
  const justUnder = sandboxStaleness({ seededAt }, seededAt + STALE_AFTER_MS - 60_000);
  const justOver = sandboxStaleness({ seededAt }, seededAt + STALE_AFTER_MS + 60_000);

  assert.deepEqual({ stale: justUnder.stale, ask: justUnder.ask }, { stale: false, ask: false });
  assert.deepEqual({ stale: justOver.stale, ask: justOver.ask }, { stale: true, ask: true });
});

test("a declined offer stays quiet for three hours, then may be made again", () => {
  const seededAt = 1_000_000_000_000;
  const declinedAt = seededAt + STALE_AFTER_MS;

  const soon = sandboxStaleness(
    { seededAt, staleOfferDeclinedAt: declinedAt },
    declinedAt + OFFER_COOLDOWN_MS - 60_000,
  );
  const later = sandboxStaleness(
    { seededAt, staleOfferDeclinedAt: declinedAt },
    declinedAt + OFFER_COOLDOWN_MS + 60_000,
  );

  // Still stale either way — the data did not improve by being declined. Only the asking waits.
  assert.deepEqual({ stale: soon.stale, ask: soon.ask }, { stale: true, ask: false });
  assert.deepEqual({ stale: later.stale, ask: later.ask }, { stale: true, ask: true });
});

test("a sandbox of unknown age is never offered for deletion", () => {
  const unknown = sandboxStaleness({}, 1_000_000_000_000);
  assert.deepEqual(unknown, { stale: false, ask: false, ageMs: null });
});

test("a clock that moved backwards does not make the sandbox stale", () => {
  const seededAt = 1_000_000_000_000;
  const result = sandboxStaleness({ seededAt }, seededAt - 5 * 60 * 60 * 1000);
  assert.deepEqual({ stale: result.stale, ageMs: result.ageMs }, { stale: false, ageMs: 0 });
});

test("a backup written in the sandbox is refused into the trainer's own work", () => {
  // TODO §40.10. One rule, one direction: sample data may never enter the working database, while a
  // real backup restored INTO the sandbox is one of the more useful things it offers.
  const fromSandbox = { workspace: SANDBOX, clients: [] };

  assert.equal(refusesRestoreInto(fromSandbox, WORKING), true);
  assert.equal(refusesRestoreInto(fromSandbox, SANDBOX), false);
  assert.equal(refusesRestoreInto({ workspace: WORKING, clients: [] }, WORKING), false);
});

test("a file written before files said where they came from is restored as it always was", () => {
  // Ruled 2026-09-10: the install base is too small to filter old mixed backups. Such a file came
  // out of a mixed database, so restoring it returns exactly what the trainer had.
  assert.equal(backupWorkspace({ clients: [] }), null);
  assert.equal(refusesRestoreInto({ clients: [] }, WORKING), false);
});
