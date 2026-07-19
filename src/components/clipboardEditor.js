// components/clipboardEditor.js
// The inline "edit mode" render of the active-session clipboard. When the trainer taps a card's
// edit (✎) icon, the whole deck flips into this editable list so exercises can be swapped,
// retargeted, reordered, added, removed — plus each exercise's trailing rest "break" — mid-session.
// It renders as an ALTERNATE view over the same #active-exercise-scroll-deck container; the normal
// deck/focus/logging code is never touched, so leaving edit mode restores the live clipboard as-is.
//
// A break is modelled as the exercise's own `rest` (seconds), so it travels with its exercise when
// reordered. Reorder control is combined: tap its top/bottom half to nudge one row up/down, or drag
// it to move freely. Edits mutate activeClientState in place; the caller persists + re-renders.
//
// deps: {
//   activeClientState, allExerciseNames, t, escapeHTML,
//   save(),        // cache + localStorage, NO re-render (for live field edits)
//   rerender(),    // re-render the board (stays in edit mode) after structural changes
//   openAddExercise(),  // opens the existing #dialog-add-session-exercise
//   exit()         // leave edit mode
// }

export function renderClipboardEditor(container, deps) {
  const { activeClientState, allExerciseNames, t, escapeHTML, save, rerender, openAddExercise, exit } = deps;
  const exercises = activeClientState.exercises;

  const datalistId = 'clipboard-editor-ex-names';
  const options = (allExerciseNames || []).map(n => `<option value="${escapeHTML(n)}"></option>`).join('');

  const rows = exercises.map((ex, idx) => {
    const name = escapeHTML(ex.name || '');
    const sets = escapeHTML(String(ex.setsTargetCount ?? ex.sets ?? 3));
    const reps = escapeHTML(String(ex.repsTarget ?? ex.reps ?? 10));
    const weight = escapeHTML(String(ex.weightTarget ?? ex.weight ?? 0));
    const rest = escapeHTML(String(ex.rest ?? 0));
    const circuitTag = ex.circuitId ? `<span class="editor-row-circuit" title="${escapeHTML(ex.circuitTitle || 'Superset')}"><i class="fa-solid fa-layer-group"></i></span>` : '';
    return `
      <li class="editor-row" data-rowkey="${idx}">
        <button type="button" class="editor-reorder" aria-label="${t('reorder') || 'Reorder'}" title="Tap top/bottom to move, drag to reorder">
          <span class="editor-reorder-up"><i class="fa-solid fa-chevron-up"></i></span>
          <span class="editor-reorder-down"><i class="fa-solid fa-chevron-down"></i></span>
        </button>
        <div class="editor-row-main">
          <div class="editor-row-name-wrap">
            ${circuitTag}
            <input class="editor-row-name" type="text" list="${datalistId}" value="${name}" aria-label="${t('exercise') || 'Exercise'}" placeholder="${t('exercise') || 'Exercise'}">
          </div>
          <div class="editor-row-fields">
            <label class="editor-field"><span>${t('sets') || 'Sets'}</span><input type="number" min="0" class="editor-f-sets" value="${sets}"></label>
            <label class="editor-field"><span>${t('reps_label') || 'Reps'}</span><input type="number" min="0" class="editor-f-reps" value="${reps}"></label>
            <label class="editor-field"><span>${t('kg') || 'kg'}</span><input type="number" min="0" step="0.5" class="editor-f-weight" value="${weight}"></label>
            <label class="editor-field"><span>${t('rest_label') || 'Break'} (s)</span><input type="number" min="0" step="5" class="editor-f-rest" value="${rest}"></label>
          </div>
        </div>
        <button type="button" class="editor-remove" aria-label="${t('remove') || 'Remove'}"><i class="fa-solid fa-xmark"></i></button>
      </li>`;
  }).join('');

  container.innerHTML = `
    <div class="clipboard-editor" role="region" aria-label="${t('edit_plan') || 'Edit plan'}">
      <div class="clipboard-editor-head">
        <span class="clipboard-editor-title"><i class="fa-solid fa-pen-to-square"></i> ${t('edit_plan') || 'Edit plan'}</span>
        <button type="button" class="btn primary-btn btn-sm editor-done"><i class="fa-solid fa-check"></i> ${t('done') || 'Done'}</button>
      </div>
      <ul class="editor-list">${rows || `<li class="editor-empty">${t('no_exercises_injected') || 'No exercises yet.'}</li>`}</ul>
      <div class="clipboard-editor-actions">
        <button type="button" class="btn secondary-btn btn-sm editor-add-ex"><i class="fa-solid fa-plus"></i> ${t('add_exercise') || 'Add exercise'}</button>
      </div>
      <p class="clipboard-editor-hint">${t('edit_exit_hint') || 'Tap Done, press Esc, or tap outside to finish.'}</p>
      <datalist id="${datalistId}">${options}</datalist>
    </div>`;

  const editorEl = container.querySelector('.clipboard-editor');
  const listEl = container.querySelector('.editor-list');

  // --- field edits: mutate live session without a re-render (keeps input focus/caret) ---
  const rowKeyOf = (rowEl) => parseInt(rowEl.dataset.rowkey, 10);

  const bindField = (selector, apply) => {
    listEl.querySelectorAll(selector).forEach(input => {
      input.addEventListener('change', () => {
        const rowEl = input.closest('.editor-row');
        const ex = exercises[rowKeyOf(rowEl)];
        if (!ex) return;
        apply(ex, input.value);
        save();
      });
      // Stop the row's reorder/exit handlers from swallowing input interaction
      input.addEventListener('click', (e) => e.stopPropagation());
    });
  };

  bindField('.editor-f-sets', (ex, v) => {
    const n = Math.max(0, parseInt(v, 10) || 0);
    ex.setsTargetCount = n;
    // Keep the logs array (completion source) in step with the new set count
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
      const rowEl = input.closest('.editor-row');
      const ex = exercises[rowKeyOf(rowEl)];
      if (!ex) return;
      const newName = input.value.trim();
      if (!newName || newName === ex.name) return;
      ex.name = newName; // keep the same slot/id/logs — a swap retargets the movement, not the sets
      save();
    });
  });

  // --- remove a row ---
  listEl.querySelectorAll('.editor-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = rowKeyOf(btn.closest('.editor-row'));
      const [removed] = exercises.splice(idx, 1);
      if (removed) delete activeClientState.logs[removed.id];
      if (activeClientState.activeExerciseIndex >= exercises.length) {
        activeClientState.activeExerciseIndex = Math.max(0, exercises.length - 1);
      }
      save();
      rerender();
    });
  });

  // --- combined reorder control: tap top/bottom half = nudge; drag = free reorder ---
  const move = (from, to) => {
    if (to < 0 || to >= exercises.length || from === to) return;
    const [it] = exercises.splice(from, 1);
    exercises.splice(to, 0, it);
    save();
    rerender();
  };

  listEl.querySelectorAll('.editor-reorder').forEach(handle => {
    const rowEl = handle.closest('.editor-row');
    let dragging = false, startY = 0, moved = false;

    handle.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false; startY = e.clientY;
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      rowEl.classList.add('editor-row-dragging');
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      if (Math.abs(e.clientY - startY) > 6) moved = true;
      if (!moved) return;
      // Reorder DOM nodes live so the drag reads naturally; the array is rebuilt from DOM on drop.
      const rows = [...listEl.querySelectorAll('.editor-row')];
      const after = rows.find(r => r !== rowEl && e.clientY < r.getBoundingClientRect().top + r.offsetHeight / 2);
      if (after) listEl.insertBefore(rowEl, after);
      else listEl.appendChild(rowEl);
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      rowEl.classList.remove('editor-row-dragging');
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) {
        // Rebuild the exercises array to match the new DOM order (rowkey = original index)
        const order = [...listEl.querySelectorAll('.editor-row')].map(r => parseInt(r.dataset.rowkey, 10));
        const reordered = order.map(k => exercises[k]).filter(Boolean);
        exercises.length = 0;
        exercises.push(...reordered);
        activeClientState.activeExerciseIndex = Math.min(activeClientState.activeExerciseIndex, exercises.length - 1);
        save();
        rerender();
      } else {
        // A tap (no drag): top half nudges up, bottom half nudges down
        const idx = rowKeyOf(rowEl);
        const r = handle.getBoundingClientRect();
        move(idx, (e.clientY - r.top) < r.height / 2 ? idx - 1 : idx + 1);
      }
    };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });

  // --- exits (zero friction): Done button, add-exercise button, Esc, tap outside the editor ---
  container.querySelector('.editor-done').addEventListener('click', (e) => { e.stopPropagation(); exit(); });
  container.querySelector('.editor-add-ex').addEventListener('click', (e) => { e.stopPropagation(); openAddExercise(); });

  const onKey = (e) => { if (e.key === 'Escape') { cleanup(); exit(); } };
  const onOutside = (e) => {
    // Ignore taps inside the editor itself or inside any open modal dialog (e.g. Add exercise)
    if (editorEl.contains(e.target) || (e.target.closest && e.target.closest('dialog'))) return;
    cleanup();
    exit();
  };
  function cleanup() {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onOutside, true);
  }
  document.addEventListener('keydown', onKey);
  // Capture phase so a tap anywhere outside the editor (but inside the overlay) exits first
  setTimeout(() => document.addEventListener('pointerdown', onOutside, true), 0);

  // Hand cleanup back so the controller can detach listeners if it re-renders us away
  return cleanup;
}
