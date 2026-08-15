// src/domain/quickSignals.js — the rules behind the deck's one-tap Too Easy / Too Hard buttons.
//
// A quick signal is a bare tag the trainer taps mid-set, as opposed to a feedback-modal entry that
// carries a typed note or a voice memo. The distinction is the whole point of this module: a
// quick tap is disposable and may be un-tapped or superseded, while something the trainer actually
// wrote must never be deleted by a toggle they did not aim at it.
//
// Pure (TODO §24.4): every function takes the feedback list as an argument and returns a decision
// or a new entry — none of them mutate a session, persist, or render. The controller owns those.
//
// A feedback entry, as it appears on `activeSession.feedback`:
//   { id, clientId, exerciseName, tag, note, hasVoiceNote }
// and its `state.planUpdates` twin, which carries the extra reporting fields (clientName, date,
// resolved) but shares the id — the two are removed together or not at all.

import { newRecordId } from "../data/recordId.js";

// The "vanilla" entry logQuickSignal itself creates — no typed note, no voice note. A
// modal-authored entry always carries at least a tag choice and may append a note, so this
// predicate is how the toggle avoids ever deleting something the PT actually wrote: only an
// untouched quick-tap is safe to un-tap.
export const isPlainQuickSignal = (entry) => !entry.note?.trim() && !entry.hasVoiceNote;

// Too Easy and Too Hard are mutually exclusive — an exercise can't be both at once — but each
// stays independently tappable rather than requiring an untap-then-tap: hitting the opposite
// signal silently replaces the current one, which is what mistype correction on the gym floor
// actually needs (the PT meant to tap the other button, not to clear this one first).
export const OPPOSITE_QUICK_SIGNAL = {
  "Too Easy - Increase Load": "Too Hard - Reduce Load",
  "Too Hard - Reduce Load": "Too Easy - Increase Load",
};

export function oppositeQuickSignal(tag) {
  return OPPOSITE_QUICK_SIGNAL[tag] || null;
}

const matches = (entry, clientId, exerciseName, tag) =>
  entry.clientId === clientId && entry.exerciseName === exerciseName && entry.tag === tag;

// Whether THIS exact quick-signal is currently active for the exercise — the toggle's "on" state,
// and what the Too Easy / Too Hard buttons render pressed against.
export function hasQuickSignal(feedback, clientId, exerciseName, tag) {
  return (feedback || []).some(
    (entry) => matches(entry, clientId, exerciseName, tag) && isPlainQuickSignal(entry),
  );
}

// Whether the trainer WROTE something here — a typed note or a voice memo — as opposed to having
// tapped a bare signal. Deliberately the exact inverse of isPlainQuickSignal rather than its own
// condition, so "safe to un-tap" and "has a note worth marking" can never disagree about the same
// entry (TODO §7.2). Independent of any signal: a card can carry either, both or neither.
export function hasExerciseNote(feedback, clientId, exerciseName) {
  return (feedback || []).some(
    (entry) =>
      entry.clientId === clientId &&
      entry.exerciseName === exerciseName &&
      !isPlainQuickSignal(entry),
  );
}

// The ids of every untouched quick-signal entry matching (clientId, exerciseName, tag). Returned
// as a Set rather than removed here, because the same ids have to be dropped from BOTH
// activeSession.feedback and state.planUpdates — a mis-tap that cleared only one would leave a
// phantom entry in the other.
export function plainQuickSignalIds(feedback, clientId, exerciseName, tag) {
  return new Set(
    (feedback || [])
      .filter((entry) => matches(entry, clientId, exerciseName, tag) && isPlainQuickSignal(entry))
      .map((entry) => entry.id),
  );
}

// The pair of records one quick tap creates: the reporting entry that lands in state.planUpdates
// and the lean session-local twin. They share an id on purpose — see this file's header.
export function buildQuickSignalEntries({ clientId, clientName, exerciseName, tag }) {
  const id = newRecordId();
  return {
    planUpdate: {
      id,
      clientId,
      clientName,
      date: new Date().toISOString(),
      exerciseName,
      tag,
      hasVoiceNote: false,
      resolved: false,
    },
    sessionFeedback: { id, clientId, exerciseName, tag, note: "", hasVoiceNote: false },
  };
}

// What colour the deck card's signal dot takes for an exercise. Severity order, not recency: an
// entry the trainer WROTE outranks any bare tap, because it is the one carrying detail nobody can
// reconstruct from a colour.
export function quickSignalColor(feedback, clientId, exerciseName) {
  const entries = (feedback || []).filter(
    (entry) => entry.clientId === clientId && entry.exerciseName === exerciseName,
  );
  if (entries.length === 0) return null;
  if (entries.some((entry) => entry.note?.trim() || entry.hasVoiceNote)) return "var(--danger)";
  if (entries.some((entry) => /too hard|reduce load/i.test(entry.tag))) return "#f59e0b";
  if (entries.some((entry) => /too easy|increase load/i.test(entry.tag))) return "var(--success)";
  return "var(--danger)";
}
