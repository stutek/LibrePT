// tests/unit_js/modules/demo/demoTourPlayer.test.mjs
// A demonstration that fails part-way (src/modules/demo/demoTourPlayer.js, `demonstrateBeats`).
//
// The welcome card's "Show me" opens the ☰ menu and closes it again in its last beat. A beat in
// the middle that does not come true used to end the run there, so the menu stayed open over the
// next card. The step still has to report the failure; only the closing beat is run anyway.

import assert from "node:assert/strict";
import { test } from "node:test";

import { performStep } from "../../../../src/modules/demo/demoTourPlayer.js";

/** A page with a ☰ button that toggles a menu, and nothing else. */
function menuPage() {
  const state = { menuOpen: false, taps: [] };
  const box = () => ({ top: 10, left: 10, width: 40, height: 40 });
  const make = (selector, visible, onClick) => {
    const element = {
      textContent: "",
      value: "",
      get offsetParent() {
        return visible() ? {} : null;
      },
      getClientRects: () => (visible() ? [box()] : []),
      getBoundingClientRect: () => (visible() ? box() : { top: 0, left: 0, width: 0, height: 0 }),
      scrollIntoView() {},
      contains: () => false,
      click() {
        state.taps.push(selector);
        onClick?.();
      },
    };
    Object.defineProperty(element, "ownerDocument", { get: () => doc });
    return element;
  };
  const elements = {
    "#btn-app-menu": make(
      "#btn-app-menu",
      () => true,
      () => {
        state.menuOpen = !state.menuOpen;
      },
    ),
    "#app-menu": make(
      "#app-menu",
      () => state.menuOpen,
      () => {},
    ),
  };
  const doc = {
    defaultView: { matchMedia: () => ({ matches: true }) },
    querySelectorAll: (selector) => (elements[selector] ? [elements[selector]] : []),
    querySelector: (selector) => elements[selector] ?? null,
  };
  return { doc, state };
}

const noWait = async () => {};

function welcomeStep(middle) {
  return {
    id: "welcome",
    expect: { selector: "#btn-app-menu", visible: true },
    demonstrate: [
      { target: "#btn-app-menu", expect: { selector: "#app-menu", visible: true } },
      middle,
      {
        target: "#btn-app-menu",
        expect: { selector: "#app-menu", visible: false },
        closing: true,
      },
    ],
  };
}

test("a beat that fails still lets the closing beat close what was opened, and the failure is reported", async () => {
  const { doc, state } = menuPage();

  const outcome = await performStep(welcomeStep({ target: "#not-on-this-page", point: true }), {
    doc,
    wait: noWait,
  });

  assert.equal(outcome.ok, false, "the failure is not hidden");
  assert.match(outcome.reason, /^welcome\/2: no control matched #not-on-this-page/);
  assert.equal(state.menuOpen, false, "the menu the first beat opened is closed again");
});

test("a failure before anything was opened does not open the menu by running the closing beat", async () => {
  const { doc, state } = menuPage();
  const step = welcomeStep({ target: "#btn-app-menu", point: true });
  step.demonstrate[0] = { target: "#not-on-this-page", point: true };

  const outcome = await performStep(step, { doc, wait: noWait });

  assert.equal(outcome.ok, false);
  assert.match(outcome.reason, /^welcome\/1:/);
  assert.equal(state.menuOpen, false);
  assert.deepEqual(
    state.taps,
    [],
    "the closing beat found its outcome already true and did not tap",
  );
});
