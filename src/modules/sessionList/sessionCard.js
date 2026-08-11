// src/modules/sessionList/sessionCard.js
// Renders one session card for the dashboard day columns (the tappable card that
// launches the clipboard). Dependencies are injected by the caller (renderSessions in app.js)
// so this component stays decoupled from app.js internals and is easy to relocate/test.
//
// deps: { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal,
//         activeId, saveToLocalStorage, rerenderSessions }

import { computeActiveSessionCountdown } from "../../domain/sessionClock.js";
import {
  formatDurationHM,
  formatDurationHourMin,
  parseDurationHM,
  parseTimeRange,
} from "../common/utils.js";
import { getSessionDayDate } from "./sessionTimeline.js";

// A single interval ticks every clock-driven status line that isn't the launched clipboard's own
// timer (which ticks via sessionBar): an in-progress-by-clock session counting down to its
// scheduled end, or an upcoming session counting down to its scheduled start. Each such element
// carries data-end (epoch ms of the target moment); the ticker updates the text and, for the
// countdown-to-end case only (data-overtime-aware="1"), flips the "overtime" warning past zero.
// The clipboard is crowded with a full day's sessions — every card starts collapsed to its
// essentials (time, title, status bar) and expands on tap of its own chevron to reveal
// participants/program/warnings. Ephemeral (module-level, not persisted): resets on reload, which
// matches "start collapsed" — there's no stale "I left this one open" state to restore wrong.
const expandedCardIds = new Set();

let cardTicker = null;
function ensureCardTicker() {
  if (cardTicker) return;
  cardTicker = setInterval(() => {
    for (const el of document.querySelectorAll(".session-live-timer[data-end]")) {
      const remSec = Math.round((parseInt(el.dataset.end, 10) - Date.now()) / 1000);
      // Same unsigned rule as the initial paint, or the value would sprout a minus sign the moment
      // a card ticked past its scheduled start while the trainer was looking at it.
      el.textContent = formatDurationHourMin(el.dataset.overtimeAware ? Math.abs(remSec) : remSec);
      if (el.dataset.overtimeAware) {
        const over = remSec < 0;
        el.classList.toggle("overtime", over);
        const bar = el.closest(".session-live-bar");
        if (bar) bar.classList.toggle("overtime", over);
      }
    }
  }, 1000);
}

// Turn a past session's elapsed-time chip into an inline "HH:MM" edit field on click/Enter — commits
// on blur/Enter (parsed via parseDurationHM), discards on Escape. Persists onto the session object
// itself (b.duration, seconds) since that's the only place a finished ad-hoc/seed session's actual
// elapsed time is recorded (state.history logs a duration per client, not per session).
function wireElapsedEdit(valueEl, b, deps) {
  const startEdit = (e) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.className = "session-status-edit-input";
    input.value = formatDurationHM(b.duration ?? 0);
    input.addEventListener("click", (ev) => ev.stopPropagation());
    let cancelled = false;
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        input.blur();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        cancelled = true;
        input.blur();
      }
    });
    input.addEventListener("blur", () => {
      if (!cancelled) {
        const parsed = parseDurationHM(input.value);
        if (parsed != null) {
          b.duration = parsed;
          if (deps.saveToLocalStorage) deps.saveToLocalStorage();
        }
      }
      if (deps.rerenderSessions) deps.rerenderSessions();
    });
    valueEl.replaceWith(input);
    input.focus();
    input.select();
  };
  valueEl.setAttribute("tabindex", "0");
  valueEl.setAttribute("role", "button");
  valueEl.addEventListener("click", startEdit);
  valueEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startEdit(e);
    }
  });
}

// A card is marked "Active session" only once the trainer has explicitly started it (matched by
// the launched clipboard's source session id(s) AND activeSession.started) — reaching the
// scheduled time by wall-clock alone is NOT enough. Every applicable card is marked, so
// overlapping sessions all show as ongoing.
function computeIsLaunched(b, activeSession, activeId) {
  if (b.completed || !activeSession || !activeSession.started) return false;
  if (activeId && b.id === activeId) return true;
  if (activeSession.id === b.id) return true;
  const ss = activeSession.sourceSession;
  if (ss && ss.id === b.id) return true;
  return !!(ss && Array.isArray(ss.ids) && ss.ids.includes(b.id));
}

