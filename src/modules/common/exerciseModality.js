// src/modules/common/exerciseModality.js — the exercise MODALITY axis: how a movement is LOGGED.
//
// Orthogonal to the structural item type (exercise / rest / superset) and to equipment-derived
// load. Modality decides which TARGET a movement is programmed and logged against (TODO §13.3 / §17.1):
//   • strength  — sets × reps × load                        (the default; every legacy exercise)
//   • isometric — a hold under load: hold-time + load        (weighted plank, wall sit, carry hold)
//   • cardio    — a conditioning effort: time | distance | calories | watts | pace | heartrate
//   • stretch   — a mobility hold measured in hold-time      (optionally per side)
//   • balance   — a stability hold measured in hold-time     (single-leg / BOSU work)
//   • agility   — a speed/coordination drill: time | distance | reps  (shuttle, ladder, cone drills)
// (hiit is reserved by §17.1 but has no distinct logging surface yet, so it is not a value here.)
//
// Like reps/load, the raw authored magnitude stays on the item (in its polymorphic `reps` field) and
// its MEANING is derived here at render time from the movement's modality + metric. No per-item unit is
// persisted, so routines / sessions / history need no migration — modality lives on the catalog entry
// and is looked up alongside equipment, exactly as loadUnitForEquipment already is. Load is shown only
// for the modalities that carry external resistance (strength, isometric) — see usesLoad.

import { formatReps } from "./repsAndLoad.js";

export const MODALITIES = ["strength", "isometric", "cardio", "stretch", "balance", "agility"];
export const CARDIO_METRICS = ["time", "distance", "calories", "watts", "pace", "heartrate"];
export const AGILITY_METRICS = ["time", "distance", "reps"];

const HOLD_MODALITIES = new Set(["isometric", "stretch", "balance"]);
const LOAD_MODALITIES = new Set(["strength", "isometric"]);

// The modality of a catalog exercise, defaulting to strength for any legacy/unknown value.
export function modalityOf(ex) {
  const m = ex?.modality;
  return MODALITIES.includes(m) ? m : "strength";
}

// The primary metric a movement's target is expressed in:
//   strength → "reps"; cardio/agility → their catalog metric; isometric/stretch/balance → "hold".
export function primaryMetricOf(ex) {
  const modality = modalityOf(ex);
  if (modality === "cardio") return CARDIO_METRICS.includes(ex?.metric) ? ex.metric : "time";
  if (modality === "agility") return AGILITY_METRICS.includes(ex?.metric) ? ex.metric : "time";
  if (HOLD_MODALITIES.has(modality)) return "hold";
  return "reps";
}

// Whether a modality carries external resistance and therefore shows a load axis. Cardio, holds
// (stretch/balance) and agility do not; strength and isometric do (an isometric can be weighted).
export function usesLoad(modality) {
  return LOAD_MODALITIES.has(modality);
}

// The effort-metric choices a modality lets an author pick (for the create form's metric selector),
// or null when the metric is fixed by the modality (strength=reps, isometric/stretch/balance=hold).
export function metricOptionsFor(modality) {
  if (modality === "cardio") return CARDIO_METRICS;
  if (modality === "agility") return AGILITY_METRICS;
  return null;
}

// Time-based metrics are the ones the clipboard exercise timer can log directly (count-down/up).
// Pace is a rate, not a duration to count down, so it is deliberately excluded.
export function isTimeBasedMetric(metric) {
  return metric === "time" || metric === "hold";
}

// Coerce an authored primary target into seconds for time/hold metrics. Accepts a plain number of
// seconds, a "30s" token, an "M:SS" clock, or a "20 min" phrase — mirroring the polymorphic reps input.
export function toSeconds(raw) {
  if (typeof raw === "number") return Math.max(0, Math.round(raw));
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "") return 0;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    return (parseInt(m, 10) || 0) * 60 + (parseInt(sec, 10) || 0);
  }
  const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return 0;
  if (s.includes("min")) return Math.round(n * 60);
  return Math.round(n); // bare number or "30s" → seconds
}

// Compact "M:SS" (or "H:MM:SS") duration for a stat tile / compact row.
export function formatDuration(totalSeconds) {
  const sec = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// A plain non-negative number from an authored value (distance metres, calories, watts).
function num(raw) {
  const n = Number.parseFloat(String(raw ?? "").trim());
  return Number.isNaN(n) ? 0 : n;
}

// Full display string for a primary target given its metric — e.g. "200 W", "500 m", "1.5 km",
// "20 cal", "0:30", or a strength reps token ("12" / "8-12" / "Max").
export function formatMetricValue(rawValue, metric) {
  switch (metric) {
    case "time":
    case "hold":
      return formatDuration(toSeconds(rawValue));
    case "distance": {
      const n = num(rawValue);
      return n >= 1000 ? `${n / 1000} km` : `${n} m`;
    }
    case "calories":
      return `${num(rawValue)} cal`;
    case "watts":
      return `${num(rawValue)} W`;
    case "pace":
      return `${formatDuration(toSeconds(rawValue))} /km`;
    case "heartrate":
      return `${num(rawValue)} bpm`;
    default:
      return formatReps(rawValue);
  }
}

// i18n key for a metric's short unit label. Callers do t(metricLabelKey(metric)).
export function metricLabelKey(metric) {
  switch (metric) {
    case "time":
      return "metric_time";
    case "hold":
      return "metric_hold";
    case "distance":
      return "metric_distance";
    case "calories":
      return "metric_calories";
    case "watts":
      return "metric_watts";
    case "pace":
      return "metric_pace";
    case "heartrate":
      return "metric_heartrate";
    default:
      return "reps_label";
  }
}
