// tests/unit_js/domain/adjustmentSuggestion.test.mjs
// What the adjustment dialog proposes for the exercise a feedback signal was about
// (src/domain/adjustmentSuggestion.js).

import assert from "node:assert/strict";
import { test } from "node:test";
import { performedTarget, suggestedTarget } from "../../../src/domain/adjustmentSuggestion.js";

const squatLog = {
  id: "h1",
  clientId: "c1",
  exercises: [
    {
      id: "exA",
      name: "Barbell Back Squat",
      sets: [
        { reps: 10, weight: 40, completed: true },
        { reps: 10, weight: 40, completed: true },
        { reps: 10, weight: 40, completed: true },
      ],
    },
  ],
  feedback: [{ id: "u1", exerciseName: "Barbell Back Squat", tag: "Too Easy - Increase Load" }],
};
const update = { id: "u1", clientId: "c1", exerciseName: "Barbell Back Squat" };

test("the performed target is read from the session the signal was given in", () => {
  assert.deepEqual(performedTarget([squatLog], update), { weight: 40, reps: 10, sets: 3 });
  assert.equal(performedTarget([squatLog], { ...update, id: "other" }), null);
});

test("without a routine the suggestion starts from the performed weight, not from zero", () => {
  // It proposed 2.5 kg for a squat done at 40 kg: the step was added to nothing.
  const performed = performedTarget([squatLog], update);
  assert.deepEqual(suggestedTarget({ routineEntry: null, performed, tagId: "too_easy" }), {
    weight: 42.5,
    reps: 10,
    sets: 3,
  });
  assert.equal(suggestedTarget({ routineEntry: null, performed, tagId: "too_hard" }).weight, 37.5);
});

test("a routine's target comes first", () => {
  const routineEntry = { weight: 60, reps: 5, sets: 5 };
  const performed = { weight: 40, reps: 10, sets: 3 };
  assert.deepEqual(suggestedTarget({ routineEntry, performed, tagId: "too_easy" }), {
    weight: 62.5,
    reps: 5,
    sets: 5,
  });
});

test("with nothing to start from, no number is offered", () => {
  assert.deepEqual(suggestedTarget({ routineEntry: null, performed: null, tagId: "too_easy" }), {
    weight: "",
    reps: "",
    sets: "",
  });
});

test("a lighter load never goes below zero", () => {
  const performed = { weight: 1, reps: 10, sets: 3 };
  assert.equal(suggestedTarget({ routineEntry: null, performed, tagId: "too_hard" }).weight, 0);
});
