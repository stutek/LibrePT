// src/data/lastRoute.js — where the trainer was, in the workspace they left (TODO §40.3).
// Single responsibility: remember one path per workspace, and hand it back. No router, no DOM: it
// is handed a path and returns one, so what counts as a valid route stays the router's question.
//
// **Why this exists.** Moving between workspaces used to land on the dashboard, which is the right
// answer when nothing better is known and the wrong one whenever something is: a trainer who steps
// into the sandbox mid-session to check how something works, and comes back to the deck, has to find
// their session, their client and their exercise again — three taps, on a gym floor, with a client
// waiting. Ruled 2026-09-10 (Simon): coming back returns to the view they left, the live session
// included.
//
// **Per workspace, because it is a fact about that workspace's data.** The key is version-scoped
// (storageNamespace.js), so it carries the workspace suffix like the live session cache beside it —
// and a sandbox reset, which walks that same list, drops it with everything else the old sandbox
// held. A remembered path naming a record that no longer exists is exactly what the caller's
// route check is for.
//
// Injected dependencies: none.

import { readVersionScoped, removeVersionScoped, writeVersionScoped } from "./storageNamespace.js";

export const LAST_ROUTE_KEY = "librept_last_route";

/** Remember `path` for the workspace that is open right now. Called BEFORE a switch, so it lands in
 * the workspace being left. */
export function rememberRoute(path) {
  if (typeof path !== "string" || !path) return;
  try {
    writeVersionScoped(LAST_ROUTE_KEY, path);
  } catch {
    // A browser refusing localStorage still switches workspace; it just arrives at the dashboard.
  }
}

/** What the workspace that is open right now last had on screen, or null. */
export function rememberedRoute() {
  try {
    return readVersionScoped(LAST_ROUTE_KEY) || null;
  } catch {
    return null;
  }
}

export function forgetRoute() {
  try {
    removeVersionScoped(LAST_ROUTE_KEY);
  } catch {
    // Nothing to do: an unreadable store has nothing to forget.
  }
}
