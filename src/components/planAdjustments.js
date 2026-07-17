// components/planAdjustments.js
// Logic for displaying the pending plan adjustments widget on the dashboard,
// as well as launching and submitting the interactive Apply Plan Adjustment Dialog wizard.

/**
 * Renders the pending plan adjustments alert cards.
 * @param {HTMLElement} container - The list container element.
 * @param {HTMLElement} countBadge - The notification badge showing adjustment count.
 * @param {Object} ctx - Context holding state, translation, and navigation helpers.
 */
export function renderPendingPlanAdjustmentsComponent(container, countBadge, ctx) {
  const { state, t, escapeHTML, openAdjustmentWizard } = ctx;
  
  if (!container) return;
  container.innerHTML = '';
  
  const unresolved = (state.planUpdates || []).filter(u => !u.resolved);
  
  if (countBadge) {
    countBadge.textContent = unresolved.length;
    if (unresolved.length === 0) {
      countBadge.style.display = 'none';
    } else {
      countBadge.style.display = 'inline-block';
    }
  }
  
  if (unresolved.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px;">${t('no_pending_adjustments')}</div>`;
    return;
  }
  
  unresolved.forEach(u => {
    const card = document.createElement('div');
    card.className = 'adjustment-card card glassmorphic';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.padding = '12px';
    card.style.marginBottom = '8px';
    card.style.borderLeft = '4px solid var(--accent-cyan)';
    
    const info = document.createElement('div');
    info.style.flex = '1';
    
    // Format tag badge color based on severity
    let badgeClass = 'badge-cyan';
    if (u.tag.includes('Pain') || u.tag.includes('Discomfort')) badgeClass = 'badge-danger';
    else if (u.tag.includes('Hard')) badgeClass = 'badge-warning';
    else if (u.tag.includes('Easy') || u.tag.includes('Progression')) badgeClass = 'badge-success';
    
    let voiceNoteHTML = '';
    if (u.hasVoiceNote) {
      voiceNoteHTML = `
        <div class="mini-audio-note" style="display: flex; align-items: center; gap: 6px; margin-top: 6px; background: rgba(0,255,255,0.05); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(0,255,255,0.15); width: fit-content;">
          <button type="button" class="btn-play-adjustment-audio" data-id="${u.id}" style="background: none; border: none; color: var(--accent-cyan); cursor: pointer; padding: 0; display: inline-flex; align-items: center;"><i class="fa-solid fa-circle-play" style="font-size: 14px;"></i></button>
          <span class="audio-status-label" style="font-size: 9px; color: var(--text-muted); font-family: monospace;">voice_memo.wav (0:04)</span>
        </div>
      `;
    }

    info.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
        <strong style="color: var(--text-color); font-size: 13px;">${escapeHTML(u.clientName)}</strong>
        <span class="badge ${badgeClass}" style="font-size: 9px; padding: 2px 6px;">${escapeHTML(u.tag)}</span>
      </div>
      <div style="font-size: 11px; color: var(--text-muted);">
        ${t('exercise_of')}: <span class="font-semibold" style="color: var(--accent-cyan);">${escapeHTML(u.exerciseName)}</span>
      </div>
      ${voiceNoteHTML}
    `;
    
    const btn = document.createElement('button');
    btn.className = 'btn primary-btn btn-xs btn-resolve-alert';
    btn.innerHTML = `<i class="fa-solid fa-check"></i> ${t('btn_resolve')}`;
    btn.addEventListener('click', () => {
      openAdjustmentWizard(u.id);
    });
    
    card.appendChild(info);
    card.appendChild(btn);

    // Bind event to play audio preview
    if (u.hasVoiceNote) {
      const playBtn = card.querySelector('.btn-play-adjustment-audio');
      const audioStatus = card.querySelector('.audio-status-label');
      if (playBtn && audioStatus) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const playIcon = playBtn.querySelector('i');
          if (playIcon.classList.contains('fa-circle-play')) {
            playIcon.className = 'fa-solid fa-circle-pause';
            audioStatus.textContent = t('voice_playing');
            
            setTimeout(() => {
              playIcon.className = 'fa-solid fa-circle-play';
              audioStatus.textContent = 'voice_memo.wav (0:04)';
            }, 3000);
          } else {
            playIcon.className = 'fa-solid fa-circle-play';
            audioStatus.textContent = 'voice_memo.wav (0:04)';
          }
        });
      }
    }

    container.appendChild(card);
  });
}

/**
 * Opens and initializes the Apply Plan Adjustment interactive dialog form.
 * @param {string} updateId - The adjustment update model's unique ID.
 * @param {Object} ctx - Context holding state, translation, and UI refresh callbacks.
 */
export function openAdjustmentWizardComponent(updateId, ctx) {
  const { state, t, escapeHTML, saveToLocalStorage, renderRoutinesList, renderPendingPlanAdjustments } = ctx;

  const update = state.planUpdates.find(u => u.id === updateId);
  if (!update) return;

  const dialog = document.getElementById('dialog-apply-adjustment');
  if (!dialog) return;

  // Set inputs
  document.getElementById('adjust-update-id').value = updateId;
  document.getElementById('adjust-client-id').value = update.clientId;
  
  // Set text labels
  document.getElementById('adjust-client-name').textContent = update.clientName;
  document.getElementById('adjust-feedback-tag').textContent = update.tag;
  
  // Parse note details for display
  let cleanNote = update.tag;
  if (update.tag.includes(' - ')) {
    const parts = update.tag.split(' - ');
    document.getElementById('adjust-feedback-tag').textContent = parts[0];
    cleanNote = parts.slice(1).join(' - ');
  }
  document.getElementById('adjust-details').textContent = cleanNote;

  // Voice note player handling
  const voiceContainer = document.getElementById('adjust-voice-player-container');
  if (update.hasVoiceNote) {
    voiceContainer.classList.remove('hidden');
    const playBtn = document.getElementById('adjust-btn-play-voice');
    // reset listener
    playBtn.replaceWith(playBtn.cloneNode(true));
    const newPlayBtn = document.getElementById('adjust-btn-play-voice');
    newPlayBtn.addEventListener('click', () => {
      const icon = newPlayBtn.querySelector('i');
      if (icon.classList.contains('fa-circle-play')) {
        icon.className = 'fa-solid fa-circle-pause';
        setTimeout(() => {
          icon.className = 'fa-solid fa-circle-play';
        }, 3000);
      } else {
        icon.className = 'fa-solid fa-circle-play';
      }
    });
  } else {
    voiceContainer.classList.add('hidden');
  }

  // Find target exercise & routine database links
  const exercise = state.exercises.find(e => e.name === update.exerciseName);
  const exerciseId = exercise ? exercise.id : '';
  const routine = state.routines.find(r => r.exercises.some(ex => ex.id === exerciseId));
  const exMapping = routine ? routine.exercises.find(ex => ex.id === exerciseId) : null;

  document.getElementById('adjust-routine-id').value = routine ? routine.id : '';
  document.getElementById('adjust-exercise-id').value = exerciseId;

  // Default panel action setup
  document.getElementById('adjust-action-type').value = 'modify';
  document.getElementById('adjust-panel-modify').classList.remove('hidden');
  document.getElementById('adjust-panel-swap').classList.add('hidden');

  // Pre-fill parameters
  document.getElementById('adjust-weight').value = exMapping ? exMapping.weight : 0;
  document.getElementById('adjust-reps').value = exMapping ? exMapping.reps : 10;
  document.getElementById('adjust-sets').value = exMapping ? exMapping.sets : 3;

  // Pre-fill smart load offsets (recommend 2.5kg increase if tag is "Too Easy", decrease if "Too Hard")
  if (update.tag.includes('Easy')) {
    document.getElementById('adjust-weight').value = exMapping ? exMapping.weight + 2.5 : 2.5;
  } else if (update.tag.includes('Hard')) {
    document.getElementById('adjust-weight').value = exMapping ? Math.max(0, exMapping.weight - 2.5) : 0;
  }

  // Fill swap select options
  const swapSelect = document.getElementById('adjust-exercise-swap');
  swapSelect.innerHTML = '';
  state.exercises.forEach(ex => {
    if (ex.id !== exerciseId) {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = `${ex.name} (${ex.category})`;
      swapSelect.appendChild(opt);
    }
  });

  // Action select toggle listeners
  const actionTypeSelect = document.getElementById('adjust-action-type');
  actionTypeSelect.replaceWith(actionTypeSelect.cloneNode(true));
  const newActionTypeSelect = document.getElementById('adjust-action-type');
  newActionTypeSelect.addEventListener('change', () => {
    const action = newActionTypeSelect.value;
    if (action === 'modify') {
      document.getElementById('adjust-panel-modify').classList.remove('hidden');
      document.getElementById('adjust-panel-swap').classList.add('hidden');
    } else if (action === 'swap') {
      document.getElementById('adjust-panel-modify').classList.add('hidden');
      document.getElementById('adjust-panel-swap').classList.remove('hidden');
    } else {
      document.getElementById('adjust-panel-modify').classList.add('hidden');
      document.getElementById('adjust-panel-swap').classList.add('hidden');
    }
  });

  // Close modals listeners
  dialog.querySelectorAll('.modal-cancel, .modal-close-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  dialog.querySelectorAll('.modal-cancel, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => dialog.close());
  });

  // Form submit handler
  const form = document.getElementById('form-apply-adjustment');
  form.replaceWith(form.cloneNode(true));
  const newForm = document.getElementById('form-apply-adjustment');
  newForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const action = newActionTypeSelect.value;
    const rId = document.getElementById('adjust-routine-id').value;
    const exId = document.getElementById('adjust-exercise-id').value;

    const targetRoutine = state.routines.find(r => r.id === rId);

    if (action === 'modify' && targetRoutine) {
      const targetEx = targetRoutine.exercises.find(ex => ex.id === exId);
      if (targetEx) {
        targetEx.weight = parseFloat(document.getElementById('adjust-weight').value) || 0;
        targetEx.reps = document.getElementById('adjust-reps').value;
        targetEx.sets = parseInt(document.getElementById('adjust-sets').value) || 3;
      }
    } else if (action === 'swap' && targetRoutine) {
      const idx = targetRoutine.exercises.findIndex(ex => ex.id === exId);
      if (idx !== -1) {
        const swapExId = swapSelect.value;
        targetRoutine.exercises[idx].id = swapExId;
      }
    }

    // Resolve alert
    const updateIdx = state.planUpdates.findIndex(u => u.id === updateId);
    if (updateIdx !== -1) {
      state.planUpdates[updateIdx].resolved = true;
    }

    saveToLocalStorage();
    renderPendingPlanAdjustments();
    renderRoutinesList();
    dialog.close();
  });

  dialog.showModal();
}
