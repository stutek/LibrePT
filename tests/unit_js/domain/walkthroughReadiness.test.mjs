// tests/unit_js/domain/walkthroughReadiness.test.mjs
// Whether the guided walkthrough has anything to walk through (TODO §28.14,
// src/domain/walkthroughReadiness.js).
//
// The walkthrough drives the app's own real controls: open the group session, focus a CIRCUIT card,
// signal it too easy, switch to the second participant. Every one of those needs a specific shape in
// the store, so offering the button on a database that cannot satisfy it produces a guide that rings
// nothing and stops on its first step — in front of the person being shown the product.
//
// The checks here are deliberately about the SHAPE the steps need, not about the seed's ids: a
// trainer who built their own group session with a circuit can run the walkthrough perfectly well,
// and one who deleted half the demo cannot.

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_ROUTINES, DEFAULT_SESSIONS } from "../../../src/data/index.js";
import { walkthroughDataPresent } from "../../../src/domain/walkthroughReadiness.js";

const demoStore = () => ({
  sessions: structuredClone(DEFAULT_SESSIONS),
  routines: structuredClone(DEFAULT_ROUTINES),
});

test("the seeded demo can run the walkthrough — that is what it is for", () => {
  assert.equal(walkthroughDataPresent(demoStore()), true);
});

test("an empty store cannot", () => {
  assert.equal(walkthroughDataPresent({}), false);
  assert.equal(walkthroughDataPresent({ sessions: [], routines: [] }), false);
});

test("a one-client session is not enough — the last step switches participant", () => {
  const store = demoStore();
  store.sessions = store.sessions.map((session) => ({
    ...session,
    participants: (session.participants || []).slice(0, 1),
  }));

  assert.equal(walkthroughDataPresent(store), false);
});

test("a group session whose plan has no circuit is not enough — the second step focuses one", () => {
  const store = demoStore();
  store.routines = store.routines.map((routine) => ({
    ...routine,
    exercises: (routine.exercises || []).map((exercise) => ({ ...exercise, circuitId: null })),
  }));

  assert.equal(walkthroughDataPresent(store), false);
});

test("a session pointing at a routine that no longer exists is not enough", () => {
  const store = demoStore();
  store.routines = [];

  assert.equal(walkthroughDataPresent(store), false);
});

test("a trainer's own group session with a circuit qualifies — this is not a demo check", () => {
  const store = {
    sessions: [{ id: "mine", participants: ["a", "b"], routineId: "r-mine" }],
    routines: [{ id: "r-mine", exercises: [{ id: "e1", circuitId: "circuit-1" }] }],
  };

  assert.equal(walkthroughDataPresent(store), true);
});
