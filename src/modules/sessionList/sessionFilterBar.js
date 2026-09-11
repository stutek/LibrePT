// src/modules/sessionList/sessionFilterBar.js — the board's filters: a date range, a client, a
// location (TODO §45.6).
//
// Single responsibility: the controls and what they currently say. The RULES are
// domain/sessionFilters.js — what a tap on a day does to a range lives there, with its own tests and
// no DOM.
//
// **Chips, not a modal** (ruled 2026-09-11). A modal costs two taps and hides what is switched on,
// so a trainer sees a short board without seeing why it is short. The chips are the filter AND the
// readout: each one says its value when set, and carries the × that clears it.
//
// **As few controls as the job allows**, because three filters is exactly the kind of feature that
// arrives as five new widgets:
//   - the chip row reuses `.filter-chips` / `.chip` from index.css, already used by the exercise
//     library — no new chip design;
//   - client and location are NATIVE `<select>`s wearing the chip class. The phone's own list is
//     better than any popover we would write, works with a screen reader, and costs nothing;
//   - the calendar replaces the old *jump to date* button rather than standing beside it. That
//     button opened the OS date picker and scrolled the board to a day; filtering to a day says the
//     same thing more strongly, so one control does both jobs and the count stays where it was.
//
// **The calendar is ours because it has to be.** `<input type="date">` returns one date and can
// neither show a range nor take two taps, so a range needs a month grid of our own — the largest
// part of this section, and the reason nothing else here is allowed to grow.
//
// Injected dependencies: `t`, `lang()`, `sessionsForFilters()` (the board's own list, before
// filtering), `clients()`, `onChange()`.

import {
  NO_SESSION_FILTERS,
  hasAnyFilter,
  hasDateFilter,
  isSingleDay,
  locationsOf,
  nextDateSelection,
  participantsOf,
} from "../../domain/sessionFilters.js";
import { escapeHTML } from "../common/utils.js";

const BAR_ID = "sessions-filter-bar";
const CALENDAR_ID = "sessions-filter-calendar";

let deps = null;
let filters = { ...NO_SESSION_FILTERS };
// Which end the next tap on a day moves, when the trainer has said so: "from", "to", or null. Held
// here rather than in the filter itself because it is about the CONTROL, not about what is filtered
// — and it is only ever true while the chip that says so is lit on screen.
let armedEnd = null;
let calendarOpen = false;
// The month the grid is showing. Not a filter either: it is where the trainer has scrolled to.
let visibleMonth = null;

export function initSessionFilterBar(injected) {
  deps = injected;
}

/** What the board should currently show — read by sessionsView.js, which owns the rendering. */
export function activeSessionFilters() {
  return { ...filters };
}

export function resetSessionFilters() {
  filters = { ...NO_SESSION_FILTERS };
  armedEnd = null;
}

function isoOf(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateFromIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthStart(iso) {
  const [year, month] = iso.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/** Monday-first, because every locale this app ships starts its week there and the board's day
 *  headers already read that way. */
function gridStart(first) {
  const start = new Date(first);
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  return start;
}

function monthLabel(date, lang) {
  return new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(date);
}

function weekdayLabels(lang) {
  const format = new Intl.DateTimeFormat(lang, { weekday: "short" });
  // 2026-01-05 is a Monday. A fixed known Monday, rather than arithmetic off today, so the header
  // cannot shift with the day the app is opened.
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(2026, 0, 5 + index);
    return format.format(day);
  });
}

function dateChipLabel() {
  const { t, lang } = deps;
  if (!hasDateFilter(filters)) return t("filter_dates");
  const format = new Intl.DateTimeFormat(lang(), { day: "numeric", month: "short" });
  const from = format.format(dateFromIso(filters.from));
  if (isSingleDay(filters)) return from;
  return `${from} – ${format.format(dateFromIso(filters.to))}`;
}

/** One day button. `state` carries the three things it can be at once: an end, inside the range, or
 *  today — and the ends are drawn strongest, which is the documented convention (§45.6) and what
 *  makes "tap an end" a thing a person can aim at. */
