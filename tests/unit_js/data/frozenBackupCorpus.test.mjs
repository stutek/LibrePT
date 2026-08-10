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
// Asserted against the constant, not a literal: a migration that bumps the version should not
// need every "migrates to current" test edited alongside it.
import { CURRENT_SCHEMA_VERSION, MIGRATION_STEPS } from "../../../src/data/migrationSteps.js";
import * as m from "../../../src/data/schemaMigrations.js";

const FIXTURES_DIR = fileURLToPath(new URL("../../fixtures/backups/", import.meta.url));

function migrate(fixtureName) {
  const raw = readFileSync(FIXTURES_DIR + fixtureName, "utf-8");
  const result = m.migrateState(JSON.parse(raw));
  return {
    ok: result.ok,
    state: result.state,
    problems: result.summary.problems,
    applied: result.summary.applied,
  };
}

// Midnight of `offsetDays` from now, in LOCAL time — the v2→v3 step derives `startDate` from a
// local `new Date()`, so an assertion built in UTC would pass or fail purely on the runner's zone.
function localDayAt(offsetDays, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

test("schema1 baseline fixture still imports", () => {
  // Pre-`schemaVersion` (TODO §14.6): the legacy `bookings` field is dropped, not carried
  // forward — there is no real PT data to protect in the pre-release baseline.
  const r = migrate("schema1_baseline.json");

  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.equal(r.state.schemaVersion, CURRENT_SCHEMA_VERSION);
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
  assert.equal(r.state.schemaVersion, CURRENT_SCHEMA_VERSION);
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

// ---------------------------------------------------------------------------------------------
// The version-0 demo corpus: a realistic, demo-scale database frozen at the OLDEST readable shape,
// so the full chain is walked against something the size of a real trainer's database rather than
// the one-client toys above. It is deliberately NOT the app's demo seed (`DEFAULT_*` stays at the
// current version, untouched by migrations) — the v2→v3 derivation is lossy for `day: "upcoming"`,
// which is fine for a corpus nobody asserts a timeline spread against, and not fine for the seed.
// ---------------------------------------------------------------------------------------------

test("the v0 demo corpus walks EVERY migration step", () => {
  // This is the durable part: the corpus enters at the baseline, so a step added to the chain
  // without the corpus reaching it fails here rather than shipping untested. Compared against
  // MIGRATION_STEPS itself, never a hardcoded count.
  const r = migrate("schema0_demo.json");

  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.deepEqual(
    r.applied.map((step) => [step.from, step.to]),
    MIGRATION_STEPS.map((step) => [step.from, step.to]),
  );
  assert.equal(r.state.schemaVersion, CURRENT_SCHEMA_VERSION);
});

test("the v0 demo corpus survives the chain with its records intact", () => {
  // A migration that silently dropped a collection would still report `ok` — the runner's shape
  // validation only asserts arrays are arrays. Content is what actually matters to a trainer.
  const r = migrate("schema0_demo.json");

  assert.deepEqual(
    r.state.clients.map((client) => client.name),
    ["Jana Novak", "Marko Kos", "Ana Zupan"],
  );
  assert.equal(r.state.exercises.length, 5);
  assert.equal(r.state.routines.length, 2);
  assert.equal(r.state.history.length, 2);
  assert.equal(r.state.planUpdates.length, 2);
  assert.equal(r.state.sessions.length, 6);
  assert.equal(r.state.notifications.length, 1);

  // Nested structure, not just the top-level counts: the sets a PT logged are the least
  // recoverable thing in the database.
  const [firstHistory] = r.state.history;
  assert.equal(firstHistory.exercises[0].sets.length, 3);
  assert.equal(firstHistory.exercises[0].sets[0].note, "RPE 8");
  assert.equal(r.state.routines[0].exercises[0].circuitTitle, "Chest & Back Strength Complex");
});

test("the v0 demo corpus loses the legacy `bookings` field and keeps `sessions`", () => {
  // The v1→v2 rename window (TODO §14.6): a pre-release database could carry BOTH fields. The
  // step drops `bookings` outright — there was no real PT data to protect — while `sessions` is
  // what every later step and every reader actually keys off.
  const r = migrate("schema0_demo.json");

  assert.equal(r.state.bookings ?? null, null);
  assert.ok(r.state.sessions.length > 0);
});

test("the v0 demo corpus gains a derived `startDate` on every session", () => {
  // `startDate` is the only ABSOLUTE timestamp a session has — the timeline sorts, groups and
  // positions on it (sessionsView.js), and sessionClock.js reconciles the live session against it.
  // A v0 database predates it entirely, so this step is what makes old data placeable at all.
  const r = migrate("schema0_demo.json");
  const byId = Object.fromEntries(r.state.sessions.map((session) => [session.id, session]));

  for (const session of r.state.sessions) {
    assert.ok(session.startDate, `session ${session.id} has no derived startDate`);
    assert.ok(!Number.isNaN(Date.parse(session.startDate)));
  }

  // The bucket is untouched — overlap detection and card styling still key off it.
  assert.equal(byId.s03f2e3d.day, "tomorrow");
  assert.equal(byId.s03f2e3d.startDate, localDayAt(1, 10, 30));
  assert.equal(byId.s00f2e3d.startDate, localDayAt(-1, 9, 0));

  // `upcoming` is the lossy bucket: it has no magnitude, so it ALWAYS derives to +2 days no
  // matter how far out the session really was. Pinned here so the limitation stays visible.
  assert.equal(byId.s04f2e3d.startDate, localDayAt(2, 8, 0));

  // A session with no `time` string at all falls back to 09:00 on its bucket's day rather than
  // being left unplaceable.
  assert.equal(byId.s05f2e3d.startDate, localDayAt(1, 9, 0));
});

test("the v0 demo corpus has its stored language cleared so the PT is asked once", () => {
  // The v3→v4 step treats every pre-v4 database as never-asked (a forced "en" is indistinguishable
  // from a chosen one). The corpus stores "sl" precisely so this step has something to clear.
  const r = migrate("schema0_demo.json");

  assert.equal(r.state.lang, null);
  const langStep = r.applied.find((step) => step.to === 4);
  assert.ok(
    langStep.notes.some((note) => note.includes("sl")),
    `expected a note naming the cleared language, got ${JSON.stringify(langStep.notes)}`,
  );
});

test("every committed fixture is accounted for", () => {
  // A fixture file added to the corpus but never exercised above would silently stop being
  // tested the moment someone forgot to wire it up — this closes that gap structurally.
  const exercised = new Set(["schema0_demo.json", "schema1_baseline.json", "schema2.json"]);
  const onDisk = new Set(readdirSync(FIXTURES_DIR).filter((name) => name.endsWith(".json")));
  assert.deepEqual(
    [...onDisk].sort(),
    [...exercised].sort(),
    `fixture(s) present but not exercised by a test: ${[...onDisk].filter((n) => !exercised.has(n))}`,
  );
});
