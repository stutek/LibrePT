// tests/unit_js/domain/sessionFilters.test.mjs — the board's filters as rules (TODO §45.6).
//
// Unit tier: these are four strings and two pure functions. What is pinned here is the CLICK MODEL,
// because it is the part that was argued over and the part a person's expectations are built on —
// documented practice says the third tap starts over, and two models we invented (alternating taps,
// "the nearer end moves") are deliberately absent.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  NO_SESSION_FILTERS,
  filterSessions,
  filtersIncludingDay,
  hasAnyFilter,
  isSingleDay,
  locationsOf,
  nextDateSelection,
  participantsOf,
} from "../../../src/domain/sessionFilters.js";

const dateOf = (session) => session.day;

test("the first tap filters to that one day", () => {
  const picked = nextDateSelection(NO_SESSION_FILTERS, "2026-09-11");

  assert.deepEqual(picked, { from: "2026-09-11", to: "2026-09-11" });
  assert.equal(isSingleDay(picked), true);
});

test("tapping the same day again clears the date filter", () => {
  const one = nextDateSelection(NO_SESSION_FILTERS, "2026-09-11");

  assert.deepEqual(nextDateSelection(one, "2026-09-11"), { from: "", to: "" });
});

test("a second tap on another day makes the range between them", () => {
  const one = nextDateSelection(NO_SESSION_FILTERS, "2026-09-11");

  assert.deepEqual(nextDateSelection(one, "2026-09-15"), {
    from: "2026-09-11",
    to: "2026-09-15",
  });
});

test("a day BEFORE the start becomes the start, never an inverted range", () => {
  // Syncfusion and airbnb/react-dates both do this, and a range that reads backwards would filter
  // nothing at all while looking like a selection.
  const one = nextDateSelection(NO_SESSION_FILTERS, "2026-09-15");

  assert.deepEqual(nextDateSelection(one, "2026-09-11"), {
    from: "2026-09-11",
    to: "2026-09-15",
  });
});

test("once a range stands, the next tap starts over from that day", () => {
  // The behaviour a trainer arrives already knowing (eBay's design system states it outright). NOT
  // an alternating move of one end: that would make the next tap's meaning depend on a count of the
  // taps before it, which is nowhere on screen.
  const range = { from: "2026-09-11", to: "2026-09-15" };

  assert.deepEqual(nextDateSelection(range, "2026-09-20"), {
    from: "2026-09-20",
    to: "2026-09-20",
  });
  // Including a tap INSIDE the range — there is no second rule for inside days, because a day
  // between the ends is covered by the range, not chosen.
  assert.deepEqual(nextDateSelection(range, "2026-09-13"), {
    from: "2026-09-13",
    to: "2026-09-13",
  });
});

test("an armed end moves on its own, and re-orders if it crosses the other", () => {
  const range = { from: "2026-09-11", to: "2026-09-15" };

  assert.deepEqual(nextDateSelection(range, "2026-09-12", "from"), {
    from: "2026-09-12",
    to: "2026-09-15",
  });
  assert.deepEqual(nextDateSelection(range, "2026-09-30", "to"), {
    from: "2026-09-11",
    to: "2026-09-30",
  });
  // Dragged past the other end: the two swap rather than producing a backwards range.
  assert.deepEqual(nextDateSelection(range, "2026-09-01", "to"), {
    from: "2026-09-01",
    to: "2026-09-11",
  });
});

test("the three filters narrow independently and together", () => {
  const sessions = [
    { id: "a", day: "2026-09-11", participants: ["c1"], location: "Gym One" },
    { id: "b", day: "2026-09-12", participants: ["c1", "c2"], location: "Gym Two" },
    { id: "c", day: "2026-09-20", participants: ["c2"], location: "Gym One" },
  ];

  const byDate = filterSessions(sessions, { from: "2026-09-11", to: "2026-09-12" }, { dateOf });
  assert.deepEqual(
    byDate.map((s) => s.id),
    ["a", "b"],
  );

  const byClient = filterSessions(sessions, { clientId: "c2" }, { dateOf });
  assert.deepEqual(
    byClient.map((s) => s.id),
    ["b", "c"],
  );

  const together = filterSessions(
    sessions,
    { from: "2026-09-11", to: "2026-09-19", clientId: "c1", location: "Gym Two" },
    { dateOf },
  );
  assert.deepEqual(
    together.map((s) => s.id),
    ["b"],
  );
});

test("nothing set filters nothing out", () => {
  const sessions = [{ id: "a", day: "2026-09-11", participants: [], location: "" }];

  assert.equal(hasAnyFilter(NO_SESSION_FILTERS), false);
  assert.equal(filterSessions(sessions, NO_SESSION_FILTERS, { dateOf }).length, 1);
});

test("the controls offer only what is actually on the board", () => {
  // A filter that can select nothing wastes a tap and reads as a fault in the data.
  const sessions = [
    { id: "a", participants: ["c1"], location: "Gym One" },
    { id: "b", participants: ["c1"], location: "" },
  ];
  const clients = [
    { id: "c1", name: "Ana" },
    { id: "c9", name: "Nobody Here" },
  ];

  assert.deepEqual(locationsOf(sessions), ["Gym One"]);
  assert.deepEqual(participantsOf(sessions, clients), [{ id: "c1", name: "Ana" }]);
});

test("Today drops a date filter that leaves today out, and keeps everything else (TODO §77.7)", () => {
  const filtered = { from: "2026-09-07", to: "2026-09-07", clientId: "c1", location: "Gym One" };

  assert.deepEqual(filtersIncludingDay(filtered, "2026-09-24"), {
    from: "",
    to: "",
    clientId: "c1",
    location: "Gym One",
  });
  // A range that already holds today is what the trainer chose, and stays.
  const holdsToday = { ...NO_SESSION_FILTERS, from: "2026-09-20", to: "2026-09-30" };
  assert.deepEqual(filtersIncludingDay(holdsToday, "2026-09-24"), holdsToday);
  assert.deepEqual(filtersIncludingDay(NO_SESSION_FILTERS, "2026-09-24"), NO_SESSION_FILTERS);
});
