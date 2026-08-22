// src/data/calendarInvite.js
// Builds an RFC 5545 .ics VEVENT for a PT-assigned session. LibrePT has no backend/SMTP relay to
// send mail itself (TODO §1.5's "no backend of our own" stance), so the invite is a downloadable
// file the trainer attaches to a prefilled mailto compose — see sessionInviteDialog.js.
//
// **ORGANIZER is what makes a reply possible at all.** An RSVP is not a web request: the recipient's
// calendar client answers a `METHOD:REQUEST` by generating a `METHOD:REPLY` and mailing it to the
// address in `ORGANIZER` (RFC 5546 §3.2.2, which requires the property for a REQUEST). This file
// emitted `ATTENDEE;RSVP=TRUE` with no organizer at first — an invitation with no return address, so
// a well-behaved client had nothing to reply to and most simply did not. The reply still lands in
// the trainer's MAILBOX rather than in the app, which no `.ics` can change; what it buys is that the
// trainer finds out at all (TODO §1.6).

function formatIcsDateUTC(date) {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

// RFC 5545 §3.3.11 TEXT escaping — backslash, semicolon, comma and newline are the only characters
// a text value must escape.
function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// A `CN` display name is a QUOTED parameter value, and RFC 5545 §3.1 gives those no escape sequence
// at all: a double quote inside one cannot be represented, only removed, and a control character
// ends the content line early, taking the rest of the file's structure with it. So this strips
// rather than escapes — everything else, spaces and punctuation included, is legal inside the
// quotes. Returns the whole `;CN="…"` fragment, or nothing, so no caller can build a dangling
// parameter out of an empty name.
const LAST_CONTROL_CHARACTER = 0x1f;

function isRepresentableInAQuotedParam(character) {
  return character !== '"' && character.codePointAt(0) > LAST_CONTROL_CHARACTER;
}

function icsDisplayNameParam(value) {
  const cleaned = [...String(value || "")].filter(isRepresentableInAQuotedParam).join("").trim();
  return cleaned ? `;CN="${cleaned}"` : "";
}

/** The `RRULE` line for a repeating session, or nothing for a one-off (TODO §35.3a).
 *
 * Weekdays arrive as JavaScript day numbers (0 = Sunday) — the app's one convention — and leave as
 * the two-letter codes RFC 5545 uses, which is the only place the two vocabularies meet.
 */
const ICS_WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function buildIcsRecurrenceRule({ weekdays, interval, until } = {}) {
  if (!Array.isArray(weekdays) || weekdays.length === 0) return "";
  const days = weekdays
    .map((day) => ICS_WEEKDAYS[((day % 7) + 7) % 7])
    .filter(Boolean)
    .join(",");
  if (!days) return "";
  const parts = ["FREQ=WEEKLY", `BYDAY=${days}`];
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  // An inclusive last DAY on the trainer's calendar, expressed as the instant that day ends —
  // `UNTIL` is exclusive of anything after it, and a bare date would cut the final evening.
  if (until) parts.push(`UNTIL=${String(until).replace(/-/g, "")}T235959Z`);
  return `RRULE:${parts.join(";")}`;
}

export function buildIcsContent({
  uid,
  title,
  location,
  description,
  startDate,
  endDate,
  attendeeEmail,
  attendeeName,
  organizerEmail,
  organizerName,
  recurrence,
  recurrenceId,
  sequence,
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LibrePT//Session Invite//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDateUTC(new Date())}`,
    `DTSTART:${formatIcsDateUTC(startDate)}`,
    `DTEND:${formatIcsDateUTC(endDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
  ];
  // ONE evening of a repeating session, addressed by the instant it was ORIGINALLY scheduled for
  // (TODO §35.3a). This is what makes a second file a change to that evening rather than a new
  // event beside it — and why a moved session keeps the date the series gave it. `SEQUENCE` is how
  // a calendar knows which of two files about the same evening is the newer one; without it an
  // update is silently ignored by most clients.
  if (recurrenceId) lines.push(`RECURRENCE-ID:${formatIcsDateUTC(recurrenceId)}`);
  if (sequence) lines.push(`SEQUENCE:${sequence}`);
  const rule = recurrence ? buildIcsRecurrenceRule(recurrence) : "";
  // A rule and a single-occurrence override are mutually exclusive by construction: the series file
  // carries the rule, the exception file carries the id of the evening it replaces.
  if (rule && !recurrenceId) lines.push(rule);
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  if (organizerEmail) {
    lines.push(`ORGANIZER${icsDisplayNameParam(organizerName)}:mailto:${organizerEmail}`);
  }
  if (attendeeEmail) {
    lines.push(`ATTENDEE${icsDisplayNameParam(attendeeName)};RSVP=TRUE:mailto:${attendeeEmail}`);
  }
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function buildIcsFilename(title) {
  const slug = String(title || "session")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "session"}.ics`;
}
