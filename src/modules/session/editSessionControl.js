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

function computeTimeLabel(startTime, endTime, t) {
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  return t("date_unknown") || "Date Unknown";
}

function computeSessionDayBucket(startDateTime) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfSessionDay = new Date(startDateTime);
  startOfSessionDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfSessionDay - startOfToday) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 1) return "upcoming";
  return "yesterday";
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
  const newlyAssignedIds = clientRoutines
    .map((cr) => cr.clientId)
    .filter((id) => !previousParticipants.includes(id));
  if (newlyAssignedIds.length === 0) return;
  deps.openSessionInviteDialog({
    sessionId,
    sessionName: sessionName || t("workout_setup_title") || "Workout Session",
    location,
    dateLabel: sessionDate,
    timeLabel: computeTimeLabel(startTime, endTime, t),
    startDate: new Date(`${sessionDate}T${startTime || "00:00"}`),
    endDate: new Date(`${sessionDate}T${endTime || startTime || "00:00"}`),
    clientIds: newlyAssignedIds,
  });
}

function upsertSessionRecord(sessions, sessionRecord) {
  const existingIndex = sessions.findIndex((b) => b.id === sessionRecord.id);
  if (existingIndex >= 0) {
    sessions[existingIndex] = { ...sessions[existingIndex], ...sessionRecord };
  } else {
    sessions.push(sessionRecord);
  }
}

function buildPlanningSessionMeta({ sessionId, sessionName, sessionDate, timeLabel, location, t }) {
  return {
    id: sessionId,
    isPlanning: true,
    titles: [sessionName || t("planned_program") || "Planned Program"],
    date: sessionDate,
    timeLabel,
    location,
  };
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

  const startDateTime = new Date(`${sessionDate}T${startTime || "00:00"}`);
  const sessionRecord = {
    id: sessionId,
    title: sessionName || t("workout_setup_title") || "Workout Session",
    time: timeLabel,
    startDate: startDateTime.toISOString(),
    location,
    participants: clientRoutines.map((cr) => cr.clientId),
    routineId: clientRoutines[0]?.routineId || "",
    maxCapacity: clientRoutines.length,
    day: computeSessionDayBucket(startDateTime),
  };

  upsertSessionRecord(state.sessions, sessionRecord);
  deps.saveToLocalStorage?.();
  deps.rerenderSessions?.();

  return {
    id: sessionId,
    titles: [sessionName || t("workout_setup_title") || "Workout Session"],
    date: sessionDate,
    timeLabel,
    location,
  };
}

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

    const sessionName = document.getElementById("setup-session-name")?.value.trim() || "";
    const sessionDate = document.getElementById("setup-session-date")?.value || "";
    const startTime = document.getElementById("setup-start-time")?.value || "";
    const endTime = document.getElementById("setup-end-time")?.value || "";
    const location = document.getElementById("setup-location")?.value.trim() || "";
    const timeLabel = computeTimeLabel(startTime, endTime, t);
    const sessionId = editingSessionId || newRecordId();

    // Captured before commitRealSession mutates state.sessions: the diff against this is what
    // decides who's a *newly* assigned participant (TODO §1.1) — re-saving an unchanged session
    // must not re-prompt an invite for someone already assigned.
    const previousParticipants = editingSessionId
      ? (deps.getState().sessions || []).find((s) => s.id === editingSessionId)?.participants || []
      : [];

    const sessionMeta = isPlanningModeActive
      ? buildPlanningSessionMeta({ sessionId, sessionName, sessionDate, timeLabel, location, t })
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

// Shared by start/end time inputs: draft value wins, else the target session's own time label
// (split on "-"), else the rounded default.
function resolveTimeInputValue(draftValue, targetSession, partIndex, defaultValue) {
  if (draftValue) return draftValue;
  if (targetSession?.timeLabel) {
    const parts = targetSession.timeLabel.split("-").map((s) => s.trim());
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
  if (dateInput) dateInput.value = draft?.date || targetSession?.date || defaults.defaultDate;
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
