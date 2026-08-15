// src/domain/demoTour.js — what a scripted demo step IS, and whether it succeeded (TODO §23.5).
//
// Single responsibility: the step/expectation vocabulary and the pass-fail rule. No DOM, no timing,
// no hand — modules/demo/demoTourPlayer.js owns those, and tests/e2e/test_demo_tour.py replays the
// same script through Playwright.
//
// **Why the demo is a test, and not a recording.** §23.5 called for a 20-30s video of a real set
// being logged. A video is stale the first time a control moves, and nothing tells you it went
// stale — the asset keeps playing, showing an app that no longer exists, to exactly the people being
// asked to trust it. A scripted tour that drives the REAL controls cannot drift: if a selector or a
// flow changes, the tour stops working, and because the same script runs in the e2e suite, the
// build goes red rather than the marketing going quietly wrong.
//
// **Every step carries an expectation, and that is not decoration.** A tour that only taps things is
// a puppet show: it would keep "succeeding" against a broken app, tapping a button that no longer
// does anything and moving on. The expectation is what makes a step a claim about behaviour — tap
// this, and THAT becomes true — which is the same thing a test asserts and the same thing a viewer
// is being shown.
//
// Injected dependencies: none — pure functions over plain objects.

/** A probe of one selector, as the player observes it: `{ present, visible, text }`. Supplied by
 * the caller so this module never touches a document. */

/** Whether a step's expectation holds, and if not, why in words a maintainer can act on.
 *
 * Returns `{ ok, reason }`. `reason` is empty when ok — it is written for a failing e2e run and for
 * the on-screen abort, so it names the selector rather than describing the concept. */
export function checkExpectation(expectation, probe) {
  if (!expectation) return { ok: true, reason: "" };
  const { selector, visible, containsText } = expectation;

  if (!probe?.present) {
    return { ok: false, reason: `nothing matched ${selector}` };
  }
  if (visible === true && !probe.visible) {
    return { ok: false, reason: `${selector} matched but is not visible` };
  }
  if (visible === false && probe.visible) {
    return { ok: false, reason: `${selector} should have been hidden` };
  }
  if (containsText) {
    const actual = (probe.text || "").trim();
    if (!actual.toLowerCase().includes(containsText.toLowerCase())) {
      return {
        ok: false,
        reason: `${selector} reads ${JSON.stringify(actual.slice(0, 60))}, expected to contain ${JSON.stringify(containsText)}`,
      };
    }
  }
  return { ok: true, reason: "" };
}

/** Structural problems in a tour, found before it runs rather than three steps in with a hand
 * hovering over nothing. Returns a list of human-readable problems; empty means well-formed. */
export function validateTour(tour) {
  const problems = [];
  const steps = tour?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return ["a tour needs at least one step"];
  }

  const seen = new Set();
  for (const [index, step] of steps.entries()) {
    const at = `step ${index + 1}`;
    if (!step.id) problems.push(`${at} has no id`);
    else if (seen.has(step.id)) problems.push(`${at} repeats the id ${step.id}`);
    seen.add(step.id);

    if (!step.target) problems.push(`${at} (${step.id}) has no target selector`);
    // An expectation is REQUIRED, not optional: a step without one cannot fail, and a tour of
    // steps that cannot fail is a recording again — the exact thing this replaces.
    if (!step.expect?.selector) {
      problems.push(`${at} (${step.id}) has no expectation, so it can never fail`);
    }
  }
  return problems;
}

/** The step ids a tour runs, in order — what a test asserts it actually got through, so a tour that
 * silently stops halfway cannot pass by reporting only the steps it managed. */
export function tourStepIds(tour) {
  return (tour?.steps || []).map((step) => step.id);
}
