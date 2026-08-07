// tests/unit_js/modules/common/utils.test.mjs
// getInitials (src/modules/common/utils.js) is a DERIVED display value: unlike the fields around
// it, it is not escaped at the sink, because it is computed rather than passed through. So the
// derivation itself must never emit markup — a hostile client name arriving in an imported backup
// must still reduce to something alphanumeric and renderable.
//
// This began as a Playwright test that booted the whole app to reach one pure function through
// page.evaluate. It needs no DOM at all.

import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHTML, getInitials } from "../../../../src/modules/common/utils.js";

test("initials from a hostile name stay alphanumeric", () => {
  const derived = {
    hostile: getInitials("<img src=x> <script>"),
    punctuation: getInitials("!!!"),
    normal: getInitials("Jane Doe"),
    single: getInitials("Prince"),
    empty: getInitials(""),
  };

  for (const value of Object.values(derived)) {
    assert.equal(value.includes("<"), false, `initials leaked markup: ${value}`);
    assert.equal(value.includes(">"), false, `initials leaked markup: ${value}`);
  }

  assert.equal(derived.normal, "JD");
  assert.equal(derived.single, "PR");
  // A name with nothing alphanumeric in it still has to produce something renderable.
  assert.equal(derived.punctuation, "PT");
  assert.equal(derived.empty, "PT");
});

// A client's name is user data and can be in any script. The vendored webfonts cover latin +
// latin-ext only (src/fonts/fonts.css), so a non-Latin name renders via the CSS fallback chain
// rather than in-brand — that is a deliberate size trade-off and works fine. What must NOT happen
// is the DERIVED initials degrading: getInitials builds an avatar label by hand, and the "nothing
// alphanumeric here" fallback (`PT`) would erase a perfectly good name if the regex stopped
// recognising a script. Today's behaviour is correct but was never pinned, so pin it.
test("initials are derived from non-Latin names, not replaced by the fallback", () => {
  const derived = {
    han: getInitials("王小明"),
    hanSpaced: getInitials("山田 太郎"),
    cyrillic: getInitials("Милан Петров"),
    greek: getInitials("Γιώργος"),
    arabic: getInitials("مريم"),
    latinExt: getInitials("Ana Švab"),
  };

  for (const [script, value] of Object.entries(derived)) {
    assert.equal(
      value,
      value.toString(),
      `${script} produced a non-string: ${JSON.stringify(value)}`,
    );
    assert.notEqual(
      value,
      "PT",
      `${script} fell back to the placeholder instead of using the name`,
    );
    assert.equal(value.length > 0, true, `${script} produced empty initials`);
  }

  // Two-glyph initials for a two-part name, one script or mixed spacing.
  assert.equal(derived.han, "王小");
  assert.equal(derived.hanSpaced, "山太");
  assert.equal(derived.cyrillic, "МП");
  assert.equal(derived.greek, "ΓΙ");
  assert.equal(derived.arabic, "مر");
  assert.equal(derived.latinExt, "AŠ");
});

// escapeHTML is the sink every rendered string in the app passes through, and it had NO test —
// which is how a second, subtly different copy lived in exerciseAndRestTimer.js unnoticed until
// TODO §24.2. build/frontend_audit.py checks that interpolated values are wrapped in a call named
// escapeHTML; it cannot check that the call escapes anything. That is this test's job.
test("escapeHTML neutralises every character that can break out of markup", () => {
  assert.equal(escapeHTML("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
  // Attribute contexts: both quote styles must go, or a value can escape its own attribute.
  assert.equal(escapeHTML(`" onerror="alert(1)`), "&quot; onerror=&quot;alert(1)");
  assert.equal(escapeHTML("' onerror='alert(1)"), "&#039; onerror=&#039;alert(1)");
  // Ampersand first, so an escape is never itself re-escaped into something inert-looking.
  assert.equal(escapeHTML("&lt;"), "&amp;lt;");
  assert.equal(escapeHTML("Tom & Jerry's <b>"), "Tom &amp; Jerry&#039;s &lt;b&gt;");
});

// A rendered value is not always a string: set counts, loads and rest seconds all reach a template
// as numbers. The old falsy guard turned 0 into "", so a legitimately-zero field rendered blank.
test("escapeHTML renders zero, and renders absent values as nothing", () => {
  assert.equal(escapeHTML(0), "0");
  assert.equal(escapeHTML(42), "42");
  assert.equal(escapeHTML(""), "");
  assert.equal(escapeHTML(null), "");
  assert.equal(escapeHTML(undefined), "");
});
