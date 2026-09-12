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
// and test reads it exactly as before (`page.fill("#setup-start-time", "17:30")` still works). This
// module only puts controls around it and normalises what is typed into it.
//
// deps: `t` per mount — every control here is a glyph or a bare number, so each one carries a
// spoken label rather than a shape alone.

import { clockToMinutes, nextClockMarks } from "../../domain/timeRange.js";
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

// Every programmatic write announces itself, because the form around this field listens: the draft
// autosave, the double-booking readout, and the rule that moves the end time when the start moves
// all hang off `input`/`change` on this very element.
function writeValue(input, value) {
  if (input.value === value) return;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function stepBy(input, deltaMinutes, anchorClock) {
  const base = clockToMinutes(input.value) ?? clockToMinutes(anchorClock()) ?? 0;
  writeValue(input, clockFromMinutes(base + deltaMinutes));
}

function makeButton(className, label) {
  const button = document.createElement("button");
  // Inside a form, and a button with no type submits it — here that would save the session on the
  // way to picking its time.
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  return button;
}

function makeGlyphButton(className, label, glyph) {
  const button = makeButton(className, label);
  const icon = document.createElement("i");
  icon.className = `fa-solid ${glyph}`;
  button.appendChild(icon);
  return button;
}

function buildChrome(input) {
  const wrap = document.createElement("div");
  wrap.className = "time-field";
  input.parentNode.insertBefore(wrap, input);

  const dial = document.createElement("div");
  dial.className = "time-field-dial";
  wrap.appendChild(dial);
  dial.appendChild(input);

  const steps = document.createElement("div");
  steps.className = "time-field-steps";
  dial.appendChild(steps);

  const marks = document.createElement("div");
  marks.className = "time-field-marks";
  wrap.appendChild(marks);

  return { wrap, steps, marks };
}

/** Turn `input` into the app's time field: 24-hour, typed or tapped, never AM/PM.
 *
 * `anchorInput` is the field the marks are counted from — the start field for an end field. With
 * none, they are counted from the clock, and recounted whenever the field is reached for, so a form
 * left open over a break does not offer times that have passed. */
export function mountTimeField(input, { t, anchorInput = null } = {}) {
  if (!input) return;
  const label = (key) => (typeof t === "function" ? t(key) : key);
  const anchorClock = () =>
    anchorInput && clockToMinutes(anchorInput.value) !== null
      ? anchorInput.value
      : formatClockFromEpoch(Date.now());

  const mounted = input.closest(".time-field");
  const { wrap, steps, marks } = mounted
    ? {
        wrap: mounted,
        steps: mounted.querySelector(".time-field-steps"),
        marks: mounted.querySelector(".time-field-marks"),
      }
    : buildChrome(input);

  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.maxLength = 5;

  // The four chips are built ONCE and only their text is re-read afterwards. Rebuilding them was a
  // control that ignored the first tap: `focusin` fires on the way down, so the chip a finger had
  // already landed on was removed from the page before the tap could complete, and nothing happened
  // until the field was tapped a second time.
  const renderMarks = () => {
    const values = nextClockMarks(anchorClock(), MARK_COUNT);
    for (const [index, chip] of [...marks.children].entries()) {
      const mark = values[index] || "";
      chip.textContent = mark;
      chip.setAttribute("aria-label", label("time_field_set").replace("{time}", mark));
      chip.hidden = !mark;
    }
  };

  if (!mounted) {
    for (let index = 0; index < MARK_COUNT; index += 1) {
      const chip = makeButton("time-field-mark", "");
      // Reads its own face at the moment it is tapped: the clock moves under a form left open, and a
      // chip that set the time it was BUILT with would quietly set a time it no longer shows.
      chip.addEventListener("click", () => writeValue(input, chip.textContent));
      marks.appendChild(chip);
    }

    const later = makeGlyphButton("time-field-step", label("time_field_later"), "fa-chevron-up");
    later.addEventListener("click", () => stepBy(input, MINUTE_STEP, anchorClock));
    const earlier = makeGlyphButton(
      "time-field-step",
      label("time_field_earlier"),
      "fa-chevron-down",
    );
    earlier.addEventListener("click", () => stepBy(input, -MINUTE_STEP, anchorClock));
    steps.append(later, earlier);

    // Select on focus: a tap means "I am setting this time", not "let me edit its third digit".
    input.addEventListener("focus", () => input.select());
    // While four digits are still arriving the field holds what was typed; the moment the fourth
    // lands it is a time. Typing into a field already holding "17:30" starts over, because the
    // focus handler selected it.
    input.addEventListener("input", () => {
      const digits = input.value.replace(/\D/g, "");
      // Through writeValue, not a bare assignment: the listeners that pair the end time to the start
      // one have ALREADY seen this keystroke, and what they saw was "1730" — four digits, not a time
      // they can read. Without a second event carrying the finished value, the end of the slot stays
      // where it was and the trainer's 90-minute session silently becomes a 15-minute one.
      // Re-entrant by one round only: the value it writes is already normalised, so the next pass
      // finds nothing to change.
      if (digits.length === 4) writeValue(input, clockFromDigits(digits));
    });
    // Leaving the field settles whatever is in it — including three digits, which are a time this
    // module can read but `parseTimeRange` cannot.
    const settle = () => {
      const settled = normalizeClockEntry(input.value);
      if (settled && settled !== input.value) writeValue(input, settled);
    };
    input.addEventListener("blur", settle);
    // Enter submits the form from inside the field, so the value has to be a time before it does.
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") settle();
    });
    // The marks are the next half hours from NOW; the clock moves while the form is open.
    wrap.addEventListener("focusin", renderMarks);
    anchorInput?.addEventListener("input", renderMarks);
  } else {
    for (const [index, key] of ["time_field_later", "time_field_earlier"].entries()) {
      steps.children[index]?.setAttribute("aria-label", label(key));
    }
  }

  renderMarks();
}
