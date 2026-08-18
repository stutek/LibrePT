// tests/unit_js/modules/common/consentForm.test.mjs
// The GDPR consent letters (src/i18n/consent/) and their delivery (src/modules/common/consentForm.js)
// are pure string building — no DOM, no storage — so they belong here rather than in a browser tier.
// The DOM-dependent half (the consent block inside the client dialog, its date field, language
// picker and info dialog) lives in tests/medium/test_client_consent.py.
//
// Two load-bearing tests, both about drift that is invisible until a client is affected:
//   * every letter is pinned to its printable docs/templates/<lang>/ edition — the wording already
//     drifted once across three copies ("Google Drive/iCloud" vs "personal cloud storage"), and a
//     client handed one version while consenting to another has not really been informed;
//   * the letter registry is pinned key-for-key to the UI's TRANSLATIONS — a UI language with no
//     consent letter silently sends English to someone who was offered their own language.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { PUBLIC_SITE_URL } from "../../../../src/data/publicUrls.js";
import {
  CONSENT_LANG_LABELS,
  CONSENT_LETTERS,
  DEFAULT_CONSENT_LANG,
} from "../../../../src/i18n/consent/index.js";
import { TRANSLATIONS } from "../../../../src/i18n/index.js";
import {
  CONSENT_FORM_VERSION,
  clientConsentFormUrl,
  clientPrivacyNoticeUrl,
  consentEmailBody,
  consentEmailHref,
  consentEmailSubject,
  consentShareText,
  consentSmsHref,
} from "../../../../src/modules/common/consentForm.js";

const LANGS = Object.keys(CONSENT_LETTERS);

function templateFor(lang) {
  const path = fileURLToPath(
    new URL(`../../../../docs/templates/${lang}/Client_Consent_Form.md`, import.meta.url),
  );
  return readFileSync(path, "utf8");
}

test("the version is a full ISO date, not a month, a commit, or a schema number", () => {
  // Full date because two substantive revisions can land in one month and the stamp has to separate
  // them. Its own axis because the code version and the data schema both move constantly, and a
  // consent that re-dated itself on every deploy would ask every client to re-sign for nothing.
  assert.match(CONSENT_FORM_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(CONSENT_FORM_VERSION)), "must be a real date");
});

test("every UI language can send the consent letter in that language", () => {
  assert.deepEqual(LANGS.sort(), Object.keys(TRANSLATIONS).sort());
  assert.deepEqual(Object.keys(CONSENT_LANG_LABELS).sort(), LANGS.sort());
  assert.ok(LANGS.includes(DEFAULT_CONSENT_LANG));
});

test("an unknown or missing language falls back to the default, never to nothing", () => {
  // Reachable from a share link (?lang=…) and from a record imported with a since-removed locale.
  for (const lang of [undefined, null, "de", "__proto__", "constructor", 7]) {
    assert.equal(consentEmailSubject(lang), consentEmailSubject(DEFAULT_CONSENT_LANG));
    assert.ok(consentEmailBody("Jane", lang).length > 200);
  }
});

test("each letter names the client, the version, and its own language's notice", () => {
  for (const lang of LANGS) {
    const body = consentEmailBody("Jane Doe", lang);

    assert.ok(body.includes("Jane Doe"), `${lang}: client name missing`);
    assert.ok(body.includes(CONSENT_FORM_VERSION), `${lang}: version stamp missing`);
    // The notice must be the one the client can actually read — not the English one.
    assert.ok(body.includes(clientPrivacyNoticeUrl(lang)), `${lang}: wrong notice URL`);
  }

  // Language-specific, asserted as a difference rather than by matching a path segment: the URL
  // shape changed once already (github.com/…/templates/<lang>/ → a shipped page) and an assertion
  // spelling out the old one failed on a change that broke nothing a client would notice.
  assert.notEqual(clientPrivacyNoticeUrl("en"), clientPrivacyNoticeUrl("sl"));
});

test("the notice link a client receives is absolute and points at the deployed site", () => {
  // The property that matters is where this URL is READ: in an email, an SMS, and printed on a
  // signed paper form — by someone who has never opened the app, on a device that never loaded it.
  //
  // Deriving it from the running origin (import.meta.url) was tried and is wrong precisely there: a
  // trainer testing against the local dev server would send a client a localhost link, and
  // under Node it resolved to `file:///…`. Anything origin-relative fails the same way.
  for (const lang of LANGS) {
    for (const url of [clientPrivacyNoticeUrl(lang), clientConsentFormUrl(lang)]) {
      assert.ok(url.startsWith("https://"), `${lang}: ${url} is not an absolute https URL`);
      assert.ok(!url.includes("localhost"), `${lang}: ${url} points at a dev server`);
    }
  }
});

test("the SMS variant is a link, not the whole letter", () => {
  for (const lang of LANGS) {
    // A messaging app truncates a multi-screen wall of text differently on every platform, so what
    // the client reads has to be the linked document rather than the message body.
    const share = consentShareText("Jane Doe", lang);

    assert.ok(share.includes(clientPrivacyNoticeUrl(lang)));
    assert.ok(share.length < 400, `${lang}: share text should stay short, got ${share.length}`);
  }
});

