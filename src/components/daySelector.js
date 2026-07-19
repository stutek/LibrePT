// components/daySelector.js
// Handles horizontal navigation and day category selectors for the session columns on the dashboard.
//
// deps: {
//   getState(),
//   t,
//   toRoute,
//   toUrl,
//   getISODateForColumn
// }

let deps = null;

export const SESSION_DAY_ORDER = ["yesterday", "today", "tomorrow", "upcoming"];
const SESSION_DAY_OFFSETS = { yesterday: -1, today: 0, tomorrow: 1, upcoming: 2 };
const SESSION_SCROLL_SETTLE_MS = 700;

let focusedSessionDay = "today";
let sessionsProgrammaticScrollUntil = 0;

export function initDaySelector(d) {
  deps = d;
}

export function getFocusedSessionDay() {
  return focusedSessionDay;
}

export function setFocusedSessionDay(day) {
  focusedSessionDay = day;
}

export function sessionDayTemporal(day) {
  if (day === "yesterday") return "past";
  if (day === "tomorrow" || day === "upcoming") return "future";
  return "today";
}

function getSessionsGrid() {
  return document.getElementById("sessions-categories-grid");
}

export function getSessionDayDate(day) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (SESSION_DAY_OFFSETS[day] ?? 0));
  return d;
}

function getSessionDayLocale() {
  return (deps.getState().lang || "en") === "sl" ? "sl-SI" : "en-US";
}

function formatSessionDayISO(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function renderSessionsTitleBar() {
  const weekdayEl = document.getElementById("calendar-title-weekday");
  const weekdayShortEl = document.getElementById("calendar-title-weekday-short");
  const dateEl = document.getElementById("calendar-title-date");
  const todayBtn = document.getElementById("btn-sessions-today");
  if (!weekdayEl || !weekdayShortEl || !dateEl) return;

  const locale = getSessionDayLocale();
  const day = focusedSessionDay;
  const date = getSessionDayDate(day);
  const dateStr = formatSessionDayISO(date);

  const isUpcoming = day === "upcoming";
  const calTitle = document.getElementById("calendar-title");
  calTitle.classList.toggle("is-upcoming", isUpcoming);

  const temporal = sessionDayTemporal(day);
  calTitle.classList.toggle("is-past", temporal === "past");
  calTitle.classList.toggle("is-future", temporal === "future");

  if (isUpcoming) {
    weekdayEl.textContent = deps.t("upcoming");
    weekdayShortEl.textContent = deps.t("upcoming");
    dateEl.textContent = `${deps.t("from_date")} ${dateStr}`;
  } else {
    weekdayEl.textContent = date.toLocaleDateString(locale, { weekday: "long" });
    weekdayShortEl.textContent = date.toLocaleDateString(locale, { weekday: "short" });
    dateEl.textContent = dateStr;
  }

  const separatorEl = document.querySelector(".calendar-title-separator");
  if (separatorEl) {
    separatorEl.style.display = isUpcoming ? "none" : "inline";
  }

  // The Today control doubles as the "current day" indicator: it resets the deck to today, and
  // is disabled while today is already focused. It always keeps its slot so the stepper's arrows
  // never shift as the date text changes width.
  if (todayBtn) {
    // Only the text label is localized; the icon (shown in its place on phones) stays put.
    const todayLabel = todayBtn.querySelector(".today-btn-label");
    if (todayLabel) todayLabel.textContent = deps.t("today");
    todayBtn.disabled = day === "today";
  }

  const idx = SESSION_DAY_ORDER.indexOf(day);
  const arrows = [
    { el: document.getElementById("btn-sessions-prev"), target: SESSION_DAY_ORDER[idx - 1] },
    { el: document.getElementById("btn-sessions-next"), target: SESSION_DAY_ORDER[idx + 1] },
  ];
  for (const { el, target } of arrows) {
    if (!el) continue;
    el.disabled = !target;
    const label = target ? deps.t(target) : "";
    el.setAttribute("aria-label", label);
    el.title = label;
  }
}

export function focusSessionsColumn(day, behavior = "smooth") {
  const grid = getSessionsGrid();
  const col = document.getElementById(`${day}-sessions-column`);
  if (!grid || !col) return;

  focusedSessionDay = day;
  renderSessionsTitleBar();

  const isoDate = deps.getISODateForColumn(day);
  const targetPath = `/sessions/${isoDate}`;
  const currentRoute = deps.toRoute(window.location.pathname);
  // Only reflect the focused day in the URL while the sessions list is the active route. A
  // background renderSessions() (e.g. right after launching a session) must not bounce the URL off
  // the /session/... view it just navigated to.
  if (!currentRoute.startsWith("/session/") && currentRoute !== targetPath) {
    window.history.pushState(null, "", deps.toUrl(targetPath));
  }

  if (grid.offsetParent === null) {
    setTimeout(() => {
      const g = getSessionsGrid();
      const c = document.getElementById(`${day}-sessions-column`);
      if (g && c && g.offsetParent !== null) {
        const left =
          g.scrollLeft + (c.getBoundingClientRect().left - g.getBoundingClientRect().left);
        sessionsProgrammaticScrollUntil = Date.now() + SESSION_SCROLL_SETTLE_MS;
        g.scrollTo({ left, behavior });
      }
    }, 50);
    return;
  }

  const left =
    grid.scrollLeft + (col.getBoundingClientRect().left - grid.getBoundingClientRect().left);

  sessionsProgrammaticScrollUntil = Date.now() + SESSION_SCROLL_SETTLE_MS;
  grid.scrollTo({ left, behavior });
}

function stepSessionsColumn(delta) {
  const target = SESSION_DAY_ORDER[SESSION_DAY_ORDER.indexOf(focusedSessionDay) + delta];
  if (target) focusSessionsColumn(target);
}

export function detectFocusedSessionsColumn() {
  const grid = getSessionsGrid();
  if (!grid || grid.offsetParent === null) return;

  const gridLeft = grid.getBoundingClientRect().left;
  let closest = focusedSessionDay;
  let closestDist = Infinity;
  for (const day of SESSION_DAY_ORDER) {
    const col = document.getElementById(`${day}-sessions-column`);
    if (!col) continue;
    const dist = Math.abs(col.getBoundingClientRect().left - gridLeft);
    if (dist < closestDist) {
      closestDist = dist;
      closest = day;
    }
  }

  if (closest !== focusedSessionDay) {
    focusedSessionDay = closest;
    renderSessionsTitleBar();

    const isoDate = deps.getISODateForColumn(closest);
    const targetPath = `/sessions/${isoDate}`;
    if (deps.toRoute(window.location.pathname) !== targetPath) {
      window.history.pushState(null, "", deps.toUrl(targetPath));
    }
  }
}

export function setupSessionsDayNav() {
  const prevBtn = document.getElementById("btn-sessions-prev");
  const nextBtn = document.getElementById("btn-sessions-next");
  if (prevBtn) prevBtn.addEventListener("click", () => stepSessionsColumn(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => stepSessionsColumn(1));

  const todayBtn = document.getElementById("btn-sessions-today");
  if (todayBtn) todayBtn.addEventListener("click", () => focusSessionsColumn("today"));

  const grid = getSessionsGrid();
  if (grid) {
    let scrollSettleTimer = null;
    grid.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollSettleTimer);
        const delay = Math.max(80, sessionsProgrammaticScrollUntil - Date.now() + 20);
        scrollSettleTimer = setTimeout(detectFocusedSessionsColumn, delay);
      },
      { passive: true },
    );
  }
}
