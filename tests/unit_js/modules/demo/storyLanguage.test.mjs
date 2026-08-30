// tests/unit_js/modules/demo/storyLanguage.test.mjs
// The demo must be finishable in every language it ships in (TODO §38.19).
//
// Reported 2026-08-30, from a Slovenian run: "Tega koraka ni bilo mogoče zaključiti" at step 16 of
// 49 — the one where Ana sends her file. The step's expectation was `containsText: "Shared"`, and the
// Slovenian page says "Deljeno.", so the claim could never come true and the story stopped there for
// every Slovenian viewer while passing every test we had.
//
// The rule these pin: **a demo may not read the app's own translated words back to it.** What a step
// asserts has to be a fact about the app — a class, a data attribute, a value somebody typed — never
// a sentence that changes with the language. Four expectations broke it; nothing but a check keeps
// the fifth from being written.

import assert from "node:assert/strict";
import { test } from "node:test";

import { storyStepsFor } from "../../../../src/domain/demoStory.js";
import { TRANSLATIONS } from "../../../../src/i18n/index.js";
import { GYM_FLOOR_TOUR } from "../../../../src/modules/demo/gymFloorTour.js";
import { DEMO_STORY } from "../../../../src/modules/demo/storyTour.js";

const LOCALES = Object.keys(TRANSLATIONS).filter((code) => code !== "en");

/** Every text a step matches on, with where it came from. */
function textsMatchedOn(steps) {
  const matched = [];
  for (const step of steps) {
    for (const [field, value] of [
      ["expect.containsText", step.expect?.containsText],
      ["expect.hasValue", step.expect?.hasValue],
      ["targetText", step.targetText],
    ]) {
      if (value) matched.push({ id: step.id, field, value: String(value) });
    }
  }
  return matched;
}

/** Whether the app says this in English somewhere and NEVER says it in `locale` — which is exactly
 * when an expectation matching it cannot come true for a viewer reading that language.
 *
 * Deliberately about the whole dictionary rather than one key. Matching a key's English against the
 * same key's other language flags a client's own NAME: "Ana" sits inside "Ana's phone", and
 * Slovenian declines it to "Anin telefon" — a false alarm about a word the demo typed itself. What
 * makes the four real ones real is that the word is absent from the other language altogether, so
 * nothing the app can render will ever satisfy the step.
 */
function neverSaidIn(locale, text) {
  const wanted = text.toLowerCase();
  const inEnglish = Object.values(TRANSLATIONS.en).some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(wanted),
  );
  if (!inEnglish) return false;
  return !Object.values(TRANSLATIONS[locale]).some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(wanted),
  );
}

test("no demo step asks the app to say something in English", () => {
  // EVERY step of both scripts, read from the chapters rather than from a run: `storyStepsFor`
  // filters by surface, and the step this check exists for — Ana sending her file — is on the
  // client's phone, so a run of the trainer's steps walks straight past it. Caught by putting the
  // reported bug back and watching the check stay green.
  const steps = [
    ...DEMO_STORY.chapters.flatMap((chapter) => chapter.steps),
    ...GYM_FLOOR_TOUR.steps,
  ];
  const guilty = [];

  for (const locale of LOCALES) {
    for (const { id, field, value } of textsMatchedOn(steps)) {
      // Only when the app itself says it: a client's name, an address, a time and a movement from
      // the catalogue read the same in every language, and matching those is what a demo is for.
      if (neverSaidIn(locale, value)) {
        guilty.push(
          `${id}.${field} = ${JSON.stringify(value)} — the app never says that in ${locale}`,
        );
      }
    }
  }

  assert.deepEqual(
    guilty,
    [],
    `a demo step matches on words the app translates, so it cannot be finished in that language:\n  ${guilty.join("\n  ")}`,
  );
});

test("what the demo types is content, and content is translated", () => {
  // A step that enters free text says WHICH words with `enterKey`, so Ana writes up her shoulder in
  // the language she is reading (reported 2026-08-30: "ana poškodbo piše v angleščini?"). Names,
  // addresses and times stay literal — they are the same in every language.
  const typed = DEMO_STORY.chapters
    .flatMap((chapter) => chapter.steps)
    .filter((step) => step.enterKey);

  assert.ok(typed.length > 0, "no step types anything through the dictionary at all?");
  for (const step of typed) {
    for (const locale of ["en", ...LOCALES]) {
      assert.ok(
        TRANSLATIONS[locale][step.enterKey],
        `${step.id} types ${step.enterKey}, which ${locale} does not have`,
      );
    }
  }
});

test("a step that reads back what it typed uses the same words", () => {
  // Otherwise the two drift into different languages and the step can never pass — which is the same
  // failure as the one above, one field along.
  for (const step of DEMO_STORY.chapters.flatMap((chapter) => chapter.steps)) {
    if (!step.expect?.hasValueKey) continue;
    assert.ok(
      TRANSLATIONS.en[step.expect.hasValueKey],
      `${step.id} expects ${step.expect.hasValueKey}, which is not a translation key`,
    );
  }
});

test("the story is playable in every shipped language", () => {
  // The end-to-end version of the rule: flatten the story with each locale's dictionary and check
  // that nothing it types or asserts came out empty.
  for (const locale of ["en", ...LOCALES]) {
    const words = (key) => TRANSLATIONS[locale][key] ?? "";
    for (const step of storyStepsFor(DEMO_STORY, null, { t: words })) {
      if (step.enterKey) {
        assert.ok(step.enter, `${step.id} types nothing at all in ${locale}`);
      }
      if (step.expect?.hasValueKey) {
        assert.ok(step.expect.hasValue, `${step.id} expects an empty value in ${locale}`);
      }
    }
  }
});
