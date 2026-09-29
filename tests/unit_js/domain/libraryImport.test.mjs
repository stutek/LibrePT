// tests/unit_js/domain/libraryImport.test.mjs
// Reading a trainer's exercise library — theirs, or one a colleague exported — and planning what it
// adds (src/domain/libraryImport.js).

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

test("exchanging a library preserves multiple sources, circuits and their targets", () => {
  const exercises = [
    { id: "squat", name: "Squat", source: "Ana", equipment: "Barbell" },
    { id: "lunge", name: "Lunge", source: "Boris" },
  ];
  const circuits = [
    {
      id: "legs",
      name: "Legs",
      source: "Cilka",
      series: 4,
      exercises: [
        { id: "squat", reps: 8, weight: 20 },
        { id: "lunge", reps: 12, rest: 60 },
      ],
    },
  ];
  const parsed = readLibrary(JSON.stringify(catalogToInterchange(exercises, circuits)));
  assert.deepEqual(parsed.unreadable, []);
  const plan = planLibraryImport(parsed, [], { source: "Exchange", newId: counter() });
  assert.deepEqual(plan.exercises, exercises);
  assert.deepEqual(
    plan.circuits.map(({ id, ...record }) => record),
    circuits.map(({ id, ...record }) => record),
  );
});

test("a routine travels in the library file and comes back with its structure", () => {
  const exercises = [
    { id: "squat", name: "Squat" },
    { id: "lunge", name: "Lunge" },
  ];
  const routines = [
    {
      id: "r1",
      name: "Leg day",
      description: "Two movements.",
      exercises: [
        {
          id: "squat",
          sets: 3,
          reps: 8,
          weight: 20,
          rest: 60,
          circuitId: "z1",
          circuitTitle: "Main",
          circuitSeries: 3,
        },
        { id: "lunge", sets: 3, reps: 12, rest: 0, circuitId: "z1", circuitTitle: "Main" },
      ],
    },
  ];
  const parsed = readLibrary(JSON.stringify(catalogToInterchange(exercises, [], routines)));
  assert.deepEqual(parsed.unreadable, []);
  const plan = planLibraryImport(parsed, [], { newId: counter() });
  assert.deepEqual(
    plan.routines.map(({ id, ...record }) => record),
    routines.map(({ id, ...record }) => record),
  );
});

test("a routine whose name the trainer already has is not added twice", () => {
  const parsed = readLibrary(
    JSON.stringify({
      format: LIBRARY_FORMAT,
      routines: [{ name: "Leg Day", exercises: ["Squat"] }],
    }),
  );
  const plan = planLibraryImport(parsed, [{ id: "squat", name: "Squat" }], {
    newId: counter(),
    routineNames: ["leg day"],
  });
  assert.deepEqual(plan.routines, []);
  assert.deepEqual(plan.duplicates, ["Leg Day"]);
});

test("a routine naming an exercise the library does not have adds it", () => {
  const parsed = readLibrary(
    JSON.stringify({ format: LIBRARY_FORMAT, routines: [{ name: "Push", exercises: ["Dips"] }] }),
  );
  const plan = planLibraryImport(parsed, [], { newId: counter() });
  assert.deepEqual(plan.exercises, [{ id: "id1", name: "Dips" }]);
  assert.equal(plan.routines[0].exercises[0].id, "id1");
});

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

