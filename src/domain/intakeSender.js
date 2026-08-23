// src/domain/intakeSender.js — who an intake link says it came from (TODO §26.3).
//
// Single responsibility: put the trainer's own name and number into an intake link, and read them
// back out on the other side. No DOM, no sending — modules/clients/intakeInvite.js builds the link,
// modules/intake/ shows what this reads.
//
// **Why this exists.** The intake page asked a stranger for their health details while saying only
// "your trainer", naming nobody (asked 2026-08-23: "how would she know this is not phishing?"). A
// message from an unfamiliar number pointing at a page that identifies no one is exactly the shape
// of a phishing attempt, and the person receiving it has usually met the trainer once.
//
// **What this does and does not prove.** It does NOT prove identity: with no server and no key
// exchange, anybody can craft a link naming anybody, and a design that claimed otherwise would be
// lying. What it gives the reader is something they can CHECK — the name in the message, the name on
// the page and the person they just spoke to are three things that must agree. That is the same
// check people already make with a caller who says which bank they are from, and it is worth having
// precisely because the alternative is a page that says nothing at all.
//
// **The real protection is structural and lives elsewhere**: the intake page has no endpoint. It
// sends nothing anywhere — the client fills in a file and chooses who to share it with — so a forged
// link gains an attacker nothing unless the client hands them the file in person.
//
// **In the FRAGMENT, never the query.** A `#` is not sent to any server, not written to any access
// log, and not passed on in a `Referer` — the same reason session invites carry their payload there
// (data/sessionEventPayload.js). The trainer's own phone number is personal data too.
//
// Injected dependencies: none — pure functions over strings.

const SENDER_KEY = "from";

/** The fragment an invitation carries, or "" when the install does not know who the trainer is.
 *
 * Empty rather than a placeholder: a page that says "sent by —" is worse than a page that admits it
 * does not know, because the first one looks like it checked something.
 */
export function senderFragment({ name, phone } = {}) {
  const parts = [name, phone].map((part) => (part || "").trim());
  if (!parts[0] && !parts[1]) return "";
  return `#${SENDER_KEY}=${encodeURIComponent(parts.join("|"))}`;
}

/** `{ name, phone }` read back from a link's fragment, or null when it carries none.
 *
 * Everything here is hostile input — the fragment is part of a URL anybody can edit — so it is only
 * ever DISPLAYED, never trusted, and the reader is told to compare it with what they already know.
 * Length is capped so a crafted link cannot push the rest of the page off the screen.
 */
export function senderFromFragment(hash) {
  const raw = (hash || "").replace(/^#/, "");
  const match = new URLSearchParams(raw).get(SENDER_KEY);
  if (!match) return null;
  const [name = "", phone = ""] = match.split("|");
  const trimmed = { name: name.trim().slice(0, 80), phone: phone.trim().slice(0, 40) };
  return trimmed.name || trimmed.phone ? trimmed : null;
}
