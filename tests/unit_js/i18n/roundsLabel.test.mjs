// tests/unit_js/i18n/roundsLabel.test.mjs
// The circuit's "Rounds" field is "Krogi" in Slovenian, the word the board uses for one round
// ("Krog"). "Runde" is German and was shipped in the Slovenian file.

import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSLATIONS } from "../../../src/i18n/index.js";

test("the circuit rounds label is Slovenian in Slovenian", () => {
  assert.equal(TRANSLATIONS.sl.rounds, "Krogi");
  assert.equal(TRANSLATIONS.de.rounds, "Runden");
  assert.equal(TRANSLATIONS.en.rounds, "Rounds");
});
