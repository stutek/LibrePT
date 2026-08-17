// src/modules/session/editSessionControl.js
// Manages the session edit / workout setup control (#view-workout-setup / #dialog-workout-setup),
// allowing selection of participants, assigning routine plans, and configuring session details before launching the clipboard.
// Auto-persists form drafts to localStorage so user data survives page reloads.

import { newRecordId } from "../../data/recordId.js";
import {
  readVersionScoped,
  removeVersionScoped,
  writeVersionScoped,
} from "../../data/storageNamespace.js";
import {
  BUSY_ELSEWHERE,
  MERGES_INTO_ONE_CLIPBOARD,
  findScheduleConflicts,
  hasBlockingConflict,
  slotFromForm,
} from "../../domain/scheduleConflicts.js";
import { clientsToNotify, materialSessionChanges } from "../../domain/sessionChangeNotice.js";
import {
  buildPlanningSessionMeta,
  buildRealSessionMeta,
  buildSessionRecord,
  computeTimeLabel,
  newlyAssignedParticipantIds,
  sessionCalendarDate,
  upsertSessionRecord,
} from "../../domain/sessionRecord.js";

let deps = null;
let isPlanningModeActive = false;
// Version-scoped: a half-filled form belongs to the build whose form it is.
const DRAFT_KEY = "librept_workout_setup_draft";

export function initEditSessionControl(d) {
  deps = d;
}
export const initWorkoutSetup = initEditSessionControl;

