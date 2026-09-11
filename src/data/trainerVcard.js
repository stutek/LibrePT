// src/data/trainerVcard.js — the trainer's own contact as an RFC 6350 vCard the client's phone can
// save (TODO §26.3).
//
// Single responsibility: turn the three strings an intake link carries (domain/intakeSender.js) into
// the bytes of a `.vcf`. No DOM, no download — modules/intake/intakeView.js offers the button.
//
// **Why a file at all, when the number is already on the page.** The client usually does not have
// the trainer's number when the invitation arrives: it is only in the signature of a message that an
// email, a forward, or a share sheet that keeps the link and drops the text will not carry (asked
// 2026-09-11). The intake page is then the one place the contact reliably appears, and a number the
// client has to copy off a screen with their thumb is one they will not copy. A `.vcf` opens
// straight into the address book on both iOS and Android.
//
// **Not sent, not stored, not attached.** Neither `sms:` nor `mailto:` can attach anything, so this
// is built on the CLIENT's device out of what the link already told it — the same arrangement the
// submission file uses in the other direction (data/signupFile.js).
//
// **vCard 3.0, not 4.0.** 3.0 is what the stock address book on both phones has read for fifteen
// years; 4.0 is the newer spec and the older phones in a gym are exactly the ones that do not know
// it. Nothing here needs a 4.0 property.
//
// Injected dependencies: none — pure functions over strings.

export const VCARD_MEDIA_TYPE = "text/vcard";

// §3.2: a content line is folded at 75 OCTETS, not characters, and continues with a leading space.
// Slovene letters are two octets each, which is why the count below is of bytes.
const MAX_LINE_OCTETS = 75;
const UTF8 = new TextEncoder();

/** §3.4 TEXT escaping: backslash, semicolon, comma and newline. Unescaped, a comma in "Novak, Sam"
 *  turns one value into two and a newline ends the property with the rest of the card as debris.
 *
 *  Deliberately NOT shared with the calendar file's identical-looking escape (data/calendarInvite.js):
 *  two specifications that agree today are still two specifications, and a single helper would make a
 *  future change to one a silent change to the other. */
function escapeVcardText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** One content line, folded to the octet limit. The split may never fall inside a character: half a
 *  code point is not text, and a strict parser refuses the whole card rather than that one line. */
function foldLine(line) {
  const folded = [];
  let current = "";
  let octets = 0;
  for (const character of line) {
    const size = UTF8.encode(character).length;
    // One octet of headroom on continuation lines, which carry a leading space of their own.
    if (octets + size > MAX_LINE_OCTETS - (folded.length ? 1 : 0)) {
      folded.push(current);
      current = "";
      octets = 0;
    }
    current += character;
    octets += size;
  }
  folded.push(current);
  return folded.join("\r\n ");
}

/**
 * The card's text, or null when there is no name to put on it.
 *
 * **A nameless card is worse than none.** `FN` is mandatory in 3.0, and a contact whose only name is
 * a phone number lands in the address book as an entry the client cannot find again. The number on
 * the page stays tappable either way, so refusing here costs them nothing.
 */
export function buildTrainerVcard({ name, phone, email } = {}) {
  const who = (name || "").trim();
  if (!who) return null;

  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVcardText(who)}`];
  // `N` is required in 3.0 as well, and its five parts are family;given;additional;prefix;suffix.
  // One display name is a given name: the app never asked the trainer to split their own.
  lines.push(`N:;${escapeVcardText(who)};;;`);
  if ((phone || "").trim()) lines.push(`TEL;TYPE=CELL:${escapeVcardText(phone.trim())}`);
  if ((email || "").trim()) lines.push(`EMAIL;TYPE=INTERNET:${escapeVcardText(email.trim())}`);
  lines.push("END:VCARD");

  // §3.2: CRLF, and a trailing one. Bare newlines are the commonest reason a `.vcf` imports as one
  // garbled contact or as nothing at all.
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/** A filename that says whose card this is. Sanitised the same way a submission's is
 *  (data/signupFile.js): the name arrives from a link fragment anybody can edit, and this string
 *  becomes a path on the client's own phone. */
export function trainerVcardFileName({ name } = {}) {
  const person = (name || "")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .toLowerCase();
  return `${person || "trainer"}.vcf`;
}
