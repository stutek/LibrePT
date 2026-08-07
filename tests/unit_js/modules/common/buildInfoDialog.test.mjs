// tests/unit_js/modules/common/buildInfoDialog.test.mjs
// The single copyable build-identity string (src/modules/common/buildInfoDialog.js) is pure — it
// only reads the BUILD_INFO/CURRENT_SCHEMA_VERSION constants, no DOM involved. The DOM-dependent
// parts of this component (the header stamp touch target, the dialog opening/closing) live in
// tests/medium/test_build_info.py.

import assert from "node:assert/strict";
import { test } from "node:test";
import { CURRENT_SCHEMA_VERSION } from "../../../../src/data/migrationSteps.js";
import { buildInfoText } from "../../../../src/modules/common/buildInfoDialog.js";

test("build details are offered as one copyable, plain-text block", () => {
  const text = buildInfoText();

  assert.equal(text.includes("release:"), false, "no release tags any more — nothing to show here");
  // Against the constant, so a migration that bumps the schema does not also fail this.
  assert.equal(text.includes(`data schema: ${CURRENT_SCHEMA_VERSION}`), true);
  assert.equal(text.includes("commit:"), true);
  assert.equal(text.includes("built:"), true);
});
