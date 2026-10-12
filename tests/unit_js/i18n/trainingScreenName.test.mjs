// tests/unit_js/i18n/trainingScreenName.test.mjs
// The screen a trainer runs a training on has ONE Slovenian name: »beležnica« (Simon, 2026-10-12).
// It had two, »podloga« (a translation of "clipboard" that no trainer says) and »beležka« (which also
// means a single note, and the app has notes of its own), and a trainer in the exploratory weeks could
// not tell they were one screen.

import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSLATIONS } from "../../../src/i18n/index.js";

test("no Slovenian text calls the training screen »podloga« or »beležka«", () => {
  const offenders = Object.entries(TRANSLATIONS.sl)
    .filter(([, text]) => typeof text === "string" && /podlog|beležk/i.test(text))
    .map(([key]) => key);
  assert.deepEqual(offenders, []);
});

test("the button that opens a training says where it opens: in the notebook", () => {
  assert.equal(TRANSLATIONS.sl.btn_launch_clipboard, "Odpri v beležnici");
});
