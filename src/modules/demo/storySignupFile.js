// src/modules/demo/storySignupFile.js — the file Ana sends, as the trainer receives it (TODO §35).
//
// Single responsibility: hold the ONE submission the story's client chapter produces, in the exact
// shape the intake page writes, so the trainer's chapter can open it.
//
// **Why this exists at all.** The story showed Ana filling her form and sending it, then quietly
// skipped the step that matters most to the trainer: reading what arrived and deciding. That step
// was called unscriptable because opening a file needs the operating system's picker, which no page
// can drive — and the alternative considered was a "hand me a submission" hook inside the shipped
// app, which [signupReviewDialog.js](../clients/signupReviewDialog.js) refuses on purpose.
//
// The seam moved instead of the refusal: `demoTourPlayer.js` gained an `attach` action that puts a
// real `File` on the real file input and fires the same `change` event the picker fires. The app is
// untouched, the review dialog does its own reading and its own refusing, and what the demo supplies
// is exactly what the picker would have — a file.
//
// **It must stay identical to what the client chapter typed.** A trainer watching the story read a
// name that did not match the one Ana entered two steps ago would be watching a lie, so the values
// here are the ones storyTour.js enters, and a test holds the two together.
//
// Injected dependencies: none — a plain data module.

import { SIGNUP_FORMAT_VERSION } from "../../data/clientSignup.js";
import { CONSENT_FORM_VERSION } from "../common/consentForm.js";

export const STORY_SIGNUP_NAME = "Ana Novak";
// What the file is CALLED when it lands in the trainer's messages. Written beside the file it
// names, so the screenshot the story draws of that message cannot drift from the artifact
// signupDelivery.js produces (§38.22).
export const STORY_SIGNUP_FILENAME = "ana-novak.librept-signup.json";
export const STORY_SIGNUP_EMAIL = "ana.novak@example.com";
export const STORY_SIGNUP_INJURY = "shoulder, two years ago";

/** Ana's submission, serialised the way the intake page serialises one.
 *
 * The consent date is TODAY because the story is happening now: a submission stamped with the day
 * the demo was written would show a trainer a consent older than the conversation they are watching.
 */
export function storySignupFileText(todayIso) {
  return `${JSON.stringify(
    {
      v: SIGNUP_FORMAT_VERSION,
      name: STORY_SIGNUP_NAME,
      email: STORY_SIGNUP_EMAIL,
      injury: STORY_SIGNUP_INJURY,
      gdprConsent: {
        cloudSync: true,
        consentDate: todayIso,
        formVersion: CONSENT_FORM_VERSION,
        formLang: "en",
      },
    },
    null,
    2,
  )}\n`;
}