export function saveEditSessionDraft() {
  const nameInput = document.getElementById("setup-session-name");
  const dateInput = document.getElementById("setup-session-date");
  const startInput = document.getElementById("setup-start-time");
  const endInput = document.getElementById("setup-end-time");
  const locInput = document.getElementById("setup-location");

  const clientRoutines = {};
  const checkedClients = [];
  const rows =
    document
      .getElementById("setup-participants-assignment-list")
      ?.querySelectorAll(".participant-setup-row") || [];

  for (const row of rows) {
    const cb = row.querySelector('input[type="checkbox"]');
    const select = row.querySelector("select");
    if (cb?.checked) {
      checkedClients.push(cb.value);
    }
    if (cb && select) {
      clientRoutines[cb.value] = select.value;
    }
  }

  const draft = {
    sessionName: nameInput?.value || "",
    date: dateInput?.value || "",
    startTime: startInput?.value || "",
    endTime: endInput?.value || "",
    location: locInput?.value || "",
    checkedClients,
    clientRoutines,
    isPlanningModeActive,
  };

  try {
    writeVersionScoped(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn("Failed to save workout setup draft to localStorage", e);
  }
}
export const saveSetupDraft = saveEditSessionDraft;

export function clearEditSessionDraft() {
  try {
    removeVersionScoped(DRAFT_KEY);
  } catch (e) {
    console.warn("Failed to clear edit session draft from localStorage:", e);
  }
}
export const clearSetupDraft = clearEditSessionDraft;

export function getEditSessionDraft() {
  try {
    const raw = readVersionScoped(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Failed to retrieve edit session draft from localStorage:", e);
    return null;
  }
}
export const getSetupDraft = getEditSessionDraft;

let editingSessionId = null;

// Session name repeated as a subtitle above the participants list — the name input sits at the top
// of a form that can scroll well past it once several clients are listed, so the trainer loses track
// of which session they're configuring. Live-synced from the input in both create and edit mode.
function updateSessionNameSubtitle() {
  const subtitleEl = document.getElementById("setup-session-name-subtitle");
  if (!subtitleEl) return;
  const name = document.getElementById("setup-session-name")?.value.trim();
  subtitleEl.textContent = name || deps.t?.("untitled_session") || "Untitled Session";
}

function collectSelectedClientRoutines() {
  const clientRoutines = [];
  const rows = document
    .getElementById("setup-participants-assignment-list")
    .querySelectorAll(".participant-setup-row");
  for (const row of rows) {
    const cb = row.querySelector('input[type="checkbox"]');
    if (cb?.checked) {
      const clientId = cb.value;
      const select = row.querySelector("select");
      const routineId = select ? select.value : "";
      clientRoutines.push({ clientId, routineId });
    }
  }
  return clientRoutines;
}

// ── Double-booking readout (TODO §1.6) ─────────────────────────────────────────────────────────
// The trainer sees this WHILE typing a time, not after saving: a clash the app only mentions on
// submit is one they have already committed to in their head, and on a phone the submit button is
// usually off-screen from the time fields anyway.

const clockLabel = (millis) =>
  new Date(millis).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function describeConflict(conflict, t) {
  if (conflict.kind === BUSY_ELSEWHERE) {
    const { start, end } = conflict.interval;
    return `${t("schedule_conflict_busy_elsewhere")} ${clockLabel(new Date(start))} - ${clockLabel(new Date(end))}`;
  }
  const lead =
    conflict.kind === MERGES_INTO_ONE_CLIPBOARD
      ? t("schedule_conflict_merged")
      : t("schedule_conflict_double_booked");
  const { title, time, location } = conflict.session;
  const where = location ? ` @ ${location}` : "";
  return `${lead}: ${title || t("untitled_session")} · ${time}${where}`;
}

// What the form currently describes, against everything already known: the trainer's own sessions
// plus whatever external calendar they have connected (none today — see getExternalBusyIntervals in
// the deps; the domain rules take both from the start because a clash is a clash whichever calendar
// knows about it).
function currentScheduleConflicts() {
  const fieldValue = (id) => document.getElementById(id)?.value.trim() || "";
  const state = deps.getState?.() || {};
  return findScheduleConflicts(
    {
      slot: slotFromForm({
        date: fieldValue("setup-session-date"),
        startTime: fieldValue("setup-start-time"),
        endTime: fieldValue("setup-end-time"),
      }),
      sessionId: editingSessionId,
      location: fieldValue("setup-location"),
    },
    { sessions: state.sessions || [], busy: deps.getExternalBusyIntervals?.() || [] },
  );
}

export function refreshScheduleConflictNotice() {
  const list = document.getElementById("setup-schedule-conflicts");
  if (!list || !deps) return;
  const conflicts = currentScheduleConflicts();
  list.replaceChildren();
  list.hidden = conflicts.length === 0;
  for (const conflict of conflicts) {
    const row = document.createElement("li");
    row.className =
      conflict.kind === MERGES_INTO_ONE_CLIPBOARD ? "schedule-note" : "schedule-clash";
    row.textContent = describeConflict(conflict, deps.t);
    list.appendChild(row);
  }
}

// A clash is a warning, never a block: a trainer moving a session on the gym floor knows things the
// app does not (the other booking was cancelled, someone is covering). Confirming is the trainer
// saying so — silently refusing the save would be the app overruling the person in the room.
function confirmScheduleConflictIfNeeded(t) {
  if (!hasBlockingConflict(currentScheduleConflicts())) return true;
  return confirm(t("schedule_conflict_confirm"));
}

// Confirms removing a participant who already has recorded feedback data on this session — returns
// false only if the trainer explicitly cancels the confirm dialog (submit should then abort).
function confirmParticipantRemovalIfNeeded(sessionId, deps, clientRoutines) {
  if (!sessionId) return true;
  const state = deps.getState();
  const existingSession = (state.sessions || []).find((b) => b.id === sessionId);
  if (!existingSession?.participants) return true;
  const selectedClientIds = clientRoutines.map((cr) => cr.clientId);
  const removedParticipants = existingSession.participants.filter(
    (pid) => !selectedClientIds.includes(pid),
  );
  const hasFeedbackRisk =
    removedParticipants.length > 0 &&
    (existingSession.status === "completed" ||
      existingSession.loggedHistory ||
      existingSession.hasFeedback);
  if (!hasFeedbackRisk) return true;
  return confirm(
    "Warning: You are removing a participant from a session with recorded feedback data. Removing a client from the session will update session details, but all exercise history logs already recorded for this client will be preserved in their client history. Do you wish to proceed?",
  );
}

// Diffs against the session's participants as they stood before this save, so re-saving an
// unchanged assignment never re-prompts an invite for someone already assigned (TODO §1.1).
function notifyNewlyAssignedParticipants(
  deps,
  {
    previousParticipants,
    clientRoutines,
    sessionId,
    sessionName,
    sessionDate,
    startTime,
    endTime,
    location,
    t,
  },
) {
  if (!deps.openSessionInviteDialog) return;
  const newlyAssignedIds = newlyAssignedParticipantIds(previousParticipants, clientRoutines);
  if (newlyAssignedIds.length === 0) return;
  const slot = slotFromForm({ date: sessionDate, startTime, endTime });
  if (!slot) return;
  deps.openSessionInviteDialog({
    sessionId,
    sessionName: sessionName || t("workout_setup_title") || "Workout Session",
    location,
    dateLabel: sessionDate,
    timeLabel: computeTimeLabel(startTime, endTime, t("date_unknown") || "Date Unknown"),
    // Through slotFromForm rather than a second `new Date(...)`: an end at or before the start
    // crosses midnight, and building it here directly gave a 22:00-00:00 session an invite whose
    // DTEND preceded its DTSTART — which a calendar client is entitled to reject outright.
    startDate: new Date(slot.startMs),
    endDate: new Date(slot.endMs),
    clientIds: newlyAssignedIds,
  });
}

/**
 * Asks whether the clients who were already invited should be told, when a session moves.
 *
 * Only for changes a client would ACT on — the slot or the room (domain/sessionChangeNotice.js) — and
 * only for people who were actually invited and are still participants. A prompt that fired on a
 * renamed session would teach the trainer to dismiss it, and then be dismissed on the change that
 * mattered.
 *
 * It reuses the ordinary invite dialog rather than inventing a "resend" flow: the message a client needs
 * for a moved session is the same message they needed for the original one, and sending it again
 * refreshes `sentAt` on their existing invitation while keeping the answer they had already given —
 * which, because both are UTC instants, is legible afterwards as "answered before this went out".
 */
function offerResendAfterChange(deps, { asTold, now, identity, startTime, t }) {
  if (!deps.openSessionInviteDialog || !now) return;
  const changes = materialSessionChanges(asTold, now);
  if (changes.length === 0) return;

  const invited = clientsToNotify(deps.getState().invites, identity.sessionId, now.participants);
  if (invited.length === 0) return;

  const what = changes.map((change) => t(`session_change_${change}`) || change).join(", ");
  // A confirm() is the right weight here, unlike §9.3's per-record cleanup: this is one yes/no about one
  // session, and the alternative is a dialog stacked on top of the dialog the trainer just submitted.
  if (!window.confirm(`${t("session_changed_resend") || "This session changed"} (${what}).`))
    return;

  const slot = slotFromForm({ date: identity.sessionDate, startTime, endTime: "" });
  deps.openSessionInviteDialog({
    ...identity,
    sessionName: identity.sessionName,
    dateLabel: identity.sessionDate,
    timeLabel: identity.timeLabel,
    startDate: slot ? new Date(slot.startMs) : null,
    endDate: slot ? new Date(slot.endMs) : null,
    clientIds: invited,
  });
}

// Planning mode never touches the sessions list (it's a routine-adjustment flow, not a scheduled
// session — see activeSessionController's `!ss.isPlanning` guards). A real session must be added
// here: startWorkoutSession only stashes sessionMeta into the ephemeral active-session cache, it
// never writes to state.sessions, so without this the new session launches the clipboard but never
// appears on the homepage list.
function commitRealSession(
  deps,
  { sessionId, sessionName, sessionDate, startTime, timeLabel, location, clientRoutines, t },
) {
  const state = deps.getState();
  state.sessions = state.sessions || [];

  const title = sessionName || t("workout_setup_title") || "Workout Session";
  const identity = { sessionId, sessionName: title, sessionDate, timeLabel, location };

  // Snapshot BEFORE the upsert, because it edits in place: the resend prompt below compares the slot
  // and the room the clients were told about against what they are now (TODO §1.6, asked for
  // 2026-08-17 — "when a session gets changed, PT should be asked if they want to resend invitations").
  const before = state.sessions.find((session) => session.id === sessionId);
  const asTold = before ? { ...before } : null;

  upsertSessionRecord(
    state.sessions,
    buildSessionRecord({ ...identity, startTime, clientRoutines }),
  );
  deps.saveToLocalStorage?.();
  deps.rerenderSessions?.();

  offerResendAfterChange(deps, {
    asTold,
    now: state.sessions.find((session) => session.id === sessionId),
    identity,
    startTime,
    t,
  });

  return buildRealSessionMeta(identity);
}

// Every field the setup form holds, read once. The `|| ""` fallbacks are about a field being
// absent from the DOM, not about the trainer leaving it blank, so they belong together here rather
// than spread through the submit handler — which is also what keeps that handler under the
// complexity gate now that the record shapes have moved to domain/sessionRecord.js.
function readSessionFormFields(t) {
  const fieldValue = (id) => document.getElementById(id)?.value.trim() || "";
  const startTime = fieldValue("setup-start-time");
  const endTime = fieldValue("setup-end-time");
  return {
    sessionName: fieldValue("setup-session-name"),
    sessionDate: fieldValue("setup-session-date"),
    startTime,
    endTime,
    location: fieldValue("setup-location"),
    timeLabel: computeTimeLabel(startTime, endTime, t("date_unknown") || "Date Unknown"),
  };
}

// An untitled planning draft still needs something a trainer can recognise in the feed.
const plannedProgramLabel = (t) => t("planned_program") || "Planned Program";

export function setupEditSessionControl() {
  const form = document.getElementById("form-workout-setup");
  if (!form) return;

  const cancelBtns = document.querySelectorAll(
    ".setup-cancel-btn, #view-workout-setup .view-grabber",
  );

  const handleCancel = () => {
    clearEditSessionDraft();
    editingSessionId = null;
    deps.pushRoute(deps.urlFor("sessions.day", { isoDate: deps.getISODateForColumn("today") }));
    deps.switchView("clients");
    // Coordinated against renderSessions()'s own re-settle via scheduleTimelineSettle, rather than
    // a private requestAnimationFrame racing it (sessionTimeline.js).
    deps.scheduleTimelineSettle?.("today", "auto");
  };

  for (const btn of cancelBtns) {
    btn.addEventListener("click", handleCancel);
  }

  // Real-time participant filtering by client name
  const searchInput = document.getElementById("setup-participant-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      const rows =
        document
          .getElementById("setup-participants-assignment-list")
          ?.querySelectorAll(".participant-setup-row") || [];
      for (const row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = !q || text.includes(q) ? "flex" : "none";
      }
    });
  }

  // Auto-save draft on any input change
  form.addEventListener("input", saveEditSessionDraft);
  form.addEventListener("change", saveEditSessionDraft);
  form.addEventListener("input", refreshScheduleConflictNotice);
  form.addEventListener("change", refreshScheduleConflictNotice);

  const nameInputEl = document.getElementById("setup-session-name");
  if (nameInputEl) {
    nameInputEl.addEventListener("input", updateSessionNameSubtitle);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const clientRoutines = collectSelectedClientRoutines();
    const { t } = deps;

    if (clientRoutines.length === 0) {
      alert("You must select at least one participant client.");
      return;
    }

    const missingRoutine = clientRoutines.find((cr) => !cr.routineId);
    if (missingRoutine) {
      alert("Please assign a routine template to all selected participants.");
      return;
    }

    if (!confirmParticipantRemovalIfNeeded(editingSessionId, deps, clientRoutines)) return;
    if (!confirmScheduleConflictIfNeeded(t)) return;

    const { sessionName, sessionDate, startTime, endTime, location, timeLabel } =
      readSessionFormFields(t);
    const sessionId = editingSessionId || newRecordId();

    // Captured before commitRealSession mutates state.sessions: the diff against this is what
    // decides who's a *newly* assigned participant (TODO §1.1) — re-saving an unchanged session
    // must not re-prompt an invite for someone already assigned.
    const previousParticipants = editingSessionId
      ? (deps.getState().sessions || []).find((s) => s.id === editingSessionId)?.participants || []
      : [];

    const sessionMeta = isPlanningModeActive
      ? buildPlanningSessionMeta({
          sessionId,
          sessionName: sessionName || plannedProgramLabel(t),
          sessionDate,
          timeLabel,
          location,
        })
      : commitRealSession(deps, {
          sessionId,
          sessionName,
          sessionDate,
          startTime,
          timeLabel,
          location,
          clientRoutines,
          t,
        });

    if (!isPlanningModeActive) {
      notifyNewlyAssignedParticipants(deps, {
        previousParticipants,
        clientRoutines,
        sessionId,
        sessionName,
        sessionDate,
        startTime,
        endTime,
        location,
        t,
      });
    }

    clearEditSessionDraft();
    editingSessionId = null;
    deps.startWorkoutSession(clientRoutines, sessionMeta);
  });
}
export const setupWorkoutSetup = setupEditSessionControl;

