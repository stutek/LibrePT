// tests/unit_js/data/crashReport.test.mjs
// What a crash report contains, and what it must never contain (src/data/crashReport.js) — TODO §12.4.
//
// The whole design is decided by one fact: **the issue tracker is public**. A stack is safe; the state
// around it is not — a client's name, their notes, their injuries (§17.3). So the payload is
// non-identifying BY CONSTRUCTION rather than by a redaction pass that has to be kept correct: it is
// built from a fixed list of safe fields, and anything else a caller hands over is dropped.
//
// The second fact: there is no server. Nothing is ever sent — a report is offered, and the trainer
// submits it themselves after reading it on GitHub.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_KEPT_CRASHES,
  buildCrashReport,
  crashIssueUrl,
  recordCrash,
} from "../../../src/data/crashReport.js";

const AT = "2026-08-18T06:30:00.000Z";

const anError = () => {
  const error = new Error("Cannot read properties of undefined (reading 'reps')");
  error.stack = "Error: boom\n    at exerciseCard.js:42\n    at deck.js:7";
  return error;
};

test("a report carries what a maintainer needs to find the bug", () => {
  const report = buildCrashReport(anError(), {
    route: "/session/s1/client/c1",
    buildSha: "abc1234",
    at: AT,
  });

  assert.match(report.message, /reading 'reps'/);
  assert.match(report.stack, /exerciseCard\.js:42/);
  assert.equal(report.route, "/session/s1/client/c1");
  assert.equal(report.build, "abc1234");
  assert.equal(report.at, AT);
});

test("nothing but the declared fields survives, however the caller labels it", () => {
  // The redaction that cannot rot: a fixed field list, not a scrub of known-bad keys. A caller that
  // helpfully attaches "context" gets it dropped rather than published.
  const report = buildCrashReport(anError(), {
    route: "/clients/c1",
    buildSha: "abc1234",
    at: AT,
    clientName: "Jana Novak",
    state: { clients: [{ name: "Jana Novak", injury: "knee reconstruction" }] },
    notes: "post-surgery",
  });

  assert.deepEqual(Object.keys(report).sort(), ["at", "build", "message", "route", "stack"]);
  const serialised = JSON.stringify(report);
  for (const leak of ["Jana", "Novak", "knee", "post-surgery"]) {
    assert.equal(serialised.includes(leak), false, `${leak} must never reach a public issue`);
  }
});

test("a route carrying a record id keeps the id and nothing about the person", () => {
  // Routes are durable (UC5), so the failing URL is the best reproduction instruction there is — and
  // an opaque id discloses nothing on its own. This is why the route travels at all.
  const report = buildCrashReport(anError(), {
    route: "/clients/0192f3a4b5",
    buildSha: "x",
    at: AT,
  });

  assert.equal(report.route, "/clients/0192f3a4b5");
});

test("an enormous stack is truncated rather than carried whole", () => {
  const huge = new Error("boom");
  huge.stack = `Error: boom\n${"    at somewhere.js:1\n".repeat(500)}`;

  const report = buildCrashReport(huge, { route: "/", buildSha: "x", at: AT });

  assert.ok(report.stack.length < 4000, "a URL has a length limit and an issue body has a reader");
  assert.ok(
    report.stack.startsWith("Error: boom"),
    "the top of the stack is the part that matters",
  );
});

test("a thrown non-error still produces a report", () => {
  // `throw "string"` and rejected promises with no reason are both real, and a reporter that itself
  // fails on them is worse than the original bug.
  for (const thrown of ["just a string", null, undefined, { odd: true }]) {
    const report = buildCrashReport(thrown, { route: "/", buildSha: "x", at: AT });
    assert.ok(report.message.length > 0, `${String(thrown)} should still describe itself`);
  }
});

test("the log keeps only the most recent crashes", () => {
  // A crash log must never grow into the storage budget (§18.6).
  let log = [];
  for (let index = 0; index < MAX_KEPT_CRASHES + 5; index += 1) {
    log = recordCrash(log, buildCrashReport(new Error(`boom ${index}`), { at: AT, route: "/" }));
  }

  assert.equal(log.length, MAX_KEPT_CRASHES);
  assert.match(log[log.length - 1].message, /boom \d+$/);
  assert.match(log[0].message, /boom 5/, "the oldest are the ones dropped");
});

test("the same crash repeating does not fill the log with copies of itself", () => {
  // A render loop throwing every frame would otherwise evict every other report — including the one
  // that explains how it started.
  let log = [];
  for (let index = 0; index < 20; index += 1) {
    log = recordCrash(log, buildCrashReport(anError(), { at: AT, route: "/" }));
  }

  assert.equal(log.length, 1);
  assert.equal(log[0].count, 20, "and it says how often it happened");
});

test("the issue link is prefilled and points at a real tracker", () => {
  const report = buildCrashReport(anError(), { route: "/clients", buildSha: "abc1234", at: AT });

  const url = new URL(crashIssueUrl(report, "https://forge.example.test/acme/tracker"));

  assert.equal(url.origin + url.pathname, "https://forge.example.test/acme/tracker/issues/new");
  const body = url.searchParams.get("body");
  assert.match(url.searchParams.get("title"), /reading 'reps'/);
  assert.match(body, /abc1234/, "the build stamp nobody should have to retype");
  assert.match(body, /\/clients/);
  assert.match(body, /exerciseCard\.js:42/);
});

test("the link never invents a report for nothing", () => {
  assert.equal(crashIssueUrl(null, "https://forge.example.test/acme/tracker"), "");
  assert.equal(crashIssueUrl({ message: "x" }, ""), "");
});
