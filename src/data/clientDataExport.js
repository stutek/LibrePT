// src/data/clientDataExport.js — everything held about ONE client, for an Art. 15 access request or
// an Art. 20 portability request. Pure: state in, payload out. No DOM, no crypto, no download.
//
// Deliberately not the backup file (backupFile.js). A backup is the whole database, written for a
// machine to restore; this is one person's data, written for that person to read. Handing a client
// the backup would disclose every OTHER client's health data — the single worst mistake this
// surface can make, and the reason the two are separate modules rather than one with a filter flag.
//
// Two renderings of the same facts, both in the file:
//   * `json` — machine-readable, which is what Art. 20 means by "structured, commonly used and
//     machine-readable"; a client can hand it to another trainer's software.
//   * `markdown` — human-readable, which is what Art. 15 actually needs: most people asking what
//     you hold on them want to READ it, and a JSON dump does not answer the question for them.
//
// Scoping rule, and the reason it is a whitelist and not a "remove other clients" pass: a record is
// included only if it is OWNED by this client (`clientId`) or is a session they attended. Group
// sessions are included with the OTHER participants' ids and names removed — that a session
// happened is this client's data; who else was in the room is not theirs to receive.
//
// Injected dependencies: none.

import { clientDisambiguator } from "./clientErasure.js";

export const EXPORT_FORMAT_VERSION = "1";

function sessionsAttendedBy(state, clientId) {
  return (state?.sessions || [])
    .filter((session) => (session.participants || []).includes(clientId))
    .map((session) => ({
      id: session.id,
      title: session.title || "",
      day: session.day || "",
      time: session.time || "",
      startDate: session.startDate || "",
      location: session.location || "",
      // A count, never the roster. The client is entitled to know they trained in a group of four;
      // they are not entitled to the other three people's names.
      groupSize: (session.participants || []).length,
    }));
}

/**
 * Build the disclosure payload for one client.
 *
 * `subjectRights` is part of the file on purpose: Art. 15(1) requires the response to state the
 * retention period, the recipients, and the rights the person still has — an export that is only
 * the data itself answers the request incompletely, and a trainer copying that text by hand every
 * time will eventually not.
 */
export function buildClientExport(
  state,
  clientId,
  { now = new Date(), trainer = {}, redactions = {} } = {},
) {
  const client = (state?.clients || []).find((candidate) => candidate.id === clientId);
  if (!client) return null;

  const history = (state?.history || []).filter((record) => record.clientId === clientId);
  const planUpdates = (state?.planUpdates || []).filter((record) => record.clientId === clientId);
  const sessions = sessionsAttendedBy(state, clientId);

  return {
    exportFormat: EXPORT_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    subject: subjectBlock(client, redactions),
    controller: {
      name: trainer.name || "[trainer name]",
      contact: trainer.contact || "[trainer contact]",
    },
    // Named, not silent. Art. 15(4) permits withholding another person's data; it does not permit
    // pretending the file is complete when it is not.
    redactedFields: Object.keys(redactions).filter(
      (field) => redactions[field] !== undefined && redactions[field] !== null,
    ),
    sessions,
    history,
    planUpdates,
    counts: {
      sessions: sessions.length,
      loggedSessions: history.filter((record) => !record.isPlanning).length,
      plannedSessions: history.filter((record) => record.isPlanning).length,
      planUpdates: planUpdates.length,
    },
  };
}

function subjectBlock(client, redactions) {
  return {
    id: client.id,
    name: client.name,
    alias: client.alias || "",
    email: client.email || "",
    phone: client.phone || "",
    joinedDate: client.joinedDate || "",
    goals: client.goals || "",
    // The trainer's own notes and opinions ARE the client's personal data (Art. 4(1), Recital 63 —
    // an assessment about a person is data about that person), so they are disclosed by default.
    // The trainer may substitute a redacted version through `redactions`, which exists for exactly
    // one lawful purpose: Art. 15(4), removing information about OTHER people that happens to sit
    // in the same note. It cannot be used to withhold an unflattering opinion about the subject,
    // and the payload records that a redaction happened so the client sees that something was
    // withheld rather than being handed a quietly edited file.
    trainerNotes: redactions.trainerNotes ?? client.notes ?? "",
    injuryNotes: redactions.injuryNotes ?? client.injury ?? "",
    weightHistory: client.weightHistory || [],
    consent: client.gdprConsent || null,
  };
}