// Session Name / Location comboboxes are seeded with a fixed set of common presets, topped up with
// whatever titles/locations already exist in state so the trainer's own past entries resurface.
function populateSessionNameSuggestions(nameDatalist, state, deps) {
  if (!nameDatalist || !state) return;
  const suggestions = new Set([
    "Morning Strength",
    "Hypertrophy Upper",
    "Full Body Conditioning",
    "Cardio & Core",
    "Athletic Performance",
    "Mobility & Recovery",
    "Lower Body Power",
    "Personal Training 1-on-1",
  ]);
  for (const b of state.sessions || []) {
    const title = b.title || b.titles?.[0];
    if (title) suggestions.add(title);
  }
  for (const r of state.routines || []) {
    if (r.name) suggestions.add(r.name);
  }
  nameDatalist.innerHTML = Array.from(suggestions)
    .map((s) => `<option value="${deps.escapeHTML ? deps.escapeHTML(s) : s}"></option>`)
    .join("");
}

function populateLocationSuggestions(locDatalist, state, deps) {
  if (!locDatalist || !state) return;
  const locSuggestions = new Set([
    "Trib gym base",
    "playground outside",
    "city park",
    "Studio A",
    "Main Gym Floor",
    "Client Home Studio",
  ]);
  for (const b of state.sessions || []) {
    if (b.location) locSuggestions.add(b.location);
  }
  locDatalist.innerHTML = Array.from(locSuggestions)
    .map((l) => `<option value="${deps.escapeHTML ? deps.escapeHTML(l) : l}"></option>`)
    .join("");
}

