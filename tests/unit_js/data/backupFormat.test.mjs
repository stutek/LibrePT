// tests/unit_js/data/backupFormat.test.mjs
// The backup envelope version (TODO §18.7, src/data/backupFile.js).
//
// ONE integer on the envelope, shared by the container and the records. What makes it worth pinning
// is that both failure modes are silent and destructive: a reader that GUESSES at an unknown version
// imports an empty database over the trainer's real one, and a reader that stops understanding
// version-less files abandons every backup written before the field existed. "Retain readers
// forever" is a promise about files that already exist and cannot be reissued.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BACKUP_FORMATS,
  CURRENT_BACKUP_FORMAT,
  buildBackupPayload,
  resolveBackupFormat,
} from "../../../src/data/backupFile.js";
import { BACKUP_SCHEMA } from "../../../src/data/recordSchemas.js";

test("a written backup declares the current envelope version", () => {
  const payload = buildBackupPayload({ lang: "en" });
  assert.equal(payload.formatVersion, CURRENT_BACKUP_FORMAT);
});

test("the envelope version IS the schema version", () => {
  // The design decision, pinned: one number written twice, never two numbers that could disagree.
  // A file whose envelope and payload differ is corrupt or hand-edited, not a valid combination.
  const payload = buildBackupPayload({ lang: "en" });
  assert.equal(payload.formatVersion, payload.schemaVersion);
  assert.equal(resolveBackupFormat(payload).schema, BACKUP_SCHEMA);
});

test("the version written today has a row saying how to open it", () => {
  // If BACKUP_SCHEMA moves without a matching row, this build writes files it cannot itself read.
  assert.equal(CURRENT_BACKUP_FORMAT, BACKUP_SCHEMA);
  assert.equal(BACKUP_FORMATS[CURRENT_BACKUP_FORMAT].container, "json");
});

test("an unknown envelope version is refused, not guessed at", () => {
  // The dangerous case. A newer file may be compressed or encrypted, so its collections are not
  // where this reader looks — and "no clients array" reads as an empty database worth restoring.
  const result = resolveBackupFormat({ formatVersion: 99, clients: [] });
  assert.equal(result.unsupported, true);
  assert.equal(result.formatVersion, 99);
  assert.equal(result.schema, undefined, "an unopenable file must not report a record schema");
});

test("a file written before the field existed is still readable", () => {
  // Every backup exported before 2026-08-15 has no formatVersion. Those files cannot be reissued,
  // so this path is permanent — the frozen corpus in tests/fixtures/backups/ is all of this shape.
  const legacy = { schemaVersion: 3, clients: [], exercises: [] };
  const result = resolveBackupFormat(legacy);
  assert.equal(result.legacy, true);
  assert.equal(result.container, "json");
  assert.equal(result.schema, 3, "the payload states its own schema when the envelope does not");
  assert.notEqual(result.unsupported, true);
});

test("a legacy file with no schema either is still not treated as unopenable", () => {
  // migrationSteps.js treats a missing schemaVersion as version 1. That is the chain's call to make,
  // and refusing the file here would take it away.
  const result = resolveBackupFormat({ clients: [] });
  assert.notEqual(result.unsupported, true);
  assert.equal(result.legacy, true);
});

test("version 4 stays a plain-JSON container", () => {
  // Rows are append-only: a file declaring 4 is in the wild forever, so row 4 must keep meaning
  // what it meant when written. Editing it in place silently redefines files nobody can re-export.
  // §18.8's encryption is version 5 with a new row, not an edit to this one.
  assert.deepEqual(BACKUP_FORMATS[4], { container: "json" });
});
