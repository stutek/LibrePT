// tests/unit_js/modules/common/consentForm.test.mjs
// The GDPR consent letter and its delivery links (src/modules/common/consentForm.js) are pure
// string building — no DOM, no storage — so they belong here rather than in a browser tier. The
// DOM-dependent half (the consent block inside the client dialog, its date field and info dialog)
// lives in tests/medium/test_client_consent.py.
//
// The load-bearing test is the LAST one: the letter exists in two places by necessity — the module
// the app sends from, and docs/templates/Client_Consent_Form.md that a trainer prints. It already
// drifted once between three copies ("Google Drive/iCloud" vs "personal cloud storage"), which is
// invisible until a client is handed one version and asked to consent to another. Nothing but a
// test can see that, so this is what keeps them equal.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CLIENT_PRIVACY_NOTICE_URL,
  CONSENT_EMAIL_SUBJECT,
  CONSENT_FORM_VERSION,
  consentEmailBody,
  consentEmailHref,
  consentShareText,
  consentSmsHref,
} from "../../../../src/modules/common/consentForm.js";

const TEMPLATE_PATH = fileURLToPath(
  new URL("../../../../docs/templates/Client_Consent_Form.md", import.meta.url),
);

test("the version is a plain YYYY-MM stamp, not a commit or a schema number", () => {
  // Deliberately its own axis: the code version and the data schema both move constantly, and a
  // consent that re-dated itself on every deploy would ask every client to re-sign for nothing.
  assert.match(CONSENT_FORM_VERSION, /^\d{4}-\d{2}$/);
});

test("the letter names the client, the version, and where to read the full notice", () => {
  const body = consentEmailBody("Jane Doe");

  assert.ok(body.startsWith("Hi Jane Doe,"));
  assert.ok(body.includes(CLIENT_PRIVACY_NOTICE_URL));
  assert.ok(body.includes(`Consent form version: ${CONSENT_FORM_VERSION}`));
});

test("the SMS variant is a link, not the whole letter", () => {
  // A messaging app truncates a multi-screen wall of text differently on every platform, so what
  // the client reads has to be the linked document rather than the message body.
  const share = consentShareText("Jane Doe");

  assert.ok(share.includes(CLIENT_PRIVACY_NOTICE_URL));
  assert.ok(share.length < 320, `share text should stay short, got ${share.length} chars`);
});

test("delivery links are built only when there is an address to send to", () => {
  assert.equal(consentEmailHref({ name: "Jane", phone: "+386 40 123 456" }), "");
  assert.equal(consentSmsHref({ name: "Jane", email: "jane@example.com" }), "");
  assert.equal(consentEmailHref(null), "");
  assert.equal(consentSmsHref(undefined), "");
});

test("the mailto carries the subject and the letter, percent-encoded", () => {
  const href = consentEmailHref({ name: "Jane Doe", email: "jane@example.com" });

  assert.ok(href.startsWith("mailto:jane%40example.com?"));
  assert.ok(href.includes(`subject=${encodeURIComponent(CONSENT_EMAIL_SUBJECT)}`));
  assert.ok(href.includes(encodeURIComponent("Hi Jane Doe,")));
  // No raw newline or space may survive into an href — a mail client truncates the body there.
  assert.equal(/[\s]/.test(href), false);
});

test("the sms href uses the ?&body= form both mobile platforms accept", () => {
  const href = consentSmsHref({ name: "Jane Doe", phone: "+386 40 123 456" });

  // iOS honours the body only after a leading `&`; Android accepts either. Spaces are stripped
  // from the number because a dialer handed "+386 40" opens on a mangled recipient.
  assert.ok(href.startsWith("sms:+38640123456?&body="));
  assert.ok(href.includes(encodeURIComponent(CLIENT_PRIVACY_NOTICE_URL)));
});

test("the shipped letter is verbatim the printable template", () => {
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  const fenced = template.match(/```markdown\n([\s\S]*?)```/);
  assert.ok(fenced, "Client_Consent_Form.md must keep the letter in a ```markdown fence");

  const expected = `Subject: ${CONSENT_EMAIL_SUBJECT}\n\n${consentEmailBody("[Client Name]")}\n`;
  assert.equal(
    fenced[1],
    expected,
    "docs/templates/Client_Consent_Form.md and consentForm.js have drifted — change both, or neither",
  );

  // The frontmatter stamp is what a trainer reads off the printed sheet; it must be the version the
  // app actually stamps onto the record.
  assert.ok(template.includes(`consent_form_version: "${CONSENT_FORM_VERSION}"`));
});