// Default start time rounds up to the next :00 or :30 mark; default end is +1h from that.
function computeDefaultSessionTimes() {
  const now = new Date();
  const mins = now.getMinutes();
  const startDate = new Date(now);
  if (mins > 0 && mins <= 30) {
    startDate.setMinutes(30, 0, 0);
  } else if (mins > 30) {
    startDate.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    startDate.setMinutes(0, 0, 0);
  }
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const fmtTime = (d) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return {
    defaultDate: startDate.toISOString().split("T")[0],
    defaultStartTime: fmtTime(startDate),
    defaultEndTime: fmtTime(endDate),
  };
}

// Shared by start/end time inputs: draft value wins, else the target session's own slot label
// (split on "-"), else the rounded default.
//
// `time` is the field a STORED session carries — `timeLabel` is the live clipboard's meta shape, and
// reading only that one meant editing a scheduled session found nothing and fell through to "now".
// Re-saving then silently moved the session to the current hour, which is the kind of edit nobody
// notices making and everybody notices later.
function resolveTimeInputValue(draftValue, targetSession, partIndex, defaultValue) {
  if (draftValue) return draftValue;
  const slotLabel = targetSession?.time || targetSession?.timeLabel;
  if (slotLabel) {
    const parts = slotLabel.split("-").map((s) => s.trim());
    return parts[partIndex] || defaultValue;
  }
  return defaultValue;
}

