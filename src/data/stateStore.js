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

export function saveToLocalStorage(incrementLocalSyncFn) {
  localStorage.setItem("librept_db", JSON.stringify(state));
  if (typeof incrementLocalSyncFn === "function") {
    incrementLocalSyncFn();
  }
}

export function loadSavedState() {
  let savedData = localStorage.getItem("librept_db");
  if (!savedData) {
    savedData = localStorage.getItem("openpt_db");
    if (savedData) {
      localStorage.setItem("librept_db", savedData);
      localStorage.removeItem("openpt_db");

      const activeSessionData = localStorage.getItem("openpt_active_session");
      if (activeSessionData) {
        localStorage.setItem("librept_active_session", activeSessionData);
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

export function resetLibrePTData({ demo = true } = {}) {
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
