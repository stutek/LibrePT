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
// Injected dependencies: none. The readable copy's words come from the dictionary of `payload.lang`.

import { dictionaryFor } from "../i18n/index.js";
import { localDateString } from "./calendarDay.js";
import { consentSignedDate, isConsentActive, isConsentWithdrawn } from "./clientConsent.js";
import { clientDisambiguator } from "./clientErasure.js";
import { historyFromSessionModel } from "./sessionModelConversion.js";
import { allExerciseNotes, allPrograms } from "./trainingRecords.js";

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
      // Whether it happened. The list is a record the client reads as attendance, so a Thursday the
      // trainer has booked and a Thursday they trained cannot look the same on it.
      completed: Boolean(session.completed),
    }));
}

// The client's trainings and plan changes, read through data/trainingRecords.js and written in the
// shape format 1 of this file has always carried (`history`, `planUpdates`): a client's file must
// not change because the app stores trainings differently. Plan changes run in the order they were
// taken.
function trainingsOf(state, clientId) {
  const owned = (record) => record.clientId === clientId;
  const { history, planUpdates } = historyFromSessionModel({
    clientPrograms: allPrograms(state).filter(owned),
    exerciseNotes: allExerciseNotes(state).filter(owned),
    clients: state.clients,
  });
  planUpdates.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  return { history, planUpdates };
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
  { now = new Date(), trainer = {}, redactions = {}, lang = "en" } = {},
) {
  const client = (state?.clients || []).find((candidate) => candidate.id === clientId);
  if (!client) return null;

  const { history, planUpdates } = trainingsOf(state, clientId);
  const sessions = sessionsAttendedBy(state, clientId);

  return {
    exportFormat: EXPORT_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    // The language the readable copy is written in; the reader on the client's device renders it so.
    lang,
    subject: subjectBlock(client, redactions),
    controller: {
      name: trainer.name || "",
      contact: trainer.contact || "",
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

// The words of the readable document, in the language it is written in (`payload.lang`: the one the
// client's consent form recorded, else the app's). It was English from the first line to the last,
// although it is the one document written FOR the client. A key a dictionary lacks falls back to
// English rather than to the key itself.
function wordsFor(lang) {
  const words = dictionaryFor(lang);
  const english = dictionaryFor("en");
  return (key, params = {}) => {
    let text = words[key] ?? english[key] ?? key;
    for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, value);
    return text;
  };
}

function renderSets(sets, w) {
  return (sets || [])
    .map((set, index) => {
      const load = set.weight ? `${set.weight}kg` : w("export_doc_bodyweight");
      const note = set.note ? ` — ${set.note}` : "";
      return `  ${index + 1}. ${set.reps ?? "?"} ${w("export_doc_reps")} @ ${load}${note}`;
    })
    .join("\n");
}

function aboutYouLines(subject, w) {
  return [
    w("export_doc_about"),
    "",
    `- ${w("export_doc_name")}: ${subject.name}${subject.alias ? ` (${subject.alias})` : ""}`,
    `- ${w("export_doc_email")}: ${subject.email || "—"}`,
    `- ${w("export_doc_phone")}: ${subject.phone || "—"}`,
    `- ${w("export_doc_since")}: ${subject.joinedDate || "—"}`,
    `- ${w("export_doc_goals")}: ${subject.goals || "—"}`,
    `- ${w("export_doc_notes")}: ${subject.trainerNotes || "—"}`,
    `- ${w("export_doc_injury")}: ${subject.injuryNotes || "—"}`,
    consentLine(subject.consent, w),
  ];
}

// Three outcomes, because "none on file" would misreport a client who consented and withdrew as one
// who never agreed — and the subject reading their own export is the person most entitled to see
// that their withdrawal was acted on.
function consentLine(consent, w) {
  const signed = consentSignedDate(consent) || "—";
  const version = consent?.formVersion || "—";
  if (isConsentWithdrawn(consent)) {
    return `- ${w("export_doc_consent_withdrawn", { signed, version, withdrawn: consent.withdrawnDate })}`;
  }
  if (isConsentActive(consent)) {
    return `- ${w("export_doc_consent_active", { signed, version })}`;
  }
  return `- ${w("export_doc_consent_none")}`;
}

// In date order, and each row says whether it happened. Unsorted and unmarked, the list mixed two
// Thursdays the trainer has only booked in among the ones the client trained — and this list is a
// document the client reads as a record of their attendance.
function sessionLines(sessions, w) {
  return [...sessions]
    .sort((left, right) =>
      String(left.startDate || "").localeCompare(String(right.startDate || "")),
    )
    .map((session) => {
      const when = session.startDate ? session.startDate.substring(0, 10) : session.day || "—";
      const group =
        session.groupSize > 1 ? ` · ${w("export_doc_group", { count: session.groupSize })}` : "";
      const state = w(session.completed ? "export_doc_session_held" : "export_doc_session_planned");
      return `- ${when} ${session.time || ""} ${session.title || ""}${group} · ${state}`
        .replace(/\s+·/g, " ·")
        .trimEnd();
    });
}

// The programme changes the trainer made off the back of this client's own feedback. They were
// counted in the dialog's summary and then left out of the file, so the document promised a section
// it did not have. The trainer's remark is stored after the tag, as the feedback form writes it.
function planChangeLines(planUpdates, tagText, tagNote) {
  return (planUpdates || [])
    .map((update) => {
      const when = (update.date || "").substring(0, 10);
      const tag = tagText(update.tag);
      const parts = [when, update.exerciseName, tag, tagNote(update.tag)].filter(Boolean);
      return `- ${parts.join(" · ")}`;
    })
    .filter((line) => line !== "- ");
}

function trainingLines(history, w, tagText) {
  const lines = [];
  for (const record of history.filter((entry) => !entry.isPlanning)) {
    const title = record.routineName || w("export_doc_session");
    lines.push(`### ${(record.date || "").substring(0, 10)} — ${title}`);
    for (const exercise of record.exercises || []) {
      lines.push(`- **${exercise.name || exercise.type || "item"}**`);
      const sets = renderSets(exercise.sets, w);
      if (sets) lines.push(sets);
    }
    for (const item of record.feedback || []) {
      // The signal in the language the document is written in. The stored tag is an English
      // identifier ("Too Hard - Reduce Load"), and printing it put two English lines in the middle of
      // a Slovenian document the client had asked for.
      const tag = tagText(item.tag) || w("export_doc_session");
      lines.push(`- ${w("export_doc_feedback")} (${tag}): ${item.note || ""}`);
    }
    lines.push("");
  }
  return lines;
}

function withheldLines(redactedFields, w) {
  if (redactedFields.length === 0) return [];
  return [
    w("export_doc_withheld_title"),
    "",
    w("export_doc_withheld_body", { fields: redactedFields.join(", ") }),
    w("export_doc_withheld_ask"),
    "",
  ];
}

// Named when the trainer's details are known; otherwise the document says "your trainer" rather
// than printing a placeholder in brackets where a legal role is named.
function preparedLine(payload, w) {
  const { controller } = payload;
  const date = payload.exportedAt.substring(0, 10);
  if (!controller?.name) return w("export_doc_prepared_unnamed", { date });
  const contact = controller.contact ? ` (${controller.contact})` : "";
  return w("export_doc_prepared", { date, controller: `${controller.name}${contact}` });
}

/** The same payload as prose, for the copy the client actually reads. */
/**
 * The readable copy, in the language the payload was built for.
 *
 * `tagText` turns a stored feedback tag into the words for it. It is INJECTED because the mapping is
 * the domain's (domain/feedbackTags.js) and this module is a layer below it; without it the document
 * printed the stored English identifier — "Too Hard - Reduce Load" — in the middle of a Slovenian
 * document a client had asked for. Both callers live in modules/ and pass it. `tagNote` reads the
 * trainer's remark a plan change stores after its tag, injected for the same reason.
 */
export function renderClientExportMarkdown(
  payload,
  { tagText = (tag) => tag || "", tagNote = () => "" } = {},
) {
  if (!payload) return "";
  const w = wordsFor(payload.lang);
  const { subject, counts } = payload;
  const lines = [
    w("export_doc_title", { name: subject.name }),
    "",
    preparedLine(payload, w),
    "",
    ...aboutYouLines(subject, w),
    "",
    w("export_doc_sessions", { count: counts.sessions }),
    "",
    ...sessionLines(payload.sessions, w),
    "",
    w("export_doc_logged", { count: counts.loggedSessions }),
    "",
    ...trainingLines(payload.history, w, tagText),
    ...(counts.planUpdates
      ? [
          w("export_doc_plan_changes", { count: counts.planUpdates }),
          "",
          ...planChangeLines(payload.planUpdates, tagText, tagNote),
          "",
        ]
      : []),
    ...withheldLines(payload.redactedFields, w),
    w("export_doc_rights_title"),
    "",
    w("export_doc_rights_body"),
    "",
    w("export_doc_produced"),
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
  return `librept-${slug}-${tail}-${localDateString(now)}.${extension}`;
}

export { clientDisambiguator };
