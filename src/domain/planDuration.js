// src/domain/planDuration.js — how long a programme takes, against the slot it has to fit (TODO §35.3b).
//
// Single responsibility: the arithmetic. No DOM — the meter that shows this sits in the clipboard's
// plan editor, where a trainer is still adding exercises and can still take one out.
//
// **It is an ESTIMATE, and the UI says so.** Nobody can know how long a set of five takes: it
// depends on the person, the load and the day. What a trainer needs while building a session is not
// a stopwatch but an answer to "does this fit in the hour", early enough to change the answer.
//
// **The estimate is one constant, deliberately.** A working set is counted at 45 seconds — a set of
// moderate reps plus the moment either side of it — because a model with per-exercise durations
// would need a duration on every one of the 48 seeded movements and on every custom movement a
// trainer ever adds, all of them invented. One number that is honestly approximate beats a hundred
// that look precise. Held and timed work is exempt: it carries its own seconds and is counted in
// them.
//
// **Rests count.** They are what a slot is actually spent on as much as the work is, and a plan
// that ignores them is exactly the plan that overruns.
//
// Injected dependencies: none — pure functions over plain objects.

import { parseTimeRange } from "./timeRange.js";

// A working set, from the trainer's hand leaving the bar to it coming back. Approximate on purpose.
export const SECONDS_PER_WORKING_SET = 45;

const isRest = (item) => item?.type === "rest";
// Time-based work states its own duration in the same slot reps live in (domain/repsAndLoad.js), so
// a 40-second plank is 40 seconds rather than a set.
const isTimed = (item) => item?.metric === "time";

function itemSeconds(item) {
  if (isRest(item)) return Number(item.rest) || 0;
  const sets = Number(item.setsTargetCount ?? item.sets?.length ?? 1) || 1;
  if (isTimed(item)) return sets * (Number(item.repsTarget) || 0);
  return sets * SECONDS_PER_WORKING_SET;
}

/** The programme's estimated length in seconds, circuits counted once per round. */
export function planNetSeconds(items) {
  const rounds = new Map();
  for (const item of items || []) {
    if (item?.circuitId) rounds.set(item.circuitId, Number(item.circuitSeries) || 1);
  }
  return (items || []).reduce((total, item) => {
    const multiplier = item?.circuitId ? rounds.get(item.circuitId) || 1 : 1;
    return total + multiplier * itemSeconds(item);
  }, 0);
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
  const slot = slotSeconds(timeLabel);
  if (!slot) return { netSeconds, slotSeconds: 0, overBy: 0, fits: true };
  return { netSeconds, slotSeconds: slot, overBy: netSeconds - slot, fits: netSeconds <= slot };
}
