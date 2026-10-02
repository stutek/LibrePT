// src/domain/participantBinding.js — several participants starting from ONE programme.
//
// Single responsibility: who is grouped with whom, and what grouping does to their plans. No DOM, no
// storage — the clipboard paints it and the controller persists it.
//
// **A group records who started from the same programme, and nothing more** (ruled by Simon,
// 2026-10-02). Members are not merged: each keeps their own tab, their own copy of the plan, their
// own active card — people in one group move through a session at different speeds — and their own
// logged sets and notes. Grouping gives every member a copy of one plan's PRESCRIPTION, with the
// same item ids across the group, so "who is on which item" and the stored programs stay comparable
// member by member. What anybody performed does not travel (the rule domain/planCopy.js states for
// a copied plan).
//
// **Changing one member's plan takes that member out of the group**, with the changed copy: from then
// on they no longer train what the others train. Logging a set, a quick signal or a note does not:
// those are per member anyway.
//
// **A group is a list of client ids**, `activeSession.bindings` on the clipboard and one
// `groupSharedPrograms` row per group in storage. Restoring a session rebuilds each member's plan
// from their own program and the group from that row.
//
// Injected dependencies: none — pure functions over plain objects.

/** The group a client belongs to, or null when they are in none. */
export function bindingFor(bindings, clientId) {
  return (bindings || []).find((group) => group.includes(clientId)) || null;
}

/** Bindings after joining `clientIds` into one group.
 *
 * Overlapping groups are MERGED rather than allowed to coexist: two groups claiming the same person
 * would leave it unanswerable which programme that person started from. A group of one is not a
 * group.
 */
export function withBinding(bindings, clientIds) {
  const wanted = [...new Set(clientIds || [])];
  if (wanted.length < 2) return [...(bindings || [])];
  const merged = new Set(wanted);
  const untouched = [];
  for (const group of bindings || []) {
    if (group.some((clientId) => merged.has(clientId))) {
      for (const clientId of group) merged.add(clientId);
    } else {
      untouched.push(group);
    }
  }
  return [...untouched, [...merged]];
}

/** Bindings after taking one client out. A group that drops to a single member stops being one. */
export function withoutBinding(bindings, clientId) {
  return (bindings || [])
    .map((group) => group.filter((member) => member !== clientId))
    .filter((group) => group.length > 1);
}

// One set row per prescribed set, at the prescribed numbers and not done: a plan nobody has
// trained yet, which is what a member who joins the group starts from.
function prescribedSets(item) {
  return Array.from({ length: Math.max(1, item.setsTargetCount ?? 1) }, () => ({
    reps: item.repsTarget ?? 0,
    weight: item.weightTarget ?? 0,
    completed: false,
    note: "",
  }));
}

/** A member's plan when they join a group: the source plan's prescription, item for item under the
 *  same ids, with none of the source's logged sets. What the member logged on an item the group's
 *  plan also has stays theirs; every other item starts at its prescribed sets. Their own place in
 *  it — the active card, whether the deck is open — stays theirs, kept inside the new plan's
 *  length. */
function prescriptionFor(member, source) {
  const exercises = (source.exercises || []).map((item) => {
    const { completed: _doneByAnotherPerson, ...prescription } = structuredClone(item);
    return prescription;
  });
  const logs = {};
  for (const item of exercises) {
    if (item.type !== "rest") logs[item.id] = member?.logs?.[item.id] ?? prescribedSets(item);
  }
  const lastIndex = Math.max(0, exercises.length - 1);
  return {
    ...member,
    routineId: source.routineId,
    routineName: source.routineName,
    exercises,
    logs,
    circuitRounds: {},
    activeExerciseIndex: Math.min(member?.activeExerciseIndex ?? 0, lastIndex),
  };
}

/** `clientRoutines` after the group `memberIds` is formed on `sourceId`'s plan — the one on screen.
 *
 * Every member who was not yet in a group with the source gets the source plan's prescription
 * (prescriptionFor). The source, and members already grouped with it, keep their plan and what they
 * logged in it: their prescription is the group's already. Each member's object stays their own.
 */
export function groupedClientRoutines(clientRoutines, { sourceId, memberIds, bindings = [] }) {
  const source = clientRoutines?.[sourceId];
  const grouped = { ...(clientRoutines || {}) };
  if (!source) return grouped;
  const alreadyWithSource = new Set(bindingFor(bindings, sourceId) || [sourceId]);
  for (const clientId of memberIds || []) {
    if (alreadyWithSource.has(clientId) || !grouped[clientId]) continue;
    grouped[clientId] = prescriptionFor(grouped[clientId], source);
  }
  return grouped;
}
