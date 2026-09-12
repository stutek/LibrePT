// src/modules/common/steppedField.js
// The chrome both of the app's own entry fields wear: a big monospaced value, a pair of arrows that
// move it one unit, and a row of four marks that set it outright.
//
// **Why the app draws these at all.** `<input type="time">` and `<input type="date">` render in the
// PHONE's language, not the app's, and no attribute overrides it — LibrePT in Slovenian on a phone
// set to English (US) asked for "5:30 PM" and showed 09/12/2026 for the twelfth of September.
// AGENT_RULES.md settles it: the format is the app's decision, never the device's.
//
// **One base class, not two copies.** The time field came first and the date field arrived two hours
// later wanting the same wrapper, the same arrows, the same mark row and the same "a tap selects
// what is there, so typing replaces it" rule. What actually differs between them is four questions,
// and those are the four a subclass answers: how digits are read, how one step moves the value, what
// the four marks are, and what to call the arrows out loud.
//
// **The `<input>` stays THE value** in both: same id, same `required`, same canonical string
// ("HH:MM", "YYYY-MM-DD"). Every caller, draft and test reads it exactly as before.
//
// deps: `t` per mount — every control here is a glyph or a bare number, so each carries a spoken
// label rather than a shape alone.

const MARK_COUNT = 4;

// One field per input element, so a second mount re-labels and re-marks the control that is already
// there instead of building another one beside it.
const mountedFields = new WeakMap();

