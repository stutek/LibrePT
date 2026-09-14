// src/modules/clipboard/planPeek.js — the "blanket" gesture on the live clipboard (TODO §52.2
// step 3): press-and-hold shrinks the current plan by itself, a sideways drag pulls it aside to
// show the previous or next plan drawn underneath. Behaviour lives in the prototype
// .private/prototypes/odeja.html (approved 2026-09-14) — this is that prototype's pointer handling,
// adapted to the real overlay.
//
// Knows nothing about sessions, clients or state: it drives pointer events on ONE element (the
// blanket) and toggles classes on it and on the two under-layer elements a callback hands it. The
// two under-layers are rendered by controllers/planPeekController.js — this module never asks what
// is in them, only whether a side HAS a plan (the `has-plan` class the controller already put
// there), which is what decides the quarter-distance rubber band with no neighbour.
//
// The one inline style this module sets is `--plan-pull` (docs/ARCHITECTURE.md "look and layout
// live only in CSS" — a drag offset is exactly the kind of runtime number that rule carves out for
// a custom property). Every other visual change is a class; planPeek.css owns what the classes do,
// including prefers-reduced-motion.

// Timings and distances are the prototype's own defaults (Simon approved the prototype as a whole,
// 2026-09-14), not independently chosen here.
const HOLD_MS = 250;
const LOCK_PX = 8; // movement before an axis (x/y) is decided
const EDGE_PX = 24; // a press this close to either side edge is the phone's own back gesture
const MAX_PULL_PCT = 0.85; // of the blanket's own width
const RUBBER_START_PCT = 0.8; // of MAX_PULL_PCT — beyond this the pull resists further movement
const NO_NEIGHBOUR_FACTOR = 0.25; // how far the blanket still moves with nothing to reveal
const SPRING_MS = 280; // must match planPeek.css's `.is-springing` transition

// Rows denser while held/dragging, eased back the same way (planPeek.css's `.is-held` transition).
const DENSE_SETTLE_MS = 220;

function clampPull(dx, width, hasNeighbour) {
  const max = width * MAX_PULL_PCT;
  const sign = Math.sign(dx);
  let pull = Math.abs(dx);
  const softLimit = max * RUBBER_START_PCT;
  if (pull > softLimit) {
    const over = pull - softLimit;
    const span = max - softLimit;
    pull = softLimit + span * (1 - Math.exp(-over / span));
  }
  pull = Math.min(pull, max);
  return sign * pull * (hasNeighbour ? 1 : NO_NEIGHBOUR_FACTOR);
}

/**
 * Wire the blanket gesture. `blanket` is the element wrapping the title bar, client tabs and
 * clipboard body (#active-session-blanket). `deps`:
 *   getUnderLayers()  — () => { past: HTMLElement|null, future: HTMLElement|null }
 *   isDisabled()      — () => bool; true in edit mode, where the reorder drag owns the surface
 * Idempotent: wiring twice on the same element is a no-op (the controller calls this once).
 */
export function initPlanPeek(blanket, { getUnderLayers, isDisabled }) {
  if (!blanket || blanket.dataset.planPeekWired) return;
  blanket.dataset.planPeekWired = "1";

  let drag = null; // { id, x, y, axis, side, hold, anchorEl }

  function setPull(px) {
    blanket.style.setProperty("--plan-pull", `${px}px`);
  }

  function setHeld(on) {
    if (blanket.classList.contains("is-held") === on) return;
    blanket.classList.add("is-animating-held");
    blanket.classList.toggle("is-held", on);
    setTimeout(() => blanket.classList.remove("is-animating-held"), DENSE_SETTLE_MS);
  }

  function setSide(side) {
    const { past, future } = getUnderLayers() || {};
    past?.classList.toggle("is-side-chosen", side === "past");
    future?.classList.toggle("is-side-chosen", side === "future");
    blanket.classList.toggle("side-past", side === "past");
    blanket.classList.toggle("side-future", side === "future");
  }

  function hasPlan(side) {
    const { past, future } = getUnderLayers() || {};
    const el = side === "past" ? past : future;
    return !!el?.classList.contains("has-plan");
  }

  function pointerdown(e) {
    if (isDisabled?.()) return;
    if (e.button !== undefined && e.button !== 0) return;
    // The trainer's own control (a card, a button inside the deck) still opens/taps normally: a
    // press that never crosses LOCK_PX or HOLD_MS produces no gesture of ours at all, so we don't
    // need to filter targets here — only refuse the strip the phone reserves for its back swipe.
    const rect = blanket.getBoundingClientRect();
    if (e.clientX - rect.left < EDGE_PX || rect.right - e.clientX < EDGE_PX) return;

    const anchorEl = e.target.closest(
      ".exercise-deck-card, .plan-sheet-block, .plan-sheet-row, .clipboard-body > *",
    );
    const pressed = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      axis: null,
      side: null,
      anchorEl,
    };
    drag = pressed;
    blanket.classList.remove("is-springing");
    pressed.hold = setTimeout(() => {
      if (drag === pressed && !drag.axis) setHeld(true);
    }, HOLD_MS);
  }

  function pointermove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;

    if (!drag.axis) {
      if (Math.hypot(dx, dy) < LOCK_PX) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      clearTimeout(drag.hold);
      if (drag.axis === "x") {
        blanket.setPointerCapture?.(e.pointerId);
        setHeld(true);
      } else {
        // A vertical move is a normal scroll; if the hold had already shrunk the blanket, undo it —
        // the trainer is reading the deck, not asking to see a neighbour.
        setHeld(false);
      }
    }
    if (drag.axis !== "x") return;
    e.preventDefault();

    const side = dx > 0 ? "past" : "future";
    const width = blanket.getBoundingClientRect().width || 1;
    const pull = clampPull(dx, width, hasPlan(side));
    if (side !== drag.side) {
      drag.side = side;
      setSide(side);
    }
    blanket.classList.toggle("pulled-right", pull > 0);
    blanket.classList.toggle("pulled-left", pull < 0);
    setPull(pull);
  }

  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const finished = drag;
    clearTimeout(finished.hold);
    drag = null;

    blanket.classList.remove("pulled-right", "pulled-left");
    setSide(null);
    setHeld(false);
    if (finished.axis === "x") {
      // Opening the neighbour past a threshold is TODO §52.2 step 4 — every release here springs
      // back, whatever the pull was.
      blanket.classList.add("is-springing");
      setPull(0);
      setTimeout(() => blanket.classList.remove("is-springing"), SPRING_MS);
    }
  }

  blanket.addEventListener("pointerdown", pointerdown);
  // move/up/cancel on window, not the blanket: setPointerCapture keeps them targeted at the
  // blanket regardless, but a release that lands just outside it (a fast swipe) must still end the
  // gesture rather than leaving `drag` set — the same reason the prototype listens on window.
  window.addEventListener("pointermove", pointermove);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}
