// src/modules/common/dateField.js
// The app's one control for entering a day, in place of `<input type="date">`.
//
// **The same defect as the time field, on the other axis.** The browser draws a date input in the
// PHONE's language: the twelfth of September 2026 appears as 09/12/2026 on a device set to English
// (US) and as 12.09.2026 on one set to Slovenian, from the same stored value. Day-first or
// month-first is not a matter of taste here — read the wrong way round, a session lands three months
// away and nothing on screen says so.
//
// **The format is ISO, in every language** (ruled 2026-09-12): 2026-09-12. It is what the app
// already stores, what its own URLs carry (`/sessions/2026-09-12`), and the one written form that
// means the same thing in every country. The field therefore SHOWS exactly what it holds.
//
// Three ways in, the same three as the time field:
//   1. **Type digits** — "20260912" is the twelfth of September. Four digits are a month and a day
//      in the year already shown, and two are a day in the month already shown, so the common edit
//      ("same week, Thursday instead") is two keystrokes rather than eight.
//   2. **Tap a day** — today, tomorrow, and the two days after them by name. A gym is booked for
//      this week far more often than for next spring.
//   3. **Step one day** with the arrows.
//
// **No month grid.** A date further out is typed, and the app already owns one calendar — the
// board's filter range in `modules/sessionList/sessionFilterBar.js` — so if a picker is ever wanted
// here, the honest move is to lift THAT one out rather than write a second.
//
// The wrapper, the arrows and the mark row belong to steppedField.js, shared with the time field.

import { SteppedField, mountSteppedField } from "./steppedField.js";
import { getISODateString } from "./utils.js";

const MARK_COUNT = 4;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** An ISO day as a local Date at midnight, or null if it is not one. Parsed by hand rather than by
 * `new Date(iso)`, which reads a bare "2026-09-12" as UTC and so lands on the day before in every
 * timezone west of Greenwich. */
export function isoToDate(value) {
  const parsed = ISO_DATE.exec(String(value || "").trim());
  if (!parsed) return null;
  const [year, month, day] = parsed.slice(1).map((part) => parseInt(part, 10));
  if (month < 1 || month > 12 || day < 1) return null;
  const date = new Date(year, month - 1, day);
  // Rejects the 31st of a 30-day month, which JavaScript would otherwise roll forward in silence.
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/** Digits as typed, read against the day the field is already showing (`reference`, an ISO day):
 *   "20260912" → 2026-09-12   the whole date
 *   "0912"     → 12 September of the year already shown
 *   "12"       → the 12th of the month already shown
 * A day past the end of its month is clamped to the last one, and a month past 12 to December, so a
 * slipped finger still leaves a real day rather than emptying the field. */
export function dateFromDigits(digits, reference) {
  const d = String(digits || "").replace(/\D/g, "");
  if (!d) return "";
  const base = isoToDate(reference) || new Date();
  const pad = (n, width) => String(n).padStart(width, "0");

  let year = base.getFullYear();
  let month = base.getMonth() + 1;
  let day = base.getDate();
  if (d.length <= 2) {
    day = parseInt(d, 10);
  } else if (d.length <= 4) {
    month = parseInt(d.slice(0, 2), 10);
    day = parseInt(d.slice(2), 10) || 1;
  } else {
    year = parseInt(d.slice(0, 4), 10);
    month = parseInt(d.slice(4, 6), 10) || 1;
    day = parseInt(d.slice(6, 8), 10) || 1;
  }

  month = Math.min(12, Math.max(1, month));
  day = Math.min(daysInMonth(year, month), Math.max(1, day));
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

export function normalizeDateEntry(raw, reference) {
  const digits = String(raw || "")
    .replace(/\D/g, "")
    .slice(0, 8);
  return dateFromDigits(digits, reference);
}

/** `count` days from `fromIso` inclusive, forward (`step` 1) or back (-1).
 *
 * Today comes first either way. Which direction a field runs is not decoration: a session is booked
 * for a day that has not happened, and a consent was given on one that has — a row of future days on
 * a consent date is four taps that are all wrong. */
export function dayMarks(fromIso, count = MARK_COUNT, step = 1) {
  const start = isoToDate(fromIso);
  if (!start) return [];
  return Array.from({ length: Math.max(0, count) }, (_, index) =>
    getISODateString(start.getTime() + index * step * MS_PER_DAY),
  );
}

class DateField extends SteppedField {
  constructor(input, options = {}) {
    super(input, options);
    this.configure(options);
  }

  /** `lang` names the weekdays on the two far marks. Passed in rather than read from a store: this
   * module has no business knowing where the app keeps its language, and a mount happens again on
   * every open, so a switch mid-session is picked up anyway.
   *
   * `past: true` turns the marks around for a field that records something that HAS happened — a
   * consent given, an erasure asked for. `marks: false` leaves a field with none at all. */
  configure({ lang = "en", past = false, marks = true } = {}) {
    this.lang = lang;
    this.past = past;
    this.showMarks = marks;
  }

  get maxLength() {
    return 10;
  }

  get kindClass() {
    return "stepped-field--date";
  }

  get arrowLabelKeys() {
    return { later: "date_field_later", earlier: "date_field_earlier" };
  }

  markLabel(mark) {
    return this.label("date_field_set").replace("{date}", mark.value);
  }

  today() {
    return getISODateString(Date.now());
  }

  normalize(raw) {
    return normalizeDateEntry(raw, this.settledValue);
  }

  // Only a whole date settles while typing. A shorter entry is finished when the field is left,
  // because "12" is a complete instruction ("the 12th of this month") and also the first half of
  // "1209" — acting on it mid-word would move the field under the next keystroke.
  liveValue(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length === 8 ? dateFromDigits(digits, this.settledValue) : null;
  }

  stepped(value, direction) {
    const base = isoToDate(value) || isoToDate(this.today());
    return getISODateString(base.getTime() + direction * MS_PER_DAY);
  }

  // Named days rather than four ISO strings: a row of dates a trainer has to decode is no faster
  // than typing one. The first two are said in words because that is what they are called; the rest
  // carry the weekday and the day number, which is how the next week is spoken about on a gym floor.
  marks() {
    if (!this.showMarks) return [];
    const locale = this.lang === "sl" ? "sl-SI" : "en-GB";
    const nextKey = this.past ? "date_field_yesterday" : "date_field_tomorrow";
    return dayMarks(this.today(), MARK_COUNT, this.past ? -1 : 1).map((value, index) => {
      if (index === 0) return { value, label: this.label("date_field_today") };
      if (index === 1) return { value, label: this.label(nextKey) };
      const date = isoToDate(value);
      const weekday = date.toLocaleDateString(locale, { weekday: "short" });
      return { value, label: `${weekday} ${date.getDate()}.` };
    });
  }
}

export function mountDateField(input, options = {}) {
  return mountSteppedField(DateField, input, options);
}
