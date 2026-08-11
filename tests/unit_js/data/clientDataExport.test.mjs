// tests/unit_js/data/clientDataExport.test.mjs
// The Art. 15 / Art. 20 disclosure payload (src/data/clientDataExport.js).
//
// The failure this file guards is asymmetric: forgetting a field means an incomplete disclosure and
// an annoyed client, while including one client's data in ANOTHER client's export is a personal-data
// breach — committed while trying to honour a right. So most of these tests are about what must NOT
// be in the file.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildClientExport,
  clientExportFilename,
  renderClientExportMarkdown,
} from "../../../src/data/clientDataExport.js";

function gymState() {
  return {
    clients: [
      {
        id: "c-jane",
        name: "Jane Doe",
        alias: "morning",
        email: "jane@example.com",
        phone: "+386 40 111 111",
        joinedDate: "2026-01-05",
        goals: "Squat 100kg",
        notes: "Anxious about failing lifts; go easy on maxes",
        injury: "L4 disc",
        weightHistory: [{ date: "2026-01-05", kg: 64 }],
        gdprConsent: { cloudSync: true, consentDate: "2026-01-05", formVersion: "2026-08-09" },
        active: true,
      },
      { id: "c-marko", name: "Marko Novak", email: "marko@example.com", active: true },
    ],
    history: [
      {
        id: "h1",
        clientId: "c-jane",
        clientName: "Jane Doe",
        date: "2026-02-01T09:00:00.000Z",
        routineName: "Upper A",
        exercises: [{ name: "Bench Press", sets: [{ reps: 5, weight: 40, note: "RPE 8" }] }],
        feedback: [{ tag: "Too Easy", note: "flew through it" }],
      },
      { id: "h2", clientId: "c-marko", clientName: "Marko Novak", exercises: [] },
    ],
    planUpdates: [
      { id: "p1", clientId: "c-jane", clientName: "Jane Doe", resolved: false },
      { id: "p2", clientId: "c-marko", clientName: "Marko Novak", resolved: false },
    ],
    sessions: [
      { id: "s1", participants: ["c-jane"], title: "1:1", day: "Mon", time: "07:00" },
      { id: "s2", participants: ["c-jane", "c-marko"], title: "Small group", day: "Wed" },
      { id: "s3", participants: ["c-marko"], title: "Marko only", day: "Fri" },
    ],
  };
}

test("the export contains only the requesting client's records", () => {
  const payload = buildClientExport(gymState(), "c-jane");
  const serialized = JSON.stringify(payload);

  assert.equal(payload.history.length, 1);
  assert.equal(payload.planUpdates.length, 1);
  // The single worst mistake this surface can make: handing one client another's health data.
  assert.ok(!serialized.includes("Marko"), "another client's name leaked into the export");
  assert.ok(!serialized.includes("marko@example.com"));
  assert.ok(!serialized.includes("c-marko"));
});

test("a group session is disclosed as a size, never as a roster", () => {
  const payload = buildClientExport(gymState(), "c-jane");
  const group = payload.sessions.find((session) => session.id === "s2");

  // That the session happened is this client's data; who else was in the room is not theirs.
  assert.equal(group.groupSize, 2);
  assert.equal(group.participants, undefined);
  assert.equal(payload.sessions.length, 2, "sessions they did not attend must not appear");
});

test("the trainer's own notes are disclosed by default", () => {
  // An assessment about a person is that person's personal data (Art. 4(1), Recital 63) — it is not
  // the trainer's private material to withhold, however uncomfortable the wording.
  const payload = buildClientExport(gymState(), "c-jane");

  assert.match(payload.subject.trainerNotes, /Anxious about failing lifts/);
  assert.equal(payload.subject.injuryNotes, "L4 disc");
  assert.deepEqual(payload.redactedFields, []);
});

test("a redaction is applied and declared, never applied silently", () => {
  const payload = buildClientExport(gymState(), "c-jane", {
    redactions: {
      trainerNotes: "Anxious about failing lifts; [redacted — concerns another person]",
    },
  });

  assert.ok(!payload.subject.trainerNotes.includes("go easy on maxes"));
  assert.deepEqual(payload.redactedFields, ["trainerNotes"]);
  // Art. 15(4) permits withholding another person's data; it does not permit a quietly edited file.
  assert.match(renderClientExportMarkdown(payload), /What was withheld/);
});

test("the readable rendering answers the question the client actually asked", () => {
  const markdown = renderClientExportMarkdown(buildClientExport(gymState(), "c-jane"));

  assert.match(markdown, /# Your training data — Jane Doe/);
  assert.match(markdown, /5 reps @ 40kg — RPE 8/);
  assert.match(markdown, /Consent recorded: signed 2026-01-05/);
  // Art. 15(1) wants the rights restated, not just the data dumped.
  assert.match(markdown, /Art\. 17/);
  assert.match(markdown, /supervisory authority/);
});

test("the filename disambiguates two clients with the same name", () => {
  const now = new Date("2026-08-11T10:00:00.000Z");
  const janeA = clientExportFilename({ id: "c-jane-a", name: "Jane Doe" }, { now });
  const janeB = clientExportFilename({ id: "c-jane-b", name: "Jane Doe" }, { now });

  // Two identical filenames in a Downloads folder is how the wrong file gets attached to an email.
  assert.notEqual(janeA, janeB);
  assert.match(janeA, /^librept-jane-doe-[\w-]+-2026-08-11\.json$/);
});

test("exporting an unknown client returns nothing rather than an empty shell", () => {
  assert.equal(buildClientExport(gymState(), "c-nobody"), null);
  assert.equal(renderClientExportMarkdown(null), "");
});
