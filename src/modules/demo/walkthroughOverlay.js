// src/modules/demo/walkthroughOverlay.js — the guided walkthrough: one step explained at a time,
// over the real app (TODO §9.5).
//
// Single responsibility: the panel and the spotlight. Which controls are offered is
// domain/walkthrough.js, whether a step succeeded is domain/demoTour.js, the tap itself is
// demoTourPlayer.js's `performStep`, and the script is gymFloorTour.js. This module renders and
// wires; it decides nothing about the tour.
//
// **It guides the trainer through the real app, not through a mock of it.** The panel floats over the
// app's own controls and the app keeps working underneath — so a trainer can perform the step
// themselves, and the walkthrough notices. That is why there is a poll: the completion signal is the
// step's own expectation becoming true, which is the same evidence the e2e suite accepts, and it does
// not care WHO caused it. A version that only advanced on its own button would be teaching its own
// buttons.
//
// **"Show me" is the escape hatch, not the path.** A trainer who cannot find the control gets it
// tapped for them, with the same pointer the automatic demo uses. On a step already DONE it points
// instead of tapping: re-firing the tap would undo the very thing it demonstrated (a second Too Easy
// clears the first), and walking back through a finished tour without it left a guide offering
// nothing at all.
//
// **The panel moves out of its own way.** If the step's control sits where the panel would cover it,
// the panel goes to the top of the screen instead. A guide that hides the thing it is pointing at is
// worse than no guide on a phone, where there is nowhere else to look.
//
// **Nothing here is built with innerHTML** — every node is created and every string set as
// textContent, so translated copy cannot become markup (build/frontend_audit.py) and there is no CSP
// exposure.
//
// Injected dependencies: `tour` (the script), `t` (translator), `doc`, `pollMs`.

import {
  advanceWalkthrough,
  completeWalkthroughStep,
  currentWalkthroughStep,
  isWalkthroughStepDone,
  retreatWalkthrough,
  startWalkthrough,
  walkthroughControls,
} from "../../domain/walkthrough.js";
import { mountDemoHand, unmountDemoHand } from "./demoHand.js";
import {
  performStep,
  resolveTarget,
  stepOutcomeNow,
  stepPreconditionMet,
} from "./demoTourPlayer.js";

const OVERLAY_ID = "walkthrough-overlay";
// How often the trainer's own progress is noticed. Fast enough that a tap feels acknowledged, slow
// enough to be nothing next to what the app does on that tap.
const DEFAULT_POLL_MS = 250;
// Space kept clear under the panel before it gives up the bottom of the screen and moves to the top.
const PANEL_CLEARANCE_PX = 12;
// How long the app is given to settle between the taps of a rebuild. Deliberately far shorter than
// the demonstration's own pauses (demoTourPlayer.js): those exist so a viewer can follow a finger,
// while this is the guide putting back a state the trainer never saw leave.
const RESTORE_SETTLE_MS = 150;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function iconButton(doc, { id, className, icon, label }) {
  const button = doc.createElement("button");
  button.type = "button";
  button.id = id;
  button.className = className;
  button.setAttribute("aria-label", label);
  const glyph = doc.createElement("i");
  glyph.className = icon;
  glyph.setAttribute("aria-hidden", "true");
  button.appendChild(glyph);
  return button;
}

function actionButton(doc, { id, className }) {
  const button = doc.createElement("button");
  button.type = "button";
  button.id = id;
  button.className = className;
  return button;
}

function buildOverlay(doc, t) {
  const overlay = doc.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "walkthrough";

  const spotlight = doc.createElement("div");
  spotlight.className = "walkthrough-spotlight";
  // Decorative twice over: it points at a control that is itself readable, and it must never
  // intercept the tap it is inviting.
  spotlight.setAttribute("aria-hidden", "true");

  const panel = doc.createElement("div");
  panel.className = "walkthrough-panel";
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", t("walkthrough_title"));
  // The caption changes without the trainer's focus moving, so it has to be announced rather than
  // waited for.
  panel.setAttribute("aria-live", "polite");

  const head = doc.createElement("div");
  head.className = "walkthrough-head";
  const progress = doc.createElement("span");
  progress.className = "walkthrough-progress";
  const exit = iconButton(doc, {
    id: "walkthrough-exit",
    className: "walkthrough-exit",
    icon: "fa-solid fa-xmark",
    label: t("walkthrough_exit"),
  });
  head.append(progress, exit);

  const caption = doc.createElement("p");
  caption.className = "walkthrough-caption";

  const problem = doc.createElement("p");
  problem.className = "walkthrough-problem";
  problem.hidden = true;

  const actions = doc.createElement("div");
  actions.className = "walkthrough-actions";
  const back = actionButton(doc, { id: "walkthrough-back", className: "walkthrough-btn" });
  const show = actionButton(doc, { id: "walkthrough-show", className: "walkthrough-btn" });
  const next = actionButton(doc, {
    id: "walkthrough-next",
    className: "walkthrough-btn walkthrough-btn-primary",
  });
  actions.append(back, show, next);

  panel.append(head, caption, problem, actions);
  overlay.append(spotlight, panel);
  doc.body.appendChild(overlay);

  return { overlay, spotlight, panel, progress, caption, problem, back, show, next, exit };
}

