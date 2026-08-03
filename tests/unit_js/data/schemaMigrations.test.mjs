// tests/unit_js/data/schemaMigrations.test.mjs
// The schema-migration chain (TODO §16.2): a PT can sit on one version for months while several
// ship, so an upgrade walks a SEQUENCE of small per-version transforms rather than one big jump.
// Migrations can never be tested against a real PT's database — it is local-only by design — so the
// guarantees that stand in for that are pinned here: nothing is mutated in place, every step's
// output is validated, a bad step fails loud with the original data handed back, and a database
// written by a NEWER build is refused rather than guessed at (the rollback case).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../../../src/data/schemaMigrations.js';

test('legacy database with no sessions collection gets one', () => {
  // Pre-release, an old `bookings`-shaped database (or any v1 database missing `sessions`
  // entirely) is not migrated forward — there is no real PT data to protect (TODO §14.6) — it just
  // ends up with an empty `sessions` collection like any other database missing the field.
  const legacy = { clients: [{ id: 'c1' }], bookings: [{ id: 'b1' }, { id: 'b2' }] };
  const result = m.migrateState(legacy);

  assert.equal(result.ok, true);
  // A database with no schemaVersion is the legacy baseline, v1.
  assert.equal(result.summary.fromVersion, 1);
  // the old `bookings` collection is dropped, not carried over
  assert.equal(result.state.sessions.length, 0);
  assert.equal(result.state.bookings ?? null, null);
  assert.equal(result.state.schemaVersion, result.summary.toVersion);
  // The input object is never mutated — the runner works on a clone.
  assert.equal(legacy.bookings.length, 2);
});

test('current database is a no op but gets stamped', () => {
  const current = {
    schemaVersion: 3,
    clients: [],
    sessions: [{ id: 's1', startDate: '2026-07-27T09:00:00.000Z' }],
  };
  const result = m.migrateState(current);

  assert.equal(result.ok, true);
  // an up-to-date database runs no steps
  assert.equal(result.summary.applied.length, 0);
  assert.equal(result.state.sessions.length, 1);
  assert.equal(result.state.schemaVersion, 3);
});

test('v2 sessions gain a derived start date', () => {
  // The v2→v3 step (TODO §7.3 item 8): a session with only a `day` bucket + free-text `time`
  // gets a real absolute `startDate`, without disturbing `day` itself (other systems still key
  // off it) or a session that already has one.
  const legacy = {
    schemaVersion: 2,
    clients: [],
    sessions: [
      { id: 's1', day: 'today', time: '09:00 - 10:00' },
      { id: 's2', day: 'tomorrow', time: '14:30 - 15:00' },
      { id: 's3', day: 'today', time: '09:00 - 10:00', startDate: 'kept-as-is' },
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
  assert.equal(result.state.schemaVersion, 3);
  assert.equal(result.summary.toVersion, 3);
  // day bucket is untouched — other systems still key off it
  assert.equal(result.state.sessions[0].day, 'today');
  // a real ISO timestamp, not a bucket label
  assert.equal(['2', '1'].includes(result.state.sessions[0].startDate[0]), true);
  assert.equal(s1Date.getHours(), 9);
  assert.equal(s1Date.getMinutes(), 0);
  assert.equal(s2Date.getHours(), 14);
  assert.equal(s2Date.getMinutes(), 30);
  // an existing startDate is never overwritten
  assert.equal(result.state.sessions[2].startDate, 'kept-as-is');
  assert.equal(
    description.some((line) => line.includes('startDate')),
    true
  );
});

test('data from a newer build is refused not guessed', () => {
  // The rollback case: an older build must never invent a backwards transform.
  const future = { schemaVersion: 99, clients: [{ id: 'c1' }], sessions: [] };
  const result = m.migrateState(future);

  assert.equal(result.ok, false);
  assert.equal(
    result.summary.problems.some((problem) => problem.includes('newer version')),
    true
  );
  // The caller gets its own object back, untouched — nothing is written over.
  assert.equal(result.state, future);
});

test('a step producing a bad shape fails loud', () => {
  const notAnObject = m.validateStateShape(null, 2);
  const badCollection = m.validateStateShape({ schemaVersion: 2, sessions: [], clients: 'nope' }, 2);
  const missingSessions = m.validateStateShape({ schemaVersion: 2 }, 2);
  const wrongVersion = m.validateStateShape({ schemaVersion: 1, sessions: [] }, 2);
  const clean = m.validateStateShape({ schemaVersion: 2, sessions: [], clients: [] }, 2);
  const detectLegacy = m.detectSchemaVersion({});
  const detectStored = m.detectSchemaVersion({ schemaVersion: 7 });
  const detectGarbage = m.detectSchemaVersion({ schemaVersion: 'two' });

  assert.deepEqual(notAnObject, ['the migrated database is not an object']);
  assert.equal(
    badCollection.some((problem) => problem.includes('clients')),
    true
  );
  assert.equal(
    missingSessions.some((problem) => problem.includes('sessions')),
    true
  );
  assert.equal(
    wrongVersion.some((problem) => problem.includes('schemaVersion')),
    true
  );
  assert.deepEqual(clean, []);
  assert.equal(detectLegacy, 1);
  assert.equal(detectStored, 7);
  assert.equal(detectGarbage, 1);
});

test('absent collections are filled in but corrupt ones still fail', () => {
  // A hand-trimmed backup (or one taken before a collection existed) reaches every renderer, so
  // missing collections are filled in once here rather than defended against at each read site —
  // but a key that is present and NOT a list is corruption, and must still fail loudly.
  const sparse = m.migrateState({ clients: [{ id: 'c1' }] });
  const corrupt = m.migrateState({ schemaVersion: 2, sessions: [], clients: 'nope' });

  assert.equal(sparse.ok, true);
  assert.deepEqual(sparse.state.history, []);
  assert.deepEqual(sparse.state.notifications, []);
  assert.deepEqual(sparse.state.planUpdates, []);
  // filling in blanks never touches data that is actually there
  assert.equal(sparse.state.clients.length, 1);
  assert.equal(corrupt.ok, false);
  assert.equal(
    corrupt.summary.problems.some((problem) => problem.includes('clients')),
    true
  );
});
