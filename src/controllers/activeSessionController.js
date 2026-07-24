import { renderClientsList } from "../modules/clients/clientsView.js";
import { renderClipboardEditor } from "../modules/clipboard/clipboardEditor.js";
import {
  clearAllTimers,
  restoreSessionTimers,
  startTimer,
  stopTimerIfMatches,
} from "../modules/clipboard/exerciseAndRestTimer.js";
import { renderExerciseDeck } from "../modules/clipboard/exerciseDeck.js";
import {
  renderActiveUsersList,
  updateClientTabsFadeState,
} from "../modules/common/activeUsersList.js";
import { modalityOf, primaryMetricOf } from "../modules/common/exerciseModality.js";
import { openFeedbackModal } from "../modules/common/feedbackModal.js";
import { loadUnitForEquipment } from "../modules/common/repsAndLoad.js";
import {
  clearActiveSessionCache,
  readActiveSessionCache,
  saveActiveSessionToCache as saveActiveSessionToCacheHelper,
} from "../modules/common/sessionCache.js";
import { buildProgramSnapshot, isRestRecord } from "../modules/common/sessionItemRecord.js";
import {
  escapeHTML,
  formatDuration,
  formatSignedDuration,
  generateShortUUID,
  getClientDisplayNameHTML,
  getInitials,
} from "../modules/common/utils.js";
import {
  releaseScreenWakeLock,
  requestScreenWakeLock as requestScreenWakeLockHelper,
} from "../modules/common/wakeLock.js";
import { renderGlobalHistory } from "../modules/history/historyView.js";
import { renderRoutinesList } from "../modules/plans/plansView.js";
import {
  renderActiveSessionBarLabels,
  renderIdleSessionBar,
  updateSessionBarTimer,
} from "../modules/session/sessionBar.js";

let activeSession = null;
let appDeps = {};

function requestScreenWakeLock() {
  return requestScreenWakeLockHelper(getActiveSession);
}

// Inline clipboard edit mode: when on, the deck renders the editable plan list instead of the
// live logging deck. editorCleanup detaches the editor's document listeners on the next render.
let clipboardEditMode = false;
let editorCleanup = null;
// Holds the session title bar's normal content while edit mode repurposes it, so exiting restores it.
let savedSessionTitleHTML = null;

// Temporal mode of the plan currently loaded, used to label edit mode so the trainer always knows
// whether they're reshaping the LIVE session, an UPCOMING one, or a date-less PLANNING program.
function currentPlanMode() {
  const b = activeSession?.booking;
  if (b?.isPlanning) return "planning";
  if (b?.day === "tomorrow" || b?.day === "upcoming") return "future";
  return "live";
}

// ---- Rest as a first-class plan item ----------------------------------------------------------
// The plan (clientState.exercises) is an ordered mix of exercise items and rest items. A rest item
// is { id, type:'rest', rest:<seconds>, circuitId, circuitTitle, circuitSeries } — it carries the
// circuit fields so a rest inside a superset stays grouped with it. Exercise items have no `type`.
export const isRestItem = (it) => !!it && it.type === "rest";

// Legacy plans (routines, recovered/demo sessions) carried rest as a number on the exercise. Turn
// any such `rest>0` into a following rest item. Idempotent: it zeroes the exercise's rest as it
// migrates, so re-running is a no-op. Keeps the focus pointer on the same exercise object.
function ensureRestItems(cs) {
  if (!cs || !Array.isArray(cs.exercises)) return;
  const focused = cs.exercises[cs.activeExerciseIndex];
  let changed = false;
  const out = [];
  for (const it of cs.exercises) {
    out.push(it);
    if (!isRestItem(it) && it.rest > 0) {
      out.push({
        id: `rest-${it.id}`,
        type: "rest",
        rest: it.rest,
        circuitId: it.circuitId || null,
        circuitTitle: it.circuitTitle || "",
        circuitSeries: it.circuitSeries || 1,
      });
      it.rest = 0;
      changed = true;
    }
  }
  if (changed) {
    cs.exercises = out;
    const ai = out.indexOf(focused);
    cs.activeExerciseIndex = ai >= 0 ? ai : 0;
    clampFocusToExercise(cs);
  }
}

// The active-exercise pointer must never land on a rest item (rests aren't focusable/loggable).
// Snap it to the nearest exercise, searching forward first, then backward.
function clampFocusToExercise(cs) {
  if (!cs || !cs.exercises || !cs.exercises.length) return;
  if (!isRestItem(cs.exercises[cs.activeExerciseIndex])) return;
  for (let i = cs.activeExerciseIndex; i < cs.exercises.length; i++) {
    if (!isRestItem(cs.exercises[i])) {
      cs.activeExerciseIndex = i;
      return;
    }
  }
  for (let i = cs.activeExerciseIndex - 1; i >= 0; i--) {
    if (!isRestItem(cs.exercises[i])) {
      cs.activeExerciseIndex = i;
      return;
    }
  }
  cs.activeExerciseIndex = 0;
}

