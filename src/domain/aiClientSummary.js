// src/domain/aiClientSummary.js — the client summary a trainer copies into an AI assistant.
//
// **What it leaves out is the point.** The copy is pasted into a service outside the app, so it
// carries the client's ID and what they did, set by set, and nothing the trainer typed as free text:
// no name, no contact details, no goals, no notes. Goals and notes are where a client's name gets
// written ("Ana has a sensitive knee"), and notes hold injuries, which are health data. The copy
// used to include both while its message called it safe to use. The message now names what was
// left out instead of promising anything.
//
// The summary stays in English: it is data for an AI tool, not text on the trainer's screen.
//
// Pure: a client record and the programs (data/trainingRecords.js) in, a string out.

import { localDateString } from "../data/calendarDay.js";
import { exerciseRecordsOf, isSkippedRecord } from "./sessionItemRecord.js";

const RECENT_SESSIONS = 10;

function exerciseLine(record) {
  if (isSkippedRecord(record)) return `- ${record.name}: skipped`;
  const sets = (Array.isArray(record.sets) ? record.sets : [])
    .map((set) => `${set.reps ?? "?"} @ ${set.weight ? `${set.weight} kg` : "bodyweight"}`)
    .join(", ");
  return `- ${record.name}: ${sets || "no sets recorded"}`;
}

export function aiClientSummary(client, programs) {
  // A planned program is awaiting a session, not a session that happened.
  const sessions = (programs || []).filter(
    (program) => program.clientId === client.id && program.status === "done",
  );
  // Newest first, by when it was performed: storage order is the order of writing, and a restored
  // backup writes old sessions last.
  const recent = [...sessions]
    .sort((a, b) => String(b.performedAt || "").localeCompare(String(a.performedAt || "")))
    .slice(0, RECENT_SESSIONS)
    .map((program) => {
      const lines = exerciseRecordsOf(program.exercises || []).map(exerciseLine);
      // The local calendar day: the instant's first ten characters are the day in UTC.
      const day = program.performedAt ? localDateString(program.performedAt) : "";
      return [`### Session on ${day}`, ...lines].join("\n");
    })
    .join("\n\n");
  return [
    "# Client training summary",
    `- Client: #${client.id}`,
    `- Logged sessions: ${sessions.length}`,
    "",
    "## Recent sessions",
    recent || "_No session history recorded._",
  ].join("\n");
}
