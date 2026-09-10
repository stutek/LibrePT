// src/modules/demo/storyTour.js — the long demo's script: a scenario in chapters (TODO §35).
//
// Single responsibility: the CONTENT of the story. The chapter rules are domain/demoStory.js, the
// pass-fail rule is domain/demoTour.js, the engine is demoTourPlayer.js and the words are drawn by
// demoNarratorCard.js — this file is data, and adding a step is a data change.
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
import {
  STORY_SIGNUP_FILENAME,
  STORY_SIGNUP_NAME,
  storySignupFileText,
} from "./storySignupFile.js";

const wedge = Object.fromEntries(GYM_FLOOR_TOUR.steps.map((step) => [step.id, step]));

// Whose phone the viewer is looking at. One persona at a time was the ruling (§35.1) — no split
// screen — so this label is the only thing saying which side of a handover is on screen.
const TRAINER = "story_persona_trainer";

// A step that is only a card has nothing to do but be read, so what it expects is that the card is
// THERE: a missing translation or a card that never rendered still fails it, which is the whole
// point of an expectation. It is not "the card was dismissed" any more — the card used to carry its
// own Continue button, and a second way onward sitting beside a greyed-out Next is what made step 4
// look broken (reported 2026-08-23). Next moves the guide, everywhere, including here.
const CARD_ON_SCREEN = { selector: "#demo-narrator-card", visible: true };
const CARD_TARGET = "#demo-narrator-card";

function narration(id, kind, titleKey, bodyKey, extra = {}) {
  // `attachment` belongs to the CARD, not to the step: it is something the card draws, and the card
  // is handed its narration and nothing else. Left on the step it was simply never seen — the
  // screenshot rendered without the file under the message (found the first time §38.22's step was
  // driven in a browser).
  const { onward, attachment, ...step } = extra;
  return {
    id,
    persona: TRAINER,
    narrate: { kind, titleKey, bodyKey, onward, attachment },
    target: CARD_TARGET,
    // The story and the guide are ONE card now (reported 2026-08-23), so the caption is the line
    // under the prose that says what to DO — never the title again, which is already the first
    // thing in the same box. The handover and the thank-you say something more specific and pass
    // their own caption in.
    caption: "story_step_read_on",
    expect: CARD_ON_SCREEN,
    ...step,
  };
}

/** Folds a card into the step it introduces (asked for 2026-08-22: "for steps that have no Show me,
 * merge them with the next one").
 *
 * A card written as a step of its own is a step whose only action is tapping Continue — and asking
 * the guide to demonstrate THAT walks a pointer for three seconds to a button already under the
 * reader's thumb, which from the outside is a guide doing nothing. So the prose rides on the next
 * real step: read it, then do the thing it is about, and the first tap takes the card away.
 *
 * Written as one rule here rather than by hand at each chapter, so the chapters stay readable as a
 * sequence — the card still appears in the list where it belongs in the story.
 *
 * Two cards in a row keep the FIRST: a chapter's closing note and the next chapter's opening note
 * say related things, and stacking both on one step is two paragraphs nobody reads.
 *
 * A card with nowhere to ride — the last step of a chapter — stays a step, with `showMe: false`:
 * there is genuinely nothing to demonstrate, so the guide hides the button instead of offering a
 * dead one. A card that hands the browser to another device keeps its own step for the same reason
 * its button is a link: going there IS the action.
 */
/** One step with a card's words on it — and with what the card said about WHERE it happens.
 *
 * The route rides along. A chapter's opening card is where the story names the screen its chapter
 * happens on, and until 2026-08-29 the fold copied `narrate` and dropped everything else, so the
 * evening chapter began wherever the gym chapter had left the app — deep inside the plan editor.
 * Two steps later the guide greyed out every button for five seconds and then complained that the
 * trainer was on the wrong screen, while standing on the right one (TODO §38.13).
 *
 * Only when the step does not name a route of its own: the step is the more specific of the two, and
 * a card must never move a step off its own screen.
 */
function cardRidingOn(card, step) {
  const merged = { ...step, narrate: card.narrate };
  if (card.route && !step.route) merged.route = card.route;
  return merged;
}

