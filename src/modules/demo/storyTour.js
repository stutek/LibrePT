// src/modules/demo/storyTour.js — the long demo's script: a scenario in chapters (TODO §35).
//
// Single responsibility: the CONTENT of the story. The chapter rules are domain/demoStory.js, the
// pass-fail rule is domain/demoTour.js, the engine is demoTourPlayer.js and the words are drawn by
// storyNarration.js — this file is data, and adding a beat is a data change.
//
// **This is the other artifact, not a longer wedge** (§35). `gymFloorTour.js` is four taps that show
// a stranger a working clipboard in three seconds; the story follows three friends from a leaflet to
// their second session and shows what a wedge cannot — intake, consent, an injury caught mid-set,
// the feedback loop closing. Both exist and stay separate: a stranger gets the wedge, someone who
// already leaned in gets the story.
//
// **The floor chapter REUSES the wedge's steps rather than restating them.** Both make the same
// claim about the same controls, and two copies of a selector are two things that must be kept true
// of the app, one of which nobody is watching. Importing them means a change to the clipboard breaks
// both loudly, in company — the same reason the wedge was built on selectors the e2e suite already
// relies on.
//
// **Chapters are built in the order §35.3 sets out**: the floor first, because it is the chapter
// closest to what already runs. The events that need unbuilt product — the recurrence model, the
// net-vs-slot meter, shared binding across participants — are absent rather than mocked. A demo
// step that pretends is the failure mode a scripted demo exists to avoid.
//
// Injected dependencies: none — a plain data module.

import { GYM_FLOOR_TOUR } from "./gymFloorTour.js";

const wedge = Object.fromEntries(GYM_FLOOR_TOUR.steps.map((step) => [step.id, step]));

// Whose phone the viewer is looking at. One persona at a time was the ruling (§35.1) — no split
// screen — so this label is the only thing saying which side of a handover is on screen.
const TRAINER = "story_persona_trainer";

// What every narrated step expects: the card was on screen and could be dismissed. Present but not
// visible, which is what `hidden` leaves behind — a removed element would read as "nothing matched"
// and fail (domain/demoTour.js's checkExpectation).
const CARD_DISMISSED = { selector: "#story-card", visible: false };
const CARD_TARGET = "#story-card-continue";

function narration(id, kind, titleKey, bodyKey, extra = {}) {
  return {
    id,
    persona: TRAINER,
    narrate: { kind, titleKey, bodyKey },
    target: CARD_TARGET,
    expect: CARD_DISMISSED,
    ...extra,
  };
}

// Chapter C — on the floor. §35.3's build order starts here: it is the chapter that needs the least
// that does not exist, and the one whose beats the wedge already proves.
const FLOOR_CHAPTER = {
  id: "floor",
  titleKey: "story_chapter_floor",
  steps: [
    narration("floor-open", "chapter", "story_chapter_floor", "story_floor_open_body", {
      // The board, not wherever a refreshed link happened to point: the chapter opens by saying
      // what the viewer is about to watch, and it should say it over the screen it happens on.
      route: "/",
    }),
    { ...wedge["open-session"], persona: TRAINER },
    { ...wedge["focus-exercise"], persona: TRAINER },
    { ...wedge["signal-too-easy"], persona: TRAINER },
    { ...wedge["next-participant"], persona: TRAINER },
    narration("floor-close", "chapter", "story_chapter_floor", "story_floor_close_body"),
  ],
};

export const DEMO_STORY = {
  id: "story",
  chapters: [FLOOR_CHAPTER],
};
