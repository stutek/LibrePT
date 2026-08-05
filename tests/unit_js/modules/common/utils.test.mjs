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
import { getInitials } from "../../../../src/modules/common/utils.js";

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