export function enterClipboardEditMode() {
  clipboardEditMode = true;
  renderActiveGroupBoard();
}

export function exitClipboardEditMode() {
  clipboardEditMode = false;
  renderActiveGroupBoard();
}

export function initActiveSessionController(deps) {
  appDeps = { ...appDeps, ...deps };
}

export function getActiveSession() {
  return activeSession;
}

export function setActiveSession(session) {
  activeSession = session;
}

export function focusIndexFromRef(clientState, focusRef) {
  if (!clientState || !clientState.exercises || !focusRef) return -1;
  if (focusRef.type === "superset") {
    return clientState.exercises.findIndex((e) => !isRestItem(e) && e.circuitId === focusRef.id);
  }
  return clientState.exercises.findIndex(
    (e) => !isRestItem(e) && !e.circuitId && e.id === focusRef.id,
  );
}

export function sessionFocusPath() {
  if (!activeSession) return null;
  const clientId = activeSession.activeClientId || activeSession.participants[0];
  const base = `/session/${activeSession.id}/client/${clientId}`;
  // Edit mode is a first-class, deep-linkable state: its URL survives a reload so the trainer lands
  // back in the editor (not the live deck), and the plan edits — persisted on every keystroke — are
  // intact. The client segment names WHOSE plan is open so the right participant is restored.
  if (clipboardEditMode) return `${base}/edit`;
  const cs = activeSession.clientRoutines[clientId];
  const ex = cs?.exercises?.[cs.activeExerciseIndex];
  if (!ex) return base;
  return ex.circuitId ? `${base}/superset/${ex.circuitId}` : `${base}/exercise/${ex.id}`;
}

// Set the edit-mode flag WITHOUT re-rendering — for the router restoring edit mode from an `/edit`
// deep link, where the caller (showSessionView) already renders the board once afterwards. Use
// enter/exitClipboardEditMode for in-app toggles that must render immediately.
export function setClipboardEditMode(on) {
  clipboardEditMode = !!on;
}

export function syncSessionFocusUrl() {
  if (!activeSession) return;
  const { toRoute, toUrl } = appDeps;
  if (!toRoute || !toUrl) return;
  const current = toRoute(window.location.pathname);
  if (
    !current.startsWith("/session/") ||
    current.startsWith("/session/new") ||
    current.startsWith("/session/setup/")
  )
    return;
  const target = sessionFocusPath();
  if (target && current !== target) {
    window.history.replaceState(null, "", toUrl(target));
  }
}

export function focusExerciseByIndex(index) {
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  cs.activeExerciseIndex = index;
  activeSession.expandedPastId = null;
  saveActiveSessionToCache();
  renderActiveGroupBoard();
}

export function openSessionFromHistory(log) {
  const { state, t, navigateToPath } = appDeps;
  if (!state || !t) return;
  clearAllTimers(); // fresh session — never inherit a previous session's timers

  const clientState = {
    routineId: log.routineId || "",
    routineName: log.routineName,
    activeExerciseIndex: 0,
    exercises: [],
    logs: {},
  };

  // Rebuild the live plan from the stored snapshot, restoring rests and superset grouping — not just
  // the performed exercises (TODO §17.1). A record item is either a first-class rest or an exercise.
  for (const item of log.exercises) {
    if (isRestRecord(item)) {
      clientState.exercises.push({
        id: generateShortUUID(),
        type: "rest",
        rest: item.rest || 0,
        circuitId: item.circuitId || null,
        circuitTitle: item.circuitTitle || "",
        circuitSeries: item.circuitSeries || 1,
      });
      continue;
    }

    const ex = state.exercises.find((e) => e.id === item.id || e.name === item.name);
    const sets = Array.isArray(item.sets) ? item.sets : [];
    clientState.exercises.push({
      id: item.id,
      name: item.name,
      category: ex ? ex.category : "Recovery",
      pattern: ex ? ex.pattern : "",
      instructions: ex ? ex.instructions : "",
      setsTargetCount: sets.length || 1,
      repsTarget: sets[0]?.reps || 0,
      weightTarget: sets[0]?.weight || 0,
      // Prefer the snapshot's own logging axes (so an anonymized/renamed movement still logs right),
      // falling back to the catalog entry for legacy rows that never stored them.
      loadUnit: item.loadUnit || loadUnitForEquipment(ex?.equipment),
      modality: item.modality || modalityOf(ex),
      metric: item.metric || primaryMetricOf(ex),
      circuitId: item.circuitId || null,
      circuitTitle: item.circuitTitle || "",
      circuitSeries: item.circuitSeries || 1,
    });

    clientState.logs[item.id] = sets.map((s) => ({
      reps: s.reps,
      weight: s.weight,
      completed: s.completed,
      note: s.note || "",
    }));
  }

  activeSession = {
    id: log.id,
    startTime: new Date(log.date).getTime(),
    duration: log.duration || 0,
    participants: [log.clientId],
    clientRoutines: {
      [log.clientId]: clientState,
    },
    activeClientId: log.clientId,
    feedback: log.feedback || [],
    booking: log.isPlanning
      ? {
          id: `plan-${log.id}`,
          isPlanning: true,
          titles: [t("planned_program") || "Planned Program"],
          timeLabel: t("date_unknown") || "Date Unknown",
          location: "",
        }
      : null,
  };

  if (log.isPlanning) {
    clipboardEditMode = true;
  } else {
    clipboardEditMode = false;
  }

  saveActiveSessionToCache();
  requestScreenWakeLock();

  const bar = document.getElementById("active-session-bar");
  if (bar) {
    bar.classList.remove("hidden", "is-idle");
    delete bar.dataset.nextBookingId;
  }
  renderActiveSessionBarLabels();
  startSessionTimer();

  if (navigateToPath) {
    navigateToPath(`/session/${log.id}/client/${log.clientId}`);
  }
}

