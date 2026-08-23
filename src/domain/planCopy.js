// src/domain/planCopy.js — giving another participant tonight's plan (TODO §8.8).
//
// Single responsibility: what a copied plan contains. No DOM, no session — the clipboard's ⋯ menu
// offers it and the controller writes it.
//
// **The prescription travels; the performance does not.** Movements, targets, rests and circuits are
// what the trainer authored, and what a walk-in joining mid-session needs. Logged sets and
// completion flags belong to the person who did them: a copy carrying them would write a stranger's
// numbers into this person's history, and the history is the thing this app promises to keep
// honest.
//
// **A copy is NOT a binding** (§8.1), and keeping the two distinguishable is why both exist. Bound
// participants share one plan object and stay identical for as long as they are bound; a copy is
// separate from the moment it is made, which is what a trainer wants when someone is doing the same
// session but at their own loads. Every item therefore gets a fresh id — including the circuits,
// whose ids are remapped together so the copy's circuit is its own rather than a second plan
// claiming the first one's.
//
// Injected dependencies: `newId` — the caller owns where ids come from.

/** The plan another participant gets, as new items with nothing logged in them. */
export function copyPlanForParticipant(items, { newId } = {}) {
  const circuits = new Map();
  return (items || []).map((item) => {
    // `completed` is dropped by not carrying it over, rather than deleted afterwards: a fresh plan
    // is one nobody has done yet, and building the copy without the flag says that once instead of
    // asserting it twice.
    const { completed: _doneByOtherPerson, ...prescription } = item;
    const copy = { ...prescription, id: newId() };
    if (item.circuitId) {
      if (!circuits.has(item.circuitId)) circuits.set(item.circuitId, newId());
      copy.circuitId = circuits.get(item.circuitId);
    }
    // `sets` is emptied rather than dropped, because the deck reads it as a list and a missing one
    // would be a second shape for "no sets logged".
    if (Array.isArray(item.sets)) copy.sets = [];
    return copy;
  });
}
