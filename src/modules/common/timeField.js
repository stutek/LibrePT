// src/modules/common/timeField.js
// The app's one control for entering a time of day, in place of `<input type="time">`.
//
// **Why not the browser's own field.** Whether it draws 13:00 or 1:00 PM is decided by the PHONE's
// locale, not by the app's language, and no attribute overrides it: a trainer running the Slovenian
// app on a phone set to English (US) gets an AM/PM field in the middle of it. Twelve-hour entry also
// carries a mistake this app cannot afford — a session booked for 7 in the evening and saved as 7 in
// the morning. AGENT_RULES.md settles the general form: a time is ENTERED in 24-hour form
// everywhere, and the format is the app's decision rather than the device's.
//
// Three ways in, in the order a trainer on the gym floor reaches for them:
//   1. **Type four digits** — "1730" becomes 17:30. The field selects itself when tapped, so every
//      tap starts a fresh time and nobody has to place a caret between two digits on a phone.
//   2. **Tap a mark** — the next four half hours (domain/timeRange.js's `nextClockMarks`), counted
//      from the clock for a start field and from the start for an end field. Booking a session is
//      usually choosing "half past six", so this is one tap for the whole slot, and on the end field
//      the four marks are the four session lengths (30, 60, 90, 120 minutes).
//   3. **Step by five minutes**, hour carried — the correction that is neither of the other two.
//      One pair of arrows, not one per half of the clock: an hour's change is already one tap away
//      in the marks, and two pairs of arrows over a 5-character field is a row of controls too thin
//      to hit with a thumb.
//
// **The `<input>` stays THE value.** Same id, same `required`, still "HH:MM" — every caller, draft
// and test reads it exactly as before (`page.fill("#setup-start-time", "17:30")` still works).
//
// The wrapper, the arrows and the mark row belong to steppedField.js, shared with the date field.
// What lives here is the four answers that make this one a CLOCK: how digits are read, what one step
// moves, which marks are offered, and what the arrows are called out loud.

import { clockToMinutes, nextClockMarks } from "../../domain/timeRange.js";
import { SteppedField, mountSteppedField } from "./steppedField.js";
import { formatClockFromEpoch } from "./utils.js";

const MINUTE_STEP = 5;
const MARK_COUNT = 4;
const MINUTES_PER_DAY = 24 * 60;

function clockFromMinutes(total) {
  const wrapped = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

// Digits as typed, read the way a digital watch reads them: "9" is nine o'clock, "1730" is half past
// five in the afternoon. The half-typed cases are where the guessing lives, and both readings of a
// short entry have to land on a REAL time rather than empty the field:
//   "17"  → 17:00        two digits that are an hour are an hour
//   "93"  → 09:30        …and two that are not are an hour and a ten-minute mark
//   "173" → 17:30        three digits after a valid hour finish the ten-minute mark
//   "930" → 09:30        …and after an impossible one, they are the minutes
// Anything past 23:59 is clamped rather than refused, so a slipped finger still leaves a time.
export function clockFromDigits(digits) {
  const d = String(digits || "").replace(/\D/g, "");
  if (!d) return "";
  const pair = (a, b) => `${a}:${b}`;
  const clampHour = (n) => String(Math.min(23, n)).padStart(2, "0");
  const clampMinute = (n) => String(Math.min(59, n)).padStart(2, "0");
  const leadingHour = parseInt(d.slice(0, 2), 10);

  if (d.length === 1) return pair(`0${d}`, "00");
  if (d.length === 2) {
    return leadingHour <= 23 ? pair(d, "00") : pair(`0${d[0]}`, `${d[1]}0`);
  }
  if (d.length === 3) {
    return leadingHour <= 23
      ? pair(d.slice(0, 2), `${d[2]}0`)
      : pair(`0${d[0]}`, clampMinute(parseInt(d.slice(1), 10)));
  }
  return pair(clampHour(leadingHour), clampMinute(parseInt(d.slice(2, 4), 10)));
}

export function normalizeClockEntry(raw) {
  return clockFromDigits(
    String(raw || "")
      .replace(/\D/g, "")
      .slice(0, 4),
  );
}

class TimeField extends SteppedField {
  constructor(input, options = {}) {
    super(input, options);
    this.configure(options);
  }

  /** `anchorInput` is the field the marks are counted from — the start field, for an end field. With
   * none, they are counted from the clock and recounted whenever this field is reached for, so a
   * form left open over a break does not offer times that have already passed. */
  configure({ anchorInput = null } = {}) {
    this.anchorInput = anchorInput;
  }

  bind() {
    super.bind();
    // An end field's marks are counted from the start field, so they are recounted when the START
    // moves — not only when this field is reached for. Bound once, to the element named at mount:
    // nothing in the app swaps one field's anchor for another while it is on screen.
    this.anchorInput?.addEventListener("input", () => this.renderMarks());
  }

  get maxLength() {
    return 5;
  }

  get kindClass() {
    return "stepped-field--time";
  }

  get arrowLabelKeys() {
    return { later: "time_field_later", earlier: "time_field_earlier" };
  }

  markLabel(mark) {
    return this.label("time_field_set").replace("{time}", mark.label);
  }

  anchorClock() {
    const anchor = this.anchorInput?.value;
    return clockToMinutes(anchor) !== null ? anchor : formatClockFromEpoch(Date.now());
  }

  normalize(raw) {
    return normalizeClockEntry(raw);
  }

  // While four digits are still arriving the field holds what was typed; the moment the fourth lands
  // it is a time. Typing into a field already holding "17:30" starts over, because the focus handler
  // selected it.
  liveValue(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length === 4 ? clockFromDigits(digits) : null;
  }

  stepped(value, direction) {
    const base = clockToMinutes(value) ?? clockToMinutes(this.anchorClock()) ?? 0;
    return clockFromMinutes(base + direction * MINUTE_STEP);
  }

  marks() {
    return nextClockMarks(this.anchorClock(), MARK_COUNT).map((value) => ({ value, label: value }));
  }
}

export function mountTimeField(input, options = {}) {
  return mountSteppedField(TimeField, input, options);
}
