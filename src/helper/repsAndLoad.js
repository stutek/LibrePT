// src/helper/repsAndLoad.js — helpers for the reps and load of a set (format / parse / derive).
// Reps and load are polymorphic: a set is not always "3 sets × 10 reps × 40 kg".
//   • Reps can be a count (10), a range ("8-12"), time/holds ("30s"), or to-failure ("max").
//     "max" is the engine's failure token — the superset card renders a Fail-Reps stepper for it.
//   • Load depends on the movement's equipment: kilograms for free weights/machines, a stack
//     LEVEL for cables, a resistance BAND label, or bodyweight (± added kg). We keep the raw
//     `weight`/`weightTarget` value as authored and derive its meaning from equipment at render time.

export const REPS_PRESETS = ["8", "10", "12", "15", "max"];
export const BAND_LEVELS = ["Light", "Medium", "Heavy"];

// Equipment → how its load is expressed. Anything unlisted (incl. Barbell/Dumbbell/Machine) is kg.
const LOAD_UNIT_BY_EQUIPMENT = {
  Cable: "level",
  Band: "band",
  Bodyweight: "bw",
};

export function loadUnitForEquipment(equipment) {
  return LOAD_UNIT_BY_EQUIPMENT[equipment] || "kg";
}

// A reps token is "to failure" when it reads as the engine's max/failure marker.
export function isFailureReps(reps) {
  const s = String(reps ?? "").trim().toLowerCase();
  return s === "max" || s === "f" || s === "amrap";
}

// Parse an authored reps value: a pure number becomes a Number; tokens ("max", "8-12", "30s")
// stay strings. Empty falls back to a sensible default.
export function parseReps(raw) {
  const s = String(raw ?? "").trim();
  if (s === "") return 10;
  return /^\d+$/.test(s) ? Number(s) : s;
}

// Parse an authored load value: numeric strings become a Number (kg / stack level / added-bw);
// a non-numeric value (a band label like "Medium") stays a string; empty becomes 0.
export function parseLoad(raw) {
  const s = String(raw ?? "").trim();
  if (s === "") return 0;
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? s : n;
}

// Display string for a reps value. Numbers/ranges/time pass through; failure shows "Max".
export function formatReps(reps) {
  if (reps === null || reps === undefined || reps === "") return "—";
  if (isFailureReps(reps)) return "Max";
  return String(reps);
}

// True when a load value should be shown at all (bodyweight always shows "BW").
export function hasLoad(value, unit) {
  if (unit === "bw") return true;
  if (unit === "band") return value !== "" && value !== null && value !== undefined;
  return Number.parseFloat(value) > 0;
}

// Display string for a load value given its unit. Returns "" when there is nothing to show.
export function formatLoad(value, unit = "kg") {
  const num = Number.parseFloat(value);
  switch (unit) {
    case "band":
      return value ? String(value) : "";
    case "level":
      return num > 0 ? `Lvl ${num}` : "";
    case "bw":
      return num > 0 ? `BW+${num}kg` : "BW";
    default:
      return num > 0 ? `${num} kg` : "";
  }
}

// Split a load into { value, label } for a stat tile (value on top, unit beneath).
export function loadParts(value, unit = "kg") {
  const num = Number.parseFloat(value);
  switch (unit) {
    case "band":
      return { value: value ? String(value) : "—", label: "Band" };
    case "level":
      return { value: num > 0 ? String(num) : "—", label: "Level" };
    case "bw":
      return num > 0 ? { value: `+${num}`, label: "kg (BW)" } : { value: "BW", label: "Bodyweight" };
    default:
      return { value: num > 0 ? String(num) : "—", label: "kg" };
  }
}

// Short unit label + input hint for authoring controls, keyed by load unit.
export function loadFieldMeta(unit) {
  switch (unit) {
    case "band":
      return { label: "Band", kind: "band" };
    case "level":
      return { label: "Level", kind: "number", placeholder: "Lvl", step: "1", min: "0" };
    case "bw":
      return { label: "+kg (BW)", kind: "number", placeholder: "BW", step: "0.5", min: "0" };
    default:
      return { label: "kg", kind: "number", placeholder: "kg", step: "0.5", min: "0" };
  }
}

// Single source of truth for the equipment-aware load INPUT markup, shared by every authoring
// surface (routine builder, live clipboard editor). Returns a <select> of band strengths for
// band equipment, otherwise a numeric field (kg / stack level / added bodyweight). The caller
// passes `cls` (kept stable so its change-binding still matches) and its own `escapeHTML`.
export function loadInputHTML({ unit, value, cls, escapeHTML, ariaLabel = "Load" }) {
  if (unit === "band") {
    const opts = BAND_LEVELS.map(
      (l) => `<option value="${l}" ${String(value) === l ? "selected" : ""}>${l}</option>`,
    ).join("");
    return `<select class="${cls}" aria-label="${ariaLabel}"><option value="">Band</option>${opts}</select>`;
  }
  const meta = loadFieldMeta(unit);
  const v = value === "" || value === undefined || value === null ? "" : value;
  return `<input type="number" min="${meta.min}" step="${meta.step}" placeholder="${meta.label}" class="${cls}" value="${escapeHTML(String(v))}" aria-label="${ariaLabel}">`;
}
