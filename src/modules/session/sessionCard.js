// components/sessionCard.js
// Renders one session-booking card for the dashboard day columns (the tappable card that
// launches the clipboard). Dependencies are injected by the caller (renderSessions in app.js)
// so this component stays decoupled from app.js internals and is easy to relocate/test.
//
// deps: { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId,
//         saveToLocalStorage, rerenderSessions }

import { formatDurationHM, parseDurationHM, parseTimeRange } from "../common/utils.js";
import { getSessionDayDate } from "./daySelector.js";

// A single interval ticks every clock-driven status line that isn't the launched clipboard's own
// timer (which ticks via sessionBar): an in-progress-by-clock session counting down to its
// scheduled end, or an upcoming session counting down to its scheduled start. Each such element
// carries data-end (epoch ms of the target moment); the ticker updates the text and, for the
// countdown-to-end case only (data-overtime-aware="1"), flips the "overtime" warning past zero.
let cardTicker = null;
function ensureCardTicker() {
  if (cardTicker) return;
  cardTicker = setInterval(() => {
    for (const el of document.querySelectorAll(".booking-live-timer[data-end]")) {
      const remSec = Math.round((parseInt(el.dataset.end, 10) - Date.now()) / 1000);
      el.textContent = formatDurationHM(remSec);
      if (el.dataset.overtimeAware) {
        const over = remSec < 0;
        el.classList.toggle("overtime", over);
        const bar = el.closest(".booking-live-bar");
        if (bar) bar.classList.toggle("overtime", over);
      }
    }
  }, 1000);
}