export function startWorkoutSession(clientRoutines, bookingMeta = null, deps = {}) {
  if (deps) appDeps = { ...appDeps, ...deps };
  const { state, navigateToPath, t } = appDeps;
  if (!state) return;
  clearAllTimers(); // fresh session — never inherit a previous session's timers

  const participantIds = clientRoutines.map((cr) => cr.clientId);
  const sessionId = bookingMeta ? bookingMeta.id : generateShortUUID();

  activeSession = {
    id: sessionId,
    startTime: Date.now(),
    duration: 0,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    booking: bookingMeta,
  };

  for (const cr of clientRoutines) {
    const routine = state.routines.find((r) => r.id === cr.routineId);
    const clientState = {
      routineId: routine ? routine.id : "",
      routineName: routine ? routine.name : t("custom_empty_plan") || "Custom / Empty Plan",
      activeExerciseIndex: 0,
      exercises: [],
      logs: {},
    };

    if (routine) {
      for (const item of routine.exercises) {
        const ex = state.exercises.find((e) => e.id === item.id);
        if (ex) {
          clientState.exercises.push({
            id: item.id,
            name: ex.name,
            category: ex.category,
            pattern: ex.pattern,
            instructions: ex.instructions,
            setsTargetCount: item.sets,
            repsTarget: item.reps,
            weightTarget: item.weight,
            loadUnit: loadUnitForEquipment(ex.equipment),
            modality: modalityOf(ex),
            metric: primaryMetricOf(ex),
            rest: item.rest,
            circuitId: item.circuitId || null,
            circuitTitle: item.circuitTitle || "",
            circuitSeries: item.circuitSeries || 1,
          });

          clientState.logs[item.id] = Array.from({ length: item.sets }, () => ({
            reps: item.reps,
            weight: item.weight,
            completed: false,
            note: "",
          }));
        }
      }
    }

    activeSession.clientRoutines[cr.clientId] = clientState;
  }

  if (bookingMeta?.isPlanning) {
    clipboardEditMode = true;
  } else {
    clipboardEditMode = false;
  }

  saveActiveSessionToCache();
  requestScreenWakeLock();

  const sId = activeSession.id || generateShortUUID();
  if (navigateToPath) {
    navigateToPath(`/session/${sId}/client/${activeSession.activeClientId}`);
  }
}

export function startSessionTimer() {
  if (!activeSession) return;
  if (activeSession.timerIntervalId) clearInterval(activeSession.timerIntervalId);

  const tick = () => {
    if (!activeSession) return;
    if (activeSession.booking?.isPlanning) {
      updateOverlaySessionTimer();
      updateSessionBarTimer();
      return;
    }
    activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
    updateOverlaySessionTimer();
    updateSessionBarTimer();
    saveActiveSessionToCache();
  };

  activeSession.timerIntervalId = setInterval(tick, 1000);
  tick();
}

export function updateOverlaySessionTimer() {
  if (!activeSession) return;
  const el = document.getElementById("overlay-session-duration");
  if (!el) return;

  const { t } = appDeps;

  if (activeSession.booking?.isPlanning) {
    el.textContent = t("planning") || "Planning";
    el.style.color = "var(--primary)";
    return;
  }

  const endDate = activeSession.booking?.endDate;
  if (endDate) {
    const remainingSec = Math.round((new Date(endDate).getTime() - Date.now()) / 1000);
    el.textContent = formatSignedDuration(remainingSec);
    el.style.color = remainingSec < 0 ? "var(--danger)" : "var(--primary)";
  } else {
    el.textContent = formatDuration(activeSession.duration);
    el.style.color = "var(--primary)";
  }
}

