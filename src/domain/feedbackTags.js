// src/domain/feedbackTags.js — the feedback tags a trainer can give an exercise, and how a stored
// tag is read back.
//
// **The stored tag is an English key, and it is never shown.** A record keeps the English string
// ("Too Easy - Increase Load") because the quick-signal toggle recognises and un-taps a signal by
// it (quickSignals.js) and existing databases already hold it. The words a trainer reads come from
// the dictionary through `key`. Printing the stored string made a Slovenian trainer who pressed
// »Prelahko« read »Too Easy - Increase Load« in the review list.
//
// A plan-update record may carry the trainer's own note after the tag, joined by " - "
// (feedbackModal.js writes it that way). The known tags contain " - " themselves, so the note is
// found by matching a whole known tag first, never by splitting on the separator.
//
// A tag outside this list — a record written by an older version, such as the demo's former
// "Form Break - Depth Alert" — is shown as it was stored.
//
// Pure: no DOM, no storage. The one import is the dictionary registry, for a document that must be
// written in a language other than the app's current one.

import { dictionaryFor } from "../i18n/index.js";

// The first entry is the dialog's default, and it is the neutral one. A free note saved without
// touching the chips used to be stored as "Too Easy - Increase Load", the old default, so the next
// plan suggested a heavier load nobody had asked for.
export const FEEDBACK_TAGS = [
  { id: "note", tag: "Note", key: "feedback_tag_note" },
  { id: "too_easy", tag: "Too Easy - Increase Load", key: "feedback_tag_too_easy" },
  { id: "too_hard", tag: "Too Hard - Reduce Load", key: "feedback_tag_too_hard" },
  { id: "form_break", tag: "Form Break - Watch Position", key: "feedback_tag_form_break" },
  { id: "joint_pain", tag: "Joint Pain / Discomfort", key: "feedback_tag_joint_pain" },
  { id: "progression", tag: "Completed reps easily", key: "feedback_tag_progression" },
];

// Which signals SAY the work was done. A plain exercise has no tick of its own — its sets are counted
// off by the trainer reacting to them — so this set is what stands between "recorded as performed" and
// "not recorded at all". Too Easy and Completed reps easily both say in their own words that the reps
// happened. Too Hard, pain and a form break say the opposite as often as not: on the gym floor Too Hard
// is commonly tapped BECAUSE the client could not finish the set, and inferring completion from it
// wrote three finished sets at the planned weight for work that never happened. A bare note
// says nothing either way.
const TAGS_IMPLYING_PERFORMED = new Set(["Too Easy - Increase Load", "Completed reps easily"]);

/** Whether this signal is itself a statement that the sets were performed. */
export function tagImpliesPerformed(tag) {
  return TAGS_IMPLYING_PERFORMED.has(String(tag || ""));
}

/** A tag renderer for a document written in ONE language, whatever the app is currently set to.
 *
 * The client's data export is written in the language the client reads, which is not always the
 * trainer's — so its words cannot come from the live `t`. English is the fallback, as everywhere.
 */
export function feedbackTagTextFor(lang) {
  const words = dictionaryFor(lang);
  const english = dictionaryFor("en");
  return (tag) => feedbackTagText(tag, (key) => words[key] ?? english[key] ?? key);
}

const NOTE_SEPARATOR = " - ";

/** The known tag a stored tag starts with (or null), and the trainer's note after it. */
export function readFeedbackTag(stored) {
  const text = typeof stored === "string" ? stored : "";
  const known = FEEDBACK_TAGS.find(
    (entry) => text === entry.tag || text.startsWith(entry.tag + NOTE_SEPARATOR),
  );
  if (!known) return { known: null, note: "" };
  return { known, note: text.slice(known.tag.length + NOTE_SEPARATOR.length) };
}

/** The tag in the trainer's language, without the note. */
export function feedbackTagText(stored, t) {
  const { known } = readFeedbackTag(stored);
  return known ? t(known.key) : stored || "";
}
