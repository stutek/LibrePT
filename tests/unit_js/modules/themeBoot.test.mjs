// tests/unit_js/modules/themeBoot.test.mjs
// src/theme-boot.js puts the theme class on <html> before the first paint, and cannot import, so it
// carries its own copy of the theme list and the old theme names. modules/common/theme.js takes over
// once the app has loaded. If the two resolve a name differently, the page paints one theme and then
// switches to another — or paints unstyled — and no other test looks at the first paint. So the
// script is run here, as written, for every name either side knows.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import {
  LEGACY_THEME_MAP,
  THEMES,
  resolveTheme,
  themeClass,
} from "../../../src/modules/common/theme.js";

const BOOT_SOURCE = readFileSync(new URL("../../../src/theme-boot.js", import.meta.url), "utf8");

// The class theme-boot.js puts on <html> for a page opened at `search` with `saved` in storage.
function bootClass({ search = "", saved = null }) {
  const root = { className: "" };
  const context = {
    location: { protocol: "http:", hostname: "localhost", search },
    URLSearchParams,
    localStorage: { getItem: () => saved },
    document: { documentElement: root, addEventListener: () => {} },
    console,
  };
  context.window = context;
  vm.runInNewContext(BOOT_SOURCE, context);
  return root.className;
}

const EVERY_NAME = [...THEMES, ...Object.keys(LEGACY_THEME_MAP), "no-such-theme"];

test("the boot script and the theme module resolve every theme name alike", () => {
  for (const name of EVERY_NAME) {
    const expected = themeClass(resolveTheme(name));
    assert.equal(bootClass({ search: `?theme=${name}` }), expected, `?theme=${name}`);
    assert.equal(bootClass({ saved: name }), expected, `saved ${name}`);
  }
});

test("with no link and nothing saved, both open the default theme", () => {
  assert.equal(bootClass({}), themeClass(resolveTheme(null)));
});
