// tests/unit_js/modules/common/sessionItemRecord.test.mjs
// TODO §17.1: a finished session is persisted as the WHOLE structured program — a flat list of typed
// items (exercise | rest) with circuit grouping via circuitId and a completed flag per exercise —
// not just the performed sets. This covers the pure buildProgramSnapshot model (keeps rests +
// skipped work).

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/domain/sessionItemRecord.js";

test("build program snapshot keeps rests and skips", () => {
  const cs = {
    exercises: [
      {
        id: "a",
        name: "Squat",
        loadUnit: "kg",
        modality: "strength",
        metric: "reps",
        setsTargetCount: 3,
        repsTarget: 5,
        weightTarget: 100,
        circuitId: "c1",
        circuitTitle: "SS",
        circuitSeries: 3,
      },
      { id: "r1", type: "rest", rest: 60, circuitId: "c1" },
      {
        id: "b",
        name: "Skipped Curl",
        loadUnit: "kg",
        modality: "strength",
        metric: "reps",
        setsTargetCount: 2,
        repsTarget: 12,
        weightTarget: 15,
      },
    ],
    logs: {
      a: [
        { reps: 5, weight: 100, completed: true },
        { reps: 5, weight: 100, completed: true },
        { reps: 5, weight: 100, completed: false },
      ],
    },
  };
  const items = m.buildProgramSnapshot(cs);
  const result = {
    len: items.length,
    t0: items[0].type,
    done0: items[0].completed,
    sets0: items[0].sets.length,
    circuit0: items[0].circuitId,
    t1: items[1].type,
    rest1: items[1].rest,
    t2: items[2].type,
    done2: items[2].completed,
    sets2: items[2].sets.length,
    skippedSetDone: items[2].sets[0].completed,
    exerciseCount: m.exerciseRecordsOf(items).length,
  };

  assert.equal(result.len, 3);
  assert.equal(result.t0, "exercise");
  assert.equal(result.done0, true);
  assert.equal(result.sets0, 3);
  assert.equal(result.circuit0, "c1");
  assert.equal(result.t1, "rest");
  assert.equal(result.rest1, 60);
  // A movement with no logged work is KEPT as its prescription, flagged not-completed.
  assert.equal(result.t2, "exercise");
  assert.equal(result.done2, false);
  assert.equal(result.sets2, 2);
  assert.equal(result.skippedSetDone, false);
  // exerciseRecordsOf must filter out rest items
  assert.equal(result.exerciseCount, 2);
});
