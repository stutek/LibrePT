// src/i18n/consent/index.js — registry of the consent letter in every language the app can send it
// in. The counterpart of ../index.js's TRANSLATIONS, kept separate because the two answer different
// questions: that one is the UI's key→string dictionary, this one is a legal document per locale.
//
// The two maps must stay key-for-key identical (pinned by
// tests/unit_js/modules/common/consentForm.test.mjs): a UI language with no consent letter would
// silently send an English letter to a client who was offered their own language, which is exactly
// the "informed" part of informed consent failing quietly.
//
// deps: none.

import { consentEn } from "./en.js";
import { consentSl } from "./sl.js";

export const CONSENT_LETTERS = { en: consentEn, sl: consentSl };

export const DEFAULT_CONSENT_LANG = "en";

// Endonyms, not the header switcher's "EN"/"SL" codes: this dropdown picks the language a CLIENT
// will read, and it is chosen by a trainer who may be looking at a name they do not speak. "EN" is
// only obvious to someone who already knows the answer.
export const CONSENT_LANG_LABELS = { en: "English", sl: "Slovenščina" };

// `Object.hasOwn`, for the same reason ../index.js's isSupportedLang uses it: a truthiness check
// answers yes for every inherited Object.prototype member, so `?lang=__proto__` from a share link
// would resolve to a "letter" with no subject and no body.
export function isConsentLang(lang) {
  return typeof lang === "string" && Object.hasOwn(CONSENT_LETTERS, lang);
}

export function consentLetterFor(lang) {
  return isConsentLang(lang) ? CONSENT_LETTERS[lang] : CONSENT_LETTERS[DEFAULT_CONSENT_LANG];
}

export function resolveConsentLang(lang) {
  return isConsentLang(lang) ? lang : DEFAULT_CONSENT_LANG;
}
