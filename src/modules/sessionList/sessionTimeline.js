// components/sessionTimeline.js — the dashboard's continuous, time-ordered session timeline
// (TODO §7.3 item 8): one vertical scroll, sessions grouped under sticky per-day headers, replacing
// the old four fixed yesterday/today/tomorrow/upcoming day-columns and their horizontal swipe-deck.
//
// deps: {
//   getState(),
//   t,
//   activeRouteName,
//   pushRoute,
//   urlFor
// }

let deps = null;

// `day` stays a coarse bucket for the systems that key off a BOOKING's own value — overlap
// detection (utils.js:getOverlappingSessions) and session-card temporal styling (sessionCard.js) —
// neither of which this rewrite touches. This module's own state is a real focused ISO date, not a
// bucket, so SESSION_DAY_OFFSETS survives only as the bucket->date mapping those other callers need.
const SESSION_DAY_OFFSETS = { yesterday: -1, today: 0, tomorrow: 1, upcoming: 2 };
const SESSION_SCROLL_SETTLE_MS = 700;

let focusedSessionDate = todayISODate();
let sessionsProgrammaticScrollUntil = 0;
let headerObserver = null;
let titlebarResizeObserver = null;
// Bumped by every syncSessionTimelineAfterRender() call; its rAF-deferred settle checks this
// before acting so a render that lands mid-flight of an earlier one's callback can't scroll the
// timeline back to a focus a later render has already superseded (boot can call renderSessions()
// several times in quick succession — recovering an active session, notifications, seeded data —
// and each queues its own settle). Also stamped onto the grid so tests can wait for genuine
// quiescence instead of guessing how long boot's render churn takes.
let settleGeneration = 0;

export function initSessionTimeline(d) {
  deps = d;
}

export function getFocusedSessionDate() {
  return focusedSessionDate;
}

// Unchanged: a session's own `day` bucket -> its coarse temporal class, used by sessionCard.js's
// title tint. Nothing about the continuous timeline changes what a session IS.
export function sessionDayTemporal(day) {
  if (day === "yesterday") return "past";
  if (day === "tomorrow" || day === "upcoming") return "future";
  return "today";
}

// Unchanged: bucket -> the real calendar date it stands for "as of right now". Still used by
// sessionCard.js and utils.js:buildSessionMeta to synthesize a countdown Date from a session's
// `day` + `time`, independent of this module's own focused-date tracking.
export function getSessionDayDate(day) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (SESSION_DAY_OFFSETS[day] ?? 0));
  return d;
}

function getSessionDayLocale() {
  return (deps.getState().lang || "en") === "sl" ? "sl-SI" : "en-US";
}

function todayISODate() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function getTimelineScrollAncestor() {
  return document.getElementById("main-content");
}

// Every rendered day-group header, in document order — sessionsView.js renders groups pre-sorted
// by `startDate`, so document order already IS chronological order. The one source both
// navigation (prev/next/today) and the scrollspy read from — no separate state to keep in sync.
function getGroupHeaders() {
  return Array.from(document.querySelectorAll(".sessions-day-group[data-date]"));
}

