// tests/unit_js/domain/inviteExpiry.test.mjs
// When an invitation stops being answerable (src/domain/inviteExpiry.js) — TODO §1.6.
//
// Asked for 2026-08-17 (Simon): "can invitations expire (PT sets the expiry padding — example 4 hours
// before session)". Three things these pin, all of them consequences of there being no server:
//
//   - Expiry is DERIVED, never stored. Nothing runs at the cutoff — a phone in a pocket writes nothing —
//     so a stored `expired` status would be a lie that only became true if the app happened to be open.
//   - The cutoff is an INSTANT, computed from the session start. Two devices in two timezones must agree
//     on it, which a local time-of-day cutoff could not deliver.
//   - It is ADVISORY. The client's page can refuse to send after the cutoff; nothing can recall a
//     message already in flight, and a late answer is still recorded (with its response time, per the
//     same day's ruling — no "late" flag).

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inviteExpiresAt,
  isInviteExpired,
  minutesUntilExpiry,
} from "../../../src/domain/inviteExpiry.js";

const START = Date.UTC(2026, 7, 20, 18, 0, 0); // 20 Aug 2026, 18:00 UTC

test("the cutoff is the session start minus the padding the trainer set", () => {
  assert.equal(inviteExpiresAt(START, 4), START - 4 * 60 * 60 * 1000);
  assert.equal(
    inviteExpiresAt(START, 0.5),
    START - 30 * 60 * 1000,
    "half an hour is a real answer",
  );
});

test("no padding means no cutoff, so an invitation stays answerable up to the session itself", () => {
  // A trainer who never sets one has not asked for expiry, and inventing a deadline for them would
  // start refusing answers they wanted.
  assert.equal(inviteExpiresAt(START, 0), null);
  assert.equal(inviteExpiresAt(START, null), null);
  assert.equal(inviteExpiresAt(START, "soon"), null);
});

test("a session with no start time cannot have a cutoff", () => {
  // An unscheduled session has nothing to count back from. Refusing to invent one is what keeps a
  // planning draft from silently becoming unanswerable.
  assert.equal(inviteExpiresAt(null, 4), null);
  assert.equal(inviteExpiresAt(undefined, 4), null);
});

test("expiry is a comparison against now, never a stored flag", () => {
  const cutoff = inviteExpiresAt(START, 4);

  assert.equal(isInviteExpired(cutoff, cutoff - 1), false, "a minute before is still open");
  assert.equal(isInviteExpired(cutoff, cutoff + 1), true, "a minute after is not");
  // Exactly at the cutoff is still open: a deadline of "4 hours before" reads to a human as "up to
  // four hours before", and refusing the answer that arrives on the second is a coin toss on clock skew.
  assert.equal(isInviteExpired(cutoff, cutoff), false);
});

test("an invitation with no cutoff never expires", () => {
  assert.equal(isInviteExpired(null, Date.now()), false);
  assert.equal(isInviteExpired(undefined, Date.now()), false);
});

test("how long is left is reported, because a client deciding needs the number and not a boolean", () => {
  const cutoff = inviteExpiresAt(START, 4);

  assert.equal(minutesUntilExpiry(cutoff, cutoff - 90 * 60 * 1000), 90);
  assert.equal(
    minutesUntilExpiry(cutoff, cutoff + 60 * 1000),
    0,
    "past the cutoff is zero, not negative",
  );
  assert.equal(minutesUntilExpiry(null, Date.now()), null, "no cutoff, no countdown");
});

// The DEFAULT padding is a setting's default, so it is pinned where it lives —
// tests/unit_js/data/trainerIdentity.test.mjs. This module only does the arithmetic.