test("withdrawing is offered by the same route as consenting (Art. 7(3))", () => {
  // The legal standard is not "withdrawal is possible" — the letter already said that — it is that
  // withdrawal be AS EASY as giving consent. Since consent is given by replying with a word, the
  // only route that meets the standard is replying with a word, in the same message, to the same
  // person. Anything requiring a form, an account or a different channel is a harder path back out
  // than in, which is the failure Art. 7(3) names.
  const keywords = { en: ["I CONSENT", "WITHDRAW"], sl: ["PRIVOLIM", "PREKLICUJEM"] };

  for (const lang of LANGS) {
    const [consentWord, withdrawWord] = keywords[lang];
    const body = consentEmailBody("Jane Doe", lang);

    assert.ok(body.includes(consentWord), `${lang}: the consent keyword vanished`);
    assert.ok(body.includes(withdrawWord), `${lang}: no reply keyword to withdraw with`);

    // Both instructions must reach the client in the SAME message: a withdrawal route that only
    // exists in the separate privacy notice is a route most clients never see.
    assert.ok(
      body.indexOf(consentWord) < body.indexOf(withdrawWord),
      `${lang}: withdrawal should follow the consent instruction it mirrors`,
    );
  }
});

test("the SMS variant offers withdrawal too, since some clients only ever get that one", () => {
  // A client sent the link by SMS never receives the email letter, so a withdrawal route that lives
  // only in the email is absent for exactly the clients reached by the shorter channel.
  const keywords = { en: "WITHDRAW", sl: "PREKLICUJEM" };
  for (const lang of LANGS) {
    assert.ok(
      consentShareText("Jane Doe", lang).includes(keywords[lang]),
      `${lang}: the share text offers no way back out`,
    );
  }
});

test("delivery links are built only when there is an address to send to", () => {
  assert.equal(consentEmailHref({ name: "Jane", phone: "+386 40 123 456" }, "en"), "");
  assert.equal(consentSmsHref({ name: "Jane", email: "jane@example.com" }, "en"), "");
  assert.equal(consentEmailHref(null, "en"), "");
  assert.equal(consentSmsHref(undefined, "en"), "");
});

test("the mailto carries the chosen language's subject and letter, percent-encoded", () => {
  for (const lang of LANGS) {
    const href = consentEmailHref({ name: "Jane Doe", email: "jane@example.com" }, lang);

    assert.ok(href.startsWith("mailto:jane%40example.com?"));
    assert.ok(href.includes(`subject=${encodeURIComponent(consentEmailSubject(lang))}`));
    assert.ok(href.includes(encodeURIComponent("Jane Doe")));
    // No raw whitespace may survive into an href — a mail client truncates the body there.
    assert.equal(/\s/.test(href), false, `${lang}: unencoded whitespace in mailto`);
  }
});

test("the sms href uses the ?&body= form both mobile platforms accept", () => {
  const href = consentSmsHref({ name: "Jane Doe", phone: "+386 40 123 456" }, "sl");

  // iOS honours the body only after a leading `&`; Android accepts either. Spaces are stripped
  // from the number because a dialer handed "+386 40" opens on a mangled recipient.
  assert.ok(href.startsWith("sms:+38640123456?&body="));
  assert.ok(href.includes(encodeURIComponent(clientPrivacyNoticeUrl("sl"))));
});

test("every shipped letter is verbatim its printable template", () => {
  for (const lang of LANGS) {
    // The template names the deployed address rather than writing it out (TODO §28.2), the same
    // placeholder render_docs.py resolves when it builds the client-facing page. Resolved here from
    // the SAME declaration the app reads, so this stays a drift test between the letter and the
    // template rather than a second place the URL is written.
    const template = templateFor(lang).replaceAll("{{PUBLIC_SITE_URL}}", PUBLIC_SITE_URL);
    const fenced = template.match(/```markdown\n([\s\S]*?)```/);
    assert.ok(fenced, `${lang}: the letter must stay in a \`\`\`markdown fence`);

    // The subject line is part of the printable form, and part of what the mail client sends.
    const subjectLabel = fenced[1].split("\n")[0].split(":")[0];
    const expected = `${subjectLabel}: ${consentEmailSubject(lang)}\n\n${consentEmailBody(
      lang === "sl" ? "[Ime stranke]" : "[Client Name]",
      lang,
    )}\n`;
    assert.equal(
      fenced[1],
      expected,
      `docs/templates/${lang}/Client_Consent_Form.md and src/i18n/consent/${lang}.js have drifted — change both, or neither`,
    );

    // One version spans every locale: the translations state the same promises, so a per-language
    // version would stop meaning "which promises were made".
    assert.ok(
      template.includes(`consent_form_version: "${CONSENT_FORM_VERSION}"`),
      `${lang}: frontmatter version does not match CONSENT_FORM_VERSION`,
    );
  }
});
