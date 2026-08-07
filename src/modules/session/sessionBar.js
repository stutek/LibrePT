// src/modules/session/sessionBar.js
// The live-clipboard bar: a persistent strip in the notification handle bar saying a clipboard is
// running, and taking one tap to get back into it.
//
// It names the CLIPBOARD, never "the active session". A clipboard can be several scheduled
// sessions merged into one — `buildSessionMeta` collapses overlapping slots, so `titles` and `ids`
// are both lists — and a group slot running three bookings is one clipboard, not three sessions.
// Anything phrased as "the session" would be wrong for exactly the case the app was built for.
//
// ACTIVE STATE ONLY. This bar used to have a second, idle state naming the next upcoming session.
// That is planning information rather than in-progress state: it does not earn permanent space on
// a phone, the dashboard already shows it, and it competed with the notification summary for this
// same strip (which is why a `display: none !important` rule had to exist to separate them).
//
// What it is worth is not the taps saved. The clipboard is an overlay dismissed by a swipe-down or
// the grab handle, so leaving it by accident is ordinary on a phone in a pocket — and without this,
// getting back means home → scroll → find the right card, which is a SEARCH task on the gym floor.
// It also makes overtime glanceable from anywhere, which otherwise requires navigating back to
// discover.
//
// deps: {
//   getActiveSession(), t,
//   formatDuration, formatSignedDuration, formatDurationHourMin,
//   navigateToPath, clipboardPath()
// }

import { computeActiveSessionCountdown } from "../../domain/sessionClock.js";
import { renderMarkupOnce } from "../common/dom.js";

let deps = null;

export function initSessionBar(d) {
  deps = d;
}

// The whole strip is the tap target, not the text inside it — 14px of title is nothing to aim at
// with a sweaty thumb (AGENT_RULES §2.D.1). A <button> gets that, plus keyboard and screen-reader
// behaviour, without a click handler on a <div>.
export function renderClipboardBarShell() {
  renderMarkupOnce(
    "notification-handle-bar",
    (root) => root.querySelector("#clipboard-bar"),
    `
    <button type="button" id="clipboard-bar" class="clipboard-bar hidden">
      <span class="session-bar-content">
        <span class="session-bar-main">
          <span class="session-bar-info">
            <span class="pulse-indicator"></span>
            <span id="clipboard-bar-title"></span>
          </span>
          <span class="session-bar-meta" id="clipboard-bar-meta"></span>
        </span>
        <span class="session-bar-timer" id="clipboard-bar-duration"></span>
      </span>
    </button>
`,
  );

  document.getElementById("clipboard-bar")?.addEventListener("click", () => {
    const path = deps?.clipboardPath?.();
    if (path) deps.navigateToPath(path);
  });
}

// Shown only while a clipboard is live. Also flips `.has-active-session` on the notification area,
// which is what stands the notification summary down — the two share this strip and only one of
// them can own it.
export function renderClipboardBar() {
  const bar = document.getElementById("clipboard-bar");
  if (!bar) return;
  const activeSession = deps.getActiveSession();
  const area = document.getElementById("notification-area");

  bar.classList.toggle("hidden", !activeSession);
  area?.classList.toggle("has-active-session", !!activeSession);
  if (!activeSession) return;

  const { t } = deps;
  const sourceSession = activeSession.sourceSession;
  const participantCount = activeSession.participants.length;
  const clientsLabel = `${participantCount} ${t("bar_clients_label")}`;

  // Merged titles joined, because one clipboard can cover several booked slots. An ad-hoc clipboard
  // has no source session at all and falls back to the generic name — there is no schedule to cite.
  const titleEl = document.getElementById("clipboard-bar-title");
  const metaEl = document.getElementById("clipboard-bar-meta");
  if (titleEl) {
    titleEl.textContent = sourceSession
      ? sourceSession.titles.join(" + ")
      : t("live_tracking_clipboard");
  }
  if (metaEl) {
    metaEl.textContent = sourceSession
      ? `${clientsLabel} · ${sourceSession.timeLabel}`
      : clientsLabel;
  }
  bar.setAttribute("aria-label", `${t("btn_launch_clipboard")}: ${titleEl?.textContent || ""}`);

  updateSessionBarTimer();
}

// What the timer MEANS — a countdown to the scheduled end, or an elapsed count-up once there is no
// live schedule left to count down — is decided by computeActiveSessionCountdown, shared with the
// clipboard title bar and the dashboard card so the three can never disagree (domain/sessionClock.js).
export function updateSessionBarTimer() {
  const activeSession = deps.getActiveSession();
  if (!activeSession) return;
  const durationEl = document.getElementById("clipboard-bar-duration");
  // This bar keeps second-level precision (a separate surface from the dashboard's session-card
  // status lines, TODO 2.3); .session-card-timer is that dashboard card's own live timer and must
  // render "01h 32m", same as its non-launched countdown states.
  let text = "";
  let cardText = "";
  let isOvertime = false;

  if (activeSession.sourceSession?.isPlanning) {
    text = deps.t("planning") || "Planning";
    cardText = text;
  } else {
    const countdown = computeActiveSessionCountdown(activeSession);
    text = countdown.isCountdown
      ? deps.formatSignedDuration(countdown.seconds)
      : deps.formatDuration(countdown.seconds);
    cardText = deps.formatDurationHourMin(countdown.seconds);
    isOvertime = countdown.isOvertime;
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
