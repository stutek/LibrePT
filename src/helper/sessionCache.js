// src/helper/sessionCache.js - Active session local storage cache helper
// Single responsibility: Handle JSON serialization and recovery of ongoing session state in localStorage.

const CACHE_KEY = "librept_active_session";

export function saveActiveSessionToCache(activeSession) {
  if (!activeSession) return;
  const cacheObj = {
    ...activeSession,
    timerIntervalId: null,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
}

export function clearActiveSessionCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function readActiveSessionCache() {
  const cached = localStorage.getItem(CACHE_KEY);
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
