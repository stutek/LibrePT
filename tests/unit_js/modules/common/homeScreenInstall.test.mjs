// tests/unit_js/modules/common/homeScreenInstall.test.mjs
// Which of the five situations a browser is in decides what the home-screen offer says
// (src/modules/common/homeScreenInstall.js). The decision is pure; the card and the Settings section
// it draws are pinned in tests/medium/test_home_screen_offer.py.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BROWSER_MENU,
  BROWSER_PROMPT,
  INSTALLED,
  IPAD_STEPS,
  IPHONE_STEPS,
  installSituation,
} from "../../../../src/modules/common/homeScreenInstall.js";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.0.0 Mobile/15E148 Safari/604.1";
const IPAD_AS_MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36";
const ANDROID_FIREFOX = "Mozilla/5.0 (Android 14; Mobile; rv:139.0) Gecko/139.0 Firefox/139.0";

test("an app already running from its icon is offered nothing, whatever the browser", () => {
  assert.equal(installSituation({ standalone: true, canPrompt: true }), INSTALLED);
  assert.equal(installSituation({ standalone: true, userAgent: IPHONE_SAFARI }), INSTALLED);
});

test("a kept install event means the button can open the browser's own question", () => {
  assert.equal(installSituation({ canPrompt: true, userAgent: ANDROID_CHROME }), BROWSER_PROMPT);
});

test("Safari on an iPhone gets the iPhone's steps", () => {
  assert.equal(installSituation({ userAgent: IPHONE_SAFARI, maxTouchPoints: 5 }), IPHONE_STEPS);
});

test("Safari on an iPad gets the iPad's steps, also when it calls itself a Mac", () => {
  assert.equal(installSituation({ userAgent: IPAD_AS_MAC_SAFARI, maxTouchPoints: 5 }), IPAD_STEPS);
});

test("a Mac without a touch screen is not an iPad", () => {
  assert.equal(installSituation({ userAgent: IPAD_AS_MAC_SAFARI, maxTouchPoints: 0 }), BROWSER_MENU);
});

test("another browser on an iPhone is not told Safari's steps", () => {
  assert.equal(installSituation({ userAgent: IPHONE_CHROME, maxTouchPoints: 5 }), BROWSER_MENU);
});

test("a browser without the event and not Safari is told to use its own menu", () => {
  assert.equal(installSituation({ userAgent: ANDROID_FIREFOX }), BROWSER_MENU);
  assert.equal(installSituation({ userAgent: ANDROID_CHROME }), BROWSER_MENU);
});
