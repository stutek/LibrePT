// tests/unit_js/i18n/plural.test.mjs
// A counted phrase in the grammar of its language (src/i18n/plural.js), read from the real
// dictionaries: Slovenian's four forms must agree with the number and with the verb.

import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSLATIONS } from "../../../src/i18n/index.js";
import { countedText } from "../../../src/i18n/plural.js";

const tFor = (lang) => (key) => TRANSLATIONS[lang][key] || key;

test("Slovenian picks the form each number takes, verb included", () => {
  const t = tFor("sl");
  assert.equal(
    countedText(t, "sl", "notif_pending_sessions_desc", 1),
    "1 stranka ima nerešene povratne signale iz treninga.",
  );
  assert.equal(
    countedText(t, "sl", "notif_pending_sessions_desc", 2),
    "2 stranki imata nerešene povratne signale iz treninga.",
  );
  assert.equal(
    countedText(t, "sl", "notif_pending_sessions_desc", 3),
    "3 stranke imajo nerešene povratne signale iz treninga.",
  );
  assert.equal(
    countedText(t, "sl", "notif_pending_sessions_desc", 5),
    "5 strank ima nerešene povratne signale iz treninga.",
  );
  assert.equal(countedText(t, "sl", "bar_clients", 3), "3 stranke");
  assert.equal(countedText(t, "sl", "bar_clients", 102), "102 stranki");
});

test("English uses one and other", () => {
  const t = tFor("en");
  assert.equal(countedText(t, "en", "bar_clients", 1), "1 client");
  assert.equal(countedText(t, "en", "bar_clients", 2), "2 clients");
});

test("before a language is chosen the phrase is English, not an error", () => {
  // Intl.PluralRules throws on an empty or null tag; at a clean start that raised a crash card.
  const t = tFor("en");
  assert.equal(countedText(t, null, "bar_clients", 2), "2 clients");
  assert.equal(countedText(t, "", "bar_clients", 1), "1 client");
});

test("no Slovenian counted phrase keeps a bracketed ending", () => {
  const slovenian = Object.entries(TRANSLATIONS.sl).filter(([key]) =>
    /_(one|two|few|other)$/.test(key),
  );
  assert.ok(slovenian.length > 0);
  for (const [key, text] of slovenian) assert.doesNotMatch(text, /\(-/, key);
});