export function getActiveExercise() {
  if (!activeSession) return null;
  const activeClientId = activeSession.activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];
  if (!activeClientState || activeClientState.exercises.length === 0) return null;
  return activeClientState.exercises[activeClientState.activeExerciseIndex];
}

export function logQuickSignal(tag, exId) {
  if (!activeSession) return;
  const { state, saveToLocalStorage, renderPendingPlanAdjustments } = appDeps;
  if (!state) return;

  const clientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[clientId];
  if (!clientState || clientState.exercises.length === 0) return;

  const curEx =
    (exId && clientState.exercises.find((e) => e.id === exId)) ||
    clientState.exercises[clientState.activeExerciseIndex];
  const client = state.clients.find((c) => c.id === clientId);

  const newFeedback = {
    id: generateShortUUID(),
    clientId,
    clientName: client ? client.name : "Unknown Client",
    date: new Date().toISOString(),
    exerciseName: curEx.name,
    tag,
    hasVoiceNote: false,
    resolved: false,
  };
  state.planUpdates.push(newFeedback);

  if (!activeSession.feedback) activeSession.feedback = [];
  activeSession.feedback.push({
    id: newFeedback.id,
    clientId,
    exerciseName: curEx.name,
    tag,
    note: "",
    hasVoiceNote: false,
  });

  for (const l of clientState.logs[curEx.id] || []) {
    l.completed = true;
  }

  saveActiveSessionToCache();
  if (saveToLocalStorage) saveToLocalStorage();
  if (renderPendingPlanAdjustments) renderPendingPlanAdjustments();
  renderActiveGroupBoard();
}

export function getExerciseSignalColor(clientId, exerciseName) {
  const fb = (activeSession?.feedback || []).filter(
    (f) => f.clientId === clientId && f.exerciseName === exerciseName,
  );
  if (fb.length === 0) return null;
  if (fb.some((f) => f.note?.trim() || f.hasVoiceNote)) return "var(--danger)";
  if (fb.some((f) => /too hard|reduce load/i.test(f.tag))) return "#f59e0b";
  if (fb.some((f) => /too easy|increase load/i.test(f.tag))) return "var(--success)";
  return "var(--danger)";
}

export function buildSupersetUnits(list) {
  const units = [];
  for (const item of list) {
    if (item.circuitId) {
      const last = units[units.length - 1];
      if (last && last.type === "circuit" && last.circuitId === item.circuitId) {
        last.items.push(item);
        last.isInFocus = last.isInFocus || item.isInFocus;
        last.isCompleted = last.isCompleted && item.isCompleted;
      } else {
        units.push({
          type: "circuit",
          circuitId: item.circuitId,
          title: item.circuitTitle,
          series: item.circuitSeries || 1,
          items: [item],
          isInFocus: item.isInFocus,
          isCompleted: item.isCompleted,
        });
      }
    } else {
      units.push(item);
    }
  }
  return units;
}

export function completeSupersetRound(circuitId) {
  if (!activeSession) return;
  const { saveToLocalStorage } = appDeps;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  if (!cs.circuitRounds) cs.circuitRounds = {};
  const groupExs = cs.exercises.filter((e) => e.circuitId === circuitId && !isRestItem(e));
  if (groupExs.length === 0) return;
  const series = groupExs[0].circuitSeries || 1;
  const cur = cs.circuitRounds[circuitId] || 1;
  if (cur < series) {
    cs.circuitRounds[circuitId] = cur + 1;
  } else {
    for (const ex of groupExs) {
      for (const l of cs.logs[ex.id] || []) {
        l.completed = true;
      }
    }
    // End of the circuit block includes any trailing rest items; land focus on the next exercise.
    let lastIdx = -1;
    {
      let idx = 0;
      for (const it of cs.exercises) {
        if (it.circuitId === circuitId) lastIdx = idx;
        idx++;
      }
    }
    let next = lastIdx + 1;
    while (next < cs.exercises.length && isRestItem(cs.exercises[next])) next++;
    cs.activeExerciseIndex = Math.min(next, cs.exercises.length - 1);
    clampFocusToExercise(cs);
    // The block is fully done — a rest/exercise timer still running against it is now stale.
    // Freeze it rather than silently dropping it: the trainer sees it held at its final value
    // and clears it themselves with ✕.
    stopTimerIfMatches(activeSession.activeClientId, { type: "superset", id: circuitId });
  }
  saveActiveSessionToCache();
  if (saveToLocalStorage) saveToLocalStorage();
  renderActiveGroupBoard();
}

// Start a timer for the ACTIVE client (rest or exercise), labelled with their name so it's clear in
// the stacked, multi-client timer overlay. Deck cards call this with just seconds + type + label.
function startClientTimer(seconds, type = "rest", label = "") {
  if (!activeSession) return;
  const clientId = activeSession.activeClientId;
  const client = appDeps.state?.clients?.find((c) => c.id === clientId);
  const cs = activeSession.clientRoutines[clientId];
  const ex = cs?.exercises?.[cs.activeExerciseIndex];
  const focusRef = ex
    ? ex.circuitId
      ? { type: "superset", id: ex.circuitId }
      : { type: "exercise", id: ex.id }
    : null;
  startTimer({
    clientId,
    clientName: client ? client.name : "",
    type,
    label,
    seconds,
    sessionId: activeSession.id,
    focusRef,
  });
}