function makeButton(className, label) {
  const button = document.createElement("button");
  // Inside a form, and a button with no type submits it — here that would save the session on the
  // way to picking its date.
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

export class SteppedField {
  constructor(input, { t } = {}) {
    this.input = input;
    this.t = t;
  }

  label(key) {
    return typeof this.t === "function" ? this.t(key) : key;
  }

  // ── What a subclass answers ──────────────────────────────────────────────────────────────────
  /** Longest the canonical value can be, so the field cannot hold more than one. */
  get maxLength() {
    return 10;
  }

  /** What the field settles on when it is left: the canonical value, or "" for an empty field. */
  normalize(_raw) {
    return "";
  }

  /** What to write WHILE typing, or null to leave what was typed alone until the field is left. */
  liveValue(_raw) {
    return null;
  }

  /** The value one step later (`direction` 1) or earlier (-1). */
  stepped(_value, _direction) {
    return "";
  }

  /** Up to four `{ value, label }` marks — the values a tap sets outright. */
  marks() {
    return [];
  }

  /** A modifier class on the wrapper, so the stylesheet can size a ten-character date differently
   * from a five-character time without either one knowing about the other. */
  get kindClass() {
    return "stepped-field--plain";
  }

  /** i18n keys for the two arrows, which say what a step DOES rather than which way it points. */
  get arrowLabelKeys() {
    return { later: "stepped_field_later", earlier: "stepped_field_earlier" };
  }

  /** The spoken label of one mark ("Set 17:30"). */
  markLabel(mark) {
    return this.label("stepped_field_set").replace("{value}", mark.label);
  }

  // ── The parts that are the same for every field ──────────────────────────────────────────────
  /** Write a value and say so: the form around the field listens for `input`/`change` — the draft
   * autosave, the double-booking readout, and the rule that moves an end time when a start moves. */
  write(value) {
    if (this.input.value === value) return;
    this.settledValue = value;
    this.input.value = value;
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
    this.input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  step(direction) {
    this.write(this.stepped(this.input.value, direction));
  }

  settle() {
    const settled = this.normalize(this.input.value);
    if (settled && settled !== this.input.value) this.write(settled);
  }

  build() {
    const input = this.input;
    const wrap = document.createElement("div");
    wrap.className = `stepped-field ${this.kindClass}`;
    input.parentNode.insertBefore(wrap, input);

    const row = document.createElement("div");
    row.className = "stepped-field-row";
    wrap.appendChild(row);
    row.appendChild(input);

    const steps = document.createElement("div");
    steps.className = "stepped-field-steps";
    row.appendChild(steps);

    const marks = document.createElement("div");
    marks.className = "stepped-field-marks";
    wrap.appendChild(marks);

    this.wrap = wrap;
    this.marksRow = marks;
    this.stepButtons = [
      makeGlyphButton("stepped-field-step", "", "fa-chevron-up"),
      makeGlyphButton("stepped-field-step", "", "fa-chevron-down"),
    ];
    steps.append(...this.stepButtons);

    // The marks are built ONCE and only their text is re-read afterwards. Rebuilding them was a
    // control that ignored the first tap: `focusin` fires on the way down, so the mark a finger had
    // already landed on was removed from the page before the tap could complete, and nothing
    // happened until the field was tapped a second time.
    for (let index = 0; index < MARK_COUNT; index += 1) {
      const chip = makeButton("stepped-field-mark", "");
      // Reads its own value at the moment it is tapped: the clock and the calendar move under a form
      // left open, and a mark that set what it was BUILT with would set what it no longer shows.
      chip.addEventListener("click", () => this.write(chip.dataset.value || ""));
      marks.appendChild(chip);
    }
  }

  bind() {
    const input = this.input;
    this.stepButtons[0].addEventListener("click", () => this.step(1));
    this.stepButtons[1].addEventListener("click", () => this.step(-1));

    // Select on focus: a tap means "I am setting this", not "let me edit its third digit".
    // The value is remembered first, because a field mid-entry no longer says what it held: the date
    // field reads "17" as a day in the month ON SCREEN, and by then the month is gone from the field.
    input.addEventListener("focus", () => {
      this.settledValue = input.value;
      input.select();
    });
    input.addEventListener("input", () => {
      const live = this.liveValue(input.value);
      // Through write(), not a bare assignment: the listeners that pair one field to another have
      // ALREADY seen this keystroke, and what they saw was the raw digits. Without a second event
      // carrying the finished value, whatever follows this field stays where it was.
      // Re-entrant by one round only — the value written is already finished, so the next pass finds
      // nothing to change.
      if (live !== null) this.write(live);
    });
    input.addEventListener("blur", () => this.settle());
    // Enter submits the form from inside the field, so the value has to be finished before it does.
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.settle();
    });
    // The marks are counted from now; the clock and the calendar move while the form is open.
    this.wrap.addEventListener("focusin", () => this.renderMarks());
  }

  renderMarks() {
    const values = this.marks();
    for (const [index, chip] of [...this.marksRow.children].entries()) {
      const mark = values[index];
      chip.textContent = mark ? mark.label : "";
      chip.dataset.value = mark ? mark.value : "";
      chip.setAttribute("aria-label", mark ? this.markLabel(mark) : "");
      chip.hidden = !mark;
    }
  }

  refresh() {
    const input = this.input;
    // Whatever the form has just put in the field is what a short entry will be read against.
    this.settledValue = input.value;
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.maxLength = this.maxLength;
    const keys = this.arrowLabelKeys;
    this.stepButtons[0].setAttribute("aria-label", this.label(keys.later));
    this.stepButtons[1].setAttribute("aria-label", this.label(keys.earlier));
    this.renderMarks();
  }
}

/** Put `FieldClass` around `input`, or re-label and re-mark the one already there.
 *
 * Mounting twice is the normal case, not an error: a dialog is re-opened, a view is re-rendered, and
 * the language may have changed in between. */
export function mountSteppedField(FieldClass, input, options = {}) {
  if (!input) return null;
  const existing = mountedFields.get(input);
  if (existing) {
    existing.t = options.t;
    existing.configure?.(options);
    existing.refresh();
    return existing;
  }
  const field = new FieldClass(input, options);
  mountedFields.set(input, field);
  field.build();
  field.bind();
  field.refresh();
  return field;
}
