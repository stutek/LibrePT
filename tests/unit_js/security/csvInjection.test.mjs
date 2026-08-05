// tests/unit_js/security/csvInjection.test.mjs
// CWE-1236, spreadsheet formula injection, against the catalog CSV export
// (src/modules/common/exerciseStandard.js).
//
// Excel, LibreOffice and Sheets EXECUTE a cell whose text begins with = + - @ (or a leading tab /
// carriage return). The catalog export exists specifically to be opened in a spreadsheet, and a
// movement name is free text a trainer types — and is also restorable from an untrusted backup. So
// there is a real path from hostile input to code execution on whoever opens the file.
//
// Nothing here crosses the network, so the OWASP ZAP baseline scan cannot see any of it: that scan
// is passive, and this is a client-side file-generation bug. Static analysis cannot see it either —
// the pre-fix code did correct RFC-4180 quoting, which looks exactly like escaping.

import assert from "node:assert/strict";
import { test } from "node:test";

import { catalogToCsv } from "../../../src/modules/common/exerciseStandard.js";

const FIRST_CELL = (name) =>
  catalogToCsv([{ id: "x", name }])
    .split("\n")[1]
    .split(",")[0];

test("a formula-triggering name cannot execute in a spreadsheet", () => {
  const hostile = [
    "=cmd|'/c calc'!A1", // the classic DDE payload
    '+HYPERLINK("http://evil","click")',
    "-2+3",
    "@SUM(1+1)*cmd",
    "\tleading tab",
    "\rleading carriage return",
  ];

  for (const name of hostile) {
    const cell = FIRST_CELL(name);
    // Stripped of any CSV quoting, the cell must not START with a trigger — that leading
    // character is the whole of what makes a spreadsheet treat text as a formula.
    const unquoted = cell.startsWith('"') ? cell.slice(1) : cell;
    assert.equal(
      /^[=+\-@\t\r]/.test(unquoted),
      false,
      `cell still starts with a formula trigger: ${JSON.stringify(cell)}`,
    );
    assert.equal(unquoted.startsWith("'"), true, `expected apostrophe guard: ${cell}`);
  }
});

test("neutralising a formula leaves ordinary names untouched", () => {
  // The guard must not tax normal data: an apostrophe on every cell would corrupt the interchange
  // for the 99% case and train readers to ignore it.
  assert.equal(FIRST_CELL("Barbell Row"), "Barbell Row");
});

test("a negative number is guarded too, and that trade-off is deliberate", () => {
  // `-5kg variant` is data, but a spreadsheet cannot tell it from the formula `-2+3`. Pinned so
  // the cost of the guard stays visible rather than being discovered as a surprise.
  assert.equal(FIRST_CELL("-5kg variant"), "'-5kg variant");
});

test("quoting alone would not have been a fix", () => {
  // Worth pinning as an executable note: a QUOTED CSV cell is still parsed as a formula by Excel,
  // so the pre-fix RFC-4180 quoting was never protection — only the leading apostrophe is.
  const cell = FIRST_CELL('=1+1,"x"');
  assert.equal(cell.startsWith("\"'"), true, `expected quote AND apostrophe: ${cell}`);
});
