// tests/unit_js/data/schemaMigrations.test.mjs
// The schema-migration chain (TODO §16.2): a PT can sit on one version for months while several
// ship, so an upgrade walks a SEQUENCE of small per-version transforms rather than one big jump.
// Migrations can never be tested against a real PT's database — it is local-only by design — so the
// guarantees that stand in for that are pinned here: nothing is mutated in place, every step's
// output is validated, a bad step fails loud with the original data handed back, and a database
// written by a NEWER build is refused rather than guessed at (the rollback case).

import assert from "node:assert/strict";
import { test } from "node:test";
// Asserted against the constant, not a literal: a migration that bumps the version should not
// need every "migrates to current" test edited alongside it.
import {
  BASELINE_SCHEMA_VERSION,
  CURRENT_SCHEMA_VERSION,
  MIGRATION_STEPS,
  PREVIEW_VERSION,
  isPreviewVersion,
  schemaRank,
} from "../../../src/data/migrationSteps.js";
import * as m from "../../../src/data/schemaMigrations.js";

test("legacy bookings are carried over into sessions", () => {
  // The v1->v2 rename (fd59637): `bookings` became `sessions`, same records, same shape.
  const legacy = { clients: [{ id: "c1" }], bookings: [{ id: "b1" }, { id: "b2" }] };
  const result = m.migrateState(legacy);

  assert.equal(result.ok, true);
  // A database with no schemaVersion is the legacy baseline.
  assert.equal(result.summary.fromVersion, BASELINE_SCHEMA_VERSION);
  // `bookings` was a RENAME of `sessions`, so its records are carried over, never dropped —
  // dropping them would destroy the trainer's whole schedule.
  assert.equal(result.state.sessions.length, 2);
  assert.deepEqual(
    result.state.sessions.map((session) => session.id),
    ["b1", "b2"],
  );
  assert.equal(result.state.bookings ?? null, null);
  assert.equal(result.state.schemaVersion, result.summary.toVersion);
  // The input object is never mutated — the runner works on a clone.
  assert.equal(legacy.bookings.length, 2);
});

test("current database is a no op but gets stamped", () => {
  const current = {
    // The CURRENT version, whatever it is — hardcoding it means this test starts asserting
    // "one version behind runs no steps" the moment a migration lands, which is the opposite
    // of what it is for.
    schemaVersion: CURRENT_SCHEMA_VERSION,
    clients: [],
    sessions: [{ id: "s1", startDate: "2026-07-27T09:00:00.000Z" }],
  };
  const result = m.migrateState(current);

  assert.equal(result.ok, true);
  // an up-to-date database runs no steps
  assert.equal(result.summary.applied.length, 0);
  assert.equal(result.state.sessions.length, 1);
  assert.equal(result.state.schemaVersion, CURRENT_SCHEMA_VERSION);
});

