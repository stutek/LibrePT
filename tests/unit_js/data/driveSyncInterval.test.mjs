// tests/unit_js/data/driveSyncInterval.test.mjs
// The configurable periodic-pull interval (src/data/driveSyncService.js): default, clamping to
// [MIN_SYNC_INTERVAL_MINUTES, MAX_SYNC_INTERVAL_MINUTES], and that a stored value round-trips. Pure
// read/write over localStorage, no network or auth involved, so this is tested directly against the
// module rather than through the UI.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/webStorageStub.mjs';
import * as m from '../../../src/data/driveSyncService.js';

test('default interval is five minutes', () => {
  localStorage.clear();
  assert.deepEqual(
    { current: m.getSyncIntervalMinutes(), constant: m.DEFAULT_SYNC_INTERVAL_MINUTES },
    { current: 5, constant: 5 }
  );
});

test('bounds are one to sixty', () => {
  localStorage.clear();
  assert.deepEqual(
    { min: m.MIN_SYNC_INTERVAL_MINUTES, max: m.MAX_SYNC_INTERVAL_MINUTES },
    { min: 1, max: 60 }
  );
});

test('a valid value round trips', () => {
  localStorage.clear();
  const set = m.setSyncIntervalMinutes(17);
  const read = m.getSyncIntervalMinutes();
  assert.deepEqual({ set, read }, { set: 17, read: 17 });
});

test('out of range values are clamped', () => {
  localStorage.clear();
  assert.deepEqual(
    {
      tooLow: m.setSyncIntervalMinutes(0),
      tooHigh: m.setSyncIntervalMinutes(999),
      negative: m.setSyncIntervalMinutes(-5),
    },
    { tooLow: 1, tooHigh: 60, negative: 1 }
  );
});

test('garbage input falls back to the default', () => {
  localStorage.clear();
  assert.deepEqual(
    {
      notANumber: m.setSyncIntervalMinutes('abc'),
      nothing: m.setSyncIntervalMinutes(undefined),
    },
    { notANumber: 5, nothing: 5 }
  );
});

test('fractional values round to the nearest minute', () => {
  localStorage.clear();
  assert.equal(m.setSyncIntervalMinutes(4.6), 5);
});
