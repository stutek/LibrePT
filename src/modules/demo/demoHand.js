// src/modules/demo/demoHand.js — the animated hand that shows WHERE the scripted demo is tapping.
//
// Single responsibility: one overlay element, moved to a point and pulsed on tap. It draws an actual
// hand with an extended index finger (TODO §28.12); until 2026-08-18 it was a white dot in a module
// named for a hand, which read as a bullet rather than as somebody's finger. It knows nothing
// about tours, steps or assertions — demoTourPlayer.js drives it, and a tour runs correctly with no
// hand at all (which is exactly how the e2e suite runs it, since a cursor asserting nothing is pure
// cost in CI).
//
// **Why a visible pointer at all.** Without one the demo is a UI operating itself: controls change
// with nothing explaining why, which reads as a glitch rather than as a person using an app. The
// hand is what makes it legible as "someone is doing this, one-handed, on a phone" — §23.5's whole
// point.
//
// **Built with createElement, never innerHTML.** Nothing here is interpolated from data, so there is
// no escaping question to get wrong later (build/frontend_audit.py), and no CSP exposure.
//
// Injected dependencies: `doc` (defaults to `document`) so tests can mount it anywhere.

const HAND_ID = "demo-tour-hand";
const SVG_NS = "http://www.w3.org/2000/svg";

// The hand itself, as one path: a closed fist with the index finger extended upward, drawn in a
// 24×32 box so the fingertip sits at the top-left — the point the pointer is positioned by, the way
// a real finger meets a screen. Rendered rather than described, because a dot beside a control reads
// as a bullet or a rendering glitch, while a hand reads as a person using the app — which is the
// whole reason there is a pointer at all (TODO §28.12).
const HAND_PATH =
  "M8.4 2.6a2.1 2.1 0 0 1 4.2 0v10.2h1V9.4a1.9 1.9 0 0 1 3.8 0v3.4h1v-2a1.9 1.9 0 0 1 3.8 0v2.3h.4" +
  "a1.6 1.6 0 0 1 1.6 1.7l-.5 6.5a8.4 8.4 0 0 1-8.4 7.8h-2.6a7.6 7.6 0 0 1-6.3-3.3L1.4 19a2 2 0 0 1" +
  " 3-2.6l4-3.4z";

/** Creates the pointer, or returns the one already mounted.
 *
 * Built with createElement/createElementNS and no innerHTML, so there is nothing here for an
 * escaping audit to reason about (build/frontend_audit.py) and no CSP exposure — the same property
 * the module had as a styled div, kept while it became a drawing.
 */
export function mountDemoHand(doc = document) {
  const existing = doc.getElementById(HAND_ID);
  if (existing) return existing;

  const hand = doc.createElement("div");
  hand.id = HAND_ID;
  hand.className = "demo-tour-hand";
  // Decorative: it duplicates what the tour is already doing to real controls, so a screen reader
  // announcing "image" here would interrupt the actual state changes with noise.
  hand.setAttribute("aria-hidden", "true");

  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 26 32");
  svg.setAttribute("width", "26");
  svg.setAttribute("height", "32");
  const path = doc.createElementNS(SVG_NS, "path");
  path.setAttribute("d", HAND_PATH);
  svg.appendChild(path);
  hand.appendChild(svg);

  doc.body.appendChild(hand);
  return hand;
}

/** Moves the pointer over a point in viewport coordinates. Position rides on custom properties so
 * the travel animation stays entirely in the stylesheet. */
export function moveDemoHand(hand, x, y) {
  if (!hand) return;
  hand.style.setProperty("--hand-x", `${Math.round(x)}px`);
  hand.style.setProperty("--hand-y", `${Math.round(y)}px`);
  hand.classList.add("is-visible");
}

/** Pulses the pointer to read as a tap. Returns immediately — the caller owns the wait, because the
 * tap must land on the real control whether or not the animation has finished. */
const RIPPLE_CLASS = "demo-tour-ripple";
// How many rings a tap sends out. Waves, not a single highlight (wanted 2026-08-18): one ring says
// "here"; a set that keeps arriving says something LANDED here. The stagger and the fading are in
// demoTour.css, keyed off each ring's position in the group.
const RIPPLE_WAVES = 3;
// Matches the animation in demoTour.css. Kept in sync by hand for the same reason the splash's
// fade duration is: reading it back out of getComputedStyle to save one constant would cost a
// layout flush on every tap.
const RIPPLE_LIFETIME_MS = 620;

/** A ring that expands from the point of contact and removes itself.
 *
 * The hand pressing toward the screen is the GESTURE; this is what says the press landed (wanted
 * 2026-08-18). On a laptop there is no finger to watch, so without it a control simply changes and
 * a viewer cannot tell whether something tapped it or the app did it on its own.
 *
 * Removed on a timer rather than on `animationend`: the element is decorative and short-lived, and
 * an animationend listener that never fires (reduced motion, a background tab) would leave a ring
 * on screen permanently.
 */
function buildRipple(hand) {
  const ripple = hand.ownerDocument.createElement("div");
  ripple.className = RIPPLE_CLASS;
  // Positioned from the hand's own coordinates, so the ring lands on the FINGERTIP rather than on
  // the middle of the hand — the two are 30px apart, which at tap size is the whole point.
  const rect = hand.getBoundingClientRect();
  ripple.style.setProperty("--ripple-x", `${Math.round(rect.left)}px`);
  ripple.style.setProperty("--ripple-y", `${Math.round(rect.top)}px`);
  return ripple;
}

/** The rings a tap sends out, wrapped together so the stylesheet can stagger them by position and
 * one timer clears the whole set. */
function flashTapRipple(hand) {
  const doc = hand.ownerDocument;
  const waves = doc.createElement("div");
  waves.className = "demo-tour-waves";
  waves.setAttribute("aria-hidden", "true");
  for (let index = 0; index < RIPPLE_WAVES; index += 1) waves.appendChild(buildRipple(hand));
  doc.body.appendChild(waves);
  doc.defaultView.setTimeout(() => waves.remove(), RIPPLE_LIFETIME_MS);
}

export function pulseDemoHand(hand) {
  if (!hand) return;
  // The ring is placed BEFORE the press animation starts: `is-tapping` scales the hand, which moves
  // its measured box, and reading the fingertip mid-scale puts the mark a few pixels off the thing
  // it is marking.
  flashTapRipple(hand);
  hand.classList.remove("is-tapping");
  // Reading offsetWidth forces the class removal to take effect before it is re-added, so a second
  // tap on the same control restarts the animation instead of being swallowed as "no change".
  void hand.offsetWidth;
  hand.classList.add("is-tapping");
}

export function unmountDemoHand(doc = document) {
  doc.getElementById(HAND_ID)?.remove();
}
