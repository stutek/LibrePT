// tests/live/tokenScopes.live.test.mjs — asserts the live credential was GRANTED exactly the scopes
// the shipping app asks for: no less, and importantly no more.
//
// **Why this cannot be a static check.** While the canary ran as a federated service account, the
// scope list was a literal string in google-canary.yml and a unit test could diff it against
// `driveSyncConfig.js`. It is not there any more: the identity under test is a consumer account
// whose scopes were chosen once, by hand, on Google's consent screen, and are recorded nowhere this
// repository can read. The only place the truth exists is the token itself, so that is what gets
// asked — `tokeninfo` echoes back the scopes actually attached to it.
//
// **Both directions matter, and the second is the one that rots quietly.** Too FEW scopes and the
// canary fails loudly at the first call that needs the missing one, which is annoying but honest.
// Too MANY — a `drive` or `drive.file` grant left over from a debugging session — and every Drive
// test keeps passing while `drive.appdata`, the scope every trainer actually holds, could be broken
// or revoked without anyone noticing. A canary running with more access than production is reporting
// confidence it has not earned, which is worse than having no canary at all.
//
// Injected dependencies: none — reads the production scope constant and the resolved access token.

import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import { GOOGLE_CALENDAR_FREEBUSY_SCOPE } from "../../src/data/calendarFreeBusy.js";
import { GOOGLE_DRIVE_SCOPE } from "../../src/data/driveSyncConfig.js";
import { resolveAccessToken, skipReason } from "./_credentials.mjs";

const accessToken = await resolveAccessToken();
const TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo";

// Imported from the shipping module now that src/data/calendarFreeBusy.js exists, so the scope the
// canary checks and the scope the app will ask for cannot drift apart. It is not yet in the grant
// googleAuth.js requests — §1.5 adds a scope in the change that ships its feature — but the consent
// screen it is checked against already carries it.
const CALENDAR_FREEBUSY_SCOPE = GOOGLE_CALENDAR_FREEBUSY_SCOPE;

// Every one of these would keep the Drive tests green while reaching far beyond the hidden per-app
// folder production is bounded to.
const OVERBROAD_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

describe("Granted OAuth scopes", { skip: skipReason(accessToken) }, () => {
  // Fetched once in a hook rather than inside the first test, so the second cannot pass vacuously
  // on an empty list when the first fails.
  let granted = [];

  before(async () => {
    const response = await fetch(
      `${TOKENINFO_ENDPOINT}?access_token=${encodeURIComponent(accessToken)}`,
    );
    const payload = await response.json().catch(() => ({}));
    assert.equal(
      response.ok,
      true,
      `tokeninfo failed: ${response.status} ${JSON.stringify(payload)}`,
    );
    granted = (payload.scope || "").split(" ").filter(Boolean);
  });

  test("the token carries the app's own Drive and Calendar scopes", () => {
    assert.ok(
      granted.includes(GOOGLE_DRIVE_SCOPE),
      `grant is missing the app's Drive scope ${GOOGLE_DRIVE_SCOPE}; got ${granted.join(", ")}`,
    );
    assert.ok(
      granted.includes(CALENDAR_FREEBUSY_SCOPE),
      `grant is missing ${CALENDAR_FREEBUSY_SCOPE}; got ${granted.join(", ")}`,
    );
  });

  test("the token carries nothing broader than the app ever asks for", () => {
    for (const overbroad of OVERBROAD_SCOPES) {
      assert.ok(
        !granted.includes(overbroad),
        `the canary credential was granted ${overbroad}, which no trainer's grant holds — ` +
          "re-consent with only the app's scopes, or it will pass while production's are broken",
      );
    }
  });
});
