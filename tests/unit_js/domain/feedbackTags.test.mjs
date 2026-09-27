// tests/unit_js/domain/feedbackTags.test.mjs
// Reading a stored feedback tag back (src/domain/feedbackTags.js): the known tag, the trainer's note
// after it, and the words shown in the trainer's language.

import assert from "node:assert/strict";
import { test } from "node:test";
import { feedbackTagText, readFeedbackTag } from "../../../src/domain/feedbackTags.js";
import { TRANSLATIONS } from "../../../src/i18n/index.js";

const sl = (key) => TRANSLATIONS.sl[key] || key;

test("a bare tag is known and carries no note", () => {
  const { known, note } = readFeedbackTag("Too Easy - Increase Load");
  assert.equal(known.id, "too_easy");
  assert.equal(note, "");
});

test("the note after a tag is found although the tag itself contains the separator", () => {
  const { known, note } = readFeedbackTag("Too Hard - Reduce Load - knee twinge - rep 4");
  assert.equal(known.id, "too_hard");
  assert.equal(note, "knee twinge - rep 4");
});

test("the tag is shown in the trainer's language, without the note", () => {
  assert.equal(
    feedbackTagText("Too Easy - Increase Load - felt light", sl),
    "Prelahko – povečaj težo",
  );
  assert.equal(feedbackTagText("Joint Pain / Discomfort", sl), "Bolečina ali nelagodje v sklepu");
});

test("a tag from an older version is shown as it was stored", () => {
  assert.equal(readFeedbackTag("Form Break - Depth Alert").known, null);
  assert.equal(feedbackTagText("Form Break - Depth Alert", sl), "Form Break - Depth Alert");
  assert.equal(feedbackTagText(undefined, sl), "");
});

test("every tag has its words in every language", () => {
  for (const [lang, table] of Object.entries(TRANSLATIONS)) {
    for (const id of ["too_easy", "too_hard", "form_break", "joint_pain", "progression"]) {
      assert.ok(table[`feedback_tag_${id}`], `${lang} feedback_tag_${id}`);
    }
  }
});
