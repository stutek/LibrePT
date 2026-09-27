// src/data/tabOwnership.js — one tab of the app saves at a time.
//
// Each tab reads the data into memory at boot, and every save writes the whole of it. Two tabs
// therefore overwrote each other: a client added in a newer tab vanished, without a word, the next
// time the older tab saved its own picture of the world.
//
// **One working tab, not a merge.** Keeping two tabs' memory in step would still leave a dialog open
// in one of them writing into a record object the other had just replaced. So the newest tab to
// boot takes the turn: it says so on a BroadcastChannel, and every other tab stops saving and asks
// the page to cover itself (modules/common/otherTabNotice.js). Taking the turn back reloads that
// tab, which reads what the other one saved before it claims.
//
// A browser without BroadcastChannel keeps working as one tab always did.
//
// deps: none.

const CHANNEL_NAME = "librept-tab-ownership";

const tabId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let active = true;
const deactivatedListeners = [];
const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(CHANNEL_NAME) : null;
// Node (the unit tests import the store) keeps a process alive while a channel is open; a browser
// has no unref and needs none.
channel?.unref?.();

channel?.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type !== "claim" || message.tabId === tabId || !active) return;
  active = false;
  for (const listener of deactivatedListeners) listener();
});

/** Take the turn: every other open tab of the app stops saving. Called once at boot. */
export function claimThisTab() {
  active = true;
  channel?.postMessage({ type: "claim", tabId });
}

/** Whether this tab may save. False once another tab has claimed the turn. */
export function isThisTabActive() {
  return active;
}

/** Called once when another tab takes the turn. */
export function onTabDeactivated(listener) {
  if (typeof listener === "function") deactivatedListeners.push(listener);
}
