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
  buildPendingSessionsItem,
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
