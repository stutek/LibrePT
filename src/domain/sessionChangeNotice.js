// src/domain/sessionChangeNotice.js — which session edits a client needs to hear about, and who was
// actually invited (TODO §1.6).
//
// Single responsibility: the two pure questions behind "should the trainer be asked to resend?". The
// asking is modules/session/, the sending is the invite dialog.
//
// Asked for 2026-08-17 (Simon): "when a session gets changed, PT should be asked if they want to resend
// invitations."
//
// **Which changes count is the whole design.** Prompting on every edit is the failure mode: a trainer
// who is asked to message six people because they fixed a typo learns to dismiss the prompt, and then
// dismisses the one that mattered. So the test applied here is behavioural — would the client, standing
// somewhere at some time, do something different? A moved slot or a new room, yes. A renamed session or
// a swapped exercise, no; those are the trainer's own bookkeeping, and plan edits happen constantly,
// including mid-session.
//
// **Only people who were actually invited are offered a resend**, because "not all attendees need an
// invitation, some will be added manually" (same ruling). Someone written in by hand was never sent
// anything, so there is nothing to RE-send them — and quietly turning a time change into their first
// invitation is not what was asked for.
//
// deps: none — pure comparisons over plain records.

// The fields a client would act on differently. `startDate` and `time` are one concern (an absolute
// instant and the label describing it) and collapse to a single "time" answer, because reporting both
// would tell the trainer the slot changed twice.
const TIME_FIELDS = ["startDate", "time"];
const PLACE_FIELD = "location";

/** Two lists are the same set regardless of the order they happen to be stored in — a reordered
 *  participant array is not news, and neither is a differently-ordered modality profile. */
function sameSet(before = [], after = []) {
  if (before.length !== after.length) return false;
  const seen = new Set(before);
  return after.every((value) => seen.has(value));
}

/**
 * The material differences between two versions of a session: any of `"time"`, `"location"`, `"focus"`
 * and `"participants"`, or none.
 *
 * `focus` is the session's KIND — the set of modalities its routines prescribe, which the caller
 * supplies as `modalities` (see `sessionModalityProfile`). Refined 2026-08-17: a session that turns from
 * leg strength into cardio is something a client prepares differently for — shoes, food, how hard they
 * work that morning — while the same kind of session with a different plan inside it is ordinary
 * programming work and asks nothing.
 *
 * `participants` is the invitee list, because who else is in the room is part of what a client accepted:
 * a one-to-one that becomes a group of five is a different offer.
 *
 * Empty for a session that did not exist before — creating one already opens the invite dialog on its
 * own, and treating creation as a change would ask about the same invitations twice.
 */
export function materialSessionChanges(before, after) {
  if (!before || !after) return [];

  const changes = [];
  if (TIME_FIELDS.some((field) => (before[field] || "") !== (after[field] || ""))) {
    changes.push("time");
  }
  if ((before[PLACE_FIELD] || "") !== (after[PLACE_FIELD] || "")) changes.push(PLACE_FIELD);
  if (!sameSet(before.modalities, after.modalities)) changes.push("focus");
  if (!sameSet(before.participants, after.participants)) changes.push("participants");
  return changes;
}

/**
 * The KIND of session its routines add up to: a sorted, unique list of modalities.
 *
 * A set rather than a dominant one, deliberately: "strength, and now also cardio" is exactly the change
 * a client needs to hear about, and picking a single headline modality would hide it. Sorted so two
 * profiles compare by content and not by the order routines happened to be listed in.
 *
 * An unknown or empty routine contributes nothing rather than inventing a kind — a session whose plan is
 * not written yet has no character to have changed.
 */
export function sessionModalityProfile(routineIds = [], routines = [], exercises = []) {
  const modalityById = new Map(
    exercises.map((exercise) => [
      exercise.id,
      // Absent means strength, the same default exerciseModality.js applies — otherwise every seeded
      // strength movement would read as a modality change the first time this ran.
      exercise.modality || "strength",
    ]),
  );

  const found = new Set();
  for (const routineId of routineIds) {
    const routine = routines.find((candidate) => candidate.id === routineId);
    for (const item of routine?.exercises || []) {
      const modality = modalityById.get(item.exerciseId);
      if (modality) found.add(modality);
    }
  }
  return [...found].sort();
}

/**
 * The clients to offer a resend to: invited for THIS session, and still on its participant list.
 *
 * Both conditions matter. Without the first, a hand-added attendee gets an invitation they were never
 * promised; without the second, someone the trainer has since removed is chased about a session they
 * are no longer part of.
 */
export function clientsToNotify(invites, sessionId, participants = []) {
  const stillIn = new Set(participants);
  return (invites || [])
    .filter((invite) => invite.sessionId === sessionId && stillIn.has(invite.clientId))
    .map((invite) => invite.clientId);
}
