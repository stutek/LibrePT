// src/domain/gymNotes.js — what the gym already said about one client, ordered for the plan the
// trainer is looking at (TODO §35.3c/d).
//
// Single responsibility: the selection and the order. No DOM, no storage — the panel that shows
// this is modules/clipboard/activeSessionBoard.js's client focus panel.
//
// **Why this exists at all.** Signals and notes are captured one-handed mid-circuit and land in
// `state.planUpdates`, where they wait on the Pending Review screen — a place a trainer visits when
// they think of it. The moment they actually need them is the one they are never on: shaping this
// client's next plan. §35's story is built around that payoff, and the capture steps are short
// precisely because the pane is the point.
//
// **In-plan first, then newest.** Ordering by date alone buries the deadlift note under an
// unrelated signal from yesterday, which is the same as not showing it: the claim being made is
// that a note about a movement comes back when that movement is programmed again.
//
// **Resolved notes stay gone.** Asking the same question twice is how a review surface teaches
// people to stop reading it.
//
// Injected dependencies: none — pure functions over plain objects.

const nameKey = (name) => (name || "").trim().toLowerCase();

/** This client's unanswered gym notes, the ones about movements in `planExerciseNames` first.
 *
 * Returns entries as stored plus `inThisPlan`, so a caller can mark them without re-deriving the
 * match — the panel says WHY an entry is at the top, or the ordering reads as arbitrary. */
export function gymNotesForPlan({ planUpdates, clientId, planExerciseNames } = {}) {
  const planned = new Set((planExerciseNames || []).map(nameKey));
  return (planUpdates || [])
    .filter((update) => update.clientId === clientId && !update.resolved)
    .map((update) => ({ ...update, inThisPlan: planned.has(nameKey(update.exerciseName)) }))
    .sort((a, b) => {
      if (a.inThisPlan !== b.inThisPlan) return a.inThisPlan ? -1 : 1;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
}

/** The client-record line a kept gym note becomes (TODO §35.3c).
 *
 * A dated sentence appended to the notes the trainer already writes by hand, rather than a new
 * field: this is the text every future plan is written against, it is durable in the stable schema,
 * and a trainer reading their own record should not have to tell two kinds of note apart. Returns
 * the WHOLE new notes value, so the caller assigns rather than concatenating in three places.
 *
 * `on` is a calendar date, not an instant: what matters to a reader is the day it was said.
 */
export function notesWithGymNote(existingNotes, { on, exerciseName, tag } = {}) {
  const movement = (exerciseName || "").trim();
  const said = [movement, (tag || "").trim()].filter(Boolean).join(": ");
  if (!said) return existingNotes || "";
  const line = [on, said].filter(Boolean).join(" — ");
  const before = (existingNotes || "").trim();
  return before ? `${before}\n${line}` : line;
}
