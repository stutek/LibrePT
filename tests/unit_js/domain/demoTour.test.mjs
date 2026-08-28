// tests/unit_js/domain/demoTour.test.mjs
// The scripted-demo step contract (TODO §23.5, src/domain/demoTour.js).
//
// What matters here is that a step can FAIL. The whole reason the demo is a script rather than a
// recording is that it breaks loudly when the app moves under it — so the rule that decides "did
// this step actually do what it claims" is the load-bearing part, and a permissive one would give
// back the silent staleness a video already had.

import assert from "node:assert/strict";
import { test } from "node:test";
import { checkExpectation, tourStepIds, validateTour } from "../../../src/domain/demoTour.js";

const VISIBLE = { present: true, visible: true, text: "Too Easy" };

test("a met expectation passes with nothing to report", () => {
  assert.deepEqual(checkExpectation({ selector: "#x", visible: true }, VISIBLE), {
    ok: true,
    reason: "",
  });
});

test("a control that never appeared fails, naming the selector", () => {
  const { ok, reason } = checkExpectation(
    { selector: "#missing", visible: true },
    { present: false, visible: false, text: "" },
  );
  assert.equal(ok, false);
  assert.match(reason, /#missing/, "a failure a maintainer cannot locate is barely a failure");
});

test("present but invisible is a failure, not a pass", () => {
  // The case that would quietly hollow the demo out: an element still in the DOM but hidden means
  // the tap did nothing a viewer can see.
  const { ok } = checkExpectation(
    { selector: "#x", visible: true },
    { present: true, visible: false, text: "" },
  );
  assert.equal(ok, false);
});

test("an expectation of absence is met by a hidden element", () => {
  const { ok } = checkExpectation(
    { selector: "#x", visible: false },
    { present: true, visible: false, text: "" },
  );
  assert.equal(ok, true);
});

test("text is matched case-insensitively and trimmed", () => {
  const probe = { present: true, visible: true, text: "  Group Strength  " };
  assert.equal(checkExpectation({ selector: "#x", containsText: "group" }, probe).ok, true);
});

test("wrong text fails and quotes what it actually read", () => {
  const probe = { present: true, visible: true, text: "Rest Timer" };
  const { ok, reason } = checkExpectation({ selector: "#x", containsText: "Group" }, probe);
  assert.equal(ok, false);
  assert.match(reason, /Rest Timer/);
});

test("a step with no expectation is rejected by validation", () => {
  // A step that cannot fail is a recording again — the exact thing this replaces.
  const problems = validateTour({ steps: [{ id: "a", target: ".x" }] });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /never fail/);
});

test("validation catches a missing target and a duplicate id", () => {
  const problems = validateTour({
    steps: [
      { id: "a", target: ".x", expect: { selector: "#y" } },
      { id: "a", expect: { selector: "#z" } },
    ],
  });
  assert.equal(problems.length, 2, problems.join(" | "));
  assert.ok(problems.some((p) => /repeats the id/.test(p)));
  assert.ok(problems.some((p) => /no target/.test(p)));
});

test("an empty tour is rejected", () => {
  assert.deepEqual(validateTour({ steps: [] }), ["a tour needs at least one step"]);
  assert.equal(validateTour(undefined).length, 1);
});

test("the step ids are reported in order, so a short run is detectable", () => {
  // A player that stops halfway would otherwise pass by reporting only what it managed.
  const tour = {
    steps: [
      { id: "one", target: ".a", expect: { selector: "#a" } },
      { id: "two", target: ".b", expect: { selector: "#b" } },
    ],
  };
  assert.deepEqual(tourStepIds(tour), ["one", "two"]);
});

// ── What a step TYPED, as opposed to what it tapped (wanted 2026-08-22) ───────────────────────
// A demo that only taps cannot show the half of the app a trainer types into, and the first step
// that needed it — the note behind a client's twinge — could not be asserted at all: a field's value
// is not its text content, which is how a step once polled for something that could never come true.

test("a field is checked by what was typed into it, not by its text", () => {
  const typed = { present: true, visible: true, text: "", value: "left knee, last rep" };

  assert.equal(checkExpectation({ selector: "#note", hasValue: "left knee" }, typed).ok, true);
});

test("an empty field fails the step that was supposed to fill it", () => {
  const empty = { present: true, visible: true, text: "", value: "" };

  const outcome = checkExpectation({ selector: "#note", hasValue: "left knee" }, empty);
  assert.equal(outcome.ok, false);
  assert.match(outcome.reason, /#note/);
});
