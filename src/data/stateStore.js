// src/data/stateStore.js - Application State Management & Storage Persistence
// Single responsibility: Manages central app state object, default state initialization,
// demo data seeding, localStorage serialization/deserialization, and database resets.

import {
  DEFAULT_CLIENTS,
  DEFAULT_EXERCISES,
  DEFAULT_HISTORY,
  DEFAULT_MESSAGES,
  DEFAULT_PLAN_UPDATES,
  DEFAULT_ROUTINES,
  DEFAULT_SESSIONS,
} from "./index.js";
import {
  adoptLegacyBucket,
  namespacedKey,
  readVersionScoped,
  writeVersionScoped,
} from "./storageNamespace.js";

let state = emptyState();

export function getState() {
  return state;
}

export function setState(newState) {
  state = newState;
}

export function emptyState() {
  return {
    clients: [],
    exercises: [],
    routines: [],
    history: [],
    planUpdates: [],
    sessions: [],
    notifications: [],
    lang: "en",
  };
}

export function stateHasData(s = state) {
  return [
    "clients",
    "exercises",
    "routines",
    "history",
    "planUpdates",
    "sessions",
    "bookings",
  ].some((k) => Array.isArray(s[k]) && s[k].length > 0);
}

export function seedMockData(incrementLocalSyncFn) {
  const currentLang = state.lang || "en";
  state.clients = [...DEFAULT_CLIENTS];
  state.exercises = [...DEFAULT_EXERCISES];
  state.routines = [...DEFAULT_ROUTINES];
  state.history = [...DEFAULT_HISTORY];
  state.planUpdates = [...DEFAULT_PLAN_UPDATES];
  state.sessions = [...DEFAULT_SESSIONS];
  state.notifications = [...DEFAULT_MESSAGES];
  state.lang = currentLang;
  saveToLocalStorage(incrementLocalSyncFn);
}

// The DB key is per-release (data/storageNamespace.js): an untagged build keeps the plain
// "librept_db", a tagged release reads and writes "librept_db@<tag>" so versions hosted side by
// side on one origin can never overwrite each other's data.
const DB_KEY = "librept_db";
const ACTIVE_SESSION_KEY = "librept_active_session";

export function saveToLocalStorage(incrementLocalSyncFn) {
  writeVersionScoped(DB_KEY, JSON.stringify(state));
  if (typeof incrementLocalSyncFn === "function") {
    incrementLocalSyncFn();
  }
}

export function loadSavedState() {
  // First boot of a tagged release on a device that has only run untagged builds: seed this
  // release's bucket from the plain keys, leaving them intact as the rollback snapshot.
  adoptLegacyBucket();

  let savedData = readVersionScoped(DB_KEY);
  if (!savedData) {
    // Pre-rename shim (openpt_* → librept_*), untouched by versioning: it predates both buckets.
    savedData = localStorage.getItem("openpt_db");
    if (savedData) {
      localStorage.setItem(namespacedKey(DB_KEY), savedData);
      localStorage.removeItem("openpt_db");

      const activeSessionData = localStorage.getItem("openpt_active_session");
      if (activeSessionData) {
        localStorage.setItem(namespacedKey(ACTIVE_SESSION_KEY), activeSessionData);
        localStorage.removeItem("openpt_active_session");
      }
    }
  }

  if (savedData) {
    try {
      state = JSON.parse(savedData);
      if (state.bookings && !state.sessions) {
        state.sessions = state.bookings;
        state.bookings = undefined;
      }
    } catch (e) {
      console.error("Error parsing local storage database. Starting empty.", e);
      state = emptyState();
    }
  } else {
    state = emptyState();
  }

  if (!state.sessions) state.sessions = [];
  if (!state.lang) state.lang = "en";
  return state;
}

export function resetLibrePTData(options = {}) {
  const { demo = true } = options || {};
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("librept") || k.startsWith("openpt")) localStorage.removeItem(k);
  }
  const url = new URL(window.location.href);
  if (demo) {
    url.searchParams.set("init", "demo_data_load");
  } else {
    url.searchParams.delete("init");
  }
  window.location.href = url.toString();
}
