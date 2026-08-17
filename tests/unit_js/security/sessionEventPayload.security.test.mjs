// tests/unit_js/security/sessionEventPayload.security.test.mjs
// Decoding an event link is parsing input a stranger wrote (src/data/sessionEventPayload.js).
//
// The link arrives by text message or a scanned code, so nothing about its contents is trustworthy,
// and what comes out of the decoder is handed to a handler that writes to the trainer's own store.
// Two properties matter: an unknown field must never survive the decode, and no field may arrive
// unbounded. Both are the "attacker-controlled object keys" case this tier exists for.

import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeSessionEvent } from "../../../src/data/sessionEventPayload.js";

const asLink = (payload) =>
  btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

test("a key the format does not define never reaches the decoded event", () => {
  const decoded = decodeSessionEvent(
    asLink({ v: 1, k: "invite", s: "s1", erasedAt: "2020-01-01", admin: true }),
  );

  assert.deepEqual(decoded, { kind: "invite", sessionId: "s1" });
});

test("a prototype-polluting key is dropped like any other unknown one", () => {
  const decoded = decodeSessionEvent(
    asLink({ v: 1, k: "invite", s: "s1", __proto__: { polluted: true } }),
  );

  assert.deepEqual(decoded, { kind: "invite", sessionId: "s1" });
  assert.equal({}.polluted, undefined, "nothing was written onto Object.prototype");
});

test("an over-long field is dropped while the rest of the event still decodes", () => {
  // It would otherwise reach the DOM and the record store at whatever length the sender chose.
  // Sized to stay under the whole-payload ceiling, so this pins the per-FIELD bound rather than
  // the cheaper one that refuses an oversized link outright (below).
  const decoded = decodeSessionEvent(asLink({ v: 1, k: "invite", s: "s1", t: "x".repeat(1000) }));

  assert.equal(decoded.title, undefined, "the oversized title did not survive");
  assert.equal(decoded.sessionId, "s1", "the rest of a usable event still decodes");
});

test("a payload larger than any honest event is refused before it is parsed", () => {
  assert.equal(decodeSessionEvent("A".repeat(100_000)), null);
});

test("a field of the wrong type is dropped, not coerced", () => {
  const decoded = decodeSessionEvent(
    asLink({ v: 1, k: "invite", s: "s1", t: { toString: "not a string" }, w: "soon" }),
  );

  assert.deepEqual(decoded, { kind: "invite", sessionId: "s1" });
});
