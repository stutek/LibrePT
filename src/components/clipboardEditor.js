// components/clipboardEditor.js
// The inline "edit mode" render of the active-session clipboard. When the trainer taps a card's
// edit (✎) icon, the whole deck flips into this editable list so exercises can be swapped,
// retargeted, reordered, added, removed — plus each exercise's trailing rest "break" — mid-session.
// It renders as an ALTERNATE view over the same #active-exercise-scroll-deck container; the normal
// deck/focus/logging code is never touched, so leaving edit mode restores the live clipboard as-is.
//
// Supersets are first-class here: exercises that share a circuitId render inside a bordered block
// with an editable title and round count. Full group management is supported — add/remove members,
// convert an exercise into (or out of) a superset, and move an exercise between supersets — all via
// the per-row "superset" <select>. Because the live deck requires a circuit's members to be
// CONSECUTIVE in exercises[], every membership change runs normalizeCircuits() to regroup the array.
//
// A break is modelled as the exercise's own `rest` (seconds), so it travels with its exercise when
// reordered. Reorder control is combined: tap its top/bottom half to nudge one row up/down, or drag
// it to move freely (within its own list — a superset's members, or the top-level units). Edits
// mutate activeClientState in place; the caller persists + re-renders.
//
// deps: {
//   activeClientState, allExerciseNames, t, escapeHTML,
//   save(),        // cache + localStorage, NO re-render (for live field edits)
//   rerender(),    // re-render the board (stays in edit mode) after structural changes
//   openAddExercise(),  // opens the existing #dialog-add-session-exercise
//   exit(),        // leave edit mode
//   genId()        // fresh short id for new circuits
// }

const DEFAULT_SERIES = 3;

// The editor's Esc / tap-outside handlers live on `document`, so they must be torn down before a
// fresh render (or an exit) installs new ones. renderActiveGroupBoard can re-render the board more
// than once per interaction, so we don't rely on the controller pairing each render with a cleanup:
// this module-level slot always detaches the previous render's document listeners first, keeping
// exactly one set live. A stale leftover was what made an "add to superset" tap read as "outside".
let detachDocListeners = null;

