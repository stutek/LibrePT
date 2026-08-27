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

/** A walkthrough resumed at a named step — what a deep link into the demo lands on (reported
 *  2026-08-23: a reload mid-story restarted it elsewhere, losing the step the viewer was on).
 *
 *  Every earlier step counts as done, because the viewer got there by doing them and because
 *  `advanceWalkthrough` refuses to move off a step that is not: a resumed guide that could not go
 *  forward would be worse than one that forgot. An unknown id starts from the beginning rather than
 *  failing — a stale or hand-edited link is a viewer with a wrong URL, not an error to show them. */
export function resumeWalkthroughAt(tour, stepId) {
  const steps = tour?.steps || [];
  const index = steps.findIndex((step) => step.id === stepId);
  if (index <= 0) return startWalkthrough();
  return {
    stepIndex: index,
    completedIds: steps.slice(0, index).map((step) => step.id),
    finished: false,
  };
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

/** How a run counts itself: its own steps, one to however many it has.
 *
 * This is the ordinary case and the only one the wedge tour (modules/demo/gymFloorTour.js) needs —
 * four taps, played in one sitting, in one browser.
 */
class TourNumbering {
  constructor(steps) {
    this.steps = steps;
  }

  get count() {
    return this.steps.length;
  }

  numberOf(index) {
    return index + 1;
  }
}

/** How the long story counts itself: a step's place in the STORY, whichever run it is playing in.
 *
 * The story hands the browser to the client's own page half way through and takes it back four steps
 * later, and each of those is a separate boot with its own step list. Counting the run made the
 * viewer watch "step 10 of 41" become "step 1 of 8" and then "step 11 of 41" — one story, three
 * numberings, and nothing on screen saying why (reported 2026-08-27, TODO §38.9). Each step carries
 * where it belongs (`storyPosition`, from domain/demoStory.js), so both boots say the same thing
 * without sharing any state.
 */
class StoryNumbering extends TourNumbering {
  get count() {
    return this.steps[0]?.storyPosition?.count ?? this.steps.length;
  }

  numberOf(index) {
    return this.steps[index]?.storyPosition?.number ?? index + 1;
  }
}

/** The numbering a tour counts by. The one place that decides between them — a step that knows its
 *  place in a story is counted by the story, and everything else counts itself. */
export function walkthroughNumbering(tour) {
  const steps = tour?.steps || [];
  return steps[0]?.storyPosition ? new StoryNumbering(steps) : new TourNumbering(steps);
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
  // Two different questions, deliberately answered by two different numbers. What the viewer READS
  // is where they are in the story, which may be longer than this run. What the BUTTONS obey is the
  // run itself: the last step of the trainer's walk is the last one it can advance past, whatever
  // number the story gives it.
  const runLength = tour?.steps?.length ?? 0;
  const numbering = walkthroughNumbering(tour);
  const step = currentWalkthroughStep(tour, state);
  const done = step ? isWalkthroughStepDone(state, step.id) : false;

  return {
    stepNumber: numbering.numberOf(state.stepIndex),
    stepCount: numbering.count,
    canGoBack: state.stepIndex > 0 && !state.finished,
    // Offered on a done step too (reported 2026-08-18: walking back through a finished tour left a
    // guide with no Show me anywhere, since every step behind you is done). Safe there because the
    // action itself is idempotent (demoTourPlayer.performStep): a step already satisfied is
    // demonstrated again without being re-fired, so the promise below — a step returned to asks
    // nothing of the trainer a second time — is kept by the player rather than by hiding a button.
    canShowMe: Boolean(step),
    canAdvance: done,
    isLastStep: runLength > 0 && state.stepIndex === runLength - 1,
    isFinished: state.finished,
  };
}
