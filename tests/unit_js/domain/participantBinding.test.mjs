// tests/unit_js/domain/participantBinding.test.mjs
// Several participants training ONE programme (src/domain/participantBinding.js) — TODO §8.1.
//
// The promise: the trainer logs the set once and it counts for everyone doing it, while what each
// person THOUGHT of it stays their own — one client can find a shared circuit too hard while
// another finds it too easy.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bindingFor,
  bindingMembers,
  boundClientRoutines,
  unboundClientRoutines,
  withBinding,
  withoutBinding,
} from "../../../src/domain/participantBinding.js";

const plan = (name) => ({
  routineName: name,
  exercises: [{ id: "e1", name: "Back Squat" }],
  logs: {},
});

test("participants with no binding keep their own plans", () => {
  const routines = { jane: plan("Jane's"), john: plan("John's") };

  const bound = boundClientRoutines(routines, []);

  assert.notEqual(bound.jane, bound.john);
});

test("bound participants share ONE plan, so logging it once counts for all of them", () => {
  const routines = { jane: plan("Shared"), john: plan("John's"), sarah: plan("Sarah's") };

  const bound = boundClientRoutines(routines, [["jane", "john"]]);
  bound.jane.logs.e1 = [{ reps: 10, completed: true }];

  assert.equal(bound.john.logs.e1[0].completed, true, "the set was logged once, for both");
  assert.notEqual(bound.sarah, bound.jane, "somebody outside the binding is untouched");
});

test("the shared plan is the FIRST member's, so nobody's work is silently discarded", () => {
  // Binding is a decision made in front of the trainer: the plan they are looking at is the one
  // that survives, rather than whichever happened to sort first.
  const routines = { jane: plan("Jane's"), john: plan("John's") };

  const bound = boundClientRoutines(routines, [["jane", "john"]]);

  assert.equal(bound.jane.routineName, "Jane's");
  assert.equal(bound.john.routineName, "Jane's");
});

test("a client's binding is findable from either side", () => {
  const bindings = [["jane", "john"]];

  assert.deepEqual(bindingFor(bindings, "john"), ["jane", "john"]);
  assert.equal(bindingFor(bindings, "sarah"), null);
  assert.equal(bindingFor([], "jane"), null);
});

test("binding is additive and never leaves someone in two groups at once", () => {
  // Two groups claiming the same person would make "log it once" ambiguous, and the answer would
  // depend on iteration order — which is the kind of thing nobody sees until a set goes missing.
  const first = withBinding([], ["jane", "john"]);
  const second = withBinding(first, ["john", "sarah"]);

  assert.equal(second.length, 1);
  assert.deepEqual(second[0].sort(), ["jane", "john", "sarah"]);
});

test("a group of one is not a group", () => {
  assert.deepEqual(withBinding([], ["jane"]), []);
});

test("unbinding gives everyone their own plan back", () => {
  const bindings = withBinding([], ["jane", "john"]);

  assert.deepEqual(withoutBinding(bindings, "john"), []);
  assert.deepEqual(withoutBinding(withBinding([], ["a", "b", "c"]), "c")[0].sort(), ["a", "b"]);
});

test("the members are listed in the order the session holds them", () => {
  const members = bindingMembers(["john", "jane"], ["jane", "john", "sarah"]);

  assert.deepEqual(members, ["jane", "john"]);
});

test("unbinding hands back separate plans, not the same one twice", () => {
  // Dropping the binding alone leaves the members holding one object, so the next set logged for
  // one would go on appearing for the other — the exact surprise unbinding exists to end.
  const routines = { jane: plan("Shared"), john: plan("John's") };
  const bound = boundClientRoutines(routines, [["jane", "john"]]);

  const separated = unboundClientRoutines(bound, ["jane", "john"]);
  separated.jane.logs.e1 = [{ reps: 10, completed: true }];

  assert.equal(separated.john.logs.e1, undefined);
  // ...and each keeps what they were training, because they were training it.
  assert.equal(separated.john.exercises[0].name, "Back Squat");
});
