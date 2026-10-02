// tests/unit_js/data/backupFormat.test.mjs
// The backup envelope version (src/data/backupFile.js).
//
// ONE integer on the envelope, and the format table says what it means. What makes it worth pinning
// is that both failure modes are silent and destructive: a reader that GUESSES at an unknown version
// imports an empty database over the trainer's real one, and a reader that stops understanding
// version-less files abandons every backup written before the field existed. "Retain readers
// forever" is a promise about files that already exist and cannot be reissued.

import assert from "node:assert/strict";
import { test } from "node:test";
import { AES_GCM_CONTAINER } from "../../../src/data/backupEncryption.js";
import {
  BACKUP_FORMATS,
  CURRENT_BACKUP_FORMAT,
  ENCRYPTED_BACKUP_FORMAT,
  buildBackupPayload,
  resolveBackupFormat,
} from "../../../src/data/backupFile.js";
import { BACKUP_SCHEMA } from "../../../src/data/recordSchemas.js";

test("a written backup declares the current envelope version", () => {
  const payload = buildBackupPayload({ lang: "en" });
  assert.equal(payload.formatVersion, CURRENT_BACKUP_FORMAT);
});

test("a plain file's envelope names the schema its payload states", () => {
  // Version 6 already named the encrypted schema-5 file when schema 6 was cut, so a plain file's
  // number stopped being its schema. What must still hold: the row the envelope points at and the
  // payload agree. A file where they differ is corrupt or hand-edited, not a valid combination.
  const payload = buildBackupPayload({ lang: "en" });
  assert.equal(resolveBackupFormat(payload).schema, payload.schemaVersion);
  assert.equal(payload.schemaVersion, BACKUP_SCHEMA);
});

test("the versions written today have rows saying how to open them, at today's schema", () => {
  // If BACKUP_SCHEMA moves without matching rows, this build writes files it cannot itself read.
  assert.equal(BACKUP_FORMATS[CURRENT_BACKUP_FORMAT].container, "json");
  assert.equal(BACKUP_FORMATS[CURRENT_BACKUP_FORMAT].schema, BACKUP_SCHEMA);
  assert.equal(BACKUP_FORMATS[ENCRYPTED_BACKUP_FORMAT].schema, BACKUP_SCHEMA);
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
  // A later encryption scheme is version 5 with a new row, not an edit to this one.
  assert.deepEqual(BACKUP_FORMATS[4], { container: "json" });
});

test("the encrypted container has its own version, and it names the schema inside", () => {
  // Version 6 is schema 5's records in an AES-GCM envelope, version 8 schema 6's. A row has to state
  // the schema, because the payload's own `schemaVersion` is under the ciphertext where no reader
  // can see it before decrypting — which is also what stops anyone altering it.
  for (const [version, schema] of [
    [6, 5],
    [8, 6],
  ]) {
    assert.equal(BACKUP_FORMATS[version].container, AES_GCM_CONTAINER);
    const resolved = resolveBackupFormat({ formatVersion: version, ciphertext: "…" });
    assert.equal(resolved.container, AES_GCM_CONTAINER);
    assert.equal(resolved.schema, schema, `an encrypted file at ${version} is read at ${schema}`);
    assert.equal(resolved.unsupported, undefined);
  }
});

test("every row can be opened by something this build has", () => {
  // A row with a container nothing implements is a file this build writes and cannot read back.
  for (const [version, row] of Object.entries(BACKUP_FORMATS)) {
    assert.ok(
      ["json", AES_GCM_CONTAINER].includes(row.container),
      `format ${version} names a container nothing here can open: ${row.container}`,
    );
  }
});
