// src/data/openRecordEdits.js — the records a form is writing into right now (TODO §50.2).
//
// Single responsibility: remember, for every record open in a form, what it was before the form
// opened, and answer two questions with it — what Cancel puts back, and what the counts may see.
//
// **Why it exists.** Since 2026-09-17 the client, exercise and routine forms write into the record
// as it is typed, so a reload loses nothing. Simon's ruling the same day: the ahead count and the
// backup warning go up only once the trainer has FINISHED the record. Both counts diff a state
// against a reference, so this module hands them the state as it was before each open record was
// touched: a record being edited counts as its old self, a record being added does not exist yet.
//
// **Held in memory, never stored.** Leaving the form in any way — Done, ✕, Back, going elsewhere —
// finishes the record, and so does a reload: after one, nothing is open, so everything counts. An
// open mark that could survive a reload could also be left behind for ever, and a record that never
// counts is a record the backup warning never mentions.
//
// Injected dependencies: none.

const open = new Map();
const keyOf = (collection, id) => `${collection}/${id}`;

/** `before` is the record as it was when the form opened, or null when the form is adding it. */
export function beginRecordEdit(collection, id, before) {
  open.set(keyOf(collection, id), {
    collection,
    id,
    before: before ? structuredClone(before) : null,
  });
}

export function endRecordEdit(collection, id) {
  open.delete(keyOf(collection, id));
}

/** The record as it was when the form opened: a copy, or null for a record the form is adding. */
export function recordBeforeEdit(collection, id) {
  const entry = open.get(keyOf(collection, id));
  return entry?.before ? structuredClone(entry.before) : null;
}

/** `state` as the counts must see it: every open record as it was before its form opened. */
export function withoutOpenEdits(state) {
  if (open.size === 0 || !state) return state;
  const counted = { ...state };
  for (const { collection, id, before } of open.values()) {
    const records = (counted[collection] || []).filter((record) => record.id !== id);
    counted[collection] = before ? [...records, before] : records;
  }
  return counted;
}

// Test seam: forget every open record.
export function resetOpenRecordEdits() {
  open.clear();
}