test("pre-release sessions gain a derived start date", () => {
  // TODO §7.3 item 8, now folded into the chain from 0: a session with only a `day` bucket +
  // free-text `time` gets a real absolute `startDate`, without disturbing `day` itself (other
  // systems still key off it) or a session that already has one. `schemaVersion: 2` is a RETIRED
  // value — it must be read as pre-release and normalised, never refused as newer-build data.
  const legacy = {
    schemaVersion: 2,
    clients: [],
    sessions: [
      { id: "s1", day: "today", time: "09:00 - 10:00" },
      { id: "s2", day: "tomorrow", time: "14:30 - 15:00" },
      { id: "s3", day: "today", time: "09:00 - 10:00", startDate: "kept-as-is" },
    ],
  };
  const result = m.migrateState(legacy);
  // Read the derived timestamps back through local Date fields, not a hardcoded UTC
  // string — the migration builds `startDate` from local hour/minute, so asserting on it
  // must go through the same local lens rather than assuming a particular timezone.
  const s1Date = new Date(result.state.sessions[0].startDate);
  const s2Date = new Date(result.state.sessions[1].startDate);
  const description = m.describeMigration(result.summary);

  assert.equal(result.ok, true);
  assert.equal(result.state.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(result.summary.toVersion, CURRENT_SCHEMA_VERSION);
  // day bucket is untouched — other systems still key off it
  assert.equal(result.state.sessions[0].day, "today");
  // a real ISO timestamp, not a bucket label
  assert.equal(["2", "1"].includes(result.state.sessions[0].startDate[0]), true);
  assert.equal(s1Date.getHours(), 9);
  assert.equal(s1Date.getMinutes(), 0);
  assert.equal(s2Date.getHours(), 14);
  assert.equal(s2Date.getMinutes(), 30);
  // an existing startDate is never overwritten
  assert.equal(result.state.sessions[2].startDate, "kept-as-is");
  assert.equal(
    description.some((line) => line.includes("startDate")),
    true,
  );
});

test("data from a newer build is refused not guessed", () => {
  // The rollback case: an older build must never invent a backwards transform.
  const future = { schemaVersion: 99, clients: [{ id: "c1" }], sessions: [] };
  const result = m.migrateState(future);

  assert.equal(result.ok, false);
  assert.equal(
    result.summary.problems.some((problem) => problem.includes("newer version")),
    true,
  );
  // The caller gets its own object back, untouched — nothing is written over.
  assert.equal(result.state, future);
});

test("a step producing a bad shape fails loud", () => {
  const notAnObject = m.validateStateShape(null, 2);
  const badCollection = m.validateStateShape(
    { schemaVersion: 2, sessions: [], clients: "nope" },
    2,
  );
  const missingSessions = m.validateStateShape({ schemaVersion: 2 }, 2);
  const wrongVersion = m.validateStateShape({ schemaVersion: 1, sessions: [] }, 2);
  const clean = m.validateStateShape({ schemaVersion: 2, sessions: [], clients: [] }, 2);
  const detectLegacy = m.detectSchemaVersion({});
  const detectStored = m.detectSchemaVersion({ schemaVersion: 7 });
  const detectGarbage = m.detectSchemaVersion({ schemaVersion: "two" });
  // A recognised version enters the chain at its OWN position, so it runs only the steps it still
  // needs — this is what stops a database at 4 re-running the v3->v4 language clear.
  const detectKnown = [1, 2, 3, 4].map((v) => m.detectSchemaVersion({ schemaVersion: v }));
  // Below the floor means the same thing as no field at all.
  const detectBelowFloor = m.detectSchemaVersion({ schemaVersion: 0 });

  assert.deepEqual(notAnObject, ["the migrated database is not an object"]);
  assert.equal(
    badCollection.some((problem) => problem.includes("clients")),
    true,
  );
  assert.equal(
    missingSessions.some((problem) => problem.includes("sessions")),
    true,
  );
  assert.equal(
    wrongVersion.some((problem) => problem.includes("schemaVersion")),
    true,
  );
  assert.deepEqual(clean, []);
  assert.equal(detectLegacy, BASELINE_SCHEMA_VERSION);
  assert.equal(detectStored, 7);
  assert.equal(detectGarbage, BASELINE_SCHEMA_VERSION);
  assert.deepEqual(detectKnown, [1, 2, 3, 4]);
  assert.equal(detectBelowFloor, BASELINE_SCHEMA_VERSION);
});

test("absent collections are filled in but corrupt ones still fail", () => {
  // A hand-trimmed backup (or one taken before a collection existed) reaches every renderer, so
  // missing collections are filled in once here rather than defended against at each read site —
  // but a key that is present and NOT a list is corruption, and must still fail loudly.
  const sparse = m.migrateState({ clients: [{ id: "c1" }] });
  const corrupt = m.migrateState({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sessions: [],
    clients: "nope",
  });

  assert.equal(sparse.ok, true);
  assert.deepEqual(sparse.state.history, []);
  assert.deepEqual(sparse.state.notifications, []);
  assert.deepEqual(sparse.state.planUpdates, []);
  // filling in blanks never touches data that is actually there
  assert.equal(sparse.state.clients.length, 1);
  assert.equal(corrupt.ok, false);
  assert.equal(
    corrupt.summary.problems.some((problem) => problem.includes("clients")),
    true,
  );
});

test("the chain from 0 clears the stored language so everyone is asked once", async () => {
  // Deliberately treats every existing PT as never-asked: before the splash could offer a choice,
  // `lang` was forced to "en" wherever it was absent, so a chosen English and a never-asked
  // trainer are the same stored value and cannot be told apart after the fact.
  const migrated = m.migrateState({ schemaVersion: 0, lang: "en", sessions: [] });
  assert.equal(migrated.state.lang, null);
  assert.equal(migrated.state.schemaVersion, CURRENT_SCHEMA_VERSION);
});

test("the chain from 0 clears a non-English stored language too", async () => {
  const migrated = m.migrateState({ schemaVersion: 0, lang: "sl", sessions: [] });
  assert.equal(migrated.state.lang, null);
});

test("schema 4 is active; a legacy P reads as 4 and a preview shape is refused", () => {
  // Ruled 2026-09-17 (TODO §61): schema 4 is the active schema, and everything P held moved into it.
  assert.equal(CURRENT_SCHEMA_VERSION, 4);

  // A stored "P" is schema 4 now: accepted, not walked back through the chain. Walking it from the
  // floor would run the 3 → 4 step again and ask a trainer who chose a language to choose again.
  assert.equal(schemaRank("P"), schemaRank(CURRENT_SCHEMA_VERSION));
  const legacy = m.migrateState({ schemaVersion: "P", lang: "sl", sessions: [] });
  assert.equal(legacy.ok, true);
  assert.equal(legacy.state.schemaVersion, 4);
  assert.equal(legacy.state.lang, "sl", "a settled language question stays settled");

  assert.equal(schemaRank("nonsense"), null);
  assert.equal(BASELINE_SCHEMA_VERSION, 1);

  // The chain runs contiguously from the floor up to the active schema.
  assert.equal(MIGRATION_STEPS[0].from, BASELINE_SCHEMA_VERSION);
  assert.equal(MIGRATION_STEPS.at(-1).to, CURRENT_SCHEMA_VERSION);
  for (const [index, step] of MIGRATION_STEPS.slice(1).entries()) {
    assert.equal(step.from, MIGRATION_STEPS[index].to, `gap before step v${step.from}→v${step.to}`);
  }
});

test("PREVIEW data is refused by its version, towards the active schema or any later one", () => {
  // Wanted 2026-09-17 (Simon, TODO §63): refused because it IS preview data, not because the next
  // version happens not to exist. Before this, 4.5 was refused only as "newer" — and would have been
  // accepted once 5 was active, stamped 5 with the 4 → 5 step skipped — while "PREVIEW" was taken for
  // a pre-release database, walked through the whole chain and lost its stored language.
  for (const version of [PREVIEW_VERSION, 4.5, 5.5]) {
    assert.equal(isPreviewVersion(version), true, String(version));
    const result = m.migrateState({ schemaVersion: version, lang: "sl", sessions: [] });
    assert.equal(result.ok, false, `${version} must be refused`);
    assert.match(result.summary.problems.join(" "), /preview/, "and the refusal says why");
    assert.deepEqual(result.summary.applied, [], "no step ran on it");
  }
  // The rule does not depend on the active schema: a version is preview by what it is, and every
  // numbered version that could ever be active is not one.
  for (const version of [4, 5, 6]) assert.equal(isPreviewVersion(version), false, String(version));
});

// --- Forward-migration consent (TODO §18.7's last open item). The restore prompt says what a trainer
// loses from THIS DEVICE; it never said what importing does to the FILE. Bringing a schema-3 backup
// forward means it stops being openable by the older build the trainer may still have on another phone —
// a one-way door, and the kind a person is entitled to be told about before walking through it. ---

test("a file that has to be brought forward is reported as such", () => {
  const older = m.migrateState({ schemaVersion: 1, clients: [], exercises: [] });

  assert.equal(m.bringsDataForward(older.summary), true);
  assert.ok(m.describeMigration(older.summary).length > 0, "and it can say what moved");
});

test("a file already at this build's shape moves nothing, and asks nothing", () => {
  // The common case — yesterday's backup restored today. A consent prompt here would be a dialog with
  // no consequence behind it, which is how prompts stop being read.
  const current = m.migrateState({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    clients: [],
    exercises: [],
  });

  assert.equal(m.bringsDataForward(current.summary), false);
});

test("a refused file is not reported as bringing anything forward", () => {
  // Nothing was applied, because nothing could be. Reporting a migration here would offer consent for
  // an import that is not going to happen.
  const refused = m.migrateState({ schemaVersion: 99, clients: [], exercises: [] });

  assert.equal(refused.ok, false);
  assert.equal(m.bringsDataForward(refused.summary), false);
});

test("no summary at all is not a migration", () => {
  assert.equal(m.bringsDataForward(null), false);
  assert.equal(m.bringsDataForward(undefined), false);
});
