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
  // TODO §7.3 item 8, now folded into the single 0→P step: a session with only a `day` bucket +
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

test("the 0 to P step clears the stored language so everyone is asked once", async () => {
  // Deliberately treats every existing PT as never-asked: before the splash could offer a choice,
  // `lang` was forced to "en" wherever it was absent, so a chosen English and a never-asked
  // trainer are the same stored value and cannot be told apart after the fact.
  const migrated = m.migrateState({ schemaVersion: 0, lang: "en", sessions: [] });
  assert.equal(migrated.state.lang, null);
  assert.equal(migrated.state.schemaVersion, CURRENT_SCHEMA_VERSION);
});

test("the 0 to P step clears a non-English stored language too", async () => {
  const migrated = m.migrateState({ schemaVersion: 0, lang: "sl", sessions: [] });
  assert.equal(migrated.state.lang, null);
});

test("P ranks above every numbered version and below the next stable one", () => {
  // P is the value RECORDED; the rank is only how it sorts, and both bounds carry weight.
  const NEXT_STABLE_VERSION = 5;
  const currentRank = schemaRank(CURRENT_SCHEMA_VERSION);
  const highestChainVersion = Math.max(...MIGRATION_STEPS.map((step) => step.to));

  // A fraction must never reach storage — that is the whole reason P is a letter.
  assert.equal(CURRENT_SCHEMA_VERSION, "P");
  // Above every numbered version the chain produces, so they all migrate up into P rather than
  // reading as newer than the build and being refused.
  assert.ok(
    currentRank > highestChainVersion,
    `current ranks ${currentRank}, which does not sort above chain version ${highestChainVersion}`,
  );
  // The other half of why P is fractional: it must stay BELOW the next stable version, so that the
  // day 5 is created from P's final state, every preview database is already below current and
  // re-enters at the floor on its own. An integer P above 5 would instead read as newer than the
  // release build and be refused, and release would need a retirement step to undo that.
  assert.ok(
    currentRank < NEXT_STABLE_VERSION,
    `current ranks ${currentRank}, which would outrank the stable ${NEXT_STABLE_VERSION} it precedes`,
  );
  // Every fraction is P, not just this one — preview data is disposable, so telling 4.5 from 5.5
  // buys nothing and would leave the release that mints 5 with old preview values to clean up.
  assert.equal(schemaRank(5.5), currentRank);
  assert.equal(schemaRank(4.5), currentRank);
  assert.equal(schemaRank("nonsense"), null);
  assert.equal(BASELINE_SCHEMA_VERSION, 1);

  // The chain runs contiguously from the floor up to the highest numbered version, and P sits above
  // that — so a database at ANY point on it walks only the steps it is missing and ends at P.
  assert.equal(MIGRATION_STEPS[0].from, BASELINE_SCHEMA_VERSION);
  for (const [index, step] of MIGRATION_STEPS.slice(1).entries()) {
    assert.equal(step.from, MIGRATION_STEPS[index].to, `gap before step v${step.from}→v${step.to}`);
  }
});
