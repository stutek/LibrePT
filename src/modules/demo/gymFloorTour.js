// src/modules/demo/gymFloorTour.js — the script: one real set, logged one-handed.
//
// Single responsibility: the CONTENT of the demo. The engine that runs it is demoTourPlayer.js and
// the pass-fail rule is domain/demoTour.js — this file is data, and adding a step is a data change.
//
// **Why this flow and not a feature tour.** The ruled positioning is: do not pitch "replace
// your PT software", pitch the clipboard — the one job trainers hate. So the script is the thing
// the app is actually for: open a session, put an exercise in focus, register that it was too easy,
// move to the next participant. Four taps, no typing, no menus. A tour of settings screens would
// show a more complete product and a less convincing one.
//
// **Every selector here is one the e2e suite already relies on** (tests/e2e/test_gym_floor_flow.py),
// deliberately: a demo built on selectors nothing else asserts is a demo that breaks alone and
// quietly. These break loudly, in company.
//
// **Each step's expectation is a behavioural claim**, not a restatement of the tap. "Tapping a
// session card opens a clipboard with participant tabs" is what a viewer is being shown and what
// the e2e run proves still happens.
//
// Injected dependencies: none — a plain data module.

import { DEMO_GROUP_SESSION_ID } from "../../data/sessions.js";

export const GYM_FLOOR_TOUR = {
  id: "gym-floor",
  steps: [
    {
      id: "open-session",
      // The seeded GROUP session, not the first card on the board. The first attempt used
      // position and landed on a one-client session, so step 4 had no second participant to switch
      // to — a demo must not depend on the order a seeded list happens to render in.
      // By its id, never its title: the demo writes the title in the language it was loaded in, and
      // the English one stopped every Slovenian walk here (found 2026-09-25).
      target: `.session-card[data-session-id="${DEMO_GROUP_SESSION_ID}"]`,
      // What has to be TRUE before this step can be asked: the board, with cards on
      // it. A pasted or refreshed `?demo=` link can open the app anywhere, and a step asking the
      // trainer to open a session that is already open reads as a broken guide.
      // Where this step LIVES. The overlay navigates here when the app is somewhere else — walking
      // Back out of the clipboard, or arriving on a refreshed deep link. Only the steps
      // that own a view need it: 2-4 are inside the clipboard step 1 opens, so they follow from it.
      route: "/",
      requires: [
        { selector: ".session-card", visible: true },
        // ...and the board is what the trainer is LOOKING at. The cards stay in the DOM behind an
        // open clipboard, so "a card is visible" alone is satisfied by a screen showing none.
        { selector: "#active-session-overlay", visible: false },
      ],
      caption: "tour_step_open_session",
      expect: { selector: "#active-session-client-tabs", visible: true },
    },
    {
      // The gesture nobody can guess, which is why it is demonstrated rather than described. The
      // card stack holds ONE session, so the session before it is reached sideways: pull the plan
      // aside and it is uncovered underneath, lined up so the same movement sits level with the
      // exercise in focus. A second stroke, upward without lifting the finger, opens it.
      //
      // ONE step, not two, although it shows two things. A look that is let go of leaves no trace
      // at all, so a step for it could only expect something that was already true when its card
      // appeared — and the guided walkthrough reads such a step as done before the trainer has done
      // anything. The look is graded where it happens instead: `expectHeld`, checked while the
      // finger is still down.
      //
      // The press starts on a card in the deck, where a thumb would land, not on the title bar.
      // 200px on the demo's 390px phone uncovers over half the plan underneath and is well past the
      // quarter-width the gesture arms at; 90px up is past the 64px the second stroke asks for.
      id: "open-previous-session",
      requires: [{ selector: "#active-exercise-scroll-deck", visible: true }],
      target: "#active-exercise-scroll-deck .exercise-deck-card.circuit-card",
      drag: [
        [200, 0],
        [200, -90],
      ],
      caption: "tour_step_open_previous",
      // Mid-gesture: the previous session is there to READ, which is the whole point of pulling
      // aside and the only moment the claim can be made.
      expectHeld: { selector: "#plan-peek-under-past .plan-sheet-row", visible: true },
      // And after: today's session is a group of two, the one before it is one client alone, so a
      // Today control to get back is what says the clipboard changed session.
      expect: { selector: "#btn-plan-today", visible: true },
    },
    {
      // And home. Today is the control the title bar grows once the clipboard is showing another
      // day, and tapping it is how a trainer gets back after looking something up — so the
      // walkthrough ends where it began rather than leaving them in a session from July.
      id: "back-to-today",
      requires: [{ selector: "#btn-plan-today", visible: true }],
      target: "#btn-plan-today",
      caption: "tour_step_back_to_today",
      // Today's session is the group of two; the one just left was one client alone.
      expect: {
        selector: "#active-session-client-tabs .client-tab-btn:nth-child(2)",
        visible: true,
      },
    },
    {
      id: "focus-exercise",
      // The deck opens fully collapsed, so the first tap is what brings a card into focus and makes
      // its actions reachable at all.
      //
      // A CIRCUIT card specifically. The seeded session is circuits end to end — Jane's plan holds
      // no standalone exercise at all — which the first e2e run reported rather than leaving the
      // demo to fail in front of a viewer. It is also the better story: one clipboard driving a
      // group through a circuit is the thing no competitor makes easy.
      // The clipboard has to be open: its deck does not exist on the board.
      requires: [{ selector: "#active-exercise-scroll-deck", visible: true }],
      target: "#active-exercise-scroll-deck .exercise-deck-card.circuit-card",
      caption: "tour_step_focus_exercise",
      expect: { selector: ".circuit-sig.easy", visible: true },
    },
    {
      id: "signal-too-easy",
      // The one-tap outcome signal that replaced the per-set stepper grid — the gesture the whole
      // clipboard exists to make cheap.
      requires: [{ selector: ".circuit-sig.easy", visible: true }],
      target: ".circuit-sig.easy",
      caption: "tour_step_signal",
      // Proves the tap REGISTERED, not merely that it was clickable: the active state is what a
      // trainer reads to know they do not need to tap again.
      expect: { selector: ".circuit-sig.easy.active", visible: true },
    },
    {
      id: "next-participant",
      // Group training is the differentiator — one clipboard, several people — so the tour ends on
      // the move nobody else's software makes easy.
      requires: [{ selector: "#active-session-client-tabs", visible: true }],
      target: "#active-session-client-tabs .client-tab-btn:nth-child(2)",
      caption: "tour_step_next_participant",
      expect: {
        selector: "#active-session-client-tabs .client-tab-btn:nth-child(2).active",
        visible: true,
      },
    },
  ],
};
