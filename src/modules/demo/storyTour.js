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
  const { onward, continueUrl, continueLabelKey, ...step } = extra;
  return {
    id,
    persona: TRAINER,
    narrate: { kind, titleKey, bodyKey, onward, continueUrl, continueLabelKey },
    target: CARD_TARGET,
    // The guide's panel says the SHORT thing (the chapter's name) while the card holds the prose:
    // two surfaces are on screen at once now that the story is driven rather than watched, and
    // repeating the paragraph in both is how a viewer learns to read neither.
    caption: titleKey,
    expect: CARD_DISMISSED,
    ...step,
  };
}

/** Folds a card into the step it introduces (asked for 2026-08-22: "for steps that have no Show me,
 * merge them with the next one").
 *
 * A card written as a step of its own is a step whose only action is tapping Continue — and asking
 * the guide to demonstrate THAT walks a pointer for three seconds to a button already under the
 * reader's thumb, which from the outside is a guide doing nothing. So the prose rides on the next
 * real beat: read it, then do the thing it is about, and the first tap takes the card away.
 *
 * Written as one rule here rather than by hand at each chapter, so the chapters stay readable as a
 * sequence — the card still appears in the list where it belongs in the story.
 *
 * Two cards in a row keep the FIRST: a chapter's closing note and the next chapter's opening note
 * say related things, and stacking both on one beat is two paragraphs nobody reads.
 *
 * A card with nowhere to ride — the last beat of a chapter — stays a step, with `showMe: false`:
 * there is genuinely nothing to demonstrate, so the guide hides the button instead of offering a
 * dead one. A card that hands the browser to another device keeps its own step for the same reason
 * its button is a link: going there IS the action.
 */
function foldCards(steps) {
  const folded = [];
  let pending = null;
  for (const step of steps) {
    const isCard = Boolean(step.narrate) && step.target === CARD_TARGET;
    const staysAStep = isCard && (step.narrate.continueUrl || step.narrate.onward);
    if (isCard && !staysAStep) {
      pending = pending || step;
      continue;
    }
    folded.push(pending && !isCard ? { ...step, narrate: pending.narrate } : step);
    if (isCard && pending) folded.splice(-1, 0, { ...pending, showMe: false });
    pending = null;
  }
  if (pending) folded.push({ ...pending, showMe: false });
  return folded;
}

