// tests/unit_js/domain/programImport.test.mjs
// Reading a programme written somewhere else (TODO §29, src/domain/programImport.js).
//
// The design constraint that shapes every test here: the result lands in the SESSION EDITOR, not in
// the database. So the parser's job is not to be right, it is to be USEFUL — a wrong guess is a
// field the trainer retypes, and the failure that actually costs them is losing eleven good rows
// because the twelfth was unreadable. Hence: per-item parsing, named aliases rather than fuzzy
// matching, and unreadable input surviving as a row that says so.
//
// The frozen corpus in tests/fixtures/programs/ is the other half and lives in its own test.

import assert from "node:assert/strict";
import { test } from "node:test";
import { PROGRAM_FORMAT, programTemplate, readProgram } from "../../../src/domain/programImport.js";

const wrap = (items, extra = {}) =>
  JSON.stringify({ format: PROGRAM_FORMAT, title: "Upper Body", items, ...extra });

test("a programme in the documented shape reads straight through", () => {
  const result = readProgram(
    wrap([{ name: "Barbell Bench Press", sets: 3, reps: 5, weight: 60, unit: "kg" }]),
  );

  assert.equal(result.ok, true);
  assert.equal(result.title, "Upper Body");
  assert.equal(result.items.length, 1);
  const [item] = result.items;
  assert.equal(item.name, "Barbell Bench Press");
  assert.equal(item.type, "exercise");
  // Expanded into the shape the live editor reads — one entry per set, none completed.
  assert.equal(item.sets.length, 3);
  assert.deepEqual(item.sets[0], { reps: 5, weight: 60, completed: false });
  assert.equal(item.loadUnit, "kg");
});

test("markdown fences and prose around the JSON do not defeat it", () => {
  // What an assistant actually returns when it is being helpful.
  const pasted = [
    "Sure! Here is the programme:",
    "",
    "```json",
    wrap([{ name: "Front Squat", sets: 5, reps: 3 }]),
    "```",
    "",
    "Let me know if you want it adjusted.",
  ].join("\n");

  const result = readProgram(pasted);

  assert.equal(result.ok, true);
  assert.equal(result.items[0].name, "Front Squat");
});

test("a bare array is accepted — an assistant often skips the envelope", () => {
  const result = readProgram(JSON.stringify([{ name: "Deadlift", sets: 1, reps: 5 }]));

  assert.equal(result.ok, true);
  assert.equal(result.items[0].name, "Deadlift");
});

test("each field answers to a NAMED list of aliases, not a fuzzy match", () => {
  const result = readProgram(
    wrap([
      { exercise: "Romanian Deadlift", series: 4, repetitions: 8, load: 70, units: "kg" },
      { movement: "Chin-Up", sets: "3", reps: "6" },
    ]),
  );

  assert.equal(result.items[0].name, "Romanian Deadlift");
  assert.equal(result.items[0].sets.length, 4);
  assert.equal(result.items[0].sets[0].reps, 8);
  assert.equal(result.items[0].sets[0].weight, 70);
  assert.equal(result.items[1].name, "Chin-Up");
  // Numbers arriving as strings is the single most common shape difference between assistants.
  assert.equal(result.items[1].sets.length, 3);
  assert.equal(result.items[1].sets[0].reps, 6);
});

test("a sets×reps shorthand is understood, in the spellings people actually write", () => {
  for (const shorthand of ["3x10", "3 x 10", "3 × 10", "3X10"]) {
    const result = readProgram(wrap([{ name: "Row", sets: shorthand }]));
    assert.equal(result.items[0].sets.length, 3, shorthand);
    assert.equal(result.items[0].sets[0].reps, 10, shorthand);
  }
});

test("a rest between exercises comes through as a rest, not as an exercise called Rest", () => {
  const result = readProgram(
    wrap([{ name: "Squat", sets: 3, reps: 5 }, { rest: 90 }, { name: "Press", sets: 3, reps: 8 }]),
  );

  assert.deepEqual(
    result.items.map((item) => item.type),
    ["exercise", "rest", "exercise"],
  );
  assert.equal(result.items[1].rest, 90);
});