// Opens the existing "add exercise to session" dialog (also used by the in-clipboard editor).
function openAddSessionExerciseDialog() {
  const modal = document.getElementById("dialog-add-session-exercise");
  const form = document.getElementById("form-add-session-exercise");
  if (!modal || !form) return;
  form.reset();
  modal.showModal();
}

export function renderActiveGroupBoard() {
  if (!activeSession) return;
  const { state, t, navigateToPath } = appDeps;
  if (!state || !t) return;

  const activeClientId = activeSession.activeClientId || activeSession.participants[0];
  activeSession.activeClientId = activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];

  // Rest is a first-class plan item: migrate any legacy exercise-level rest and keep focus off rests.
  ensureRestItems(activeClientState);
  clampFocusToExercise(activeClientState);

  syncSessionFocusUrl();

  const tabsContainer = document.getElementById("active-session-client-tabs");
  if (tabsContainer) {
    renderActiveUsersList(tabsContainer, activeSession, {
      clients: state.clients,
      activeClientId,
      getInitials,
      getClientDisplayNameHTML,
      navigateToPath,
    });
  }

  const alertBanner = document.getElementById("clipboard-client-alert");
  const alertText = document.getElementById("clipboard-client-notes-text");
  const activeClient = state.clients.find((c) => c.id === activeClientId);
  if (alertBanner && activeClient) {
    if (activeClient.hasInjury && (activeClient.injury || activeClient.notes)) {
      alertText.textContent = activeClient.injury || activeClient.notes;
      alertBanner.classList.remove("hidden");
    } else {
      alertBanner.classList.add("hidden");
    }
  }

  // Client focus panel (goals + notes): only shown while editing the plan (CSS-gated by
  // .editing-plan), so it's cheap to keep populated on every render.
  if (activeClient) {
    const goalsLabel = document.getElementById("client-focus-goals-label");
    const notesLabel = document.getElementById("client-focus-notes-label");
    const goalsEl = document.getElementById("client-focus-goals");
    const notesEl = document.getElementById("client-focus-notes");
    if (goalsLabel) goalsLabel.textContent = t("goals") || "Training Goals";
    if (notesLabel) notesLabel.textContent = t("notes_injuries") || "Notes";
    if (goalsEl) goalsEl.textContent = activeClient.goals || t("no_goals_specified") || "";
    if (notesEl) notesEl.textContent = activeClient.notes || t("no_notes_specified") || "";
  }

  // Repurpose the session title bar for edit mode: show WHICH client's plan is open and its temporal
  // mode (Live / Upcoming / Planning). Restored verbatim on exit from the saved snapshot.
  const titleEl = document.getElementById("session-title-text");
  const overlay = document.getElementById("active-session-overlay");
  if (titleEl && overlay) {
    if (clipboardEditMode) {
      if (savedSessionTitleHTML === null) savedSessionTitleHTML = titleEl.innerHTML;
      const mode = currentPlanMode();
      const b = activeSession.booking;
      // Concrete schedule beats a vague "Live": show the day + time of the booked session, or
      // "Unscheduled" for a date-less planning program. The chip's colour still encodes urgency.
      let chipLabel;
      if (mode === "planning") {
        chipLabel = t("unscheduled") || "Unscheduled";
      } else {
        const parts = [b?.day ? t(b.day) || b.day : "", b?.timeLabel || ""].filter(Boolean);
        chipLabel = parts.join(" · ") || t("live") || "Live";
      }
      const clientNm = activeClient ? escapeHTML(activeClient.name) : "";
      // The ✎ icon rides up here as the mode indicator (the editor body no longer has its own header).
      titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> ${escapeHTML(t("editing") || "Editing")}${
        clientNm ? ` · <strong>${clientNm}</strong>` : ""
      } <span class="edit-mode-chip ${mode}">${escapeHTML(chipLabel)}</span>`;
      overlay.classList.add("editing-plan");
    } else {
      if (savedSessionTitleHTML !== null) {
        titleEl.innerHTML = savedSessionTitleHTML;
        savedSessionTitleHTML = null;
      }
      overlay.classList.remove("editing-plan");
    }
    // The ✎ trigger is redundant while editing (the ✎ mode icon now rides on the title, and Done
    // exits), and leaving it live would race the tap-outside handler; hide it during edit mode and
    // surface the title-bar Done button in its place.
    document.getElementById("btn-edit-plan")?.classList.toggle("hidden", clipboardEditMode);
    document.getElementById("btn-done-edit")?.classList.toggle("hidden", !clipboardEditMode);

    // In edit mode the ⋯ menu's destructive action targets the PLAN (clear its exercises), not the
    // whole session — relabel it so the trainer knows which one they're deleting. Preserve the icon.
    const delBtn = document.getElementById("btn-delete-session");
    if (delBtn) {
      const label = clipboardEditMode
        ? t("btn_delete_plan") || "Delete Plan"
        : t("btn_delete_session") || "Delete Session";
      const icon = delBtn.querySelector("i");
      delBtn.innerHTML = "";
      if (icon) delBtn.appendChild(icon);
      delBtn.appendChild(document.createTextNode(` ${label}`));
    }
  }

  // Detach any previous editor's document listeners before this render replaces the deck DOM.
  if (editorCleanup) {
    editorCleanup();
    editorCleanup = null;
  }

  const deckContainer = document.getElementById("active-exercise-scroll-deck");
  if (deckContainer && activeClientState && clipboardEditMode) {
    const persist = () => {
      saveActiveSessionToCache();
      if (appDeps.saveToLocalStorage) appDeps.saveToLocalStorage();
    };
    const editClient = state.clients.find((c) => c.id === activeClientId);
    editorCleanup = renderClipboardEditor(deckContainer, {
      activeClientState,
      clientName: editClient ? editClient.name : "",
      allExerciseNames: (state.exercises || []).map((e) => e.name),
      t,
      escapeHTML,
      save: persist,
      rerender: renderActiveGroupBoard,
      openAddExercise: openAddSessionExerciseDialog,
      exit: exitClipboardEditMode,
      genId: generateShortUUID,
    });
  } else if (deckContainer && activeClientState) {
    renderExerciseDeck(deckContainer, {
      activeSession,
      activeClientState,
      activeClientId,
      state,
      t,
      escapeHTML,
      buildSupersetUnits,
      getExerciseSignalColor,
      logQuickSignal,
      openFeedbackModal,
      completeSupersetRound,
      focusExerciseByIndex,
      saveActiveSessionToCache,
      saveToLocalStorage: appDeps.saveToLocalStorage,
      onRerender: renderActiveGroupBoard,
      startRestTimer: startClientTimer,
      enterEditMode: enterClipboardEditMode,
    });
  }

  const container = document.getElementById("clipboard-logger-container");
  if (!container) return;

  if (!activeClientState || activeClientState.exercises.length === 0) {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="clipboard-empty-state">
        <h4>${t("no_exercises_injected")}</h4>
        <p>${t("no_exercises_desc")}</p>
      </div>
    `;
    return;
  }

  container.classList.add("hidden");
  container.innerHTML = "";
}

