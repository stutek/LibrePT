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
// **The gym chapter REUSES the wedge's steps rather than restating them.** Both make the same
// claim about the same controls, and two copies of a selector are two things that must be kept true
// of the app, one of which nobody is watching. Importing them means a change to the clipboard breaks
// both loudly, in company — the same reason the wedge was built on selectors the e2e suite already
// relies on.
//
// **Chapters are built in the order §35.3 sets out**: the gym chapter first, because it is the chapter
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
  const { onward, ...step } = extra;
  return {
    id,
    persona: TRAINER,
    narrate: { kind, titleKey, bodyKey, onward },
    target: CARD_TARGET,
    expect: CARD_DISMISSED,
    ...step,
  };
}

// Chapter C — in the gym. §35.3's build order starts here: it is the chapter that needs the least
// that does not exist, and the one whose beats the wedge already proves.
const GYM_CHAPTER = {
  id: "gym",
  titleKey: "story_chapter_gym",
  steps: [
    narration("gym-open", "chapter", "story_chapter_gym", "story_gym_open_body", {
      // The board, not wherever a refreshed link happened to point: the chapter opens by saying
      // what the viewer is about to watch, and it should say it over the screen it happens on.
      route: "/",
    }),
    { ...wedge["open-session"], persona: TRAINER },
    { ...wedge["focus-exercise"], persona: TRAINER },
    { ...wedge["signal-too-easy"], persona: TRAINER },
    { ...wedge["next-participant"], persona: TRAINER },
    {
      // Back to the first friend, which is also the claim the wedge's own e2e test makes: their
      // Too Easy is still set. Per-participant state that quietly belongs to whoever is on screen
      // is the failure a viewer would never notice and a trainer would.
      id: "back-to-first",
      persona: TRAINER,
      target: "#active-session-client-tabs .client-tab-btn:nth-child(1)",
      caption: "story_step_back_to_first",
      expect: {
        selector: "#active-session-client-tabs .client-tab-btn:nth-child(1).active",
        visible: true,
      },
    },
    {
      // Switching participants re-renders the deck collapsed, so the card has to come back into
      // focus before its actions are reachable. Idempotent: if it is already in focus, the player
      // demonstrates the tap without repeating it.
      id: "refocus-circuit",
      persona: TRAINER,
      target: "#active-exercise-scroll-deck .exercise-deck-card.circuit-card",
      caption: "story_step_refocus",
      expect: { selector: "#btn-log-feedback", visible: true },
    },
    {
      // Event 14. What the beat is FOR is the pane four steps down, not the capture — so this is
      // deliberately short: the trainer is mid-circuit with one hand.
      id: "capture-open",
      persona: TRAINER,
      target: "#btn-log-feedback",
      caption: "story_step_capture_open",
      expect: { selector: "#dialog-feedback", visible: true },
    },
    {
      // The tag carries the meaning — the player taps, it never types, which is also how a trainer
      // uses this with a barbell in the other hand.
      id: "capture-tag",
      persona: TRAINER,
      target: '#form-feedback input[value="Joint Pain / Discomfort"]',
      caption: "story_step_capture_tag",
      // No `visible` flag: a checked radio is a fact about the form, and asking whether the input
      // is on screen would be asserting the chip's styling instead.
      expect: { selector: '#form-feedback input[value="Joint Pain / Discomfort"]:checked' },
    },
    {
      // §35.3c: this is the beat that makes the note outlive the session. Without it the twinge is
      // an alert that gets resolved away within the week.
      id: "capture-keep",
      persona: TRAINER,
      target: "#feedback-keep-on-record",
      caption: "story_step_capture_keep",
      expect: { selector: "#feedback-keep-on-record:checked" },
    },
    {
      id: "capture-submit",
      persona: TRAINER,
      target: "#form-feedback button[type=submit]",
      caption: "story_step_capture_submit",
      // Present but not visible: the dialog closes, and a removed element would read as "nothing
      // matched" (domain/demoTour.js).
      expect: { selector: "#dialog-feedback", visible: false },
    },
    {
      id: "open-session-menu",
      persona: TRAINER,
      target: "#btn-session-menu",
      caption: "story_step_session_menu",
      expect: { selector: "#session-menu:not(.hidden)", visible: true },
    },
    {
      // The payoff, and the expectation says so: opening the plan editor shows what the gym
      // already said about this person. Event 20 lives in chapter D over a longer arc; this is the
      // same claim inside one session, which is as far as the story can honestly go today.
      id: "plan-editor-shows-the-notes",
      persona: TRAINER,
      target: "#btn-edit-plan",
      caption: "story_step_plan_editor",
      expect: { selector: "#client-focus-gym", visible: true },
    },
    {
      // Event 15: the swap happens HERE, inside one participant's plan — the other two are
      // untouched because they have their own, which is the thing no other clipboard makes easy.
      id: "swap-open-catalog",
      persona: TRAINER,
      target: ".editor-row-catalog",
      caption: "story_step_swap_open",
      expect: { selector: "#dialog-catalog-picker", visible: true },
    },
    {
      // Chosen BY NAME, never by position: a seeded catalog's order is not a property the demo may
      // depend on, and the first attempt at the wedge broke on exactly that.
      id: "swap-pick-movement",
      persona: TRAINER,
      target: ".picker-item",
      // The picker opens filtered to the row's own category, so the replacement has to be one the
      // trainer would actually be offered — a lighter movement for the same muscle group, not a
      // catalogue-wide free choice the UI never shows.
      targetText: "Lat Pulldown",
      caption: "story_step_swap_pick",
      // The PLAN says it was swapped — the claim being made, rather than "a dialog closed". The
      // movement's name lives in an input's value, which is not text content and cannot be probed;
      // the editor's own Swapped badge is the visible fact.
      expect: { selector: ".editor-added-badge", visible: true, containsText: "Swapped" },
    },
    // The last beat of the story so far, so it is the one that hands the app over (§30.2): thank
    // you, and the two ways onward that already exist. Dismissing IS "play around" — the app is
    // left exactly where the story put it, not on a start screen.
    narration("gym-close", "chapter", "story_thanks_title", "story_gym_close_body", {
      onward: true,
    }),
  ],
};

export const DEMO_STORY = {
  id: "story",
  chapters: [GYM_CHAPTER],
};