test("one unreadable item does not lose the others", () => {
  // The failure that actually costs a trainer their evening. The bad row survives as a row, so they
  // fix one line in the editor instead of starting over — and it carries what it could not read, so
  // there is something to fix rather than a blank.
  const result = readProgram(
    wrap([
      { name: "Squat", sets: 3, reps: 5 },
      { notes: "superset the next two, 2 rounds" },
      { name: "Press", sets: 3, reps: 8 },
    ]),
  );

  assert.equal(result.ok, true);
  assert.equal(result.items.length, 3);
  assert.equal(result.items[1].unreadable, true);
  assert.ok(result.items[1].raw.includes("superset"));
  assert.equal(result.items[0].name, "Squat");
  assert.equal(result.items[2].name, "Press");
});

test("every item is given an id, because the editor addresses rows by one", () => {
  const result = readProgram(wrap([{ name: "A", sets: 1, reps: 1 }, { rest: 60 }]));
  const ids = result.items.map((item) => item.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(Boolean));
});

test("text that is not a programme is refused with a reason, never half-imported", () => {
  for (const junk of ["", "   ", "hello", "{ not json", "{}", "[]"]) {
    const result = readProgram(junk);
    assert.equal(result.ok, false, JSON.stringify(junk));
    assert.ok(result.reason, `expected a stated reason for ${JSON.stringify(junk)}`);
    assert.deepEqual(result.items, []);
  }
});

test("a name is the one thing an exercise cannot do without", () => {
  const result = readProgram(wrap([{ sets: 3, reps: 5 }]));

  assert.equal(result.items[0].unreadable, true);
});

test("the format marker distinguishes 'not ours' from 'ours, one field wrong'", () => {
  // Someone else's JSON with a plausible shape must not be silently adopted.
  const foreign = JSON.stringify({ format: "some.other.tool/2", items: [{ name: "Squat" }] });

  const result = readProgram(foreign);

  assert.equal(result.ok, false);
  // The refusal names BOTH — what the file claims to be and what was expected — because "wrong
  // format" alone leaves a trainer with nothing to do next.
  assert.ok(result.reason.includes("some.other.tool/2"), result.reason);
  assert.ok(result.reason.includes(PROGRAM_FORMAT), result.reason);
});

// ── What the trainer is shown before the editor opens (TODO §29.1) ─────────────────────────────
// Decided 2026-08-18: parsing failures — ALL of them, not the first — are surfaced before jumping
// into the edit window. A trainer who lands in an editor and only then notices three rows are blank
// has been given a puzzle; one who is told "3 of 12 lines could not be read, here they are" can fix
// the paste, or go in knowing exactly what to repair.

test("every unreadable row is reported, not just the first", () => {
  const result = readProgram(
    wrap([
      { name: "Squat", sets: 3, reps: 5 },
      { notes: "superset the next two" },
      { name: "Press", sets: 3, reps: 8 },
      { comment: "then a finisher" },
      { sets: 3, reps: 12 },
    ]),
  );

  assert.equal(result.unreadable.length, 3);
  assert.equal(result.items.length, 5, "the readable rows are still all there");
  // Each carries its raw text and its position, so the report can point at a line rather than say
  // "something failed".
  assert.deepEqual(
    result.unreadable.map((row) => row.position),
    [2, 4, 5],
  );
  assert.ok(result.unreadable.every((row) => row.raw));
});

test("a clean paste reports nothing to fix", () => {
  const result = readProgram(wrap([{ name: "Squat", sets: 3, reps: 5 }]));

  assert.deepEqual(result.unreadable, []);
});

test("the template is a working example of the format it documents", () => {
  // It is offered as a download so a trainer has something to follow (decided 2026-08-18). If it
  // ever stopped parsing, the app would be handing out an example of how to fail.
  const result = readProgram(programTemplate());

  assert.equal(result.ok, true);
  assert.deepEqual(result.unreadable, []);
  assert.ok(result.items.length >= 3, "an example with one line teaches nothing");
  assert.ok(
    result.items.some((item) => item.type === "rest"),
    "the example must show a rest, or nobody discovers rests exist",
  );
  assert.ok(result.title, "the example must show that a programme can be titled");
});
