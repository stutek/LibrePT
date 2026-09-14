// tests/unit_js/domain/clientSessionNeighbours.test.mjs
// The one rule these tests exist to protect (Simon, 2026-09-14): stepping between sessions moves
// through THIS client's own history and schedule, never through every trainer's sessions in
// calendar order — a session belonging to a different client must never surface as a neighbour.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clientSessionNeighbours,
  clientSessionToday,
} from "../../../src/domain/clientSessionNeighbours.js";

const history = (over = {}) => ({
  id: "h1",
  clientId: "ana",
  clientName: "Ana",
  routineName: "Strength A",
  date: "2026-09-01",
  duration: 3600,
  exercises: [],
  feedback: [],
  ...over,
});

const session = (over = {}) => ({
  id: "s1",
  title: "Session",
  time: "18:00 - 19:00",
  startDate: "2026-09-10T18:00:00.000Z",
  location: "",
  participants: ["ana"],
  routineId: "r1",
  ...over,
});

test("today's session: previous is the client's last finished session, next is the next scheduled one", () => {
  const state = {
    history: [history({ id: "h1", date: "2026-09-08" })],
    sessions: [
      session({ id: "s1", startDate: "2026-09-14T18:00:00.000Z" }),
      session({ id: "s2", startDate: "2026-09-21T18:00:00.000Z" }),
    ],
  };
  const { previous, next } = clientSessionNeighbours(state, "ana", {
    date: "2026-09-14",
    id: "s1",
  });
  assert.equal(previous.kind, "history");
  assert.equal(previous.id, "h1");
  assert.equal(next.kind, "session");
  assert.equal(next.id, "s2");
});

test("stepping back from a past history record finds an earlier one still", () => {
  const state = {
    history: [history({ id: "h1", date: "2026-08-01" }), history({ id: "h2", date: "2026-08-15" })],
    sessions: [],
  };
  const { previous, next } = clientSessionNeighbours(state, "ana", {
    date: "2026-08-15",
    id: "h2",
  });
  assert.equal(previous.id, "h1");
  assert.equal(next, null);
});

test("other clients' records and sessions are never neighbours", () => {
  const state = {
    history: [history({ id: "h1", clientId: "ben", date: "2026-09-01" })],
    sessions: [session({ id: "s1", participants: ["ben"], startDate: "2026-09-20T18:00:00.000Z" })],
  };
  const { previous, next } = clientSessionNeighbours(state, "ana", {
    date: "2026-09-14",
    id: "current",
  });
  assert.equal(previous, null);
  assert.equal(next, null);
});

test("planning draft is used only when there is no later scheduled session", () => {
  const draft = history({ id: "d1", isPlanning: true, date: "2026-09-14", title: "Next up" });
  const withScheduled = clientSessionNeighbours(
    {
      history: [draft],
      sessions: [session({ id: "s1", startDate: "2026-09-20T18:00:00.000Z" })],
    },
    "ana",
    { date: "2026-09-10", id: "anchor" },
  );
  assert.equal(withScheduled.next.kind, "session");

  const withoutScheduled = clientSessionNeighbours({ history: [draft], sessions: [] }, "ana", {
    date: "2026-09-10",
    id: "anchor",
  });
  assert.equal(withoutScheduled.next.kind, "draft");
  assert.equal(withoutScheduled.next.id, "d1");
});

test("null on both sides when the client has nothing before or after", () => {
  const state = { history: [], sessions: [] };
  const { previous, next } = clientSessionNeighbours(state, "ana", {
    date: "2026-09-14",
    id: "anchor",
  });
  assert.equal(previous, null);
  assert.equal(next, null);
});

test("the anchor record itself is never returned, even sharing its own date", () => {
  const state = {
    history: [history({ id: "h1", date: "2026-09-14" })],
    sessions: [],
  };
  const { previous, next } = clientSessionNeighbours(state, "ana", {
    date: "2026-09-14",
    id: "h1",
  });
  assert.equal(previous, null);
  assert.equal(next, null);
});

