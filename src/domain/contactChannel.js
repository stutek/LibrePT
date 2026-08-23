// src/domain/contactChannel.js — which way a typed contact can be reached (TODO §26.3).
//
// Single responsibility: read one line a trainer typed and say whether it is an email address, a
// phone number, or neither. No DOM, no links, no sending — modules/clients/intakeInvite.js builds
// the `sms:` and `mailto:` targets from what this decides.
//
// **One field, not two.** A trainer standing in front of somebody who just asked about training has
// one thing in their hand: a number read off a phone screen, or an address said out loud. Asking
// which KIND it is before they can type it is a question the text itself already answers, and two
// half-empty fields on a phone are two chances to fill in the wrong one.
//
// **Deliberately generous about phone numbers, and deliberately strict about the `@`.** Numbers
// arrive with spaces, dashes, brackets and a `+`, and refusing "+386 41 234 567" because of how it
// was spaced would be the app being clever at the trainer's expense. An address, on the other hand,
// is only an address if it has an `@` with something either side — anything looser matches a
// half-typed number and offers to open a mail client for it.
//
// Injected dependencies: none — pure functions over strings.

/** Everything a dialled number may contain. Kept here rather than inline so the two functions below
 * cannot drift apart on what counts as a phone number. */
const PHONE_SHAPE = /^\+?[\d\s\-().]+$/;
// Short enough to accept a European short code, long enough that a stray "12" is not a phone
// number. Below this the trainer has not finished typing, which is not the same as being wrong.
const SHORTEST_USEFUL_PHONE = 5;

/** `"email"`, `"sms"`, or `null` when the line is neither yet.
 *
 * `null` for an unfinished line is the point: the send control stays out of reach until there is
 * somewhere to send to, rather than opening a mail client addressed to half a number.
 */
export function contactChannelFor(text) {
  const contact = (text || "").trim();
  if (!contact) return null;
  if (contact.includes("@")) {
    const [name, domain, ...rest] = contact.split("@");
    const looksLikeAddress = name && domain?.includes(".") && !domain.endsWith(".") && !rest.length;
    return looksLikeAddress ? "email" : null;
  }
  if (!PHONE_SHAPE.test(contact)) return null;
  return digitsIn(contact).length >= SHORTEST_USEFUL_PHONE ? "sms" : null;
}

/** The digits only, with the leading `+` kept: what a `sms:` target has to carry.
 *
 * The `+` survives because an international prefix is the difference between reaching somebody and
 * reaching a stranger in your own country, and a trainer who typed it meant it.
 */
export function dialledForm(text) {
  const contact = (text || "").trim();
  const plus = contact.startsWith("+") ? "+" : "";
  return `${plus}${digitsIn(contact)}`;
}

function digitsIn(text) {
  return (text || "").replace(/\D/g, "");
}
