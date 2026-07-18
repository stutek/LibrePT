// src/views/historyView.js - Domain module for global and client workout history logs
import { escapeHTML, formatDateStr } from '../helper/utils.js';

export function renderGlobalHistory({ state, t }) {
  const container = document.getElementById('global-history-list');
  if (!container) return;
  container.innerHTML = '';

  const sorted = [...state.history].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">${t('no_workouts_history')}</div>`;
    return;
  }

  renderHistoryItems({ historyList: sorted, container, t });
}

export function renderHistoryItems({ historyList, container, t }) {
  historyList.forEach(log => {
    const card = document.createElement('div');
    card.className = 'history-card card glassmorphic';
    
    const minutes = Math.floor(log.duration / 60);
    const durationText = minutes > 0 ? `${minutes} ${t('min_session')}` : t('less_than_minute');

    let exercisesLogHTML = '';
    log.exercises.forEach(ex => {
      const setsText = ex.sets.map(s => {
        return `${s.weight}kg×${s.reps}${s.note ? ` (${s.note})` : ''}`;
      }).join(', ');
      
      const feedbackItems = (log.feedback || []).filter(f => f.exerciseName === ex.name);
      let feedbackIconsHTML = '';
      
      feedbackItems.forEach(f => {
        let iconClass = 'fa-solid fa-comment-dots text-primary';
        let title = f.tag;
        
        if (f.tag.includes('Too Easy') || f.tag.includes('Increase Load')) {
          iconClass = 'fa-solid fa-rocket text-success';
        } else if (f.tag.includes('Too Hard') || f.tag.includes('Reduce Load')) {
          iconClass = 'fa-solid fa-triangle-exclamation text-warning';
        } else if (f.tag.includes('Form Break') || f.tag.includes('Focus') || f.tag.includes('Form')) {
          iconClass = 'fa-solid fa-microscope text-warning';
        } else if (f.tag.includes('Pain') || f.tag.includes('Discomfort')) {
          iconClass = 'fa-solid fa-fire text-danger';
        } else if (f.tag.includes('easily') || f.tag.includes('Progression') || f.tag.includes('Completed reps')) {
          iconClass = 'fa-solid fa-dumbbell text-success';
        }
        
        const tooltipTitle = title;
        const tooltipBody = f.note ? escapeHTML(f.note) : t('no_details_specified');
        
        feedbackIconsHTML += `
          <span class="history-feedback-icon" onclick="this.classList.toggle('active'); event.stopPropagation();">
            <i class="${iconClass}"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${escapeHTML(tooltipTitle)}</div>
              <div class="tooltip-body">${tooltipBody}</div>
            </span>
          </span>
        `;
      });
      
      const setNotes = ex.sets.filter(s => s.note);
      if (setNotes.length > 0) {
        let notesListHTML = setNotes.map((s, idx) => `<div><strong>${t('set_label')} ${idx + 1}:</strong> ${escapeHTML(s.note)}</div>`).join('');
        feedbackIconsHTML += `
          <span class="history-feedback-icon" onclick="this.classList.toggle('active'); event.stopPropagation();">
            <i class="fa-solid fa-sticky-note text-primary"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${t('trainer_set_notes')}</div>
              <div class="tooltip-body">${notesListHTML}</div>
            </span>
          </span>
        `;
      }

      exercisesLogHTML += `
        <div class="history-ex-row" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px; margin-bottom: 6px;">
          <div>
            <strong>${escapeHTML(ex.name)}</strong>: <span>${escapeHTML(setsText)}</span>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            ${feedbackIconsHTML}
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="history-card-header">
        <div class="history-header-meta">
          <h4>${escapeHTML(log.clientName)}</h4>
          <p>${escapeHTML(log.routineName)} • ${durationText}</p>
        </div>
        <div class="history-date">${formatDateStr(log.date)}</div>
      </div>
      <div class="history-exercise-log">
        ${exercisesLogHTML}
      </div>
    `;

    container.appendChild(card);
  });
}
