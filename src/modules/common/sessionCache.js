// src/helper/sessionCache.js - Active session local storage cache helper
// Single responsibility: Handle JSON serialization and recovery of ongoing session state in localStorage.

import {
  readVersionScoped,
  removeVersionScoped,
  writeVersionScoped,
} from "../../data/storageNamespace.js";

// Version-scoped: a cached live session is written by one build's plan shape (see storageNamespace).
const CACHE_KEY = "librept_active_session";

export function saveActiveSessionToCache(activeSession) {
  if (!activeSession) return;
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
    if (!parsed?.startTime) return null;
    return parsed;
  } catch (e) {
    console.error("Error reading active session cache:", e);
    return null;
  }
}
