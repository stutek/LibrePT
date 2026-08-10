// tests/unit_js/data/backupFile.test.mjs
// The backup FILE's shape (src/data/backupFile.js).
//
// The property under test is portability: a backup must be restorable by a build other than the one
// that wrote it. That is why it is written at the newest NUMBERED schema rather than at the runtime
// one — a file stamped with the unstable preview shape is restorable only by its own build, which
// is the opposite of what a backup is for.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as backup from "../../../src/data/backupFile.js";
import { DEFAULT_CLIENTS, DEFAULT_EXERCISES } from "../../../src/data/index.js";
import { CURRENT_SCHEMA_VERSION } from "../../../src/data/migrationSteps.js";
import { BACKUP_SCHEMA, LIVE_SCHEMAS, STABLE_SCHEMA } from "../../../src/data/recordSchemas.js";
import { migrateState } from "../../../src/data/schemaMigrations.js";

function database() {
  return {
    lang: "sl",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    clients: [...DEFAULT_CLIENTS],
    exercises: [...DEFAULT_EXERCISES],
    routines: [],
    history: [],
    planUpdates: [],
    sessions: [
      {
        id: "s1",
        day: "today",
        time: "09:00 - 10:00",
        title: "Morning",
        participants: [],
        startDate: "2026-08-10T07:00:00.000Z",
      },
    ],
    notifications: [],
  };
}

test("a backup is stamped at the newest numbered schema, never at the runtime one", () => {
  const payload = backup.buildBackupPayload(database());

  assert.equal(payload.schemaVersion, BACKUP_SCHEMA);
  assert.notEqual(
    payload.schemaVersion,
    CURRENT_SCHEMA_VERSION,
    "stamping the runtime schema would make the file restorable only by this build",
  );
  assert.equal(
    Number.isInteger(payload.schemaVersion),
    true,
    "a numbered shape, not a placeholder",
  );
});

test("a backup is written at the STABLE shape, and P is a superset of it", () => {
  // The invariant inverted when the two axes were unified. It used to be "backups use the newest
  // live shape"; now the newest live shape is P, which is exactly what a backup must NOT be written
  // at. The stable shape is a decision, not an accident of ordering.
  assert.equal(BACKUP_SCHEMA, STABLE_SCHEMA);
  assert.ok(BACKUP_SCHEMA in LIVE_SCHEMAS, "the backup shape has to be one the fan-out writes");

  // Every field of the stable shape exists in P. This is what makes rebuilding P from schema4 —
  // which happens whenever the build changes — lose ONLY preview-only fields, never a stable one.
  const stable = LIVE_SCHEMAS[STABLE_SCHEMA];
  const preview = LIVE_SCHEMAS.P;
  for (const [collection, shape] of Object.entries(stable)) {
    for (const field of Object.keys(shape)) {
      assert.ok(
        field in preview[collection],
        `${collection}.${field} is in the stable shape but missing from P — rebuilding P would drop it`,
      );
    }
  }
});

test("a backup carries its origin: when, which build, which runtime shape", () => {
  const payload = backup.buildBackupPayload(database(), {
    buildSha: "abc1234",
    now: new Date("2026-08-10T05:00:00.000Z"),
  });

  assert.equal(payload.exportedAt, "2026-08-10T05:00:00.000Z");
  assert.equal(payload.buildSha, "abc1234");
  // Reporting only — a restore keys off `schemaVersion`. This answers "which preview wrote this".
  assert.equal(payload.runtimeSchema, CURRENT_SCHEMA_VERSION);
});

test("every collection survives the round trip through the migration chain", () => {
  const state = database();
  const payload = backup.buildBackupPayload(state);
  const restored = migrateState(JSON.parse(JSON.stringify(payload)));

  assert.equal(restored.ok, true, JSON.stringify(restored.summary.problems));
  assert.equal(
    restored.state.schemaVersion,
    CURRENT_SCHEMA_VERSION,
    "restore ends at the runtime schema",
  );
  assert.equal(restored.state.clients.length, state.clients.length);
  assert.equal(restored.state.exercises.length, state.exercises.length);
  assert.equal(restored.state.sessions.length, 1);
  // An absolute timestamp already present is never recomputed from the coarse `day` bucket.
  assert.equal(restored.state.sessions[0].startDate, "2026-08-10T07:00:00.000Z");
});

test("the routing field the store adds does not leak into the file", () => {
  // `collection` exists to sort a record into its IndexedDB bucket. In a file it is noise, and on
  // restore it would be written back onto the domain object.
  const payload = backup.buildBackupPayload(database());

  for (const record of [...payload.clients, ...payload.exercises, ...payload.sessions]) {
    assert.ok(!("collection" in record), `${record.id} leaked its routing field`);
  }
});

test("the file records which build wrote it, without that affecting a restore", () => {
  // `buildSha` is a support breadcrumb, not a compatibility check. Two files declaring the same
  // NUMBERED schema have the same shape by definition — that is what a numbered schema means — so
  // comparing SHAs would imply a doubt that cannot exist. The only shape that varies between builds
  // is P, and P is never written to a file.
  const payload = backup.buildBackupPayload(database(), { buildSha: "abc1234" });
  const fromAnotherBuild = { ...payload, buildSha: "def5678" };

  const mine = migrateState(JSON.parse(JSON.stringify(payload)));
  const theirs = migrateState(JSON.parse(JSON.stringify(fromAnotherBuild)));

  assert.equal(mine.ok, true);
  assert.equal(theirs.ok, true, "a file from another build restores exactly the same way");
  assert.deepEqual(
    theirs.state.clients.map((c) => c.id),
    mine.state.clients.map((c) => c.id),
  );
});

test("a restore summary names what would be replaced, per collection", () => {
  // "Replace 8 clients, 1 session" is a sentence a trainer can weigh; "Are you sure?" is not.
  const summary = backup.summarizeReplacement(database());

  assert.equal(summary.counts.clients, DEFAULT_CLIENTS.length);
  assert.equal(summary.counts.sessions, 1);
  assert.ok(summary.total > 0);
  // Empty collections are omitted rather than listed as zero — a prompt should name only what is
  // actually at stake.
  assert.ok(!("history" in summary.counts));

  const empty = backup.summarizeReplacement({ clients: [], sessions: [] });
  assert.equal(empty.total, 0, "nothing at stake means no prompt at all");
});

test("settings that belong to the database, not to a record, are carried", () => {
  const payload = backup.buildBackupPayload(database());
  assert.equal(payload.lang, "sl");

  // Absent rather than defaulted: a null language means "never asked", and inventing "en" here
  // would record a choice the trainer never made (see i18n/index.js).
  const unasked = backup.buildBackupPayload({ ...database(), lang: null });
  assert.equal(unasked.lang, null);
});
