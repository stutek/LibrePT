// tests/unit_js/domain/quickSignals.test.mjs
// The one rule these functions exist to protect: a one-tap signal is disposable, but a signal the
// trainer WROTE is not. Toggling Too Easy off, or swapping it for Too Hard, must never delete an
// entry carrying a typed note or a voice memo — that content cannot be reconstructed, and the
// trainer did not aim the toggle at it.
//
// This was reachable only through a mounted clipboard until TODO §24.4 made the rules pure.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildQuickSignalEntries,
  hasExerciseNote,
  hasQuickSignal,
  isPlainQuickSignal,
  oppositeQuickSignal,
  plainQuickSignalIds,
  quickSignalColor,
} from "../../../src/domain/quickSignals.js";

const TOO_EASY = "Too Easy - Increase Load";
const TOO_HARD = "Too Hard - Reduce Load";

const entry = (over = {}) => ({
  id: "f1",
  clientId: "c1",
  exerciseName: "Bench Press",
  tag: TOO_EASY,
  note: "",
  hasVoiceNote: false,
  ...over,
});

test("only an untouched quick tap counts as plain", () => {
  assert.equal(isPlainQuickSignal(entry()), true);
  assert.equal(isPlainQuickSignal(entry({ note: "shoulder twinged" })), false);
  assert.equal(isPlainQuickSignal(entry({ hasVoiceNote: true })), false);
  // Whitespace is not a note — a stray space must not make an entry undeletable.
  assert.equal(isPlainQuickSignal(entry({ note: "   " })), true);
});

test("the toggle's on-state ignores annotated entries with the same tag", () => {
  const annotatedOnly = [entry({ note: "felt heavy" })];
  assert.equal(hasQuickSignal(annotatedOnly, "c1", "Bench Press", TOO_EASY), false);
  assert.equal(hasQuickSignal([entry()], "c1", "Bench Press", TOO_EASY), true);
  // Same tag, different exercise or client, is a different signal.
  assert.equal(hasQuickSignal([entry()], "c2", "Bench Press", TOO_EASY), false);
  assert.equal(hasQuickSignal([entry()], "c1", "Back Squat", TOO_EASY), false);
  assert.equal(hasQuickSignal(undefined, "c1", "Bench Press", TOO_EASY), false);
});

test("removal collects plain entries only, never what the trainer wrote", () => {
  const feedback = [
    entry({ id: "plain-1" }),
    entry({ id: "written", note: "left knee" }),
    entry({ id: "voiced", hasVoiceNote: true }),
    entry({ id: "plain-2" }),
    entry({ id: "other-tag", tag: TOO_HARD }),
  ];
  const ids = plainQuickSignalIds(feedback, "c1", "Bench Press", TOO_EASY);
  assert.deepEqual([...ids].sort(), ["plain-1", "plain-2"]);
});

test("Too Easy and Too Hard supersede each other, and nothing else does", () => {
  assert.equal(oppositeQuickSignal(TOO_EASY), TOO_HARD);
  assert.equal(oppositeQuickSignal(TOO_HARD), TOO_EASY);
  assert.equal(oppositeQuickSignal("Good Form"), null);
});

// The two records share an id on purpose: one lives on the session, one in state.planUpdates, and
// they have to be removable together. Two ids would strand a phantom in the reporting list.
test("one tap builds a session entry and a plan update sharing an id", () => {
  const { planUpdate, sessionFeedback } = buildQuickSignalEntries({
    clientId: "c1",
    clientName: "Ana",
    exerciseName: "Bench Press",
    tag: TOO_HARD,
  });

  assert.equal(planUpdate.id, sessionFeedback.id);
  assert.equal(planUpdate.clientName, "Ana");
  assert.equal(planUpdate.resolved, false);
  assert.equal(sessionFeedback.note, "");
  assert.equal(sessionFeedback.hasVoiceNote, false);
  // The reporting twin is the one that carries a timestamp; the session copy stays lean.
  assert.equal(typeof planUpdate.date, "string");
  assert.equal("date" in sessionFeedback, false);
});

// Severity, not recency: an entry the trainer wrote outranks any bare tap, because it is the one
// carrying detail a colour cannot express.
test("signal colour ranks written feedback above either quick tap", () => {
  assert.equal(quickSignalColor([], "c1", "Bench Press"), null);
  assert.equal(quickSignalColor([entry({ tag: TOO_EASY })], "c1", "Bench Press"), "var(--success)");
  assert.equal(quickSignalColor([entry({ tag: TOO_HARD })], "c1", "Bench Press"), "#f59e0b");

  const mixed = [entry({ tag: TOO_EASY }), entry({ id: "w", note: "sharp pain" })];
  assert.equal(quickSignalColor(mixed, "c1", "Bench Press"), "var(--danger)");

  const voiced = [entry({ tag: TOO_HARD }), entry({ id: "v", hasVoiceNote: true })];
  assert.equal(quickSignalColor(voiced, "c1", "Bench Press"), "var(--danger)");
});

// TODO §7.2: the note mark is a THIRD state, independent of the two signals.
test("an exercise the trainer wrote a note on is marked as having one", () => {
  const feedback = [
    {
      id: "1",
      clientId: "c1",
      exerciseName: "Squat",
      tag: "Too Hard - Reduce Load",
      note: "knee twinge",
      hasVoiceNote: false,
    },
  ];
  assert.equal(hasExerciseNote(feedback, "c1", "Squat"), true);
});

test("a voice memo counts as a note even with nothing typed", () => {
  const feedback = [
    { id: "1", clientId: "c1", exerciseName: "Squat", tag: "", note: "", hasVoiceNote: true },
  ];
  assert.equal(hasExerciseNote(feedback, "c1", "Squat"), true);
});

test("a bare quick tap is not a note", () => {
  // The distinction the mark exists to draw: a tap is disposable, something written is not.
  const feedback = [
    {
      id: "1",
      clientId: "c1",
      exerciseName: "Squat",
      tag: "Too Easy - Increase Load",
      note: "",
      hasVoiceNote: false,
    },
  ];
  assert.equal(hasExerciseNote(feedback, "c1", "Squat"), false);
});

test("whitespace is not a note", () => {
  const feedback = [
    { id: "1", clientId: "c1", exerciseName: "Squat", tag: "", note: "   ", hasVoiceNote: false },
  ];
  assert.equal(hasExerciseNote(feedback, "c1", "Squat"), false);
});

test("a note on one exercise does not mark another, or another client's", () => {
  const feedback = [
    {
      id: "1",
      clientId: "c1",
      exerciseName: "Squat",
      tag: "",
      note: "knee twinge",
      hasVoiceNote: false,
    },
  ];
  assert.equal(hasExerciseNote(feedback, "c1", "Bench"), false);
  assert.equal(hasExerciseNote(feedback, "c2", "Squat"), false);
  assert.equal(hasExerciseNote([], "c1", "Squat"), false);
  assert.equal(hasExerciseNote(undefined, "c1", "Squat"), false);
});
