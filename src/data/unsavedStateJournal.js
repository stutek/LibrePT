// src/data/unsavedStateJournal.js — a copy of the state, kept when the page closes before its save.
// Single responsibility: keep one copy, hand it back once, forget it.
//
// **Why this exists.** Saving is write-behind (writeQueue.js): the screen changes at once and the
// IndexedDB write follows, and that write takes long enough to lose. A note submitted and the page
// closed in the same moment was gone at the next start — on a phone, the app swiped away right
// after a tap. IndexedDB has no write that finishes before the page goes; localStorage does. So
// when the page is hidden or closed with a write still running, stateStore.js writes the state here,
// and the next start takes this copy in place of what IndexedDB holds.
//
// **Only while a write is unfinished, and gone as soon as the database has caught up.** Written at
// any other time it would be an old picture waiting to overwrite newer records at the next start;
// stateStore.js forgets it after the write that follows lands. localStorage holds a few megabytes,
// so a very large database may not fit: that case is reported in the console and is no worse than
// before this copy existed.
//
// Per workspace (storageNamespace.js), like the live session beside it: the sandbox's copy is never
// the trainer's, and a sandbox reset or a data wipe clears it with every other scoped key.
//
// Injected dependencies: none.

import { readVersionScoped, removeVersionScoped, writeVersionScoped } from "./storageNamespace.js";

export const UNSAVED_STATE_KEY = "librept_unsaved_state";

/** Keep `state` for the next start. True when the copy was written. */
export function keepUnsavedState(state) {
  try {
    writeVersionScoped(UNSAVED_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn("Could not keep the unsaved state for the next start:", e);
    return false;
  }
}

/** The kept copy, or null when there is none or it cannot be read. */
export function unsavedState() {
  try {
    const raw = readVersionScoped(UNSAVED_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Could not read the unsaved state:", e);
    return null;
  }
}

export function forgetUnsavedState() {
  try {
    removeVersionScoped(UNSAVED_STATE_KEY);
  } catch {
    // An unreachable store holds no copy to forget.
  }
}
