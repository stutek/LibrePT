// tests/unit_js/domain/notificationItems.test.mjs
// The feed mixes two kinds of item and the difference matters:
//
//   • STORED items carry i18n KEYS, not text, so the feed re-localises on a language switch instead
//     of freezing whatever language it was written in.
//   • SYNTHETIC items are computed fresh and never stored — they are not messages, they are WORK the
//     trainer still owes a client. Storing them would mean a second copy of a truth that already
//     lives in state.history / state.planUpdates, and the two would drift.
//
// Synthetic items lead, because outstanding work outranks FYI.
//
// Pinned here rather than in a browser as of TODO §24.7.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCrashReportItem,
  buildPendingSessionsItem,
  buildRsvpAnswersItem,
  buildUnscheduledPlansItem,
  resolveNotificationItems,
} from "../../../src/domain/notificationItems.js";

// A translator that marks what it touched, so a test can tell a resolved key from a literal. The
// `_desc` keys keep the {count} placeholder, because a real dictionary's descriptions carry one and
// the substitution is part of what is being tested.
const t = (key) => {
  if (key.endsWith("_desc")) return `[${key}] {count}`;
  if (key.startsWith("notif_") || key === "planned_program") return `[${key}]`;
  return "";
};

test("an empty app produces an empty feed, not placeholder noise", () => {
  assert.deepEqual(resolveNotificationItems({}, t, []), []);
  assert.equal(buildUnscheduledPlansItem({}, t), null);
  assert.equal(buildPendingSessionsItem({}, t), null);
});

test("every drafted plan gets its own resume action", () => {
  const state = {
    history: [
      { id: "h1", isPlanning: true, title: "Winter block", clientName: "Ana" },
      { id: "h2", isPlanning: true, title: "", clientName: "Bo" },
      { id: "h3", clientName: "Cy" }, // completed history, not a draft
    ],
  };

  const item = buildUnscheduledPlansItem(state, t);

  assert.equal(item.description.includes("2"), true, "the count excludes completed history");
  assert.deepEqual(
    item.actions.map((action) => action.resumePlanId),
    ["h1", "h2"],
  );
  // A draft with no title still needs a label a trainer can aim at.
  assert.equal(item.actions[1].label.startsWith("[planned_program]"), true);
});

test("pending feedback is grouped by client, counted per client", () => {
  const state = {
    planUpdates: [
      { id: "u1", clientId: "c1", clientName: "Ana", resolved: false },
      { id: "u2", clientId: "c1", clientName: "Ana", resolved: false },
      { id: "u3", clientId: "c2", clientName: "Bo", resolved: false },
      { id: "u4", clientId: "c3", clientName: "Cy", resolved: true },
    ],
    sessions: [{ id: "s1", title: "Group S&C", participants: ["c1"] }],
  };

  const item = buildPendingSessionsItem(state, t);

  assert.equal(item.description.includes("2"), true, "two CLIENTS, not three signals");
  assert.deepEqual(
    item.actions.map((action) => action.label),
    ["Ana — Group S&C (2)", "Bo (1)"],
    "a client with a known session gets the friendlier label; the other falls back to a name",
  );
  assert.equal(
    item.actions.every((action) => action.view === "/adjustments"),
    true,
  );
});

test("a resolved signal is not pending", () => {
  const state = { planUpdates: [{ id: "u1", clientId: "c1", clientName: "Ana", resolved: true }] };
  assert.equal(buildPendingSessionsItem(state, t), null);
});

test("stored items resolve their i18n keys, and pass literals through untouched", () => {
  const state = {
    notifications: [
      {
        id: "n1",
        type: "info",
        icon: "fa-solid fa-bell",
        titleKey: "notif_demo_title",
        descKey: "notif_demo_desc",
        actions: [{ labelKey: "notif_demo_action", url: "/x", primary: true }],
      },
      {
        id: "n2",
        type: "info",
        title: "Literal title",
        description: "Literal body",
        actions: [{ label: "Literal action", view: "/history" }],
      },
    ],
  };

  const [keyed, literal] = resolveNotificationItems(state, t, []);

  assert.equal(keyed.title, "[notif_demo_title]");
  assert.equal(keyed.actions[0].label, "[notif_demo_action]");
  assert.equal(keyed.actions[0].primary, true, "non-text fields pass through");
  assert.equal(literal.title, "Literal title");
  assert.equal(literal.actions[0].view, "/history");
});

test("work the trainer owes leads the feed, ahead of FYI messages", () => {
  const state = {
    notifications: [{ id: "n1", title: "FYI", actions: [] }],
    history: [{ id: "h1", isPlanning: true, title: "Draft", clientName: "Ana" }],
    planUpdates: [{ id: "u1", clientId: "c1", clientName: "Ana", resolved: false }],
  };

  assert.deepEqual(
    resolveNotificationItems(state, t, []).map((item) => item.id),
    ["synthetic-unscheduled-plans", "synthetic-pending-sessions", "n1"],
  );
});

