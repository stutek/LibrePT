// tests/unit_js/domain/planCopy.test.mjs
// Copying tonight's plan onto another participant (src/domain/planCopy.js) — TODO §8.8.
//
// The promise: a walk-in joins a session already underway, and the trainer gives them what the room
// is doing in one tap instead of re-authoring it. What is copied is the PRESCRIPTION — movements,
// targets, rests, circuits — and never what anybody did: a copy carrying someone else's logged sets
// would put a stranger's numbers in this person's history.
//
// Distinct from binding (§8.1) on purpose, and the difference is the whole reason both exist: a
// bound pair share one plan and stay identical; a copy diverges the moment either is edited.

import assert from "node:assert/strict";
import { test } from "node:test";
import { copyPlanForParticipant } from "../../../src/domain/planCopy.js";

// Ids the test can recognise, handed out in order. A counter rather than a real id generator: what
// these assertions care about is that each item got a NEW one, not what it looks like.
let counter = 0;
function newId() {
  counter += 1;
  return `new${counter}`;
}

const PLAN = [
  {
    id: "e1",
    type: "exercise",
    name: "Back Squat",
    setsTargetCount: 3,
    repsTarget: 5,
    weightTarget: 60,
    loadUnit: "kg",
    completed: true,
    sets: [{ reps: 5, weight: 60, completed: true }],
  },
  { id: "r1", type: "rest", rest: 90 },
  {
    id: "e2",
    type: "exercise",
    name: "Push-Ups",
    circuitId: "c1",
    circuitTitle: "Finisher",
    circuitSeries: 3,
    setsTargetCount: 1,
    repsTarget: 12,
  },
  { id: "r2", type: "rest", rest: 30, circuitId: "c1", circuitSeries: 3 },
];

test("the copy prescribes the same session", () => {
  counter = 0;
  const copy = copyPlanForParticipant(PLAN, { newId });

  assert.deepEqual(
    copy.map((item) => item.name || item.type),
    ["Back Squat", "rest", "Push-Ups", "rest"],
  );
  assert.equal(copy[0].setsTargetCount, 3);
  assert.equal(copy[0].repsTarget, 5);
  assert.equal(copy[1].rest, 90);
});

test("nobody else's performance comes with it", () => {
  counter = 0;
  const [squat] = copyPlanForParticipant(PLAN, { newId });

  assert.equal(squat.completed, undefined, "a copy starts undone");
  assert.deepEqual(squat.sets, [], "and with nothing logged in it");
});

test("every item is a new item, so editing one plan never edits the other", () => {
  counter = 0;
  const copy = copyPlanForParticipant(PLAN, { newId });

  assert.ok(copy.every((item) => !PLAN.some((original) => original.id === item.id)));
  // This is exactly what makes a COPY different from a binding (§8.1), where the two share one plan.
  copy[0].repsTarget = 8;
  assert.equal(PLAN[0].repsTarget, 5);
});

test("a circuit stays one circuit, and stays this plan's own", () => {
  counter = 0;
  const copy = copyPlanForParticipant(PLAN, { newId });

  const [pushUps, circuitRest] = [copy[2], copy[3]];
  assert.equal(pushUps.circuitId, circuitRest.circuitId, "both members still name one circuit");
  assert.notEqual(pushUps.circuitId, "c1", "and it is not the circuit they were copied from");
  assert.equal(pushUps.circuitTitle, "Finisher");
  assert.equal(pushUps.circuitSeries, 3);
});

test("an empty plan copies to an empty plan rather than failing", () => {
  assert.deepEqual(copyPlanForParticipant([], { newId }), []);
  assert.deepEqual(copyPlanForParticipant(undefined, { newId }), []);
});
