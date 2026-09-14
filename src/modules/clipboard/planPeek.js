// src/modules/clipboard/planPeek.js — the "blanket" gesture on the live clipboard (TODO §52.2
// step 3): press-and-hold shrinks the current plan by itself, a sideways drag pulls it aside to
// show the previous or next plan drawn underneath. Behaviour lives in the prototype
// .private/prototypes/odeja.html (approved 2026-09-14) — this is that prototype's pointer handling,
// adapted to the real overlay.
//
// Knows nothing about sessions, clients or state: it drives pointer events on ONE element (the
// blanket) and toggles classes on it and on the two under-layer elements a callback hands it. The
// two under-layers are rendered by controllers/planPeekController.js — this module never asks what
// is in them, only whether a side has something to uncover (`has-plan`, or `has-create-card` for the
// "create a plan" card the controller draws when there is no next plan). That decides the
// quarter-distance rubber band with nothing there.
//
// Step 4: a pull past COMMIT_PCT marks that under-layer `is-release-ready` (its header swaps to
// "Release to open"), and releasing there slides the blanket off and calls `onOpen(side)`. WHAT
// opening means — a route, the planning form — is the controller's; so is whether this session may
// be left by a pull at all (`canOpen`).
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
// Step 4. Both measured against the overlay's width, not the narrowed blanket's, as the prototype
// measures its phone: 70 % of a 390px phone is a 273px pull — a deliberate sweep, not a thumb
// brushing the plan between sets.
const COMMIT_PCT = 0.7;
const LEAVE_MS = 220; // must match planPeek.css's `.is-leaving` transition

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

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

/**
 * Wire the blanket gesture. `blanket` is the element wrapping the title bar, client tabs and
 * clipboard body (#active-session-blanket). `deps`:
 *   getUnderLayers()  — () => { past: HTMLElement|null, future: HTMLElement|null }
 *   isDisabled()      — () => bool; true in edit mode, where the reorder drag owns the surface
 *   canOpen()         — () => bool; false when a release past the threshold must not leave
 *   onOpen(side)      — ("past"|"future") => void; called once the blanket has slid off
 * Idempotent: wiring twice on the same element is a no-op (the controller calls this once).
 */
export function initPlanPeek(blanket, { getUnderLayers, isDisabled, canOpen, onOpen }) {
  if (!blanket || blanket.dataset.planPeekWired) return;
  blanket.dataset.planPeekWired = "1";

  let drag = null; // { id, x, y, axis, side, ready, hold, anchorEl }
  let leaving = false; // the blanket is sliding off; a new press must not grab it mid-slide

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

  function layerFor(side) {
    const { past, future } = getUnderLayers() || {};
    return side === "past" ? past : future;
  }

  function hasNeighbour(side) {
    const el = layerFor(side);
    return !!(el?.classList.contains("has-plan") || el?.classList.contains("has-create-card"));
  }

  function setReady(side, ready) {
    const { past, future } = getUnderLayers() || {};
    past?.classList.toggle("is-release-ready", ready && side === "past");
    future?.classList.toggle("is-release-ready", ready && side === "future");
  }

  // The overlay's width: the blanket itself is 120px narrower while held.
  function fullWidth() {
    const host = blanket.parentElement || blanket;
    return host.getBoundingClientRect().width || 1;
  }

  function pointerdown(e) {
    if (leaving || isDisabled?.()) return;
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
      ready: false,
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
    const width = fullWidth();
    const neighbour = hasNeighbour(side);
    const pull = clampPull(dx, width, neighbour);
    if (side !== drag.side) {
      drag.side = side;
      setSide(side);
    }
    const ready = neighbour && Math.abs(pull) >= width * COMMIT_PCT && canOpen?.() !== false;
    if (ready !== drag.ready) {
      drag.ready = ready;
      setReady(side, ready);
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

    setReady(null, false);
    // A pointercancel is the browser taking the gesture back (a scroll, a system swipe): never an
    // instruction to open anything.
    if (finished.axis === "x" && finished.ready && e.type === "pointerup") {
      leave(finished.side);
      return;
    }
    blanket.classList.remove("pulled-right", "pulled-left");
    setSide(null);
    setHeld(false);
    if (finished.axis === "x") {
      blanket.classList.add("is-springing");
      setPull(0);
      setTimeout(() => blanket.classList.remove("is-springing"), SPRING_MS);
    }
  }

  // Slide off in the direction of the pull, then open. Opening re-renders the plan into this same
  // blanket, so it is put back in place in the same task as onOpen: the new plan is what paints
  // next, never the old one springing back. Reduced motion: no slide, same outcome, no wait.
  function leave(side) {
    leaving = true;
    const reduced = prefersReducedMotion();
    if (!reduced) {
      blanket.classList.add("is-leaving");
      setPull((side === "past" ? 1 : -1) * fullWidth());
    }
    const finish = () => {
      try {
        onOpen?.(side);
      } finally {
        blanket.classList.remove("is-leaving", "pulled-right", "pulled-left");
        setSide(null);
        setHeld(false);
        setPull(0);
        leaving = false;
      }
    };
    if (reduced) finish();
    else setTimeout(finish, LEAVE_MS);
  }

  blanket.addEventListener("pointerdown", pointerdown);
  // move/up/cancel on window, not the blanket: setPointerCapture keeps them targeted at the
  // blanket regardless, but a release that lands just outside it (a fast swipe) must still end the
  // gesture rather than leaving `drag` set — the same reason the prototype listens on window.
  window.addEventListener("pointermove", pointermove);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}
