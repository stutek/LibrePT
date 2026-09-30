// tests/unit_js/i18n/genderNeutral.test.mjs
// No Slovenian text writes a bracketed gender ending. "Ostal(-a) si" reads as a form to fill in, not a
// sentence; the texts say it without a past participle that carries gender instead.

import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSLATIONS } from "../../../src/i18n/index.js";

test("no Slovenian text writes a bracketed ending such as (-a)", () => {
  const offenders = Object.entries(TRANSLATIONS.sl)
    .filter(([, text]) => typeof text === "string" && /\((?:-?l?a|-?a|-la)\)/.test(text))
    .map(([key]) => key);
  assert.deepEqual(offenders, []);
});

test("the page a client opens from an invitation does not address the reader in the feminine", () => {
  // "izbereš sama" is feminine; the reader may be any client. The text says "izbereš ti" instead.
  assert.doesNotMatch(TRANSLATIONS.sl.intake_sender_check, /izbereš sama/);
});