export function setupActiveSession(deps) {
  if (deps) appDeps = { ...appDeps, ...deps };
  const { state, t, navigateToPath, focusSessionsColumn, launchClipboardDirectly } = appDeps;

  const clientTabsBar = document.getElementById("active-session-client-tabs");
  if (clientTabsBar) {
    clientTabsBar.addEventListener("scroll", updateClientTabsFadeState);
  }

  // Leaving the clipboard is handled globally by the title-bar grab handle + swipe-down gesture
  // (setupViewDismiss in app.js), shared with every other view; and the app-name logo also goes home.

  const btnExpandSession = document.getElementById("btn-expand-session");
  if (btnExpandSession) {
    btnExpandSession.addEventListener("click", (e) => {
      e.stopPropagation();
      const activeClientId = activeSession
        ? activeSession.activeClientId || activeSession.participants[0]
        : "";
      const sessionId = activeSession ? activeSession.id || "session" : "session";
      if (navigateToPath) navigateToPath(`/session/${sessionId}/client/${activeClientId}`);
    });
  }

  const sessionBar = document.getElementById("active-session-bar");
  if (sessionBar) {
    sessionBar.addEventListener("click", () => {
      if (activeSession) {
        const activeClientId = activeSession.activeClientId || activeSession.participants[0];
        const sessionId = activeSession.id || "session";
        if (navigateToPath) navigateToPath(`/session/${sessionId}/client/${activeClientId}`);
      } else if (sessionBar.dataset.nextBookingId && launchClipboardDirectly) {
        launchClipboardDirectly(sessionBar.dataset.nextBookingId);
      }
    });
    sessionBar.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        sessionBar.click();
      }
    });
  }

  const sessionMenuBtn = document.getElementById("btn-session-menu");
  const sessionMenu = document.getElementById("session-menu");
  const closeSessionMenu = () => {
    if (sessionMenu) sessionMenu.classList.add("hidden");
    if (sessionMenuBtn) sessionMenuBtn.setAttribute("aria-expanded", "false");
  };
  if (sessionMenuBtn && sessionMenu) {
    sessionMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !sessionMenu.classList.contains("hidden");
      sessionMenu.classList.toggle("hidden", isOpen);
      sessionMenuBtn.setAttribute("aria-expanded", String(!isOpen));
    });
    document.addEventListener("click", (e) => {
      if (!sessionMenu.classList.contains("hidden") && !e.target.closest(".session-menu-wrap")) {
        closeSessionMenu();
      }
    });
  }

  const btnEditPlan = document.getElementById("btn-edit-plan");
  if (btnEditPlan) {
    btnEditPlan.addEventListener("click", (e) => {
      e.stopPropagation();
      enterClipboardEditMode();
    });
  }

  const btnDeleteSession = document.getElementById("btn-delete-session");
  if (btnDeleteSession) {
    btnDeleteSession.addEventListener("click", () => {
      closeSessionMenu();
      // While editing, this button deletes the PLAN (clears its exercises) and stays in the session;
      // otherwise it cancels the whole session. The label is swapped to match in renderActiveGroupBoard.
      if (clipboardEditMode) {
        if (confirm(t("confirm_delete_plan"))) {
          clearActivePlan();
        }
      } else if (confirm(t("confirm_cancel"))) {
        cancelWorkoutSession();
      }
    });
  }

  const btnFinishSession = document.getElementById("btn-finish-session");
  if (btnFinishSession) {
    btnFinishSession.addEventListener("click", () => {
      finishWorkoutSession();
    });
  }

  const addExModal = document.getElementById("dialog-add-session-exercise");
  const addExForm = document.getElementById("form-add-session-exercise");

  if (addExModal && addExForm) {
    const btnAddExToSession = document.getElementById("btn-add-exercise-to-session");
    if (btnAddExToSession) {
      btnAddExToSession.addEventListener("click", () => {
        addExForm.reset();
        addExModal.showModal();
      });
    }

    const cancelBtn = addExModal.querySelector(".modal-cancel");
    const closeBtn = addExModal.querySelector(".modal-close-btn");
    if (cancelBtn) cancelBtn.addEventListener("click", () => addExModal.close());
    if (closeBtn) closeBtn.addEventListener("click", () => addExModal.close());

    addExForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const typed = document.getElementById("session-add-select-ex").value.trim();
      const sets = parseInt(document.getElementById("session-add-sets").value);
      const reps = parseInt(document.getElementById("session-add-reps").value);
      const weight = parseFloat(document.getElementById("session-add-weight").value);
      const rest = parseInt(document.getElementById("session-add-rest").value);

      if (!activeSession || !typed || isNaN(sets)) return;

      let baseEx = state.exercises.find((ex) => ex.name.toLowerCase() === typed.toLowerCase());
      if (!baseEx) {
        baseEx = { id: generateShortUUID(), name: typed, category: "Custom", instructions: "" };
      }
      const exId = baseEx.id;

      const activeClientId = activeSession.activeClientId;
      const clientState = activeSession.clientRoutines[activeClientId];

      const newEx = {
        id: exId,
        name: baseEx.name,
        category: baseEx.category,
        pattern: baseEx.pattern || "",
        instructions: baseEx.instructions,
        loadUnit: loadUnitForEquipment(baseEx.equipment),
        modality: modalityOf(baseEx),
        metric: primaryMetricOf(baseEx),
        setsTargetCount: sets,
        repsTarget: reps,
        weightTarget: weight,
        rest: rest,
      };

      clientState.exercises.push(newEx);

      clientState.logs[exId] = Array.from({ length: sets }, () => ({
        reps: reps,
        weight: weight,
        completed: false,
        note: "",
      }));

      clientState.activeExerciseIndex = clientState.exercises.length - 1;

      saveActiveSessionToCache();
      renderActiveGroupBoard();
      addExModal.close();
    });
  }
}

