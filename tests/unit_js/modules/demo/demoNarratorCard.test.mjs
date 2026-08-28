// tests/unit_js/modules/demo/demoNarratorCard.test.mjs
// The kinds of card the demo narrates with (src/modules/demo/demoNarratorCard.js) — TODO §38.10.
//
// The cards were four different-looking boxes: a `kind` string interpolated into a class name, two
// stylesheet blocks, and a caption line the guide wrote by hand. Asked 2026-08-27 to make them one
// family. What these pin is the part that has to stay true whatever the cards look like: every kind
// the shipped script names is drawn by something, a kind nobody draws is nothing rather than an
// unstyled box, and each subclass declares only what makes it different.
//
// No DOM here — the classes are the decision, the mounting is the drawing, and mounting is pinned in
// tests/medium/test_demo_narrator_card.py.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ChapterNarratorCard,
  DemoNarratorCard,
  MessageNarratorCard,
  OffTrackNarratorCard,
  demoNarratorCardFor,
  demoNarratorCardKinds,
} from "../../../../src/modules/demo/demoNarratorCard.js";
import { DEMO_STORY } from "../../../../src/modules/demo/storyTour.js";

const t = (key) => `translated:${key}`;

test("every kind the shipped story names is drawn by a card", () => {
  // The registry lives here rather than in domain/, which the import layering forbids the script's
  // own validator from reaching — so this walk is what stops a typo'd kind reaching a viewer.
  const named = new Set(
    DEMO_STORY.chapters
      .flatMap((chapter) => chapter.steps)
      .map((step) => step.narrate?.kind)
      .filter(Boolean),
  );

  assert.ok(named.size > 0, "the story narrates nothing at all?");
  for (const kind of named) {
    assert.ok(
      demoNarratorCardFor(kind, t),
      `the story asks for a "${kind}" card and nothing draws one`,
    );
  }
});

test("a kind nobody draws is nothing, not an unstyled box", () => {
  assert.equal(demoNarratorCardFor("chaper", t), null);
  assert.equal(demoNarratorCardFor(undefined, t), null);
});

test("a card's look is derived from its kind, so the two cannot drift", () => {
  for (const kind of demoNarratorCardKinds()) {
    assert.equal(demoNarratorCardFor(kind, t).modifier, `demo-narrator-card--${kind}`);
  }
});

test("a card says what the script gave it", () => {
  const words = new ChapterNarratorCard(t).words({
    kickerKey: "k",
    titleKey: "story_chapter_gym",
    bodyKey: "story_gym_open_body",
  });

  assert.deepEqual(words, {
    kicker: "translated:k",
    title: "translated:story_chapter_gym",
    body: "translated:story_gym_open_body",
  });
});

test("a message is set as a quotation, because it is one", () => {
  // The words belong to somebody in another app — the trainer's invitation on the client's phone,
  // her file on his. The italics said that to a reader and nothing at all to a screen reader.
  assert.equal(new MessageNarratorCard(t).bodyTag, "blockquote");
  assert.equal(new ChapterNarratorCard(t).bodyTag, "p");
});

test("the guide's own card speaks for the guide, not for the story", () => {
  // The trainer has walked away from where the step happens, so the step's instruction names a
  // control that is not on screen. Repeating it would be a lie, which is why this kind takes its
  // words from the guide and refuses the script's.
  const words = new OffTrackNarratorCard(t).words({ titleKey: "story_chapter_gym" });

  assert.equal(words.title, "translated:walkthrough_off_track_title");
  assert.equal(words.body, "translated:walkthrough_off_track");
});

test("only a card the story ends on may offer the way out", () => {
  // Offering it earlier reads as the demo asking to be stopped (§30.2).
  assert.equal(new ChapterNarratorCard(t).offersWayOnward({ onward: true }), true);
  assert.equal(new ChapterNarratorCard(t).offersWayOnward({}), false);
  assert.equal(new OffTrackNarratorCard(t).offersWayOnward({ onward: true }), false);
});

test("every kind is a DemoNarratorCard, so the surface has one thing to draw", () => {
  for (const kind of demoNarratorCardKinds()) {
    assert.ok(demoNarratorCardFor(kind, t) instanceof DemoNarratorCard);
  }
});
