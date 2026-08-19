// src/modules/demo/demoPace.js — how fast the scripted demo moves (TODO §23.5, §34).
//
// Single responsibility: turn "does this viewer want reduced motion?" into the four waits a step
// takes. Pure — no DOM, no timers — so the pacing can be reasoned about and tested without a browser.
//
// **Every full-motion pause exists for an eye, not for the app.** A viewer has to find the control,
// watch the hand reach it, register that something changed, and read the caption; raised 2026-08-18
// as "on web browser the button and clicks are about 50% too fast". None of that applies to someone
// who has asked their system for reduced motion — the hand does not glide for them (demoTour.css
// drops the transition entirely), so waiting for travel that is not happening is dead time in front
// of the one person who explicitly asked for less of it.
//
// **Which is why reduced motion is ZERO, not merely smaller.** That is only safe because a step no
// longer uses its pause as a correctness device: demoTourPlayer polls the step's expectation until
// it holds, within `outcomeBudgetMs`, so the tour waits exactly as long as the app takes and no
// longer. The old shape — sleep 1350ms, then check once — would race any handler that re-renders on
// a later frame the moment the sleep went to zero.
//
// Injected dependencies: none.

// Full-motion beats, in the order a step performs them.
const SCROLL_SETTLE_MS = 520;
const TRAVEL_MS = 650;
const TAP_LANDING_MS = 160;
const STEP_PAUSE_MS = 1350;

// How long a step will wait for its expectation to come true before calling itself failed. Identical
// at both paces: it is a budget for the APP, and the app is no faster for a viewer who likes motion.
const OUTCOME_BUDGET_MS = 2000;

export function demoPace(prefersReducedMotion) {
  if (prefersReducedMotion) {
    return {
      scrollSettleMs: 0,
      travelMs: 0,
      tapLandingMs: 0,
      stepPauseMs: 0,
      outcomeBudgetMs: OUTCOME_BUDGET_MS,
    };
  }
  return {
    scrollSettleMs: SCROLL_SETTLE_MS,
    travelMs: TRAVEL_MS,
    tapLandingMs: TAP_LANDING_MS,
    stepPauseMs: STEP_PAUSE_MS,
    outcomeBudgetMs: OUTCOME_BUDGET_MS,
  };
}

/** Does this document's viewer want reduced motion? Read at call time, not at import: a test (and a
 *  viewer changing the system setting mid-session) must be able to change the answer. */
export function prefersReducedMotion(doc = document) {
  return Boolean(doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}