// Edit-mode "Delete Plan": empty the active client's plan (exercises + their logs + circuit rounds)
// so the trainer can rebuild from scratch, keeping the session itself open and still in edit mode.
export function clearActivePlan() {
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  cs.exercises = [];
  cs.logs = {};
  cs.circuitRounds = {};
  cs.activeExerciseIndex = 0;
  saveActiveSessionToCache();
  if (appDeps.saveToLocalStorage) appDeps.saveToLocalStorage();
  renderActiveGroupBoard();
}

export function cancelWorkoutSession() {
  const { navigateToPath, focusSessionsColumn } = appDeps;
  if (activeSession?.timerIntervalId) {
    clearInterval(activeSession.timerIntervalId);
  }
  releaseScreenWakeLock();
  activeSession = null;
  clipboardEditMode = false;
  clearActiveSessionCache();
  clearAllTimers(); // timers are session-scoped

  renderIdleSessionBar();

  if (navigateToPath) navigateToPath("/");
  if (focusSessionsColumn) focusSessionsColumn("today", "smooth");
}

export function finishWorkoutSession() {
  if (!activeSession) return;
  const { state, t, saveToLocalStorage, navigateToPath } = appDeps;
  if (!state || !t) return;

  // Confirm only when finishing meaningfully early — more than 10 minutes still on the
  // countdown. Near the scheduled end or in overrun (<=10 min or negative), complete silently.
  const endDate = activeSession.booking?.endDate;
  if (endDate && !activeSession.booking?.isPlanning) {
    const remainingMin = (new Date(endDate).getTime() - Date.now()) / 60000;
    if (remainingMin > 10) {
      const msg = t("confirm_finish_early").replace("{min}", String(Math.round(remainingMin)));
      if (!confirm(msg)) return;
    }
  }

  let totalSets = 0;
  let completedSets = 0;

  for (const pId of activeSession.participants) {
    const clientState = activeSession.clientRoutines[pId];
    if (clientState) {
      for (const exId in clientState.logs) {
        for (const log of clientState.logs[exId]) {
          totalSets++;
          if (log.completed) completedSets++;
        }
      }
    }
  }

  if (completedSets === 0 && !activeSession.booking?.isPlanning) {
    if (!confirm(t("alert_no_sets"))) {
      return;
    }
  }

  const sessionDateISO = new Date(activeSession.startTime).toISOString();
  const sessionDuration = activeSession.duration;

  // Stamp completion + elapsed time onto the booking(s) this session launched from, so the
  // dashboard's past-session status line (2.3) has something to show — previously finishing a
  // session never touched state.bookings at all, only state.history.
  const sb = activeSession.booking;
  const sessions = Array.isArray(state.sessions)
    ? state.sessions
    : Array.isArray(state.bookings)
      ? state.bookings
      : [];
  if (sb && !sb.isPlanning) {
    for (const booking of sessions) {
      if (booking.id === sb.id || (Array.isArray(sb.ids) && sb.ids.includes(booking.id))) {
        booking.completed = true;
        booking.duration = sessionDuration;
      }
    }
  }

  for (const pId of activeSession.participants) {
    const client = state.clients.find((c) => c.id === pId);
    const clientState = activeSession.clientRoutines[pId];
    if (!client || !clientState) continue;

    const isPlanning = !!activeSession.booking?.isPlanning;
    // Persist the WHOLE program as an immutable snapshot (rests, superset grouping, and prescribed-
    // but-skipped exercises included) rather than flattening to performed sets only (TODO §17.1).
    const clientProgram = buildProgramSnapshot(clientState, { isPlanning });
    const anyCompleted = clientProgram.some((it) => it.type === "exercise" && it.completed);

    // Log a record when the client performed something (skipped work is kept alongside it), or
    // always for a planning template. A session where nothing was done writes no history.
    if (anyCompleted || isPlanning) {
      const clientLog = {
        id: generateShortUUID(),
        clientId: pId,
        clientName: client.name,
        routineName: clientState.routineName,
        date: sessionDateISO,
        duration: sessionDuration,
        exercises: clientProgram,
        feedback: (activeSession.feedback || []).filter((f) => f.clientId === pId),
      };
      if (isPlanning) {
        clientLog.isPlanning = true;
      }

      state.history.push(clientLog);
    }
  }

  if (saveToLocalStorage) saveToLocalStorage();

  cancelWorkoutSession();

  renderClientsList({ state, t });
  renderRoutinesList({ state, t });
  renderGlobalHistory({ state, t });

  if (navigateToPath) navigateToPath("/history");
}

