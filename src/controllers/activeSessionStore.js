// src/controllers/activeSessionStore.js — the one live session and the app-level dependencies the
// session code is wired with. Single responsibility: HOLD that mutable pair and hand it out through
// accessors, so the modules split out of activeSessionController.js can share it without importing
// each other. Injected dependencies: none — this is the bottom of the session controller stack;
// everything above it imports from here and nothing here imports back.
//
// Accessors rather than exported bindings (§5.3): `activeSession` is REASSIGNED — a session starts,
// is recovered from cache, is cancelled to null — and a module that imported the binding directly
// would be reading whatever value it held at import time.

let activeSession = null;
let appDeps = {};

export function getActiveSession() {
  return activeSession;
}

export function setActiveSession(session) {
  activeSession = session;
}

// The composition root and the two entry points that carry their own deps (startWorkoutSession,
// setupActiveSession) all merge rather than replace: each knows about a different slice of the app,
// and a replace would drop whatever an earlier caller had already wired.
export function mergeAppDeps(deps) {
  if (deps) appDeps = { ...appDeps, ...deps };
}

export function getAppDeps() {
  return appDeps;
}

// Temporal mode of the plan currently loaded, used to label edit mode so the trainer always knows
// whether they're reshaping the LIVE session, an UPCOMING one, or a date-less PLANNING program.
export function currentPlanMode() {
  const ss = activeSession?.sourceSession;
  if (ss?.isPlanning) return "planning";
  if (ss?.day === "tomorrow" || ss?.day === "upcoming") return "future";
  return "live";
}

export function getActiveExercise() {
  if (!activeSession) return null;
  const activeClientId = activeSession.activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];
  if (!activeClientState || activeClientState.exercises.length === 0) return null;
  return activeClientState.exercises[activeClientState.activeExerciseIndex];
}
