// tests/unit_js/modules/clipboard/planColumns.test.mjs — how many programmes are edited side by
// side, and in what order (TODO §41.0).
//
// Unit tier: the count is arithmetic over a width and a participant list, and the order is a rule
// about which name the trainer tapped. Neither needs a DOM, and both are what a later layout change
// would break silently.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MIN_PLAN_COLUMN_PX,
  columnClientIds,
  planColumnCount,
} from "../../../../src/modules/clipboard/planColumns.js";

test("the width decides, bounded by how many participants there are", () => {
  // Ruled 2026-09-10: "1/2/3/4/5/.. odvisno od prostora in števila udeležencev" — so a desk with
  // room for four columns and a session of two people shows two, not four empty ones.
  assert.equal(planColumnCount({ width: 1400, participants: 2 }), 2);
  assert.equal(planColumnCount({ width: 1400, participants: 5 }), 4);
  assert.equal(planColumnCount({ width: 700, participants: 5 }), 2);
});

test("a phone gets one column, and so does a screen narrower than one", () => {
  // Never zero: a clipboard that renders nothing is worse than one that scrolls, and this is the
  // branch a narrow phone in landscape would otherwise land on.
  assert.equal(planColumnCount({ width: 390, participants: 3 }), 1);
  assert.equal(planColumnCount({ width: 120, participants: 3 }), 1);
  assert.equal(planColumnCount({ width: 0, participants: 3 }), 1);
});

test("the column width is the editor's own minimum, not a round number", () => {
  // Two columns appear exactly when two editors fit, so the constant is the rule — a test that
  // hardcoded 800px would pass while the editor's rows became unusable at 400.
  assert.equal(planColumnCount({ width: MIN_PLAN_COLUMN_PX * 2, participants: 3 }), 2);
  assert.equal(planColumnCount({ width: MIN_PLAN_COLUMN_PX * 2 - 1, participants: 3 }), 1);
});

test("the participant the trainer tapped is the first column", () => {
  // They arrived here by tapping a name. Putting that programme in the middle of the row because of
  // the order the session stores its participants in would make the trainer hunt for it.
  assert.deepEqual(columnClientIds(["a", "b", "c"], "c", 3), ["c", "a", "b"]);
  assert.deepEqual(columnClientIds(["a", "b", "c"], "c", 2), ["c", "a"]);
});

test("an active client who is not a participant does not invent a column", () => {
  // Defensive for one real case: a client removed from the session while their plan was open.
  assert.deepEqual(columnClientIds(["a", "b"], "zz", 2), ["a", "b"]);
  assert.deepEqual(columnClientIds([], "zz", 3), []);
});
