// tests/unit_js/data/sessionEventPayload.test.mjs
// The event that travels between two phones (src/data/sessionEventPayload.js).
//
// This is a PERSISTED FORMAT in the sense AGENT_RULES §5.8 carves out: a link lives in someone's
// messages for weeks and is opened by a build that has moved on. So the round trip and the version
// gate are pinned deliberately — and so is the size, because the budget it has to fit in (a QR that
// scans, an SMS that is not split) is the constraint the whole design was shaped by.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SESSION_INVITE,
  SESSION_RSVP,
  decodeSessionEvent,
  encodeSessionEvent,
  encodedSize,
  replyToInvite,
} from "../../../src/data/sessionEventPayload.js";
import { SMS_SEGMENT_CHARACTERS } from "../../../src/modules/common/eventTransports.js";

const INVITE = {
  kind: SESSION_INVITE,
  sessionId: "0192f3a4b5c6d7e8f9a0b1",
  clientId: "0192f3a4b5c6d7e8f9a0b2",
  title: "Hypertrophy Upper",
  startsAt: 1789200000000,
  durationMinutes: 90,
  location: "Studio A",
  organizerEmail: "pt@librept.test",
  organizerName: "Sam Ray",
};

test("an invite survives the round trip intact", () => {
  assert.deepEqual(decodeSessionEvent(encodeSessionEvent(INVITE)), INVITE);
});

test("an rsvp survives the round trip intact", () => {
  const rsvp = { kind: SESSION_RSVP, sessionId: "s1", clientId: "c1", answer: "yes" };
  assert.deepEqual(decodeSessionEvent(encodeSessionEvent(rsvp)), rsvp);
});

test("a full invite fits in a scannable code and a short message", () => {
  // The budgets the design is bounded by: ~300 bytes for a QR that scans phone-to-phone at an
  // angle, 160 characters for one un-split SMS segment. The link's own origin is on top of this.
  const size = encodedSize(INVITE);
  assert.ok(size < 300, `an invite must stay under a scannable QR's budget, was ${size}`);
});

test("optional fields simply do not travel", () => {
  const minimal = { kind: SESSION_INVITE, sessionId: "s1" };
  assert.deepEqual(decodeSessionEvent(encodeSessionEvent(minimal)), minimal);
  assert.ok(encodedSize(minimal) < encodedSize(INVITE), "a smaller event costs less on the wire");
});

test("an event with no session is not an event", () => {
  assert.equal(encodeSessionEvent({ kind: SESSION_INVITE }), null);
  assert.equal(encodeSessionEvent({ kind: "something-else", sessionId: "s1" }), null);
  assert.equal(encodeSessionEvent(null), null);
});

test("an rsvp only carries an answer someone could actually have given", () => {
  const forged = encodeSessionEvent({ kind: SESSION_RSVP, sessionId: "s1", answer: "maybe-not" });
  assert.equal(decodeSessionEvent(forged), null);
});

test("a payload from a future format is refused, not half-read", () => {
  // The reason `v` exists: a build that cannot read a link must say so rather than act on the parts
  // it happens to recognise.
  const fromTheFuture = btoa(JSON.stringify({ v: 99, k: "invite", s: "s1" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  assert.equal(decodeSessionEvent(fromTheFuture), null);
});

test("nothing that is not a payload ever throws", () => {
  // Every one of these arrives from a URL a stranger can write.
  for (const hostile of ["", "not-base64!!", "eyJ2IjoxfQ", "%%%", "a".repeat(5000), null, 42, {}]) {
    assert.equal(decodeSessionEvent(hostile), null, `should refuse: ${String(hostile)}`);
  }
});

// --- The reply leg (TODO §1.6's confirm link). SMS was ruled in on 2026-08-17, and these pin what
// that costs: the invite has to carry the trainer's PHONE, since `sms:` needs a number to address and
// an invite that only knows an email address can only ever be answered by email. ---

test("an invite carries the trainer's phone, so the reply can be a text", () => {
  const invite = {
    kind: SESSION_INVITE,
    sessionId: "s1",
    clientId: "c1",
    organizerEmail: "pt@example.com",
    organizerPhone: "+386 41 234 567",
  };

  const reopened = decodeSessionEvent(encodeSessionEvent(invite));

  assert.equal(reopened.organizerPhone, "+386 41 234 567");
});

test("a reply names the session, the client and the answer — and nothing else", () => {
  const invite = {
    kind: SESSION_INVITE,
    sessionId: "s1",
    clientId: "c1",
    title: "Group Strength",
    location: "Studio 2",
    organizerEmail: "pt@example.com",
    organizerPhone: "+386 41 234 567",
  };

  const reply = replyToInvite(invite, "yes");

  assert.deepEqual(reply, { kind: SESSION_RSVP, sessionId: "s1", clientId: "c1", answer: "yes" });
  // The reply travels through a carrier and sits in two message histories, so it must carry no PII:
  // no name, no title that hints at a medical class, no location. Opaque ids and one word.
  const wire = encodeSessionEvent(reply);
  const decoded = JSON.stringify(decodeSessionEvent(wire));
  for (const leak of ["Group Strength", "Studio 2", "pt@example.com", "386"]) {
    assert.equal(decoded.includes(leak), false, `${leak} must not ride in a reply`);
  }
});

test("a reply nobody could have given is refused rather than sent", () => {
  const invite = { kind: SESSION_INVITE, sessionId: "s1", clientId: "c1" };

  assert.equal(replyToInvite(invite, "maybe-later"), null);
  assert.equal(replyToInvite(invite, ""), null);
  assert.equal(replyToInvite(null, "yes"), null);
  // An invite with no client cannot be answered: the trainer would receive an answer from nobody.
  assert.equal(replyToInvite({ kind: SESSION_INVITE, sessionId: "s1" }, "yes"), null);
});

test("a reply fits in one SMS segment, which is the whole reason it is this small", () => {
  const reply = replyToInvite(
    {
      kind: SESSION_INVITE,
      sessionId: "abcdefghijklmnopqrstuv",
      clientId: "abcdefghijklmnopqrstuv",
    },
    "yes",
  );

  assert.ok(encodedSize(reply) < SMS_SEGMENT_CHARACTERS, "a reply must not be split by a carrier");
});

test("an invite carries its cutoff, because the client's device cannot compute one", () => {
  // The trainer's padding setting lives on the trainer's phone. The client knows only what the invite
  // told them — the same constraint that put organizerPhone on the wire.
  const invite = { ...INVITE, expiresAt: Date.UTC(2026, 7, 20, 14, 0, 0) };

  const reopened = decodeSessionEvent(encodeSessionEvent(invite));

  assert.equal(reopened.expiresAt, Date.UTC(2026, 7, 20, 14, 0, 0));
});

test("a cutoff that is not a number does not travel as one", () => {
  // Read as a NUMBER by the format, not by what arrived: `expiresAt: "soon"` reaching the reply page
  // would be compared against Date.now() and quietly decide every invitation had expired.
  const decoded = decodeSessionEvent(encodeSessionEvent({ ...INVITE, expiresAt: "soon" }));

  assert.equal(decoded.expiresAt, undefined);
});

test("an invite with no cutoff is still a valid invite", () => {
  // A trainer who wants no deadline, and every invite sent before this field existed.
  const decoded = decodeSessionEvent(encodeSessionEvent(INVITE));

  assert.equal("expiresAt" in decoded, false);
  assert.equal(decoded.sessionId, INVITE.sessionId);
});
