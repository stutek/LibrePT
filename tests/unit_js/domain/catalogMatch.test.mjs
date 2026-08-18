// tests/unit_js/domain/catalogMatch.test.mjs
// Deciding which imported movements the catalog already knows (TODO §29.1,
// src/domain/catalogMatch.js).
//
// The ruling this implements: **a movement the catalog does not have is ALLOWED**, not refused and
// not silently normalised into the nearest thing. It is marked instead, so a trainer can see at a
// glance which movements in an imported plan have taxonomy behind them and which arrived with the
// paste. Silently adopting a near-match is how a catalog becomes forty spellings of "Bench Press",
// which is what §13's taxonomy work exists to prevent — and silently REJECTING one would throw away
// the trainer's programme.

import assert from "node:assert/strict";
import { test } from "node:test";
import { matchAgainstCatalog } from "../../../src/domain/catalogMatch.js";

const catalog = [
  { id: "ex-bench", name: "Barbell Bench Press" },
  { id: "ex-squat", name: "Back Squat" },
];

const exercise = (name) => ({ id: "row-1", type: "exercise", name, sets: [] });

test("a movement the catalog knows carries its catalog id and no tag", () => {
  const [item] = matchAgainstCatalog([exercise("Back Squat")], catalog);

  assert.equal(item.exerciseId, "ex-squat");
  assert.equal(item.custom, false);
});

test("case and spacing differences are the same movement, not a new one", () => {
  for (const spelling of ["back squat", "  Back  Squat ", "BACK SQUAT"]) {
    const [item] = matchAgainstCatalog([exercise(spelling)], catalog);
    assert.equal(item.exerciseId, "ex-squat", spelling);
    assert.equal(item.custom, false, spelling);
  }
});

test("a movement the catalog does not have is kept, and marked custom", () => {
  const [item] = matchAgainstCatalog([exercise("Prone Y-T-W Complex")], catalog);

  assert.equal(item.custom, true);
  assert.equal(item.exerciseId, undefined);
  // Kept verbatim: the trainer wrote it, or their assistant did, and rewriting it would be the app
  // deciding what they meant.
  assert.equal(item.name, "Prone Y-T-W Complex");
});

test("a near miss is CUSTOM, not a silent match", () => {
  // "Barbell Bench Press" is in the catalog; this is not it. Adopting the near neighbour is exactly
  // how a catalog acquires forty variants of one movement — under the wrong ids.
  const [item] = matchAgainstCatalog([exercise("Incline Barbell Bench Press")], catalog);

  assert.equal(item.custom, true);
});

test("rests and unreadable rows are left alone — neither is a movement", () => {
  const items = matchAgainstCatalog(
    [
      { id: "r1", type: "rest", rest: 90 },
      { id: "r2", type: "exercise", name: "", sets: [], unreadable: true, raw: "…" },
    ],
    catalog,
  );

  assert.equal(items[0].custom, undefined);
  assert.equal(items[1].custom, undefined, "an unreadable row is not a custom movement");
});

test("an empty catalog makes everything custom rather than nothing importable", () => {
  const [item] = matchAgainstCatalog([exercise("Back Squat")], []);

  assert.equal(item.custom, true);
});
