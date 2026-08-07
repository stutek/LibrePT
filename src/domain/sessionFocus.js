// src/domain/sessionFocus.js — which item in a plan the trainer is looking at, as a value that
// survives a URL, a cached session, and a running timer.
//
// A focus reference is `{ type: "exercise" | "circuit" | "rest", id }`. It exists because an array
// INDEX cannot survive any of those trips — the plan gets edited, reordered, rebuilt from a
// snapshot — so the thing that is addressable has to be the item's identity, not its position.
//
// The two directions are a matched PAIR and belong in one module (TODO §24.4):
//
//   focusRefForItem(item)               plan item → ref     (what a URL or timer records)
//   focusIndexFromRef(clientState, ref) ref → plan index     (what a reload or tap resolves)
//
// They were written in three separate places and one of them disagreed: the timer built
// `{ type: "exercise" }` for a standalone REST, which focusIndexFromRef then refused to resolve
// (its exercise branch explicitly excludes rests), so tapping that timer card landed on the session
// without focusing the rest it was counting down. A round trip that only holds for two of the three
// item kinds is the failure mode having one writer and one reader in the same file prevents.
//
// Pure: no DOM, no router, no session. Building the actual URL from a ref is the controller's job.

import { isRestRecord } from "./sessionItemRecord.js";

// Accepts the pre-rename "superset" spelling wherever a focusRef can have been persisted or
// shared: renaming a term must not orphan a running timer or a saved link.
export const isCircuitFocus = (type) => type === "circuit" || type === "superset";

// The ref that addresses this plan item. Circuit membership wins over the item's own identity —
// the whole block is what the trainer sees in focus, and a rest inside one belongs to it — so a
// circuit member always resolves to its block, exercise or rest alike.
export function focusRefForItem(item) {
  if (!item) return null;
  if (item.circuitId) return { type: "circuit", id: item.circuitId };
  return { type: isRestRecord(item) ? "rest" : "exercise", id: item.id };
}

// The index of the item a ref addresses, or -1 when it addresses nothing any more (a card deleted
// since the link was made). Callers treat -1 as "leave focus alone" rather than as an error — a
// stale deep link is an ordinary event, not a broken one.
export function focusIndexFromRef(clientState, focusRef) {
  if (!clientState || !clientState.exercises || !focusRef) return -1;
  if (isCircuitFocus(focusRef.type)) {
    return clientState.exercises.findIndex((item) => item.circuitId === focusRef.id);
  }
  if (focusRef.type === "rest") {
    return clientState.exercises.findIndex(
      (item) => isRestRecord(item) && !item.circuitId && item.id === focusRef.id,
    );
  }
  return clientState.exercises.findIndex(
    (item) => !isRestRecord(item) && !item.circuitId && item.id === focusRef.id,
  );
}
