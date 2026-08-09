// src/i18n/consent/en.js — the English GDPR consent letter, as sent by the app's Email form and
// Send link by SMS buttons.
//
// It lives beside the UI dictionaries rather than inside the consent module because it is
// translated copy, not logic: a new language is a new file here plus a row in ./index.js, and
// nothing in modules/ changes. What it is NOT is a flat key→string dictionary like en.js — a
// consent letter is one continuous document whose paragraphs cannot be reordered or partially
// translated, so it is a template function taking the three values that vary.
//
// Pinned verbatim to docs/templates/en/Client_Consent_Form.md by
// tests/unit_js/modules/common/consentForm.test.mjs — a client must never be handed one wording
// and asked to consent to another.
//
// deps: none — pure string building.

export const consentEn = {
  subject: "Personal Training — Data Privacy & Cloud Storage Consent",

  body: ({ clientName, noticeUrl, version }) => `Hi ${clientName},

To prepare our workout schedules, track your strength progression, and ensure safe training, I use LibrePT to log our session results, exercise weights, and any relevant mobility or injury notes.

In accordance with data protection regulations (GDPR), I want to make sure you are fully informed about how your coaching data is managed:

1. Storage & Security: Your workout logs and training notes are stored on my own device and, optionally, backed up to my personal cloud storage strictly for coaching continuity and preparation.
2. No Third-Party Tracking or Selling: Your data is never sold, shared with advertisers, or transferred to third parties.
3. Artificial Intelligence Safety: If I utilize AI tools to assist in periodizing or analyzing workout volume, your records are strictly anonymized (all names and identifying personal information are stripped) prior to analysis.
4. Your Rights: You have the right at any time to request a complete export of your workout history, request corrections, or ask for your personal records to be permanently deleted.

The full privacy notice is here: ${noticeUrl}

Please reply "I CONSENT" to this email (or sign the printed form) to confirm that you understand and agree to these privacy practices for our personal training sessions.

Consent form version: ${version}

Best regards,
Your Personal Trainer`,

  share: ({ clientName, noticeUrl }) =>
    `Hi ${clientName}, before I log your training data I need your consent under GDPR. Please read the short privacy notice here: ${noticeUrl} — reply CONSENT to agree, or sign the printed form at the gym.`,
};
