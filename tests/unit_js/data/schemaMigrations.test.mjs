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
} from "../../../src/data/migrationSteps.js";
import * as m from "../../../src/data/schemaMigrations.js";

test("legacy database with no sessions collection gets one", () => {
  // Pre-release, an old `bookings`-shaped database (or any v1 database missing `sessions`
  // entirely) is not migrated forward — there is no real PT data to protect (TODO §14.6) — it just
  // ends up with an empty `sessions` collection like any other database missing the field.
  const legacy = { clients: [{ id: "c1" }], bookings: [{ id: "b1" }, { id: "b2" }] };
  const result = m.migrateState(legacy);

  assert.equal(result.ok, true);
  // A database with no schemaVersion is the pre-release baseline.
  assert.equal(result.summary.fromVersion, BASELINE_SCHEMA_VERSION);
  // the old `bookings` collection is dropped, not carried over
  assert.equal(result.state.sessions.length, 0);
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
  // Every burned value reads as pre-release, not as a version of its own.
  const detectRetired = [2, 3, 4].map((v) => m.detectSchemaVersion({ schemaVersion: v }));

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
  assert.deepEqual(detectRetired, [0, 0, 0]);
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

test("current stays above every retired version", () => {
  // 1, 2, 3 and 4 were stamped into real pre-release databases and are retired. They are rescued by
  // a COMPARISON — anything below current re-enters at the floor — which needs no list to maintain
  // and cannot forget a value nobody remembered to enumerate.
  //
  // That only works while current sits above all of them, which is the entire reason the chain
  // starts at 5. Dropping current to 1 would put three retired values ABOVE it, where they read as
  // "written by a newer build" and get refused — stranding exactly the databases the rule exists to
  // rescue. This fails the build rather than letting that regress silently.
  const HIGHEST_RETIRED_VERSION = 4;

  assert.ok(
    CURRENT_SCHEMA_VERSION > HIGHEST_RETIRED_VERSION,
    `current is ${CURRENT_SCHEMA_VERSION}, which does not sort above retired version ${HIGHEST_RETIRED_VERSION}`,
  );
  assert.equal(BASELINE_SCHEMA_VERSION, 0);
  for (const retired of [1, 2, 3, 4]) {
    assert.equal(
      m.detectSchemaVersion({ schemaVersion: retired }),
      BASELINE_SCHEMA_VERSION,
      `retired version ${retired} must read as pre-release, not as a version of its own`,
    );
  }
});
