// src/domain/sessionHistoryRecord.js — one live session's work, projected into the record that
// gets stored per participant.
//
// `sessionItemRecord.js` owns the `exercises` ARRAY inside the record (typed items, circuit
// grouping, prescribed-but-skipped work). This module owns the record AROUND it: who it belongs to,
// when, how long, and which feedback travels with it.
//
// It exists because that record was being built in two places with two slightly different sets of
// fields (TODO §24.4) — once when a session is completed, and once every time a PLANNING draft is
// cached. They agree on everything that matters and always did, but only by hand, and the planning
// path is the one that runs on every keystroke, so a field added to the finish path alone would
// have gone unnoticed until a draft was reopened and found to be missing it.
//
// Pure: takes the client, their plan state and the session's own timing, returns a record. Deciding
// WHEN to write one, and putting it anywhere, belongs to the controller.

import { newRecordId } from "../data/recordId.js";
import { buildProgramSnapshot } from "./sessionItemRecord.js";

// A session where nothing was performed writes no history — there is nothing to look back on, and a
// record of it would only clutter the client's timeline. A PLANNING draft is the exception: it is
// authored rather than performed, so it is always worth keeping (it is what backs the notification
// feed's "unscheduled plans" list).
function isWorthRecording(program, isPlanning) {
  if (isPlanning) return true;
  return program.some((item) => item.type === "exercise" && item.completed);
}

export function buildSessionHistoryRecord({
  client,
  clientState,
  feedback = [],
  dateISO,
  duration,
  isPlanning = false,
  title = "",
}) {
  if (!client || !clientState) return null;

  // The WHOLE program as an immutable snapshot — rests, circuit grouping and prescribed-but-skipped
  // exercises included — rather than flattening to performed sets only (TODO §17.1).
  const program = buildProgramSnapshot(clientState, { isPlanning });
  if (!isWorthRecording(program, isPlanning)) return null;

  const record = {
    id: newRecordId(),
    clientId: client.id,
    clientName: client.name,
    routineName: clientState.routineName,
    date: dateISO,
    duration,
    exercises: program,
    feedback: feedback.filter((entry) => entry.clientId === client.id),
  };
  if (isPlanning) {
    record.isPlanning = true;
    record.title = title;
  }
  return record;
}

// A planning draft is edited over and over, so it UPSERTS rather than letting every cache sync pile
// up a duplicate in the feed. Returns the stored record, whose `id` the caller keeps to address the
// same draft on the next sync.
//
// `draftId` names WHICH draft is being edited, and it matters as soon as one client can hold more
// than one: a deleted session leaves an unscheduled plan per participant, so a client who already
// had a draft open now has two. Matching on clientId alone — all this did — would then find the
// wrong one and overwrite a plan the trainer never opened. Without a draftId (a brand-new planning
// clipboard, or one cached before drafts were addressable) it still falls back to clientId, which
// is unambiguous precisely when the client has only the one.
//
// Either way the existing record keeps its id and its feedback: the id is what a deep link and the
// feed's own list are keyed on, so re-authoring a draft must not invalidate a link to it.
export function upsertPlanningRecord(history, record, draftId = null) {
  const existing = draftId
    ? history.find((entry) => entry.isPlanning && entry.id === draftId)
    : history.find((entry) => entry.isPlanning && entry.clientId === record.clientId);
  if (!existing) {
    history.push(record);
    return record;
  }
  existing.routineName = record.routineName;
  existing.title = record.title;
  existing.date = record.date;
  existing.exercises = record.exercises;
  return existing;
}