test("read state applies to synthetic items too, or they could never be dismissed", () => {
  const state = {
    notifications: [{ id: "n1", title: "FYI", actions: [] }],
    history: [{ id: "h1", isPlanning: true, title: "Draft", clientName: "Ana" }],
  };

  const items = resolveNotificationItems(state, t, ["synthetic-unscheduled-plans"]);

  assert.equal(items[0].read, true);
  assert.equal(items[1].read, false);
  // Defaulting to "nothing read" must not throw — this is the mark-all-read path's call shape.
  assert.equal(resolveNotificationItems(state, t)[0].read, false);
});

test("a failed sync leads the feed, ahead of the work items", () => {
  // Once a header tap syncs directly instead of opening the Sync & Backup dialog (TODO §3.11), the
  // feed is where a failure lives. Everything else here is work waiting; this is something the
  // trainer asked for that did not happen, so it goes first or it is missed.
  const state = {
    notifications: [{ id: "n1", title: "FYI", actions: [] }],
    history: [{ id: "h1", isPlanning: true, title: "Draft", clientName: "Ana" }],
  };
  const failure = { at: 1_700_000_000_000, message: "Session expired — tap to reconnect." };

  const items = resolveNotificationItems(state, t, [], failure);

  assert.equal(items[0].type, "warning");
  assert.equal(items[0].description, failure.message);
  assert.deepEqual(
    items.slice(1).map((item) => item.id),
    ["synthetic-unscheduled-plans", "n1"],
  );
});

test("a later failure arrives unread even after the previous one was dismissed", () => {
  // The id carries the failure's timestamp precisely for this: a fixed id would be marked read
  // once and then stay silent for every failure after it — the feed going quiet exactly when it
  // has something to say.
  const state = {};
  const first = { at: 1, message: "first" };
  const second = { at: 2, message: "second" };

  const dismissed = resolveNotificationItems(state, t, [], first)[0].id;
  assert.equal(resolveNotificationItems(state, t, [dismissed], first)[0].read, true);
  assert.equal(resolveNotificationItems(state, t, [dismissed], second)[0].read, false);
});

test("no failure means no card at all, not an empty one", () => {
  assert.equal(resolveNotificationItems({}, t, [], null).length, 0);
  assert.equal(resolveNotificationItems({}, t, []).length, 0);
});

// --- Answers that came back (TODO §1.6). Synthetic, like every other item derived from state: an
// RSVP already lives on the invitation, and a stored copy would ride into the backup and the Drive
// snapshot as a second source of truth for the same fact. ---

test("answers that came back are surfaced, so a tap on a reply link is visibly not a no-op", () => {
  const state = {
    invites: [
      {
        id: "i1",
        sessionId: "s1",
        clientId: "c1",
        status: "answered",
        answer: "yes",
        answeredAt: "2026-08-17T18:00:00.000Z",
      },
      { id: "i2", sessionId: "s1", clientId: "c2", status: "sent" },
    ],
    clients: [
      { id: "c1", name: "Jana Novak" },
      { id: "c2", name: "Mark Kos" },
    ],
    sessions: [{ id: "s1", title: "Group Strength", participants: ["c1", "c2"] }],
  };

  const item = buildRsvpAnswersItem(state, (key) => key);

  assert.ok(item, "an answered invitation produces an item");
  assert.ok(item.description.includes("Jana Novak"), "it names who answered");
  assert.equal(
    item.description.includes("Mark Kos"),
    false,
    "an unanswered invite is not an answer",
  );
});

test("nothing is said when nobody has answered", () => {
  const quiet = {
    invites: [{ id: "i1", sessionId: "s1", clientId: "c1", status: "sent" }],
    clients: [],
    sessions: [],
  };

  assert.equal(
    buildRsvpAnswersItem(quiet, (key) => key),
    null,
  );
  assert.equal(
    buildRsvpAnswersItem({}, (key) => key),
    null,
  );
});

test("an answer from someone no longer in the register still reports itself", () => {
  // The client may have been erased (§27.2) between answering and the trainer opening the link. The
  // answer is still a fact about an invitation, and silently dropping it would lose it.
  const state = {
    invites: [{ id: "i1", sessionId: "s1", clientId: "gone", status: "answered", answer: "no" }],
    clients: [],
    sessions: [],
  };

  const item = buildRsvpAnswersItem(state, (key) => key);

  assert.ok(item, "the answer is still reported");
});

// --- A crash the trainer can report (TODO §12.4). Synthetic, and deliberately the LAST thing offered:
// it must never interrupt a live session, and a modal over a set is worse than the original bug. ---