// Readiness warnings — a session needs both a program and at least one participant.
function buildReadinessWarningsHTML(routineName, clientCount, t) {
  const pill = (label) => `
    <div class="session-warning-pill" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${label}</span>
    </div>`;
  const warnings = [];
  if (!routineName) warnings.push(pill(t("program_not_defined")));
  if (clientCount === 0) warnings.push(pill(t("no_members_assigned")));
  return warnings.length
    ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">${warnings.join("")}</div>`
    : "";
}

// Every clock-driven field a card can show: a past session's recorded/derived elapsed time, an
// upcoming session's scheduled-start countdown, or the launched clipboard's own live timer —
// mutually exclusive, mirrored in buildSessionCardStatusBarHTML below.
function computeCardTiming(b, isLaunched, activeSession, isLive, range) {
  const pastElapsedSeconds = b.completed
    ? typeof b.duration === "number"
      ? b.duration
      : range
        ? (range.end - range.start) * 60
        : null
    : null;

  // `startDate` FIRST: it is the session's own absolute timestamp, and the only field that stays
  // correct when the day rolls over. getSessionDayDate re-derives a date from the coarse `day`
  // bucket "as of right now" — a necessary fallback for records predating `startDate`, but wrong to
  // prefer, because a stale bucket then silently moves a session that already knows its real date.
  //
  // Not gated on being in the future: starting a session is a clipboard-title-bar action, not a
  // card action, so the card still has something to say once the scheduled start passes — but it
  // says OVERDUE rather than counting down through zero into negative hours.
  const scheduledStartMs = b.startDate ? new Date(b.startDate).getTime() : null;
  const startMs =
    !b.completed && !isLive && (scheduledStartMs != null || range)
      ? (scheduledStartMs ?? getSessionDayDate(b.day).getTime() + range.start * 60000)
      : null;
  const isUpcoming = startMs != null;

  let timerText = "";
  let timerIsOvertime = false;
  let timerLive = false; // driven by the launched clipboard timer
  let timerEndMs = null; // scheduled end/start (epoch) for the clock-based countdown, whichever applies
  let timerOvertimeAware = false;
  if (isLaunched && activeSession) {
    timerLive = true;
    // Same countdown/count-up decision the clipboard's own timers make (sessionClock.js), so a
    // card and the clipboard it launches never show two different readings of one session.
    const countdown = computeActiveSessionCountdown(activeSession);
    timerText = formatDurationHourMin(countdown.seconds);
    timerIsOvertime = countdown.isOvertime;
  } else if (isUpcoming) {
    timerEndMs = startMs;
    timerOvertimeAware = true;
    const remSec = Math.round((startMs - Date.now()) / 1000);
    // Unsigned: the bar's label says whether the time is still to come or already gone, so a minus
    // sign in the value states it a second time and reads as "Starts in -06h 00m".
    timerText = formatDurationHourMin(Math.abs(remSec));
    timerIsOvertime = remSec < 0;
  }

  return {
    pastElapsedSeconds,
    isUpcoming,
    timerText,
    timerIsOvertime,
    timerLive,
    timerEndMs,
    timerOvertimeAware,
  };
}

function buildTimerSpan(timing, b, escapeHTML) {
  const { timerText, timerLive, timerIsOvertime, timerEndMs, timerOvertimeAware } = timing;
  const timerCls = `${timerLive ? "session-card-timer " : ""}session-live-timer${timerIsOvertime ? " overtime" : ""}`;
  const timerAttrs = timerLive
    ? ` id="session-card-timer-${escapeHTML(b.id)}"`
    : timerEndMs != null
      ? ` data-end="${timerEndMs}"${timerOvertimeAware ? ' data-overtime-aware="1"' : ""}`
      : "";
  return timerText ? `<span${timerAttrs} class="${timerCls}">${escapeHTML(timerText)}</span>` : "";
}

