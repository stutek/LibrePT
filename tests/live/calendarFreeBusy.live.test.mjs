// tests/live/calendarFreeBusy.live.test.mjs — proves the live credential actually carries Calendar
// access, and that `freeBusy.query` still answers the shape TODO §1.5's occupancy shading will read.
//
// **It now drives the production module**, as its earlier note promised it would once
// `src/data/calendarFreeBusy.js` existed. That is the point of a live test: the hermetic suite pins
// our parsing against a stub we wrote, so it cannot notice Google answering a shape we did not
// imagine. Here the same parsing meets the real endpoint. The one raw `fetch` left is the
// events.list call, which asserts a REFUSAL and has no module counterpart by design.
//
// **What it is really for.** A scope that was consented to but is no longer honoured fails at the
// FIRST call that needs it, not when the token is issued. Without this file a broken calendar scope
// would surface months later, inside whatever change first built occupancy, looking like that
// change's bug. It costs one request to know now.
//
// **freeBusy, never events.** The production scope is `calendar.freebusy`, the narrowest Google
// publishes: it authorises this endpoint and nothing else, so a token minted with it CANNOT read an
// event's summary, attendees or location even if asked. That is TODO §1.5's "no PT's session detail
// leaks to another", enforced by Google rather than by our own restraint.
//
// **So there IS one `events.list` call below, and it is the opposite of a convenience** — it asserts
// that the call is REFUSED. The privacy claim is not "we chose not to read event bodies", which is
// worth nothing to a trainer whose clients' sessions are the data; it is "this grant cannot read
// them." Nothing verified that until now: `tokenScopes.live.test.mjs` proves the token was granted
// no broader scope, which is a statement about our consent screen, not about what Google enforces
// at the endpoint. If that call ever starts SUCCEEDING, the scope has been widened or reclassified
// and §1.5's isolation argument has quietly stopped being true — exactly the class of Google-side
// change this suite exists to catch. Any other `events` call is still forbidden here.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { queryFreeBusy } from "../../src/data/calendarFreeBusy.js";
import { resolveAccessToken, skipReason } from "./_credentials.mjs";

const accessToken = await resolveAccessToken();

describe("Calendar freeBusy contract", { skip: skipReason(accessToken) }, () => {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  test("the token is accepted and returns a busy list for the primary calendar", async () => {
    const { busyByCalendar, unreadable } = await queryFreeBusy(
      accessToken,
      { calendarIds: ["primary"], timeMin, timeMax },
    );
    assert.deepEqual(unreadable, [], "the account cannot read its own primary calendar");
    // Busy may legitimately be empty — an idle test calendar is the normal case. The contract being
    // pinned is that the ARRAY is present and its entries are {start, end}, which is what the
    // occupancy renderer will map to block geometry.
    assert.ok(Array.isArray(busyByCalendar.primary), "expected a busy array for primary");
    for (const interval of busyByCalendar.primary) {
      assert.match(interval.start, /^\d{4}-\d{2}-\d{2}T/);
      assert.match(interval.end, /^\d{4}-\d{2}-\d{2}T/);
    }
  });

  test("the grant cannot read an event body, only whether the time is busy", async () => {
    // The one place this suite touches `events` — to prove the door is locked. A `calendar.freebusy`
    // token must be refused here; if it is ever accepted, every trainer's session titles, client
    // names and locations became readable by anyone holding a room-calendar grant, and PRIVACY.md
    // and TODO §1.5 both stop being accurate.
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    assert.equal(
      response.ok,
      false,
      "calendar.freebusy was accepted for events.list — the scope no longer bounds what this " +
        "grant can read, and §1.5's occupancy design leaks session detail between trainers",
    );
    // 401 would mean the token is simply dead, which is a different failure and would make the
    // assertion above pass for the wrong reason — the suite's other tests would be failing too.
    assert.equal(
      response.status,
      403,
      `expected 403 insufficient scope, got ${response.status}`,
    );
  });

  test("an unreadable calendar is reported per-calendar, not as a failed request", async () => {
    // The occupancy view queries several room calendars at once (TODO §1.3). Google answers a
    // partial failure with HTTP 200 and a per-calendar `errors` array rather than failing the whole
    // batch — so the renderer must read that, or one unshared room silently blanks every other
    // room's shading. Pinning it here is what makes that a known contract instead of a surprise.
    const bogus = "definitely-not-a-real-calendar@example.com";
    const { busyByCalendar, unreadable } = await queryFreeBusy(
      accessToken,
      { calendarIds: ["primary", bogus], timeMin, timeMax },
    );
    assert.deepEqual(
      unreadable.map((entry) => entry.calendarId),
      [bogus],
      "the unreadable calendar must be reported as unreadable, never as free",
    );
    assert.equal(bogus in busyByCalendar, false);
    assert.ok(Array.isArray(busyByCalendar.primary), "the readable calendar still answers");
  });
});