function populateSessionFormFields(
  { nameInput, dateInput, startInput, endInput, locInput },
  draft,
  targetSession,
  defaults,
) {
  if (nameInput) {
    nameInput.value =
      draft?.sessionName ?? (targetSession?.title || targetSession?.titles?.[0] || "");
  }
  // A stored session's day comes from its own `startDate`; `date` is the clipboard meta's field.
  // Neither used to be consulted for a record, so opening any scheduled session for edit showed
  // today — and saving moved it here.
  if (dateInput) {
    dateInput.value =
      draft?.date ||
      targetSession?.date ||
      sessionCalendarDate(targetSession) ||
      defaults.defaultDate;
  }
  if (startInput) {
    startInput.value = resolveTimeInputValue(
      draft?.startTime,
      targetSession,
      0,
      defaults.defaultStartTime,
    );
  }
  if (endInput) {
    endInput.value = resolveTimeInputValue(
      draft?.endTime,
      targetSession,
      1,
      defaults.defaultEndTime,
    );
  }
  if (locInput) locInput.value = draft?.location ?? (targetSession?.location || "");
}

function determineParticipantChecked(client, draft, targetSession, preselectedClientId) {
  if (draft?.checkedClients) return draft.checkedClients.includes(client.id);
  if (targetSession) return targetSession.participants.includes(client.id);
  if (preselectedClientId === client.id) return true;
  return !preselectedClientId && client.id !== "c3c7d2c4";
}

// null means "leave the <select> unset" (its default: the first non-disabled option) — matches the
// original behaviour where no branch assigning select.value ran at all.
function determineParticipantRoutineValue(
  client,
  draft,
  isPlanningModeActive,
  targetSession,
  preselectedRoutineId,
  preselectedClientId,
  state,
) {
  if (draft?.clientRoutines?.[client.id]) return draft.clientRoutines[client.id];
  if (isPlanningModeActive) return "empty_plan";
  if (targetSession?.participants.includes(client.id)) return targetSession.routineId;
  if (preselectedRoutineId && preselectedClientId === client.id) return preselectedRoutineId;
  if (client.id === "c1a9f0e2") return "r10d5e6f";
  if (client.id === "c2b8e1d3") return "r11d5e6f";
  if (state.routines.length > 0) return state.routines[0].id;
  return null;
}

