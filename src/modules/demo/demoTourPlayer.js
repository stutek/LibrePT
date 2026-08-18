// src/modules/demo/demoTourPlayer.js — runs a scripted tour against the REAL app (TODO §23.5).
//
// Single responsibility: for each step, put the hand on the target, tap the actual control, then
// check the step's expectation and record what happened. The pass-fail rule is pure and lives in
// domain/demoTour.js; the pointer is modules/demo/demoHand.js; the script is gymFloorTour.js.
//
// **It taps real controls, and that is the entire value.** Calling app functions directly would be
// easier and would prove nothing: the demo exists to show the app working, and a test built on it
// is only worth something if the path it drives is the path a trainer's thumb drives. So a step
// resolves a selector, scrolls it into view, and dispatches a genuine click.
//
// **Scrolling is done here rather than by the caller** because the deck lives inside its own scroll
// container — tests/e2e/test_gym_floor_flow.py documents Playwright being unable to reach into it
// from outside. Running inside the page turns that from an obstacle into a non-issue, which is one
// reason the tour is app code rather than a test fixture.
//
// **A failed expectation STOPS the tour.** Continuing would show a viewer a sequence that no longer
// makes sense, and would let the e2e suite report the later steps as passing on top of a broken
// one. The recorded results say which step failed and why.
//
// **One step is performable on its own** (`performStep`), because the guided walkthrough (TODO §9.5)
// runs the same script one tap at a time and must reach the control, the pointer and the pass-fail
// check by the same route the automatic tour does. A walkthrough with its own copy of "resolve,
// scroll, tap, check" would be a second definition of what the demo means.
//
// Injected dependencies: `doc`, `hand` (optional — no pointer in CI), `wait`, `onStep`.

import { checkExpectation, validateTour } from "../../domain/demoTour.js";
import { moveDemoHand, pulseDemoHand } from "./demoHand.js";

// How long a tapped control is left on screen before the next step begins. Raised from 900ms on
// 2026-08-18: "on web browser the button and clicks are about 50% too fast". A phone viewer follows
// a finger; on a laptop there is no finger to follow, so the eye has to find the control, register
// that it changed, and read the caption — and the demo was moving on before the second of those.
const DEFAULT_STEP_PAUSE_MS = 1350;
// Time given to the pointer's travel across the screen, and to the scroll that precedes it. Same
// report, same reasoning: a pointer that arrives before you have looked at it has not shown you
// anything.
const DEFAULT_TRAVEL_MS = 650;
const SCROLL_SETTLE_MS = 200;
// A beat between the press landing and the click firing, so the tap READS as the cause of what
// happens next rather than as something simultaneous with it.
const TAP_LANDING_MS = 160;

export function probe(doc, selector) {
  const el = doc.querySelector(selector);
  if (!el) return { present: false, visible: false, text: "" };
  // offsetParent is null for a display:none element and for anything inside one, which is the
  // "can the viewer actually see this?" question — not the same as being in the document.
  const visible = Boolean(el.offsetParent) || el.getClientRects().length > 0;
  return { present: true, visible, text: el.textContent || "" };
}

function centreOf(el) {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Is this element actually on screen? Every view lives in the DOM at once — the router activates
 * one and leaves the rest in place — so a hidden view's copy has a zero-sized box while the one a
 * trainer is looking at does not. Cheaper and more honest than reading `.active` off an ancestor:
 * it also excludes a collapsed drawer, a closed dialog and anything display:none for its own
 * reasons. */
function isOnScreen(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/** The control a step acts on. `targetText` picks among matches by their text, which is how a script
 * says "the Group Strength card" rather than "the first card" — position in a seeded list is not a
 * property the demo should depend on, and the first attempt at this tour broke precisely because it
 * did. Falls back to the first match when no text is given.
 *
 * **Only ever a control that is VISIBLE** (TODO §28.13). A selector as ordinary as `.session-card`
 * matches cards in views nobody is looking at, and a document query returns them in DOM order — so
 * a walkthrough reloaded onto a different route (`walkthroughUrl()` keeps whatever path was open)
 * put its spotlight on an element belonging to another view. With nothing visible this returns null
 * and the step reports "no control matched", which stops the walkthrough loudly rather than guiding
 * someone to a place they cannot see. */
export function resolveTarget(doc, step) {
  const matches = [...doc.querySelectorAll(step.target)].filter(isOnScreen);
  if (!step.targetText) return matches[0] || null;
  const wanted = step.targetText.toLowerCase();
  return matches.find((el) => (el.textContent || "").toLowerCase().includes(wanted)) || null;
}

/** Whether a step's expectation holds against the page as it stands, with no tap. The walkthrough
 *  polls this to notice the trainer doing the step themselves, and to recognise a step already done
 *  when they walk Back into it. */
export function stepOutcomeNow(step, doc = document) {
  return { id: step.id, ...checkExpectation(step.expect, probe(doc, step.expect.selector)) };
}

/**
 * Performs ONE step — resolve the control, scroll it into view, move and pulse the pointer, dispatch
 * a genuine click, then check the expectation. Returns `{ id, ok, reason }`.
 *
 * Shared with the guided walkthrough's "Show me", so the two cannot drift on what a step's tap
 * actually is.
 */
export async function performStep(step, { doc = document, hand = null, wait = sleep } = {}) {
  const target = resolveTarget(doc, step);
  if (!target) {
    const qualifier = step.targetText ? ` containing ${JSON.stringify(step.targetText)}` : "";
    return { id: step.id, ok: false, reason: `no control matched ${step.target}${qualifier}` };
  }

  target.scrollIntoView({ block: "center", inline: "nearest" });
  // Let the scroll settle before reading a box for the pointer, or the hand lands where the control
  // used to be.
  await wait(SCROLL_SETTLE_MS);

  if (hand) {
    const { x, y } = centreOf(target);
    moveDemoHand(hand, x, y);
    await wait(step.travelMs ?? DEFAULT_TRAVEL_MS);
    pulseDemoHand(hand);
    await wait(TAP_LANDING_MS);
  }

  target.click();
  await wait(step.settleMs ?? DEFAULT_STEP_PAUSE_MS);

  return stepOutcomeNow(step, doc);
}

/**
 * Plays `tour`, returning one result per step attempted:
 *   `[{ id, ok, reason }]`
 *
 * Stops at the first failure, so the last entry is the one that broke. A caller comparing these ids
 * against `tourStepIds(tour)` can tell a tour that finished from one that stopped early — which is
 * what the e2e test does, because a player reporting only the steps it managed would otherwise pass
 * by simply doing less.
 */
export async function playTour(tour, { doc = document, hand = null, wait = sleep, onStep } = {}) {
  const problems = validateTour(tour);
  if (problems.length > 0) {
    return [{ id: "tour", ok: false, reason: problems.join("; ") }];
  }

  const results = [];
  for (const step of tour.steps) {
    const outcome = await performStep(step, { doc, hand, wait });
    results.push(outcome);
    onStep?.(outcome);
    if (!outcome.ok) break;
  }
  return results;
}