export function renderClipboardEditor(container, deps) {
  const { activeClientState, allExerciseNames, t, escapeHTML, save, rerender, openAddExercise, exit, genId } = deps;
  const exercises = activeClientState.exercises;
  const tr = (key, fallback) => t(key) || fallback;

  // Regroup so each circuit's members are contiguous before we render straight from the array.
  // (New circuits created below always normalize, so on entry this is normally a no-op.)
  normalizeCircuits();

  const datalistId = 'clipboard-editor-ex-names';
  const options = (allExerciseNames || []).map(n => `<option value="${escapeHTML(n)}"></option>`).join('');

  // First-appearance order + metadata for the existing circuits, used to build the move <select>.
  const circuits = [];
  exercises.forEach(ex => {
    if (ex.circuitId && !circuits.some(c => c.id === ex.circuitId)) {
      circuits.push({ id: ex.circuitId, title: ex.circuitTitle || '', series: ex.circuitSeries || 1 });
    }
  });

  const supersetSelect = (ex) => {
    const opts = [`<option value="">${tr('superset_none', 'No superset')}</option>`];
    circuits.forEach((c, i) => {
      const label = c.title || `${tr('superset', 'Superset')} ${i + 1}`;
      opts.push(`<option value="${escapeHTML(c.id)}"${c.id === ex.circuitId ? ' selected' : ''}>${escapeHTML(label)}</option>`);
    });
    opts.push(`<option value="__new__">＋ ${tr('superset_new', 'New superset')}</option>`);
    return `<select class="editor-row-superset" aria-label="${tr('superset', 'Superset')}">${opts.join('')}</select>`;
  };

  const reorderHandle = () => `
    <button type="button" class="editor-reorder" aria-label="${tr('reorder', 'Reorder')}" title="${tr('reorder_hint', 'Tap top/bottom to move, drag to reorder')}">
      <span class="editor-reorder-up"><i class="fa-solid fa-chevron-up"></i></span>
      <span class="editor-reorder-down"><i class="fa-solid fa-chevron-down"></i></span>
    </button>`;

  const exerciseRow = (ex, idx) => {
    const name = escapeHTML(ex.name || '');
    const sets = escapeHTML(String(ex.setsTargetCount ?? ex.sets ?? 3));
    const reps = escapeHTML(String(ex.repsTarget ?? ex.reps ?? 10));
    const weight = escapeHTML(String(ex.weightTarget ?? ex.weight ?? 0));
    const rest = escapeHTML(String(ex.rest ?? 0));
    return `
      <li class="editor-row" data-rowkey="${idx}">
        ${reorderHandle()}
        <div class="editor-row-main">
          <div class="editor-row-name-wrap">
            <input class="editor-row-name" type="text" list="${datalistId}" value="${name}" aria-label="${tr('exercise', 'Exercise')}" placeholder="${tr('exercise', 'Exercise')}">
          </div>
          <div class="editor-row-fields">
            <label class="editor-field"><span>${tr('sets', 'Sets')}</span><input type="number" min="0" class="editor-f-sets" value="${sets}"></label>
            <label class="editor-field"><span>${tr('reps_label', 'Reps')}</span><input type="number" min="0" class="editor-f-reps" value="${reps}"></label>
            <label class="editor-field"><span>${tr('kg', 'kg')}</span><input type="number" min="0" step="0.5" class="editor-f-weight" value="${weight}"></label>
            <label class="editor-field"><span>${tr('rest_label', 'Break')} (s)</span><input type="number" min="0" step="5" class="editor-f-rest" value="${rest}"></label>
            <label class="editor-field editor-field-superset"><span><i class="fa-solid fa-layer-group"></i></span>${supersetSelect(ex)}</label>
          </div>
        </div>
        <button type="button" class="editor-remove" aria-label="${tr('remove', 'Remove')}"><i class="fa-solid fa-xmark"></i></button>
      </li>`;
  };

  const circuitBlock = (circuitId, members) => {
    const first = members[0].ex;
    const title = escapeHTML(first.circuitTitle || '');
    const series = escapeHTML(String(first.circuitSeries || 1));
    const rows = members.map(m => exerciseRow(m.ex, m.idx)).join('');
    return `
      <li class="editor-circuit" data-circuit="${escapeHTML(circuitId)}">
        <div class="editor-circuit-head">
          ${reorderHandle()}
          <span class="editor-circuit-icon"><i class="fa-solid fa-layer-group"></i></span>
          <input class="editor-circuit-title" type="text" value="${title}" placeholder="${tr('superset', 'Superset')}" aria-label="${tr('superset_title', 'Superset title')}">
          <label class="editor-circuit-rounds"><span>${tr('rounds', 'Rounds')}</span><input type="number" min="1" class="editor-circuit-series" value="${series}"></label>
          <button type="button" class="editor-circuit-ungroup" title="${tr('ungroup', 'Break up superset')}"><i class="fa-solid fa-link-slash"></i></button>
        </div>
        <ul class="editor-circuit-list">${rows}</ul>
        <button type="button" class="editor-circuit-add"><i class="fa-solid fa-plus"></i> ${tr('add_to_superset', 'Add exercise to superset')}</button>
      </li>`;
  };

  // Walk the (now-contiguous) array, folding consecutive same-circuit members into one block.
  const units = [];
  for (let i = 0; i < exercises.length;) {
    const ex = exercises[i];
    if (ex.circuitId) {
      const cid = ex.circuitId;
      const members = [];
      while (i < exercises.length && exercises[i].circuitId === cid) { members.push({ ex: exercises[i], idx: i }); i++; }
      units.push(circuitBlock(cid, members));
    } else {
      units.push(exerciseRow(ex, i));
      i++;
    }
  }

  container.innerHTML = `
    <div class="clipboard-editor" role="region" aria-label="${tr('edit_plan', 'Edit plan')}">
      <div class="clipboard-editor-head">
        <span class="clipboard-editor-title"><i class="fa-solid fa-pen-to-square"></i> ${tr('edit_plan', 'Edit plan')}</span>
        <button type="button" class="btn primary-btn btn-sm editor-done"><i class="fa-solid fa-check"></i> ${tr('done', 'Done')}</button>
      </div>
      <ul class="editor-list">${units.join('') || `<li class="editor-empty">${tr('no_exercises_injected', 'No exercises yet.')}</li>`}</ul>
      <div class="clipboard-editor-actions">
        <button type="button" class="btn secondary-btn btn-sm editor-add-ex"><i class="fa-solid fa-plus"></i> ${tr('add_exercise', 'Add exercise')}</button>
      </div>
      <p class="clipboard-editor-hint">${tr('edit_exit_hint', 'Tap Done, press Esc, or tap outside to finish.')}</p>
      <datalist id="${datalistId}">${options}</datalist>
    </div>`;

  const editorEl = container.querySelector('.clipboard-editor');
  const listEl = container.querySelector('.editor-list');
  const rowKeyOf = (rowEl) => parseInt(rowEl.dataset.rowkey, 10);

  // --- circuit invariant: members contiguous, shared title/series, clean round counters ---
  function normalizeCircuits() {
    const emitted = new Set();
    const result = [];
    exercises.forEach(ex => {
      if (!ex.circuitId) { result.push(ex); return; }
      if (emitted.has(ex.circuitId)) return;              // members are pulled together on first sight
      emitted.add(ex.circuitId);
      const members = exercises.filter(e => e.circuitId === ex.circuitId);
      const title = members[0].circuitTitle || '';
      const series = members[0].circuitSeries || 1;
      members.forEach(m => { m.circuitTitle = title; m.circuitSeries = series; });
      result.push(...members);
    });
    exercises.length = 0;
    exercises.push(...result);

    if (!activeClientState.circuitRounds) activeClientState.circuitRounds = {};
    const rounds = activeClientState.circuitRounds;
    Object.keys(rounds).forEach(cid => { if (!exercises.some(e => e.circuitId === cid)) delete rounds[cid]; });
    exercises.forEach(ex => {
      if (!ex.circuitId) return;
      const series = ex.circuitSeries || 1;
      rounds[ex.circuitId] = Math.min(Math.max(1, rounds[ex.circuitId] || 1), series);
    });
    if (activeClientState.activeExerciseIndex >= exercises.length) {
      activeClientState.activeExerciseIndex = Math.max(0, exercises.length - 1);
    }
  }
  const commit = () => { normalizeCircuits(); save(); rerender(); };

  // --- field edits: mutate live session without a re-render (keeps input focus/caret) ---
  const bindField = (selector, apply) => {
    listEl.querySelectorAll(selector).forEach(input => {
      input.addEventListener('change', () => {
        const ex = exercises[rowKeyOf(input.closest('.editor-row'))];
        if (!ex) return;
        apply(ex, input.value);
        save();
      });
      input.addEventListener('click', (e) => e.stopPropagation());
    });
  };

  bindField('.editor-f-sets', (ex, v) => {
    const n = Math.max(0, parseInt(v, 10) || 0);
    ex.setsTargetCount = n;
    const logs = activeClientState.logs[ex.id] || (activeClientState.logs[ex.id] = []);
    while (logs.length < n) logs.push({ reps: ex.repsTarget || 0, weight: ex.weightTarget || 0, completed: false, note: '' });
    logs.length = n;
  });
  bindField('.editor-f-reps', (ex, v) => { ex.repsTarget = (v === '' ? ex.repsTarget : (parseInt(v, 10) || 0)); });
  bindField('.editor-f-weight', (ex, v) => { ex.weightTarget = parseFloat(v) || 0; });
  bindField('.editor-f-rest', (ex, v) => { ex.rest = Math.max(0, parseInt(v, 10) || 0); });

  // --- swap the movement in place via the name field (autocompletes from the catalog) ---
  listEl.querySelectorAll('.editor-row-name').forEach(input => {
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('change', () => {
      const ex = exercises[rowKeyOf(input.closest('.editor-row'))];
      if (!ex) return;
      const newName = input.value.trim();
      if (!newName || newName === ex.name) return;
      ex.name = newName; // keep the same slot/id/logs — a swap retargets the movement, not the sets
      save();
    });
  });

  // --- superset membership: None / an existing circuit / a fresh one. Regroup on change. ---
  const circuitMetaOf = (cid) => {
    const m = exercises.find(e => e.circuitId === cid);
    return m ? { title: m.circuitTitle || '', series: m.circuitSeries || 1 } : { title: '', series: DEFAULT_SERIES };
  };
  listEl.querySelectorAll('.editor-row-superset').forEach(sel => {
    sel.addEventListener('click', (e) => e.stopPropagation());
    sel.addEventListener('change', () => {
      const ex = exercises[rowKeyOf(sel.closest('.editor-row'))];
      if (!ex) return;
      const val = sel.value;
      if (val === '') {
        ex.circuitId = null; ex.circuitTitle = ''; ex.circuitSeries = 1;
      } else if (val === '__new__') {
        ex.circuitId = genId ? genId() : `c${Date.now().toString(36)}`;
        ex.circuitTitle = ''; ex.circuitSeries = DEFAULT_SERIES;
      } else {
        const meta = circuitMetaOf(val);
        ex.circuitId = val; ex.circuitTitle = meta.title; ex.circuitSeries = meta.series;
      }
      commit();
    });
  });

  // --- superset header: title + round count apply to every member; ungroup clears them ---
  listEl.querySelectorAll('.editor-circuit').forEach(block => {
    const cid = block.dataset.circuit;
    const membersOf = () => exercises.filter(e => e.circuitId === cid);
    const titleInput = block.querySelector('.editor-circuit-title');
    const seriesInput = block.querySelector('.editor-circuit-series');
    titleInput.addEventListener('click', (e) => e.stopPropagation());
    seriesInput.addEventListener('click', (e) => e.stopPropagation());
    titleInput.addEventListener('change', () => { membersOf().forEach(m => { m.circuitTitle = titleInput.value.trim(); }); save(); });
    seriesInput.addEventListener('change', () => {
      const n = Math.max(1, parseInt(seriesInput.value, 10) || 1);
      membersOf().forEach(m => { m.circuitSeries = n; });
      normalizeCircuits(); // clamps the live round counter to the new series
      save(); rerender();
    });
    block.querySelector('.editor-circuit-ungroup').addEventListener('click', (e) => {
      e.stopPropagation();
      membersOf().forEach(m => { m.circuitId = null; m.circuitTitle = ''; m.circuitSeries = 1; });
      commit();
    });
    block.querySelector('.editor-circuit-add').addEventListener('click', (e) => {
      e.stopPropagation();
      const meta = circuitMetaOf(cid);
      const id = genId ? genId() : `e${Date.now().toString(36)}`;
      const members = membersOf();
      const anchor = members[members.length - 1];
      const insertAt = exercises.indexOf(anchor) + 1;
      const ex = { id, name: '', setsTargetCount: 3, repsTarget: 10, weightTarget: 0, rest: 0,
        circuitId: cid, circuitTitle: meta.title, circuitSeries: meta.series };
      exercises.splice(insertAt, 0, ex);
      activeClientState.logs[id] = Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, completed: false, note: '' }));
      commit();
    });
  });

  // --- remove a row (deletes the exercise entirely) ---
  listEl.querySelectorAll('.editor-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = rowKeyOf(btn.closest('.editor-row'));
      const [removed] = exercises.splice(idx, 1);
      if (removed) delete activeClientState.logs[removed.id];
      commit();
    });
  });

  // --- combined reorder control: tap top/bottom half = nudge; drag = reorder within its own list.
  // A member row's list is its superset; a top-level row/block's list is .editor-list. This keeps a
  // member inside its circuit (cross-circuit moves go through the <select>) and lets whole blocks or
  // standalone rows reorder among the units. The array is rebuilt from the DOM on drop. ---
  const rebuildFromDom = () => {
    const result = [];
    listEl.querySelectorAll(':scope > li').forEach(li => {
      if (li.classList.contains('editor-circuit')) {
        li.querySelectorAll('.editor-row').forEach(r => { const ex = exercises[rowKeyOf(r)]; if (ex) result.push(ex); });
      } else if (li.classList.contains('editor-row')) {
        const ex = exercises[rowKeyOf(li)]; if (ex) result.push(ex);
      }
    });
    exercises.length = 0;
    exercises.push(...result);
  };

  listEl.querySelectorAll('.editor-reorder').forEach(handle => {
    const moveEl = handle.closest('.editor-row') || handle.closest('.editor-circuit');
    const parentList = moveEl.parentElement;
    let dragging = false, startY = 0, moved = false;

    handle.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false; startY = e.clientY;
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      moveEl.classList.add('editor-row-dragging');
      e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      if (Math.abs(e.clientY - startY) > 6) moved = true;
      if (!moved) return;
      // Reorder only among direct siblings (same list) so groups stay intact.
      const sibs = [...parentList.children].filter(c => c !== moveEl && (c.classList.contains('editor-row') || c.classList.contains('editor-circuit')));
      const after = sibs.find(r => e.clientY < r.getBoundingClientRect().top + r.getBoundingClientRect().height / 2);
      if (after) parentList.insertBefore(moveEl, after);
      else parentList.appendChild(moveEl);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      moveEl.classList.remove('editor-row-dragging');
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) {
        rebuildFromDom();
        commit();
      } else {
        // A tap (no drag): top half nudges up, bottom half down, among same-list siblings.
        const sibs = [...parentList.children].filter(c => c.classList.contains('editor-row') || c.classList.contains('editor-circuit'));
        const pos = sibs.indexOf(moveEl);
        const r = handle.getBoundingClientRect();
        const target = (e.clientY - r.top) < r.height / 2 ? pos - 1 : pos + 1;
        if (target < 0 || target >= sibs.length) return;
        parentList.insertBefore(moveEl, target > pos ? sibs[target].nextSibling : sibs[target]);
        rebuildFromDom();
        commit();
      }
    };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });

  // --- exits (zero friction): Done button, add-exercise button, Esc, tap outside the editor ---
  container.querySelector('.editor-done').addEventListener('click', (e) => { e.stopPropagation(); doExit(); });
  container.querySelector('.editor-add-ex').addEventListener('click', (e) => { e.stopPropagation(); openAddExercise(); });

  // Drop any exercise left with a blank name (e.g. an "add to superset" row never filled in).
  const pruneBlanks = () => {
    let changed = false;
    for (let i = exercises.length - 1; i >= 0; i--) {
      if (!(exercises[i].name || '').trim()) {
        const [rm] = exercises.splice(i, 1);
        if (rm) delete activeClientState.logs[rm.id];
        changed = true;
      }
    }
    if (changed) { normalizeCircuits(); save(); }
  };
  const doExit = () => { cleanup(); pruneBlanks(); exit(); };

  const onKey = (e) => { if (e.key === 'Escape') doExit(); };
  const onOutside = (e) => {
    // Ignore taps inside the editor itself or inside any open modal dialog (e.g. Add exercise)
    if (editorEl.contains(e.target) || (e.target.closest && e.target.closest('dialog'))) return;
    doExit();
  };
  function cleanup() {
    clearTimeout(outsideTimer); // if we're torn down before the deferred add fires, never add it
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onOutside, true);
    if (detachDocListeners === cleanup) detachDocListeners = null;
  }

  // Tear down any prior render's document listeners before installing ours, so only one set is live.
  if (detachDocListeners) detachDocListeners();
  detachDocListeners = cleanup;
  document.addEventListener('keydown', onKey);
  // Capture phase so a tap anywhere outside the editor (but inside the overlay) exits first. Deferred
  // one tick so the ✎ click that opened us doesn't immediately count as an outside tap — cleanup()
  // clears this timer, so a re-render that tears us down first can't leak a stale outside listener.
  const outsideTimer = setTimeout(() => document.addEventListener('pointerdown', onOutside, true), 0);

  // Hand cleanup back so the controller can detach listeners if it re-renders us away
  return cleanup;
}