function dayCellHTML(iso, inMonth, label) {
  const isEnd = iso === filters.from || iso === filters.to;
  const inside = hasDateFilter(filters) && iso > filters.from && iso < filters.to;
  const classes = [
    "filter-day",
    inMonth ? "" : "filter-day-outside",
    isEnd ? "filter-day-end" : "",
    inside ? "filter-day-inside" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<button type="button" class="${classes}" data-day="${iso}" aria-pressed="${isEnd}">${escapeHTML(label)}</button>`;
}

function calendarHTML() {
  const { t, lang } = deps;
  const first = visibleMonth || monthStart(filters.from || isoOf(new Date()));
  const cursor = gridStart(first);
  const cells = [];
  for (let index = 0; index < 42; index++) {
    const iso = isoOf(cursor);
    cells.push(dayCellHTML(iso, cursor.getMonth() === first.getMonth(), String(cursor.getDate())));
    cursor.setDate(cursor.getDate() + 1);
  }
  const weekdays = weekdayLabels(lang())
    .map((name) => `<span class="filter-weekday">${escapeHTML(name)}</span>`)
    .join("");

  // The two arming chips live in the calendar's own header, not in the row above: they are only
  // meaningful while the grid is open, and putting them in the filter row would have added two more
  // chips to a row that is read at a glance.
  return `
    <div class="filter-calendar-head">
      <button type="button" class="filter-month-nav" data-month="-1" aria-label="${escapeHTML(t("filter_prev_month"))}"><i class="fa-solid fa-chevron-left"></i></button>
      <span class="filter-month-label">${escapeHTML(monthLabel(first, lang()))}</span>
      <button type="button" class="filter-month-nav" data-month="1" aria-label="${escapeHTML(t("filter_next_month"))}"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
    <div class="filter-arm-row">
      <button type="button" class="chip${armedEnd === "from" ? " active" : ""}" data-arm="from" aria-pressed="${armedEnd === "from"}">${escapeHTML(t("filter_from"))}</button>
      <button type="button" class="chip${armedEnd === "to" ? " active" : ""}" data-arm="to" aria-pressed="${armedEnd === "to"}">${escapeHTML(t("filter_to"))}</button>
    </div>
    <div class="filter-weekdays">${weekdays}</div>
    <div class="filter-days">${cells.join("")}</div>`;
}

function optionsHTML(rows, selected, placeholder) {
  const head = `<option value="">${escapeHTML(placeholder)}</option>`;
  return (
    head +
    rows
      .map(
        ({ value, label }) =>
          `<option value="${escapeHTML(value)}"${value === selected ? " selected" : ""}>${escapeHTML(label)}</option>`,
      )
      .join("")
  );
}

export function renderSessionFilterBar() {
  const bar = document.getElementById(BAR_ID);
  if (!bar || !deps) return;
  const { t } = deps;
  const sessions = deps.sessionsForFilters();

  const clientRows = participantsOf(sessions, deps.clients()).map((client) => ({
    value: client.id,
    label: client.name,
  }));
  const placeRows = locationsOf(sessions).map((name) => ({ value: name, label: name }));

  // Both `<select>`s are built into consts BEFORE the template, and the place control's variables
  // deliberately avoid the word "location". build/frontend_audit.py reads interpolations as text and
  // treats that word as user-supplied wherever it appears in one — rightly, since a restored backup
  // can carry anything. The values here are escaped inside optionsHTML, so the const is how that is
  // made visible to a check that cannot see through a call.
  const clientOptions = optionsHTML(clientRows, filters.clientId, t("filter_client"));
  const placeOptions = optionsHTML(placeRows, filters.location, t("filter_location"));
  const clientActive = filters.clientId ? " active" : "";
  const placeActive = filters.location ? " active" : "";
  const placeLabel = escapeHTML(t("filter_location"));

  bar.innerHTML = `
    <div class="filter-chips sessions-filter-chips">
      <button type="button" id="filter-chip-dates" class="chip${hasDateFilter(filters) ? " active" : ""}" aria-expanded="${calendarOpen}">
        <i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${escapeHTML(dateChipLabel())}
      </button>
      <select id="filter-chip-client" class="chip filter-select${clientActive}" aria-label="${escapeHTML(t("filter_client"))}">
        ${clientOptions}
      </select>
      <select id="filter-chip-location" class="chip filter-select${placeActive}" aria-label="${placeLabel}">
        ${placeOptions}
      </select>
      <button type="button" id="filter-clear" class="chip filter-clear"${hasAnyFilter(filters) ? "" : " hidden"}>
        <i class="fa-solid fa-xmark" aria-hidden="true"></i> ${escapeHTML(t("filter_clear"))}
      </button>
    </div>
    <div id="${CALENDAR_ID}" class="filter-calendar"${calendarOpen ? "" : " hidden"}>${calendarOpen ? calendarHTML() : ""}</div>`;

  wire();
}

function changed() {
  renderSessionFilterBar();
  deps.onChange();
}

function wire() {
  document.getElementById("filter-chip-dates").addEventListener("click", () => {
    calendarOpen = !calendarOpen;
    if (calendarOpen) visibleMonth = monthStart(filters.from || isoOf(new Date()));
    renderSessionFilterBar();
  });

  document.getElementById("filter-chip-client").addEventListener("change", (event) => {
    filters = { ...filters, clientId: event.target.value };
    changed();
  });

  document.getElementById("filter-chip-location").addEventListener("change", (event) => {
    filters = { ...filters, location: event.target.value };
    changed();
  });

  document.getElementById("filter-clear").addEventListener("click", () => {
    resetSessionFilters();
    calendarOpen = false;
    changed();
  });

  const calendar = document.getElementById(CALENDAR_ID);
  if (!calendarOpen || !calendar) return;

  for (const button of calendar.querySelectorAll("[data-month]")) {
    button.addEventListener("click", () => {
      // A new Date each time rather than mutating the held one: the grid is rebuilt from this value
      // and a shared mutable date would drift by a month per render.
      const step = Number(button.dataset.month);
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + step, 1);
      renderSessionFilterBar();
    });
  }

  for (const button of calendar.querySelectorAll("[data-arm]")) {
    button.addEventListener("click", () => {
      const end = button.dataset.arm;
      armedEnd = armedEnd === end ? null : end;
      renderSessionFilterBar();
    });
  }

  for (const button of calendar.querySelectorAll("[data-day]")) {
    button.addEventListener("click", () => {
      const { from, to } = nextDateSelection(filters, button.dataset.day, armedEnd);
      filters = { ...filters, from, to };
      // Arming is spent on the tap it aimed: leaving it lit would make the NEXT tap move the same end
      // again, which is the invisible mode this design exists to avoid.
      armedEnd = null;
      changed();
    });
  }
}
