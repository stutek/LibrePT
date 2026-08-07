// src/modules/clipboard/editModeState.js — whether the clipboard is in inline plan-edit mode, and
// which plan row the trainer is working on. Three variables, but each has a different lifetime, and
// conflating them is what this module exists to prevent.
//
// Deliberately side-effect free: it holds state and nothing else. The render-triggering wrappers
// (enter/exit edit mode) stay with the controller that owns the board render, so this module never
// needs to import a renderer — which is also what keeps it unit-testable without a DOM.
//
// deps: none.

let clipboardEditMode = false;

// A plan item the trainer JUST created or swapped, so the next editor render can point them at it:
// { id, kind: "new" | "swap" | "restored", focus }. `focus` puts the caret in the row's name field —
// right for a blank inserted row, wrong for one the catalog just filled in (it would pop the phone
// keyboard over a row that needs no typing). ONE-SHOT: consumed by that render and cleared, so a
// later re-render never re-announces an item the trainer has already dealt with.
let pendingCallout = null;

// The plan row the trainer is working on. Unlike pendingCallout this is NOT one-shot: it is what
// `/…/edit/exercise/{slotId}` carries, so a reload lands back on the row rather than on an
// undifferentiated list. A row is only addressable if its id outlives the render that announced it.
let editorRowId = null;

export function isClipboardEditMode() {
  return clipboardEditMode;
}

export function setClipboardEditModeFlag(on) {
  clipboardEditMode = !!on;
  if (!clipboardEditMode) editorRowId = null;
}

export function getEditorRowId() {
  return editorRowId;
}

// Record which plan row the trainer is working on, arming a one-shot call-out for the next render.
export function markEditorRow(slotId, { kind, focus }) {
  editorRowId = slotId || null;
  pendingCallout = slotId ? { id: slotId, kind, focus } : null;
}

// Read AND clear: one render owns the call-out. Returning it without clearing is what would let a
// highlight outlive the moment it describes.
export function takePendingCallout() {
  const callout = pendingCallout;
  pendingCallout = null;
  return callout;
}