/**
 * Starts the walkthrough and returns `{ stop }`.
 *
 * `stop` is idempotent and is what the exit button, the final Next, and any caller tearing the app
 * down all call — one teardown path, so a stopped walkthrough can never leave its poll running over
 * an app the trainer has moved on from.
 */
export function startGuidedWalkthrough({
  tour,
  t = (key) => key,
  doc = document,
  pollMs = DEFAULT_POLL_MS,
  navigate = null,
} = {}) {
  const el = buildOverlay(doc, t);
  const hand = mountDemoHand(doc);
  let state = startWalkthrough();
  let showing = false;
  let ticker = 0;

  function stop() {
    if (ticker) {
      clearInterval(ticker);
      ticker = 0;
    }
    view.removeEventListener("scroll", followTarget, { capture: true });
    view.removeEventListener("resize", followTarget);
    unmountDemoHand(doc);
    el.overlay.remove();
  }

  function positionSpotlight(target) {
    if (!target) {
      el.spotlight.classList.remove("is-visible");
      return;
    }
    const box = target.getBoundingClientRect();
    // A control scrolled up behind the app header has nothing to point AT, and a ring drawn there
    // points at the header instead (reported 2026-08-19). Hidden rather than clamped: a ring that
    // slid to the edge and stayed would claim something is there.
    const headerBottom = doc.getElementById("app-header")?.getBoundingClientRect().bottom ?? 0;
    const viewportHeight = doc.documentElement.clientHeight;
    if (box.bottom <= headerBottom || box.top >= viewportHeight) {
      el.spotlight.classList.remove("is-visible");
      return;
    }
    // The ring never travels — it is placed (decided 2026-08-19). Travel was kept at first because a
    // ring gliding from one control to the next reads as one object rather than two blinks; that
    // argument dies the moment a step change is also a VIEW change, which in this script it is:
    // gliding across a board that has just been replaced by a clipboard is motion between two things
    // that never shared a screen. The HAND is the movement, and a finger travelling to what it is
    // about to tap is the familiar version of that idea. The ring's job is "this one, here".
    el.spotlight.style.setProperty("--spot-x", `${Math.round(box.left)}px`);
    el.spotlight.style.setProperty("--spot-y", `${Math.round(box.top)}px`);
    el.spotlight.style.setProperty("--spot-w", `${Math.round(box.width)}px`);
    el.spotlight.style.setProperty("--spot-h", `${Math.round(box.height)}px`);
    el.spotlight.classList.add("is-visible");
  }

  /** Move the panel to the top of the screen if it would cover the step's control, and back down
   * when it would not (TODO §28.15).
   *
   * **Asked on every poll tick, not once per step.** It used to run only in `enterStep`, immediately
   * after `scrollIntoView` — which measures the layout as it was BEFORE the scroll settled, so the
   * answer was right or wrong depending on timing, and nothing ever revisited it. Any later scroll
   * (the deck is its own scroll container, and steps 2 and 4 both move it) could slide the control
   * under a panel that had already decided where to sit. Reported as the panel covering the button
   * "sometimes".
   *
   * The decision is re-derived from the CURRENT geometry each time rather than latched, so it also
   * moves back down once the control is no longer underneath — a panel that fled to the top and
   * stayed there would cover whatever the next step points at up there.
   */
  function keepPanelClearOf(target) {
    if (!target) return;
    // Measured with the panel where it is NOW, which is why this reads the bottom edge the panel
    // would occupy at the bottom of the viewport rather than its live top: once `is-top` is on, the
    // panel's own top is at the top of the screen and would answer "no overlap" forever.
    const panelHeight = el.panel.getBoundingClientRect().height;
    const wouldSitAbove = doc.documentElement.clientHeight - panelHeight - PANEL_CLEARANCE_PX;
    el.overlay.classList.toggle("is-top", target.getBoundingClientRect().bottom > wouldSitAbove);
  }

  function render() {
    const controls = walkthroughControls(tour, state);
    const step = currentWalkthroughStep(tour, state);

    el.progress.textContent = t("walkthrough_progress")
      .replace("{step}", String(controls.stepNumber))
      .replace("{count}", String(controls.stepCount));
    el.caption.textContent = step ? t(step.caption) : t("walkthrough_finished");

    el.back.textContent = t("walkthrough_back");
    el.back.hidden = !controls.canGoBack;
    el.show.textContent = t("walkthrough_show");
    el.show.hidden = !controls.canShowMe;
    el.show.disabled = showing;
    el.next.textContent = controls.isLastStep ? t("walkthrough_done") : t("walkthrough_next");
    el.next.disabled = !controls.canAdvance || showing;

    positionSpotlight(step ? resolveTarget(doc, step) : null);
  }

  /**
   * Puts the app back where a step needs it, by REPLAYING the steps that build that state (reported
   * 2026-08-19: "After completing demo I click back and get: This step needs a different screen —
   * go back to the sessions board and start it again. that is not acceptable").
   *
   * A button the guide itself offers must land somewhere usable. Back off the last step is the case
   * that made this unarguable: step 4 switches participant, which re-renders the deck for somebody
   * else, so the Too Easy signal step 3 asks for is gone through no fault of the trainer — and the
   * old code answered a legitimate tap by telling them to start the tour over.
   *
   * **Rebuilt from the step's own anchor, not patched.** The anchor is the nearest preceding step
   * that owns a `route`: everything after it happens inside the view it opened, so navigating there
   * and replaying forward reconstructs the ground the same way every time, whatever state the app
   * had drifted into. Replay stops the moment the target step's precondition holds, so a Back that
   * only needs one tap undone does not tear the whole clipboard down first.
   *
   * Safe to replay because `performStep` is idempotent (demoTourPlayer.js): a step whose outcome
   * already holds is not re-tapped, which matters here because several of these controls are
   * toggles. Fast waits rather than the demonstration's own pauses — this is repair, not teaching,
   * and the trainer is waiting on a panel they already tapped.
   */
  async function restoreGroundFor(step) {
    const index = tour.steps.indexOf(step);
    let anchor = index;
    while (anchor > 0 && !tour.steps[anchor].route) anchor -= 1;

    const route = tour.steps[anchor].route;
    console.info(
      `[walkthrough] step ${step.id} precondition not met — rebuilding from ${anchor + 1}`,
    );
    if (route) {
      navigate?.(route);
      await sleep(RESTORE_SETTLE_MS);
    }
    for (const earlier of tour.steps.slice(anchor, index)) {
      if (stepPreconditionMet(step, doc)) break;
      await performStep(earlier, { doc, wait: (ms) => sleep(Math.min(ms, RESTORE_SETTLE_MS)) });
    }
    // Only a state the script itself cannot rebuild is the trainer's problem to hear about.
    if (!stepPreconditionMet(step, doc)) {
      reportProblem(
        `step ${step.id} precondition still unmet after rebuild`,
        t("walkthrough_wrong_place"),
      );
    }
  }

  async function enterStep() {
    el.problem.hidden = true;
    const step = currentWalkthroughStep(tour, state);
    // Asserted as the card loads (TODO §30.3): a step whose control cannot exist yet would otherwise
    // fail confusingly the moment anyone tapped Show me, and the trainer would have read a whole
    // caption first. What follows from the assertion is a REPAIR, not a complaint — see
    // restoreGroundFor.
    if (step && !stepPreconditionMet(step, doc)) {
      // Same busy flag the demonstration uses: it greys out Back / Show me / Next while the app is
      // being moved under the panel, so a second tap cannot start a second rebuild on top of one.
      showing = true;
      render();
      try {
        await restoreGroundFor(step);
      } finally {
        showing = false;
      }
    }
    const target = step ? resolveTarget(doc, step) : null;
    if (target) {
      // Smooth here too, so entering a step and being shown one move the page the same way — the
      // spotlight follows on the poll, and a jump would leave it behind for a frame.
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      keepPanelClearOf(target);
    }
    // A step re-entered from Back — or one the trainer completed before reading the panel — is
    // already satisfied, and must not be asked for again.
    if (step && stepOutcomeNow(step, doc).ok) {
      state = completeWalkthroughStep(state, step.id);
    }
    render();
  }

  /**
   * Says something went wrong, in the trainer's words — and puts the DIAGNOSIS in the console
   * (decided 2026-08-19: "the red assertion text is helpful to me for investigations, but should not
   * be customer visible").
   *
   * The reason is a selector and a failed expectation: precisely what someone debugging the script
   * needs, and precisely what a trainer cannot act on. It stays available where an investigator
   * already looks, rather than being deleted — the alternative to showing it is not hiding it, it is
   * putting it somewhere it belongs.
   */
  function reportProblem(reason, trainerMessage = t("walkthrough_stuck")) {
    console.warn(`[walkthrough] ${reason}`);
    el.problem.textContent = trainerMessage;
    el.problem.hidden = false;
  }

  el.show.addEventListener("click", async () => {
    const step = currentWalkthroughStep(tour, state);
    if (!step || showing) return;
    showing = true;
    render();

    const alreadyDone = isWalkthroughStepDone(state, step.id);
    // One path, whether or not the step has been done before: performStep is idempotent, so a step
    // walked back to is demonstrated again without its action being fired twice.
    //
    // `showing` is cleared in a finally, not after the await. It disables both Next and Show me
    // while a demonstration is in flight, so a throw on the way through — a control detached
    // mid-scroll, an app error under the tap — would otherwise leave the whole panel greyed out with
    // nothing on screen to say why, which is indistinguishable from a guide that has died.
    let outcome;
    try {
      outcome = await performStep(step, { doc, hand });
    } catch (error) {
      outcome = { id: step.id, ok: false, reason: `demonstration threw: ${error?.message}` };
    } finally {
      showing = false;
    }
    // Re-showing a step the trainer has already done is a replay, not progress: it must not carry
    // them forward to a step they have not seen.
    if (alreadyDone) {
      if (!outcome.ok) reportProblem(outcome.reason);
      return render();
    }
    if (!outcome.ok) {
      reportProblem(outcome.reason);
      return render();
    }

    state = completeWalkthroughStep(state, step.id);
    // Delegating a step advances the guide; doing it YOURSELF does not (reported 2026-08-18: "show
    // me clicks the button right, but the demo step did not advance"). The distinction is who is
    // driving. A trainer who tapped the control themselves is learning by doing and may want to
    // read the caption against what just happened, so Next stays theirs. A trainer who asked to be
    // shown handed the step over — leaving them to acknowledge it is two taps for one action, and
    // from their side the guide simply did not move.
    //
    // The LAST step is the exception: advancing off it closes the walkthrough, and doing that on
    // their behalf would make the panel vanish mid-gesture. Done stays a deliberate tap.
    if (walkthroughControls(tour, state).isLastStep) return render();
    state = advanceWalkthrough(tour, state);
    enterStep();
  });

  el.next.addEventListener("click", () => {
    state = advanceWalkthrough(tour, state);
    if (state.finished) return stop();
    enterStep();
  });

  el.back.addEventListener("click", () => {
    state = retreatWalkthrough(state);
    enterStep();
  });

  el.exit.addEventListener("click", stop);

  // The trainer doing the step themselves is the expected case, so it is watched for continuously
  // rather than inferred from a click listener — the tap may land on a child element, may be a
  // keyboard activation, and may take a render to become true.
  // The ring tracks the page itself, not the poll: anything that moves the layout between ticks —
  // the timeline settling to the day in a deep link, right after boot — left the ring drawn where
  // the control HAD been, up to a quarter second behind (reported 2026-08-19). Passive and capturing
  // so it also hears scrolls inside the deck and the board, which are their own scroll containers.
  const followTarget = () => {
    const step = currentWalkthroughStep(tour, state);
    positionSpotlight(step ? resolveTarget(doc, step) : null);
  };
  const view = doc.defaultView;
  view.addEventListener("scroll", followTarget, { passive: true, capture: true });
  view.addEventListener("resize", followTarget, { passive: true });

  ticker = setInterval(() => {
    const step = currentWalkthroughStep(tour, state);
    if (!step || showing) return;
    const target = resolveTarget(doc, step);
    positionSpotlight(target);
    keepPanelClearOf(target);
    if (stepOutcomeNow(step, doc).ok) {
      state = completeWalkthroughStep(state, step.id);
      render();
    }
  }, pollMs);

  enterStep();
  return { stop };
}
