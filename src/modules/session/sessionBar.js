// components/sessionBar.js
// The bottom "active / next session" bar (#active-session-bar). Two states:
//   - active: a session is running — shows its title, client count, and a countdown to the
//     scheduled end (goes negative once it overruns).
//   - idle:   no session running — names the next upcoming session and a starts-in countdown.
//
// `state` and `activeSession` are reassigned over the app's life, so they're read through
// accessor deps (getState / getActiveSession) rather than captured once. Wire up with
// initSessionBar(deps) before the first render.
//
// deps: {
//   getState(), getActiveSession(), t,
//   formatSignedDuration, formatDuration, formatDurationHourMin,
//   parseTimeRange, getOverlappingSessions, buildSessionMeta
// }

let deps = null;

export function initSessionBar(d) {
  deps = d;
}

// The bar's countdown derives from the source session's scheduled end when one is known
// (may run negative once a session overruns); ad-hoc sessions with no source session fall
// back to an elapsed count-up, since there is no schedule to count down against.
export function updateSessionBarTimer() {
  const activeSession = deps.getActiveSession();
  if (!activeSession) return;
  const durationEl = document.getElementById("session-bar-duration");
  const endDate = activeSession.sourceSession?.endDate;
  // The bottom active-session bar keeps second-level precision (a separate surface from the
  // dashboard's session-card status lines, TODO 2.3); .session-card-timer is that dashboard
  // card's own live timer and must render "01h 32m", same as its non-launched countdown states.
  let text = "";
  let cardText = "";
  let isOvertime = false;

  if (activeSession.sourceSession?.isPlanning) {
    text = deps.t("planning") || "Planning";
    cardText = text;
  } else if (endDate) {
    const endMs = new Date(endDate).getTime();
    const remainingSec = Math.round((endMs - Date.now()) / 1000);
    text = deps.formatSignedDuration(remainingSec);
    cardText = deps.formatDurationHourMin(remainingSec);
    isOvertime = remainingSec < 0;
  } else {
    text = deps.formatDuration(activeSession.duration || 0);
    cardText = deps.formatDurationHourMin(activeSession.duration || 0);
  }

  if (durationEl) {
    durationEl.textContent = text;
    durationEl.classList.toggle("overtime", isOvertime);
  }

  for (const el of document.querySelectorAll(".session-card-timer")) {
    el.textContent = cardText;
    el.classList.toggle("overtime", isOvertime); // colours come from CSS, not inline styles
    const bar = el.closest(".session-live-bar");
    if (bar) bar.classList.toggle("overtime", isOvertime); // warn the whole bar on overtime
  }
}

// Session name, participant count, and scheduled time range for the active bar.
// Ad-hoc sessions (started without a source session) fall back to a generic label — there
// is no scheduled title or time range to show.
export function renderActiveSessionBarLabels() {
  const activeSession = deps.getActiveSession();
  if (!activeSession) return;
  const titleEl = document.getElementById("session-bar-title");
  const metaEl = document.getElementById("session-bar-meta");
  if (!titleEl || !metaEl) return;
  const { t } = deps;

  const sourceSession = activeSession.sourceSession;
  const count = activeSession.participants.length;
  const clientsLabel = `${count} ${t("bar_clients_label")}`;

  titleEl.textContent = sourceSession
    ? sourceSession.titles.join(" + ")
    : t("live_tracking_clipboard");
  metaEl.textContent = sourceSession
    ? `${clientsLabel} · ${sourceSession.timeLabel}`
    : clientsLabel;
}

// The next session the idle bar should refer to: the earliest slot today that hasn't
// finished yet (covers both "not started" and "in progress but not launched"), or —
// if today has nothing left — the earliest slot tomorrow. Returns null when there's
// nothing scheduled in either bucket.
function getNextUpcomingSessionGroup() {
  const state = deps.getState();
  const { parseTimeRange, getOverlappingSessions } = deps;
  const sessions = state.sessions || [];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const pickEarliest = (list) => {
    let best = null;
    let bestStart = Infinity;
    for (const s of list) {
      const r = parseTimeRange(s.time);
      if (r && r.start < bestStart) {
        bestStart = r.start;
        best = s;
      }
    }
    return best;
  };

  const todayCandidates = sessions.filter((s) => {
    if (s.day !== "today") return false;
    const r = parseTimeRange(s.time);
    return r && r.end >= nowMinutes;
  });

  const anchor =
    pickEarliest(todayCandidates) || pickEarliest(sessions.filter((s) => s.day === "tomorrow"));
  if (!anchor) return null;

  return { day: anchor.day, sessions: getOverlappingSessions(anchor, sessions) };
}

// Idle bar: colour-distinct from the active state, names the next upcoming session(s)
// (merged when several run in the same slot), and its click target opens that same
// clipboard directly. Hides entirely when nothing is scheduled to show.
export function renderIdleSessionBar() {
  if (deps.getActiveSession()) return;
  const bar = document.getElementById("active-session-bar");
  if (!bar) return;
  const { t, buildSessionMeta, formatSignedDuration, getSessionDayDate } = deps;

  const next = getNextUpcomingSessionGroup();
  if (!next || next.sessions.length === 0) {
    bar.classList.add("hidden");
    delete bar.dataset.nextSessionId;
    return;
  }

  const meta = buildSessionMeta(next.sessions, next.day, getSessionDayDate);
  const participantCount = new Set(next.sessions.flatMap((s) => s.participants)).size;
  const startsInSec = Math.round((meta.startDate.getTime() - Date.now()) / 1000);

  bar.classList.remove("hidden");
  bar.classList.add("is-idle");
  bar.dataset.nextSessionId = next.sessions[0].id;

  document.getElementById("session-bar-title").textContent =
    `${t("next_session_label")}: ${meta.titles.join(" + ")}`;
  document.getElementById("session-bar-meta").textContent =
    `${participantCount} ${t("bar_clients_label")} · ${meta.timeLabel}`;
  document.getElementById("session-bar-duration").textContent = formatSignedDuration(startsInSec);
  document.getElementById("session-bar-duration").classList.remove("overtime");
}
