// tests/unit_js/data/exerciseLibrary.test.mjs
// The exercise library a trainer picks from: LibrePT's catalog, read from code, plus the trainer's
// own exercises from storage (src/data/exerciseLibrary.js, TODO §45.5).

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CATALOG_SOURCE,
  OWN_SOURCE,
  addToLibrary,
  exerciseSourceOf,
  libraryExercises,
  sourcesOf,
  withSource,
} from "../../../src/data/exerciseLibrary.js";
import { DEFAULT_EXERCISES } from "../../../src/data/index.js";
import { stampAsSeeded } from "../../../src/data/seedProvenance.js";

const own = { id: "0000000000000000000mine", name: "Landmine Press", category: "Shoulders" };

test("an empty working database still offers the whole LibrePT catalog", () => {
  const ids = libraryExercises({ exercises: [] }).map((exercise) => exercise.id);
  assert.deepEqual(ids.sort(), DEFAULT_EXERCISES.map((exercise) => exercise.id).sort());
});

test("the trainer's own exercises are listed alongside the catalog", () => {
  const library = libraryExercises({ exercises: [own] });
  assert.equal(library.length, DEFAULT_EXERCISES.length + 1);
  assert.ok(library.some((exercise) => exercise.id === own.id));
});

test("a catalog entry the sandbox stored is listed once, as stored", () => {
  const stored = DEFAULT_EXERCISES.map(stampAsSeeded);
  stored[0] = { ...stored[0], name: "Renamed in the sandbox" };
  const library = libraryExercises({ exercises: stored });
  assert.equal(library.length, DEFAULT_EXERCISES.length);
  assert.equal(library.find((exercise) => exercise.id === stored[0].id).name, stored[0].name);
});

test("reading the library writes nothing into the state it reads", () => {
  const state = { exercises: [own] };
  libraryExercises(state);
  assert.deepEqual(state.exercises, [own]);
});

test("changing a listed catalog entry cannot change the catalog itself", () => {
  const entry = libraryExercises({ exercises: [] })[0];
  assert.throws(() => {
    entry.name = "Changed";
  }, TypeError);
});

test("an exercise's source is LibrePT for a catalog id and the trainer's own otherwise", () => {
  assert.equal(exerciseSourceOf(DEFAULT_EXERCISES[0]), CATALOG_SOURCE);
  assert.equal(exerciseSourceOf(own), OWN_SOURCE);
  assert.equal(exerciseSourceOf(stampAsSeeded(DEFAULT_EXERCISES[1])), CATALOG_SOURCE);
});

test("the source filter keeps only the exercises from the chosen source", () => {
  const library = libraryExercises({ exercises: [own] });
  assert.deepEqual(withSource(library, OWN_SOURCE), [own]);
  assert.equal(withSource(library, CATALOG_SOURCE).length, DEFAULT_EXERCISES.length);
  assert.equal(withSource(library, "all").length, library.length);
});

test("an imported exercise's source is the name it was imported under", () => {
  const imported = { id: "0000000000000000000anas", name: "Sled Push", source: "Ana Novak" };
  assert.equal(exerciseSourceOf(imported), "Ana Novak");
  const library = libraryExercises({ exercises: [own, imported] });
  assert.deepEqual(sourcesOf(library), [CATALOG_SOURCE, OWN_SOURCE, "Ana Novak"]);
  assert.deepEqual(withSource(library, "Ana Novak"), [imported]);
});

test("an import adds to the stored library without touching what was there", () => {
  const before = [own];
  const state = { exercises: before };
  addToLibrary(state, {
    exercises: [{ id: "x", name: "Sled Push" }],
    circuits: [{ id: "c", name: "F" }],
  });
  assert.deepEqual(
    state.exercises.map((exercise) => exercise.id),
    [own.id, "x"],
  );
  assert.deepEqual(state.circuits, [{ id: "c", name: "F" }]);
  assert.deepEqual(before, [own]);
});

// The catalog is not stored, so a screen that reads `state.exercises` directly shows a trainer an
// empty library in their own workspace. Only the library module and the seed may read it.
test("no screen reads the stored exercises past the library", () => {
  const srcRoot = fileURLToPath(new URL("../../../src/", import.meta.url));
  const allowed = new Set(["data/exerciseLibrary.js", "data/stateStore.js"]);
  const direct = /\b(?:state|getState\(\))\.exercises\b/;
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith(".js") && !allowed.has(relative(srcRoot, path))) {
        readFileSync(path, "utf8")
          .split("\n")
          .forEach((line, index) => {
            if (direct.test(line)) offenders.push(`${relative(srcRoot, path)}:${index + 1}`);
          });
      }
    }
  };
  walk(srcRoot);
  assert.deepEqual(offenders, []);
});
