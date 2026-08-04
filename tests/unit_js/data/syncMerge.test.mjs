// tests/unit_js/data/syncMerge.test.mjs
// Pure three-way merge for Google Drive appDataFolder sync (TODO §1.5/§3.3, src/data/syncMerge.js).
// These pin the actual decisions the design rests on: no wall-clock ordering, deletions win only when
// the other side left the record untouched, and same-record conflicts are reported rather than
// guessed away.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/data/syncMerge.js";

test("new records on either side are both kept", () => {
  const base = { widgets: [] };
  const local = { widgets: [{ id: "a", name: "local-only" }] };
  const remote = { widgets: [{ id: "b", name: "remote-only" }] };
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  assert.deepEqual(mergedState.widgets.map((r) => r.id).sort(), ["a", "b"]);
  assert.deepEqual(conflicts, []);
});

test("untouched record deleted remotely is dropped", () => {
  const base = { widgets: [{ id: "a", name: "x" }] };
  const local = { widgets: [{ id: "a", name: "x" }] }; // unchanged locally
  const remote = { widgets: [] }; // deleted remotely
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  assert.deepEqual(
    mergedState.widgets.map((r) => r.id),
    [],
  );
  assert.deepEqual(conflicts, []);
});

test("local edit beats a remote deletion and is flagged", () => {
  const base = { widgets: [{ id: "a", name: "x" }] };
  const local = { widgets: [{ id: "a", name: "edited" }] }; // edited locally
  const remote = { widgets: [] }; // deleted remotely
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  // Never silently destroy (DATA_MODEL §5): the edit survives the deletion.
  assert.deepEqual(mergedState.widgets, [{ id: "a", name: "edited" }]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].type, "edit-vs-delete");
});

test("untouched record deleted locally is dropped", () => {
  const base = { widgets: [{ id: "a", name: "x" }] };
  const local = { widgets: [] }; // deleted locally
  const remote = { widgets: [{ id: "a", name: "x" }] }; // unchanged remotely
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  assert.deepEqual(
    mergedState.widgets.map((r) => r.id),
    [],
  );
  assert.deepEqual(conflicts, []);
});

test("remote edit beats a local deletion and is flagged", () => {
  const base = { widgets: [{ id: "a", name: "x" }] };
  const local = { widgets: [] }; // deleted locally
  const remote = { widgets: [{ id: "a", name: "edited-remotely" }] };
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  assert.deepEqual(mergedState.widgets, [{ id: "a", name: "edited-remotely" }]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].type, "delete-vs-edit");
});

test("one sided edits are taken without a conflict", () => {
  const base = {
    widgets: [
      { id: "a", name: "x" },
      { id: "b", name: "y" },
    ],
  };
  const local = {
    widgets: [
      { id: "a", name: "x-edited" },
      { id: "b", name: "y" },
    ],
  };
  const remote = {
    widgets: [
      { id: "a", name: "x" },
      { id: "b", name: "y-edited" },
    ],
  };
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  const byId = Object.fromEntries(mergedState.widgets.map((r) => [r.id, r.name]));
  assert.deepEqual(byId, { a: "x-edited", b: "y-edited" });
  assert.deepEqual(conflicts, []);
});

test("conflicting edits to the same record prefer local and are flagged", () => {
  const base = { widgets: [{ id: "a", name: "x" }] };
  const local = { widgets: [{ id: "a", name: "local-edit" }] };
  const remote = { widgets: [{ id: "a", name: "remote-edit" }] };
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  assert.deepEqual(mergedState.widgets, [{ id: "a", name: "local-edit" }]);
  assert.equal(conflicts.length, 1);
  const conflict = conflicts[0];
  assert.equal(conflict.type, "edit-vs-edit");
  assert.equal(conflict.local.name, "local-edit");
  assert.equal(conflict.remote.name, "remote-edit");
});

test("identical edits on both sides are not a conflict", () => {
  const base = { widgets: [{ id: "a", name: "x" }] };
  const local = { widgets: [{ id: "a", name: "same-edit" }] };
  const remote = { widgets: [{ id: "a", name: "same-edit" }] };
  const { mergedState, conflicts } = m.mergeState(["widgets"], { base, local, remote });
  assert.deepEqual(mergedState.widgets, [{ id: "a", name: "same-edit" }]);
  assert.deepEqual(conflicts, []);
});

test("a repeat merge of the same state is a no op", () => {
  // Poll-on-resume calls syncNow() repeatedly; merging three identical snapshots must converge on
  // that same snapshot, not drift.
  const state = {
    widgets: [
      { id: "a", name: "x" },
      { id: "b", name: "y" },
    ],
  };
  const { mergedState, conflicts } = m.mergeState(["widgets"], {
    base: state,
    local: state,
    remote: state,
  });
  assert.deepEqual(mergedState.widgets.map((r) => r.id).sort(), ["a", "b"]);
  assert.deepEqual(conflicts, []);
});

test("key order differences do not look like a conflict", () => {
  // stableStringify exists precisely so a record that round-tripped through JSON (key order can
  // change) never registers as "changed" when nothing about its content did.
  const base = { widgets: [{ id: "a", name: "x", tag: "y" }] };
  const local = { widgets: [{ tag: "y", id: "a", name: "x" }] }; // same content, reordered
  const remote = { widgets: [{ id: "a", name: "x", tag: "y" }] };
  const { conflicts } = m.mergeState(["widgets"], { base, local, remote });
  assert.deepEqual(conflicts, []);
});
