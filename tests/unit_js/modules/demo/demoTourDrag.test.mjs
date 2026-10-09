// tests/unit_js/modules/demo/demoTourDrag.test.mjs
// Where a demonstrated DRAG presses (src/modules/demo/demoTourPlayer.js, `dragStep`).
//
// The gym-floor tour drags the exercise card aside and up to open the previous session. On a busy
// machine the card was measured while the deck was still scrolling it into view: its box stood
// still below the screen for two readings, the press went to that point, and the page body under it
// received the whole gesture. Nothing opened. A press must land on the control it names.

import assert from "node:assert/strict";
import { test } from "node:test";

import { performStep } from "../../../../src/modules/demo/demoTourPlayer.js";

const VIEWPORT_HEIGHT = 720;

/** A page with one card that reaches its place only after some time has passed: below the screen
 *  for the first `lateBy` waits, on screen after that. The card opens a neighbour when it receives
 *  a press, a move and a release; anything sent elsewhere goes to the body and does nothing. */
function lateCardPage(lateBy) {
  const state = { waits: 0, scrolledTo: false, opened: false, received: [] };
  const below = { top: 900, left: 600, width: 80, height: 66 };
  const placed = { top: 240, left: 600, width: 80, height: 66 };
  const box = () => ({
    ...(state.waits >= lateBy || state.scrolledTo ? placed : below),
    get right() {
      return this.left + this.width;
    },
    get bottom() {
      return this.top + this.height;
    },
  });

  // The gesture is started by a press ON the card; the moves and the release are heard anywhere, as
  // planPeek.js listens for them on the window.
  const hear = (where, event) => {
    state.received.push(`${where}:${event.type}`);
    if (event.type === "pointerup" && state.received[0] === "card:pointerdown") state.opened = true;
  };
  const body = { dispatchEvent: (event) => hear("body", event) };
  const card = {
    textContent: "",
    value: "",
    offsetParent: {},
    getClientRects: () => [box()],
    getBoundingClientRect: box,
    // The deck is still being laid out when the step starts, so the scroll asked for then moves
    // nothing. One asked for after any time has passed brings the card into view.
    scrollIntoView: () => {
      if (state.waits > 0) state.scrolledTo = true;
    },
    contains: (el) => el === card,
    dispatchEvent: (event) => hear("card", event),
  };
  const opened = {
    textContent: "",
    value: "",
    get offsetParent() {
      return state.opened ? {} : null;
    },
    getClientRects: () => (state.opened ? [placed] : []),
  };
  for (const element of [card, opened]) {
    Object.defineProperty(element, "ownerDocument", { get: () => doc });
  }
  const elements = { ".card": card, "#opened": opened };
  const doc = {
    defaultView: { matchMedia: () => ({ matches: true }) },
    body,
    querySelectorAll: (selector) => (elements[selector] ? [elements[selector]] : []),
    querySelector: (selector) => elements[selector] ?? null,
    // Like a browser: nothing is hit outside the window, and only the card's box hits the card.
    elementFromPoint(x, y) {
      if (y < 0 || y > VIEWPORT_HEIGHT) return null;
      const b = box();
      return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom ? card : body;
    },
  };
  const wait = async () => {
    state.waits += 1;
  };
  return { doc, state, wait };
}

const dragStep = {
  id: "open-previous-session",
  target: ".card",
  drag: [
    [200, 0],
    [200, -90],
  ],
  expect: { selector: "#opened", visible: true },
};

globalThis.PointerEvent ??= class PointerEvent {
  constructor(type, init) {
    Object.assign(this, init);
    this.type = type;
  }
};

test("a drag whose card is still below the screen when measured is pressed on the card", async () => {
  const { doc, state, wait } = lateCardPage(1000);

  const outcome = await performStep(dragStep, { doc, wait });

  assert.equal(state.received[0], "card:pointerdown", "the press reached the card, not the body");
  assert.equal(outcome.ok, true, outcome.reason);
});

test("a drag whose card is already in place is pressed there without scrolling again", async () => {
  const { doc, state, wait } = lateCardPage(0);

  const outcome = await performStep(dragStep, { doc, wait });

  assert.equal(state.scrolledTo, false);
  assert.equal(outcome.ok, true, outcome.reason);
});