function buildSessionCardInfoHTML({
  b,
  t,
  escapeHTML,
  isExpanded,
  completedBadge,
  clientNamesStr,
  clientCount,
  routineName,
  warningHTML,
}) {
  const expandLabel = t(isExpanded ? "collapse" : "expand") || (isExpanded ? "Collapse" : "Expand");
  return `
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 1px;">
      <span class="badge badge-primary" style="font-size: 10px; padding: 2px 6px; font-weight: 700; font-family: monospace;">${escapeHTML(b.time)}</span>
      <strong class="session-card-title" style="font-size: 13px;">${escapeHTML(b.title)}</strong>
      ${completedBadge}
      <button class="btn-card-expand icon-btn text-muted" title="${expandLabel}" style="margin-left: auto; padding: 2px 6px; font-size: 11px;" aria-label="${expandLabel}" aria-expanded="${isExpanded}">
        <i class="fa-solid fa-chevron-${isExpanded ? "up" : "down"}"></i>
      </button>
      <button class="btn-edit-session icon-btn text-muted" title="${t("edit") || "Edit"}" style="padding: 2px 6px; font-size: 11px;" aria-label="Edit session">
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
    </div>
    ${
      isExpanded
        ? `
    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11px; color: var(--text-muted); line-height: 1.3;">
      <span><i class="fa-solid fa-users" style="margin-right: 4px; font-size: 10px;"></i>${clientNamesStr || `<span style="color: #ef4444;">—</span>`}
      <span style="color: var(--primary); font-weight: 600;">(${clientCount}/${b.maxCapacity} ${t("spots_filled")})</span></span>
      <span style="opacity: 0.45;">&bull;</span>
      <span><i class="fa-solid fa-clipboard-list" style="margin-right: 4px; font-size: 10px;"></i>${routineName ? escapeHTML(routineName) : `<span style="color: #ef4444; font-weight: 600;">${t("undefined")}</span>`}</span>
    </div>`
        : ""
    }
    ${warningHTML}
  `;
}

// Every card gets at most one status bar: live, past/elapsed, or upcoming/countdown — mutually
// exclusive, so this stacks the card into a column and bleeds a full-width bar to its edges the
// same way the live bar always has.
function buildSessionCardStatusBarHTML({
  isLive,
  pastElapsedSeconds,
  isUpcoming,
  timerIsOvertime,
  timerSpan,
  t,
  escapeHTML,
  formatDurationHM,
}) {
  // `stack` (session-status-stack) applies to the two non-live bars only — the live bar's own
  // layout rules already cover that structural stacking.
  if (isLive) {
    return {
      stack: false,
      html: `
    <div class="session-live-bar${timerIsOvertime ? " overtime" : ""}">
      <span class="session-live-tag"><i class="fa-solid fa-person-running"></i> ${escapeHTML(t("active_session") || "Active session")}</span>
      ${timerSpan}
    </div>`,
    };
  }
  if (pastElapsedSeconds != null) {
    return {
      stack: true,
      html: `
    <div class="session-live-bar past">
      <span class="session-live-tag"><i class="fa-solid fa-clock-rotate-left"></i> ${escapeHTML(t("elapsed") || "Elapsed")}</span>
      <span class="session-live-timer session-status-value" title="${escapeHTML(t("edit_elapsed_time") || "Edit elapsed time")}">${escapeHTML(formatDurationHM(pastElapsedSeconds))}</span>
    </div>`,
    };
  }
  if (isUpcoming) {
    return {
      stack: true,
      html: `
    <div class="session-live-bar upcoming${timerIsOvertime ? " overtime" : ""}">
      <span class="session-live-tag when-upcoming"><i class="fa-solid fa-forward-fast"></i> ${escapeHTML(t("starts_in") || "Starts in")}</span>
      <span class="session-live-tag when-overdue"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHTML(t("overdue") || "Overdue")}</span>
      ${timerSpan}
    </div>`,
    };
  }
  return { stack: false, html: "" };
}

