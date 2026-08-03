// tests/unit_js/data/driveSyncConflict.test.mjs
// resolveSyncConflict() (src/data/driveSyncService.js, TODO §3.3) — the "not built" gap that section
// used to flag: a sync's three-way merge (syncMerge.js) already applies a safe default per conflict
// and reports it, but nothing let a trainer override that default. This pins the override itself:
// it doesn't re-run the merge, it replaces (or deletes) the one record in local state that the
// conflict names.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../helpers/webStorageStub.mjs';
import * as svc from '../../../src/data/driveSyncService.js';
import * as store from '../../../src/data/stateStore.js';

test('keeping the remote side overwrites the local record', () => {
  localStorage.clear();
  const state = store.getState();
  state.exercises = [{ id: 'ex1', name: 'local-name' }];
  store.setState(state);

  const conflict = {
    collection: 'exercises',
    id: 'ex1',
    type: 'edit-vs-edit',
    local: { id: 'ex1', name: 'local-name' },
    remote: { id: 'ex1', name: 'remote-name' },
  };
  svc.resolveSyncConflict(conflict, 'remote');
  assert.deepEqual(store.getState().exercises, [{ id: 'ex1', name: 'remote-name' }]);
});

test('keeping the local side leaves the record unchanged', () => {
  localStorage.clear();
  const state = store.getState();
  state.exercises = [{ id: 'ex1', name: 'local-name' }];
  store.setState(state);

  const conflict = {
    collection: 'exercises',
    id: 'ex1',
    type: 'edit-vs-edit',
    local: { id: 'ex1', name: 'local-name' },
    remote: { id: 'ex1', name: 'remote-name' },
  };
  svc.resolveSyncConflict(conflict, 'local');
  assert.deepEqual(store.getState().exercises, [{ id: 'ex1', name: 'local-name' }]);
});

test('choosing the deleted side removes the survivor', () => {
  localStorage.clear();
  // delete-vs-edit / edit-vs-delete conflicts report the deleted side as null (syncMerge.js) — a
  // trainer picking that side is how the merge's "an edit always wins" default gets overridden
  // back to honouring the deletion.
  const state = store.getState();
  state.exercises = [{ id: 'ex1', name: 'edited-elsewhere' }];
  store.setState(state);

  const conflict = {
    collection: 'exercises',
    id: 'ex1',
    type: 'delete-vs-edit',
    local: null,
    remote: { id: 'ex1', name: 'edited-elsewhere' },
  };
  svc.resolveSyncConflict(conflict, 'local');
  assert.deepEqual(store.getState().exercises, []);
});

test('resolving one conflict leaves unrelated records untouched', () => {
  localStorage.clear();
  const state = store.getState();
  state.exercises = [
    { id: 'ex1', name: 'local-name' },
    { id: 'ex2', name: 'untouched' },
  ];
  store.setState(state);

  const conflict = {
    collection: 'exercises',
    id: 'ex1',
    type: 'edit-vs-edit',
    local: { id: 'ex1', name: 'local-name' },
    remote: { id: 'ex1', name: 'remote-name' },
  };
  svc.resolveSyncConflict(conflict, 'remote');
  assert.deepEqual(
    store.getState().exercises.map((r) => r.id).sort(),
    ['ex1', 'ex2']
  );
});
