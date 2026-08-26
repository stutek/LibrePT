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
// Injected dependencies: `tour` (the script), `t` (translator), `doc`, `pollMs`, `onStep` (optional
// — called with each step as it is entered, which is how the long story draws its narration cards
// around a guide it otherwise knows nothing about).

import {
  advanceWalkthrough,
  completeWalkthroughStep,
  currentWalkthroughStep,
  isWalkthroughStepDone,
  resumeWalkthroughAt,
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
// How long a rebuilt app is given to actually show the beat's control before the trainer is told
// anything. A view renders a frame or two after the tap that opened it, and a guide that says "wrong
// screen" and then works is worse than one that waits a beat.
const READY_SETTLE_MS = 2500;

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
  onStep = null,
  startAtStepId = null,
} = {}) {
  const el = buildOverlay(doc, t);
  const hand = mountDemoHand(doc);
  // A deep link names the step, so a reload lands where the viewer was rather than at the top of a
  // tour they have already watched (reported 2026-08-23).
  let state = startAtStepId ? resumeWalkthroughAt(tour, startAtStepId) : startWalkthrough();
  let showing = false;
  let ticker = 0;
  // Declared here because stop() closes over it and runs before the observer is created on a torn
  // down guide.
  let shapeWatcher = null;

  function stop() {
    if (ticker) {
      clearInterval(ticker);
      ticker = 0;
    }
    view.removeEventListener("scroll", followTarget, { capture: true });
    view.removeEventListener("resize", followTarget);
    shapeWatcher?.disconnect();
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
    // ...but a control that LIVES in the header is not scrolled away, it is exactly where it
    // belongs, and hiding its ring left the story's first beat — "open the menu" — with nothing
    // marked on screen at all (reported 2026-08-23). The test is where the control lives, not where
    // it sits: everything in the header is above the header's own bottom edge by definition.
    const header = doc.getElementById("app-header");
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
    const viewportHeight = doc.documentElement.clientHeight;
    const behindHeader = box.bottom <= headerBottom && !header?.contains(target);
    if (behindHeader || box.top >= viewportHeight) {
      el.spotlight.classList.remove("is-visible");
      return;
    }
    // The ring never travels — it is placed (decided 2026-08-19). Travel was kept at first because a
    // ring gliding from one control to the next reads as one object rather than two blinks; that
    // argument dies the moment a step change is also a VIEW change, which in this script it is:
    // gliding across a board that has just been replaced by a clipboard is motion between two things
    // that never shared a screen. The HAND is the movement, and a finger travelling to what it is
    // about to tap is the familiar version of that idea. The ring's job is "this one, here".
    // Frame-relative, because the frame is not always the screen: inside a dialog it is the
    // dialog's visible box, and a ring placed at viewport coordinates would sit that far off the
    // control it is naming.
    const frame = el.overlay.getBoundingClientRect();
    el.spotlight.style.setProperty("--spot-x", `${Math.round(box.left - frame.left)}px`);
    el.spotlight.style.setProperty("--spot-y", `${Math.round(box.top - frame.top)}px`);
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
    // A control that lives ON the panel — the story card's Continue, the handover link — cannot be
    // got out of the way of: moving the panel takes the target with it, so the answer flips every
    // time it is asked. It did, four times a second, and the card visibly bounced between the top
    // and the bottom of the screen (reported 2026-08-23 at story step 4 of 31). Nothing to do here:
    // a button on the card is never covered by the card.
    if (el.panel.contains(target)) return;
    // Measured with the panel where it is NOW, which is why this reads the bottom edge the panel
    // would occupy at the bottom of the viewport rather than its live top: once `is-top` is on, the
    // panel's own top is at the top of the screen and would answer "no overlap" forever.
    const panelHeight = el.panel.getBoundingClientRect().height;
    // The FRAME's bottom, not the screen's: inside a dialog the panel docks to the dialog's own
    // visible box, so that is the edge it would be sitting on.
    const frame = el.overlay.getBoundingClientRect();
    const wouldSitAbove = frame.bottom - panelHeight - PANEL_CLEARANCE_PX;
    el.overlay.classList.toggle("is-top", target.getBoundingClientRect().bottom > wouldSitAbove);
  }

  /** Whether the app is already on a step's route. Compared on the path the script writes — the
   * scripts name routes as the app's own paths, and the base path is the same for both. */
  function currentPathIs(route) {
    const here = doc.defaultView.location.pathname;
    return here === route || here.endsWith(route);
  }

  /** Keeps the guide TAPPABLE when the app opens one of its own modals, without letting the modal
   * take the panel over.
   *
   * A `<dialog>` opened with showModal() puts itself in the top layer and makes everything else on
   * the page inert — including this panel, so Show me and Next stop responding the moment the story
   * reaches the note dialog. Found by walking the story: the guide sat there looking normal while
   * every tap on it was swallowed. So the panel moves INTO the open dialog while it is open, which
   * puts it in the top layer too, and back to the body afterwards.
   *
   * **Moving it changes where it draws, and there is no getting the screen back** (reported
   * 2026-08-25: "the modal for intake sharing is hijacking the demo step card"). Every dialog here
   * is a glass card, and `backdrop-filter` makes an element the containing block for
   * `position: fixed` descendants — so the guide's full-screen frame collapses onto the dialog's
   * padding box the moment it is appended. Stretching it back over the viewport was tried and is
   * worse: a dialog's UA `overflow: auto` CLIPS whatever hangs off its top and left, so the card
   * vanished, and what hung off the bottom became scrollbars down the side of the modal (both
   * reported the same evening). Nor can the guide live outside: a popover in the top layer is
   * still not clickable while a modal is open — measured, not assumed.
   *
   * So while the guide is in a dialog, the dialog IS its screen: the frame becomes exactly the
   * dialog's VISIBLE box — scroll offset included, so it follows a form taller than the phone — and
   * the panel docks inside it, top or bottom, by the same rule that keeps it off the control
   * everywhere else. Measured on every tick, because a dialog can be scrolled or resized under it.
   */
  function keepPanelReachable() {
    // The LAST open dialog, because one can be opened over another and the panel has to live in the
    // topmost to be tappable at all.
    const openDialog = [...doc.querySelectorAll("dialog[open]")].pop() || null;
    const wanted = openDialog || doc.body;
    if (el.overlay.parentElement !== wanted) wanted.appendChild(el.overlay);

    const frame = el.overlay.style;
    el.overlay.classList.toggle("is-in-dialog", Boolean(openDialog));
    if (!openDialog) {
      // Back to the stylesheet's own `inset: 0` against the viewport.
      frame.left = frame.top = frame.width = frame.height = "";
      return;
    }
    // Offsets are in the dialog's PADDING box, which is what a positioned child measures from. The
    // scroll offset is what puts the frame over the part of the dialog a person is looking at: a
    // fixed child of a filtered ancestor scrolls with that ancestor's content, so on the taller
    // new-client form the guide used to ride 233px off the top of the screen.
    frame.left = `${openDialog.scrollLeft}px`;
    frame.top = `${openDialog.scrollTop}px`;
    frame.width = `${openDialog.clientWidth}px`;
    frame.height = `${openDialog.clientHeight}px`;
  }

  function render() {
    keepPanelReachable();
    const controls = walkthroughControls(tour, state);
    const step = currentWalkthroughStep(tour, state);

    el.progress.textContent = t("walkthrough_progress")
      .replace("{step}", String(controls.stepNumber))
      .replace("{count}", String(controls.stepCount));
    el.caption.textContent = step ? t(step.caption) : t("walkthrough_finished");

    el.back.textContent = t("walkthrough_back");
    el.back.hidden = !controls.canGoBack;
    el.show.textContent = t("walkthrough_show");
    // `showMe: false` is a step saying there is nothing to demonstrate — a card whose only control
    // is the Continue button already under the reader's thumb. Offering to walk a pointer to it
    // spends three seconds looking like a guide that has stopped working (reported 2026-08-22).
    el.show.hidden = !controls.canShowMe || step?.showMe === false;
    el.show.disabled = showing;
    // A step may name its own way on. The story's handover beat leaves this page for the client's
    // own — so Next says "Open Ana's phone" and does exactly that, rather than sitting beside a
    // second button that does the real thing (reported 2026-08-23: "why is Open Ana's phone a
    // different button from Next, and why does Next skip the intake form?" — it skipped it because
    // advancing the guide and going to the other phone were two different actions).
    el.next.textContent = step?.nextLabelKey
      ? t(step.nextLabelKey)
      : controls.isLastStep
        ? t("walkthrough_done")
        : t("walkthrough_next");
    el.next.disabled = !controls.canAdvance || showing;

    positionSpotlight(step ? resolveTarget(doc, step) : null);
  }

  /** Waits, briefly, for the app to actually be where the beat can happen.
   *
   * Counted in TICKS, not against a clock. The browser suites pin `Date.now()` to one instant so the
   * seed's times cannot drift between test runs (tests/INDEX.md), and a deadline of "now plus a
   * second" never arrives there — this waited for ever the first time it was written that way, and
   * the guide sat with every button greyed out.
   */
  async function settlesReady(step, budgetMs = READY_SETTLE_MS) {
    for (let waited = 0; waited < budgetMs; waited += RESTORE_SETTLE_MS) {
      if (stepIsReady(step)) return true;
      await sleep(RESTORE_SETTLE_MS);
    }
    return stepIsReady(step);
  }

  /** Is the app where this beat can HAPPEN? Its declared preconditions, and its own control being
   * reachable.
   *
   * The second half is most of the answer in practice, because most beats declare no preconditions
   * at all — `requires` exists for the states a selector cannot see (a clipboard covering the cards
   * that are still in the DOM behind it). Reported 2026-08-26: "back and forth for demo steps
   * surrounding sending intake link don't work". Walking Back out of the invite modal closes it, as
   * it must; walking forward again then stepped through four beats whose controls were inside that
   * closed dialog, marking each done — they were done, from the first pass — over a screen where
   * none of it was happening. Nothing detected it, because none of those beats declares a
   * precondition and the app never says "this control is not here".
   */
  function stepIsReady(step) {
    if (!stepPreconditionMet(step, doc)) return false;
    const target = resolveTarget(doc, step);
    return Boolean(target) && !isCovered(target);
  }

  /** Is something DRAWN ON TOP of this control? Asked at the control's own centre, because that is
   * where the hand is about to land, and a rect cannot answer it: an element under an open menu has
   * a perfectly good box.
   *
   * Wanted 2026-08-26 (Simon), reproducing the menu report: *"manually open menu and click show me
   * -> observe menu is not closed (no state enforcement)"*. A demonstration under a dropped-down
   * menu shows a hand tapping something the viewer cannot see; the beat starts from a clean screen
   * or it is not being shown at all.
   */
  function isCovered(target) {
    const box = target.getBoundingClientRect();
    const view = doc.documentElement;
    const x = Math.min(Math.max(box.left + box.width / 2, 1), view.clientWidth - 1);
    const y = Math.min(Math.max(box.top + box.height / 2, 1), view.clientHeight - 1);
    const onTop = doc.elementFromPoint(x, y);
    if (!onTop) return true;
    // The GUIDE is not "something in the way": its own card already has a rule for stepping aside
    // (keepPanelClearOf), and counting it here would send the guide off rebuilding the app to
    // escape itself — from a state its own next tick fixes.
    if (el.overlay.contains(onTop)) return false;
    // The deepest element at that point is usually the control's own icon or label, and sometimes a
    // wrapper it sits in — either way it is the same control answering.
    return !(target.contains(onTop) || onTop.contains(target));
  }

  /** Closes what the app has left open on top of the beat being restored — the one repair replaying
   * forward cannot make.
   *
   * A `<dialog>` opened with showModal() makes the rest of the page inert, so a modal left standing
   * from an earlier beat is not merely in the way: every control the rebuild would tap is
   * unreachable, and so is every control the trainer might tap to get out. Walking Back out of the
   * intake-invite modal landed exactly there (reported 2026-08-25, "the back button keeps the app
   * stuck in the modal").
   *
   * Undoing is otherwise not something this guide does — Back re-explains, it does not undo. This is
   * not an exception to that: it is the same repair as navigating to the anchor route, which the
   * rebuild has always done. Through the dialog's own ✕ where it has one, so the app runs whatever
   * it runs when a person closes it.
   */
  function dismissStaleOverlays(step, { menus = true } = {}) {
    const target = step?.target ? doc.querySelector(step.target) : null;
    let dismissed = false;

    // The app's own dropdowns. Not modal, so nothing is inert and nothing looks broken — they just
    // COVER, and a beat demonstrated under one is a hand tapping a control nobody can see. Closed
    // the way a person closes one, through the control that opened it, so the app runs its own
    // handler and the button's aria-expanded stays honest.
    //
    // Called twice around a replay, because a replayed beat can re-open the very menu that was in
    // the way — several of them exist to open one — and because a modal has to go before anything
    // can be replayed at all: the page it covers is inert.
    for (const menu of menus ? doc.querySelectorAll('[role="menu"]:not(.hidden)') : []) {
      if (target && menu.contains(target)) continue;
      const toggle = menu.parentElement?.querySelector('button[aria-expanded="true"]');
      if (toggle) toggle.click();
      else menu.classList.add("hidden");
      dismissed = true;
    }

    const modal = [...doc.querySelectorAll("dialog[open]")].pop() || null;
    if (!modal) return dismissed;
    // A beat whose own control is inside this modal belongs to it — that is the ground, not a
    // leftover.
    if (target && modal.contains(target)) return dismissed;
    const closer = modal.querySelector(".modal-close-btn");
    if (closer) closer.click();
    else modal.close();
    return true;
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
  /** Which stretch of the script rebuilds this beat's ground, and the route it happens on.
   *
   * The ANCHOR is the nearest preceding step that owns a `route`: everything after it happens inside
   * the view it opened, so navigating there and replaying forward reconstructs the ground the same
   * way every time. The replay normally starts at that anchor — except for a step that owns its own
   * route, which anchors on itself and would replay nothing at all. That is how a second Show me on
   * the beat that opens the register found the menu closed by its own first success, could not see
   * the control, and told the trainer the step had failed (reported 2026-08-23). Backing up to the
   * previous route-owner gives that beat the taps that set it up.
   */
  function replayRangeFor(step) {
    const index = tour.steps.indexOf(step);
    let anchor = index;
    while (anchor > 0 && !tour.steps[anchor].route) anchor -= 1;
    let from = anchor;
    if (from === index && index > 0) {
      from = index - 1;
      while (from > 0 && !tour.steps[from].route) from -= 1;
    }
    return { index, from, anchor, route: tour.steps[anchor].route };
  }

  async function restoreGroundFor(step) {
    // Nothing to rebuild when the app is already where the step starts — and rebuilding anyway is
    // not free: navigating to the anchor route mid-session tears down the very clipboard a later
    // beat is standing on. Show me asks for this on every tap, so the cheap answer has to be the
    // common one.
    if (stepIsReady(step)) return false;
    // The CHEAP repair first: something the app left open on top of the beat — a menu the trainer
    // dropped down, a modal an earlier beat opened — is not a reason to replay anything. Reported
    // 2026-08-26 through the story's evening chapter, where the beat after the theme switch is
    // covered by the very menu that switch lives in: rebuilding it re-ran the beats that open that
    // menu, and the guide ended up complaining about a screen it had just been on.
    dismissStaleOverlays(step);
    if (stepIsReady(step)) return false;
    const { index, from, route } = replayRangeFor(step);
    console.info(`[walkthrough] rebuilding ground for step ${step.id} from ${from + 1}`);
    // Only when the app is not already there: a navigate to the route you are on re-renders the
    // view under the trainer for nothing, and Show me now asks for this on every tap.
    let moved = false;
    if (route && !currentPathIs(route)) {
      moved = true;
      navigate?.(route);
      await sleep(RESTORE_SETTLE_MS);
    }
    for (const earlier of tour.steps.slice(from, index)) {
      if (stepIsReady(step)) break;
      moved = true;
      await performStep(earlier, { doc, wait: (ms) => sleep(Math.min(ms, RESTORE_SETTLE_MS)) });
    }
    // Whatever the replay itself left open on top of the beat — see dismissStaleOverlays.
    if (!stepIsReady(step)) dismissStaleOverlays(step);
    // Only a state the script itself cannot rebuild is the trainer's problem to hear about — and
    // only once the app has had its moment to render what the replay just asked for. No moment is
    // owed when nothing was asked: a rebuild that navigated nowhere and replayed nothing has an app
    // that is not about to change, and standing there with every button greyed out is the guide
    // looking dead rather than careful.
    if (!(await settlesReady(step, moved ? READY_SETTLE_MS : 0))) {
      reportProblem(
        `step ${step.id} precondition still unmet after rebuild`,
        t("walkthrough_wrong_place"),
      );
    }
    // Says the app was MOVED, which is what makes a satisfied-looking outcome stale — see the Show
    // me handler's `replay`.
    return true;
  }

  async function enterStep() {
    // FIRST, before anything is shown or graded: a dialog the previous step closed leaves the panel
    // parented inside it, and a closed `<dialog>` is `display: none` — so the panel and everything
    // in it measure as invisible until the next poll tick puts them back. Harmless while the panel
    // held only text; once the story's card lives in it, a beat that ends when the card goes away
    // graded itself finished the moment it began, and the guide skipped two beats in a blink
    // (found 2026-08-23, walking the story after the two cards were merged into one).
    keepPanelReachable();
    el.problem.hidden = true;
    const step = currentWalkthroughStep(tour, state);
    // BEFORE the precondition and the target lookup: a narrated beat's own control is the card the
    // narration puts on screen, so it has to exist before anything goes looking for it.
    onStep?.(step);
    // Asserted as the card loads (TODO §30.3): a step whose control cannot exist yet would otherwise
    // fail confusingly the moment anyone tapped Show me, and the trainer would have read a whole
    // caption first. What follows from the assertion is a REPAIR, not a complaint — see
    // restoreGroundFor.
    if (step && !stepIsReady(step)) {
      // Same busy flag the demonstration uses, and set BEFORE the first await: it greys out Back /
      // Show me / Next while the app is being moved under the panel, so a second tap cannot start a
      // second rebuild on top of one — and cannot be silently dropped by the handler that ignores
      // taps while one is running, which is what a tap on a live-looking button in this window was.
      showing = true;
      render();
      try {
        // Decided on ONE reading, deliberately. Waiting for the app to look ready sounds kinder and
        // is not: an overlay mid-transition measures as gone for a frame, and a guide that samples
        // until it likes the answer will take that frame — which is how walking Back out of the
        // clipboard stopped tearing it down (found while fixing this, in the test that covers it).
        // A beat's control arriving late is handled where it belongs, in the rebuild, which waits
        // before it complains.
        const rebuilt = await restoreGroundFor(step);
        // A beat that is ALREADY DONE has just had its starting state put back on top of a screen
        // that moved past it — the ☰ menu re-opened over the register the beat itself opened
        // (reported 2026-08-25 at story step 3, "does not ensure menu closed"). Nothing else was
        // then left to close it, and the next beat's control sat underneath it. The step's own
        // action is exactly what takes that ground away, so run it: idempotent, no pointer, repair
        // pace — this is not a demonstration, it is the app being put where the story says it is.
        if (rebuilt && stepOutcomeNow(step, doc).ok) {
          await performStep(step, {
            doc,
            wait: (ms) => sleep(Math.min(ms, RESTORE_SETTLE_MS)),
            replay: true,
          });
        }
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
      // Marked done so Next is offered — never walked forward on the viewer's behalf. Entering a
      // step used to skip it when its expectation already held (2026-08-22); with Show me no longer
      // advancing either, that skip became the only thing that moved the guide, and it could move it
      // into a step whose ground restore satisfied the next one again: enterStep called itself in a
      // circle and the screen flickered (reported 2026-08-23, at story step 3). Advancing belongs to
      // one control now, and this recursion is gone with it.
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
    // Put the app back where this step starts BEFORE demonstrating it — the same rebuild a card
    // arriving does (reported 2026-08-23: "multiple clicks on Show me should always reset state
    // first"). Without it the second tap demonstrated into whatever the first one left behind: on
    // the beat that opens the register from the menu, the menu was closed by its own success, the
    // control could not be found, and the guide told the trainer the step had failed when it had
    // worked. Idempotent all the way down, so a first tap on an app already in place replays
    // nothing and navigates nowhere.
    //
    // TRUE when the app was actually moved. That makes the step's own outcome reading stale: a beat
    // that dismisses its ground to reach its outcome — the ☰ menu closing as the register opens —
    // still reads "done" with the menu freshly re-opened on top of it, so performStep's idempotence
    // would skip the tap and leave the menu covering the next beat's control (reported 2026-08-25).
    // After a rebuild the app is by construction back BEFORE the step, so firing the action is a
    // replay, not a double tap.
    const rebuilt = await restoreGroundFor(step);
    // One path, whether or not the step has been done before: performStep is idempotent, so a step
    // walked back to is demonstrated again without its action being fired twice.
    //
    // `showing` is cleared in a finally, not after the await. It disables both Next and Show me
    // while a demonstration is in flight, so a throw on the way through — a control detached
    // mid-scroll, an app error under the tap — would otherwise leave the whole panel greyed out with
    // nothing on screen to say why, which is indistinguishable from a guide that has died.
    let outcome;
    try {
      outcome = await performStep(step, { doc, hand, replay: rebuilt });
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
    // Show me demonstrates the step; it never moves the guide. Next is always the trainer's tap
    // (reported 2026-08-23: "sometimes show me advances demo step sometimes not"). The earlier rule
    // — delegating advances, doing it yourself does not — made the guide advance under some taps
    // and not others, and the last step was a third case again; from the floor that reads as a bug,
    // not as a distinction. One rule the trainer can predict beats a rule that saves them one tap.
    render();
  });

  el.next.addEventListener("click", () => {
    const step = currentWalkthroughStep(tour, state);
    // Going THERE is the way on, and the guide follows: the next chapter runs on the page it lands
    // on, reading the story's position out of the address like any other resumed link.
    if (step?.advanceTo) {
      // Resolved against the app's BASE, not the address currently showing: the story is deep in
      // `/sessions/2026-08-23` when it crosses, and a plain relative jump would land beside that.
      doc.defaultView.location.assign(new URL(step.advanceTo, doc.baseURI).href);
      return;
    }
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

  // The ring also follows the control CHANGING SHAPE (reported 2026-08-22: "when Show me clicks a
  // collapsed card, the card expands way faster than the surrounding border highlight"). A tap that
  // expands a card moves nothing the listeners above hear — no scroll, no window resize — so the
  // ring sat on the old geometry until the next poll tick, up to a quarter second later, which on
  // screen reads as the highlight sliding after the fact. A ResizeObserver on the target sees it in
  // the same frame the layout changes.
  shapeWatcher = new view.ResizeObserver(followTarget);
  const watchTarget = (target) => {
    shapeWatcher.disconnect();
    if (target) shapeWatcher.observe(target);
  };

  ticker = setInterval(() => {
    // Also on the tick: a dialog can open or close without the guide's own step changing — the
    // trainer may close the note themselves — and a panel left behind an inert page is dead.
    keepPanelReachable();
    const step = currentWalkthroughStep(tour, state);
    if (!step || showing) return;
    // A complaint is about a state, and states pass: the trainer may have opened the screen the
    // guide was asking for, or the beat may simply have WORKED after a slow board finished drawing
    // its cards. A message left standing over a guide that is fine is the guide being wrong out
    // loud, and the story's evening chapter ended every full walk that way.
    if (!el.problem.hidden && (stepIsReady(step) || stepOutcomeNow(step, doc).ok)) {
      el.problem.hidden = true;
    }
    const target = resolveTarget(doc, step);
    positionSpotlight(target);
    keepPanelClearOf(target);
    watchTarget(target);
    if (stepOutcomeNow(step, doc).ok) {
      state = completeWalkthroughStep(state, step.id);
      render();
    }
  }, pollMs);

  enterStep();
  return { stop };
}
