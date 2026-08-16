// tests/unit_js/data/calendarInvite.test.mjs
// The .ics a session invite is (src/data/calendarInvite.js).
//
// This is a PERSISTED FORMAT in the sense AGENT_RULES §5.8 carves out: the bytes leave the app and
// are parsed by Google Calendar, Outlook and Apple Calendar, none of which we can fix. So the tests
// pin the wire format deliberately — the properties another program reads, not how they are built.

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIcsContent, buildIcsFilename } from "../../../src/data/calendarInvite.js";

const BASE = {
  uid: "s1-c1",
  title: "Hypertrophy Upper",
  startDate: new Date("2026-09-15T12:00:00Z"),
  endDate: new Date("2026-09-15T13:00:00Z"),
};
const lines = (overrides) => buildIcsContent({ ...BASE, ...overrides }).split("\r\n");
const lineStartingWith = (ics, prefix) => lines(ics).find((line) => line.startsWith(prefix));

test("an invite names an organizer for the reply to go back to", () => {
  // The whole point of the property: RFC 5546 sends a METHOD:REPLY to this address, so without it a
  // calendar client has nowhere to send an acceptance and generally sends none.
  assert.equal(
    lineStartingWith({ organizerEmail: "pt@librept.test" }, "ORGANIZER"),
    "ORGANIZER:mailto:pt@librept.test",
  );
});

test("an organizer with a display name carries it as a quoted CN", () => {
  assert.equal(
    lineStartingWith({ organizerEmail: "pt@librept.test", organizerName: "Sam Ray" }, "ORGANIZER"),
    'ORGANIZER;CN="Sam Ray":mailto:pt@librept.test',
  );
});

test("a display name cannot break out of its quoted parameter", () => {
  // A quoted param value has no escape sequence in RFC 5545 — a stray quote or control character
  // would end the parameter, or the whole content line, and take the file's structure with it.
  const organizer = lineStartingWith(
    { organizerEmail: "pt@librept.test", organizerName: 'Sa"m\r\nX-EVIL:1' },
    "ORGANIZER",
  );
  assert.equal(organizer, 'ORGANIZER;CN="SamX-EVIL:1":mailto:pt@librept.test');
  const injected = lines({
    organizerEmail: "pt@librept.test",
    organizerName: 'Sa"m\r\nX-EVIL:1',
  }).filter((line) => line.startsWith("X-EVIL"));
  assert.deepEqual(injected, [], "nothing the name contained became a property of its own");
});

test("no organizer address means no ORGANIZER line, not an empty one", () => {
  assert.equal(lineStartingWith({}, "ORGANIZER"), undefined);
});

test("an attendee is asked to reply, by name where there is one", () => {
  assert.equal(
    lineStartingWith({ attendeeEmail: "jane@librept.test", attendeeName: "Jane Doe" }, "ATTENDEE"),
    'ATTENDEE;CN="Jane Doe";RSVP=TRUE:mailto:jane@librept.test',
  );
});

test("the file is a request a calendar client will act on", () => {
  const ics = lines({ attendeeEmail: "jane@librept.test", organizerEmail: "pt@librept.test" });
  assert.ok(ics.includes("METHOD:REQUEST"));
  assert.ok(ics.includes("BEGIN:VEVENT"));
  assert.ok(ics.includes("UID:s1-c1"));
  assert.ok(ics.includes("DTSTART:20260915T120000Z"));
  assert.ok(ics.includes("DTEND:20260915T130000Z"));
});

test("text values escape what RFC 5545 requires", () => {
  const summary = lineStartingWith({ title: "Upper; heavy, with a\\slash" }, "SUMMARY");
  assert.equal(summary, "SUMMARY:Upper\\; heavy\\, with a\\\\slash");
});

test("the filename is a slug of the session, never empty", () => {
  assert.equal(buildIcsFilename("Hypertrophy Upper!"), "hypertrophy-upper.ics");
  assert.equal(buildIcsFilename("!!!"), "session.ics");
  assert.equal(buildIcsFilename(""), "session.ics");
});
