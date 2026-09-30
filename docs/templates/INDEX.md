---
type: index
title: Client-Facing Legal Template Catalog
description: The consent form and privacy notice a trainer hands to a client, in every language LibrePT can send them in.
status: active
tags:
  - index
  - templates
  - gdpr
  - i18n
  - okf
---

# Client-Facing Templates

Two documents per language, and **the language is a per-client choice** — Add/Edit Client →
*Data Protection (GDPR)* → *Form language*, defaulting to the trainer's UI language. The app's
delivery buttons link to the folder matching that choice, so this tree's shape is load-bearing:
`docs/templates/<lang>/<same filename>`, built mechanically by
[consentForm.js](../../src/modules/common/consentForm.js)'s `clientPrivacyNoticeUrl()`.

## Catalog

| Document                                                   | Language    | Type       | Description                                                       |
| :--------------------------------------------------------- | :---------- | :--------- | :---------------------------------------------------------------- |
| [en/Client_Consent_Form.md](en/Client_Consent_Form.md)     | English     | `template` | The consent letter and the printable signature block              |
| [en/Client_Privacy_Notice.md](en/Client_Privacy_Notice.md) | English     | `template` | Art. 13 notice — what the client must be told *before* consenting |
| [sl/Client_Consent_Form.md](sl/Client_Consent_Form.md)     | Slovenščina | `template` | Obrazec soglasja — the same letter, as sent in Slovenian          |
| [sl/Client_Privacy_Notice.md](sl/Client_Privacy_Notice.md) | Slovenščina | `template` | Obvestilo o zasebnosti — the Art. 13 notice in Slovenian          |
| [de/Client_Consent_Form.md](de/Client_Consent_Form.md)     | Deutsch     | `template` | Einwilligungsformular — the same letter, as sent in German        |
| [de/Client_Privacy_Notice.md](de/Client_Privacy_Notice.md) | Deutsch     | `template` | Datenschutzhinweise — the Art. 13 notice in German                |

**English is the source edition.** Translations state the same promises and carry the same
`consent_form_version`; where a translation and the English text disagree, the English text is what
was intended, and the difference is a bug in the translation. No translation is legally reviewed —
each says so at the top. The Slovenian one is maintainer-made; the German one is a machine
translation that a German speaker has not yet reviewed.

## What the documents are, and who reads them

The rendered pages (`src/consent-form-<lang>.html`, `src/privacy-notice-<lang>.html`) are read by
the **client**, from a link in an email or SMS or on the intake form, so they hold nothing addressed
to a trainer or a developer. Everything a trainer or a developer needs is here.

- **The letter carries the Art. 13 core itself**: the controller (the trainer's signature), the data,
  the recipients, the retention, the rights, the complaint route and what refusing costs. A client
  who signs it on paper may never open the link, and the German authorities say a person handed a
  paper form must not be sent to the internet for the information (DSK Kurzpapier Nr. 10).
- **The notice is generic for every trainer** and has no fields to fill in: the app cannot fill in a
  published page. It names the controller as "the trainer who gave you this notice", whose name and
  contact are in the letter's signature, in the SMS, or on the intake page.
- **The trainer's own details sign the letter.** Settings → *My details* (name, phone, email); the
  app asks for them on the first launch. An install without them signs with a generic line, and the
  letter then names no controller — the one case the texts cannot cover.
- **Retention is a fixed promise**: while the client trains, and at most two years after the last
  session. The app does not delete anything by itself; the trainer keeps the promise.
- **The printed form goes out with the printed notice.** The letter points at the notice by URL,
  which a client with a sheet of paper cannot follow.
- **No edition is legally reviewed.** The Slovenian one is terminology-checked against the official
  text; the German one is a machine translation no German speaker has read. A trainer using them with
  real clients carries that risk.

## Versioning

Consent is consent to *a specific wording*, so LibrePT stamps the version a client signed under onto
their record (`gdprConsent.formVersion`, see [DATA_MODEL §1](../DATA_MODEL.md)) alongside the signed
date. That stamp is what answers "who is still covered?" after the letter changes.

- **Bump the version** when the *substance* changes — a new purpose, a new recipient or processor, a
  change to retention or to the rights on offer, or a change to what the client declares when they
  consent. Clients on an older version should consent again.
- **Do not bump it** for typos, formatting, or translation of unchanged meaning: those clients
  consented to the same thing, and a bump would send every one of them a form to sign for nothing.
- **The version is a full ISO date (`YYYY-MM-DD`)** — the day the current wording was adopted, not
  the day a file was last touched. A month alone cannot separate two revisions in the same month. It
  is deliberately not the commit SHA or the data schema, which change constantly.
- **One version spans every language.** The translations state the same promises. Bumping means
  editing, in one change: `CONSENT_FORM_VERSION` in
  [consentForm.js](../../src/modules/common/consentForm.js), the letter in **every**
  `src/i18n/consent/<lang>.js`, and every `docs/templates/<lang>/` document's `consent_form_version`.

The letters in `src/i18n/consent/` are pinned verbatim to the `Client_Consent_Form.md` of their
language by [consentForm.test.mjs](../../tests/unit_js/modules/common/consentForm.test.mjs), so a
client is never handed one wording and asked to consent to another.

## Adding a language

Four edits, all in one change, or the gate fails:

1. `src/i18n/consent/<lang>.js` — the letter, mirroring `en.js`'s shape.
2. `src/i18n/consent/index.js` — the registry row and its endonym label. Its keys must match
   [`TRANSLATIONS`](../../src/i18n/index.js) exactly: a UI language with no consent letter silently
   sends English to a client who was offered their own language.
3. `docs/templates/<lang>/` — both documents, with the same filenames, plus the folder's `INDEX.md`.
4. This catalog.

[consentForm.test.mjs](../../tests/unit_js/modules/common/consentForm.test.mjs) pins each letter to
its markdown edition and both maps to each other, so a half-added language cannot ship.

## Related

- [docs/INDEX.md](../INDEX.md) — the documentation catalog this is part of
- [PRIVACY_FOR_TRAINERS.md](../PRIVACY_FOR_TRAINERS.md) — how a trainer uses these documents
- [PRIVACY.md](../../PRIVACY.md) — what the app itself does with data
