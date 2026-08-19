---
type: template
title: Informative Client Consent Letter & Intake Template
description: Standardized GDPR-compliant client consent form template for personal trainers handling health data (Special Category Data under Article 9).
status: active
consent_form_version: "2026-08-09"
tags:
  - gdpr
  - consent
  - privacy
  - template
  - okf
---

# Informative Client Consent Letter Template

The letter below is the wording LibrePT itself sends. The app's **Email form** button (Add/Edit
Client → *Data Protection (GDPR)*) opens your mail client prefilled with exactly this text, and its
**Send link by SMS** button sends a one-line message pointing at the
[Client Privacy Notice](Client_Privacy_Notice.md). Print it, email it, or adapt it — but if you
adapt it, see *Versioning* below.

The runtime copy lives in [src/i18n/consent/en.js](../../../src/i18n/consent/en.js) — one file per
language, delivered by [consentForm.js](../../../src/modules/common/consentForm.js) — and the two are
pinned to each other by
[tests/unit_js/modules/common/consentForm.test.mjs](../../../tests/unit_js/modules/common/consentForm.test.mjs),
so this document cannot silently drift out of step with what the app actually sends.

## The letter

```markdown
Subject: Personal Training — Data Privacy & Cloud Storage Consent

Hi [Client Name],

To prepare our workout schedules, track your strength progression, and ensure safe training, I use LibrePT to log our session results, exercise weights, and any relevant mobility or injury notes.

In accordance with data protection regulations (GDPR), I want to make sure you are fully informed about how your coaching data is managed:

1. Storage & Security: Your workout logs and training notes are stored on my own device and, optionally, backed up to my personal cloud storage strictly for coaching continuity and preparation.
2. No Third-Party Tracking or Selling: Your data is never sold, shared with advertisers, or transferred to third parties.
3. Artificial Intelligence Safety: If I utilize AI tools to assist in periodizing or analyzing workout volume, your records are strictly anonymized (all names and identifying personal information are stripped) prior to analysis.
4. Your Rights: You have the right at any time to request a complete export of your workout history, request corrections, or ask for your personal records to be permanently deleted. You may also withdraw this consent at any time and in any form — withdrawal stops any further processing and does not affect the lawfulness of processing carried out before it.

The full privacy notice is here: {{PUBLIC_SITE_URL}}/privacy-notice-en.html

Please reply "I CONSENT" to this email (or sign the printed form) to confirm that you understand and agree to these privacy practices for our personal training sessions.

To withdraw later, reply "WITHDRAW" to this message. Withdrawing is exactly as easy as giving consent — the same reply, no form and no account — and you do not have to give a reason.

Consent form version: 2026-08-09

Best regards,
Your Personal Trainer
```

## Printed form — signature block

Append this to the printed version. **You keep the signed sheet.** LibrePT never stores a photo,
scan, or signature — only the fact of consent, the date on this sheet, and the form version above.

```markdown
Client Signature: ___________________________   Date: _______________

Trainer Signature: __________________________   Date: _______________
```

## Versioning

Consent is consent to *a specific wording*, so LibrePT stamps the version a client signed under onto
their record (`gdprConsent.formVersion`, see [DATA_MODEL §1](../../DATA_MODEL.md)) alongside the signed
date. That stamp is what lets you answer "who is still covered?" after the letter changes.

- **Bump the version** when the *substance* changes — a new purpose, a new recipient or processor, a
  change to retention or to the rights on offer. Clients on an older version should re-sign.
- **Do not bump it** for typos, formatting, or translation of unchanged meaning: those clients
  consented to the same thing, and a bump would send every one of them a form to re-sign for nothing.
  The 2026-08-10 terminology audit is the worked example — the Slovenian edition changed
  substantially (consent became *privolitev* throughout, per the
  [terminology map](../sl/INDEX.md)) and both editions gained an explicit Art. 7(3) sentence on
  withdrawal, yet **`2026-08-09` stayed**: the purposes, the recipients, the retention and the rights
  on offer are all unchanged, and stating a right the client already held more plainly does not make
  the earlier consent cover less than it did.
- **The version is a full ISO date (`YYYY-MM-DD`) — the day the current wording was adopted, not the
  day the file was last touched.** A month alone cannot separate two substantive revisions that land
  in the same month, and separating them is the only thing the stamp is for. It is deliberately not
  the app's commit SHA or data schema — those are the *code* and *data shape* axes and change
  constantly, while this letter does not.
- **One version spans every language.** The translations state the same promises, so versioning them
  separately would make the stamp stop meaning "which promises were made". Bumping therefore means
  editing, in one change: `CONSENT_FORM_VERSION` in
  [consentForm.js](../../../src/modules/common/consentForm.js), the letter body in **every**
  `src/i18n/consent/<lang>.js`, and the matching `docs/templates/<lang>/Client_Consent_Form.md` —
  the unit test fails until they agree.

## Related

- [Client Privacy Notice](Client_Privacy_Notice.md) — the plain-language notice this letter links to
- [Slovenian edition](../sl/Client_Consent_Form.md) — the same letter, as the app sends it in Slovenian
- [templates INDEX](../INDEX.md) — every language this form exists in
- [Trainer Privacy Guide](../../PRIVACY_FOR_TRAINERS.md) — your obligations as data controller
- [PRIVACY.md](../../../PRIVACY.md) — what LibrePT itself does and does not do with data