// weekday/date/temporal-class for one calendar date. The open-ended "upcoming" bucket's special
// "Upcoming, From <date>" text goes away with the bucket itself — every date is real now, so every
// group just shows its own weekday and date, same as three of the four old buckets always did.
export function formatCalendarDayLabel(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${isoDate}T00:00:00`);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  const locale = getSessionDayLocale();
  return {
    weekday: d.toLocaleDateString(locale, { weekday: "long" }),
    weekdayShort: d.toLocaleDateString(locale, { weekday: "short" }),
    date: isoDate,
    isToday: diffDays === 0,
    temporal: diffDays === 0 ? "today" : diffDays < 0 ? "past" : "future",
  };
}

export function renderSessionsTitleBar() {
  const todayBtn = document.getElementById("btn-sessions-today");
  if (!todayBtn) return;

  const { temporal } = formatCalendarDayLabel(focusedSessionDate);

  // The Today control doubles as the "current day" indicator: it resets the timeline to today, and
  // is disabled while today is already focused.
  const todayLabel = todayBtn.querySelector(".today-btn-label");
  if (todayLabel) todayLabel.textContent = deps.t("today");
  todayBtn.title = deps.t("today");
  todayBtn.disabled = temporal === "today";

  const jumpBtn = document.getElementById("btn-sessions-jump");
  if (jumpBtn) {
    const jumpLabel = deps.t("jump_to_date");
    jumpBtn.title = jumpLabel;
    jumpBtn.setAttribute("aria-label", jumpLabel);
  }
}

// Scrolls the timeline to a given ISO date (or the literal string "today"). Every existing call
// site was written for the old 4-bucket model and only ever passes "today" — kept as a sentinel so
// none of those callers (routerController.js, activeSessionController.js, editSessionControl.js)
// needed to change, while sessionRoutes.js's deep-link route now passes a real isoDate directly.
export function focusSessionsColumn(isoDateOrToday, behavior = "smooth") {
  const targetISO = isoDateOrToday === "today" ? todayISODate() : isoDateOrToday;
  const headers = getGroupHeaders();
  if (headers.length === 0) return;

  // Exact match, else the nearest date going forward, else the latest date loaded — mirrors the
  // old "upcoming" catch-all: landing on a date with no session lands you at the closest real
  // content instead of nowhere.
  const target =
    headers.find((h) => h.dataset.date === targetISO) ||
    headers.find((h) => h.dataset.date > targetISO) ||
    headers[headers.length - 1];
  if (!target) return;

  focusedSessionDate = target.dataset.date;
  renderSessionsTitleBar();

  // Only reflect the focused date in the URL while the timeline IS the active route — see
  // focusSessionsColumn's original note: a background renderSessions() must not bounce the URL off
  // whatever the trainer is actually looking at.
  if (deps.activeRouteName?.() === "sessions.day") {
    deps.pushRoute(deps.urlFor("sessions.day", { isoDate: focusedSessionDate }));
  }

  sessionsProgrammaticScrollUntil = Date.now() + SESSION_SCROLL_SETTLE_MS;
  target.scrollIntoView({ behavior, block: "start" });
}

// Scrollspy: which day-group is "focused" is now a function of scroll position, not a discrete
// swipe-settled column — an IntersectionObserver watching each sticky header is the standard
// technique for this (a header counts as focused once it reaches the top band of the scroll
// ancestor, via the negative bottom rootMargin below).
function observeSessionTimelineGroups() {
  const root = getTimelineScrollAncestor();
  if (headerObserver) headerObserver.disconnect();
  headerObserver = new IntersectionObserver(
    (entries) => {
      // Ignore intersection churn while a programmatic scrollIntoView is still settling, so the
      // title bar doesn't flicker through every header it passes on the way to its target.
      if (Date.now() < sessionsProgrammaticScrollUntil) return;
      const intersecting = new Set(entries.filter((e) => e.isIntersecting).map((e) => e.target));
      if (intersecting.size === 0) return;
      const focused = getGroupHeaders().find((h) => intersecting.has(h));
      if (!focused) return;
      const isoDate = focused.dataset.date;
      if (isoDate && isoDate !== focusedSessionDate) {
        focusedSessionDate = isoDate;
        renderSessionsTitleBar();
        if (deps.activeRouteName?.() === "sessions.day") {
          deps.pushRoute(deps.urlFor("sessions.day", { isoDate }));
        }
      }
    },
    { root, rootMargin: "0px 0px -70% 0px", threshold: 0 },
  );
  for (const header of getGroupHeaders()) headerObserver.observe(header);
}

// The mirrored footer (sessionsView.js) exists so scrolling toward the past — where the sticky
// header has already scrolled off the TOP — still shows which day is on screen. But CSS `position:
// sticky` alone can't express "only when the header is out of view": for any group taller than
// ~2x the viewport, there is a real scroll range near the group's tail where the header is STILL
// stuck at the top (the group hasn't ended yet) at the same time the footer has entered its own
// stuck range from the bottom — both pinned at once, printing the same day name twice with nothing
// to distinguish them (read as a duplicated day-group, not a mirrored pair). A second observer,
// watching the header BARS themselves (not the whole group — getGroupHeaders() serves the
// scrollspy above and needs its own rootMargin trick), hides each group's footer for exactly as
// long as that group's own header is genuinely on screen.
let footerVisibilityObserver = null;
function observeGroupFooterVisibility() {
  const root = getTimelineScrollAncestor();
  if (footerVisibilityObserver) footerVisibilityObserver.disconnect();
  footerVisibilityObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const footer = entry.target
          .closest(".sessions-day-group")
          ?.querySelector(".sessions-day-group-footer");
        if (footer) footer.classList.toggle("header-visible", entry.isIntersecting);
      }
    },
    { root, threshold: 0 },
  );
  for (const header of document.querySelectorAll(".sessions-day-group-header")) {
    footerVisibilityObserver.observe(header);
  }
}

