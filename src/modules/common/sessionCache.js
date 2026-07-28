// src/helper/sessionCache.js - Active session local storage cache helper
// Single responsibility: Handle JSON serialization and recovery of ongoing session state in localStorage.

import {
  readVersionScoped,
  removeVersionScoped,
  writeVersionScoped,
} from "../../data/storageNamespace.js";
import { assignPositions, positionIssues, repairPositions } from "./sessionItemOrder.js";

// Version-scoped: a cached live session is written by one build's plan shape (see storageNamespace).
const CACHE_KEY = "librept_active_session";

export function saveActiveSessionToCache(activeSession) {
  if (!activeSession) return;
  // The single choke point every plan edit funnels through — insert, delete, drag-reorder, circuit
  // regroup — so stamping order here is what makes "every writer writes position" true by
  // construction (TODO §17.5) instead of a rule each new splice site has to remember.
  for (const clientState of Object.values(activeSession.clientRoutines || {})) {
    assignPositions(clientState?.exercises);
  }
  const cacheObj = {
    ...activeSession,
    timerIntervalId: null,
  };
  writeVersionScoped(CACHE_KEY, JSON.stringify(cacheObj));
}

export function clearActiveSessionCache() {
  removeVersionScoped(CACHE_KEY);
}

export function readActiveSessionCache() {
  const cached = readVersionScoped(CACHE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    // Not `startTime` — a staged-but-not-yet-started session (§ explicit Start) legitimately has
    // none until the trainer taps Start, and that must still survive a reload.
    if (!parsed?.id) return null;
    // A session cached by a build that predates positions arrives with none, and the array order it
    // was serialised in is the last moment that sequence is recoverable — so it is renumbered here,
    // on the way in, rather than left to a reader that may no longer have an index to fall back on
    // (TODO §17.5). Renumbering from the list's own order is a no-op for a healthy session.
    for (const clientState of Object.values(parsed.clientRoutines || {})) {
      const items = clientState?.exercises;
      if (Array.isArray(items) && positionIssues(items).length) repairPositions(items);
    }
    return parsed;
  } catch (e) {
    console.error("Error reading active session cache:", e);
    return null;
  }
}
