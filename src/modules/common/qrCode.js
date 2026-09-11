// src/modules/common/qrCode.js — a QR code as geometry, for a phone screen somebody else is about to
// point a camera at (TODO §26.3 step 3, §26.4).
//
// Single responsibility: turn a short string into the squares of a QR symbol. No DOM and no styling
// — the caller draws it, which is what keeps this testable at all: a picture that does not scan is
// invisible to every assertion, so what is pinned here is the geometry.
//
// **Why the geometry and not an `<svg>` string.** The vendored encoder can emit markup itself, and
// this app never builds markup out of a string (build/frontend_audit.py). One `d` attribute set with
// `setAttribute` is the same picture with no HTML sink anywhere near it.
//
// **The quiet zone is part of the code, not decoration.** ISO/IEC 18004 requires four empty modules
// on every side; a symbol drawn flush to the edge of a card is one a camera will hunt for and often
// miss. It is in the `viewBox` below, so a caller cannot forget it.
//
// **Error correction M, not L or H.** M reads through the glare and the fingerprints on a phone
// screen held at arm's length, and still leaves room for the ~150 characters an intake link takes. H
// would push the same link into a denser symbol, which is the opposite of what a camera wants.
//
// Injected dependencies: the vendored encoder (vendor/qrcode.js — third-party, see
// THIRD_PARTY_NOTICES.md), passed in so a test can prove this module's own arithmetic.

import qrcode from "../../vendor/qrcode.js";

const QUIET_ZONE_MODULES = 4;
const ERROR_CORRECTION = "M";

/**
 * `{ viewBox, d }` for a symbol drawn at one unit per module, or null when there is nothing to
 * encode.
 *
 * `d` is one closed square per dark module. Squares rather than a scanline run of rectangles: a run
 * is shorter to write and a renderer may leave a hairline between its ends, which a camera reads as
 * a lighter module.
 */
export function qrCodePath(text, encoder = qrcode) {
  const content = String(text || "");
  if (!content) return null;

  // Type 0 asks the encoder for the smallest version the content fits in.
  const symbol = encoder(0, ERROR_CORRECTION);
  symbol.addData(content);
  symbol.make();

  const count = symbol.getModuleCount();
  const squares = [];
  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      if (symbol.isDark(row, column)) squares.push(`M${column} ${row}h1v1h-1z`);
    }
  }

  const edge = count + QUIET_ZONE_MODULES * 2;
  return {
    viewBox: `${-QUIET_ZONE_MODULES} ${-QUIET_ZONE_MODULES} ${edge} ${edge}`,
    d: squares.join(""),
    count,
  };
}