test("a tie on the same date is broken by id, ascending", () => {
  const state = {
    history: [history({ id: "b", date: "2026-09-01" }), history({ id: "a", date: "2026-09-01" })],
    sessions: [],
  };
  const { previous } = clientSessionNeighbours(state, "ana", {
    date: "2026-09-14",
    id: "anchor",
  });
  // Both records share a date before the anchor; the documented tie rule (id ascending) picks
  // the later-sorting id as "closest" to the anchor.
  assert.equal(previous.id, "b");
});

test("stepping forward from a past record reaches the client's next finished session first", () => {
  const state = {
    history: [
      history({ id: "h1", date: "2026-09-08T18:00:00.000Z" }),
      history({ id: "h2", date: "2026-09-11T18:00:00.000Z" }),
    ],
    sessions: [session({ id: "today", startDate: "2026-09-14T18:00:00.000Z" })],
  };
  const { next } = clientSessionNeighbours(state, "ana", { date: "2026-09-08", id: "h1" });
  assert.equal(next.kind, "history");
  assert.equal(next.id, "h2");
});

test("a finished day is reached through its history record, not its scheduled session row", () => {
  const state = {
    history: [history({ id: "h2", date: "2026-09-11T19:00:00.000Z" })],
    sessions: [
      session({ id: "s-old", startDate: "2026-09-11T18:00:00.000Z" }),
      session({ id: "today", startDate: "2026-09-14T18:00:00.000Z" }),
    ],
  };
  const { next } = clientSessionNeighbours(state, "ana", { date: "2026-09-08", id: "h1" });
  assert.equal(next.id, "h2");
});

test("neighbours are other DAYS: a record later on the anchor's own day is not the previous one", () => {
  // Today's session anchors at its start; the record written when it finishes carries a later
  // time on the same day. Comparing full timestamps would call it "next", and by id "previous".
  const state = {
    history: [
      history({ id: "h-today", date: "2026-09-14T19:05:00.000Z" }),
      history({ id: "h1", date: "2026-09-08" }),
    ],
    sessions: [],
  };
  const { previous, next } = clientSessionNeighbours(state, "ana", {
    date: "2026-09-14T18:00:00.000Z",
    id: "today",
  });
  assert.equal(previous.id, "h1");
  assert.equal(next, null);
});

test("missing arrays on state are treated as empty rather than throwing", () => {
  const { previous, next } = clientSessionNeighbours({}, "ana", { date: "2026-09-14", id: "x" });
  assert.equal(previous, null);
  assert.equal(next, null);
});

// ---- clientSessionToday: where the clipboard's Today control leads back to (TODO §52.2 step 4) ----

const NOW = Date.parse("2026-09-14T12:00:00.000Z");

test("today: the client's scheduled session on today's date", () => {
  const state = {
    history: [history({ id: "h1", date: "2026-09-08" })],
    sessions: [
      session({ id: "s1", startDate: "2026-09-14T18:00:00.000Z" }),
      session({ id: "s2", startDate: "2026-09-21T18:00:00.000Z" }),
    ],
  };
  const today = clientSessionToday(state, "ana", NOW);
  assert.equal(today.kind, "session");
  assert.equal(today.id, "s1");
});

test("today: a day already finished answers with its history record, not the scheduled row", () => {
  const state = {
    history: [history({ id: "h9", date: "2026-09-14T19:05:00.000Z" })],
    sessions: [session({ id: "s1", startDate: "2026-09-14T18:00:00.000Z" })],
  };
  assert.equal(clientSessionToday(state, "ana", NOW).id, "h9");
});

test("today: null when the client has nothing today, and another client's session never counts", () => {
  const state = {
    history: [history({ id: "hDraft", date: "2026-09-14", isPlanning: true })],
    sessions: [
      session({ id: "sBen", participants: ["ben"], startDate: "2026-09-14T18:00:00.000Z" }),
      session({ id: "sAnaLater", startDate: "2026-09-15T18:00:00.000Z" }),
    ],
  };
  assert.equal(clientSessionToday(state, "ana", NOW), null);
});
