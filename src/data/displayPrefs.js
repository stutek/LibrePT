// src/data/displayPrefs.js — how much of a card the trainer wants to see, kept between visits
// (TODO §42.4). Single responsibility: read and write the two "expand all" settings. No DOM, no
// rendering decisions — a caller asks, and draws.
//
// **Two settings, not one** (ruled 2026-09-10): the day's session cards and the clipboard's exercise
// cards are read in different postures. A trainer scanning tomorrow at a desk wants every session
// card open; the same trainer mid-set wants the clipboard down to the one card they are on. One
// switch for both would make each of those answers wrong half the time.
//
// **A setting, not session state.** It was first written onto the live session, which meant it died
// with that session — a trainer who wants the whole plan open wants it open tonight as well. So it
// lives where the theme lives: plain, unscoped localStorage, shared by both workspaces
// (storageNamespace.js's ORIGIN_GLOBAL_KEYS), because it belongs to the PERSON rather than to any
// data (§40.1).
//
// Both default to OFF. The compact deck is what the app has always opened as, and a preference that
// changes how the app looks before anybody asks for it is a surprise, not a default.
//
// Injected dependencies: none.

export const EXPAND_SESSIONS_KEY = "librept_expand_sessions";
export const EXPAND_CLIPBOARD_KEY = "librept_expand_clipboard";

const ON = "1";

function read(key) {
  try {
    return localStorage.getItem(key) === ON;
  } catch {
    // A browser refusing localStorage still runs the app; it just opens compact every time.
    return false;
  }
}

function write(key, on) {
  try {
    if (on) localStorage.setItem(key, ON);
    else localStorage.removeItem(key);
  } catch {
    // Nothing to do: the setting is a convenience, and failing to store it changes nothing else.
  }
}

/** Whether the day's session cards open showing participants and programme. */
export function sessionCardsExpanded() {
  return read(EXPAND_SESSIONS_KEY);
}

export function setSessionCardsExpanded(on) {
  write(EXPAND_SESSIONS_KEY, on);
}

/** Whether the clipboard's deck opens with every exercise card showing its detail. */
export function clipboardCardsExpanded() {
  return read(EXPAND_CLIPBOARD_KEY);
}

export function setClipboardCardsExpanded(on) {
  write(EXPAND_CLIPBOARD_KEY, on);
}