function foldCards(steps) {
  const folded = [];
  let pending = null;
  for (const step of steps) {
    const isCard = Boolean(step.narrate) && step.target === CARD_TARGET;
    // A card that leaves this page keeps its own step for the same reason the last one does: going
    // there IS the action, and it is the guide's Next that makes it. So does a card the viewer is
    // meant to LOOK at rather than read past — the message arriving on a phone, the file landing on
    // the trainer's — because folding it onto the next step hides it behind that step's own words.
    const staysAStep = isCard && (step.advanceTo || step.narrate.onward || step.keepOwnStep);
    if (isCard && !staysAStep) {
      pending = pending || step;
      continue;
    }
    folded.push(pending && !isCard ? cardRidingOn(pending, step) : step);
    if (isCard && pending) folded.splice(-1, 0, { ...pending, showMe: false });
    pending = null;
  }
  if (pending) folded.push({ ...pending, showMe: false });
  return folded;
}

// Chapter C — in the gym. §35.3's build order starts here: it is the chapter that needs the least
// that does not exist, and the one whose steps the wedge already proves.
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
      // record, so the twinge two steps later is the app telling the truth about the person on
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
      // Event 14. What the step is FOR is the pane four steps down, not the capture — so this is
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
      enterKey: "story_typed_note",
      caption: "story_step_capture_note",
      // `hasValue`, because a field HOLDS what was typed and SAYS nothing.
      expect: { selector: "#feedback-custom-note", hasValueKey: "story_typed_note" },
    },
    {
      // §35.3c: this is the step that makes the note outlive the session. Without it the twinge is
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
      // The badge the editor puts on a swapped movement, asked for by WHAT IT IS rather than by what
      // it says: its word is translated, and reading that word back was one of the four expectations
      // that made the story impossible to finish in Slovenian (TODO §38.19).
      expect: { selector: ".editor-added-badge[data-callout='swap']", visible: true },
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
    // The story's front door (TODO §38.21): what the app is, what this run is a story OF, and that
    // it all happens in the sandbox — which is why it no longer has to offer to delete the demo data
    // afterwards (TODO §40).
    //
    // It keeps its OWN step, and that is not a flag to work around the fold — its instruction is
    // "press Next", so there is no tap for it to ride on. It also has to: `foldCards` keeps the
    // FIRST of two cards in a row, so a welcome card folded here would silently swallow the chapter
    // card below it, with nothing failing — a dropped card carries no expectation that can.
    narration("welcome", "chapter", "story_welcome_title", "story_welcome_body", {
      route: "/",
      keepOwnStep: true,
      caption: "story_step_welcome",
      showMe: false,
    }),
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
      // Declared, because this control lives INSIDE the menu the previous step opened — and the
      // step's own success closes it again. Without saying so, a second Show me looked for a row
      // that was no longer on screen and told the trainer the step had failed (reported
      // 2026-08-23). With it, the guide re-opens the menu first, the way it does for any step whose
      // ground has drifted.
      requires: [{ selector: "#app-menu:not(.hidden)", visible: true }],
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
      expect: { selector: "#dialog-intake-invite", visible: true },
    },
    {
      // Typed, not tapped, and typed into the ONE field that takes either kind of contact: this is
      // the step that answers "how does it actually reach her?", which a demo that only opened a
      // share sheet never showed (asked 2026-08-23).
      id: "arrive-contact",
      persona: TRAINER,
      target: "#intake-invite-contact",
      enter: "+386 41 234 567",
      caption: "story_step_arrive_contact",
      expect: { selector: "#intake-invite-send[data-channel='sms']", visible: true },
    },
    {
      // The SECOND friend, and the other channel. The same one box, retyped: what the trainer does
      // when the next person is standing there, and the step that shows the app reading an address
      // where it read a number a moment ago (asked for 2026-08-23 — both channels, on screen).
      id: "arrive-contact-email",
      persona: TRAINER,
      target: "#intake-invite-contact",
      enter: "maja.kos@example.com",
      caption: "story_step_arrive_contact_email",
      expect: { selector: "#intake-invite-send[data-channel='email']", visible: true },
    },
    {
      id: "arrive-close-invite",
      persona: TRAINER,
      target: "#dialog-intake-invite .modal-close-btn",
      caption: "story_step_arrive_close_invite",
      // The DIALOG being gone, like the note step above — not the register button behind it. That
      // button is painted the whole time the modal is open, so the weaker claim was satisfied
      // before the step happened: the guide lit Next, the viewer walked on, and the invite modal
      // stayed open over every step that followed with the whole app inert behind it (reported
      // 2026-08-25). Present but not visible, because a closed dialog stays in the DOM.
      expect: { selector: "#dialog-intake-invite", visible: false },
    },
    {
      // The THIRD friend, by hand — because the link is not the only way in, and a trainer who has
      // someone's details already should not have to send them a form to type them back.
      id: "arrive-add-manually",
      persona: TRAINER,
      target: "#btn-add-client",
      caption: "story_step_arrive_add_manually",
      expect: { selector: "#dialog-client", visible: true },
    },
    {
      id: "arrive-type-name",
      persona: TRAINER,
      target: "#client-name",
      enter: "Nik Zupan",
      caption: "story_step_arrive_type_name",
      expect: { selector: "#client-name", hasValue: "Nik" },
    },
    {
      id: "arrive-save-client",
      persona: TRAINER,
      target: "#form-client button[type=submit]",
      caption: "story_step_arrive_save_client",
      // The register itself is the claim: he is in it, from two words typed at a desk.
      expect: { selector: "#clients-list", visible: true, containsText: "Nik Zupan" },
    },
    // The handover keeps its own step because GOING THERE is the action — and Show me is hidden on
    // it for the same reason it is hidden on any card: the two buttons are right there, and having
    // the guide press Continue for you would dismiss the handover without ever making it.
    narration("arrive-handover", "chapter", "story_handover_title", "story_handover_body", {
      // A DIFFERENT theme on the other side (asked for 2026-08-23: the two phones should not look
      // alike). The intake page reads `?theme=` before it paints and writes nothing, so the client's
      // phone is unmistakably not the trainer's and the trainer's own choice is left alone.
      //
      // The way on IS this journey, so it is the guide's own Next that makes it, wearing the words
      // for what it does. A second button beside a Next that quietly skipped the whole chapter was
      // the thing reported.
      advanceTo: "intake?demo=story&chapter=intake&theme=midnight",
      nextLabelKey: "story_open_client_phone",
      caption: "story_step_handover",
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
    // What Ana actually receives, drawn as the message it is — the trainer's text with the link in
    // it. The paper track's rule holds (§35.1): a step that happens OUTSIDE this app is narrated on
    // a card that could never be mistaken for one of its screens. A message is not our surface at
    // all, so nobody goes looking for it in the app; what matters is that the viewer sees the thing
    // Ana taps, rather than being teleported onto a form (asked for 2026-08-23).
    narration("intake-message", "message", "story_message_title", "story_message_body", {
      persona: CLIENT,
      keepOwnStep: true,
      caption: "story_step_message",
      showMe: false,
    }),
    narration("intake-open", "chapter", "story_chapter_intake", "story_intake_open_body", {
      persona: CLIENT,
    }),
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
      enterKey: "story_typed_injury",
      caption: "story_step_intake_injury",
      expect: { selector: "#intake-injury", hasValueKey: "story_typed_injury" },
    },
    {
      id: "intake-consent",
      persona: CLIENT,
      target: "#intake-consent",
      caption: "story_step_intake_consent",
      expect: { selector: "#intake-consent:checked" },
    },
    {
      // The send itself — the step the chapter was missing. The button is the real one and the file
      // it builds is the real file; only the last inch is mocked, because a demo may not drop a
      // `.librept-signup` into the Downloads folder of everyone who watches
      // (modules/intake/signupDelivery.js).
      id: "intake-send",
      persona: CLIENT,
      target: "#intake-send",
      caption: "story_step_intake_send",
      expect: { selector: "#intake-status.is-done", visible: true },
    },
    // Where that file went, on the other phone. Narrated rather than drawn for the same reason as
    // the message above: this happens in the trainer's messaging app, not in ours.
    narration("intake-arrived", "message", "story_arrived_title", "story_arrived_body", {
      persona: CLIENT,
      keepOwnStep: true,
      caption: "story_step_arrived",
      showMe: false,
    }),
    // ...and back to the trainer's own phone, by the step id rather than the chapter: the trainer's
    // run is one numbered sequence, and returning to "chapter 3, step 1" would restart the count in
    // the middle of a story the viewer is four steps into. Resuming by step is what the address
    // already does after a reload.
    narration("intake-close", "chapter", "story_chapter_intake", "story_intake_close_body", {
      persona: CLIENT,
      advanceTo: "clients?demo=story&step=review-message",
      nextLabelKey: "story_back_to_your_phone",
      caption: "story_step_back_to_your_phone",
      showMe: false,
    }),
  ]),
};

