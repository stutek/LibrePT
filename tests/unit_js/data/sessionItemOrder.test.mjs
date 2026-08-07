// tests/unit_js/modules/common/sessionItemOrder.test.mjs
// Explicit session-item ordering (TODO §17.5): `position` is dense 0..n-1 across one session's item
// list, readers sort by it, and circuit members occupy a contiguous run.
//
// Why this is gated rather than reviewed: the failure it prevents is a program in the wrong order
// with every id present, which passes §18.3's completeness check and every other integrity test we
// have. Positions must be written and authoritative BEFORE the store stops preserving list order
// (§18.6 part 4), because after that there is no array index left to derive them from.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/data/sessionItemOrder.js";
import * as rec from "../../../src/domain/sessionItemRecord.js";

test("positions are dense and unique", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  m.assignPositions(items);
  assert.deepEqual(
    items.map((i) => i.position),
    [0, 1, 2, 3],
  );
  assert.deepEqual(m.positionIssues(items), []);
});

test("a hole and a duplicate are both named", () => {
  // The whole point of density: 'is this list whole?' has an answer, and it names the gap.
  const hole = [{ position: 0 }, { position: 1 }, { position: 3 }];
  const dupe = [{ position: 0 }, { position: 1 }, { position: 1 }];
  const absent = [{ position: 0 }, {}];

  assert.equal(
    m.positionIssues(hole).some((issue) => issue.includes("missing position 2")),
    true,
  );
  assert.equal(
    m.positionIssues(dupe).some((issue) => issue.includes("duplicate") && issue.includes("1")),
    true,
  );
  assert.equal(
    m.positionIssues(absent).some((issue) => issue.includes("no position")),
    true,
  );
});

test("circuit members must be contiguous", () => {
  // A circuit renders by folding a RUN of consecutive members, so a split one silently
  // becomes two units. Contiguity as a query is what makes that detectable at rest.
  const intact = [
    { position: 0, circuitId: "c1" },
    { position: 1, circuitId: "c1" },
    { position: 2, circuitId: null },
  ];
  const split = [
    { position: 0, circuitId: "c1" },
    { position: 1, circuitId: null },
    { position: 2, circuitId: "c1" },
  ];
  assert.deepEqual(m.positionIssues(intact), []);
  assert.equal(
    m.positionIssues(split).some((issue) => issue.includes("not contiguous")),
    true,
  );
});

test("readers sort by position not by array order", () => {
  // The assertion the store swap depends on: a list that arrives keyed rather than sequenced
  // still reads back in program order.
  const scrambled = [
    { id: "c", position: 2 },
    { id: "a", position: 0 },
    { id: "b", position: 1 },
  ];
  assert.deepEqual(
    m.orderedItems(scrambled).map((i) => i.id),
    ["a", "b", "c"],
  );
});

test("legacy items without positions keep arrival order", () => {
  // Old history rows, old backups and the seed data predate the field — they must still read
  // correctly, which is what makes this change additive rather than a migration.
  const legacy = [{ id: "x" }, { id: "y" }, { id: "z" }];
  const read = m.orderedItems(legacy).map((i) => i.id);
  m.repairPositions(legacy);
  assert.deepEqual(read, ["x", "y", "z"]);
  assert.deepEqual(
    legacy.map((i) => [i.id, i.position]),
    [
      ["x", 0],
      ["y", 1],
      ["z", 2],
    ],
  );
});

test("repair renumbers from program order", () => {
  // A hole or a duplicate repairs mechanically — the property a linked list cannot offer,
  // because deciding which branch of a forked chain is real is guesswork.
  const broken = [
    { id: "b", position: 5 },
    { id: "a", position: 0 },
    { id: "c", position: 5 },
  ];
  m.repairPositions(broken);
  assert.equal(broken.map((i) => i.id)[0], "a");
  assert.deepEqual(m.positionIssues(broken), []);
});

test("a finished session snapshot carries positions", () => {
  // buildProgramSnapshot is the one write whose output outlives every array it was held in,
  // so the record has to carry its own order.
  const clientState = {
    exercises: [
      { id: "e1", name: "Squat", setsTargetCount: 2, repsTarget: 5 },
      { type: "rest", rest: 60 },
      { id: "e2", name: "Row", setsTargetCount: 2, repsTarget: 8 },
    ],
    logs: {},
  };
  const snapshot = rec.buildProgramSnapshot(clientState, { isPlanning: true });
  assert.deepEqual(
    snapshot.map((i) => i.position),
    [0, 1, 2],
  );
  assert.deepEqual(m.positionIssues(snapshot), []);
  assert.deepEqual(
    snapshot.map((i) => i.type),
    ["exercise", "rest", "exercise"],
  );
});
