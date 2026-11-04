// tests/unit_js/modules/demo/demoHand.test.mjs
// The path the hand takes round a control it only points at (src/modules/demo/demoHand.js,
// `ringAround` and `circlePoints`).
//
// Show me on the welcome card points at the SANDBOX badge and at a row of the ☰ menu. It taps
// neither, so it plays no tap: the hand goes round the control twice. These pin the promise a viewer
// depends on: the path is AROUND the control, never across it, and it stays on the screen.

import assert from "node:assert/strict";
import { test } from "node:test";

import { circlePoints, ringAround } from "../../../../src/modules/demo/demoHand.js";
import { CIRCLE_LAPS } from "../../../../src/modules/demo/demoPace.js";

const PHONE = { width: 390, height: 844 };

function inside(point, box) {
  return (
    point.x >= box.left &&
    point.x <= box.left + box.width &&
    point.y >= box.top &&
    point.y <= box.top + box.height
  );
}

test("the hand goes round the control twice, and never across it", () => {
  const badge = { left: 150, top: 300, width: 90, height: 20 };
  const points = circlePoints(ringAround(badge, PHONE), CIRCLE_LAPS);

  assert.equal(CIRCLE_LAPS, 2, "two laps, so that the pointing is unmistakable");
  assert.ok(points.length > 2 * 16, "enough points that a lap reads as a curve");
  assert.deepEqual(points.at(-1), points[0], "the laps close where they began");
  for (const point of points)
    assert.ok(!inside(point, badge), `${point.x},${point.y} is on the badge`);
});

test("a control at the top edge gets a flatter ring that stays on the screen", () => {
  // The SANDBOX badge sits in the header, a few pixels below the top of the screen.
  const badge = { left: 150, top: 8, width: 90, height: 20 };
  const points = circlePoints(ringAround(badge, PHONE), 1);

  for (const point of points) {
    assert.ok(point.y >= 0, `${point.x},${point.y} is above the screen`);
    assert.ok(point.x >= 0 && point.x <= PHONE.width, `${point.x},${point.y} is off the side`);
  }
});

test("a wide menu row is circled without cutting its corners", () => {
  // "Leave the sandbox" in the ☰ menu: much wider than tall. An ellipse round it crossed its corners.
  const row = { left: 60, top: 200, width: 270, height: 44 };
  for (const point of circlePoints(ringAround(row, PHONE), 1)) {
    assert.ok(!inside(point, row), `${point.x},${point.y} is on the row`);
  }
});

test("a control as wide as the screen is circled inside the screen", () => {
  const row = { left: 4, top: 200, width: 382, height: 44 };
  const ring = ringAround(row, PHONE);

  assert.ok(ring.cx - ring.rx >= 0);
  assert.ok(ring.cx + ring.rx <= PHONE.width);
});
