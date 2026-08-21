// src/domain/demoStory.js — what a chaptered demo story IS, and which steps a link asks for (TODO §35).
//
// Single responsibility: the chapter vocabulary and its validation. No DOM, no timing, no narration
// surface — modules/demo/storyTour.js is the content, modules/demo/storyNarration.js draws the cards,
// and modules/demo/demoTourPlayer.js plays the steps, unchanged.
//
// **Why chapters, when the wedge tour needed none.** The gym-floor tour (§23.5) is four taps and
// three seconds; this one is ~23 events and 4-6 minutes, and nobody watches five unbroken minutes of
// software they do not yet use. So a chapter is the unit that gets shared, linked and watched:
// `?demo=story` plays the lot, `?demo=story&chapter=floor` plays one, and each ends somewhere
// useful. A chapter is DATA — the engine that runs it is the same one the wedge uses.
//
// Injected dependencies: none — pure functions over plain objects.

import { validateTour } from "./demoTour.js";

/** Every chapter id, in playing order — what a link may name. */
export function storyChapterIds(story) {
  return (story?.chapters || []).map((chapter) => chapter.id);
}

/** Each chapter's title translation key, in the same order. A chapter nobody can name on screen
 * cannot be offered as a starting point, which is the whole reason it is a chapter. */
export function chapterTitleKeys(story) {
  return (story?.chapters || []).map((chapter) => chapter.titleKey);
}

/** The steps a link asks for: one named chapter, or the whole story flattened in order.
 *
 * An UNKNOWN chapter plays the whole story rather than nothing. These links are pasted into chat
 * apps and typed by hand, and a mistyped or since-renamed chapter should still show a stranger the
 * demo — a player handed an empty step list looks exactly like an app that failed to boot. */
export function storyStepsFor(story, chapterId = null) {
  const chapters = story?.chapters || [];
  const wanted = chapters.find((chapter) => chapter.id === chapterId);
  const playing = wanted ? [wanted] : chapters;
  return playing.flatMap((chapter) =>
    // The chapter each step belongs to travels WITH the step: once flattened, the player sees one
    // list, and the narration surface still has to say which chapter is on screen.
    (chapter.steps || []).map((step) => ({ ...step, chapterId: chapter.id })),
  );
}

/** Structural problems in a story, found before it plays rather than four minutes in.
 *
 * Delegates the per-step rules to `validateTour` — a chapter IS a tour — and adds the two rules that
 * only exist once there is more than one: every chapter is named, and no step id is reused across
 * chapters. Duplicate ids matter because results are reported by id, so two steps called `card`
 * make a failing run point at either of them. */
export function validateStory(story) {
  const chapters = story?.chapters;
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return ["a story needs at least one chapter"];
  }

  const problems = [];
  const seenChapters = new Set();
  const seenSteps = new Set();

  for (const chapter of chapters) {
    const at = `chapter ${chapter.id || "(unnamed)"}`;
    if (!chapter.id) problems.push("a chapter has no id, so no link can name it");
    else if (seenChapters.has(chapter.id)) problems.push(`${at} appears twice`);
    seenChapters.add(chapter.id);

    if (!chapter.titleKey) problems.push(`${at} has no title key`);

    for (const problem of validateTour(chapter)) problems.push(`${at}: ${problem}`);

    for (const step of chapter.steps || []) {
      if (step.id && seenSteps.has(step.id)) {
        problems.push(`${at}: step id ${step.id} is already used in another chapter`);
      }
      seenSteps.add(step.id);
    }
  }
  return problems;
}