export function saveActiveSessionToCache() {
  saveActiveSessionToCacheHelper(activeSession);
}

export function recoverActiveSession() {
  const parsed = readActiveSessionCache();
  if (!parsed) return;

  try {
    activeSession = parsed;
    activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);

    if (activeSession.booking) {
      activeSession.booking.startDate = new Date(activeSession.booking.startDate);
      activeSession.booking.endDate = new Date(activeSession.booking.endDate);
    }

    const STALE_AFTER_MS = 2 * 60 * 60 * 1000;
    const endTime = activeSession.booking?.endDate ? activeSession.booking.endDate.getTime() : null;
    if (endTime && Date.now() > endTime + STALE_AFTER_MS) {
      activeSession = null;
      clearActiveSessionCache();
      renderIdleSessionBar();
      return;
    }

    if (activeSession.booking?.isPlanning) {
      clipboardEditMode = true;
    }
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path.includes(`/session/${activeSession.id}/`) && path.endsWith("/edit")) {
      clipboardEditMode = true;
    }

    const bar = document.getElementById("active-session-bar");
    if (bar) {
      bar.classList.remove("hidden", "is-idle");
      delete bar.dataset.nextBookingId;
    }
    renderActiveSessionBarLabels();

    startSessionTimer();
    renderActiveGroupBoard();
    restoreSessionTimers();
    requestScreenWakeLock();
  } catch (e) {
    console.error("Error recovering active session cache:", e);
  }
}
