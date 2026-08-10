// src/modules/common/consentForm.js — how the GDPR consent letter gets to a client: which language
// it is sent in, where the matching privacy notice lives on GitHub, and the two `mailto:`/`sms:`
// hrefs behind the delivery buttons.
//
// The letters themselves are NOT here — they are translated copy and live in src/i18n/consent/, one
// file per locale. This module is the delivery logic that stays the same in every language.
//
// Why the letter is versioned: consent is consent to a specific wording. When the letter changes
// materially (a new processor, a new purpose), a stored version stamp is what tells a trainer which
// clients still hold consent to the current text and which need to re-sign — a bare "consented on
// 2026-05-04" cannot answer that. It is one short string per record, so it costs nothing to keep and
// cannot be reconstructed later if omitted.
//
// Why the language is a per-client CHOICE rather than just the UI language: the trainer's app
// language and the client's reading language are different facts. A Slovenian trainer coaching an
// expat runs the UI in Slovenian and must still be able to hand that one client an English form.
// The UI language is the DEFAULT because it is right most of the time, not because it is the answer.
//
// deps: src/i18n/consent/ for the letters; no DOM, no storage.

import { consentLetterFor, resolveConsentLang } from "../../i18n/consent/index.js";

export { resolveConsentLang };

// A full ISO date (YYYY-MM-DD), not a month: two substantive revisions can land in one month, and a
// stamp that cannot tell them apart cannot answer "who is still covered?" — which is the only
// question the stamp exists to answer. It is the date the CURRENT WORDING was adopted, so it stays
// put while the letter does; it is not a "last touched" date.
//
// Bumped ONLY when the letter's substance changes (purposes, recipients, rights, retention).
// Typo, formatting and translation fixes leave it alone: a client who signed the old text still
// consented to the same thing, and a bump asks every one of them to sign again. One version spans
// every locale — the translations say the same thing, so they cannot be separately versioned
// without the version ceasing to mean "which promises were made".
export const CONSENT_FORM_VERSION = "2026-08-09";

// The docs are read on the CLIENT's device, by someone who has no LibrePT install and should not
// need one to read what they are agreeing to — so a GitHub URL, not an in-app route. One folder per
// locale (docs/templates/<lang>/), same filenames throughout, so the URL is mechanical.
const DOCS_BASE_URL = "https://github.com/stutek/LibrePT/blob/main/docs/templates";

export function clientPrivacyNoticeUrl(lang) {
  return `${DOCS_BASE_URL}/${resolveConsentLang(lang)}/Client_Privacy_Notice.md`;
}

export function clientConsentFormUrl(lang) {
  return `${DOCS_BASE_URL}/${resolveConsentLang(lang)}/Client_Consent_Form.md`;
}

export function consentEmailSubject(lang) {
  return consentLetterFor(resolveConsentLang(lang)).subject;
}

export function consentEmailBody(clientName, lang) {
  const resolved = resolveConsentLang(lang);
  return consentLetterFor(resolved).body({
    clientName,
    noticeUrl: clientPrivacyNoticeUrl(resolved),
    version: CONSENT_FORM_VERSION,
  });
}

// The SMS/share variant is deliberately NOT the letter: a multi-screen wall of text in a messaging
// app gets dismissed unread, and every messaging client truncates differently. It is one sentence
// plus the link to the same notice, so what the client actually reads is the canonical document.
export function consentShareText(clientName, lang) {
  const resolved = resolveConsentLang(lang);
  return consentLetterFor(resolved).share({
    clientName,
    noticeUrl: clientPrivacyNoticeUrl(resolved),
  });
}

export function consentEmailHref(client, lang) {
  if (!client?.email) return "";
  const subject = encodeURIComponent(consentEmailSubject(lang));
  const body = encodeURIComponent(consentEmailBody(client.name || "", lang));
  return `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
}

export function consentSmsHref(client, lang) {
  if (!client?.phone) return "";
  // `?&body=` rather than `?body=`: iOS only honours the body parameter after a leading `&`, while
  // Android accepts either — this one form opens a prefilled compose on both.
  const body = encodeURIComponent(consentShareText(client.name || "", lang));
  return `sms:${client.phone.replace(/\s/g, "")}?&body=${body}`;
}
