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
export function pulseDemoHand(hand) {
  if (!hand) return;
  hand.classList.remove("is-tapping");
  // Reading offsetWidth forces the class removal to take effect before it is re-added, so a second
  // tap on the same control restarts the animation instead of being swallowed as "no change".
  void hand.offsetWidth;
  hand.classList.add("is-tapping");
}

export function unmountDemoHand(doc = document) {
  doc.getElementById(HAND_ID)?.remove();
}
