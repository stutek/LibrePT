// src/modules/common/consentForm.js — the one wording of the GDPR consent letter LibrePT hands to
// a client, the version stamp recorded against whoever signed it, and the two ways a trainer can
// deliver it from a phone on the gym floor (email compose, SMS with a link).
//
// Why the text lives here and not in three places: the same letter used to be duplicated verbatim
// in clientsView.js, in PRIVACY.md §4 and in docs/templates/Client_Consent_Form.md — and had
// already drifted between them ("Google Drive/iCloud" vs "personal cloud storage"). This module is
// the runtime source; the markdown template is the human-readable one, and
// tests/unit_js/modules/common/consentForm.test.mjs fails the build if the two stop matching.
//
// Why a VERSION and not just a date: the consent a client gave is consent to a specific wording.
// When the letter changes materially (a new processor, a new purpose), a stored version stamp is
// what tells a trainer which clients still hold consent to the current text and which need to
// re-sign — a bare "consented on 2026-05-04" cannot answer that. It is one short string per
// record, so it costs nothing to keep and cannot be reconstructed later if omitted.
//
// deps: none — pure string building, no DOM, no storage.

// Bumped ONLY when the letter's substance changes (purposes, recipients, rights, retention).
// Typo and formatting fixes leave it alone: a client who signed the old text still consented to
// the same thing, and a bump asks every one of them to sign again.
export const CONSENT_FORM_VERSION = "2026-08";

// Where a client can read the full notice on their own device. A GitHub URL rather than an in-app
// route on purpose: the recipient is the CLIENT, who has no LibrePT install and should not need one
// to read what they are agreeing to.
export const CLIENT_PRIVACY_NOTICE_URL =
  "https://github.com/stutek/LibrePT/blob/main/docs/templates/Client_Privacy_Notice.md";

export const CONSENT_EMAIL_SUBJECT = "Personal Training — Data Privacy & Cloud Storage Consent";

// Kept in lockstep with the fenced block in docs/templates/Client_Consent_Form.md (pinned by test).
export function consentEmailBody(clientName) {
  return `Hi ${clientName},

To prepare our workout schedules, track your strength progression, and ensure safe training, I use LibrePT to log our session results, exercise weights, and any relevant mobility or injury notes.

In accordance with data protection regulations (GDPR), I want to make sure you are fully informed about how your coaching data is managed:

1. Storage & Security: Your workout logs and training notes are stored on my own device and, optionally, backed up to my personal cloud storage strictly for coaching continuity and preparation.
2. No Third-Party Tracking or Selling: Your data is never sold, shared with advertisers, or transferred to third parties.
3. Artificial Intelligence Safety: If I utilize AI tools to assist in periodizing or analyzing workout volume, your records are strictly anonymized (all names and identifying personal information are stripped) prior to analysis.
4. Your Rights: You have the right at any time to request a complete export of your workout history, request corrections, or ask for your personal records to be permanently deleted.

The full privacy notice is here: ${CLIENT_PRIVACY_NOTICE_URL}

Please reply "I CONSENT" to this email (or sign the printed form) to confirm that you understand and agree to these privacy practices for our personal training sessions.

Consent form version: ${CONSENT_FORM_VERSION}

Best regards,
Your Personal Trainer`;
}

// The SMS/share variant is deliberately NOT the letter: a multi-screen wall of text in a messaging
// app gets dismissed unread, and every messaging client truncates differently. It is one sentence
// plus the link to the same notice, so what the client actually reads is the canonical document.
export function consentShareText(clientName) {
  return `Hi ${clientName}, before I log your training data I need your consent under GDPR. Please read the short privacy notice here: ${CLIENT_PRIVACY_NOTICE_URL} — reply CONSENT to agree, or sign the printed form at the gym.`;
}

export function consentEmailHref(client) {
  if (!client?.email) return "";
  const subject = encodeURIComponent(CONSENT_EMAIL_SUBJECT);
  const body = encodeURIComponent(consentEmailBody(client.name || ""));
  return `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
}

export function consentSmsHref(client) {
  if (!client?.phone) return "";
  // `?&body=` rather than `?body=`: iOS only honours the body parameter after a leading `&`, while
  // Android accepts either — this one form opens a prefilled compose on both.
  const body = encodeURIComponent(consentShareText(client.name || ""));
  return `sms:${client.phone.replace(/\s/g, "")}?&body=${body}`;
}
