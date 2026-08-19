// tests/unit_js/data/dataWipe.test.mjs
// What a support wipe offers, and what it admits it cannot reach (TODO §31, src/data/dataWipe.js).
//
// The link that opens this dialog is sent by SMS or email to someone who is already confused, so the
// planning here is deliberately dull and total: every store the device actually has, named, with
// nothing inferred and nothing hidden. The dialog is the only thing standing between a forwarded
// message and somebody's client history — see §31.1 — so what it lists has to be the truth about
// THIS device rather than what the current build expects to find.

import assert from "node:assert/strict";
import { test } from "node:test";
import { UNVERSIONED_TARGET, planDataWipe, wipeSummary } from "../../../src/data/dataWipe.js";

const device = (storeNames, localKeys = ["librept_state", "librept_terms_accepted"]) => ({
  storeNames,
  localStorageKeys: localKeys,
});

test("every schema store on the device is offered separately", () => {
  const plan = planDataWipe(device(["schema4", "schemaP", "meta"]));

  assert.deepEqual(
    plan.targets.filter((target) => target.kind === "schema").map((target) => target.id),
    ["schema4", "schemaP"],
  );
});

test("a store this build no longer knows about is still offered", () => {
  // The whole point of a support wipe: a device that has been through three years of migrations may
  // carry a store nothing in the current code mentions, and leaving it behind would make "wipe my
  // data" a lie. Nothing here is matched against the build's own schema list.
  const plan = planDataWipe(device(["schema2", "schema4", "meta"]));

  assert.ok(
    plan.targets.some((target) => target.id === "schema2"),
    "a legacy store nobody remembers is exactly what a support wipe is for",
  );
});

test("everything belonging to no schema is one target, named as such", () => {
  const plan = planDataWipe(device(["schema4", "meta"]));

  const unversioned = plan.targets.find((target) => target.id === UNVERSIONED_TARGET);
  assert.equal(unversioned.kind, "unversioned");
  // The meta store and the browser keys travel together: both are per-device bookkeeping — the
  // active session, which notifications were read, the terms acceptance, the Drive sync pointer.
  assert.deepEqual(unversioned.stores, ["meta"]);
  assert.deepEqual(unversioned.localStorageKeys, ["librept_state", "librept_terms_accepted"]);
});

test("only this app's browser keys are touched", () => {
  const plan = planDataWipe(
    device(["schema4", "meta"], ["librept_state", "unrelated_app_token", "openpt_legacy"]),
  );

  const unversioned = plan.targets.find((target) => target.id === UNVERSIONED_TARGET);
  // `openpt_` is this app's own former name and is ours to remove; a stranger's key in the same
  // origin is not.
  assert.deepEqual(unversioned.localStorageKeys, ["librept_state", "openpt_legacy"]);
});

test("everything is selected by default — a support wipe is not a shopping trip", () => {
  const plan = planDataWipe(device(["schema4", "schemaP", "meta"]));

  assert.ok(plan.targets.every((target) => target.selected));
});

test("a device with nothing on it offers nothing to remove", () => {
  const plan = planDataWipe(device([], []));

  assert.deepEqual(plan.targets, []);
  assert.equal(plan.hasAnything, false);
});

test("the summary states what the wipe cannot reach, always", () => {
  // The maintainer's own note, and it is not optional: a support wipe that implied it had cleared a
  // client's inbox or a Drive file would be worse than no wipe at all.
  const summary = wipeSummary(planDataWipe(device(["schema4", "meta"])));

  assert.equal(summary.unreachable.length > 0, true);
  const said = summary.unreachable.join(" ").toLowerCase();
  for (const elsewhere of ["backup", "export", "drive"]) {
    assert.ok(said.includes(elsewhere), `the note says nothing about ${elsewhere}: ${said}`);
  }
});

test("the summary counts what WILL go, from the selection", () => {
  const plan = planDataWipe(device(["schema4", "schemaP", "meta"]));
  plan.targets.find((target) => target.id === "schemaP").selected = false;

  const summary = wipeSummary(plan);

  assert.deepEqual(summary.selectedIds, ["schema4", UNVERSIONED_TARGET]);
  assert.equal(summary.nothingSelected, false);
});

test("deselecting everything is reported, so the dialog can refuse to fire", () => {
  const plan = planDataWipe(device(["schema4", "meta"]));
  for (const target of plan.targets) target.selected = false;

  assert.equal(wipeSummary(plan).nothingSelected, true);
});
