// tests/unit_js/modules/clipboard/pastDeckCard.test.mjs
// What the past-session card is built FROM (`buildPastExerciseItems` in
// src/modules/clipboard/pastDeckCard.js). Pure — a stored session in, the card's items out — so it
// belongs here rather than in a browser tier.
//
// It is tested at this level because the card is drawn nowhere at the moment: until 2026-09-30 the
// live clipboard deck put the client's last session at the top of the exercise stack, and now the
// deck holds one session's plan and nothing else. Two browser tests in
// tests/medium/test_clipboard_card_design.py asserted these same rules through the rendered card
// and could no longer run; the rules themselves came from real defects, so they are kept here.
// What is NOT covered any more: the rendered badge, which reads the word "Last time" from the
// dictionary beside the date. That returns with the card, when the client's history view mounts it.

import assert from "node:assert/strict";
import { test } from "node:test";

import { buildPastExerciseItems } from "../../../../src/modules/clipboard/pastDeckCard.js";

// One finished session: a movement performed but stopped part-way, and a movement skipped whole.
// A record keeps a skipped movement's PRESCRIPTION as sets flagged completed:false, which is why
// both cases have to be told apart from work the client actually did.
const PARTLY_DONE = {
  id: "h2",
  clientId: "c1a9f0e2",
  routineName: "Lower Body",
  date: "2026-07-20T17:30:00",
  exercises: [
    {
      id: "p1",
      type: "exercise",
      name: "Barbell Back Squat",
      completed: true,
      loadUnit: "kg",
      metric: "reps",
      modality: "strength",
      sets: [
        { reps: 8, weight: 60, completed: true },
        { reps: 8, weight: 60, completed: false },
      ],
    },
    {
      id: "p2",
      type: "exercise",
      name: "Leg Press",
      completed: false,
      loadUnit: "kg",
      metric: "reps",
      modality: "strength",
      sets: [
        { reps: 12, weight: 140, completed: false },
        { reps: 12, weight: 140, completed: false },
      ],
    },
  ],
};

test("a skipped movement is named as skipped, not as sets the client lifted", () => {
  const [, legPress] = buildPastExerciseItems(PARTLY_DONE);

  assert.equal(legPress.name, "Leg Press");
  assert.equal(legPress.skipped, true);
  // The trainer reads this row to choose today's load. Listing the prescription here told them the
  // client pressed 140 kg twelve times, twice, on a movement they never started.
  assert.deepEqual(legPress.sets, []);
});

test("a set the client did not finish is left out of what was done", () => {
  const [squat] = buildPastExerciseItems(PARTLY_DONE);

  assert.equal(squat.skipped, false);
  assert.deepEqual(
    squat.sets.map((set) => [set.reps, set.weight]),
    [[8, 60]],
    "the second set was flagged unfinished and is not work performed",
  );
});

test("a legacy set with no completed flag is work performed", () => {
  const legacy = {
    id: "h1",
    date: "2026-07-06T10:15:00",
    exercises: [
      { id: "e1", type: "exercise", name: "Bench Press", sets: [{ reps: 5, weight: 70 }] },
    ],
  };

  const [bench] = buildPastExerciseItems(legacy);

  assert.equal(
    bench.sets.length,
    1,
    "rows stored before the flag existed only ever held real work",
  );
});

test("the session's date is carried as an ISO day, whatever the device would write", () => {
  const [squat] = buildPastExerciseItems(PARTLY_DONE);

  // "20. jul." on a Slovenian screen and "Jul 20" on an English one, neither saying the year, is
  // what asking the device for this date produced.
  assert.equal(squat.sessionDate, "2026-07-20");
});

test("in a group, each member's card carries whose session it was", () => {
  const [squat] = buildPastExerciseItems(PARTLY_DONE, "Jane Doe");

  // Clients bound to one plan share a tab, so an unnamed row read as the whole group's.
  assert.equal(squat.clientName, "Jane Doe");
});
