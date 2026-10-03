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

// Day, month, optionally a year, with ".", "/" or "-" between and optional spaces: "6.10.2026",
// "06. 10. 2026", "6/10/2026", "6.10." (the year already on screen). The year is four digits; a
// two-digit year is refused rather than guessed.
const DOTTED_DATE = /^(\d{1,2})\s*[./-]\s*(\d{1,2})(?:\s*[./-]\s*(\d{4})?)?\.?$/;
// A separator anywhere, unless the entry starts with a four-digit year (an ISO day, handled as digits).
const HAS_SEPARATOR = /[./-]/;
const STARTS_WITH_YEAR = /^\d{4}(?!\d)\s*[./-]|^\d{5,}/;

/** A day written the way it is spoken in Slovenia, Germany and most of Europe (day first), read as
 * ISO. Returns "" when the entry is not written with separators at all (the digit rules apply),
 * and null when it is written that way but is not a real day: "31.2.2026", "6.10.26", "6.13.2026".
 * Never another date: the digit rules clamp, which is right for a slipped finger on eight digits and
 * wrong for a day and month that were typed apart on purpose. */
export function dateFromDotted(raw, reference) {
  const text = String(raw || "").trim();
  // An ISO day written out with dashes: a real one is left to the digit rules, one that does not
  // exist ("2026-02-31") is refused like "31.2.2026".
  if (ISO_DATE.test(text)) return isoToDate(text) ? "" : null;
  if (!HAS_SEPARATOR.test(text) || STARTS_WITH_YEAR.test(text)) return "";
  const parsed = DOTTED_DATE.exec(text);
  if (!parsed) return null;
  const year = parsed[3]
    ? parseInt(parsed[3], 10)
    : (isoToDate(reference) || new Date()).getFullYear();
  const month = parseInt(parsed[2], 10);
  const day = parseInt(parsed[1], 10);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function normalizeDateEntry(raw, reference) {
  const dotted = dateFromDotted(raw, reference);
  if (dotted !== "") return dotted === null ? "" : dotted;
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

  // Ten for "2026-10-06", room for "06. 10. 2026" with its spaces.
  get maxLength() {
    return 12;
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
    this.input.setCustomValidity("");
    if (dateFromDotted(raw, this.settledValue) !== "") return null;
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length === 8 ? dateFromDigits(digits, this.settledValue) : null;
  }

  // Eight digits name one day outright. When that day does not exist the field has moved it to a
  // real one (see dateFromDigits), and it says so: 2027-02-29 becoming 2027-02-28 in silence is a
  // client invited for a day nobody chose.
  noteFor(raw, value) {
    if (dateFromDotted(raw, this.settledValue) !== "") return "";
    const digits = String(raw || "").replace(/\D/g, "");
    if (digits.length !== 8) return "";
    const typed = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    if (typed === value) return "";
    return this.label("date_field_moved").replace("{typed}", typed).replace("{date}", value);
  }

  // A day and month typed apart that are not a real day are refused, not moved: the text stays in
  // the field, the note says what is wrong, and the form cannot be sent with it.
  settle() {
    const raw = this.input.value;
    this.input.setCustomValidity("");
    if (dateFromDotted(raw, this.settledValue) === null) {
      const message = this.label("date_field_invalid").replace("{typed}", raw.trim());
      this.input.setCustomValidity(message);
      this.showNote(message);
      return;
    }
    super.settle();
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
    const locale = { sl: "sl-SI", de: "de-DE" }[this.lang] || "en-GB";
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
