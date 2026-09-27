// src/i18n/plural.js — a phrase with a number in it, in the grammar of its language.
//
// Slovenian has four forms where English has two: 1 stranka, 2 stranki, 3 stranke, 5 strank, and the
// verb follows (ima, imata, imajo, ima). A dictionary entry written once, "{count} strank" or
// "stranka(-e/-k)", is wrong for most numbers or reads like a form to fill in.
//
// So a counted phrase is four keys, `<key>_one`, `<key>_two`, `<key>_few`, `<key>_other`, and
// `Intl.PluralRules` picks the one the language uses for that number. Every language carries all
// four so the dictionaries keep the same keys; English and German never pick `two` or `few`, and
// repeat their `other` text there.
//
// The language is resolved here, not by the caller: before the first language is chosen the page's
// `lang` is empty, and `Intl.PluralRules` throws on an empty or unknown tag — which at a clean start
// raised the crash card "Invalid language tag: null".

import { resolveLang } from "./index.js";

/** The phrase for `count` under `key`, with `{count}` filled in. `t` is the app's translate, which
 *  returns the key itself when an entry is missing — then the `other` form is used. */
export function countedText(t, lang, key, count) {
  const form = `${key}_${new Intl.PluralRules(resolveLang(lang)).select(count)}`;
  const text = t(form);
  const chosen = text && text !== form ? text : t(`${key}_other`);
  return chosen.replaceAll("{count}", String(count));
}
