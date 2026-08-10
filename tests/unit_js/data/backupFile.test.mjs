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
import { BACKUP_SCHEMA, LIVE_SCHEMAS } from "../../../src/data/recordSchemas.js";
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

test("the backup schema is the newest live one, so it is a superset of the others", () => {
  // Shapes only gain fields under expand-first, so the newest carries every field an older one
  // does. That is what makes ONE shape per file sufficient — an older copy alongside it would hold
  // strictly less information at full size.
  const live = Object.keys(LIVE_SCHEMAS).map(Number);
  assert.equal(BACKUP_SCHEMA, Math.max(...live));

  const newest = LIVE_SCHEMAS[BACKUP_SCHEMA];
  for (const schema of live) {
    for (const [collection, shape] of Object.entries(LIVE_SCHEMAS[schema])) {
      for (const field of Object.keys(shape)) {
        assert.ok(
          field in newest[collection],
          `${collection}.${field} exists in schema ${schema} but not in the backup schema`,
        );
      }
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

test("origin is reported honestly, including when it cannot be known", () => {
  const sameBuild = backup.describeBackupOrigin({ buildSha: "abc1234" }, "abc1234");
  const otherBuild = backup.describeBackupOrigin({ buildSha: "def5678" }, "abc1234");
  // A file written before this metadata existed: neither confirmed same-build nor different, and
  // claiming either would be a guess presented as a fact.
  const older = backup.describeBackupOrigin({ clients: [] }, "abc1234");

  assert.equal(sameBuild.fromThisBuild, true);
  assert.equal(otherBuild.fromThisBuild, false);
  assert.equal(older.fromThisBuild, false);
  assert.equal(older.unknownOrigin, true);
  assert.equal(sameBuild.unknownOrigin, false);
});

test("settings that belong to the database, not to a record, are carried", () => {
  const payload = backup.buildBackupPayload(database());
  assert.equal(payload.lang, "sl");

  // Absent rather than defaulted: a null language means "never asked", and inventing "en" here
  // would record a choice the trainer never made (see i18n/index.js).
  const unasked = backup.buildBackupPayload({ ...database(), lang: null });
  assert.equal(unasked.lang, null);
});
