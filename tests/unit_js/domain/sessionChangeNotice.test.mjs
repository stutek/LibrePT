// tests/unit_js/domain/sessionChangeNotice.test.mjs
// What kind of session edit is worth telling a client about (src/domain/sessionChangeNotice.js) — §1.6.
//
// Asked for 2026-08-17 (Simon): "when a session gets changed, PT should be asked if they want to resend
// invitations". The asking is the easy half. The half that decides whether the feature is useful or
// annoying is WHICH changes count: prompt on everything and a trainer fixing a typo is asked to spam six
// people, so they learn to dismiss it — and then miss the prompt on the change that actually mattered.
//
// The test: would the client, standing somewhere at some time, do something different? Time, date,
// place — yes. A renamed session or a reshuffled plan — no, that is the trainer's own bookkeeping.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clientsToNotify,
  materialSessionChanges,
} from "../../../src/domain/sessionChangeNotice.js";

const BEFORE = {
  id: "s1",
  title: "Group Strength",
  startDate: "2026-08-20T18:00:00.000Z",
  time: "18:00 - 19:00",
  location: "Studio 2",
  participants: ["c1", "c2"],
};

test("a new time is a change the client has to hear about", () => {
  const changes = materialSessionChanges(BEFORE, {
    ...BEFORE,
    startDate: "2026-08-20T19:00:00.000Z",
    time: "19:00 - 20:00",
  });

  assert.ok(changes.includes("time"), "the slot moved");
});

test("a new place is too, because it decides where someone drives", () => {
  const changes = materialSessionChanges(BEFORE, { ...BEFORE, location: "Studio 5" });

  assert.deepEqual(changes, ["location"]);
});

test("renaming a session is the trainer's own bookkeeping, and nobody is asked to resend for it", () => {
  // The prompt has to stay rare to stay read. A title is how the trainer finds the session in a list;
  // it changes nothing about where a client stands or when.
  assert.deepEqual(materialSessionChanges(BEFORE, { ...BEFORE, title: "Group Strength A" }), []);
});

test("editing the plan inside a session is not a reason to re-invite anyone", () => {
  // Swapping an exercise happens constantly, including mid-session. A client does not need a new
  // invitation because the second movement changed.
  const changes = materialSessionChanges(BEFORE, { ...BEFORE, routineId: "r9", maxCapacity: 8 });

  assert.deepEqual(changes, []);
});

test("nothing changed means nothing to ask", () => {
  assert.deepEqual(materialSessionChanges(BEFORE, { ...BEFORE }), []);
  assert.deepEqual(materialSessionChanges(BEFORE, BEFORE), []);
});

test("a session that did not exist before is not a change to it", () => {
  // Creating a session already opens the invite dialog on its own; treating creation as a "change"
  // would ask twice about the same invitations.
  assert.deepEqual(materialSessionChanges(null, BEFORE), []);
});

test("only clients who were actually invited are offered a resend", () => {
  // Decided the same day: "not all attendees need an invitation, some will be added manually." Someone
  // the trainer wrote in by hand was never sent anything, so there is nothing to RE-send them — and
  // silently sending them a first invitation off the back of a time change is not what was asked.
  const invites = [
    { id: "i1", sessionId: "s1", clientId: "c1", status: "sent" },
    { id: "i2", sessionId: "s1", clientId: "c2", status: "answered", answer: "yes" },
    { id: "i3", sessionId: "s2", clientId: "c3", status: "sent" },
  ];

  const notify = clientsToNotify(invites, "s1", ["c1", "c2", "walk-in"]);

  assert.deepEqual(notify, ["c1", "c2"]);
});

test("a client who has left the session is not chased about it", () => {
  // They were invited and then taken off the participant list; a resend would invite them to something
  // they are no longer part of.
  const invites = [{ id: "i1", sessionId: "s1", clientId: "c1", status: "sent" }];

  assert.deepEqual(clientsToNotify(invites, "s1", ["c2"]), []);
});

test("no invitations means the prompt never appears", () => {
  assert.deepEqual(clientsToNotify([], "s1", ["c1"]), []);
  assert.deepEqual(clientsToNotify(undefined, "s1", ["c1"]), []);
});