function renderSets(sets) {
  return (sets || [])
    .map((set, index) => {
      const load = set.weight ? `${set.weight}kg` : "bodyweight";
      const note = set.note ? ` — ${set.note}` : "";
      return `  ${index + 1}. ${set.reps ?? "?"} reps @ ${load}${note}`;
    })
    .join("\n");
}

function aboutYouLines(subject) {
  return [
    "## About you",
    "",
    `- Name: ${subject.name}${subject.alias ? ` (${subject.alias})` : ""}`,
    `- Email: ${subject.email || "—"}`,
    `- Phone: ${subject.phone || "—"}`,
    `- Client since: ${subject.joinedDate || "—"}`,
    `- Training goals: ${subject.goals || "—"}`,
    `- Notes kept by your trainer: ${subject.trainerNotes || "—"}`,
    `- Injury / mobility notes: ${subject.injuryNotes || "—"}`,
    subject.consent?.cloudSync
      ? `- Consent recorded: signed ${subject.consent.consentDate || "—"}, form version ${subject.consent.formVersion || "—"}`
      : "- Consent recorded: none on file",
  ];
}

function sessionLines(sessions) {
  return sessions.map((session) => {
    const when = session.startDate ? session.startDate.substring(0, 10) : session.day || "—";
    const group = session.groupSize > 1 ? ` · group of ${session.groupSize}` : "";
    return `- ${when} ${session.time || ""} ${session.title || ""}${group}`.trimEnd();
  });
}

function trainingLines(history) {
  const lines = [];
  for (const record of history.filter((entry) => !entry.isPlanning)) {
    lines.push(`### ${(record.date || "").substring(0, 10)} — ${record.routineName || "Session"}`);
    for (const exercise of record.exercises || []) {
      lines.push(`- **${exercise.name || exercise.type || "item"}**`);
      const sets = renderSets(exercise.sets);
      if (sets) lines.push(sets);
    }
    for (const item of record.feedback || []) {
      lines.push(`- Feedback (${item.tag || "note"}): ${item.note || ""}`);
    }
    lines.push("");
  }
  return lines;
}

function withheldLines(redactedFields) {
  if (redactedFields.length === 0) return [];
  return [
    "## What was withheld",
    "",
    "Part of the following was removed because it named someone else, whose own data protection",
    `rights limit what can be disclosed to you (Art. 15(4)): ${redactedFields.join(", ")}.`,
    "Ask your trainer if you believe something about YOU was withheld.",
    "",
  ];
}

/** The same payload as prose, for the copy the client actually reads. */
export function renderClientExportMarkdown(payload) {
  if (!payload) return "";
  const { subject, counts, controller } = payload;
  const lines = [
    `# Your training data — ${subject.name}`,
    "",
    `Prepared ${payload.exportedAt.substring(0, 10)} by ${controller.name} (${controller.contact}),`,
    "the data controller for these records.",
    "",
    ...aboutYouLines(subject),
    "",
    `## Sessions (${counts.sessions})`,
    "",
    ...sessionLines(payload.sessions),
    "",
    `## Logged training (${counts.loggedSessions})`,
    "",
    ...trainingLines(payload.history),
    ...withheldLines(payload.redactedFields),
    "## Your rights",
    "",
    "You can ask your trainer to correct anything inaccurate (Art. 16), to delete your records",
    "(Art. 17), to restrict processing (Art. 18), or to withdraw your consent (Art. 7(3)) — the",
    "latter stops further processing without affecting what was lawfully done before it. If you",
    "believe your data has been mishandled you may complain to your national supervisory authority.",
    "",
    "This file was produced by LibrePT, which its makers never receive a copy of.",
  ];
  return lines.join("\n");
}

/**
 * The filename a trainer will have to recognise in an attachments list months later.
 *
 * Uses the disambiguator rather than the name alone: with two Jane Does on the books,
 * `jane-doe-data.json` twice in a Downloads folder is how the wrong file gets attached to the
 * wrong email — the failure this whole surface exists to avoid.
 */
export function clientExportFilename(client, { now = new Date(), extension = "json" } = {}) {
  const slug = String(client?.name || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const tail = String(client?.id || "").slice(-6);
  return `librept-${slug}-${tail}-${now.toISOString().substring(0, 10)}.${extension}`;
}

export { clientDisambiguator };
