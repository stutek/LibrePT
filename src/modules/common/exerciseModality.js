// src/modules/common/exerciseModality.js — the exercise MODALITY axis: how a movement is LOGGED.
//
// Orthogonal to the structural item type (exercise / rest / superset) and to equipment-derived
// load. Modality decides which TARGET a movement is programmed and logged against (TODO §13.3 / §17.1):
//   • strength — sets × reps × load                         (the default; every legacy exercise)
//   • cardio   — a conditioning effort: time | distance | calories | watts  (assault bike, erg, …)
//   • stretch  — a mobility hold measured in hold-time       (optionally per side)
//   • balance  — a stability hold measured in hold-time      (single-leg / BOSU work)
// (hiit is reserved by §17.1 but has no distinct logging surface yet, so it is not a value here.)
//
// Like reps/load, the raw authored magnitude stays on the item (in its polymorphic `reps` field) and
// its MEANING is derived here at render time from the movement's modality + cardio metric. No per-item
// unit is persisted, so routines / sessions / history need no migration — modality lives on the
// catalog entry and is looked up alongside equipment, exactly as loadUnitForEquipment already is.

import { formatReps } from "./repsAndLoad.js";

export const MODALITIES = ["strength", "cardio", "stretch", "balance"];
export const CARDIO_METRICS = ["time", "distance", "calories", "watts"];

const HOLD_MODALITIES = new Set(["stretch", "balance"]);

// The modality of a catalog exercise, defaulting to strength for any legacy/unknown value.
export function modalityOf(ex) {
  const m = ex?.modality;
  return MODALITIES.includes(m) ? m : "strength";
}

// The primary metric a movement's target is expressed in:
//   strength → "reps", cardio → its catalog metric (time|distance|calories|watts), holds → "hold".
export function primaryMetricOf(ex) {
  const modality = modalityOf(ex);
  if (modality === "cardio") return CARDIO_METRICS.includes(ex?.metric) ? ex.metric : "time";
  if (HOLD_MODALITIES.has(modality)) return "hold";
  return "reps";
}

// Time-based metrics are the ones the clipboard exercise timer can log directly (count-down/up).
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
    default:
      return "reps_label";
  }
}
