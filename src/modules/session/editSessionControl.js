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
import {
  clientsToNotify,
  materialSessionChanges,
  sessionModalityProfile,
} from "../../domain/sessionChangeNotice.js";
import {
  buildPlanningSessionMeta,
  buildRealSessionMeta,
  buildSessionRecord,
  computeTimeLabel,
  newlyAssignedParticipantIds,
  sessionCalendarDate,
  upsertSessionRecord,
} from "../../domain/sessionRecord.js";
import { seriesWithEdit, validateSeries } from "../../domain/sessionSeries.js";
import { clockToMinutes, parseTimeRange, timePlusMinutes } from "../../domain/timeRange.js";
import { mountTimeField } from "../common/timeField.js";
import { formatClockFromEpoch } from "../common/utils.js";
import {
  readRepeatFields,
  resetRepeatControls,
  setupRepeatControls,
} from "./sessionRepeatControls.js";

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
  // A row EXISTS only for a client who is on the session, so the rows are the selection.
  for (const row of participantRows()) {
    const clientId = row.dataset.clientId;
    if (!clientId) continue;
    checkedClients.push(clientId);
    const select = row.querySelector("select");
    if (select) clientRoutines[clientId] = select.value;
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

// The rows currently on the form — one per client who is training in this session.
function participantRows() {
  return (
    document
      .getElementById("setup-participants-assignment-list")
      ?.querySelectorAll(".participant-setup-row") || []
  );
}

function collectSelectedClientRoutines() {
  const clientRoutines = [];
  for (const row of participantRows()) {
    const clientId = row.dataset.clientId;
    if (!clientId) continue;
    const select = row.querySelector("select");
    clientRoutines.push({ clientId, routineId: select ? select.value : "" });
  }
  return clientRoutines;
}

// Moving the start moves the end with it, keeping the length the trainer already chose — an hour
// until they say otherwise. Dragging a start back to 06:00 used to leave the end behind, and a
// session whose end is at or before its start has no length at all: the warning list then read the
// whole day as taken (domain/scheduleConflicts.js), and the saved slot was wrong too.
// 24-hour entry, marks and steppers around both slot fields (modules/common/timeField.js). The end
// field's marks count from the START rather than from the clock: its four half hours are then the
// four session lengths a trainer actually books.
function mountEditSessionTimeFields() {
  const startInput = document.getElementById("setup-start-time");
  const endInput = document.getElementById("setup-end-time");
  const t = deps?.t;
  mountTimeField(startInput, { t });
  mountTimeField(endInput, { t, anchorInput: startInput });
}

function keepSessionLengthWhenStartMoves() {
  const startInput = document.getElementById("setup-start-time");
  const endInput = document.getElementById("setup-end-time");
  if (!startInput || !endInput) return;
  startInput.addEventListener("input", () => {
    // A field mid-entry ("173" on the way to 17:30) is not a move, and treating it as one wiped the
    // end time on every keystroke: `timePlusMinutes` cannot read it, so the end was set to "".
    if (clockToMinutes(startInput.value) === null) return;
    const pairedWith = startInput.dataset.pairedWith || "";
    startInput.dataset.pairedWith = startInput.value;
    const range = parseTimeRange(`${pairedWith} - ${endInput.value}`);
    const kept = range ? range.end - range.start : 0;
    // A full day means the two were equal, which is the state this exists to get out of.
    const minutes = kept > 0 && kept < 24 * 60 ? kept : 60;
    endInput.value = timePlusMinutes(startInput.value, minutes);
  });
}

// ── Double-booking readout (TODO §1.6) ─────────────────────────────────────────────────────────
// The trainer sees this WHILE typing a time, not after saving: a clash the app only mentions on
// submit is one they have already committed to in their head, and on a phone the submit button is
// usually off-screen from the time fields anyway.

function describeConflict(conflict, t) {
  if (conflict.kind === BUSY_ELSEWHERE) {
    const { start, end } = conflict.interval;
    return `${t("schedule_conflict_busy_elsewhere")} ${formatClockFromEpoch(start)} - ${formatClockFromEpoch(end)}`;
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

/** The session's KIND, as the set of modalities its routine prescribes — "leg strength" versus "cardio".
 *
 * Derived rather than stored: a session record names a routine, and what that routine IS depends on the
 * exercises it prescribes, which the trainer may edit independently. Reading it at comparison time is
 * what makes "this became a cardio session" detectable at all.
 */
function sessionKindOf(state, session) {
  const routineIds = session?.routineId ? [session.routineId] : [];
  return sessionModalityProfile(routineIds, state.routines || [], state.exercises || []);
}

/**
 * Asks whether the clients who were already invited should be told, when a session changes.
 *
 * Only for changes a client would ACT on (domain/sessionChangeNotice.js) — refined 2026-08-17 to: the
 * slot, the room, the session's KIND (leg strength becoming cardio, which changes how someone eats and
 * what they bring), and the invitee list (a one-to-one that becomes a group of five is a different
 * offer). A rename or a reshuffled plan of the same kind asks nothing.
 *
 * And only for people who were actually invited and are still participants. A prompt that fired on a
 * renamed session would teach the trainer to dismiss it, and then be dismissed on the change that
 * mattered.
 *
 * **The trainer decides, always** — "it is up to PT to resend invitations". This offers; it never sends.
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
/** Writes the repeating RULE the form describes, when the trainer ticked "repeats" (TODO §35.3a).
 *
 * Returns the series, or null when this is an ordinary one-off — which is most sessions, and why
 * the control is off by default.
 *
 * A malformed rule is dropped with a console warning rather than stored: a series with no days
 * produces no evenings, and a silent nothing is the worst answer a scheduler can give.
 */
function commitSeriesIfRepeating(
  deps,
  { sessionName, sessionDate, timeLabel, location, clientRoutines, t },
) {
  const state = deps.getState();
  const series = readRepeatFields({
    id: newRecordId(),
    session: {
      title: sessionName || t("workout_setup_title") || "Workout Session",
      sessionDate,
      timeLabel,
      location,
      participants: clientRoutines.map((assignment) => assignment.clientId),
      routineId: clientRoutines[0]?.routineId || "",
    },
  });
  if (!series) return null;

  const problems = validateSeries(series);
  if (problems.length > 0) {
    console.warn(`[series] not saved: ${problems.join("; ")}`);
    return null;
  }

  state.sessionSeries = [...(state.sessionSeries || []), series];
  deps.saveToLocalStorage?.();
  deps.rerenderSessions?.();
  resetRepeatControls();
  return series;
}

/** Applies this evening's edit to the RULE, when the trainer asked for it (TODO §35.3a).
 *
 * The exception row is dropped afterwards: it existed to say "this evening is different", and the
 * trainer has just said it is not. Leaving it would show the old values on the one evening they
 * edited, which is the exact opposite of what they asked for.
 */
function applyEditToSeriesIfAsked(
  deps,
  { sessionId, sessionName, timeLabel, location, clientRoutines },
) {
  if (!document.getElementById("setup-apply-to-series")?.checked) return;
  const state = deps.getState();
  const session = (state.sessions || []).find((row) => row.id === sessionId);
  if (!session?.seriesId) return;

  state.sessionSeries = (state.sessionSeries || []).map((series) =>
    series.id === session.seriesId
      ? seriesWithEdit(series, {
          title: sessionName || series.title,
          time: timeLabel,
          location,
          participants: clientRoutines.map((assignment) => assignment.clientId),
          routineId: clientRoutines[0]?.routineId,
        })
      : series,
  );
  state.sessions = (state.sessions || []).filter((row) => row.id !== sessionId);
  deps.saveToLocalStorage?.();
  deps.rerenderSessions?.();
}

function commitRealSession(
  deps,
  { sessionId, sessionName, sessionDate, startTime, timeLabel, location, clientRoutines, t },
) {
  const state = deps.getState();
  state.sessions = state.sessions || [];

  const title = sessionName || t("workout_setup_title") || "Workout Session";
  const identity = { sessionId, sessionName: title, sessionDate, timeLabel, location };

  // Snapshot BEFORE the upsert, because it edits in place: the resend prompt below compares what the
  // clients were told against what the session is now (TODO §1.6, asked for 2026-08-17 — "when a session
  // gets changed, PT should be asked if they want to resend invitations").
  //
  // The snapshot carries the session's KIND alongside its fields, because "leg strength became cardio"
  // is one of the changes that counts (refined the same day) and it is not a field on the record — it
  // has to be derived from the routines the participants were given.
  const before = state.sessions.find((session) => session.id === sessionId);
  const asTold = before ? { ...before, modalities: sessionKindOf(state, before) } : null;

  upsertSessionRecord(
    state.sessions,
    buildSessionRecord({ ...identity, startTime, clientRoutines }),
  );
  deps.saveToLocalStorage?.();
  deps.rerenderSessions?.();

  const saved = state.sessions.find((session) => session.id === sessionId);
  offerResendAfterChange(deps, {
    asTold,
    now: saved ? { ...saved, modalities: sessionKindOf(state, saved) } : null,
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

  keepSessionLengthWhenStartMoves();

  setupParticipantSearch();

  // Auto-save draft on any input change
  form.addEventListener("input", saveEditSessionDraft);
  form.addEventListener("change", saveEditSessionDraft);
  form.addEventListener("input", refreshScheduleConflictNotice);
  form.addEventListener("change", refreshScheduleConflictNotice);

  setupRepeatControls({ lang: deps.getState?.().lang || "en" });

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

    // A repeating slot is saved as the RULE (TODO §35.3a), and the board derives its evenings — so
    // there is nothing to write into `sessions` for the weeks ahead, and editing "Tuesdays at six"
    // later is one record rather than a sweep. The session in front of the trainer is still created
    // and still launches, because they filled this form in to run something now.
    commitSeriesIfRepeating(deps, {
      sessionName,
      sessionDate,
      timeLabel,
      location,
      clientRoutines,
      t,
    });

    // "Change every evening of this session" (TODO §35.3a): the rule takes the edit, and this
    // evening stops being an exception so it follows the rule again like the others.
    applyEditToSeriesIfAsked(deps, {
      sessionId,
      sessionName,
      timeLabel,
      location,
      clientRoutines,
    });

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
    // What the end is currently paired with — see keepSessionLengthWhenStartMoves.
    startInput.dataset.pairedWith = startInput.value;
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

// Who the form OPENS with. A saved draft wins, then the session being edited, then the client the
// trainer arrived from. With none of those it opens empty: the form used to tick every client in the
// base, which is defensible with four of them and wrong with a hundred — the trainer would be
// removing ninety-eight people to book one.
function participantsOnOpen(clients, draft, targetSession, preselectedClientId) {
  const chosenIds =
    draft?.checkedClients ||
    targetSession?.participants ||
    (preselectedClientId ? [preselectedClientId] : []);
  return chosenIds
    .map((id) => clients.find((client) => client.id === id))
    .filter((client) => client !== undefined);
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
  // The row IS the selection — there is no checkbox to read, and nothing here is listed unchosen.
  row.dataset.clientId = client.id;

  const nameLabel = document.createElement("span");
  nameLabel.className = "participant-name";
  nameLabel.innerHTML = getClientDisplayNameHTML(client);

  const select = document.createElement("select");
  select.className = "form-control select-routine-dropdown";
  select.setAttribute("aria-label", t("select_routine_for") || "Programme");

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

  // Taking someone off the session is one tap, next to their name, and says so out loud for a
  // screen reader — the trainer who added the wrong Ana must not have to hunt for how to undo it.
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "participant-remove";
  // The glyph is built as an element rather than assigned as HTML: the client's name goes into the
  // label right below it, and an innerHTML line above it is exactly what the escaping audit
  // (build/frontend_audit.py) has to treat as a sink.
  const removeIcon = document.createElement("i");
  removeIcon.className = "fa-solid fa-xmark";
  removeIcon.setAttribute("aria-hidden", "true");
  remove.appendChild(removeIcon);
  remove.setAttribute("aria-label", `${t("remove_participant") || "Remove"} ${client.name}`);
  remove.addEventListener("click", () => {
    row.remove();
    refreshParticipantSummary();
    saveEditSessionDraft();
  });

  row.appendChild(nameLabel);
  row.appendChild(select);
  row.appendChild(remove);
  return row;
}

// ── Finding a client among a hundred (TODO §46.2) ──────────────────────────────────────────────
// The context the search needs to build a row, kept from the last time the form was opened: the
// listener is bound once at init, and the draft, the session being edited and the routine list all
// belong to the current opening.
let participantRowContext = null;

/** At most this many names at once: a suggestion list longer than the phone screen is the wall this
 * redesign removed, and a trainer who sees eight near-matches types one more letter. */
const MAX_PARTICIPANT_MATCHES = 8;

function chosenParticipantIds() {
  return new Set([...participantRows()].map((row) => row.dataset.clientId));
}

/** The count and the empty line, which are how the trainer knows the search did anything. */
function refreshParticipantSummary() {
  const chosen = participantRows().length;
  const count = document.getElementById("setup-participant-count");
  const empty = document.getElementById("setup-participants-empty");
  const t = deps?.t || ((key) => key);
  if (count) count.textContent = chosen ? `${t("participants_chosen")}: ${chosen}` : "";
  if (empty) empty.hidden = chosen > 0;
}

function addParticipant(client) {
  if (!participantRowContext || chosenParticipantIds().has(client.id)) return;
  document
    .getElementById("setup-participants-assignment-list")
    ?.appendChild(buildParticipantRow(client, participantRowContext));
  refreshParticipantSummary();
  saveEditSessionDraft();
}

function matchingClients(query) {
  const chosen = chosenParticipantIds();
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return (participantRowContext?.state?.clients || [])
    .filter((client) => !chosen.has(client.id) && client.name.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAX_PARTICIPANT_MATCHES);
}

function renderParticipantMatches(query) {
  const list = document.getElementById("setup-participant-matches");
  const search = document.getElementById("setup-participant-search");
  if (!list) return;
  const t = deps?.t || ((key) => key);
  list.replaceChildren();
  const open = query.trim().length > 0;
  list.hidden = !open;
  search?.setAttribute("aria-expanded", String(open));
  if (!open) return;

  const matches = matchingClients(query);
  if (matches.length === 0) {
    const none = document.createElement("li");
    none.className = "participant-match-empty";
    none.textContent = t("no_matching_clients") || "No matching clients";
    list.appendChild(none);
    return;
  }
  for (const client of matches) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "participant-match";
    button.dataset.clientId = client.id;
    button.innerHTML = `<span>${deps.getClientDisplayNameHTML(client)}</span><i class="fa-solid fa-plus" aria-hidden="true"></i>`;
    button.addEventListener("click", () => {
      addParticipant(client);
      clearParticipantSearch();
    });
    item.appendChild(button);
    list.appendChild(item);
  }
}

function clearParticipantSearch() {
  const search = document.getElementById("setup-participant-search");
  if (search) search.value = "";
  renderParticipantMatches("");
  search?.focus();
}

// Typing a name and pressing Enter adds the first match, so a trainer at a keyboard never has to
// leave the field — and Enter inside a form otherwise submits it, which would launch the clipboard
// mid-search.
function setupParticipantSearch() {
  const search = document.getElementById("setup-participant-search");
  if (!search) return;
  search.addEventListener("input", () => renderParticipantMatches(search.value));
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const [first] = matchingClients(search.value);
      if (first) {
        addParticipant(first);
        clearParticipantSearch();
      }
      return;
    }
    if (event.key === "Escape" && search.value) {
      event.preventDefault();
      clearParticipantSearch();
    }
  });
}

/** The form's repeating half, set for whichever session it was opened on (TODO §35.3a).
 *
 * Which evening of a repeating session this is gets said OUT LOUD, because the alternative is a
 * trainer changing next Tuesday and finding out later that every Tuesday moved — or, worse,
 * believing it did when it did not. A one-off says nothing at all.
 *
 * Split out of `openEditSessionControlModal` rather than inlined: that function was already at the
 * complexity gate's limit, and this is a self-contained "put these three controls in the right
 * state" step that says nothing about when the form opens.
 */
function renderRepeatSection(targetSession, t) {
  const scope = document.getElementById("setup-occurrence-scope");
  const note = document.getElementById("setup-occurrence-note");
  const applyToSeries = document.getElementById("setup-apply-to-series");
  const partOfSeries = Boolean(targetSession?.seriesId);

  if (note) note.textContent = partOfSeries ? t("session_one_of_a_series") : "";
  if (scope) scope.hidden = !partOfSeries;
  // Unticked every time the form opens: "change all of them" is a bigger act than the one the
  // trainer came here to do, and a box left ticked from last time would do it silently.
  if (applyToSeries) applyToSeries.checked = false;
  // A repeating slot is authored on the session being CREATED; an existing evening is edited on its
  // own, so the controls start clean every time.
  resetRepeatControls();
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

  renderRepeatSection(targetSession, t);

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

  // After the fields are filled, not at boot: the end field's marks are counted from the start
  // field's value, and at boot there is not one yet. Mounting is idempotent, so each open re-reads
  // the clock and re-labels the controls in the language now in force.
  mountEditSessionTimeFields();

  refreshScheduleConflictNotice();

  const clientsList = state?.clients || [];
  participantRowContext = {
    draft,
    targetSession,
    preselectedClientId,
    preselectedRoutineId,
    isPlanningModeActive,
    state,
    t,
    getClientDisplayNameHTML,
  };
  const onOpen = participantsOnOpen(clientsList, draft, targetSession, preselectedClientId);
  for (const client of onOpen.sort((a, b) => a.name.localeCompare(b.name))) {
    participantsList.appendChild(buildParticipantRow(client, participantRowContext));
  }
  renderParticipantMatches("");
  refreshParticipantSummary();
}
export const openWorkoutSetupModal = openEditSessionControlModal;
