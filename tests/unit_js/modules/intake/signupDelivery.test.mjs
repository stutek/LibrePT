// tests/unit_js/modules/intake/signupDelivery.test.mjs
// Handing a filled-in introduction to whatever app the client already uses
// (src/modules/intake/signupDelivery.js) — TODO §1.7.
//
// The promise: a client who taps Send either knows their details went, or knows they did not. The two
// ways that goes wrong are both pinned here — a cancelled share reported as a failure (telling someone
// who changed their mind that the app is broken), and a failed share reported as success (telling
// someone their health details were sent when they were not).
//
// Platform calls are injected, so nothing here needs a browser.

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildClientSignup } from "../../../../src/data/clientSignup.js";
import {
  buildSignupFile,
  canShareSignupFile,
  saveSignupFile,
  shareSignupFile,
} from "../../../../src/modules/intake/signupDelivery.js";

const signup = buildClientSignup({
  name: "Jana Novak",
  email: "jana@example.com",
  injury: "knee reconstruction 2024",
  gdprConsent: {
    cloudSync: true,
    consentDate: "2026-08-17",
    formVersion: "2026-08-09",
    formLang: "sl",
  },
});

function platformThat({ canShare = true, share = async () => {}, save = () => {} } = {}) {
  const saved = [];
  const shared = [];
  return {
    saved,
    shared,
    canShareFiles: () => canShare,
    shareFiles: async (data) => {
      shared.push(data);
      return share(data);
    },
    saveFile: (file) => {
      saved.push(file);
      return save(file);
    },
  };
}

test("the file the client sends carries the submission, named and typed for the other end", async () => {
  const file = buildSignupFile(signup, "2026-08-17");

  assert.equal(file.name, "jana-novak-2026-08-17.librept-signup.json");
  assert.equal(file.type, "application/vnd.librept.signup+json");
  assert.match(await file.text(), /"injury": "knee reconstruction 2024"/);
});

test("an unrepresentable submission produces no file rather than an empty one", () => {
  assert.equal(buildSignupFile(null, "2026-08-17"), null);
  assert.equal(buildSignupFile({ name: "no version field" }, "2026-08-17"), null);
});

test("the one-tap route is offered only where it exists", () => {
  const file = buildSignupFile(signup, "2026-08-17");

  assert.equal(canShareSignupFile(file, platformThat({ canShare: true })), true);
  // Every desktop browser, and iOS below 15 — a permanent case, not a temporary gap.
  assert.equal(canShareSignupFile(file, platformThat({ canShare: false })), false);
});

test("a client who changes their mind is not told the app failed", async () => {
  const abort = Object.assign(new Error("share cancelled"), { name: "AbortError" });
  const platform = platformThat({
    share: async () => {
      throw abort;
    },
  });

  const outcome = await shareSignupFile(buildSignupFile(signup, "2026-08-17"), { platform });

  assert.equal(outcome.delivered, false);
  assert.equal(outcome.cancelled, true, "a cancellation is a decision, not a failure");
  assert.equal(outcome.reason, undefined);
});

test("a share that genuinely failed is never reported as sent", async () => {
  const platform = platformThat({
    share: async () => {
      throw new Error("no handler for this type");
    },
  });

  const outcome = await shareSignupFile(buildSignupFile(signup, "2026-08-17"), { platform });

  assert.equal(outcome.delivered, false);
  assert.equal(outcome.cancelled, false);
  assert.match(outcome.reason, /no handler/);
});

test("saving works everywhere, which is what makes the form's advice honest", () => {
  const platform = platformThat({ canShare: false });
  const file = buildSignupFile(signup, "2026-08-17");

  const outcome = saveSignupFile(file, platform);

  assert.equal(outcome.delivered, true);
  assert.deepEqual(platform.saved, [file]);
});
