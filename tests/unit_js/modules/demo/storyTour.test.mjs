// tests/unit_js/modules/demo/storyTour.test.mjs
// The long demo's script as DATA (src/modules/demo/storyTour.js) — TODO §35, §38.13.
//
// The script is content, and content is checked by reading it. What is checked here is the one thing
// reading cannot see: what the script becomes after its cards are FOLDED into the steps they
// introduce. A chapter's opening card is where the story says which screen the chapter happens on,
// and the fold used to copy the words and drop that, which is invisible in the source — the line is
// right there in the chapter, three lines above the step that needed it.

import assert from "node:assert/strict";
import { test } from "node:test";

import { storyStepsFor } from "../../../../src/domain/demoStory.js";
import { DEMO_STORY } from "../../../../src/modules/demo/storyTour.js";

test("the trainer-details chapter only shows the identity form", () => {
  const chapter = DEMO_STORY.chapters.find((item) => item.id === "trainer-details");

  assert.equal(DEMO_STORY.chapters[0], chapter, "details come before client-facing chapters");
  assert.equal(chapter.titleKey, "story_chapter_trainer_details");
  assert.equal(chapter.steps.length, 2, "the opening card rides on the menu tap");
  assert.ok(
    chapter.steps.every((step) => step.enter === undefined),
    "the demo saves no invented data",
  );
  assert.deepEqual(chapter.steps.at(-1).expect, {
    selector: "#dialog-trainer-details",
    visible: true,
  });
});

test("every chapter on the trainer's phone says which screen it starts on", () => {
  // Without it a chapter begins wherever the previous one left the app. The evening chapter did
  // exactly that (§38.13): the gym chapter ends inside the plan editor, so the evening opened there,
  // and by the third step the guide had greyed out every button for five seconds and then told the
  // trainer to go back to the sessions board — while the board was where it had just navigated.
  //
  // The client's chapter is exempt and cannot be otherwise: it is a different page on a different
  // device in the story, reached by handing the browser over, not by routing.
  for (const chapter of DEMO_STORY.chapters) {
    if ((chapter.surface || "trainer") === "client") continue;
    const [first] = chapter.steps;
    assert.ok(
      first?.route,
      `chapter ${chapter.id} starts on ${first?.id}, which names no route — so it opens on whatever screen the chapter before it left behind`,
    );
  }
});

test("a folded card hands its route to the step it rides on", () => {
  // The rule behind the check above, stated where it is decided. A card is merged into the next real
  // step so that nobody has to tap Continue on a paragraph; everything the card declared about WHERE
  // it happens has to survive that merge.
  const evening = DEMO_STORY.chapters.find((chapter) => chapter.id === "evening");
  const [opening] = evening.steps;

  assert.equal(opening.id, "evening-menu", "the opening card folded into the menu step");
  assert.ok(opening.narrate, "…carrying its words");
  assert.equal(opening.route, "/", "…and its route");
});

test("a step's own route wins over the card folded into it", () => {
  // The step is the more specific of the two: the card says where the chapter happens, the step says
  // where THIS tap happens, and a card must never move a step off its own screen.
  const programme = DEMO_STORY.chapters.find((chapter) => chapter.id === "programme");
  const [opening] = programme.steps;

  assert.equal(opening.route, "/clients", "the step's own route, not the card's");
});

test("the story is one unbroken sequence of steps once flattened", () => {
  // Nothing narrated is left as a card nobody can act on, and nothing lost its id in the fold.
  const steps = storyStepsFor(DEMO_STORY);
  assert.ok(steps.length > 30, `only ${steps.length} steps in the trainer's run`);
  assert.equal(new Set(steps.map((step) => step.id)).size, steps.length, "ids are unique");
  assert.ok(
    steps.every((step) => step.expect),
    "every step claims something about the app, narrated ones included",
  );
});
