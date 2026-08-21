// src/controllers/activeSessionCache.js — writing the live session down. Single responsibility: the
// SAVE side of the session cache, and the planning-draft sync that must ride along with every save.
// Injected dependencies: none imported upward — it reads the session and `state` through
// activeSessionStore.js, and the record shape comes from domain/sessionHistoryRecord.js.
//
// Every other session module calls saveActiveSessionToCache(), so this sits directly above the store
// and below everything else: keeping the draft sync here is what stops each caller from having to
// remember that a planning clipboard is persisted differently from a live one.

import { saveActiveSessionToCache as saveActiveSessionToCacheHelper } from "../data/sessionCache.js";
import { buildSessionHistoryRecord, upsertPlanningRecord } from "../domain/sessionHistoryRecord.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

// A planning-mode clipboard has no Start/Finish footer (currentPlanMode() === "planning" hides it
// entirely — see renderActiveGroupBoard), so finishWorkoutSession() never runs for one. Without
// this, a planning session simply vanishes the moment the trainer opens a different session (the
// single activeSession slot is replaced) or leaves without saving anywhere durable. Every cache
// sync while editing one upserts the CURRENT snapshot into state.history — the exact shape
// finishWorkoutSession already writes for a real session (isPlanning:true), and the exact shape
// openSessionFromHistory already knows how to reopen — matched by clientId so re-editing updates
// the same record instead of piling up duplicates (one open draft per client at a time). This is
// what backs the notification feed's "unscheduled plans" list (renderNotificationArea).
function syncPlanningSnapshotToHistory() {
  const activeSession = getActiveSession();
  if (!activeSession?.sourceSession?.isPlanning) return;
  const { state, saveToLocalStorage } = getAppDeps();
  if (!state) return;
  if (!Array.isArray(state.history)) state.history = [];

  const title = activeSession.sourceSession.titles?.[0] || "";
  const nowISO = new Date().toISOString();
  if (!activeSession.planningDraftIds) activeSession.planningDraftIds = {};

  for (const pId of activeSession.participants) {
    const draft = buildSessionHistoryRecord({
      client: state.clients.find((c) => c.id === pId),
      clientState: activeSession.clientRoutines[pId],
      feedback: activeSession.feedback || [],
      dateISO: nowISO,
      duration: 0,
      isPlanning: true,
      title,
    });
    if (!draft) continue;
    // Remember which draft this client's edits belong to, so a client holding more than one (a
    // deleted session leaves one per participant) keeps them apart across syncs.
    const stored = upsertPlanningRecord(state.history, draft, activeSession.planningDraftIds[pId]);
    activeSession.planningDraftIds[pId] = stored.id;
  }
  if (saveToLocalStorage) saveToLocalStorage();
}

export function saveActiveSessionToCache() {
  saveActiveSessionToCacheHelper(getActiveSession());
  syncPlanningSnapshotToHistory();
}
