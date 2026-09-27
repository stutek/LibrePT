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
// Pure: no DOM, no storage.

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
