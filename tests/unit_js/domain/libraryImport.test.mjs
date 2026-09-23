// tests/unit_js/domain/libraryImport.test.mjs
// Reading a trainer's exercise library — theirs, or one a colleague exported — and planning what it
// adds (src/domain/libraryImport.js, TODO §45.5).

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_EXERCISES } from "../../../src/data/index.js";
import { catalogToInterchange } from "../../../src/domain/exerciseStandard.js";
import {
  LIBRARY_FORMAT,
  libraryTemplate,
  planLibraryImport,
  readLibrary,
} from "../../../src/domain/libraryImport.js";

const counter = () => {
  let n = 0;
  return () => `id${++n}`;
};

test("the template the app offers reads back without a failure", () => {
  const result = readLibrary(libraryTemplate());
  assert.equal(result.ok, true);
  assert.equal(result.unreadable.length, 0);
  assert.ok(result.exercises.length > 0);
  assert.ok(result.circuits.length > 0);
});

test("a bare list of names is a list of exercises", () => {
  const result = readLibrary('["Landmine Press", "Sled Push"]');
  assert.deepEqual(
    result.exercises.map((exercise) => exercise.name),
    ["Landmine Press", "Sled Push"],
  );
});

test("aliases and prose around the JSON are understood", () => {
  const text = `Here is your library:\n\`\`\`json\n${JSON.stringify({
    format: LIBRARY_FORMAT,
    author: "Ana Novak",
    movements: [{ exercise: "Sled Push", muscle: "Legs", equipment: "Machine" }],
  })}\n\`\`\`\nEnjoy!`;
  const result = readLibrary(text);
  assert.equal(result.ok, true);
  assert.equal(result.source, "Ana Novak");
  assert.deepEqual(result.exercises[0], {
    name: "Sled Push",
    category: "Legs",
    equipment: "Machine",
  });
});

test("the app's own catalog export reads back, keeping LibrePT's axes and ids", () => {
  const own = {
    id: "0000000000000000000mine",
    name: "Landmine Press",
    category: "Shoulders",
    equipment: "Barbell",
    pattern: "Vertical Push",
  };
  const result = readLibrary(JSON.stringify(catalogToInterchange([own])));
  assert.equal(result.ok, true);
  assert.deepEqual(result.exercises[0], {
    id: own.id,
    name: "Landmine Press",
    category: "Shoulders",
    equipment: "Barbell",
    pattern: "Vertical Push",
  });
});

test("an unreadable entry is reported with its position and does not lose the others", () => {
  const result = readLibrary(
    JSON.stringify({ exercises: ["Sled Push", { reps: 10 }, "Farmer Carry"] }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.exercises.length, 2);
  assert.deepEqual(
    result.unreadable.map((row) => row.position),
    ["2"],
  );
});

test("a file in another format is refused by name, not half-read", () => {
  const result = readLibrary(JSON.stringify({ format: "librept.program/1", items: [] }));
  assert.equal(result.ok, false);
  assert.equal(result.reason, "other_format");
  assert.equal(result.detail, "librept.program/1");
});

test("an exercise the library already has is not added twice, whatever its spelling", () => {
  const parsed = readLibrary('["barbell  bench press", "Sled Push"]');
  const plan = planLibraryImport(parsed, DEFAULT_EXERCISES, { source: "Ana", newId: counter() });
  assert.deepEqual(plan.duplicates, ["barbell  bench press"]);
  assert.deepEqual(plan.exercises, [{ id: "id1", name: "Sled Push", source: "Ana" }]);
});

test("a circuit refers to its exercises by id, new or already in the library", () => {
  const parsed = readLibrary(
    JSON.stringify({
      circuits: [
        {
          name: "Finisher",
          rounds: 3,
          exercises: [
            { name: "Barbell Bench Press", reps: 5 },
            { name: "Sled Push", sets: 2 },
          ],
        },
      ],
    }),
  );
  const plan = planLibraryImport(parsed, DEFAULT_EXERCISES, { source: "Ana", newId: counter() });
  const bench = DEFAULT_EXERCISES.find((exercise) => exercise.name === "Barbell Bench Press");
  assert.deepEqual(plan.exercises, [{ id: "id1", name: "Sled Push", source: "Ana" }]);
  assert.deepEqual(plan.circuits, [
    {
      id: "id2",
      name: "Finisher",
      series: 3,
      source: "Ana",
      exercises: [
        { id: bench.id, reps: 5 },
        { id: "id1", sets: 2 },
      ],
    },
  ]);
});

test("a circuit with no name is given one from its first two exercises", () => {
  const parsed = readLibrary(
    JSON.stringify({ circuits: [{ exercises: ["Squat", "Lunge", "Plank"] }] }),
  );
  const plan = planLibraryImport(parsed, [], {
    source: "Ana",
    newId: counter(),
    circuitWord: "Sklop",
  });
  assert.equal(plan.circuits[0].name, "Sklop — Squat, Lunge");
});

test("an exercise id that is already in the library is a duplicate, not a second copy", () => {
  const parsed = readLibrary(JSON.stringify(catalogToInterchange(DEFAULT_EXERCISES.slice(0, 2))));
  const plan = planLibraryImport(parsed, DEFAULT_EXERCISES, { source: "Ana", newId: counter() });
  assert.equal(plan.exercises.length, 0);
  assert.equal(plan.duplicates.length, 2);
});

test("no source name means the trainer's own", () => {
  const plan = planLibraryImport(readLibrary('["Sled Push"]'), [], {
    source: "",
    newId: counter(),
  });
  assert.deepEqual(plan.exercises, [{ id: "id1", name: "Sled Push" }]);
});
