// tests/unit_js/data/backupHealth.test.mjs
// When the app should tell a trainer their data exists in exactly one evictable place (TODO §3.8,
// src/data/backupHealth.js).
//
// The rule this suite mostly exists to defend is the one that keeps the warning trustworthy: **a
// downloaded backup clears it exactly as a Drive sync does.** If only syncing could silence a safety
// warning, the warning would be a prompt to enable Google in a warning colour — and a trainer who
// exports every week and still sees it will correctly stop believing the badge.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  UNBACKED_CHANGE_THRESHOLD,
  assessBackupHealth,
  fingerprintState,
} from "../../../src/data/backupHealth.js";

const clients = (count, suffix = "") =>
  Array.from({ length: count }, (_, index) => ({
    id: `c${index}`,
    name: `Client ${index}${suffix}`,
  }));

const stateWith = (count, suffix = "") => ({ clients: clients(count, suffix) });

test("an empty store says nothing — there is nothing to lose yet", () => {
  const result = assessBackupHealth({
    history: null,
    currentFingerprint: fingerprintState({ clients: [] }),
  });
  assert.equal(result.level, "none");
  assert.equal(result.unbackedCount, 0);
});

test("a never-backed-up store warns once there is real work in it", () => {
  const barelyStarted = assessBackupHealth({
    history: null,
    currentFingerprint: fingerprintState(stateWith(3)),
  });
  // A trainer still evaluating the app with three test clients is not who this warning is for.
  assert.equal(barelyStarted.level, "none");

  const realWork = assessBackupHealth({
    history: null,
    currentFingerprint: fingerprintState(stateWith(UNBACKED_CHANGE_THRESHOLD)),
  });
  assert.equal(realWork.level, "due");
  assert.equal(realWork.unbackedCount, UNBACKED_CHANGE_THRESHOLD);
  // No interval is claimed, because there is no timestamp to measure one from.
  assert.equal(realWork.daysSinceBackup, null);
});

test("a file backup clears the warning exactly as a Drive sync would", () => {
  const state = stateWith(50);
  for (const kind of ["file", "drive"]) {
    const result = assessBackupHealth({
      history: { at: Date.now(), kind, fingerprint: fingerprintState(state) },
      currentFingerprint: fingerprintState(state),
    });
    assert.equal(result.level, "none", `${kind} backup should clear the warning`);
    assert.equal(result.unbackedCount, 0);
  }
});

test("edits after a backup are counted, not just additions", () => {
  const before = fingerprintState(stateWith(30));
  // Same ids, same count — only the contents changed. A record-count comparison would see nothing.
  const after = fingerprintState(stateWith(30, " (renamed)"));
  const result = assessBackupHealth({
    history: { at: Date.now(), kind: "file", fingerprint: before },
    currentFingerprint: after,
  });
  assert.equal(result.unbackedCount, 30);
  assert.equal(result.level, "due");
});

test("an untouched database is never nagged, however old the backup", () => {
  const state = stateWith(40);
  const result = assessBackupHealth({
    history: {
      at: Date.now() - 400 * 86_400_000,
      kind: "file",
      fingerprint: fingerprintState(state),
    },
    currentFingerprint: fingerprintState(state),
  });
  // Backed up a year ago and unchanged since is still fully backed up. Warning here would teach the
  // trainer the badge means nothing.
  assert.equal(result.level, "none");
  assert.ok(result.daysSinceBackup >= 400);
});

test("a little work long ago is worth saying, not only a lot of work", () => {
  const before = fingerprintState(stateWith(10));
  const after = fingerprintState({ clients: [...clients(10), { id: "new", name: "Late" }] });
  const recent = assessBackupHealth({
    history: { at: Date.now() - 86_400_000, kind: "file", fingerprint: before },
    currentFingerprint: after,
  });
  assert.equal(recent.level, "none", "one change yesterday is not worth a warning");

  const stale = assessBackupHealth({
    history: { at: Date.now() - 30 * 86_400_000, kind: "file", fingerprint: before },
    currentFingerprint: after,
  });
  assert.equal(stale.level, "due", "the same change a month old is");
});

test("evictable storage escalates the warning, and is the only thing that does", () => {
  const before = fingerprintState(stateWith(10));
  const after = fingerprintState(stateWith(60));
  const base = { history: { at: Date.now(), kind: "file", fingerprint: before } };

  assert.equal(
    assessBackupHealth({ ...base, currentFingerprint: after, durability: { atRisk: false } }).level,
    "due",
  );
  // `atRisk` is the browser saying it may reclaim this origin's data — evidence of the hazard, not
  // a proxy for it, which is why it is what earns the louder treatment.
  assert.equal(
    assessBackupHealth({ ...base, currentFingerprint: after, durability: { atRisk: true } }).level,
    "urgent",
  );
});

test("at-risk storage alone does not warn — there must be something unbacked to lose", () => {
  const state = stateWith(40);
  const result = assessBackupHealth({
    history: { at: Date.now(), kind: "drive", fingerprint: fingerprintState(state) },
    currentFingerprint: fingerprintState(state),
    durability: { atRisk: true },
  });
  assert.equal(result.level, "none");
});

test("the fingerprint is far smaller than the records it stands for", () => {
  // The reason this shape exists: a warning about storage pressure must not be a cause of it.
  const state = {
    clients: Array.from({ length: 200 }, (_, index) => ({
      id: `c${index}`,
      name: `Client ${index}`,
      notes: "x".repeat(500),
    })),
  };
  const stored = JSON.stringify(fingerprintState(state)).length;
  assert.ok(
    stored < JSON.stringify(state).length / 10,
    `fingerprint ${stored} bytes is not materially smaller than the state`,
  );
});
