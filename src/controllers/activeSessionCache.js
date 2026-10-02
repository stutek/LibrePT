// src/controllers/activeSessionCache.js — writing the live session down. Single responsibility: the
// SAVE side of the session cache, and the planning-draft sync that must ride along with every save.
// Injected dependencies: none imported upward — it reads the session and `state` through
// activeSessionStore.js, the record shape comes from domain/sessionHistoryRecord.js, and the draft is
// stored through data/trainingRecords.js.
//
// Every other session module calls saveActiveSessionToCache(), so this sits directly above the store
// and below everything else: keeping the draft sync here is what stops each caller from having to
// remember that a planning clipboard is persisted differently from a live one.

import { saveActiveSessionToCache as saveActiveSessionToCacheHelper } from "../data/sessionCache.js";
import { saveDraft } from "../data/trainingRecords.js";
import { buildSessionHistoryRecord } from "../domain/sessionHistoryRecord.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";

// A planning-mode clipboard has no Start/Finish footer (currentPlanMode() === "planning" hides it
// entirely — see renderActiveGroupBoard), so finishWorkoutSession() never runs for one. Without
// this, a planning session simply vanishes the moment the trainer opens a different session (the
// single activeSession slot is replaced) or leaves without saving anywhere durable. Every cache
// sync while editing one saves the CURRENT snapshot as the client's planned program — the record
// finishWorkoutSession already writes for a real session (isPlanning:true), which
// openSessionFromHistory knows how to reopen — updating the same draft instead of piling up
// duplicates. This is what backs the notification feed's "unscheduled plans" list
// (renderNotificationArea).
function syncPlanningSnapshotToHistory() {
  const activeSession = getActiveSession();
  if (!activeSession?.sourceSession?.isPlanning) return;
  const { state, saveToLocalStorage } = getAppDeps();
  if (!state) return;

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
    activeSession.planningDraftIds[pId] = saveDraft(
      state,
      draft,
      activeSession.planningDraftIds[pId],
    );
  }
  if (saveToLocalStorage) saveToLocalStorage();
}

export function saveActiveSessionToCache() {
  saveActiveSessionToCacheHelper(getActiveSession());
  syncPlanningSnapshotToHistory();
}

// A plan edit, as distinct from any other save: it records when the trainer last worked on this
// clipboard. isCachedSessionStale counts from that moment too, so a morning session written up in
// the afternoon is not thrown away by the next reload for being past its slot.
export function savePlanEdit() {
  const session = getActiveSession();
  if (session) session.planEditedAt = Date.now();
  saveActiveSessionToCache();
}
