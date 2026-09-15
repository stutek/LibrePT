// src/modules/sessionList/sessionCard.js
// Renders one session card for the dashboard day columns (the tappable card that
// launches the clipboard). Dependencies are injected by the caller (renderSessions in app.js)
// so this component stays decoupled from app.js internals and is easy to relocate/test.
//
// deps: { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal,
//         activeId, saveToLocalStorage, rerenderSessions }

import { computeActiveSessionCountdown } from "../../domain/sessionClock.js";
import { parseTimeRange } from "../../domain/timeRange.js";
import {
  cancelTrainerFormDraft,
  finishTrainerFormDraft,
  hasTrainerFormDraft,
  isCompletingTrainerFormDraft,
  openTrainerFormDraft,
} from "../common/trainerFormDraft.js";
import { formatDurationHM, formatDurationHourMin, parseDurationHM } from "../common/utils.js";
import { getSessionDayDate } from "./sessionTimeline.js";

// A single interval ticks every clock-driven status line that isn't the launched clipboard's own
// timer (which ticks via sessionBar): an in-progress-by-clock session counting down to its
// scheduled end, or an upcoming session counting down to its scheduled start. Each such element
// carries data-end (epoch ms of the target moment); the ticker updates the text and, for the
// countdown-to-end case only (data-overtime-aware="1"), flips the "overtime" warning past zero.
// The day is crowded with sessions — a card shows its essentials (time, title, status bar) and
// opens on a tap of its own chevron to reveal participants/programme/warnings.
//
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
    input.id = `elapsed-draft-${b.id}`;
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
        cancelTrainerFormDraft(input.id);
        input.blur();
      }
    });
    input.addEventListener("blur", () => {
      if (!cancelled) {
        const parsed = parseDurationHM(input.value);
        if (parsed != null) {
          b.duration = parsed;
          if (deps.saveToLocalStorage) deps.saveToLocalStorage();
          finishTrainerFormDraft(input.id);
        }
      }
      if (deps.rerenderSessions) deps.rerenderSessions();
    });
    valueEl.replaceWith(input);
    openTrainerFormDraft(
      input,
      { id: "elapsed-duration", subject: () => b.id, resume: false },
      deps.t,
    );
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
  if (
    hasTrainerFormDraft("elapsed-duration", b.id) &&
    !isCompletingTrainerFormDraft(`elapsed-draft-${b.id}`)
  ) {
    startEdit({ stopPropagation() {} });
  }
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
    <div class="session-warning-pill">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${label}</span>
    </div>`;
  const warnings = [];
  if (!routineName) warnings.push(pill(t("program_not_defined")));
  if (clientCount === 0) warnings.push(pill(t("no_members_assigned")));
  return warnings.length ? `<div class="session-warning-list">${warnings.join("")}</div>` : "";
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

/** ONE design, always whole (TODO §45.16, reported 2026-09-11 from a screenshot).
 *
 * What it dropped, and why each was costing more than it said:
 *
 * - **The participants' NAMES.** They were the only thing the card hid, and hiding them is what the
 *   expand control existed for. A name is also the slowest thing on the card to read and the least
 *   useful at a glance — the count says whether the session is full, and §45.6's client filter now
 *   answers "which sessions is Ana in" far better than reading every card. An injury among them is
 *   NOT dropped: it becomes one mark, because that is a warning rather than a detail.
 * - **The routine name when it repeats the title.** The screenshot showed "Strength & Longevity
 *   Focus" twice on one card, once as the heading and once beside a clipboard glyph. A session
 *   usually takes its name from its programme, so the repeat is the common case, not the odd one.
 * - **The completed badge, out of the heading row.** That row wraps, so the badge pushed the edit
 *   button onto a line of its own — which is the empty space in the report, not a margin. A finished
 *   session already has a status bar at the foot saying how long it ran; the tick belongs there.
 * - **The expand chevron**, which now has nothing left to open.
 */
function buildSessionCardInfoHTML({
  b,
  t,
  escapeHTML,
  clientCount,
  anyInjury,
  routineName,
  warningHTML,
}) {
  // The programme, only when it says something the title has not. Compared trimmed and
  // case-insensitively: "Strength & Longevity Focus" and "strength & longevity focus " are the same
  // sentence to a reader, and the point is what the reader sees twice.
  const sameAsTitle =
    routineName.trim().toLowerCase() ===
    String(b.title || "")
      .trim()
      .toLowerCase();
  const programmeHTML = routineName
    ? sameAsTitle
      ? ""
      : `<span class="session-card-dot-sep">&bull;</span>
      <span><i class="fa-solid fa-clipboard-list session-card-icon"></i>${escapeHTML(routineName)}</span>`
    : `<span class="session-card-dot-sep">&bull;</span>
      <span class="session-card-undefined-programme"><i class="fa-solid fa-clipboard-list session-card-icon"></i>${escapeHTML(t("undefined"))}</span>`;

  const injuryHTML = anyInjury
    ? `<i class="fa-solid fa-triangle-exclamation session-card-injury-icon" title="${escapeHTML(t("notes_injuries"))}"></i>`
    : "";

  return `
    <div class="session-card-header-row">
      <span class="badge badge-primary session-card-time-badge">${escapeHTML(b.time)}</span>
      <strong class="session-card-title">${escapeHTML(b.title)}</strong>
      <button class="btn-edit-session icon-btn text-muted session-card-edit-btn" title="${escapeHTML(t("edit") || "Edit")}" aria-label="${escapeHTML(t("edit") || "Edit")}">
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
    </div>
    <div class="session-card-meta-row">
      <span><i class="fa-solid fa-users session-card-icon"></i><span class="session-card-capacity">${clientCount}/${b.maxCapacity} ${escapeHTML(t("spots_filled"))}</span>${injuryHTML}</span>
      ${programmeHTML}
    </div>
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
  isCompleted,
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
    // A finished session says so HERE rather than in the heading row (§45.16). The bar already
    // exists, already reports the time, and has room for a word the heading row did not.
    const tag = isCompleted
      ? `<span class="session-live-tag"><i class="fa-solid fa-circle-check"></i> ${escapeHTML(t("session_completed"))}</span>`
      : `<span class="session-live-tag"><i class="fa-solid fa-clock-rotate-left"></i> ${escapeHTML(t("elapsed") || "Elapsed")}</span>`;
    return {
      stack: true,
      html: `
    <div class="session-live-bar past">
      ${tag}
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

  const info = document.createElement("div");
  info.className = "session-card-info";

  // Resolve participants with injury checking
  const clients = b.participants
    .map((pId) => state.clients.find((c) => c.id === pId))
    .filter(Boolean);
  // One mark for the whole card rather than one per name: the names are gone (§45.16) and an injury
  // is a warning, not a detail — what the trainer needs at a glance is that SOMEBODY in this session
  // has one, and whose is a tap away on the session itself.
  const anyInjury = clients.some((c) => c.hasInjury);

  // Find routine name
  const routine = state.routines.find((r) => r.id === b.routineId);
  const routineName = routine ? routine.name : "";

  const warningHTML = buildReadinessWarningsHTML(routineName, clients.length, t);

  // A finished session is de-emphasised rather than shown as launchable. The badge that used to say
  // so moved into the status bar at the foot (§45.16): in the heading row it pushed the edit button
  // onto a line of its own, and the foot already reports how long the session ran.
  if (b.completed) card.classList.add("session-completed");

  const timing = computeCardTiming(b, isLaunched, activeSession, isLive, range);
  const { pastElapsedSeconds, isUpcoming, timerIsOvertime } = timing;

  info.innerHTML = buildSessionCardInfoHTML({
    b,
    t,
    escapeHTML,
    clientCount: clients.length,
    anyInjury,
    routineName,
    warningHTML,
  });

  const editBtn = info.querySelector(".btn-edit-session");
  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Through `storeSession` first: an evening that exists only as a repeating rule has no
      // record to edit yet, and editing is exactly the act that makes it one (TODO §35.3a). The
      // board owns that conversion; the card just says which evening was tapped.
      deps.navigateToPath?.(
        deps.urlFor("session.setup", { sessionId: deps.storeSession?.(b.id) ?? b.id }),
      );
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
    isCompleted: Boolean(b.completed),
    t,
    escapeHTML,
    formatDurationHM,
  });
  if (status.stack) card.classList.add("session-status-stack");
  if (timing.timerEndMs != null) ensureCardTicker();

  // No launch/completed button: the whole card is the tap target, and completion already shows
  // in the status bar — the button just duplicated that and ate horizontal space. Starting the session is
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