test("a captured crash is offered as something to report, not as an alert", () => {
  const item = buildCrashReportItem(
    [
      {
        message: "Cannot read properties of undefined",
        stack: "at deck.js:7",
        build: "abc1234",
        count: 1,
      },
    ],
    (key) => key,
    "https://github.com/stutek/LibrePT",
  );

  assert.ok(item);
  assert.match(item.description, /Cannot read properties/);
  // A link the trainer chooses to follow — never an automatic send, because there is no server and an
  // issue is public.
  assert.equal(item.actions.length, 1);
  assert.match(item.actions[0].url, /issues\/new/);
});

test("a crash that repeated says so, because once and forty times are different bugs", () => {
  const item = buildCrashReportItem(
    [{ message: "boom", stack: "at x.js:1", build: "b", count: 40 }],
    (key) => key,
    "https://github.com/stutek/LibrePT",
  );

  assert.match(item.description, /40/);
});

test("no crashes, no item", () => {
  assert.equal(
    buildCrashReportItem([], (key) => key, "https://x/y"),
    null,
  );
  assert.equal(
    buildCrashReportItem(undefined, (key) => key, "https://x/y"),
    null,
  );
});

test("with nowhere to report it, nothing is offered rather than a dead link", () => {
  assert.equal(
    buildCrashReportItem([{ message: "boom", count: 1 }], (key) => key, ""),
    null,
  );
});

// ── Schedule churn, accumulated (TODO §28.10) ──────────────────────────────────────────────────
// Every cancellation and booking used to arrive as its own card, so an evening where three clients
// rearranged pushed everything else off a phone screen. They are the same KIND of news — "who is
// coming, who is not" — so they belong on one card, one line each.

const scheduleFeed = (...notifications) => ({ notifications });

const booking = (id, description) => ({
  id,
  type: "reservation",
  icon: "fa-solid fa-calendar-check",
  title: "Spot booked",
  description,
  actions: [],
});

const cancellation = (id, description) => ({
  id,
  type: "cancellation",
  icon: "fa-solid fa-calendar-xmark",
  title: "Spot cancelled",
  description,
  actions: [],
});

test("bookings and cancellations accumulate on one card, one line each", () => {
  const items = resolveNotificationItems(
    scheduleFeed(
      booking("b1", "Ana booked Tuesday 18:00"),
      cancellation("c1", "Marko cancelled Wednesday 07:00"),
      cancellation("c2", "Eva cancelled Thursday 19:30"),
    ),
    t,
    [],
  );

  assert.equal(items.length, 1, "three arrivals, one card");
  const [card] = items;
  for (const line of [
    "Ana booked Tuesday 18:00",
    "Marko cancelled Wednesday 07:00",
    "Eva cancelled Thursday 19:30",
  ]) {
    assert.ok(card.description.includes(line), `missing line: ${line}`);
  }
});

test("the accumulated card sits where its first arrival did, not at the top", () => {
  // The demo-mode notice is deliberately first — it is what a trainer reads collapsed. Grouping
  // must not reorder the feed around it.
  const items = resolveNotificationItems(
    scheduleFeed(
      { id: "demo", type: "demo-mode", title: "Demo data", description: "…", actions: [] },
      booking("b1", "Ana booked Tuesday 18:00"),
      { id: "welcome", type: "info", title: "Welcome", description: "…", actions: [] },
      cancellation("c1", "Marko cancelled Wednesday 07:00"),
    ),
    t,
    [],
  );

  assert.deepEqual(
    items.map((item) => item.title),
    ["Demo data", "Spot booked", "Welcome"],
    "the group takes the place of the first of its members",
  );
});

test("a new arrival makes the card unread again, even after the earlier ones were dismissed", () => {
  const first = resolveNotificationItems(scheduleFeed(booking("b1", "Ana booked")), t, []);
  const dismissed = [first[0].id];
  assert.equal(
    resolveNotificationItems(scheduleFeed(booking("b1", "Ana booked")), t, dismissed)[0].read,
    true,
  );

  const afterCancellation = resolveNotificationItems(
    scheduleFeed(booking("b1", "Ana booked"), cancellation("c1", "Marko cancelled")),
    t,
    dismissed,
  );
  assert.equal(
    afterCancellation[0].read,
    false,
    "news the trainer has not seen must not inherit a dismissal",
  );
});

test("one arrival on its own is still just that message", () => {
  const [card] = resolveNotificationItems(
    scheduleFeed(cancellation("c1", "Marko cancelled")),
    t,
    [],
  );

  assert.equal(card.description, "Marko cancelled");
  assert.equal(card.title, "Spot cancelled", "a single cancellation reads as itself");
});
