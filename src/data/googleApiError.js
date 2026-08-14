// src/data/googleApiError.js — the failure shape shared by every Google REST client here
// (TODO §1.5). Single responsibility: carry the HTTP status alongside the message, and answer the one
// question every caller actually asks — "is the GRANT gone, or was this request merely bad?"
//
// Extracted when calendarFreeBusy.js became the second such client. The predicate below is not
// Drive-specific in anything but its old name: an access token dies the same way whichever API
// notices, so a second copy would only create the opportunity for the two to disagree about what
// counts as "reconnect" — a disagreement that surfaces as a trainer tapping Sync forever.
//
// Injected dependencies: none.

/** A failed Google API call, carrying the HTTP status so callers can tell "reconnect" from "retry".
 *
 * The status matters because an access token is OPAQUE — Google's `ya29.` tokens are not JWTs, so
 * `expires_in` at grant time is the only expiry signal, and a locally-computed expiry is a guess.
 * A token can die before it: the trainer revokes the grant at myaccount.google.com, the account
 * password changes, Google invalidates it, or the device clock is skewed. In every one of those the
 * ONLY signal is a 401 from the call itself, so folding it into a generic message is what leaves a
 * trainer tapping "Sync Now" forever on a grant that can never succeed. */
export class GoogleApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
  }
}

/** True when the failure means the GRANT is gone, not that the request was bad — 401 for a dead or
 * revoked token, and 403 specifically for missing scope (a 403 for quota is not an auth problem, so
 * the reason string is checked rather than the bare status). Both are fixed by reconnecting and by
 * nothing else. */
export function isAuthFailure(error) {
  if (error?.status === 401) return true;
  return error?.status === 403 && /insufficient|insufficientPermissions/i.test(error.message || "");
}
