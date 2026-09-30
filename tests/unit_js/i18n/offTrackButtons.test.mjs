// tests/unit_js/i18n/offTrackButtons.test.mjs
// The card the guide shows when the trainer has left a step tells them what its two buttons do. It
// must call each button by the label the button shows, in every language: the card once said "Končaj
// demo" while the button read "Ustavi demo", and the trainer looked for a button that did not exist.

import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSLATIONS } from "../../../src/i18n/index.js";

for (const lang of ["en", "sl", "de"]) {
  test(`the waiting card names its buttons as they are labelled in ${lang}`, () => {
    const words = TRANSLATIONS[lang];
    const body = words.walkthrough_off_track;
    assert.ok(body.includes(words.walkthrough_return), `${lang} lacks the "back" label`);
    assert.ok(body.includes(words.walkthrough_leave), `${lang} lacks the "stop" label`);
  });
}
