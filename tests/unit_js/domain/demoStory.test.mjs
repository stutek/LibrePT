// tests/unit_js/domain/demoStory.test.mjs
// The story's chapter cursor (src/domain/demoStory.js) — TODO §35.
//
// The story is the LONG demo: three friends from a leaflet to their second session, ~23 events. The
// promise these pin is why it is chaptered at all — nobody watches five unbroken minutes of software
// they do not use yet, so any one chapter must play alone, start where it can, and be selectable by
// name from a link. Nothing here touches a DOM; playing is modules/demo/demoTourPlayer.js.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chapterTitleKeys,
  storyChapterIds,
  storyStepsFor,
  validateStory,
} from "../../../src/domain/demoStory.js";

// A stand-in rather than the real script, for the reason walkthrough.test.mjs gives: a caption edit
// in the demo must not fail the cursor's tests.
const STORY = {
  id: "test-story",
  chapters: [
    {
      id: "arrive",
      titleKey: "story_chapter_arrive",
      steps: [
        { id: "a1", target: ".one", expect: { selector: ".one.done" } },
        { id: "a2", target: ".two", expect: { selector: ".two.done" } },
      ],
    },
    {
      id: "floor",
      titleKey: "story_chapter_floor",
      steps: [{ id: "f1", target: ".three", expect: { selector: ".three.done" } }],
    },
  ],
};

test("the whole story plays as one sequence, chapters in order", () => {
  assert.deepEqual(
    storyStepsFor(STORY).map((step) => step.id),
    ["a1", "a2", "f1"],
  );
});

test("one chapter can be played on its own, named by the link", () => {
  assert.deepEqual(
    storyStepsFor(STORY, "floor").map((step) => step.id),
    ["f1"],
  );
});

test("an unknown chapter plays the whole story rather than nothing", () => {
  // A mistyped or since-renamed ?chapter= is a link someone shared; showing them the story is a
  // better answer than a demo that silently does nothing.
  assert.deepEqual(
    storyStepsFor(STORY, "no-such-chapter").map((step) => step.id),
    ["a1", "a2", "f1"],
  );
});

test("the chapters are addressable and named", () => {
  assert.deepEqual(storyChapterIds(STORY), ["arrive", "floor"]);
  assert.deepEqual(chapterTitleKeys(STORY), ["story_chapter_arrive", "story_chapter_floor"]);
});

test("a step id repeated in another chapter is a defect, not two steps", () => {
  const clash = {
    id: "clash",
    chapters: [
      {
        id: "one",
        titleKey: "k",
        steps: [{ id: "same", target: ".a", expect: { selector: ".a" } }],
      },
      {
        id: "two",
        titleKey: "k",
        steps: [{ id: "same", target: ".b", expect: { selector: ".b" } }],
      },
    ],
  };

  assert.match(validateStory(clash).join(" "), /same/);
});

test("a chapter with no title cannot be offered by name", () => {
  const untitled = {
    id: "untitled",
    chapters: [{ id: "one", steps: [{ id: "s", target: ".a", expect: { selector: ".a" } }] }],
  };

  assert.match(validateStory(untitled).join(" "), /title/);
});

test("every step still needs an expectation, narrated ones included", () => {
  // TODO §35.1: a paper-action card is not exempt — its expectation is that the card was on screen
  // and could be dismissed. A step that claims something about the app while asserting nothing is
  // what makes a demo a recording again.
  const narrated = {
    id: "narrated",
    chapters: [
      {
        id: "one",
        titleKey: "k",
        steps: [{ id: "card", narrate: { kind: "paper" }, target: "#story-card-continue" }],
      },
    ],
  };

  assert.match(validateStory(narrated).join(" "), /expectation/);
});

test("a story with no chapters says so rather than playing empty", () => {
  assert.match(validateStory({ id: "empty", chapters: [] }).join(" "), /chapter/);
});
