// src/data/inviteRecord.js — the invitation, which is where an RSVP lives (TODO §1.6).
//
// Single responsibility: what an invitation IS, and what happens to it when an answer comes back.
// The event that travels is data/sessionEventPayload.js; who sends it is the invite dialog.
//
// **Decided 2026-08-17 (Simon): "invites should host the RSVP status, sessions should host attendees
// list (by reference only for easier anonymization)".** Both halves are load-bearing.
//
// - **An RSVP is a fact about an INVITATION.** It was sent, and this came back. It is not a property
//   of a person (a client answers differently per session) and not a property of a session (a session
//   does not have one answer). Putting it on either would have needed a per-pair map inside a record
//   that has no other reason to hold one.
// - **A session lists attendees by REFERENCE, and keeps doing so.** `session.participants` is client
//   ids and stays authoritative. That is what makes anonymisation cheap: erasing a client rewrites one
//   client record, and every session and invitation still points at a structurally valid id. Nothing
//   here holds a name, an email or anything else a subject could ask to have removed — there is
//   nothing in an invitation to anonymise.
// - **"Not all attendees need an invitation, some will be added manually"** (same ruling). So an
//   attendee with no invitation is the ordinary case, not missing data, and nothing here may be read
//   as "who is coming" — only as "what we sent, and what came back".
//
// **An answer with no invitation on this device is still recorded.** The trainer may have sent it from
// another phone, or from a build that did not store invitations yet. The reply is itself evidence that
// an invitation existed, and dropping it would lose the only thing that actually came back from the
// client; the record simply does not claim a `sentAt` it never saw.
//
// deps: none — pure functions over plain objects.

/** Sent, and nothing has come back. */
export const INVITE_SENT = "sent";
/** The client answered. `answer` holds which way. */
export const INVITE_ANSWERED = "answered";

const ANSWERS = new Set(["yes", "no", "maybe"]);

/**
 * An invitation, or null when it cannot name both ends.
 *
 * Fields are copied by NAME and nothing else is carried: a caller passing a whole client through
 * would otherwise put that person's name and email into a second collection, which is the copy the
 * "by reference only" ruling exists to prevent.
 */
export function buildInvite(fields) {
  // `= {}` in the signature would not have covered an explicit null, which is what a caller passes
  // when it looked something up and found nothing — the case a test caught.
  const { id, sessionId, clientId, channel = "", sentAt = "" } = fields || {};
  if (!id || !sessionId || !clientId) return null;
  return { id, sessionId, clientId, channel, sentAt, status: INVITE_SENT };
}

/** The invitation for one session/client pair, or null — the ordinary answer for an attendee the
 *  trainer added by hand. */
export function findInviteFor(invites, sessionId, clientId) {
  return (
    (invites || []).find(
      (invite) => invite.sessionId === sessionId && invite.clientId === clientId,
    ) || null
  );
}

/** What an invitation says about this pair: `"sent"`, `"answered"`, or `""` for no invitation at all.
 *  Never "not coming" — an absent invitation says nothing about attendance. */
export function inviteStatusFor(invites, sessionId, clientId) {
  return findInviteFor(invites, sessionId, clientId)?.status || "";
}

/**
 * Records an answer, returning a NEW register.
 *
 * Upserts on the (session, client) pair: a client who changes their mind overwrites their own answer
 * rather than adding a second, because the latest answer IS the answer and two rows would leave the
 * trainer to work out which came last. An answer nobody could have given is ignored entirely.
 */
export function recordRsvp(invites, rsvp, { now = "", newId = () => "" } = {}) {
  const register = invites || [];
  if (!rsvp?.sessionId || !rsvp?.clientId || !ANSWERS.has(rsvp.answer)) return register;

  const existing = findInviteFor(register, rsvp.sessionId, rsvp.clientId);
  const answered = {
    ...(existing ||
      buildInvite({ id: newId(), sessionId: rsvp.sessionId, clientId: rsvp.clientId })),
    status: INVITE_ANSWERED,
    answer: rsvp.answer,
    answeredAt: now,
  };

  if (!existing) return [...register, answered];
  return register.map((invite) => (invite === existing ? answered : invite));
}