// The sticky "Sessions" title bar (.view-titlebar) and each day-group header both pin to
// #main-content's top edge — sharing that edge is what used to hide the header: at top:0 it sat
// exactly under the title bar, which paints over it (title bar is z-index 10, header is 2). Rather
// than hand-coding the title bar's height (it varies by breakpoint — the Today control is
// icon-only + shorter on phones — and by locale, since a translated label can wrap differently), a
// ResizeObserver keeps a live CSS var in sync so the header's sticky offset always starts right
// where the title bar ends, keeping the day/date line on screen for whichever group is focused.
function syncSessionsHeaderStickyOffset() {
  const titlebar = document.querySelector("#view-clients .view-titlebar");
  const grid = document.getElementById("sessions-categories-grid");
  if (!titlebar || !grid) return;
  grid.style.setProperty("--sessions-header-sticky-top", `${titlebar.offsetHeight}px`);
}

function observeSessionsTitlebarHeight() {
  const titlebar = document.querySelector("#view-clients .view-titlebar");
  if (!titlebar) return;
  if (titlebarResizeObserver) titlebarResizeObserver.disconnect();
  titlebarResizeObserver = new ResizeObserver(syncSessionsHeaderStickyOffset);
  titlebarResizeObserver.observe(titlebar);
  syncSessionsHeaderStickyOffset();
}

// Defers a focusSessionsColumn() call to the next frame, coordinated through one generation
// counter shared by every caller that needs to settle the timeline after the DOM might still be
// mid-update: a renderSessions() pass re-settling to the pre-rebuild focus, the sessions.day route
// settling to its own isoDate param on entry, and the workout-setup "discard changes" flow
// settling back to today all used to each schedule their OWN independent requestAnimationFrame
// call. None of them knew about the others, so whichever fired LAST silently won regardless of
// which one actually reflected the current intent — e.g. a route entry settling to "today" arriving
// after a render's settle to some other focused date would yank the timeline back to today even
// though nothing asked for that. Routing every deferred settle through here means a newer call
// always supersedes an older one still in flight, instead of racing it.
export function scheduleTimelineSettle(isoDateOrToday, behavior = "auto") {
  const gen = ++settleGeneration;
  const grid = document.getElementById("sessions-categories-grid");
  if (grid) grid.dataset.settleGen = String(gen);
  requestAnimationFrame(() => {
    if (gen !== settleGeneration) return; // superseded by a later scheduled settle
    focusSessionsColumn(isoDateOrToday, behavior);
    if (grid) grid.dataset.settled = String(gen);
  });
}

// Called once per renderSessions() pass, after the day-groups are (re)built — re-attaches the
// scrollspy to the fresh DOM nodes and re-settles the scroll position to whichever date was
// focused before the rebuild (or today, on first load), the same "don't let a re-render move the
// trainer's scroll position" guarantee focusSessionsColumn always gave the old day-deck.
export function syncSessionTimelineAfterRender() {
  observeSessionTimelineGroups();
  observeGroupFooterVisibility();
  observeSessionsTitlebarHeight();
  scheduleTimelineSettle(focusedSessionDate, "auto");
}

// The date-picker's own markup (Today + jump-to-date) — index.html only holds the empty
// #sessions-date-picker slot; this module owns what goes inside it, the same way sessionsView.js
// owns #sessions-categories-grid's contents. Text/titles are placeholders here and get their real
// (translated) values from renderSessionsTitleBar() right after.
export function renderSessionsDatePicker() {
  const container = document.getElementById("sessions-date-picker");
  if (!container) return;
  container.innerHTML = `
    <button id="btn-sessions-today" class="sessions-today-btn" type="button" title="Today">
      <i class="fa-solid fa-calendar-day"></i><span class="today-btn-label">Today</span>
    </button>
    <button id="btn-sessions-jump" class="sessions-nav-arrow" type="button" aria-label="Jump to date" title="Jump to date">
      <i class="fa-solid fa-calendar-days"></i>
    </button>
    <input id="sessions-date-jump-input" class="sessions-date-jump-input" type="date" tabindex="-1" aria-hidden="true" />
  `;
}

export function setupSessionsDayNav() {
  renderSessionsDatePicker();

  const todayBtn = document.getElementById("btn-sessions-today");
  if (todayBtn) todayBtn.addEventListener("click", () => focusSessionsColumn("today"));

  // Date-jump control ("scrub to an exact date" — TODO §7.3 item 8): the visible button opens the
  // native picker on the hidden input; choosing a date there scrolls the timeline straight to it.
  const jumpBtn = document.getElementById("btn-sessions-jump");
  const jumpInput = document.getElementById("sessions-date-jump-input");
  if (jumpBtn && jumpInput) {
    jumpBtn.addEventListener("click", () => {
      jumpInput.value = focusedSessionDate;
      if (typeof jumpInput.showPicker === "function") {
        jumpInput.showPicker();
      } else {
        jumpInput.focus();
      }
    });
    jumpInput.addEventListener("change", () => {
      if (jumpInput.value) focusSessionsColumn(jumpInput.value);
    });
  }
}
