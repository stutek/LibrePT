// tests/unit_js/domain/frozenProgramCorpus.test.mjs
// The frozen corpus of real pasted programmes (TODO §29.2, point 4).
//
// This is the answer to "how do we make the data ingestion not fragile". A parser tested only
// against examples its author invented drifts toward the shapes that author imagined; a parser
// tested against what assistants and spreadsheets ACTUALLY emit stays honest. The rule, borrowed
// from tests/unit_js/data/frozenBackupCorpus.test.mjs:
//
//   **Every paste that fails in real use joins tests/fixtures/programs/ and never regresses.**
//   Never edit an existing fixture — that stops it testing what it always tested. Add a new one.
//
// The assertions here are deliberately shallow: each fixture must be READ (not refused), and every
// item must be either usable or explicitly marked unreadable — never silently empty. What each
// individual field parses to is pinned in programImport.test.mjs, where a failure names the rule
// rather than the file.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readProgram } from "../../../src/domain/programImport.js";

const FIXTURES_DIR = fileURLToPath(new URL("../../fixtures/programs/", import.meta.url));
const fixtures = readdirSync(FIXTURES_DIR).filter((name) => name.endsWith(".txt"));

test("the corpus is not empty — an empty one silently asserts nothing", () => {
  assert.ok(fixtures.length >= 4, `expected real pasted programmes, found ${fixtures.length}`);
});

for (const fixture of fixtures) {
  test(`${fixture} still reads`, () => {
    const result = readProgram(readFileSync(FIXTURES_DIR + fixture, "utf-8"));

    assert.equal(result.ok, true, `refused: ${result.reason}`);
    assert.ok(result.items.length > 0, "read as a programme with nothing in it");

    for (const item of result.items) {
      if (item.unreadable) {
        // A row that could not be read must carry what it could not read, or the trainer opens the
        // editor to a blank line with no way to tell what was lost.
        assert.ok(item.raw, `${fixture}: an unreadable row carries no raw text`);
        continue;
      }
      if (item.type === "rest") {
        assert.ok(Number.isFinite(item.rest), `${fixture}: a rest with no duration`);
        continue;
      }
      assert.ok(item.name, `${fixture}: an exercise with no name that was not marked unreadable`);
      assert.ok(item.sets.length > 0, `${fixture}: ${item.name} has no sets`);
    }
  });
}

test("a fixture with movements outside the catalog is read like any other", () => {
  // §29.1: an unknown movement is ALLOWED. The parser has no opinion about the catalog at all —
  // matching happens later, and what it produces is the CUSTOM tag, not a rejection.
  const result = readProgram(readFileSync(`${FIXTURES_DIR}custom-movements.txt`, "utf-8"));

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.items.map((item) => item.name),
    ["Bench Press", "Banded Scap Retraction With Pause", "Prone Y-T-W Complex"],
  );
});
