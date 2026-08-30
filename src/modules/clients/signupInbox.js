// src/modules/clients/signupInbox.js — the ways a client's submission reaches the trainer without a
// file picker (TODO §38.22).
//
// Single responsibility: notice that a file arrived, get its text, and hand it to the review dialog.
// Reading the file is data/signupFile.js, deciding what to do with it is signupReviewDialog.js, and
// the human being reading it before anything enters the register is unchanged — this only removes
// the fetching.
//
// **What it replaces.** Until 2026-08-30 there was one way in: save the attachment out of the
// messaging app, open LibrePT, open the ☰ menu, choose "Review a client's file", and find the file in
// the picker. Five acts, two of them in somebody else's app, for a file that was already on the
// phone. Asked about directly: "a PWA import rabi shranjevanje datoteke iz message-a in nato
// odpiranje?"
//
// **Two arrivals, one dialog.**
//
// - **Shared into the app** — the trainer taps Share on the attachment and picks LibrePT. The OS
//   POSTs it to the app; the service worker answers that POST (sw/sharedInbox.js), keeps the text and
//   redirects here with `?open=signup`.
// - **Opened as a file** — the trainer taps the `.json` itself and the OS launches LibrePT with it.
//   That arrives through `launchQueue`, which hands over a file handle rather than a POST.
//
// Both are Chromium's, and both need the app INSTALLED: on iOS neither exists. So the menu and its
// file picker stay exactly where they are — not as the main road any more, but as the one that works
// everywhere (§38.22 records that trade).
//
// **What the app claims is its own file, not JSON.** The manifest names the pair data/signupFile.js
// declares — `application/vnd.librept.signup+json` and `.json.librept-signup` — because a share
// target that accepted `application/json` would offer LibrePT for every JSON file on the phone.
// Whether an OS matches the whole compound suffix or only the trailing `.json` is untested here and
// decides the TAP path alone; a share carries the media type either way (§38.22).
//
// **Nothing is imported without a person.** A share target accepts a file from any app on the phone,
// which changes nothing about the trust boundary: the submission lands in the review dialog, where a
// human reads every field before a record is written (§26.5). What this saves is the fetching, not
// the reading.
//
// Injected dependencies: `openReview` and `reviewText` (the dialog's own two seams), plus `doc` and
// `view` so tests can hand it a page.

// Written by the service worker, read here. The two names have to agree, and this is the reading
// half — sw/sharedInbox.js is the writing half and says so.
const INBOX_CACHE = "librept-shared-inbox";
const INBOX_KEY = "shared-submission";
const ARRIVED_PARAM = "open";
const ARRIVED_VALUE = "signup";

/** Whether this page load is the one a share or a file tap landed on. */
export function arrivedWithASubmission(view = window) {
  return new URL(view.location.href).searchParams.get(ARRIVED_PARAM) === ARRIVED_VALUE;
}

/** The text the service worker put aside, taken out of the inbox as it is read.
 *
 * Read ONCE: the marker stays in the address across a reload, and a submission that re-opened every
 * time the trainer refreshed would be a dialog they have to dismiss again and again.
 */
export async function takeSharedSubmission(view = window) {
  if (!view.caches) return null;
  try {
    const cache = await view.caches.open(INBOX_CACHE);
    const held = await cache.match(INBOX_KEY);
    if (!held) return null;
    const text = await held.text();
    await cache.delete(INBOX_KEY);
    return text || null;
  } catch {
    // A browser that refuses cache storage (a private window, blocked site data) simply has no
    // inbox. The menu's file picker is still there, which is the whole reason it stays.
    return null;
  }
}

/** Clears the marker out of the address without adding a history entry.
 *
 * The submission has been taken; leaving `?open=signup` where a trainer can share the URL, or where
 * their own Back button can return to it, advertises a state that no longer exists.
 */
function forgetTheMarker(view) {
  const url = new URL(view.location.href);
  if (!url.searchParams.has(ARRIVED_PARAM)) return;
  url.searchParams.delete(ARRIVED_PARAM);
  view.history?.replaceState?.({}, "", url.toString());
}

/**
 * Wires both arrivals up. Called once at boot; does nothing on a page that was opened normally.
 *
 * Returns whether a submission was opened, which is what the tests assert on and what a caller can
 * use to skip whatever it would otherwise have shown first.
 */
export async function receiveSharedSubmissions({ openReview, reviewText, view = window } = {}) {
  // A file the OS handed over by TAP. Registered unconditionally rather than only when the address
  // says so: `launchQueue` is how the browser delivers it, and it may arrive after this boot has
  // finished.
  if (view.launchQueue?.setConsumer) {
    view.launchQueue.setConsumer(async (params) => {
      const [handle] = params?.files ?? [];
      if (!handle) return;
      const file = await handle.getFile();
      openReview();
      reviewText(await file.text());
    });
  }

  if (!arrivedWithASubmission(view)) return false;
  const text = await takeSharedSubmission(view);
  forgetTheMarker(view);
  if (!text) return false;
  openReview();
  reviewText(text);
  return true;
}
