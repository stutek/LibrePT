// tests/unit_js/data/frozenBackupCorpus.test.mjs
// The frozen backup-fixture corpus TODO §18.7/§18.13 asks for: one committed fixture per historical
// schema, asserted on every commit to still import to the expected domain object. Without this, a
// long-restore guarantee ("readers are retained forever") is a hope; with it, a regression in
// migrationSteps.js/schemaMigrations.js is caught against real frozen bytes, not an inline literal
// that could quietly evolve alongside the code that reads it.
//
// Add a new fixture here (never edit an existing one — that would stop testing what it always
// tested) whenever CURRENT_SCHEMA_VERSION bumps, capturing what a real backup from the schema being
// superseded looked like.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as m from "../../../src/data/schemaMigrations.js";

const FIXTURES_DIR = fileURLToPath(new URL("../../fixtures/backups/", import.meta.url));

function migrate(fixtureName) {
  const raw = readFileSync(FIXTURES_DIR + fixtureName, "utf-8");
  const result = m.migrateState(JSON.parse(raw));
  return { ok: result.ok, state: result.state, problems: result.summary.problems };
}

test("schema1 baseline fixture still imports", () => {
  // Pre-`schemaVersion` (TODO §14.6): the legacy `bookings` field is dropped, not carried
  // forward — there is no real PT data to protect in the pre-release baseline.
  const r = migrate("schema1_baseline.json");

  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.equal(r.state.schemaVersion, 3);
  assert.deepEqual(
    r.state.clients.map((c) => c.name),
    ["Legacy Client"],
  );
  assert.deepEqual(r.state.sessions, []);
  assert.equal(r.state.bookings ?? null, null);
});

test("schema2 fixture still imports and gains a derived start date", () => {
  // The v2->v3 step (TODO §7.3 item 8) must still derive `startDate` from `day`+`time` on a real
  // frozen schema-2 backup, not just on a same-commit literal.
  const r = migrate("schema2.json");

  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.equal(r.state.schemaVersion, 3);
  assert.deepEqual(
    r.state.clients.map((c) => c.name),
    ["Schema2 Client"],
  );
  const session = r.state.sessions[0];
  // day bucket is untouched — other systems still key off it
  assert.equal(session.day, "today");
  // schema 2 predates startDate — it must be derived on import
  assert.ok(session.startDate);
});

test("every committed fixture is accounted for", () => {
  // A fixture file added to the corpus but never exercised above would silently stop being
  // tested the moment someone forgot to wire it up — this closes that gap structurally.
  const exercised = new Set(["schema1_baseline.json", "schema2.json"]);
  const onDisk = new Set(readdirSync(FIXTURES_DIR).filter((name) => name.endsWith(".json")));
  assert.deepEqual(
    [...onDisk].sort(),
    [...exercised].sort(),
    `fixture(s) present but not exercised by a test: ${[...onDisk].filter((n) => !exercised.has(n))}`,
  );
});
