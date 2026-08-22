// src/modules/session/sessionRepeatControls.js — the "repeats every week" half of the session form
// (TODO §35.3a).
//
// Single responsibility: the weekday toggles, the reveal, and reading the form back as a series.
// The rule itself is domain/sessionSeries.js, and writing anything is the form controller's job —
// this module builds no records into state and knows nothing about saving.
//
// **The day the session is on is ticked by default.** A trainer who says "this repeats" almost
// always means "this, again": asking them to also name today's weekday is asking them to restate
// what they already filled in, and a rule with no days silently produces nothing.
//
// **Weekday labels come from the browser's own calendar**, in the language the app is showing, so
// nothing here carries seven translated day names that would drift from the dates beside them.
//
// Injected dependencies: `doc` (defaults to `document`) and `t`.

const REPEAT_ID = "setup-repeat";
const DETAIL_ID = "setup-repeat-detail";
const DAYS_ID = "setup-repeat-days";
const UNTIL_ID = "setup-repeat-until";

/** The seven weekday buttons, in the order a week is read — built from the browser's calendar so
 * they arrive in the app's current language. `value` is JavaScript's own day number, which is what
 * domain/sessionSeries.js works in. */
function buildWeekdayToggles(doc, lang) {
  const container = doc.getElementById(DAYS_ID);
  if (!container || container.childElementCount > 0) return container;
  const format = new Intl.DateTimeFormat(lang || undefined, { weekday: "short" });
  for (let dayNumber = 1; dayNumber <= 7; dayNumber += 1) {
    const day = dayNumber % 7; // Monday first on screen; 0 (Sunday) lands at the end.
    // A real 2026 week, only ever used to ask the calendar what that weekday is called.
    const sample = new Date(2026, 0, 4 + day);
    const label = doc.createElement("label");
    label.className = "setup-repeat-day";
    const input = doc.createElement("input");
    input.type = "checkbox";
    input.dataset.weekday = String(day);
    const text = doc.createElement("span");
    text.textContent = format.format(sample);
    label.append(input, text);
    container.appendChild(label);
  }
  return container;
}

/** Which weekdays are ticked, as JavaScript day numbers. */
export function selectedWeekdays(doc = document) {
  return [...doc.querySelectorAll(`#${DAYS_ID} input[data-weekday]`)]
    .filter((input) => input.checked)
    .map((input) => Number(input.dataset.weekday));
}

function setWeekdays(doc, weekdays) {
  for (const input of doc.querySelectorAll(`#${DAYS_ID} input[data-weekday]`)) {
    input.checked = weekdays.includes(Number(input.dataset.weekday));
  }
}

/** Wires the toggle and the weekday buttons. Called once, when the form is set up. */
export function setupRepeatControls({ doc = document, lang = "en" } = {}) {
  const toggle = doc.getElementById(REPEAT_ID);
  const detail = doc.getElementById(DETAIL_ID);
  if (!toggle || !detail) return;
  buildWeekdayToggles(doc, lang);

  const sync = () => {
    detail.classList.toggle("hidden", !toggle.checked);
    // Ticking the box with no day chosen would arm a rule that produces nothing at all, so the
    // session's own day is filled in the moment the trainer says "repeats".
    if (toggle.checked && selectedWeekdays(doc).length === 0) {
      const dateValue = doc.getElementById("setup-session-date")?.value;
      if (dateValue) {
        const [year, month, day] = dateValue.split("-").map(Number);
        setWeekdays(doc, [new Date(year, (month || 1) - 1, day || 1).getDay()]);
      }
    }
  };
  toggle.addEventListener("change", sync);
  sync();
}

/** Puts the controls back to "one-off", which is what a fresh form means. */
export function resetRepeatControls(doc = document) {
  const toggle = doc.getElementById(REPEAT_ID);
  if (toggle) toggle.checked = false;
  const until = doc.getElementById(UNTIL_ID);
  if (until) until.value = "";
  setWeekdays(doc, []);
  doc.getElementById(DETAIL_ID)?.classList.add("hidden");
}

/** The series the form describes, or null when this is an ordinary one-off session.
 *
 * `id` is supplied rather than generated here, so the caller keeps the one place ids come from.
 */
export function readRepeatFields({ doc = document, id, session } = {}) {
  const toggle = doc.getElementById(REPEAT_ID);
  if (!toggle?.checked) return null;
  const weekdays = selectedWeekdays(doc);
  if (weekdays.length === 0) return null;
  return {
    id,
    title: session.title,
    startDate: session.sessionDate,
    until: doc.getElementById(UNTIL_ID)?.value || "",
    time: session.timeLabel,
    weekdays,
    location: session.location,
    participants: session.participants,
    routineId: session.routineId,
    maxCapacity: session.participants.length,
  };
}