function buildParticipantRow(client, ctx) {
  const {
    draft,
    targetSession,
    preselectedClientId,
    preselectedRoutineId,
    isPlanningModeActive,
    state,
    t,
    getClientDisplayNameHTML,
  } = ctx;

  const row = document.createElement("div");
  row.className = "participant-setup-row";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "8px";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = client.id;
  cb.id = `setup-cb-${client.id}`;
  cb.style.width = "16px";
  cb.style.height = "16px";
  cb.style.cursor = "pointer";
  cb.checked = determineParticipantChecked(client, draft, targetSession, preselectedClientId);

  const nameLabel = document.createElement("label");
  nameLabel.htmlFor = `setup-cb-${client.id}`;
  nameLabel.innerHTML = getClientDisplayNameHTML(client);
  nameLabel.style.fontWeight = "600";
  nameLabel.style.cursor = "pointer";
  nameLabel.style.fontSize = "13px";

  left.appendChild(cb);
  left.appendChild(nameLabel);

  const right = document.createElement("div");

  const select = document.createElement("select");
  select.className = "form-control select-routine-dropdown";
  select.style.padding = "4px 8px";
  select.style.fontSize = "12px";
  select.style.width = "160px";
  select.style.height = "30px";

  select.innerHTML = `<option value="" disabled>${t("select_exercise")}</option>`;
  const emptyOpt = document.createElement("option");
  emptyOpt.value = "empty_plan";
  emptyOpt.textContent = t("custom_empty_plan") || "Custom / Empty Plan";
  select.appendChild(emptyOpt);

  for (const r of state.routines) {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.name;
    select.appendChild(opt);
  }

  const routineValue = determineParticipantRoutineValue(
    client,
    draft,
    isPlanningModeActive,
    targetSession,
    preselectedRoutineId,
    preselectedClientId,
    state,
  );
  if (routineValue != null) select.value = routineValue;

  right.appendChild(select);
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

export function openEditSessionControlModal(
  preselectedClientId = null,
  preselectedRoutineId = null,
  preselectedSessionId = null,
  isPlanning = false,
) {
  isPlanningModeActive = isPlanning;
  editingSessionId = preselectedSessionId || null;
  if (deps.switchView) {
    deps.switchView("workout-setup");
  }

  const participantsList = document.getElementById("setup-participants-assignment-list");
  if (!participantsList) return;
  participantsList.innerHTML = "";

  const searchInput = document.getElementById("setup-participant-search");
  if (searchInput) searchInput.value = "";

  const state = deps.getState();
  const { t, getClientDisplayNameHTML } = deps;

  const titleEl = document.getElementById("workout-setup-view-title");
  if (titleEl) {
    titleEl.textContent = isPlanning
      ? t("plan_program_title") || "Plan Upcoming Program"
      : t("workout_setup_title") || "Start Workout Session";
  }

  populateSessionNameSuggestions(document.getElementById("setup-session-name-list"), state, deps);
  populateLocationSuggestions(document.getElementById("setup-location-list"), state, deps);

  const sessions = state.sessions || [];
  const targetSession = preselectedSessionId
    ? sessions.find((b) => b.id === preselectedSessionId)
    : null;

  const draft = getEditSessionDraft();
  const defaults = computeDefaultSessionTimes();

  populateSessionFormFields(
    {
      nameInput: document.getElementById("setup-session-name"),
      dateInput: document.getElementById("setup-session-date"),
      startInput: document.getElementById("setup-start-time"),
      endInput: document.getElementById("setup-end-time"),
      locInput: document.getElementById("setup-location"),
    },
    draft,
    targetSession,
    defaults,
  );

  updateSessionNameSubtitle();
  refreshScheduleConflictNotice();

  const clientsList = state?.clients || [];
  const rowCtx = {
    draft,
    targetSession,
    preselectedClientId,
    preselectedRoutineId,
    isPlanningModeActive,
    state,
    t,
    getClientDisplayNameHTML,
  };
  for (const client of [...clientsList].sort((a, b) => a.name.localeCompare(b.name))) {
    participantsList.appendChild(buildParticipantRow(client, rowCtx));
  }
}
export const openWorkoutSetupModal = openEditSessionControlModal;
