// src/modules/common/liveRecordForm.js — a dialog that writes into its record as it is typed (TODO §50.2).
//
// Single responsibility: the lifecycle every record form shares — create the record on the first
// typed character, write each change into it, put it back on Cancel, and finish it when the dialog is
// left. What the fields ARE, and what a new record starts with, stays with the form that owns them.
//
// **Why it exists.** A reload used to throw away a half-filled form (§50.1), and a draft kept beside
// the record was a second copy of the same data with its own lifetime to decide. Ruled 2026-09-17
// (Simon): the form writes straight into the database instead. Also ruled that day:
//
//   • **A new record exists from the first typed character.** A required field left empty is
//     written with a placeholder ("New client"), never refused and never an alert.
//   • **Cancel undoes**: an edited record goes back to what it was when the dialog opened, and a
//     record the dialog was adding is removed.
//   • **Any other way out finishes the record** — Save, ✕, Escape, Back, a route change. Only then
//     does it count towards the ahead count and the backup warning (data/openRecordEdits.js).
//
// A record the dialog added is removed when it is left with every field empty again: typing a
// letter and deleting it is not a request for a client called "New client".
//
// Injected dependencies: everything through `keepRecordLive`'s options.

import { beginRecordEdit, endRecordEdit, recordBeforeEdit } from "../../data/openRecordEdits.js";

/**
 * Wires `dialog` and its `form` to one collection. Returns `{ openNew, openExisting }`; each is called
 * AFTER the opener has filled the form, because filling a field from code fires no event and must not
 * count as typing.
 *
 * Options: `collection`, `getState`, `saveToLocalStorage`, `createRecord()` (a new record with its id
 * and starting fields), `writeFields(record, before)` (form → record; `before` is the record as the
 * dialog opened it, null when adding), `isBlank()` (every field of the form is empty), and
 * `onChange(record | null)` (repaint whatever shows the collection). A change the form makes without
 * an input event — a row added or removed — is reported by dispatching `recordchange` on the form.
 */
export function keepRecordLive({
  dialog,
  form,
  collection,
  getState,
  saveToLocalStorage,
  createRecord,
  writeFields,
  isBlank,
  onChange,
}) {
  let record = null;
  let adding = false;
  let open = false;

  const records = () => {
    const state = getState();
    state[collection] = state[collection] || [];
    return state[collection];
  };
  const remove = (id) => {
    const list = records();
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) list.splice(index, 1);
  };

  const write = () => {
    if (!open) return;
    if (!record) {
      record = createRecord();
      records().push(record);
      beginRecordEdit(collection, record.id, null);
    }
    // The record as the dialog found it, not as the last keystroke left it: a field whose meaning
    // depends on what came before (unticking consent records a withdrawal) must compare against the
    // record the trainer opened, or the second keystroke would erase what the first one recorded.
    writeFields(record, recordBeforeEdit(collection, record.id));
    saveToLocalStorage();
    onChange(record);
  };
  form.addEventListener("input", write);
  form.addEventListener("change", write);
  form.addEventListener("recordchange", write);

  const finish = () => {
    if (!open) return;
    open = false;
    if (record) {
      const abandoned = adding && isBlank();
      if (abandoned) remove(record.id);
      endRecordEdit(collection, record.id);
      // The counts changed although the data did not: this save is what repaints them.
      saveToLocalStorage();
      onChange(abandoned ? null : record);
    }
    record = null;
  };
  // The browser fires `close` a moment AFTER the dialog closes. By then the dialog may already be
  // open again on another record, and that record is not finished.
  dialog.addEventListener("close", () => {
    if (!dialog.open) finish();
  });

  dialog.querySelector(".modal-cancel")?.addEventListener("click", () => {
    if (record) {
      const before = recordBeforeEdit(collection, record.id);
      if (before) {
        // In place, so anything holding this record object sees it restored too.
        for (const key of Object.keys(record)) delete record[key];
        Object.assign(record, before);
      } else {
        remove(record.id);
        endRecordEdit(collection, record.id);
        saveToLocalStorage();
        onChange(null);
        record = null;
      }
    }
    dialog.close();
    finish();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    dialog.close();
    finish();
  });

  return {
    openNew() {
      finish();
      record = null;
      adding = true;
      open = true;
    },
    openExisting(existing) {
      finish();
      record = existing;
      adding = false;
      open = true;
      beginRecordEdit(collection, existing.id, existing);
    },
  };
}
