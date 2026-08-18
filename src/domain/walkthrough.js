// src/domain/walkthrough.js — where a guided walkthrough is, and which of its controls are offered
// (TODO §9.5).
//
// Single responsibility: the cursor over a tour's steps and the availability rule for Back / Show me
// / Next. No DOM, no timers, no tour content — modules/demo/walkthroughOverlay.js owns those, and
// domain/demoTour.js still owns whether a step's expectation held.
//
// **The same script the scripted demo plays** (modules/demo/gymFloorTour.js). The demo taps for the
// viewer; the walkthrough waits for the trainer and taps only when asked. Splitting the two into
// separate scripts would double the thing that has to stay true of the real app, which is exactly
// what §23.5 chose a script over a recording to avoid.
//
// **A step cannot be skipped, and that is a property of the app rather than a teaching choice.** The
// walkthrough drives real controls, and each one only exists because the previous tap created it —
// there is no circuit card to focus before the clipboard is open, and no Too Easy button before a
// card is in focus. So Next stays unavailable until the current step's expectation actually holds,
// whether the trainer tapped it themselves or asked to be shown.
//
// **Back re-explains; it does not undo.** Going back re-reads the previous step against an app that
// has already moved on, and pretending otherwise would mean inventing an inverse for every step —
// an undo stack for a demonstration. A step already done stays done when revisited, so returning to
// it asks nothing of the trainer a second time.
//
// Injected dependencies: none — pure functions over plain objects.

/** A fresh walkthrough, parked on the first step with nothing done yet. */
export function startWalkthrough() {
  return { stepIndex: 0, completedIds: [], finished: false };
}

/** The step the trainer is being asked to perform, or null once the walkthrough has finished. */
export function currentWalkthroughStep(tour, state) {
  if (state.finished) return null;
  return tour?.steps?.[state.stepIndex] ?? null;
}

export function isWalkthroughStepDone(state, stepId) {
  return state.completedIds.includes(stepId);
}

/** Records that a step's expectation now holds. Idempotent: the overlay watches for the trainer's
 *  own tap on a poll, so the same completion arrives repeatedly and must not accumulate. */
export function completeWalkthroughStep(state, stepId) {
  if (!stepId || isWalkthroughStepDone(state, stepId)) return state;
  return { ...state, completedIds: [...state.completedIds, stepId] };
}

/** Moves on, or finishes on the last step. Refuses while the current step is not done — see the
 *  header: the next step's control does not exist yet, so advancing would point at nothing. */
export function advanceWalkthrough(tour, state) {
  const step = currentWalkthroughStep(tour, state);
  if (!step || !isWalkthroughStepDone(state, step.id)) return state;

  const isLast = state.stepIndex >= tour.steps.length - 1;
  if (isLast) return { ...state, finished: true };
  return { ...state, stepIndex: state.stepIndex + 1 };
}

export function retreatWalkthrough(state) {
  if (state.stepIndex === 0) return state;
  return { ...state, stepIndex: state.stepIndex - 1, finished: false };
}

/**
 * What the panel can offer right now:
 *   `{ stepNumber, stepCount, canGoBack, canShowMe, canAdvance, isLastStep, isFinished }`
 *
 * One place decides this so the buttons and the keyboard/automation paths cannot disagree about
 * whether Next is available — a Next that works but looks disabled is the same defect §7.2 fixed on
 * the gym floor, one step further up the stack.
 */
export function walkthroughControls(tour, state) {
  const stepCount = tour?.steps?.length ?? 0;
  const step = currentWalkthroughStep(tour, state);
  const done = step ? isWalkthroughStepDone(state, step.id) : false;

  return {
    stepNumber: state.stepIndex + 1,
    stepCount,
    canGoBack: state.stepIndex > 0 && !state.finished,
    // Offered on a done step too (reported 2026-08-18: walking back through a finished tour left a
    // guide with no Show me anywhere, since every step behind you is done). Safe there because the
    // action itself is idempotent (demoTourPlayer.performStep): a step already satisfied is
    // demonstrated again without being re-fired, so the promise below — a step returned to asks
    // nothing of the trainer a second time — is kept by the player rather than by hiding a button.
    canShowMe: Boolean(step),
    canAdvance: done,
    isLastStep: stepCount > 0 && state.stepIndex === stepCount - 1,
    isFinished: state.finished,
  };
}
