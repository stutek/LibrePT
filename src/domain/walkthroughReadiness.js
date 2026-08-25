// src/domain/walkthroughReadiness.js — can the guided walkthrough actually run on this store?
//
// Single responsibility: answer that from the data alone. Pure — no DOM, no storage, no import of
// the tour script itself (which lives a layer up in modules/demo/).
//
// **Why it exists** (TODO §28.14): the walkthrough drives the app's own real controls — open the
// group session, focus a CIRCUIT card, signal it too easy, switch to the second participant. Offered
// on a database that cannot satisfy those, it stops on its first step in front of the person being
// shown the product, which is worse than not offering it at all.
//
// **Shape, not seed ids.** A trainer who built their own group session with a circuit can run it
// perfectly well; one who cleared half the demo cannot. Keying on the seeded ids would get both
// backwards.
//
// Since 2026-08-25 the offer it gates starts the STORY (§35), whose gym chapter replays exactly
// these steps — so the same shape still decides, and the check stayed as it is.
//
// Injected dependencies: none.

/** Does this routine prescribe at least one circuit? The walkthrough's second step focuses one. */
function hasCircuit(routine) {
  return (routine?.exercises || []).some((exercise) => Boolean(exercise.circuitId));
}

/**
 * True when some session can carry every step: two participants (the last step switches between
 * them) and a plan holding a circuit (the second step focuses one).
 */
export function walkthroughDataPresent(state) {
  const routines = state?.routines || [];
  return (state?.sessions || []).some((session) => {
    if ((session.participants || []).length < 2) return false;
    return hasCircuit(routines.find((routine) => routine.id === session.routineId));
  });
}
