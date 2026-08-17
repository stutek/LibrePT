// src/modules/intake/signupDelivery.js — how a filled-in introduction leaves the client's phone
// (TODO §1.7, transport ruled 2026-08-17: "use shares").
//
// Single responsibility: hand the file to whatever app the client already uses. What the file
// contains and how it is written are data/clientSignup.js and data/signupFile.js; this module knows
// only about handing it over.
//
// **Share sheet first, because it is the only one-tap route.** `navigator.share({ files })` opens the
// client's own mail, WhatsApp, Signal or AirDrop with the attachment already on the message — no
// address typed at authoring time, no `mailto:` (which cannot attach anything at all), and nothing
// sensitive placed in a URL.
//
// **The download fallback is permanent, not temporary**, and that is why it is a first-class button
// rather than an error path. `navigator.canShare({ files })` is false on every desktop browser and on
// iOS below 15, and a prospective client standing in a gym cannot be told to come back with a
// different phone. Saving the file and attaching it by hand is two more taps and always works.
//
// **Both paths are declared explicitly rather than routed through one "deliver" abstraction**
// (AGENT_RULES §5.9): they share the file and nothing else — one asks the OS to hand over a File
// object, the other writes bytes to disk through an anchor. A dispatcher between the button and the
// hand-over would be a layer whose only job is to choose.
//
// Injected dependencies: `platform` = { canShareFiles, shareFiles, saveFile } — see
// `browserSignupPlatform()`, so a test never touches `navigator`.

import { SIGNUP_MEDIA_TYPE, serializeSignupFile, signupFileName } from "../../data/signupFile.js";

/** The real platform. Kept apart from the two deliveries so tests never reach for a browser. */
export function browserSignupPlatform() {
  return {
    canShareFiles: (files) =>
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files }),
    shareFiles: (data) => navigator.share(data),
    saveFile: (file) => {
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      // Revoked on the next tick rather than immediately: Safari reads the blob asynchronously after
      // the click, and freeing it in the same frame produced an empty file there.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  };
}

/** The `File` the client is about to send, or null if the submission cannot be represented — a
 *  half-written introduction is worse than an obvious refusal to send one. */
export function buildSignupFile(signup, isoDate, FileImpl = File) {
  const text = serializeSignupFile(signup);
  if (!text) return null;
  return new FileImpl([text], signupFileName(signup, isoDate), { type: SIGNUP_MEDIA_TYPE });
}

/** Whether the one-tap route exists on this device. The form asks before offering it, so a button
 *  that cannot work is never shown — an unavailable share sheet is not an error to report, it is a
 *  device that needs the other button. */
export function canShareSignupFile(file, platform) {
  return Boolean(file) && platform.canShareFiles([file]);
}

/**
 * Hand the file to the share sheet. Returns `{ delivered }`.
 *
 * A share the client cancels resolves as `AbortError`, which is a decision and not a failure —
 * reporting it as one would tell someone who changed their mind that the app is broken. Anything else
 * is a genuine refusal the caller must show, since the client would otherwise believe their details
 * were sent.
 */
export async function shareSignupFile(file, { title, text, platform }) {
  try {
    await platform.shareFiles({ files: [file], title, text });
    return { delivered: true, cancelled: false };
  } catch (error) {
    if (error?.name === "AbortError") return { delivered: false, cancelled: true };
    return { delivered: false, cancelled: false, reason: error?.message || "share failed" };
  }
}

/** Save the file so the client can attach it themselves. Always available, which is what makes the
 *  form's advice ("send it to your trainer however you like") honest on every device. */
export function saveSignupFile(file, platform) {
  platform.saveFile(file);
  return { delivered: true, cancelled: false };
}
