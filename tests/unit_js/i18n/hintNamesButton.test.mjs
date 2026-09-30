// tests/unit_js/i18n/hintNamesButton.test.mjs
// A hint that tells the trainer to tap a button names it by the label the button shows. The German
// hint said "Fertig" while the button read "Bearbeitung des Plans beenden", so the trainer looked
// for a button that does not exist.

import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSLATIONS } from "../../../src/i18n/index.js";

test("the German hint for leaving the plan editor names the button's real label", () => {
  const { edit_exit_hint: hint, done_editing_plan: label } = TRANSLATIONS.de;
  assert.ok(hint.includes(label), `"${hint}" does not contain "${label}"`);
});
