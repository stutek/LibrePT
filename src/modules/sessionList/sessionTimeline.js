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

export function initSessionTimeline(d) {
  deps = d;
}

export function getFocusedSessionDate() {
  return focusedSessionDate;
}

// Unchanged: a booking's own `day` bucket -> its coarse temporal class, used by sessionCard.js's
// title tint. Nothing about the continuous timeline changes what a booking IS.
export function sessionDayTemporal(day) {
  if (day === "yesterday") return "past";
  if (day === "tomorrow" || day === "upcoming") return "future";
  return "today";
}

// Unchanged: bucket -> the real calendar date it stands for "as of right now". Still used by
// sessionCard.js and utils.js:buildSessionMeta to synthesize a countdown Date from a booking's
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
  const weekdayEl = document.getElementById("calendar-title-weekday");
  const weekdayShortEl = document.getElementById("calendar-title-weekday-short");
  const dateEl = document.getElementById("calendar-title-date");
  const todayBtn = document.getElementById("btn-sessions-today");
  if (!weekdayEl || !weekdayShortEl || !dateEl) return;

  const { weekday, weekdayShort, date, temporal } = formatCalendarDayLabel(focusedSessionDate);
  const calTitle = document.getElementById("calendar-title");
  calTitle.classList.toggle("is-past", temporal === "past");
  calTitle.classList.toggle("is-future", temporal === "future");

  weekdayEl.textContent = weekday;
  weekdayShortEl.textContent = weekdayShort;
  dateEl.textContent = date;

  // The Today control doubles as the "current day" indicator: it resets the timeline to today, and
  // is disabled while today is already focused. It always keeps its slot so the stepper's arrows
  // never shift as the date text changes width.
  if (todayBtn) {
    const todayLabel = todayBtn.querySelector(".today-btn-label");
    if (todayLabel) todayLabel.textContent = deps.t("today");
    todayBtn.title = deps.t("today");
    todayBtn.disabled = temporal === "today";
  }

  const jumpBtn = document.getElementById("btn-sessions-jump");
  if (jumpBtn) {
    const jumpLabel = deps.t("jump_to_date");
    jumpBtn.title = jumpLabel;
    jumpBtn.setAttribute("aria-label", jumpLabel);
  }

  const headers = getGroupHeaders();
  const idx = headers.findIndex((h) => h.dataset.date === focusedSessionDate);
  const arrows = [
    {
      el: document.getElementById("btn-sessions-prev"),
      header: idx > -1 ? headers[idx - 1] : null,
    },
    {
      el: document.getElementById("btn-sessions-next"),
      header: idx > -1 ? headers[idx + 1] : null,
    },
  ];
  for (const { el, header } of arrows) {
    if (!el) continue;
    el.disabled = !header;
    const label = header ? formatCalendarDayLabel(header.dataset.date).date : "";
    el.setAttribute("aria-label", label);
    el.title = label;
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

function stepTimelineGroup(delta) {
  const headers = getGroupHeaders();
  const idx = headers.findIndex((h) => h.dataset.date === focusedSessionDate);
  if (idx === -1) return;
  const target = headers[idx + delta];
  if (target) focusSessionsColumn(target.dataset.date);
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

// Called once per renderSessions() pass, after the day-groups are (re)built — re-attaches the
// scrollspy to the fresh DOM nodes and re-settles the scroll position to whichever date was
// focused before the rebuild (or today, on first load), the same "don't let a re-render move the
// trainer's scroll position" guarantee focusSessionsColumn always gave the old day-deck.
export function syncSessionTimelineAfterRender() {
  observeSessionTimelineGroups();
  requestAnimationFrame(() => focusSessionsColumn(focusedSessionDate, "auto"));
}

export function setupSessionsDayNav() {
  const prevBtn = document.getElementById("btn-sessions-prev");
  const nextBtn = document.getElementById("btn-sessions-next");
  if (prevBtn) prevBtn.addEventListener("click", () => stepTimelineGroup(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => stepTimelineGroup(1));

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
