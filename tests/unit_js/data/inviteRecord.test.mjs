// tests/unit_js/data/inviteRecord.test.mjs
// The invitation record, which is where an RSVP lives (src/data/inviteRecord.js) — TODO §1.6.
//
// **Decided 2026-08-17 (Simon):** "invites should host the RSVP status, sessions should host
// attendees list (by reference only for easier anonymization)", and "not all attendees need an
// invitation, some will be added manually". Both halves matter to these tests:
//
//   - An RSVP is a fact about an INVITATION — it was sent, and this came back. It is not a property of
//     a person, and not a property of a session.
//   - `session.participants` stays the authoritative attendee list. An invite is evidence of a message
//     sent, so a session can have attendees with no invite at all, and that must stay ordinary rather
//     than looking like missing data.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  INVITE_ANSWERED,
  INVITE_SENT,
  buildInvite,
  findInviteFor,
  inviteStatusFor,
  recordRsvp,
} from "../../../src/data/inviteRecord.js";

const invites = () => [
  buildInvite({
    id: "i1",
    sessionId: "s1",
    clientId: "c1",
    channel: "email",
    sentAt: "2026-08-17T09:00:00.000Z",
  }),
];

test("an invitation records that a message was sent, and nothing about an answer yet", () => {
  const invite = buildInvite({
    id: "i1",
    sessionId: "s1",
    clientId: "c1",
    channel: "sms",
    sentAt: "2026-08-17T09:00:00.000Z",
  });

  assert.equal(invite.sessionId, "s1");
  assert.equal(invite.clientId, "c1");
  assert.equal(invite.status, INVITE_SENT);
  assert.equal(invite.answer, undefined, "no answer until one comes back");
});

test("an invitation that cannot name a session and a client is not an invitation", () => {
  assert.equal(buildInvite({ id: "i1", sessionId: "s1" }), null);
  assert.equal(buildInvite({ id: "i1", clientId: "c1" }), null);
  assert.equal(buildInvite(null), null);
});

test("an answer lands on the invitation it answers", () => {
  const register = invites();

  const updated = recordRsvp(
    register,
    { sessionId: "s1", clientId: "c1", answer: "yes" },
    {
      now: "2026-08-17T18:30:00.000Z",
      newId: () => "should-not-be-used",
    },
  );

  assert.equal(updated.length, 1, "the existing invitation was answered, not duplicated");
  assert.equal(updated[0].id, "i1");
  assert.equal(updated[0].answer, "yes");
  assert.equal(updated[0].status, INVITE_ANSWERED);
  assert.equal(updated[0].answeredAt, "2026-08-17T18:30:00.000Z");
  // What was sent is still on the record: the answer is added to the evidence, not swapped for it.
  assert.equal(updated[0].sentAt, "2026-08-17T09:00:00.000Z");
  assert.equal(updated[0].channel, "email");
});

test("a client who changes their mind overwrites their own answer rather than adding a second", () => {
  let register = recordRsvp(
    invites(),
    { sessionId: "s1", clientId: "c1", answer: "yes" },
    {
      now: "2026-08-17T18:30:00.000Z",
    },
  );

  register = recordRsvp(
    register,
    { sessionId: "s1", clientId: "c1", answer: "no" },
    {
      now: "2026-08-18T07:00:00.000Z",
    },
  );

  assert.equal(register.length, 1);
  assert.equal(register[0].answer, "no");
  assert.equal(
    register[0].answeredAt,
    "2026-08-18T07:00:00.000Z",
    "the latest answer is the answer",
  );
});

test("an answer with no invitation on this device is still recorded, because it is evidence one was sent", () => {
  // The trainer may have sent the invite from another phone, or before this build stored invitations
  // at all. Dropping the answer would lose the one thing that actually came back from the client.
  const register = recordRsvp(
    [],
    { sessionId: "s1", clientId: "c9", answer: "maybe" },
    {
      now: "2026-08-17T18:30:00.000Z",
      newId: () => "i-new",
    },
  );

  assert.equal(register.length, 1);
  assert.equal(register[0].id, "i-new");
  assert.equal(register[0].answer, "maybe");
  assert.equal(register[0].status, INVITE_ANSWERED);
  assert.equal(
    register[0].sentAt,
    "",
    "this device never saw it sent, and does not pretend otherwise",
  );
});

test("an answer nobody could have given changes nothing", () => {
  const register = invites();

  const unchanged = recordRsvp(
    register,
    { sessionId: "s1", clientId: "c1", answer: "perhaps" },
    {},
  );

  assert.deepEqual(unchanged, register);
});

test("answers are per session, so one session's reply never speaks for another", () => {
  let register = [
    buildInvite({ id: "i1", sessionId: "s1", clientId: "c1", sentAt: "x" }),
    buildInvite({ id: "i2", sessionId: "s2", clientId: "c1", sentAt: "x" }),
  ];

  register = recordRsvp(register, { sessionId: "s2", clientId: "c1", answer: "no" }, { now: "t" });

  assert.equal(findInviteFor(register, "s1", "c1").answer, undefined);
  assert.equal(findInviteFor(register, "s2", "c1").answer, "no");
});

test("an attendee added by hand has no invitation, and that is not missing data", () => {
  // Simon, 2026-08-17: "not all attendees need an invitation, some will be added manually." The
  // session's participant list is authoritative; this only ever reports what an invitation says.
  const register = invites();

  assert.equal(inviteStatusFor(register, "s1", "c1"), INVITE_SENT);
  assert.equal(inviteStatusFor(register, "s1", "walk-in-client"), "");
  assert.equal(findInviteFor(register, "s1", "walk-in-client"), null);
});

test("the record carries no name, and no copy of anything the client owns", () => {
  // "By reference only, for easier anonymization": erasing a client must not have to rewrite
  // invitations to remove their name, because there is no name in them to remove.
  const invite = buildInvite({
    id: "i1",
    sessionId: "s1",
    clientId: "c1",
    sentAt: "x",
    clientName: "Jana Novak",
    email: "jana@example.com",
  });

  assert.deepEqual(Object.keys(invite).sort(), [
    "channel",
    "clientId",
    "id",
    "sentAt",
    "sessionId",
    "status",
  ]);
});
