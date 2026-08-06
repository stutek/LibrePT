// Translation registry — every locale the app ships. Adding a language means adding its file
// here and importing it; the i18n parity test iterates this map so all locales stay in sync.
import { en } from "./en.js";
import { sl } from "./sl.js";

export const TRANSLATIONS = { en, sl };

export const DEFAULT_LANG = "en";

// Whether a language code is one this build actually ships.
//
// `Object.hasOwn`, not `TRANSLATIONS[lang]`, and that is the whole point of this function existing.
// A truthiness check answers YES for every inherited member of Object.prototype, so `?lang=__proto__`
// on a share link passed the old guard, was written to `state.lang`, and PERSISTED. `t()` then read
// `TRANSLATIONS["__proto__"]` — Object.prototype, truthy, so its `|| TRANSLATIONS.en` fallback never
// fired — and every lookup missed, rendering the whole UI as raw i18n keys until storage was
// cleared. A link is the delivery mechanism, so this was reachable by sending someone a URL.
export function isSupportedLang(lang) {
  return typeof lang === "string" && Object.hasOwn(TRANSLATIONS, lang);
}

// The dictionary for a language, falling back to the default for anything unsupported. The single
// place a language code becomes a dictionary, so the check above cannot be forgotten at a call site.
export function dictionaryFor(lang) {
  return isSupportedLang(lang) ? TRANSLATIONS[lang] : TRANSLATIONS[DEFAULT_LANG];
}
