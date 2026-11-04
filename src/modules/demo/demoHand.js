// src/modules/demo/demoHand.js — the animated hand that shows WHERE the scripted demo is tapping.
//
// Single responsibility: one overlay element, moved to a point and pulsed on tap, or taken round a
// control it only points at. It draws an actual hand with an extended index finger; until
// 2026-08-18 it was a white dot in a module
// named for a hand, which read as a bullet rather than as somebody's finger. It knows nothing
// about tours, steps or assertions — demoTourPlayer.js drives it, and a tour runs correctly with no
// hand at all (which is exactly how the e2e suite runs it, since a cursor asserting nothing is pure
// cost in CI).
//
// **Why a visible pointer at all.** Without one the demo is a UI operating itself: controls change
// with nothing explaining why, which reads as a glitch rather than as a person using an app. The
// hand is what makes it legible as "someone is doing this, one-handed, on a phone" — the whole
// point of the demo.
//
// **Built with createElement, never innerHTML.** Nothing here is interpolated from data, so there is
// no escaping question to get wrong later (build/frontend_audit.py), and no CSP exposure.
//
// Injected dependencies: `doc` (defaults to `document`) so tests can mount it anywhere.

import { RIPPLE_RING_MS, RIPPLE_STAGGER_MS } from "./demoPace.js";

const HAND_ID = "demo-tour-hand";
const SVG_NS = "http://www.w3.org/2000/svg";

// The hand itself, as one path: a closed fist with the index finger extended upward, drawn in a
// 24×32 box so the fingertip sits at the top-left — the point the pointer is positioned by, the way
// a real finger meets a screen. Rendered rather than described, because a dot beside a control reads
// as a bullet or a rendering glitch, while a hand reads as a person using the app — which is the
// whole reason there is a pointer at all. Exported because the campaign flyer draws the same hand,
// read from here, so the gesture looks the same in print and in Show me.
export const HAND_PATH =
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
  extendWake(hand);
}

/** Pulses the pointer to read as a tap. Returns immediately — the caller owns the wait, because the
 * tap must land on the real control whether or not the animation has finished. */
const RIPPLE_CLASS = "demo-tour-ripple";
// How many rings a tap sends out. Waves, not a single highlight (wanted 2026-08-18): one ring says
// "here"; a set that keeps arriving says something LANDED here. How each ring FADES is in
// demoTour.css, keyed off its position in the group; how long it lives is not — see below.
export const RIPPLE_WAVES = 3;
// The set's whole life, from the first ring appearing to the last one gone — derived from the
// player's own pacing rather than copied from the stylesheet. Until 2026-08-27 this was a constant
// "kept in sync by hand" with an animation the CSS owned, and the player waited its own unrelated
// 160ms before tapping: three numbers that had to agree and no check that they did, which is how
// the rings ended up still arriving after the tap had replaced the screen. Now the duration is
// declared once (demoPace.js), stamped onto the elements below for the stylesheet to animate with,
// and used here to clear them — so a slower ring lengthens the wait and the cleanup together.
const RIPPLE_LIFETIME_MS = RIPPLE_RING_MS + RIPPLE_STAGGER_MS * (RIPPLE_WAVES - 1);

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
function buildRipple(hand, index) {
  const ripple = hand.ownerDocument.createElement("div");
  ripple.className = RIPPLE_CLASS;
  // Its own timing, handed to the stylesheet: how long it takes to expand, and how long after the
  // first ring it is sent. The rings behind the first arrive late on purpose — a set that keeps
  // coming reads as an impact — and the player's wait before the real click covers all of them.
  ripple.style.setProperty("--ripple-delay", `${RIPPLE_STAGGER_MS * index}ms`);
  // Positioned from the hand's own coordinates, so the ring lands on the FINGERTIP rather than on
  // the middle of the hand — the two are 30px apart, which at tap size is the whole point.
  // Placed at the point the pointer was SENT to, read back from the properties moveDemoHand set,
  // rather than derived from the hand's bounding box. The box's corner is not the fingertip — the
  // drawn finger sits ~10px inside it — so measuring the box put the rings on the knuckle
  // (reported 2026-08-18: "not centered around index finger"). Reading the target point needs no
  // offset constant duplicated between here and the stylesheet, and cannot drift from the artwork.
  ripple.style.setProperty("--ripple-x", hand.style.getPropertyValue("--hand-x") || "0px");
  ripple.style.setProperty("--ripple-y", hand.style.getPropertyValue("--hand-y") || "0px");
  return ripple;
}

/** The rings a tap sends out, wrapped together so the stylesheet can stagger them by position and
 * one timer clears the whole set. */
