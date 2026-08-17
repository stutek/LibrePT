// src/domain/inviteExpiry.js — when an invitation stops being answerable (TODO §1.6).
//
// Single responsibility: the cutoff, and whether it has passed. No DOM, no storage, no knowledge of
// how an invitation travels — the payload carries the number this produces, and the reply page reads
// it back.
//
// Asked for 2026-08-17 (Simon): "can invitations expire (PT sets the expiry padding — example 4 hours
// before session)". Everything below follows from there being no server.
//
// **Expiry is DERIVED, never stored.** Nothing runs at the cutoff. A phone in a pocket writes nothing,
// so an `expired` status in the record would only become true if the app happened to be open at the
// right moment — a flag that lies by omission. Comparing a stored instant against `now` is always
// right, needs no scheduler, and works the first time anyone looks.
//
// **The cutoff is an absolute instant** (epoch ms), computed back from the session start, and it
// TRAVELS in the invite payload. The client's device knows nothing about the trainer's settings — the
// same constraint that put `organizerPhone` on the wire — and two devices in two timezones have to
// agree about a deadline, which a local time-of-day rule could not deliver.
//
// **It is advisory, and the UI says so rather than pretending otherwise.** The reply page can decline
// to send after the cutoff; nothing can recall a message already in flight, and clocks differ. A late
// answer that arrives anyway is still recorded — with its response time, since the same day's ruling
// was to record the time rather than mark a reply late.
//
// deps: none — pure arithmetic over instants.

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

// The DEFAULT padding is deliberately NOT here: it is the default of a stored setting, so it lives with
// the setting (data/trainerIdentity.js). This module takes a padding as an argument and has no opinion
// about where it came from — which is also what keeps `data` from having to import `domain`.

/**
 * The instant an invitation stops being answerable, or null when it never does.
 *
 * Null for a padding of zero (the trainer has not asked for expiry, and inventing a deadline would
 * start refusing answers they wanted) and for a session with no start (an unscheduled draft has
 * nothing to count back from — see §17.1's planning sessions).
 */
export function inviteExpiresAt(startsAt, paddingHours) {
  if (!Number.isFinite(startsAt)) return null;
  if (!Number.isFinite(paddingHours) || paddingHours <= 0) return null;
  return startsAt - paddingHours * MS_PER_HOUR;
}

/**
 * Whether the cutoff has passed.
 *
 * Exactly AT the cutoff is still open: "four hours before" reads to a human as "up to four hours
 * before", and refusing the answer that lands on that second would be a coin toss on clock skew
 * between two devices.
 */
export function isInviteExpired(expiresAt, now) {
  if (!Number.isFinite(expiresAt)) return false;
  return now > expiresAt;
}

/** Minutes left, floored, or null when there is no cutoff. A client deciding whether to answer now
 *  needs the number; a boolean tells them only that they still can. Never negative — past the cutoff
 *  is zero, because "-40 minutes left" is not a thing anyone reads. */
export function minutesUntilExpiry(expiresAt, now) {
  if (!Number.isFinite(expiresAt)) return null;
  return Math.max(0, Math.floor((expiresAt - now) / MS_PER_MINUTE));
}
