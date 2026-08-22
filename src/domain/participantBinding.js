// src/domain/participantBinding.js — several participants training ONE programme (TODO §8.1).
//
// Single responsibility: who is bound to whom, and what that means for their plans. No DOM, no
// storage — the clipboard paints it and the controller persists it.
//
// **A binding is a SHARED plan object, not a copy.** Two people doing the identical circuit in
// lockstep should cost the trainer one tap, and the cheapest way to guarantee that is for both
// participants to hold the same `clientState`: every existing write — a set logged, a round
// completed, an exercise swapped in the editor — then lands for everyone in the group without a
// single write site learning that bindings exist. A mirror-on-write would have been a side effect at
// a dozen seams, each of which could be missed.
//
// **What each person THOUGHT of it stays theirs.** Feedback and quick signals live on
// `activeSession.feedback`, keyed by client, not in the plan — so one client can find the shared
// circuit too hard while another finds it too easy, which was the requirement that made a simple
// "merge them into one participant" model wrong.
//
// **The bindings are recorded separately from the plans they join**, because the live session is
// cached as JSON: object identity does not survive a round trip, so a restored session would
// silently come back unbound unless the list is stored and re-applied.
//
// Injected dependencies: none — pure functions over plain objects.

/** The group a client belongs to, or null when they train their own plan. */
export function bindingFor(bindings, clientId) {
  return (bindings || []).find((group) => group.includes(clientId)) || null;
}

/** The group's members, in the order the SESSION lists its participants — so the tab bar reads the
 * same way whichever member was tapped to create the binding. */
export function bindingMembers(group, participants) {
  return (participants || []).filter((clientId) => (group || []).includes(clientId));
}

/** `clientRoutines` with every bound member pointing at ONE plan: the first member's.
 *
 * The first member's plan wins because binding is a decision made in front of the trainer, on the
 * screen they are looking at — the alternative is "whichever sorted first", which discards somebody's
 * work for a reason nobody can see.
 */
export function boundClientRoutines(clientRoutines, bindings) {
  const bound = { ...(clientRoutines || {}) };
  for (const group of bindings || []) {
    const [first, ...rest] = group.filter((clientId) => bound[clientId]);
    if (!first) continue;
    for (const clientId of rest) bound[clientId] = bound[first];
  }
  return bound;
}

/** Bindings after joining `clientIds` into one group.
 *
 * Overlapping groups are MERGED rather than allowed to coexist: two groups claiming the same person
 * would make "log it once" ambiguous, and which plan won would depend on iteration order — the kind
 * of thing nobody notices until a set goes missing. A group of one is not a group.
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

/** `clientRoutines` with `clientIds` given their own plan again — a COPY each, of the plan they
 * were training together.
 *
 * Removing the binding is not enough on its own: the members still hold the same object, so the
 * next set logged for one would go on appearing for the other, which is exactly the surprise
 * unbinding exists to end. They keep what they were doing, because they were doing it.
 */
export function unboundClientRoutines(clientRoutines, clientIds) {
  const separated = { ...(clientRoutines || {}) };
  for (const clientId of clientIds || []) {
    if (separated[clientId]) separated[clientId] = structuredClone(separated[clientId]);
  }
  return separated;
}
