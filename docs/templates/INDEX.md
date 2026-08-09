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

| Document | Language | Type | Description |
| :--- | :--- | :--- | :--- |
| [en/Client_Consent_Form.md](en/Client_Consent_Form.md) | English | `template` | The consent letter, the printable signature block, and the version-bumping rule that governs every language |
| [en/Client_Privacy_Notice.md](en/Client_Privacy_Notice.md) | English | `template` | Art. 13 notice — what the client must be told *before* consenting |
| [sl/Client_Consent_Form.md](sl/Client_Consent_Form.md) | Slovenščina | `template` | Obrazec soglasja — the same letter, as sent in Slovenian |
| [sl/Client_Privacy_Notice.md](sl/Client_Privacy_Notice.md) | Slovenščina | `template` | Obvestilo o zasebnosti — the Art. 13 notice in Slovenian |

**English is the source edition.** Translations state the same promises and carry the same
`consent_form_version`; where a translation and the English text disagree, the English text is what
was intended, and the difference is a bug in the translation. Translations are maintainer-made and
not legally reviewed — each says so at the top.

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
