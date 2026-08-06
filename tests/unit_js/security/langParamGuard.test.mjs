// tests/unit_js/security/langParamGuard.test.mjs
// The `?lang=` share-link parameter, and the whitelist that is supposed to reject anything this
// build does not ship (src/i18n/index.js).
//
// Share links are a FEATURE — `?lang`/`?theme`/`?init` exist to be sent to someone — so a URL
// parameter is attacker-supplied input arriving through the app's own front door. The old guard was
// `if (shareLang && TRANSLATIONS[shareLang])`, a truthiness check on a plain object, so it answered
// YES for every inherited member of Object.prototype. `?lang=__proto__` therefore passed, was
// written to `state.lang`, and PERSISTED; `t()` then resolved `TRANSLATIONS["__proto__"]` to
// Object.prototype, which is truthy, so its `|| TRANSLATIONS.en` fallback never fired and every
// lookup missed — the entire UI rendered as raw i18n keys until storage was cleared.
//
// Same root cause as prototypePollution.test.mjs (a plain object used as a lookup table against
// untrusted keys), reached through a completely different door, which is why it is pinned
// separately rather than folded in there.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_LANG,
  TRANSLATIONS,
  dictionaryFor,
  isSupportedLang,
} from "../../../src/i18n/index.js";

const PROTOTYPE_MEMBER_NAMES = [
  "__proto__",
  "constructor",
  "toString",
  "hasOwnProperty",
  "valueOf",
];

test("a prototype member is not a supported language", () => {
  for (const name of PROTOTYPE_MEMBER_NAMES) {
    assert.equal(
      isSupportedLang(name),
      false,
      `${name} passed the language guard — a truthiness check has crept back in`,
    );
  }
});

test("an unsupported language resolves to a real dictionary, never Object.prototype", () => {
  for (const name of [...PROTOTYPE_MEMBER_NAMES, "zz", "", null, undefined, 7, {}]) {
    const dict = dictionaryFor(name);
    assert.equal(
      dict,
      TRANSLATIONS[DEFAULT_LANG],
      `${String(name)} did not fall back to the default dictionary`,
    );
    // The specific symptom the bug produced: a dictionary that is truthy but answers nothing.
    assert.equal(typeof dict.logo_title, "string");
  }
});

test("the languages this build ships still resolve to themselves", () => {
  // The guard must not be so strict it breaks the feature it protects.
  for (const lang of Object.keys(TRANSLATIONS)) {
    assert.equal(isSupportedLang(lang), true, `${lang} should be supported`);
    assert.equal(dictionaryFor(lang), TRANSLATIONS[lang]);
  }
});