// Chapter C — in the gym. §35.3's build order starts here: it is the chapter that needs the least
// that does not exist, and the one whose beats the wedge already proves.
const GYM_CHAPTER = {
  id: "gym",
  titleKey: "story_chapter_gym",
  steps: foldCards([
    narration("gym-open", "chapter", "story_chapter_gym", "story_gym_open_body", {
      // The board, not wherever a refreshed link happened to point: the chapter opens by saying
      // what the viewer is about to watch, and it should say it over the screen it happens on.
      route: "/",
    }),
    // The wedge's steps, with the story's own words over them. The selectors, preconditions and
    // expectations are REUSED — one claim about one control, kept true in one place — while the
    // caption changes, because the wedge explains a feature in three seconds and the story is
    // telling someone about an evening.
    { ...wedge["open-session"], persona: TRAINER, caption: "story_step_open_session" },
    { ...wedge["focus-exercise"], persona: TRAINER, caption: "story_step_focus_exercise" },
    { ...wedge["signal-too-easy"], persona: TRAINER, caption: "story_step_signal_too_easy" },
    { ...wedge["next-participant"], persona: TRAINER, caption: "story_step_next_participant" },
    {
      // The story stays with the SECOND participant from here on, and that is a data decision as
      // much as a narrative one: the seeded John Smith carries a 2024 knee reconstruction in his own
      // record, so the twinge two beats later is the app telling the truth about the person on
      // screen rather than a line invented for the demo.
      //
      // Switching participants re-renders the deck collapsed, so his card has to come into focus
      // before its actions are reachable. Idempotent: if it is already in focus, the guide points
      // rather than tapping again.
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
      // Typed, not tapped — the demo shows every action a trainer performs, and half of what this
      // app receives is entered rather than pressed (wanted 2026-08-22). What the client actually
      // said is the part no tag can carry.
      id: "capture-note",
      persona: TRAINER,
      target: "#feedback-custom-note",
      enter: "left knee, third round",
      caption: "story_step_capture_note",
      // `hasValue`, because a field HOLDS what was typed and SAYS nothing.
      expect: { selector: "#feedback-custom-note", hasValue: "left knee" },
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
    // Not the end any more — the evening chapter is — so this one just closes the session and hands
    // over to it. The way out (§30.2) belongs on the LAST card, or a viewer is offered the exit
    // twice and takes it before the story is done.
    narration("gym-close", "chapter", "story_chapter_gym", "story_gym_close_body"),
  ]),
};

// Whose phone the viewer is looking at once the story hands over (§35.1's one-persona-at-a-time
// ruling): the label is the only thing distinguishing the two sides, because the app looks the same
// on both.
const CLIENT = "story_persona_client";

// Chapter A — three friends arrive. The trainer's half ends by handing the browser to the page a
// client would really open: the client's screens are the REAL ones (§35.1), and `/intake` is a
// separate boot on purpose — a stranger's phone gets no database, no seed and no terms modal — so
// the story crosses to it by navigating, exactly as a person following a link would.
const ARRIVE_CHAPTER = {
  id: "arrive",
  titleKey: "story_chapter_arrive",
  steps: foldCards([
    narration("arrive-open", "chapter", "story_chapter_arrive", "story_arrive_open_body", {
      route: "/",
    }),
    {
      // The register lives behind the ☰ menu, so getting there is two taps and the story shows
      // both: a demo that arrives at a screen without showing the way to it teaches nothing.
      id: "arrive-menu",
      persona: TRAINER,
      route: "/",
      target: "#btn-app-menu",
      caption: "story_step_arrive_menu",
      expect: { selector: "#app-menu:not(.hidden)", visible: true },
    },
    {
      id: "arrive-clients",
      persona: TRAINER,
      route: "/clients",
      target: "#menu-clients-register",
      caption: "story_step_arrive_clients",
      expect: { selector: "#btn-invite-client", visible: true },
    },
    {
      // Nothing is created here, and that is the point: a person exists in the register only once
      // they have sent their own details and the trainer has accepted them (§26.5).
      id: "arrive-invite",
      persona: TRAINER,
      target: "#btn-invite-client",
      caption: "story_step_arrive_invite",
      // The link ends up ON SCREEN, whichever route the browser allowed — shared, copied, or left
      // to be copied by hand. That is the claim worth making, and it is the one a trainer sending
      // the same link to the second and third friend depends on.
      expect: { selector: "#intake-invite-link", visible: true },
    },
    // The handover keeps its own beat because GOING THERE is the action — and Show me is hidden on
    // it for the same reason it is hidden on any card: the two buttons are right there, and having
    // the guide press Continue for you would dismiss the handover without ever making it.
    narration("arrive-handover", "chapter", "story_handover_title", "story_handover_body", {
      continueUrl: "intake?demo=story&chapter=intake",
      continueLabelKey: "story_open_client_phone",
      showMe: false,
    }),
  ]),
};

// The client's own half, played on the client's own page. It is its own chapter because it runs in
// a different BOOT — nothing here has a database, a seed or a trainer's session behind it.
const INTAKE_CHAPTER = {
  id: "intake",
  titleKey: "story_chapter_intake",
  // Not part of the trainer's run: this one is played on the client's own page, reached by the
  // handover above (domain/demoStory.js decides what a surface means for a whole-story walk).
  surface: "client",
  steps: foldCards([
    narration("intake-open", "chapter", "story_chapter_intake", "story_intake_open_body"),
    {
      id: "intake-name",
      persona: CLIENT,
      target: "#intake-name",
      enter: "Ana Novak",
      caption: "story_step_intake_name",
      expect: { selector: "#intake-name", hasValue: "Ana" },
    },
    {
      id: "intake-email",
      persona: CLIENT,
      target: "#intake-email",
      enter: "ana.novak@example.com",
      caption: "story_step_intake_email",
      expect: { selector: "#intake-email", hasValue: "@" },
    },
    {
      // Offered, never demanded (§1.7's ruling) — the copy beside the field says where the answer
      // goes, and the demo fills it in because a client who trusts the trainer usually does.
      id: "intake-injury",
      persona: CLIENT,
      target: "#intake-injury",
      enter: "shoulder, two years ago",
      caption: "story_step_intake_injury",
      expect: { selector: "#intake-injury", hasValue: "shoulder" },
    },
    {
      id: "intake-consent",
      persona: CLIENT,
      target: "#intake-consent",
      caption: "story_step_intake_consent",
      expect: { selector: "#intake-consent:checked" },
    },
    narration("intake-close", "chapter", "story_chapter_intake", "story_intake_close_body"),
  ]),
};

// Chapter B — the programme. It comes AFTER the gym chapter in the story's order of build (§35.3),
// because it needed the two features the floor chapter did not: a plan that says whether it fits its
// slot, and one plan bound to several people.
const PROGRAMME_CHAPTER = {
  id: "programme",
  titleKey: "story_chapter_programme",
  steps: foldCards([
    narration("programme-open", "chapter", "story_chapter_programme", "story_programme_open_body", {
      route: "/",
    }),
    {
      ...wedge["open-session"],
      id: "programme-open-session",
      persona: TRAINER,
      caption: "story_step_programme_open_session",
    },
    {
      id: "programme-menu",
      persona: TRAINER,
      target: "#btn-session-menu",
      caption: "story_step_session_menu",
      expect: { selector: "#session-menu:not(.hidden)", visible: true },
    },
    {
      // The meter is the point of this chapter: 45 minutes of work inside a 60-minute slot is the
      // number a trainer is actually solving for, and it is on screen while they can still change
      // it.
      id: "programme-editor",
      persona: TRAINER,
      target: "#btn-edit-plan",
      caption: "story_step_programme_editor",
      expect: { selector: ".editor-plan-fit", visible: true },
    },
    {
      // Out of the editor first: the participant tabs are hidden while a plan is being edited (the
      // trainer is looking at one person's programme, not at the room), so the binding this chapter
      // is about could not be seen from in there.
      id: "programme-done",
      persona: TRAINER,
      target: "#btn-done-edit",
      caption: "story_step_programme_done",
      expect: { selector: "#active-exercise-scroll-deck .exercise-deck-card", visible: true },
    },
    {
      id: "programme-menu-again",
      persona: TRAINER,
      target: "#btn-session-menu",
      caption: "story_step_programme_menu_again",
      expect: { selector: "#session-menu:not(.hidden)", visible: true },
    },
    {
      // Event 12: the same plan for everyone in the room, logged once.
      id: "programme-bind",
      persona: TRAINER,
      target: "#btn-bind-participants",
      caption: "story_step_programme_bind",
      expect: { selector: ".client-tab-bound", visible: true },
    },
    narration(
      "programme-close",
      "chapter",
      "story_chapter_programme",
      "story_programme_close_body",
    ),
  ]),
};

// Chapter D — the evening after. The trainer is at home; this is where the notes taken on the floor
// turn into next week's plan, and where the theme beat finally earns its place (§35.2 event 19):
// an evening at home is genuinely what dark mode is for.
const EVENING_CHAPTER = {
  id: "evening",
  titleKey: "story_chapter_evening",
  steps: foldCards([
    narration("evening-open", "chapter", "story_chapter_evening", "story_evening_open_body", {
      route: "/",
    }),
    {
      id: "evening-menu",
      persona: TRAINER,
      target: "#btn-app-menu",
      caption: "story_step_evening_menu",
      expect: { selector: "#app-menu:not(.hidden)", visible: true },
    },
    {
      // PICKED from a list, not tapped — the control is a `<select>`, and the demo performs what a
      // trainer performs (wanted 2026-08-22).
      id: "evening-theme",
      persona: TRAINER,
      target: "#theme-switcher",
      choose: "midnight",
      caption: "story_step_evening_theme",
      expect: { selector: "html.midnight-theme", visible: true },
    },
    {
      // Event 21: the pre-agreed one-off move. The story's claim is what the form SAYS while it is
      // open — this evening only, the series untouched — so that is the expectation.
      id: "evening-move",
      persona: TRAINER,
      route: "/",
      targetWithin: ".session-card",
      targetText: "Tuesday & Thursday",
      target: ".btn-edit-session",
      caption: "story_step_evening_move",
      expect: { selector: "#setup-occurrence-scope", visible: true },
    },
    {
      id: "evening-move-time",
      persona: TRAINER,
      target: "#setup-start-time",
      enter: "20:00",
      caption: "story_step_evening_move_time",
      expect: { selector: "#setup-start-time", hasValue: "20:00" },
    },
    narration("evening-close", "chapter", "story_thanks_title", "story_gym_close_body", {
      onward: true,
    }),
  ]),
};

export const DEMO_STORY = {
  id: "story",
  // In the order the evening happens, not the order they were built: a viewer watching the whole
  // story should meet the programme before the session it produced.
  chapters: [ARRIVE_CHAPTER, INTAKE_CHAPTER, PROGRAMME_CHAPTER, GYM_CHAPTER, EVENING_CHAPTER],
};