// The step the story used to skip: what the trainer does with what Ana sent. It belongs to the
// trainer's run, right after the hand back, because that is when it happens — her file is in his
// messages before he ever opens the app again.
const REVIEW_STEPS = [
  // Her file, where it actually is: in the trainer's messaging app, as an attachment under her
  // message. Drawn as a screenshot with the attachment as a real button (§38.22, asked for as
  // "zunanjo aplikacijo simuliraj z zaslonsko sliko in kartico razlage"), and tapping it does what
  // tapping it on a phone does — LibrePT opens with the submission in the review dialog.
  //
  // It replaces three steps: open the ☰ menu, choose "Review a client's file", find the file in the
  // picker. That route still exists and still works — it is the only one iOS has — but it is no
  // longer what the story shows, because it is no longer what a trainer on Android does.
  narration("review-message", "screenshot", "story_review_sender", "intake_share_text", {
    persona: TRAINER,
    keepOwnStep: true,
    // On the register, because that is where the result has to be VISIBLE: accepting re-renders the
    // client list, and a step that claimed "she is in your register" while the register was behind
    // the dashboard would be asserting something the viewer cannot see.
    route: "/clients",
    target: "#demo-narrator-attachment",
    attachment: {
      name: STORY_SIGNUP_FILENAME,
      text: storySignupFileText(new Date().toISOString().slice(0, 10)),
    },
    caption: "story_step_review_attach",
    expect: { selector: "#dialog-signup-review", containsText: STORY_SIGNUP_NAME },
  }),
  {
    id: "review-accept",
    persona: TRAINER,
    target: "#signup-review-save",
    caption: "story_step_review_accept",
    // The register is the claim: she is in it, and the trainer typed none of it.
    expect: { selector: "#clients-list", visible: true, containsText: STORY_SIGNUP_NAME },
  },
];

