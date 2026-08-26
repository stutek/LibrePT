// tests/unit_js/modules/intakeInvite.test.mjs
// The link a trainer sends someone so they can fill their own details in
// (src/modules/clients/intakeInvite.js) — TODO §26.3.
//
// The promise: a prospective client gets a link that opens the intake page in a language they read,
// on their own phone, and the trainer never types their details for them. Nothing here touches a
// DOM or a navigator — both are injected, which is also why this can be a unit test at all.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  intakeInviteMessage,
  intakeInviteUrl,
  sendIntakeInvite,
} from "../../../src/modules/clients/intakeInvite.js";

test("the link points at the intake page on the deployed site", () => {
  const url = intakeInviteUrl({ lang: "sl" });

  assert.match(url, /\/intake/);
  assert.match(url, /lang=sl/);
  assert.match(url, /^https:\/\//, "a link that leaves the app has to be absolute");
});

test("an unchosen language leaves the client's own phone to decide", () => {
  // intakeRoute.js already prefers the visitor's device language when the link does not name one,
  // which is a better guess than the trainer's own.
  assert.ok(!intakeInviteUrl({}).includes("lang="));
});

test("the message says what the link is for, because a bare URL is a phishing text", () => {
  const message = intakeInviteMessage({ url: "https://example.test/intake", t: (key) => key });

  assert.match(message, /https:\/\/example\.test\/intake/);
  assert.ok(message.length > "https://example.test/intake".length);
});

// Keys back as text, with the two the message is built from written the way the dictionary writes
// them — the placeholder is part of the contract between the copy and this module.
const say = (key) =>
  ({
    intake_invite_message: "{trainer} is inviting you to fill in your details:",
    intake_invite_message_unsigned: "You are invited to fill in your details:",
    intake_invite_privacy: "What happens to your data:",
  })[key] || key;

test("the trainer's name leads the message, because the reader has met them once", () => {
  // A bare URL in a text is indistinguishable from phishing; the name at the front is the one thing
  // the person receiving it can check against the person they just spoke to.
  const message = intakeInviteMessage({
    url: "https://example.test/intake",
    t: say,
    trainer: { name: "Ana Kos", phone: "+386 41 000 000" },
  });

  assert.ok(message.startsWith("Ana Kos is inviting you"), message);
  assert.ok(message.includes("— Ana Kos, +386 41 000 000"), "and signs it with a number to save");
});

test("an install that does not know the trainer says so rather than leaving a gap", () => {
  const message = intakeInviteMessage({ url: "https://example.test/intake", t: say });

  assert.ok(message.startsWith("You are invited"), message);
  assert.ok(!message.includes("{trainer}"), "an unfilled placeholder would ship as literal text");
  assert.ok(!message.includes("—"), "and no signature line with nothing after it");
});

test("the message carries the privacy notice, in the language the link opens", () => {
  // Asked for 2026-08-26. The notice comes with the invitation rather than waiting on the form the
  // person has already started filling in, and it is the SAME page the consent letter links to.
  const slovene = intakeInviteMessage({ url: "https://example.test/intake", t: say, lang: "sl" });
  const english = intakeInviteMessage({ url: "https://example.test/intake", t: say, lang: "en" });

  assert.match(slovene, /privacy-notice-sl\.html/);
  assert.match(english, /privacy-notice-en\.html/);
  assert.match(slovene, /^https:\/\//m, "a link that leaves the app has to be absolute");
});

test("sharing goes through the share sheet when the phone has one", async () => {
  const shared = [];
  const platform = { canShare: () => true, share: (data) => shared.push(data) };

  const outcome = await sendIntakeInvite({ platform, t: (key) => key, lang: "en" });

  assert.equal(outcome, "shared");
  assert.match(shared[0].text, /\/intake/);
});

test("a desktop without a share sheet copies instead of failing", async () => {
  const copied = [];
  const platform = { canShare: () => false, copy: (text) => copied.push(text) };

  const outcome = await sendIntakeInvite({ platform, t: (key) => key, lang: "en" });

  assert.equal(outcome, "copied");
  assert.match(copied[0], /\/intake/);
});

test("a share the trainer cancelled is not reported as sent", async () => {
  // Cancelling is a decision, not a failure — and telling them it went out when it did not is the
  // one outcome that costs a client (signupDelivery.js makes the same distinction).
  const platform = {
    canShare: () => true,
    share: () => Promise.reject(Object.assign(new Error("cancelled"), { name: "AbortError" })),
  };

  assert.equal(await sendIntakeInvite({ platform, t: (key) => key }), "cancelled");
});

test("a browser that refuses the clipboard leaves the link to be shown, not lost", async () => {
  // Chromium refuses it headlessly, and phones refuse it without a fresh gesture. The trainer
  // standing in front of a client must never be left with nothing at all.
  const platform = { canShare: () => false, copy: () => Promise.reject(new Error("denied")) };

  assert.equal(await sendIntakeInvite({ platform, t: (key) => key }), "unavailable");
});