function flashTapRipple(hand) {
  const doc = hand.ownerDocument;
  const waves = doc.createElement("div");
  waves.className = "demo-tour-waves";
  waves.setAttribute("aria-hidden", "true");
  // Inherited by every ring inside, so the duration is written once per tap rather than per ring.
  waves.style.setProperty("--ripple-ms", `${RIPPLE_RING_MS}ms`);
  for (let index = 0; index < RIPPLE_WAVES; index += 1) waves.appendChild(buildRipple(hand, index));
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

// The wake a held finger leaves as it moves (wanted 2026-10-14: the gesture drawn as a hand and a
// disturbed water surface, in Show me and on the campaign flyer alike). One ring every this many
// pixels of travel: close enough that the path reads as one line, far enough apart that the rings
// stay rings.
export const WAKE_SPACING_PX = 24;
// How long one wake ring lives. Longer than a tap's ring on purpose: the oldest rings are what show
// the path already travelled, and a whole L takes two legs of the player's travel time. Stamped on
// the element like the tap's duration, so the stylesheet holds no second copy.
const WAKE_RING_MS = 1000;
// Where each held hand last left a ring. Kept outside the element so a drag leaves nothing on the
// DOM that could outlive it.
const lastWakePoint = new WeakMap();

function handPoint(hand) {
  return {
    x: parseFloat(hand.style.getPropertyValue("--hand-x")) || 0,
    y: parseFloat(hand.style.getPropertyValue("--hand-y")) || 0,
  };
}

/** One ring left at the fingertip, in its own wrapper so one timer clears it. */
function leaveWakeRing(hand) {
  const doc = hand.ownerDocument;
  const wake = doc.createElement("div");
  wake.className = "demo-tour-waves is-wake";
  wake.setAttribute("aria-hidden", "true");
  wake.style.setProperty("--ripple-ms", `${WAKE_RING_MS}ms`);
  wake.appendChild(buildRipple(hand, 0));
  doc.body.appendChild(wake);
  doc.defaultView.setTimeout(() => wake.remove(), WAKE_RING_MS);
}

/** While the hand is held down, leaves a ring each time it has moved WAKE_SPACING_PX from the last. */
function extendWake(hand) {
  const from = lastWakePoint.get(hand);
  if (!from) return;
  const here = handPoint(hand);
  if (Math.hypot(here.x - from.x, here.y - from.y) < WAKE_SPACING_PX) return;
  leaveWakeRing(hand);
  lastWakePoint.set(hand, here);
}

/** Press the pointer down and hold it, for a drag rather than a tap.
 *
 * A tap is a press that ends immediately, so `pulseDemoHand` draws its rings and lets go. A drag is
 * a press that travels, and a viewer only reads it as one if the finger stays down the whole way:
 * the hand keeps its pressed shape, and its travel animation is switched off so it sits exactly
 * where the pointer events being sent say it is (demoTour.css). The tap's rings are sent once, at
 * the point of contact; from there every move leaves the wake (`moveDemoHand`), oldest widest, which
 * shows the path and its direction without an arrow.
 */
export function pressDemoHand(hand) {
  if (!hand) return;
  flashTapRipple(hand);
  hand.classList.add("is-dragging");
  lastWakePoint.set(hand, handPoint(hand));
}

/** Lift the pointer at the end of a drag: the press relaxes and the hand may glide again. */
export function liftDemoHand(hand) {
  if (!hand) return;
  hand.classList.remove("is-dragging");
  lastWakePoint.delete(hand);
}

// POINTING without tapping (Show me on the welcome card). A tap's press and rings say "tap here",
// and the step taps nothing: it shows a control to LOOK at. So the hand goes round the control and
// leaves a ring around it (Simon, 2026-11-04: "for pointing, no click animation; circle around the
// element").
const CIRCLE_ID = "demo-tour-circle";
// How many places the hand is put on one lap: enough that it reads as a curve, not as jumps.
export const CIRCLE_POINTS_PER_LAP = 32;
// Clear space between the control's edge and the ring, so the ring is around it, not on it.
const CIRCLE_GAP_PX = 14;
// The ring stays this far inside the screen; a control at the edge gets a flatter ring, never a cut one.
const CIRCLE_SCREEN_MARGIN_PX = 6;

/** The ring around a box, in viewport coordinates: the box's centre, and half-sizes that clear its
 *  edges by CIRCLE_GAP_PX where the screen leaves room. The ring is a capsule — straight sides, round
 *  ends, what CSS draws for `border-radius: 9999px` — and not an ellipse: an ellipse round a wide
 *  menu row cuts the row's corners. Pure, so its geometry is tested without a browser. */
export function ringAround(box, viewport) {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const room = (centre, size) =>
    Math.min(centre - CIRCLE_SCREEN_MARGIN_PX, size - centre - CIRCLE_SCREEN_MARGIN_PX);
  return {
    cx,
    cy,
    rx: Math.max(0, Math.min(box.width / 2 + CIRCLE_GAP_PX, room(cx, viewport.width))),
    ry: Math.max(0, Math.min(box.height / 2 + CIRCLE_GAP_PX, room(cy, viewport.height))),
  };
}

/** The capsule's outline as segments in clockwise screen order, from the left end of its top side:
 *  straight sides as `line`, round corners as quarter `arc`s. */
function capsuleSegments({ cx, cy, rx, ry }) {
  const r = Math.min(rx, ry);
  const sx = rx - r;
  const sy = ry - r;
  const line = (x1, y1, x2, y2) => ({
    length: Math.hypot(x2 - x1, y2 - y1),
    at: (f) => ({ x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f }),
  });
  const arc = (ax, ay, from) => ({
    length: (Math.PI / 2) * r,
    at: (f) => {
      const angle = from + (Math.PI / 2) * f;
      return { x: ax + r * Math.cos(angle), y: ay + r * Math.sin(angle) };
    },
  });
  return [
    line(cx - sx, cy - ry, cx + sx, cy - ry),
    arc(cx + sx, cy - sy, -Math.PI / 2),
    line(cx + rx, cy - sy, cx + rx, cy + sy),
    arc(cx + sx, cy + sy, 0),
    line(cx + sx, cy + ry, cx - sx, cy + ry),
    arc(cx - sx, cy + sy, Math.PI / 2),
    line(cx - rx, cy + sy, cx - rx, cy - sy),
    arc(cx - sx, cy - sy, Math.PI),
  ];
}

/** The points the hand passes on `laps` turns round the ring, evenly spaced along it, clockwise on
 *  screen, starting and ending at the left end of its top side. */
export function circlePoints(ring, laps, perLap = CIRCLE_POINTS_PER_LAP) {
  const segments = capsuleSegments(ring);
  const perimeter = segments.reduce((sum, segment) => sum + segment.length, 0);
  const pointAt = (distance) => {
    let left = distance;
    for (const segment of segments) {
      if (left <= segment.length) return segment.at(segment.length ? left / segment.length : 0);
      left -= segment.length;
    }
    return segments[0].at(0);
  };
  return Array.from({ length: laps * perLap + 1 }, (_, index) =>
    pointAt(((index % perLap) / perLap) * perimeter),
  );
}

/** Draws the ring `shape` (from `ringAround`); demoTour.css owns how it looks. One at a time. */
export function drawDemoCircle(doc, shape) {
  eraseDemoCircle(doc);
  const ring = doc.createElement("div");
  ring.id = CIRCLE_ID;
  ring.className = "demo-tour-circle";
  ring.setAttribute("aria-hidden", "true");
  ring.style.setProperty("--circle-x", `${Math.round(shape.cx)}px`);
  ring.style.setProperty("--circle-y", `${Math.round(shape.cy)}px`);
  ring.style.setProperty("--circle-rx", `${Math.round(shape.rx)}px`);
  ring.style.setProperty("--circle-ry", `${Math.round(shape.ry)}px`);
  doc.body.appendChild(ring);
  return ring;
}

export function eraseDemoCircle(doc = document) {
  doc.getElementById(CIRCLE_ID)?.remove();
}

/** Takes the hand round the ring `laps` times, `lapMs` a lap, waiting with the caller's `wait`.
 *  Meanwhile it glides linearly for exactly one point's time (demoTour.css `.is-circling`), so the
 *  points join into a curve; the usual 0.42s glide would cut each lap into a smaller one. A lap of
 *  0 ms (reduced motion) moves nothing. */
export async function circleDemoHand(hand, ring, { laps, lapMs, wait }) {
  if (!hand || lapMs <= 0) return;
  const stepMs = lapMs / CIRCLE_POINTS_PER_LAP;
  hand.style.setProperty("--circle-step-ms", `${Math.round(stepMs)}ms`);
  hand.classList.add("is-circling");
  try {
    for (const point of circlePoints(ring, laps).slice(1)) {
      moveDemoHand(hand, point.x, point.y);
      await wait(stepMs);
    }
  } finally {
    hand.classList.remove("is-circling");
  }
}

export function unmountDemoHand(doc = document) {
  doc.getElementById(HAND_ID)?.remove();
  eraseDemoCircle(doc);
}
