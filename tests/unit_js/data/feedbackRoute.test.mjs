// tests/unit_js/data/feedbackRoute.test.mjs
// Where a trainer's feedback goes (src/data/feedbackRoute.js) — TODO §23.5.
//
// The promise: a personal trainer with no GitHub account can still reach someone, and what leaves
// their device is four lines they can read and delete before sending. Nothing here touches a DOM.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FEEDBACK_EMAIL,
  bugIssueUrl,
  diagnosticsBlock,
  feedbackMailto,
} from "../../../src/data/feedbackRoute.js";

const DIAGNOSTICS = diagnosticsBlock({
  build: "abc1234",
  route: "/sessions/2026-08-22",
  lang: "sl",
  screen: "390x844",
});

test("feedback reaches an address that needs no account", () => {
  const link = feedbackMailto({
    subject: "Idea",
    intro: "It would help if",
    diagnostics: DIAGNOSTICS,
  });

  assert.ok(link.startsWith(`mailto:${FEEDBACK_EMAIL}`), link);
  assert.match(link, /subject=Idea/);
});

test("the mail body is readable rather than full of plus signs", () => {
  // `mailto:` predates the +-for-space convention, and mail clients show them literally — a body
  // full of them reads as broken software before anyone has read a word of it.
  const link = feedbackMailto({ subject: "Two words", intro: "hello there", diagnostics: "" });

  assert.ok(!link.includes("+"), link);
});

test("what travels is four lines, and a person can read all of them", () => {
  assert.equal(DIAGNOSTICS.split("\n").length, 4);
  assert.match(DIAGNOSTICS, /abc1234/);
  assert.match(DIAGNOSTICS, /390x844/);
  // Nothing about a client, ever — a fixed list, not "everything we can find".
  assert.ok(!/client|name|email/i.test(DIAGNOSTICS));
});

test("a bug goes to an issue, and the issue asks for the screenshot in words", () => {
  const url = bugIssueUrl({
    repoUrl: "https://github.com/stutek/LibrePT",
    title: "Cards overlap",
    whatHappened: "",
    diagnostics: DIAGNOSTICS,
  });

  assert.match(url, /github\.com\/stutek\/LibrePT\/issues\/new/);
  assert.match(decodeURIComponent(url), /screenshot/i);
  assert.match(decodeURIComponent(url), /abc1234/);
});

test("nowhere to send it means no link, not a dead one", () => {
  assert.equal(bugIssueUrl({ repoUrl: "", title: "x", whatHappened: "", diagnostics: "" }), "");
});