export function renderSessionCard(b, colContainer, deps) {
  const { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId } = deps;

  const card = document.createElement("div");
  // Layout lives in .session-card (index.css) so it can stack to a single column on mobile.
  // The temporal class tints the title to match the day-selection line (past/future).
  const temporal = sessionDayTemporal(b.day);
  card.className = `session-card card glassmorphic${temporal !== "today" ? ` session-${temporal}` : ""}`;
  const activeSession = deps.getActiveSession ? deps.getActiveSession() : null;
  const isLaunched = computeIsLaunched(b, activeSession, activeId);
  const range = parseTimeRange(b.time);
  // Reaching the scheduled start by wall-clock is NOT the same as the trainer having actually
  // started the session — beginWorkoutSession() requires an explicit tap from the clipboard title
  // bar (#btn-start-session in activeSessionController.js), not from this card (see
  // test_session_status_line.py: "opening the clipboard only stages the session"). A due-but-
  // unstarted session must not read as already in progress, so isLive only follows isLaunched.
  const isLive = isLaunched;
  if (isLive) card.classList.add("session-live");

  // Hover feedback style
  card.addEventListener("mouseenter", () => {
    card.style.background = "rgba(255, 255, 255, 0.05)";
    card.style.transform = "translateY(-1px)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.background = "";
    card.style.transform = "";
  });

  const info = document.createElement("div");
  info.style.flex = "1";

  // Resolve participants with injury checking
  const clients = b.participants
    .map((pId) => state.clients.find((c) => c.id === pId))
    .filter(Boolean);
  const clientHTMLs = clients.map((c) => {
    let injuryIcon = "";
    if (c.hasInjury) {
      injuryIcon = ` <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 10px; color: #ef4444;" title="Has recorded injury"></i>`;
    }
    return `<span style="font-weight: 600; color: var(--text-color);">${escapeHTML(c.name)}${injuryIcon}</span>`;
  });
  const clientNamesStr = clientHTMLs.join(", ");

  // Find routine name
  const routine = state.routines.find((r) => r.id === b.routineId);
  const routineName = routine ? routine.name : "";

  const warningHTML = buildReadinessWarningsHTML(routineName, clients.length, t);

  // A finished session is badged and de-emphasised rather than shown as launchable
  const completedBadge = b.completed
    ? `<span class="badge badge-success" style="font-size: 9px; padding: 2px 6px; font-weight: 700;"><i class="fa-solid fa-circle-check" style="margin-right:3px;"></i>${t("session_completed")}</span>`
    : "";
  if (b.completed) card.classList.add("session-completed");

  const timing = computeCardTiming(b, isLaunched, activeSession, isLive, range);
  const { pastElapsedSeconds, isUpcoming, timerIsOvertime } = timing;

  const isExpanded = expandedCardIds.has(b.id);

  info.innerHTML = buildSessionCardInfoHTML({
    b,
    t,
    escapeHTML,
    isExpanded,
    completedBadge,
    clientNamesStr,
    clientCount: clients.length,
    routineName,
    warningHTML,
  });

  const expandBtn = info.querySelector(".btn-card-expand");
  if (expandBtn) {
    expandBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isExpanded) expandedCardIds.delete(b.id);
      else expandedCardIds.add(b.id);
      deps.rerenderSessions?.();
    });
  }

  const editBtn = info.querySelector(".btn-edit-session");
  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deps.navigateToPath?.(deps.urlFor("session.setup", { sessionId: b.id }));
    });
  }

  // Green left bracket spills into a full-width bottom bar with the Active-session tag + countdown;
  // the bar turns a warning colour when the session has run past its end (overtime, live-only).
  const timerSpan = buildTimerSpan(timing, b, escapeHTML);

  const status = buildSessionCardStatusBarHTML({
    isLive,
    pastElapsedSeconds,
    isUpcoming,
    timerIsOvertime,
    timerSpan,
    t,
    escapeHTML,
    formatDurationHM,
  });
  if (status.stack) card.classList.add("session-status-stack");
  if (timing.timerEndMs != null) ensureCardTicker();

  // No launch/completed button: the whole card is the tap target, and completion already shows
  // as a badge — the button just duplicated that and ate horizontal space. Starting the session is
  // now a clipboard title-bar action (#btn-start-session), reached by tapping the card to open it.
  card.addEventListener("click", () => {
    launchClipboardDirectly(b.id);
  });

  card.appendChild(info);
  if (status.html) card.insertAdjacentHTML("beforeend", status.html);
  colContainer.appendChild(card);

  if (pastElapsedSeconds != null) {
    const valueEl = card.querySelector(".session-status-value");
    if (valueEl) wireElapsedEdit(valueEl, b, deps);
  }
}
