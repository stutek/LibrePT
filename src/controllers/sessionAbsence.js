// src/controllers/sessionAbsence.js — which participants of the session on the clipboard did not
// come, and marking them so (Simon, 2026-10-12: "a client who did not come cannot have logged
// exercises").
//
// Absence is stored as the client's attendance at the booked session row (`noShow`,
// data/trainingRecords.js), never on the clipboard: the clipboard is rebuilt from stored records on
// every open and reload, so a mark kept there would be lost. A plan written for no session has no
// row to be absent from, and is never asked.
//
// Marking a client absent deletes what was logged for them in this session — ticked sets and
// signals — after asking, so the stored programs hold no work for someone who was not there. The
// values in their sets stay: they are the plan for the next time.

import {
  absentClientIds,
  markAbsent,
  markPresent,
  removePendingNotes,
} from "../data/trainingRecords.js";
import { askInApp } from "../modules/common/appQuestion.js";
import { clientDisplayName } from "../modules/common/utils.js";
import { getActiveSession, getAppDeps } from "./activeSessionStore.js";
import { saveSession, slotIdsOf } from "./sessionPrograms.js";

/** The participants of `session` marked absent from it. */
export function absentParticipants(session = getActiveSession()) {
  const { state } = getAppDeps();
  const slotIds = slotIdsOf(session);
  if (!state || slotIds.length === 0) return [];
  return absentClientIds(state, slotIds).filter((id) => session.participants.includes(id));
}

function loggedSets(session, clientId) {
  return Object.values(session.clientRoutines?.[clientId]?.logs || {})
    .flat()
    .filter((set) => set?.completed);
}

function signals(session, clientId) {
  return (session.feedback || []).filter((entry) => entry.clientId === clientId);
}

// A signal is held twice, in the session's feedback and as a note the next plan waits for, under one
// id (sessionQuickSignals.js); both go.
function deleteLoggedWork(state, session, clientId) {
  for (const set of loggedSets(session, clientId)) set.completed = false;
  removePendingNotes(
    state,
    signals(session, clientId).map((entry) => entry.id),
  );
  session.feedback = (session.feedback || []).filter((entry) => entry.clientId !== clientId);
}

/**
 * Mark `clientId` absent from the session on the clipboard, or present again if they were.
 * Resolves to whether anything changed: the trainer may decline to delete what was logged.
 */
export async function toggleAbsence(clientId) {
  const session = getActiveSession();
  const { state, t, saveToLocalStorage } = getAppDeps();
  const slotIds = slotIdsOf(session);
  if (!state || slotIds.length === 0 || !session.participants.includes(clientId)) return false;

  if (absentParticipants(session).includes(clientId)) {
    markPresent(state, slotIds, clientId);
    saveToLocalStorage?.();
    return true;
  }
  if (loggedSets(session, clientId).length > 0 || signals(session, clientId).length > 0) {
    const name = clientDisplayName(state.clients.find((client) => client.id === clientId));
    const message = t("confirm_mark_absent").replaceAll("{name}", name);
    if (!(await askInApp({ t, message, confirmKey: "btn_mark_absent", danger: true }))) {
      return false;
    }
    // The question waited for an answer; the session may have been closed meanwhile.
    if (getActiveSession() !== session) return false;
    deleteLoggedWork(state, session, clientId);
    getAppDeps().renderPendingPlanAdjustments?.();
  }
  markAbsent(state, slotIds, clientId);
  // Writes the programs without the deleted work, and stores the attendance with them.
  saveSession(session);
  return true;
}
