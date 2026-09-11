// src/modules/clipboard/planColumns.js — how many participants' programmes are edited side by side,
// and the rendering of those columns (TODO §41.0).
//
// Single responsibility: the COLUMN LAYOUT around the plan editor. It decides how many columns the
// width allows and paints one editor per column; what an editor is remains clipboardEditor.js's
// business, unchanged and called once per column rather than taken apart.
//
// **Planning only, and that is the whole point of §41.0.** The live clipboard stays one participant
// at a time: it is where sets and quick signals are WRITTEN, and one person per screen with
// thumb-sized targets is what keeps a mis-tap from logging against the wrong client. A plan is not a
// log — a wrong drop in here is visible and undone before anybody trains. Planning is also the
// activity done sitting at a desk, which is where the width exists at all.
//
// **The count is not a setting.** It is what the width allows, bounded by how many participants
// there are — ruled 2026-09-10: *"1/2/3/4/5/.. odvisno od prostora in števila udeležencev"*. A
// trainer never chooses it, so there is nothing to remember and nothing to get out of step with the
// screen they are on.

import { renderClipboardEditor } from "./clipboardEditor.js";

// What one programme needs before a second one is worth showing. Measured against the editor's own
// rows: a name field, its sets/reps/load fields and the reorder handle stop being usable below this,
// and two cramped columns are worse than one that works.
export const MIN_PLAN_COLUMN_PX = 330;

/**
 * How many columns to draw. Pure, so the rule can be read and tested without a DOM.
 *
 * Never fewer than one, even on a screen narrower than a single column: the alternative is a
 * clipboard that renders nothing, which is worse than one that scrolls.
 */
export function planColumnCount({ width, participants, minColumnWidth = MIN_PLAN_COLUMN_PX }) {
  const fits = Math.floor((Number(width) || 0) / minColumnWidth);
  return Math.max(1, Math.min(Number(participants) || 1, fits));
}

/** The participants to show, focused client FIRST.
 *
 * The trainer tapped a name to get here, and that name must not move to the middle of the row
 * because of the order the session happens to store its participants in. The rest follow in their
 * stored order, which is the order every other screen shows them in.
 */
export function columnClientIds(participantIds, activeClientId, count) {
  const rest = (participantIds || []).filter((id) => id !== activeClientId);
  const ordered = participantIds?.includes(activeClientId)
    ? [activeClientId, ...rest]
    : [...(participantIds || [])];
  return ordered.slice(0, count);
}

/** One shared exercise-name list for every column.
 *
 * clipboardEditor.js renders its own `<datalist>` with a fixed id, which is right for one editor and
 * wrong for several — N identical ids in one document, and a browser then resolves `list=` to
 * whichever came first. The columns render the list ONCE and hand every editor its id instead.
 */
const SHARED_DATALIST_ID = "plan-columns-ex-names";

function renderSharedDatalist(container, names, escapeHTML) {
  const options = [...new Set(names || [])]
    .map((name) => `<option value="${escapeHTML(name)}"></option>`)
    .join("");
  const list = document.createElement("datalist");
  list.id = SHARED_DATALIST_ID;
  list.innerHTML = options;
  container.appendChild(list);
}

/**
 * Paint the columns. Returns a cleanup that detaches every editor's listeners, so the board can
 * dispose of the whole row the same way it disposes of one editor.
 *
 * `editorFor(clientId)` is injected rather than built here: the board owns the dependency bag an
 * editor needs (state, save, the catalog picker, the callout) and this module owns only where the
 * editors go.
 */
export function renderPlanColumns(container, { clientIds, editorFor, exerciseNames, escapeHTML }) {
  container.textContent = "";
  container.classList.add("plan-columns");
  container.style.setProperty("--plan-column-count", String(clientIds.length));

  renderSharedDatalist(container, exerciseNames, escapeHTML);

  const cleanups = [];
  for (const clientId of clientIds) {
    const column = document.createElement("div");
    column.className = "plan-column";
    column.dataset.planColumn = clientId;
    container.appendChild(column);
    const cleanup = renderClipboardEditor(column, {
      ...editorFor(clientId),
      sharedDatalistId: SHARED_DATALIST_ID,
    });
    if (typeof cleanup === "function") cleanups.push(cleanup);
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
    container.classList.remove("plan-columns");
    container.style.removeProperty("--plan-column-count");
  };
}
