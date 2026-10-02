// src/domain/planCopy.js — giving another participant tonight's plan.
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
// **A copy is NOT a group**, and keeping the two distinguishable is why both exist. Grouped
// participants each hold their own copy too, but under the SAME item ids and marked as one group
// (domain/participantBinding.js), so the app knows they started from one plan. A copy made here is
// another client's plan from the moment it is made, with no group behind it, which is what a trainer
// wants when someone is doing the same session at their own loads. Every item therefore gets a
// fresh id — including the circuits, whose ids are remapped together so the copy's circuit is its
// own rather than a second plan claiming the first one's.
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