// Turn a past session's elapsed-time chip into an inline "HH:MM" edit field on click/Enter — commits
// on blur/Enter (parsed via parseDurationHM), discards on Escape. Persists onto the booking object
// itself (b.duration, seconds) since that's the only place a finished ad-hoc/seed session's actual
// elapsed time is recorded (state.history logs a duration per client, not per booking).
function wireElapsedEdit(valueEl, b, deps) {
  const startEdit = (e) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.className = "booking-status-edit-input";
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

export function renderSessionCard(b, colContainer, deps) {
  const { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal, activeId } = deps;

  const card = document.createElement("div");
  // Layout lives in .booking-card (index.css) so it can stack to a single column on mobile.
  // The temporal class tints the title to match the day-selection line (past/future).
  const temporal = sessionDayTemporal(b.day);
  card.className = `booking-card card glassmorphic${temporal !== "today" ? ` booking-${temporal}` : ""}`;
  // A card is marked "Active session" when it's the launched clipboard session (matched by the
  // booking id(s) it launched from) OR a session that has started by wall-clock today and isn't
  // closed. Every applicable card is marked, so overlapping sessions all show as ongoing. Once a
  // non-closed session runs past its end (negative remaining), the marker turns a warning colour.
  const activeSession = deps.getActiveSession ? deps.getActiveSession() : null;
  const sb = activeSession?.booking;
  const isLaunched =
    !b.completed &&
    !!activeSession &&
    ((activeId && b.id === activeId) ||
      activeSession.id === b.id ||
      (sb && sb.id === b.id) ||
      (sb && Array.isArray(sb.ids) && sb.ids.includes(b.id)));
  const range = parseTimeRange(b.time);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isNow = !b.completed && b.day === "today" && !!range && nowMin >= range.start;
  const isLive = isLaunched || isNow;
  if (isLive) card.classList.add("booking-live");

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

  // Readiness warnings — a session needs both a program and at least one participant
  const pill = (label) => `
    <div class="booking-warning-pill" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${label}</span>
    </div>`;
  const warnings = [];
  if (!routineName) warnings.push(pill(t("program_not_defined")));
  if (clients.length === 0) warnings.push(pill(t("no_members_assigned")));
  const warningHTML = warnings.length
    ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">${warnings.join("")}</div>`
    : "";

  // A finished session is badged and de-emphasised rather than shown as launchable
  const completedBadge = b.completed
    ? `<span class="badge badge-success" style="font-size: 9px; padding: 2px 6px; font-weight: 700;"><i class="fa-solid fa-circle-check" style="margin-right:3px;"></i>${t("session_completed")}</span>`
    : "";
  if (b.completed) card.classList.add("booking-completed");

  // Elapsed time for a finished session: the trainer's actual recorded duration (b.duration,
  // stamped by finishWorkoutSession) if known, else a fallback derived from the scheduled slot
  // length so seed/demo "completed" bookings (which predate that stamping) still show something.
  const pastElapsedSeconds = b.completed
    ? typeof b.duration === "number"
      ? b.duration
      : range
        ? (range.end - range.start) * 60
        : null
    : null;

  // Countdown to a not-yet-started session's scheduled start (today, tomorrow, or the "upcoming"
  // bucket) — mirrors the isNow countdown-to-end below, aimed at the other end of the slot.
  // getSessionDayDate maps each relative day bucket to a real calendar date (daySelector.js) — the
  // same mapping the rest of the dashboard already uses — so this stays consistent even though
  // bookings carry no real date of their own (see TODO 4.3).
  const startMs =
    !b.completed && !isLive && range
      ? getSessionDayDate(b.day).getTime() + range.start * 60000
      : null;
  const isUpcoming = startMs != null && startMs > Date.now();

  // Status-line timer text. Three mutually exclusive drivers, all rendered HH:MM only (session-list
  // status lines never show seconds):
  //  - the launched clipboard's own timer (ticks elsewhere, via sessionBar)
  //  - a clock-driven countdown to the scheduled END (in progress, not launched) — the only one
  //    that ever goes "overtime"
  //  - a clock-driven countdown to the scheduled START (not yet begun)
  let timerText = "";
  let timerIsOvertime = false;
  let timerLive = false; // driven by the launched clipboard timer
  let timerEndMs = null; // scheduled end/start (epoch) for the clock-based countdown, whichever applies
  let timerOvertimeAware = false;
  if (isLaunched && activeSession) {
    timerLive = true;
    const endDate = activeSession.booking?.endDate;
    if (endDate) {
      const remainingSec = Math.round((new Date(endDate).getTime() - Date.now()) / 1000);
      timerText = formatDurationHM(remainingSec);
      timerIsOvertime = remainingSec < 0;
    } else {
      timerText = formatDurationHM(activeSession.duration || 0);
    }
  } else if (isNow && range) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setMinutes(range.end);
    timerEndMs = end.getTime();
    timerOvertimeAware = true;
    const remSec = Math.round((timerEndMs - Date.now()) / 1000);
    timerText = formatDurationHM(remSec);
    timerIsOvertime = remSec < 0;
  } else if (isUpcoming) {
    timerEndMs = startMs;
    timerText = formatDurationHM(Math.round((startMs - Date.now()) / 1000));
  }

  info.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px;">
      <span class="badge badge-primary" style="font-size: 10px; padding: 2px 6px; font-weight: 700; font-family: monospace;">${escapeHTML(b.time)}</span>
      <strong class="booking-card-title" style="font-size: 13px;">${escapeHTML(b.title)}</strong>
      ${completedBadge}
      <button class="btn-edit-booking icon-btn text-muted" title="${t("edit") || "Edit"}" style="margin-left: auto; padding: 2px 6px; font-size: 11px;" aria-label="Edit session">
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
    </div>
    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;">
      <i class="fa-solid fa-users" style="margin-right: 4px; font-size: 10px;"></i> ${clientNamesStr || `<span style="color: #ef4444;">—</span>`}
      <span style="margin-left: 4px; color: var(--primary); font-weight: 600;">(${clients.length}/${b.maxCapacity} ${t("spots_filled")})</span>
    </div>
    <div style="font-size: 11px; color: var(--text-muted);">
      <i class="fa-solid fa-clipboard-list" style="margin-right: 4px; font-size: 10px;"></i> Program: <span class="font-semibold">${routineName ? escapeHTML(routineName) : `<span style="color: #ef4444; font-weight: 600;">${t("undefined")}</span>`}</span>
    </div>
    ${warningHTML}
  `;

  const editBtn = info.querySelector(".btn-edit-booking");
  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const { toUrl, navigateToPath } = deps;
      if (navigateToPath) {
        navigateToPath(`/session/setup/${b.id}`);
      } else if (toUrl) {
        window.history.pushState(null, "", toUrl(`/session/setup/${b.id}`));
      }
    });
  }

  // Green left bracket spills into a full-width bottom bar with the Active-session tag + countdown;
  // the bar turns a warning colour when the session has run past its end (overtime, live-only).
  const timerCls = `${timerLive ? "session-card-timer " : ""}booking-live-timer${timerIsOvertime ? " overtime" : ""}`;
  const timerAttrs = timerLive
    ? ` id="session-card-timer-${escapeHTML(b.id)}"`
    : timerEndMs != null
      ? ` data-end="${timerEndMs}"${timerOvertimeAware ? ' data-overtime-aware="1"' : ""}`
      : "";
  const timerSpan = timerText
    ? `<span${timerAttrs} class="${timerCls}">${escapeHTML(timerText)}</span>`
    : "";

  // Every card gets at most one status bar: live (existing), past/elapsed, or upcoming/countdown —
  // mutually exclusive, so this stacks the card into a column and bleeds a full-width bar to its
  // edges the same way the live bar always has (booking-live's own layout rules already cover
  // that; booking-status-stack gives the other two states the same structural stacking without
  // the live bar's green tint, so a finished/upcoming card doesn't read as "currently active").
  let statusBarHTML = "";
  if (isLive) {
    statusBarHTML = `
    <div class="booking-live-bar${timerIsOvertime ? " overtime" : ""}">
      <span class="booking-live-tag"><i class="fa-solid fa-person-running"></i> ${escapeHTML(t("active_session") || "Active session")}</span>
      ${timerSpan}
    </div>`;
  } else if (pastElapsedSeconds != null) {
    card.classList.add("booking-status-stack");
    statusBarHTML = `
    <div class="booking-live-bar past">
      <span class="booking-live-tag"><i class="fa-solid fa-clock-rotate-left"></i> ${escapeHTML(t("elapsed") || "Elapsed")}</span>
      <span class="booking-live-timer booking-status-value" title="${escapeHTML(t("edit_elapsed_time") || "Edit elapsed time")}">${escapeHTML(formatDurationHM(pastElapsedSeconds))}</span>
    </div>`;
  } else if (isUpcoming) {
    card.classList.add("booking-status-stack");
    statusBarHTML = `
    <div class="booking-live-bar upcoming">
      <span class="booking-live-tag"><i class="fa-solid fa-forward-fast"></i> ${escapeHTML(t("starts_in") || "Starts in")}</span>
      ${timerSpan}
    </div>`;
  }
  if (timerEndMs != null) ensureCardTicker();

  // No launch/completed button: the whole card is the tap target, and completion already shows
  // as a badge — the button just duplicated that and ate horizontal space.
  card.addEventListener("click", () => {
    launchClipboardDirectly(b.id);
  });

  card.appendChild(info);
  if (statusBarHTML) card.insertAdjacentHTML("beforeend", statusBarHTML);
  colContainer.appendChild(card);

  if (pastElapsedSeconds != null) {
    const valueEl = card.querySelector(".booking-status-value");
    if (valueEl) wireElapsedEdit(valueEl, b, deps);
  }
}
