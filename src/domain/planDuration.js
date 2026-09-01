// src/domain/planDuration.js — how long a programme takes, against the slot it has to fit (TODO §35.3b).
//
// Single responsibility: the arithmetic. No DOM — the meter that shows this sits in the clipboard's
// plan editor, where a trainer is still adding exercises and can still take one out.
//
// **It is an ESTIMATE, and the UI says so.** Nobody can know how long a set of five takes: it
// depends on the person, the load and the day. What a trainer needs while building a session is not
// a stopwatch but an answer to "does this fit in the hour", early enough to change the answer.
//
// **The estimate scales with REPS, and with nothing else.** A set costs an overhead — getting set
// up, unracking, the moment either side — plus a cost per rep. Asked for 2026-09-01: *"we should
// also find a way to account time for 20 bolgarian squats, or 5 pullups"*, which a flat per-set
// constant said cost the same. Reps are already in the plan, so this needs no per-exercise table —
// and that table is what this module refused for good reason: a duration on every one of the 48
// seeded movements and on every custom movement a trainer ever adds, all of them invented. One
// model that is honestly approximate still beats a hundred numbers that look precise.
//
// It is calibrated where it always was: ten reps costs exactly the 45 seconds a set used to cost,
// so the common case did not move. Held and timed work is exempt — it carries its own seconds.
// Reps nobody can count ("Max", a band label, an empty box) fall back to that same working set,
// because costing them at nothing would make a plan of failure sets look free.
//
// **Rests count towards the total, and are excluded from the JUDGEMENT.** Ruled 2026-09-01: *"if
// the plan (not counting rests) exceeds 75% of time then it should mark warning and at 100% should
// turn error"* — and the reason it is the right base is one this module was already half-admitting.
// Rest is counted only where a trainer wrote a rest ROW; the rest they take between sets without
// typing it in is invisible here. So a total that includes authored rests under-reads exactly the
// plans most likely to overrun. The quarter of the slot this leaves free IS that unwritten rest.
//
// Injected dependencies: none — pure functions over plain objects.

import { parseTimeRange } from "./timeRange.js";

// Getting into position, unracking, the breath before and the rack after — everything a set costs
// that is not the reps themselves.
export const SET_OVERHEAD_SECONDS = 15;
// One rep, at a working tempo.
export const SECONDS_PER_REP = 3;
// A set of ten: what a working set has always been counted at here, and still is. Also the fallback
// for reps that cannot be counted at all.
export const SECONDS_PER_WORKING_SET = SET_OVERHEAD_SECONDS + 10 * SECONDS_PER_REP;
// Where work alone starts crowding the slot. Below this the unwritten rest still fits; above it the
// trainer is relying on rest they have not budgeted.
export const SLOT_WARNING_RATIO = 0.75;

const isRest = (item) => item?.type === "rest";
// Time-based work states its own duration in the same slot reps live in (domain/repsAndLoad.js), so
// a 40-second plank is 40 seconds rather than a set.
const isTimed = (item) => item?.metric === "time";

/** How many reps a set asks for, or null when the answer is not a number.
 *
 * A range is costed at its TOP — the number the trainer might actually hit, and the one that
 * decides whether the hour holds. Everything else ("Max", "AMRAP", a band label, an empty box) has
 * no count to read and says so, so the caller can fall back rather than treat it as zero. */
function repsCount(item) {
  const raw = item?.repsTarget ?? item?.reps;
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
  const text = String(raw ?? "").trim();
  const range = text.match(/^(\d+)\s*[-–]\s*(\d+)/);
  if (range) return Number(range[2]);
  const plain = text.match(/^(\d+)/);
  return plain ? Number(plain[1]) : null;
}

function setSeconds(item) {
  const reps = repsCount(item);
  return reps === null ? SECONDS_PER_WORKING_SET : SET_OVERHEAD_SECONDS + reps * SECONDS_PER_REP;
}

function itemSeconds(item) {
  if (isRest(item)) return Number(item.rest) || 0;
  const sets = Number(item.setsTargetCount ?? item.sets?.length ?? 1) || 1;
  if (isTimed(item)) return sets * (Number(item.repsTarget) || 0);
  return sets * setSeconds(item);
}

function sumSeconds(items, keep) {
  const rounds = new Map();
  for (const item of items || []) {
    if (item?.circuitId) rounds.set(item.circuitId, Number(item.circuitSeries) || 1);
  }
  return (items || []).reduce((total, item) => {
    if (!keep(item)) return total;
    const multiplier = item?.circuitId ? rounds.get(item.circuitId) || 1 : 1;
    return total + multiplier * itemSeconds(item);
  }, 0);
}

/** The programme's estimated length in seconds, circuits counted once per round. */
export function planNetSeconds(items) {
  return sumSeconds(items, () => true);
}

/** The WORK alone — what the plan is judged on, because authored rests are the only rests this can
 * see and the ones a trainer takes without typing them in are the ones that overrun the hour. */
export function planWorkSeconds(items) {
  return sumSeconds(items, (item) => !isRest(item));
}

/** The slot's length in seconds, from the label a session already carries ("18:00 - 19:00"). */
export function slotSeconds(timeLabel) {
  const range = parseTimeRange(timeLabel);
  if (!range) return 0;
  return (range.end - range.start) * 60;
}

/** The comparison a trainer is making: what the plan costs, what the slot holds, and the gap.
 *
 * A session with NO slot — a planning programme — is never judged: there is nothing to overrun, and
 * a red number on that screen would be reporting a problem that does not exist.
 */
export function planFitsSlot(items, timeLabel) {
  const netSeconds = planNetSeconds(items);
  const workSeconds = planWorkSeconds(items);
  const slot = slotSeconds(timeLabel);
  if (!slot) {
    return { netSeconds, workSeconds, slotSeconds: 0, overBy: 0, fits: true, level: "ok" };
  }
  // Three states, judged on WORK (see the header): under three quarters is fine, past it the plan
  // is leaning on rest nobody budgeted, and at the whole slot the work alone has eaten the hour.
  const level =
    workSeconds >= slot ? "over" : workSeconds > slot * SLOT_WARNING_RATIO ? "warning" : "ok";
  return {
    netSeconds,
    workSeconds,
    slotSeconds: slot,
    overBy: workSeconds - slot,
    fits: level !== "over",
    level,
  };
}
