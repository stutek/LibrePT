// src/data/calendarInvite.js
// Builds an RFC 5545 .ics VEVENT for a PT-assigned session. LibrePT has no backend/SMTP relay to
// send mail itself (TODO §1.5's "no backend of our own" stance), so the invite is a downloadable
// file the trainer attaches to a prefilled mailto compose — see sessionInviteDialog.js.

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

export function buildIcsContent({
  uid,
  title,
  location,
  description,
  startDate,
  endDate,
  attendeeEmail,
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
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  if (attendeeEmail) lines.push(`ATTENDEE;RSVP=TRUE:mailto:${attendeeEmail}`);
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
