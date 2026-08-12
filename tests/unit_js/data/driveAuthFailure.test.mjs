// tests/unit_js/data/driveAuthFailure.test.mjs
// Telling "the grant is gone" apart from "the request failed" (src/data/driveAppData.js).
//
// Why this classification has to exist at all: a Google access token is OPAQUE — `ya29.` strings are
// not JWTs — so `expires_in` at grant time is the only expiry signal we get, and the locally computed
// `tokenExpiresAt` is a guess. A token dies early whenever the trainer revokes the grant at
// myaccount.google.com, the account password changes, Google invalidates it, or the device clock is
// skewed. In every one of those the ONLY evidence is the status on the failing call, which is why
// flattening it into a message string left a trainer tapping "Sync Now" forever on a session that
// could never succeed.

import assert from "node:assert/strict";
import { test } from "node:test";
import { DriveApiError, findSyncFile, isAuthFailure } from "../../../src/data/driveAppData.js";

function failingFetch(status, body = "") {
  return async () => ({ ok: false, status, text: async () => body });
}

test("a failed drive call carries its HTTP status", async () => {
  await assert.rejects(
    () => findSyncFile("tok", { fetchImpl: failingFetch(401, "Invalid Credentials") }),
    (error) => {
      assert.ok(error instanceof DriveApiError);
      assert.equal(error.status, 401);
      return true;
    },
  );
});

test("401 is an auth failure — the grant is gone, not the request bad", () => {
  assert.equal(isAuthFailure(new DriveApiError("nope", 401)), true);
});

test("403 counts only when it is about scope, not quota", () => {
  // A quota 403 is transient and retrying is the right response; disconnecting the trainer over it
  // would be actively wrong, so the reason string decides rather than the bare status.
  assert.equal(
    isAuthFailure(new DriveApiError("insufficientPermissions: scope missing", 403)),
    true,
  );
  assert.equal(isAuthFailure(new DriveApiError("userRateLimitExceeded", 403)), false);
});

test("ordinary failures and transport errors are not auth failures", () => {
  assert.equal(isAuthFailure(new DriveApiError("server blew up", 500)), false);
  assert.equal(isAuthFailure(new DriveApiError("not found", 404)), false);
  // A TypeError from fetch itself (offline) has no status at all and must not read as "reconnect".
  assert.equal(isAuthFailure(new TypeError("Failed to fetch")), false);
  assert.equal(isAuthFailure(undefined), false);
});
