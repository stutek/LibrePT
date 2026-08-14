// src/data/calendarFreeBusy.js — Google Calendar `freeBusy.query` REST client (TODO §1.3/§1.5).
// Single responsibility: ask Google which intervals a set of calendars is BUSY in, and say plainly
// which of them it could not read. Knows nothing about rendering, rooms, or sessions — §1.3's
// occupancy view maps these intervals to block geometry; this module is just the wire format.
//
// **freeBusy, never events, and that is the privacy design rather than a convention.** The scope
// below is the narrowest Google publishes for this: it authorises this one endpoint, so a token
// minted with it CANNOT read an event's summary, attendees or location even if asked. That is
// §1.5's "no PT's session detail leaks to another" enforced by Google rather than by our restraint —
// tests/live/calendarFreeBusy.live.test.mjs asserts an `events.list` call is actually REFUSED, which
// is the only way that claim is worth anything. Never widen this to `calendar` or `calendar.events`.
//
// **An unreadable calendar is reported, never silently rendered free.** Google answers a partial
// failure with HTTP 200 and a per-calendar `errors` array — one unshared room does not fail the
// batch. Folding that into "no busy intervals" would draw an occupied room as available, which on a
// gym floor means a trainer books a room that is already in use. So the two cases are different
// return values here, and a caller has to decide what to do about the second.
//
// Injected dependencies: `fetchImpl` (defaults to the global `fetch`) so tests can supply a stub
// without a real network call or a live access token.

import { GoogleApiError } from "./googleApiError.js";

const FREEBUSY_ENDPOINT = "https://www.googleapis.com/calendar/v3/freeBusy";

// The narrowest scope Google publishes for occupancy reads. Deliberately NOT yet added to the grant
// googleAuth.js requests: §1.5 adds each scope in the change that ships its feature, because an
// unused scope is a verification-review rejection risk and widening the grant forces every existing
// trainer to re-consent. This constant exists so that when occupancy ships, the scope it asks for
// and the scope the live suite checks are the same string.
export const GOOGLE_CALENDAR_FREEBUSY_SCOPE = "https://www.googleapis.com/auth/calendar.freebusy";

/** A failed Calendar call. Status semantics and the reconnect/retry question are shared with the
 * Drive client — see googleApiError.js. */
export class CalendarApiError extends GoogleApiError {
  constructor(message, status) {
    super(message, status);
    this.name = "CalendarApiError";
  }
}

/** Busy intervals for each readable calendar, plus the ones that could not be read.
 *
 * Returns `{ busyByCalendar, unreadable }`:
 *   busyByCalendar — `{ [calendarId]: [{ start, end }] }`, RFC3339 strings straight from Google.
 *   unreadable     — `[{ calendarId, reason }]`, one per calendar that answered with errors.
 *
 * A calendar appears in exactly one of the two. Callers must render `unreadable` as unknown rather
 * than as free (see the note at the top of this file).
 */
export async function queryFreeBusy(
  accessToken,
  { calendarIds, timeMin, timeMax },
  { fetchImpl = fetch } = {},
) {
  if (!calendarIds?.length) return { busyByCalendar: {}, unreadable: [] };

  const response = await fetchImpl(FREEBUSY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ timeMin, timeMax, items: calendarIds.map((id) => ({ id })) }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new CalendarApiError(
      `Calendar freeBusy.query failed: ${response.status} ${body}`,
      response.status,
    );
  }

  const payload = await response.json();
  const calendars = payload.calendars || {};
  const busyByCalendar = {};
  const unreadable = [];

  for (const calendarId of calendarIds) {
    const entry = calendars[calendarId];
    // A requested calendar Google said nothing about is not a free calendar — it is one we know
    // nothing about, which is the same answer as an explicit error for anyone about to book a room.
    if (!entry) {
      unreadable.push({ calendarId, reason: "notInResponse" });
      continue;
    }
    if (entry.errors?.length) {
      unreadable.push({ calendarId, reason: entry.errors[0].reason || "unknown" });
      continue;
    }
    busyByCalendar[calendarId] = entry.busy || [];
  }

  return { busyByCalendar, unreadable };
}
