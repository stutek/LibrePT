// src/domain/circuitGrouping.js — the invariants that make a circuit a circuit.
//
// A circuit is not a container in the data: its members are ordinary plan items that happen to
// share a `circuitId`, living in the same flat `exercises` array as everything else. That keeps
// reorder, insert and delete as plain array operations — but it means the grouping is an INVARIANT
// somebody has to maintain, not a structure that enforces itself. Three rules:
//
//   1. CONTIGUITY. A circuit's members sit next to each other. Every renderer folds a run of
//      same-circuitId items into one block, so a member that drifts away from its run silently
//      becomes a second block with the same name.
//   2. SHARED IDENTITY. One title and one round count per circuit, taken from its first exercise.
//      Members carry copies, so an edit to one has to be pushed to the rest.
//   3. ROUNDS TRACK SERIES. A member's set count equals the round count, and the live round
//      counter stays within 1..series — a counter left pointing at round 5 of a circuit that is
//      now 3 rounds long can never be completed.
//
// Extracted from clipboardEditor.js (TODO §24.5), where it was reachable only by mounting the
// editor in a browser. These are exactly the rules a unit test should pin: every one of them is a
// property of an array, and every one of them is invisible until a plan is reopened and found
// scrambled.
//
// Mutates the plan in place, keeping the `exercises` array's identity — the editor holds a
// reference to it and renders straight from it.

import { isRestRecord } from "./sessionItemRecord.js";

// Rounds drive a circuit member's set count: keeps its target and log rows aligned to the series.
function syncCircuitMemberSetCount(member, series, logs) {
  member.setsTargetCount = series;
  const memberLogs = logs[member.id];
  if (!Array.isArray(memberLogs)) return;
  while (memberLogs.length < series) {
    memberLogs.push({
      reps: member.repsTarget ?? 0,
      weight: member.weightTarget ?? 0,
      completed: false,
      note: "",
    });
  }
  memberLogs.length = series;
}

// Regroup so each circuit's members are contiguous, sharing one title/series, with round-aligned
// logs. Members are pulled together at the position of the circuit's FIRST member, so a circuit
// keeps its place in the program rather than jumping to the end.
export function regroupCircuitMembers(items, logs) {
  const emitted = new Set();
  const result = [];
  for (const item of items) {
    if (!item.circuitId) {
      result.push(item);
      continue;
    }
    if (emitted.has(item.circuitId)) continue;
    emitted.add(item.circuitId);
    const members = items.filter((other) => other.circuitId === item.circuitId);
    // Title and series come from the first real EXERCISE, not the first member: a circuit whose
    // run happens to start with a rest would otherwise take its identity from the rest.
    const firstExercise = members.find((member) => !isRestRecord(member)) || members[0];
    const title = firstExercise.circuitTitle || "";
    const series = firstExercise.circuitSeries || 1;
    for (const member of members) {
      member.circuitTitle = title;
      member.circuitSeries = series;
      if (!isRestRecord(member)) syncCircuitMemberSetCount(member, series, logs);
    }
    result.push(...members);
  }
  return result;
}

// Drop round counters for circuits that no longer exist, and clamp the rest into 1..series.
export function pruneOrphanedCircuitRounds(items, rounds) {
  for (const circuitId of Object.keys(rounds)) {
    if (!items.some((item) => item.circuitId === circuitId)) delete rounds[circuitId];
  }
  for (const item of items) {
    if (!item.circuitId) continue;
    const series = item.circuitSeries || 1;
    rounds[item.circuitId] = Math.min(Math.max(1, rounds[item.circuitId] || 1), series);
  }
}

// First-appearance order + metadata for the existing circuits, used to build the "move to circuit"
// <select>. First appearance, not creation time: the list should read in the order the trainer sees
// the blocks down the plan.
export function collectCircuitsMeta(items) {
  const circuits = [];
  for (const item of items) {
    if (item.circuitId && !circuits.some((circuit) => circuit.id === item.circuitId)) {
      circuits.push({
        id: item.circuitId,
        title: item.circuitTitle || "",
        series: item.circuitSeries || 1,
      });
    }
  }
  return circuits;
}

// Both pointers into the plan that a delete or a swap can leave dangling.
function clampPointersIntoPlan(clientState, items) {
  if (clientState.activeExerciseIndex >= items.length) {
    clientState.activeExerciseIndex = Math.max(0, items.length - 1);
  }
  // Drop the accordion selection if that row no longer exists (removed, or a swap gave it a new
  // id) — the same pruning intent as the round counters, just a single id instead of a map.
  if (
    clientState.editorExpandedId &&
    !items.some((item) => item.id === clientState.editorExpandedId)
  ) {
    clientState.editorExpandedId = null;
  }
}

// The whole invariant, applied to a client's plan. Called before every editor render and after
// every structural edit, so it must be idempotent: running it on an already-normalised plan is a
// no-op.
export function normalizeCircuits(clientState) {
  const items = clientState.exercises;
  if (!Array.isArray(items)) return;
  if (!clientState.logs) clientState.logs = {};

  const regrouped = regroupCircuitMembers(items, clientState.logs);
  // Rewritten in place rather than reassigned: the editor renders straight from this array and
  // holds its own reference to it.
  items.length = 0;
  items.push(...regrouped);

  if (!clientState.circuitRounds) clientState.circuitRounds = {};
  pruneOrphanedCircuitRounds(items, clientState.circuitRounds);
  clampPointersIntoPlan(clientState, items);
}
