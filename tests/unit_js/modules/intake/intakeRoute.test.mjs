// tests/unit_js/modules/intake/intakeRoute.test.mjs
// Which visitor is this, and what language do they read? (src/modules/intake/intakeRoute.js) — §1.7.
//
// Both answers gate a boot decision, which is why they are pure and pinned here: getting the first
// one wrong runs the trainer's whole app on a stranger's phone, and getting the second wrong stamps a
// consent record with a language the person cannot read.

import assert from "node:assert/strict";
import { test } from "node:test";
import { isIntakeLocation, resolveIntakeLang } from "../../../../src/modules/intake/intakeRoute.js";

test("the intake page is recognised wherever the app is hosted", () => {
  // Pages serves it under a repo path, local dev at the root, and a client's typed URL may or may not
  // end in a slash — all four are the same page.
  assert.equal(isIntakeLocation("/LibrePT/intake"), true);
  assert.equal(isIntakeLocation("/LibrePT/intake/"), true);
  assert.equal(isIntakeLocation("/intake"), true);
  assert.equal(isIntakeLocation("/intake///"), true);
});

test("no other route is mistaken for it, including ones that merely contain the word", () => {
  for (const path of [
    "/LibrePT/",
    "/clients",
    "/intake/thanks",
    "/sessions/2026-08-17",
    "/reintake",
    "",
  ]) {
    assert.equal(isIntakeLocation(path), false, `${path} is not the intake page`);
  }
});

test("a trainer's QR can name the language, and it wins", () => {
  assert.equal(resolveIntakeLang("sl", ["en-GB"]), "sl");
  assert.equal(resolveIntakeLang("SL", ["en-GB"]), "sl", "however they typed it");
});

test("otherwise the client's own phone decides, since they never chose a language in this app", () => {
  assert.equal(resolveIntakeLang(null, ["sl-SI", "en-GB"]), "sl");
  // A region subtag never changes which dictionary applies.
  assert.equal(resolveIntakeLang(null, ["sl-SI"]), "sl");
  // First supported preference wins, not first preference overall.
  assert.equal(resolveIntakeLang(null, ["de-DE", "sl-SI"]), "sl");
});

test("an unreadable answer falls back to English rather than to i18n keys on screen", () => {
  assert.equal(resolveIntakeLang("klingon", ["de-DE"]), "en");
  assert.equal(resolveIntakeLang(null, []), "en");
  assert.equal(resolveIntakeLang(null, null), "en");
  assert.equal(resolveIntakeLang({ toString: () => "sl" }, []), "en", "not a string");
});
