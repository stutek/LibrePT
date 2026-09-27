// tests/unit_js/data/googleAuthRevoke.test.mjs
// Clearing and revoking the Google grant (src/data/googleAuth.js). Revoking must reach Google even
// after a reload, when no token is in memory: that is when the trainer is most likely to ask.

import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

function fakeStorage() {
  const values = {};
  return {
    getItem: (key) => (key in values ? values[key] : null),
    setItem: (key, value) => {
      values[key] = String(value);
    },
    removeItem: (key) => {
      delete values[key];
    },
  };
}

/** A stand-in for Google Identity Services: hands out `token` (or an error) and records revokes. */
function fakeGoogle({ token = "tok-1", revokeAnswers = true } = {}) {
  const revoked = [];
  globalThis.window = {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: () => ({
            callback: () => {},
            requestAccessToken() {
              this.callback(
                token ? { access_token: token, expires_in: 3600 } : { error: "popup_closed" },
              );
            },
          }),
          revoke: (value, done) => {
            revoked.push(value);
            if (revokeAnswers) done({ successful: true });
          },
        },
      },
    },
  };
  return revoked;
}

let auth;
beforeEach(async () => {
  globalThis.localStorage = fakeStorage();
  globalThis.document = { head: { appendChild() {} }, createElement: () => ({}) };
  // A fresh module per test: the token lives in module state, as it does across one page load.
  auth = await import(`../../../src/data/googleAuth.js?case=${Math.random()}`);
});

test("revoking after a reload asks Google for a token first, then revokes it", async () => {
  const revoked = fakeGoogle({ token: "fresh" });
  localStorage.setItem("librept_drive_connected", "1");

  assert.equal(await auth.revokeAccess(), "revoked");
  assert.deepEqual(revoked, ["fresh"]);
  assert.equal(auth.hasStoredConsent(), false);
});

test("a revoke that cannot get a token forgets locally and says Google was not reached", async () => {
  const revoked = fakeGoogle({ token: null });
  localStorage.setItem("librept_drive_connected", "1");

  assert.equal(await auth.revokeAccess(), "unreachable");
  assert.deepEqual(revoked, []);
  assert.equal(auth.hasStoredConsent(), false);
});

test("nothing is asked of Google when this device was never connected", async () => {
  const revoked = fakeGoogle();
  assert.equal(await auth.revokeAccess(), "not_connected");
  assert.deepEqual(revoked, []);
});

test("clearing forgets the connection without asking Google anything", async () => {
  const revoked = fakeGoogle();
  localStorage.setItem("librept_drive_connected", "1");
  auth.forgetStoredConsent();
  assert.equal(auth.hasStoredConsent(), false);
  assert.deepEqual(revoked, []);
});
