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
  storyChapterIndex,
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
        steps: [{ id: "card", narrate: { kind: "paper" }, target: "#demo-narrator-card" }],
      },
    ],
  };

  assert.match(validateStory(narrated).join(" "), /expectation/);
});

test("a story with no chapters says so rather than playing empty", () => {
  assert.match(validateStory({ id: "empty", chapters: [] }).join(" "), /chapter/);
});

test("a chapter played on the client's own page is not part of the trainer's walk", () => {
  // It lives in a different boot on a different device; flattening it into the trainer's run would
  // leave the guide pointing at a form that is not on screen (TODO §35.3e).
  const withClient = {
    id: "s",
    chapters: [
      ...STORY.chapters,
      {
        id: "intake",
        surface: "client",
        titleKey: "k",
        steps: [{ id: "i1", target: ".x", expect: { selector: ".x" } }],
      },
    ],
  };

  assert.ok(!storyStepsFor(withClient).some((step) => step.id === "i1"));
  // ...and naming it still plays it, which is exactly what the handover link does.
  assert.deepEqual(
    storyStepsFor(withClient, "intake").map((step) => step.id),
    ["i1"],
  );
});

// The story hands the browser over to the client's page mid-way and takes it back four steps later.
// Each side is a separate boot with its own step list, so each side used to count from one: the
// viewer watched "step 10 of 41" become "step 1 of 8" and then "step 11 of 41", as if they had
// started something else and come back. Reported 2026-08-27 (TODO §38.9). A step's number is now its
// place in the STORY, which is the one thing both boots can agree on without sharing any state.
const HANDOVER_STORY = {
  id: "handover",
  chapters: [
    {
      id: "arrive",
      titleKey: "k",
      steps: [
        { id: "a1", target: ".a", expect: { selector: ".a" } },
        { id: "a2", target: ".b", expect: { selector: ".b" } },
      ],
    },
    {
      id: "intake",
      surface: "client",
      titleKey: "k",
      steps: [{ id: "i1", target: ".c", expect: { selector: ".c" } }],
    },
    {
      id: "review",
      titleKey: "k",
      steps: [{ id: "r1", target: ".d", expect: { selector: ".d" } }],
    },
  ],
};

test("a step knows its place in the whole story, not in the run it happens to be in", () => {
  const trainer = storyStepsFor(HANDOVER_STORY);
  assert.deepEqual(
    trainer.map((step) => step.storyPosition.number),
    // Not 1, 2, 3: the client's step sits between a2 and r1 and keeps its place in the count.
    [1, 2, 4],
  );
  assert.ok(trainer.every((step) => step.storyPosition.count === 4));
});

test("the client's own page continues the story's count instead of restarting it", () => {
  const [clientStep] = storyStepsFor(HANDOVER_STORY, "intake", { surface: "client" });

  assert.equal(clientStep.storyPosition.number, 3);
  assert.equal(clientStep.storyPosition.count, 4);
});

test("a chapter opened straight from a link is numbered where it belongs", () => {
  // A link to one chapter is a person joining the story part-way, not starting a shorter one — the
  // count tells them how much of it they are seeing.
  const [step] = storyStepsFor(HANDOVER_STORY, "review");

  assert.equal(step.storyPosition.number, 4);
});

// The table of contents the splash and the sandbox card draw (asked for 2026-09-21). What it
// promises is that every entry is a place the viewer can actually be sent to, in the order the story
// plays them.
test("the index names every chapter of the trainer's own walk, in playing order", () => {
  assert.deepEqual(storyChapterIndex(HANDOVER_STORY), [
    { id: "arrive", titleKey: "k" },
    { id: "review", titleKey: "k" },
  ]);
});

test("a chapter played on the client's phone is not offered as a starting point", () => {
  // The story reaches it by handing the browser over. A link naming it from the trainer's app would
  // start a guide on a page that is not open, so the trainer's index must not list it.
  assert.ok(!storyChapterIndex(HANDOVER_STORY).some((chapter) => chapter.id === "intake"));
  // It is still a chapter, and the client's own boot is where it is offered.
  assert.deepEqual(storyChapterIndex(HANDOVER_STORY, { surface: "client" }), [
    { id: "intake", titleKey: "k" },
  ]);
});

test("the index carries keys, not words", () => {
  // The feed and the splash are redrawn on a language switch and translate as they draw. An index
  // holding the titles themselves would hold whichever language was current when it was built.
  for (const chapter of storyChapterIndex(STORY)) {
    assert.deepEqual(Object.keys(chapter).sort(), ["id", "titleKey"]);
  }
});

test("a story with no chapters yields no index rather than throwing", () => {
  assert.deepEqual(storyChapterIndex(undefined), []);
  assert.deepEqual(storyChapterIndex({ id: "x" }), []);
});

test("a chapter that needs the ones before it is not offered as a way in", () => {
  // Measured, not assumed (2026-09-21): the story's programme chapter opens on the trainer reading
  // what Ana sent, and her submission reaches the store from HER phone. Walked on its own from a
  // freshly seeded sandbox it stops with nothing to review. It still plays inside the whole story.
  const story = {
    id: "s",
    chapters: [
      ...STORY.chapters,
      {
        id: "programme",
        titleKey: "k",
        needsEarlierChapters: true,
        steps: [{ id: "p1", target: ".p", expect: { selector: ".p" } }],
      },
    ],
  };

  assert.ok(!storyChapterIndex(story).some((chapter) => chapter.id === "programme"));
  // Named by a link it still plays, and the whole story still contains it.
  assert.deepEqual(
    storyStepsFor(story, "programme").map((step) => step.id),
    ["p1"],
  );
  assert.ok(storyStepsFor(story).some((step) => step.id === "p1"));
});
