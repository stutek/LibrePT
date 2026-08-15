// src/modules/demo/demoHand.js — the animated hand that shows WHERE the scripted demo is tapping.
//
// Single responsibility: one overlay element, moved to a point and pulsed on tap. It knows nothing
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

/** Creates the pointer, or returns the one already mounted. */
export function mountDemoHand(doc = document) {
  const existing = doc.getElementById(HAND_ID);
  if (existing) return existing;

  const hand = doc.createElement("div");
  hand.id = HAND_ID;
  hand.className = "demo-tour-hand";
  // Decorative: it duplicates what the tour is already doing to real controls, so a screen reader
  // announcing "image" here would interrupt the actual state changes with noise.
  hand.setAttribute("aria-hidden", "true");
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
