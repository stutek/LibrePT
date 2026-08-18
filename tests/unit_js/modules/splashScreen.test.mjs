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

// Every requestedMinimumVisibleMs() call here passes `alreadyHeld` explicitly. Its default reads
// sessionStorage, which node:test has no equivalent of, and a default argument is evaluated
// before the body can short-circuit — so omitting it throws even for cases that never need it.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  demoDataUrl,
  isSplashDisabled,
  remainingHoldMs,
  requestedMinimumVisibleMs,
  splashSuppressed,
  walkthroughUrl,
} from "../../../src/modules/splash/splashScreen.js";

test("?splash=off asks for no hold at all", () => {
  assert.equal(requestedMinimumVisibleMs("?splash=off", false), 0);
});

test("the hold applies by default, and to any other splash value", () => {
  // Only the exact opt-out disables it — a typo must not silently skip the splash.
  for (const search of ["", "?", "?init=demo_data_load", "?splash=on", "?splash=", "?splash=OFF"]) {
    assert.ok(
      requestedMinimumVisibleMs(search, false) > 0,
      `${search || "(empty)"} should keep the hold`,
    );
  }
});

test("?splash=off survives being one parameter among several", () => {
  assert.equal(requestedMinimumVisibleMs("?lang=sl&splash=off&theme=nebula", false), 0);
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

test("the demo link reuses the app's own deep-link params, and suppresses the splash", () => {
  const url = new URL(demoDataUrl("https://app.example.test/LibrePT/?lang=sl"));
  assert.equal(url.searchParams.get("init"), "demo_data_load");
  assert.equal(url.searchParams.get("splash"), "off");
  // Whatever else was on the URL survives — a demo link can still carry a language or theme.
  assert.equal(url.searchParams.get("lang"), "sl");
  assert.equal(url.pathname, "/LibrePT/");
});

test("the demo link overwrites a contradictory splash param rather than appending one", () => {
  const url = new URL(demoDataUrl("https://app.example.test/LibrePT/?splash=on"));
  assert.deepEqual(url.searchParams.getAll("splash"), ["off"]);
});

test("splash=off disables the splash entirely, onboarding included", () => {
  // dismissSplashWhenReady gates the onboarding panel on this too: the parameter means "put me in
  // the app", and a blocking panel would contradict that — the browser suite depends on it.
  assert.equal(isSplashDisabled("?splash=off"), true);
  assert.equal(isSplashDisabled("?splash=on"), false);
  assert.equal(isSplashDisabled(""), false);
});

test("the hold is paid once per session, not on every load", () => {
  // Second and later loads in the same tab — a reload, a deep link, bouncing back in — get no
  // hold at all. The splash still covers the boot; it just adds nothing to it.
  assert.equal(requestedMinimumVisibleMs("", true), 0);
  assert.ok(requestedMinimumVisibleMs("", false) > 0);
});

test("splash=off still wins even on the first load of a session", () => {
  assert.equal(requestedMinimumVisibleMs("?splash=off", false), 0);
});

// ── A first run outranks a leftover deep link (TODO §28.11) ────────────────────────────────────
// Clearing browser data does not clear the ADDRESS BAR, so the reload arrives carrying whatever
// link was open — and `?splash=off`, which every demo link sets and every later navigation carries
// forward, suppresses both first-run screens. The trainer is then dropped into an empty app having
// been asked nothing and offered nothing.

test("a leftover ?splash=off does not suppress a first run the link brought nothing to", () => {
  assert.equal(
    splashSuppressed({ search: "?splash=off", firstRun: true, linkBringsContent: false }),
    false,
    "an empty store and a link with no content is a first run, whatever the URL says",
  );
});

test("a link that brings content still decides — it is a purposeful arrival", () => {
  // ?init= seeds the demo, ?demo= runs the walkthrough, ?evt= carries an invitation a client is
  // answering. All three furnish the app, so the parameter is a choice rather than a leftover, and
  // stopping a client on a fresh phone to pick a language would be its own bug.
  assert.equal(
    splashSuppressed({ search: "?splash=off", firstRun: true, linkBringsContent: true }),
    true,
  );
});

test("with a furnished store the parameter means exactly what it always meant", () => {
  assert.equal(
    splashSuppressed({ search: "?splash=off", firstRun: false, linkBringsContent: false }),
    true,
  );
});

test("no ?splash=off, nothing to override", () => {
  assert.equal(
    splashSuppressed({ search: "?lang=sl", firstRun: true, linkBringsContent: false }),
    false,
  );
  assert.equal(splashSuppressed({ search: "", firstRun: false, linkBringsContent: false }), false);
});

// ── Where a demo or walkthrough link starts (wanted 2026-08-18) ────────────────────────────────
// "show me around should start from the sessions list view". The links are built from the CURRENT
// URL, so tapping the offer from a deep route — a client page, a live clipboard — started the guide
// wherever the trainer happened to be, and the first step looks for a session card.

test("a demo link starts at the app root, whatever route it was built from", () => {
  const url = new URL(
    demoDataUrl("https://app.example.test/LibrePT/session/s1/client/c2?lang=sl", "/LibrePT/"),
  );

  assert.equal(url.pathname, "/LibrePT/");
  // The deep-link params still survive: a promo link keeps its language and theme.
  assert.equal(url.searchParams.get("lang"), "sl");
  assert.equal(url.searchParams.get("init"), "demo_data_load");
});

test("a walkthrough link starts there too — its first step looks for a session card", () => {
  const url = new URL(
    walkthroughUrl("https://app.example.test/LibrePT/clients/c2?theme=nebula", "/LibrePT/"),
  );

  assert.equal(url.pathname, "/LibrePT/");
  assert.equal(url.searchParams.get("theme"), "nebula");
  assert.ok(url.searchParams.get("demo"));
});
