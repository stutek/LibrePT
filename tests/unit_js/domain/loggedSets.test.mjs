import assert from "node:assert/strict";
import { test } from "node:test";
import { loggedSetsPerParticipant } from "../../../src/domain/loggedSets.js";

const session = {
  participants: ["a", "b", "c"],
  clientRoutines: {
    a: { logs: { x: [{ completed: true }, { completed: false }], y: [{ completed: true }] } },
    b: { logs: { x: [{ completed: false }] } },
    c: { logs: {} },
  },
};

test("counts completed sets per participant and leaves out those with none", () => {
  assert.deepEqual(loggedSetsPerParticipant(session), [{ clientId: "a", count: 2 }]);
});

test("no session or no logs gives an empty list", () => {
  assert.deepEqual(loggedSetsPerParticipant(null), []);
  assert.deepEqual(loggedSetsPerParticipant({ participants: ["a"], clientRoutines: {} }), []);
});