test("an imported id another record already holds is replaced, never reused", () => {
  // Every record of one schema shares one key in the store, so an exercise written under a
  // client's id replaces that client. The file's id is a hint, not a right to a slot.
  const parsed = readLibrary(
    JSON.stringify({
      format: LIBRARY_FORMAT,
      exercises: [{ name: "Injected exercise", x_librept: { id: "same-record-id" } }],
      circuits: [{ name: "Uses it", exercises: [{ name: "Injected exercise", reps: 8 }] }],
    }),
  );
  const plan = planLibraryImport(parsed, [], {
    source: "Ana",
    newId: counter(),
    takenIds: new Set(["same-record-id"]),
  });
  assert.deepEqual(
    plan.exercises.map((exercise) => [exercise.id, exercise.name]),
    [["id1", "Injected exercise"]],
  );
  assert.deepEqual(plan.circuits[0].exercises, [{ id: "id1", reps: 8 }]);
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

test("a circuit's text targets are read by the app's own rules and survive export and import", () => {
  const exercises = [
    { id: "squat", name: "Squat" },
    { id: "pull", name: "Pull-up" },
    { id: "plank", name: "Plank" },
  ];
  const circuits = [
    {
      id: "c1",
      name: "Mixed",
      exercises: [
        { id: "squat", reps: "8-12", weight: "Medium", rest: 60 },
        { id: "pull", reps: "max", weight: "BW" },
        { id: "plank", reps: "30s" },
        { id: "squat", reps: 10, weight: 2.5 },
      ],
    },
  ];
  const parsed = readLibrary(JSON.stringify(catalogToInterchange(exercises, circuits)));
  assert.deepEqual(parsed.unreadable, []);
  const plan = planLibraryImport(parsed, [], { newId: counter() });
  assert.deepEqual(plan.circuits[0].exercises, circuits[0].exercises);
});

test("typed targets are stored as the app stores them: numbers as numbers, text as text", () => {
  const parsed = readLibrary(
    JSON.stringify({
      circuits: [{ name: "C", exercises: [{ name: "Squat", reps: " 8 ", weight: "2,5" }] }],
    }),
  );
  assert.deepEqual(parsed.circuits[0].items, [{ name: "Squat", reps: 8, weight: 2.5 }]);
});

test("a target the app cannot read is reported with its position and the entry is kept", () => {
  const parsed = readLibrary(
    JSON.stringify({
      circuits: [
        {
          name: "C",
          exercises: [
            { name: "Squat", reps: { min: 8 }, weight: "Medium", rest: 60 },
            { name: "Lunge", reps: -5 },
          ],
        },
      ],
    }),
  );
  assert.deepEqual(parsed.circuits[0].items, [
    { name: "Squat", weight: "Medium", rest: 60 },
    { name: "Lunge" },
  ]);
  assert.deepEqual(
    parsed.unreadable.map((row) => row.position),
    ["circuit 1 · 1 · reps", "circuit 1 · 2 · reps"],
  );
});

const legs = { name: "Legs", exercises: [{ name: "Squat", reps: 8 }] };
const planFor = (file, existing = [], library = []) =>
  planLibraryImport(readLibrary(JSON.stringify(file)), library, {
    newId: counter(),
    circuits: existing,
  });

test("importing the same file twice does not duplicate its circuits", () => {
  const first = planFor({ circuits: [legs] });
  assert.equal(first.circuits.length, 1);
  const second = planFor({ circuits: [legs] }, first.circuits, first.exercises);
  assert.deepEqual(second.circuits, []);
  assert.deepEqual(second.circuitDuplicates, ["Legs"]);
});

test("a circuit keeps its own id from our export, and is present when that id is held", () => {
  const exercises = [{ id: "squat", name: "Squat" }];
  const circuit = { id: "legs-1", name: "Legs", exercises: [{ id: "squat", reps: 8 }] };
  const file = catalogToInterchange(exercises, [circuit]);
  const first = planFor(file);
  assert.equal(first.circuits[0].id, "legs-1");
  const renamed = { ...file, circuits: [{ ...file.circuits[0], name: "Other", exercises: [] }] };
  renamed.circuits[0].exercises = [{ name: "Squat", reps: 3 }];
  const second = planFor(renamed, first.circuits, first.exercises);
  assert.deepEqual(second.circuitDuplicates, ["Other"]);
});

test("the same name with another prescription is imported as new, never skipped", () => {
  const existing = planFor({ circuits: [legs] });
  const changed = { name: "legs", exercises: [{ name: "Squat", reps: 12 }] };
  const plan = planFor({ circuits: [changed] }, existing.circuits, existing.exercises);
  assert.equal(plan.circuits.length, 1);
  assert.deepEqual(plan.circuitDuplicates, []);
});

test("a new circuit takes its id from the file only when nothing holds it", () => {
  const held = { id: "x1", name: "Held", exercises: [] };
  const plan = planFor(
    { circuits: [{ id: "x1", name: "Different", exercises: [{ name: "Squat", reps: 1 }] }] },
    [held],
  );
  assert.equal(plan.circuits.length, 0);
  const free = planFor({ circuits: [{ id: "free", ...legs }] });
  assert.equal(free.circuits[0].id, "free");
});
