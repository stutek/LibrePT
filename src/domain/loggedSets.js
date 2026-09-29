// src/domain/loggedSets.js — how many sets each participant has logged in a live session.
//
// A set is logged when its log entry is flagged `completed`: the same test the finish path uses to
// decide whether a session is empty (countCompletedSets in sessionLifecycle.js) and that a history
// record keeps as `completed` on each set (sessionItemRecord.js). Pure: reads the session it is given.

/** `[{ clientId, count }]` in participant order, leaving out participants with no logged set. */
export function loggedSetsPerParticipant(activeSession) {
  const counts = [];
  for (const clientId of activeSession?.participants || []) {
    const logs = activeSession.clientRoutines?.[clientId]?.logs || {};
    const count = Object.values(logs).reduce(
      (sum, sets) => sum + sets.filter((set) => set.completed).length,
      0,
    );
    if (count > 0) counts.push({ clientId, count });
  }
  return counts;
}
