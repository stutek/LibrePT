// src/domain/clientNameWords.js — the words that name a client, and finding them in trainer-typed
// text (TODO §66). Pure: takes clients and a string, returns words. No DOM, no storage.
//
// **Why it exists.** A session's name and location are free text, and the fastest thing to type is
// the person: "Ana 1:1", "at Jane's flat". That puts a client's name in a field the app cannot
// erase later — scrubbing prose needs the name, and after an erasure the name is gone (§65). So the
// name is kept out at the moment it is typed, not chased afterwards.
//
// Ruled 2026-09-18 (Simon): match WHOLE WORDS only, from every client's name, surname and alias,
// and refuse to save. The message names the word and says why, because a refusal a trainer cannot
// explain is a refusal they will work around.
//
// **Three characters is the floor.** Every word of every name is checked, but two-letter names ("Ed",
// "An") would block ordinary words in ordinary titles and leave a trainer unable to save a session
// on the gym floor. A gym with a two-letter name on its books keeps that one risk; everyone else
// keeps working.
//
// **Diacritics and case are normalised**, so "Novák" matches "novak": a trainer typing without
// accents on a phone keyboard is the ordinary case, not a way around the rule.
//
// Injected dependencies: none.

/** Lowercase, without diacritics — the form both sides are compared in. */
function fold(word) {
  return word
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

/** Every run of letters or digits, in the order they appear. */
function wordsOf(text) {
  return String(text || "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export const SHORTEST_BLOCKED_WORD = 3;

/**
 * The folded words that name any of these clients — names, surnames and aliases.
 *
 * An erased client contributes nothing: their name is already a pseudonym, and blocking that would
 * only stop a trainer typing a string they cannot read anyway.
 */
export function clientNameWords(clients) {
  const words = new Set();
  for (const client of clients || []) {
    if (client?.erasure?.erasedAt) continue;
    for (const source of [client?.name, client?.alias]) {
      for (const word of wordsOf(source)) {
        if (word.length >= SHORTEST_BLOCKED_WORD) words.add(fold(word));
      }
    }
  }
  return words;
}

/**
 * The words of `text` that name a client, as the trainer typed them — so a message can quote the
 * word back rather than a folded version of it. Empty when the text names nobody.
 */
export function clientNamesIn(text, words) {
  if (!words || words.size === 0) return [];
  const found = [];
  for (const word of wordsOf(text)) {
    if (word.length < SHORTEST_BLOCKED_WORD) continue;
    if (words.has(fold(word)) && !found.includes(word)) found.push(word);
  }
  return found;
}
