// src/data/displayPrefs.js — how much of a card the trainer wants to see, kept between visits
// (TODO §42.4). Single responsibility: read and write the "expand all" setting for the day's session
// cards. No DOM, no rendering decisions — a caller asks, and draws.
//
// **There was a second setting, for the clipboard's deck, and §42.14 removed it.** Once every deck
// card became ONE design that says everything it has on its own row (§42.3), "open them all" had
// nothing left to open — the collapsed stack already shows every card whole. The day's session
// cards are a different shape: theirs really does hide participants and programme, so theirs stays.
//
// **A setting, not session state.** It was first written onto the live session, which meant it died
// with that session — a trainer who wants the whole plan open wants it open tonight as well. So it
// lives where the theme lives: plain, unscoped localStorage, shared by both workspaces
// (storageNamespace.js's ORIGIN_GLOBAL_KEYS), because it belongs to the PERSON rather than to any
// data (§40.1).
//
// Defaults to OFF. Compact is what the app has always opened as, and a preference that changes how
// the app looks before anybody asks for it is a surprise, not a default.
//
// Injected dependencies: none.

export const EXPAND_SESSIONS_KEY = "librept_expand_sessions";

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
