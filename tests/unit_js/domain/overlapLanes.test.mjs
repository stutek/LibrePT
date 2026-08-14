// tests/unit_js/domain/overlapLanes.test.mjs
// Overlapping-block lane layout (TODO §1.3, src/domain/overlapLanes.js).
//
// These pin the four decisions the layout actually rests on, each of which is invisible in the code
// and obvious on screen: touching blocks are sequential rather than clashing, width is shared per
// cluster rather than per day, a long block holds later ones in its cluster transitively, and the
// order is total so blocks never swap columns between renders.

import assert from "node:assert/strict";
import { test } from "node:test";
import { assignLanes } from "../../../src/domain/overlapLanes.js";

const at = (hhmm) => `2026-08-14T${hhmm}:00Z`;
const span = (id, from, to) => ({ id, start: at(from), end: at(to) });

/** lane/laneCount by item id, so assertions read as layout rather than as array indices. */
function layout(intervals) {
  const byId = {};
  for (const { item, lane, laneCount } of assignLanes(intervals)) {
    byId[item.id] = { lane, laneCount };
  }
  return byId;
}

test("a lone block gets the full width", () => {
  assert.deepEqual(layout([span("a", "09:00", "10:00")]), { a: { lane: 0, laneCount: 1 } });
});

test("partial overlaps sit side by side, both still rendered", () => {
  // §1.3's leading requirement: 10:00-11:00 and 10:30-11:30 must show the overlap rather than
  // stacking as if one followed the other.
  const result = layout([span("a", "10:00", "11:00"), span("b", "10:30", "11:30")]);
  assert.notEqual(result.a.lane, result.b.lane);
  assert.equal(result.a.laneCount, 2);
  assert.equal(result.b.laneCount, 2);
});

test("back-to-back sessions are sequential, not a clash", () => {
  // The `<` vs `<=` decision. Back-to-back is the normal gym-floor case, and rendering it at half
  // width all day would read as "these two clash" to the person the layout exists to inform.
  const result = layout([span("a", "10:00", "11:00"), span("b", "11:00", "12:00")]);
  assert.equal(result.a.laneCount, 1);
  assert.equal(result.b.laneCount, 1);
  assert.equal(result.a.lane, 0);
  assert.equal(result.b.lane, 0, "the freed lane is reused rather than a second one opened");
});

test("an unrelated later block keeps the full width", () => {
  // Width is per cluster, not per day. One overlapping pair in the morning must not squeeze an
  // afternoon session that collides with nothing.
  const result = layout([
    span("morning-a", "07:00", "08:00"),
    span("morning-b", "07:30", "08:30"),
    span("afternoon", "15:00", "16:00"),
  ]);
  assert.equal(result["morning-a"].laneCount, 2);
  assert.equal(result.afternoon.laneCount, 1);
  assert.equal(result.afternoon.lane, 0);
});

test("a long block holds later ones in its cluster transitively", () => {
  // `b` and `c` do not touch each other, but both collide with `a`, so all three share width. A
  // cluster walk that compared against the PREVIOUS interval's end rather than the running maximum
  // would break the cluster at `c` and draw it full width on top of `a`.
  const result = layout([
    span("a", "09:00", "13:00"),
    span("b", "09:30", "10:00"),
    span("c", "12:00", "12:30"),
  ]);
  assert.equal(result.a.laneCount, 2);
  assert.equal(result.c.laneCount, 2);
  assert.notEqual(result.a.lane, result.c.lane);
});

test("three mutual overlaps need three lanes", () => {
  const result = layout([
    span("a", "09:00", "12:00"),
    span("b", "09:30", "12:30"),
    span("c", "10:00", "13:00"),
  ]);
  assert.deepEqual(
    [result.a.lane, result.b.lane, result.c.lane].sort(),
    [0, 1, 2],
    "mutually overlapping blocks must not share a lane",
  );
  assert.equal(result.a.laneCount, 3);
});

test("a freed lane is reused by a later block in the same cluster", () => {
  // a: 09:00-10:00, b: 09:30-11:30, c: 10:00-11:00. `c` can take the lane `a` vacated, so the
  // cluster needs two lanes rather than three.
  const result = layout([
    span("a", "09:00", "10:00"),
    span("b", "09:30", "11:30"),
    span("c", "10:00", "11:00"),
  ]);
  assert.equal(result.a.laneCount, 2);
  assert.equal(result.a.lane, 0);
  assert.equal(result.c.lane, 0);
  assert.equal(result.b.lane, 1);
});

test("input order does not change the layout", () => {
  const spans = [
    span("a", "09:00", "10:30"),
    span("b", "09:15", "10:00"),
    span("c", "11:00", "12:00"),
  ];
  const forward = layout(spans);
  const reversed = layout([...spans].reverse());
  assert.deepEqual(forward, reversed, "a re-render must not shuffle blocks between columns");
});

test("Dates and epoch milliseconds work as well as RFC3339 strings", () => {
  // The occupancy grid draws Google's freeBusy strings and the local store's own values together;
  // converting at each call site is how the two drift.
  const result = layout([
    { id: "iso", start: at("09:00"), end: at("10:00") },
    { id: "date", start: new Date(at("09:30")), end: new Date(at("10:30")) },
    { id: "ms", start: Date.parse(at("09:45")), end: Date.parse(at("11:00")) },
  ]);
  assert.equal(result.iso.laneCount, 3);
  assert.deepEqual([result.iso.lane, result.date.lane, result.ms.lane].sort(), [0, 1, 2]);
});

test("no intervals is an empty layout, not a crash", () => {
  assert.deepEqual(assignLanes([]), []);
  assert.deepEqual(assignLanes(undefined), []);
});

test("the caller's own record is handed back untouched", () => {
  // The renderer needs the session behind the block. Returning a copy would silently break identity
  // checks against the store.
  const session = span("a", "09:00", "10:00");
  const [placed] = assignLanes([session]);
  assert.equal(placed.item, session);
  assert.equal("lane" in session, false, "the input record must not be mutated");
});
