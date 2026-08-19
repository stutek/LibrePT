// src/domain/catalogMatch.js — which imported movements does the catalog already know? (TODO §29.1)
//
// Single responsibility: attach a catalog id to the movements that have one, and mark the rest as
// custom. Pure — no DOM, no storage.
//
// **The ruling this implements, and both halves matter.** A movement the catalog does not have is
// ALLOWED: refusing it would throw away the trainer's programme over a naming difference. But it is
// MARKED, because silently adopting whatever the catalog has nearest is how a catalog becomes forty
// spellings of "Bench Press" under forty ids — the exact failure §13's taxonomy work exists to
// prevent. The tag is what keeps a custom movement visibly distinct rather than quietly canonical.
//
// **Matching is exact after normalisation, deliberately.** Case and spacing differences are the same
// movement; anything else is not. "Incline Barbell Bench Press" is not "Barbell Bench Press", and a
// similarity score that decided otherwise would be wrong in a way nobody could predict or argue with
//. The trainer picks the catalog entry themselves in the editor if the parser
// guessed too conservatively — which is the cheap direction to be wrong in.
//
// Injected dependencies: none.

/** Case- and spacing-insensitive, so "back squat" and "Back  Squat" are one movement. Nothing else
 * is folded: punctuation carries meaning in movement names ("Y-T-W", "Chin-Up"). */
function normalise(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * The same items, each exercise carrying `exerciseId` when the catalog knows it and `custom: true`
 * when it does not. Rests and unreadable rows pass through untouched — neither is a movement.
 */
export function matchAgainstCatalog(items, catalogExercises) {
  const byName = new Map(
    (catalogExercises || []).map((exercise) => [normalise(exercise.name), exercise.id]),
  );

  return (items || []).map((item) => {
    if (item.type !== "exercise" || item.unreadable) return item;
    const known = byName.get(normalise(item.name));
    return known ? { ...item, exerciseId: known, custom: false } : { ...item, custom: true };
  });
}

/** How many of these movements the catalog does not know — what a summary line reports before the
 * trainer opens the editor. */
export function customCount(items) {
  return (items || []).filter((item) => item.custom).length;
}
