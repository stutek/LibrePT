// tests/unit_js/data/storageNamespace.test.mjs
// The app's plain localStorage keys (TODO §16.5/§16.3, both resolved). Multi-version hosting was
// dropped — no release tags, no per-release bucket suffix — and the schema axis that would have
// replaced it already lives in IndexedDB's per-schema object stores (TODO §18.6 part 4), so there is
// no bucket-keying scheme left on the localStorage side at all: `readVersionScoped`/
// `writeVersionScoped`/`removeVersionScoped` are now plain, unsuffixed localStorage wrappers, and
// `librept_db` is read exactly once, as the one-time legacy import source for a device's move onto
// IndexedDB — never as a live, ongoing store.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/webStorageStub.mjs';
import * as m from '../../../src/data/storageNamespace.js';

test('read write remove are plain unsuffixed keys', () => {
  // No bucket-keying scheme survives here — every key is exactly what was asked for.
  localStorage.clear();
  m.writeVersionScoped('librept_db', '{"clients":["a"]}');
  const readBack = m.readVersionScoped('librept_db');
  m.removeVersionScoped('librept_db');
  const afterRemove = m.readVersionScoped('librept_db');

  assert.equal(readBack, '{"clients":["a"]}');
  assert.equal(afterRemove, null);
});
