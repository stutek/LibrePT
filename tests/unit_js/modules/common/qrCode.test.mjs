// tests/unit_js/modules/common/qrCode.test.mjs
// A QR code as geometry (src/modules/common/qrCode.js, TODO §26.3/§26.4).
//
// **A picture that does not scan is invisible to an assertion**, which is why the encoder itself is
// vendored rather than written here and why these tests pin the two things around it: the arithmetic
// this module does (which squares, which viewBox) against a fake encoder whose output is known, and
// the shape of a real symbol against the parts of ISO/IEC 18004 a camera looks for first.

import assert from "node:assert/strict";
import { test } from "node:test";
import { qrCodePath } from "../../../../src/modules/common/qrCode.js";

/** An encoder whose symbol is known: dark exactly on the diagonal of a 3×3 grid. */
function diagonalEncoder() {
  return () => ({
    addData() {},
    make() {},
    getModuleCount: () => 3,
    isDark: (row, column) => row === column,
  });
}

/** The real thing, for the cases that are about a symbol a camera has to read. */
const INTAKE_LINK =
  "https://stutek.github.io/LibrePT/intake?lang=sl" +
  "#from=Sam%20Trainer%7C%2B386%2040%20111%20222%7Csam%40example.com";

test("every dark module becomes its own square, at one unit each", () => {
  const { d } = qrCodePath("anything", diagonalEncoder());

  assert.equal(d, "M0 0h1v1h-1zM1 1h1v1h-1zM2 2h1v1h-1z");
});

test("the quiet zone is in the picture, not left to whoever draws it", () => {
  // ISO/IEC 18004 requires four empty modules on every side. A symbol drawn flush to the edge of a
  // card is one a camera hunts for and often does not find — and "remember to add a margin" is
  // exactly the instruction a caller forgets.
  const { viewBox, count } = qrCodePath("anything", diagonalEncoder());

  assert.equal(count, 3);
  assert.equal(viewBox, "-4 -4 11 11");
});

test("nothing to encode draws nothing, rather than an empty symbol", () => {
  assert.equal(qrCodePath(""), null);
  assert.equal(qrCodePath(null), null);
  assert.equal(qrCodePath(undefined), null);
});

test("a real symbol has the three corners a camera looks for", () => {
  // The finder patterns: a 7×7 block in three corners, each a dark ring around a dark centre, with a
  // light separator between it and the rest. If these are wrong nothing else matters, because the
  // camera never gets as far as the data.
  const { d, count } = qrCodePath(INTAKE_LINK);
  const dark = new Set(d.match(/M\d+ \d+/g));
  const at = (row, column) => dark.has(`M${column} ${row}`);

  for (const [row, column] of [
    [0, 0],
    [0, count - 7],
    [count - 7, 0],
  ]) {
    assert.ok(at(row, column), `finder corner ${row},${column}`);
    assert.ok(at(row + 3, column + 3), `finder centre ${row},${column}`);
    // The ring: one light module in from the corner, on both axes.
    assert.equal(at(row + 1, column + 1), false, `finder ring ${row},${column}`);
  }
});

test("a whole intake link fits in a symbol that scans off a phone screen", () => {
  // Version 10 (57 modules) is about the limit for a code held at arm's length on a phone at
  // moderate brightness — past that the modules are smaller than the camera can resolve. The link
  // carries the trainer's name, number and address, so this is the real budget, not a guess.
  const { count } = qrCodePath(INTAKE_LINK);

  assert.ok(count <= 57, `${count} modules`);
  assert.ok(count >= 21, `${count} modules`);
});

test("the same link draws the same code every time", () => {
  // The encoder chooses a mask, and one that varied per call would mean two codes on two screens for
  // the same link — with no way to tell a re-render from a different link.
  assert.equal(qrCodePath(INTAKE_LINK).d, qrCodePath(INTAKE_LINK).d);
});
