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
} from "../../../src/data/sessionEventPayload.js";

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
