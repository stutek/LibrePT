// tests/unit_js/modules/splashScreen.test.mjs
// The cold-start splash's timing rules (src/modules/splash/splashScreen.js), which are pure
// arithmetic over a URL and a clock reading — no DOM, no persistence.
//
// These began as e2e tests measuring wall-clock time around a real page load, and that was the
// wrong tier twice over: the measurement includes boot, so it asserts on the machine's load as
// much as on the code, and it duly failed on a box sitting at load average 20 on 16 cores. What is
// actually being specified — "?splash=off means zero hold", "the hold is what's LEFT of the
// minimum" — needs neither a browser nor a server. What still genuinely needs a real boot (the
// overlay covering the app, then being removed from the layout) stays in
// tests/e2e/test_splash_screen.py.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  remainingHoldMs,
  requestedMinimumVisibleMs,
} from "../../../src/modules/splash/splashScreen.js";

test("?splash=off asks for no hold at all", () => {
  assert.equal(requestedMinimumVisibleMs("?splash=off"), 0);
});

test("the hold applies by default, and to any other splash value", () => {
  // Only the exact opt-out disables it — a typo must not silently skip the splash.
  for (const search of ["", "?", "?init=demo_data_load", "?splash=on", "?splash=", "?splash=OFF"]) {
    assert.ok(requestedMinimumVisibleMs(search) > 0, `${search || "(empty)"} should keep the hold`);
  }
});

test("?splash=off survives being one parameter among several", () => {
  assert.equal(requestedMinimumVisibleMs("?lang=sl&splash=off&theme=nebula"), 0);
});

test("the hold is what REMAINS of the minimum, not the minimum again", () => {
  // The window is measured from navigation start, so time already spent booting counts towards it
  // — a 4s minimum is never 4s bolted onto the end of a slow boot.
  assert.equal(remainingHoldMs(4000, 0), 4000);
  assert.equal(remainingHoldMs(4000, 1500), 2500);
  assert.equal(remainingHoldMs(4000, 4000), 0);
});

test("a boot slower than the minimum owes no further hold", () => {
  assert.equal(remainingHoldMs(4000, 9000), 0);
});