// Chapter B — the programme. It comes AFTER the gym chapter in the story's order of build (§35.3),
// because it needed the two features the floor chapter did not: a plan that says whether it fits its
// slot, and one plan bound to several people.
const PROGRAMME_CHAPTER = {
  id: "programme",
  titleKey: "story_chapter_programme",
  steps: foldCards([
    ...REVIEW_STEPS,
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
      // The chapter BUILDS something (asked 2026-08-31: "demonstrate actually adding one circuit
      // please, before just saying done"). Until now it opened the editor and pressed Done, so a
      // chapter called The programme never wrote a programme — the one thing a trainer opens this
      // screen to do went undemonstrated.
      //
      // The LAST insert bar, so the block lands at the end of the plan where a finisher belongs,
      // and the expectation is a circuit with no title yet: the seeded plan's five circuits are all
      // named ("Dynamic Warmup" and its siblings), so an untitled one is proof that this tap made
      // it, rather than a selector that was already satisfied before the step ran.
      id: "programme-add-circuit",
      persona: TRAINER,
      target: ".editor-list > .editor-insert:last-child .ins-circuit",
      caption: "story_step_programme_add_circuit",
      expect: { selector: ".editor-circuit .editor-circuit-title[value='']", visible: true },
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
// turn into next week's plan, and where the theme step finally earns its place (§35.2 event 19):
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
      caption: "story_step_thanks",
    }),
  ]),
};

export const DEMO_STORY = {
  id: "story",
  // In the order the evening happens, not the order they were built: a viewer watching the whole
  // story should meet the programme before the session it produced.
  chapters: [ARRIVE_CHAPTER, INTAKE_CHAPTER, PROGRAMME_CHAPTER, GYM_CHAPTER, EVENING_CHAPTER],
};
