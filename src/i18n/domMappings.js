// src/i18n/domMappings.js - DOM Selector to i18n Translation Key Mappings

export function applyStaticDOMMappings(tDict) {
  if (!tDict) return;

  // Map of selector to translation key
  const staticMappings = {
    '.logo-area h1': 'logo_title',
    // Application (☰) header menu + About / Terms modals
    '#menu-label-lang': 'menu_language',
    '#menu-label-theme': 'menu_theme',
    '#menu-connect-cloud': 'menu_connect_cloud',
    '#menu-export-data': 'menu_export_data',
    '#menu-github': 'menu_github',
    '#menu-about': 'menu_about',
    '#menu-terms': 'menu_terms',
    '#about-title': 'about_title',
    '#about-body': 'about_body',
    '#about-repo-link': 'about_repo',
    '#terms-title': 'terms_title',
    '#terms-body': 'terms_body',
    '#btn-terms-agree': 'terms_agree',
    'button[data-view="clients"] span': 'tab_clients',
    'button[data-view="routines"] span': 'tab_routines',
    'button[data-view="exercises"] span': 'tab_exercises',
    'button[data-view="history"] span': 'tab_history',
    
    // Dashboard / Clients view
    '#sessions-view-title': 'sessions_schedule',
    '#pending-adjustments-title': 'pending_adjustments',
    '#view-clients .view-header h2': 'clients_title',
    '#btn-add-client': 'btn_add_client',
    '#btn-sync-data-text': 'btn_sync_data',
    
    // Client Detail view
    '#view-client-detail .client-profile-card h4:nth-of-type(1)': 'notes_injuries',
    '#view-client-detail .client-profile-card h4:nth-of-type(2)': 'goals',
    '#view-client-detail .client-profile-card h4:nth-of-type(3)': 'routine_plans',
    '#btn-edit-client': 'btn_edit_profile',
    '#btn-start-client-workout': 'btn_log_workout',
    '#view-client-detail .history-section h5': 'client_history_header',
    '#btn-back-to-clients': 'btn_back',
    
    // Routines View
    '#view-routines .view-header h2': 'routines_title',
    '#btn-add-routine': 'btn_create_routine',
    '#view-routines .view-desc': 'routines_desc',
    
    // Exercises View
    '#view-exercises .view-header h2': 'exercises_title',
    '#btn-add-exercise': 'btn_add_exercise',
    '.filter-chips button[data-filter="All"]': 'filter_all',
    
    // History View
    '#view-history .view-header h2': 'history_title',
    '#view-history .view-desc': 'history_desc',
    
    // Active session clipboard overlay
    '#btn-add-exercise-to-session': 'btn_inject_exercise',
    '#btn-delete-session': 'btn_delete_session',
    '#btn-finish-session': 'btn_complete',

    // Dialog setups
    '#dialog-workout-setup .modal-header h3': 'workout_setup_title',
    '#dialog-workout-setup label[for="setup-participants-assignment-list"]': 'select_participants',
    '#dialog-workout-setup button[type="submit"]': 'btn_launch_clipboard',
    
    '#dialog-add-session-exercise .modal-header h3': 'add_ex_session_title',
    '#dialog-add-session-exercise label[for="session-add-select-ex"]': 'select_exercise',
    '#dialog-add-session-exercise label[for="session-add-sets"]': 'sets',
    '#dialog-add-session-exercise label[for="session-add-reps"]': 'reps',
    '#dialog-add-session-exercise label[for="session-add-weight"]': 'weight',
    '#dialog-add-session-exercise label[for="session-add-rest"]': 'rest_seconds',
    '#dialog-add-session-exercise button[type="submit"]': 'btn_inject',
    
    '#dialog-feedback .modal-header h3': 'log_client_feedback',
    '#dialog-feedback label[for="feedback-custom-note"]': 'custom_details',
    '#dialog-feedback button[type="submit"]': 'btn_log_alert',
    '#label-voice-note': 'voice_note_label',
    '#voice-record-status': 'voice_ready',

    '#dialog-backup .modal-header h3': 'backup_center',
    '#dialog-backup .dialog-desc': 'backup_desc',
    '#sync-data-title': 'sync_session_title',
    '#sync-data-desc': 'sync_session_desc',
    '#backup-export-title': 'backup_export_title',
    '#backup-export-desc': 'backup_export_desc',
    '#btn-export-db': 'btn_export_json',
    '#backup-import-title': 'backup_import_title',
    '#backup-import-desc': 'backup_import_desc',
    '#btn-select-json': 'btn_select_json',
    '#dialog-backup .danger-zone h4': 'danger_zone',
    '#dialog-backup .danger-zone p': 'danger_desc',
    '#dialog-backup #btn-reset-db': 'btn_reset_db',

    // Not-found (error) view
    '#error-view-title': 'error_title',
    '#view-error .view-desc': 'error_desc',
    '#btn-error-home': 'btn_error_home',
    
    // Add Client modal
    '#client-modal-title': 'add_new_client',
    '#dialog-client label[for="client-name"]': 'client_name',
    '#dialog-client label[for="client-goals"]': 'goals',
    '#dialog-client button[type="submit"]': 'save_client',
    
    // Routine Template modal
    '#routine-modal-title': 'create_routine_title',
    '#dialog-routine label[for="routine-name"]': 'routine_name',
    '#dialog-routine label[for="routine-desc"]': 'routine_desc',
    '#dialog-routine button[type="submit"]': 'btn_save_routine'
  };
  
  for (const selector in staticMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const key = staticMappings[selector];
      const val = tDict[key];
      if (val) {
        const icon = el.querySelector('i');
        if (icon) {
          el.innerHTML = '';
          el.appendChild(icon);
          el.appendChild(document.createTextNode(' ' + val));
        } else {
          el.textContent = val;
        }
      }
    }
  }

  // Update input placeholders
  const placeholderMappings = {
    '#search-clients': 'placeholder_search_clients',
    '#search-routines': 'placeholder_search_routines',
    '#search-exercises': 'placeholder_search_exercises',
    '#client-goals': 'goals_placeholder',
    '#feedback-custom-note': 'custom_details'
  };

  for (const selector in placeholderMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const key = placeholderMappings[selector];
      const val = tDict[key];
      if (val) {
        el.placeholder = val;
      }
    }
  }

  // Update screen-reader region labels
  const ariaMappings = {
    '#sessions-categories-grid': 'sessions_schedule'
  };

  for (const selector in ariaMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const val = tDict[ariaMappings[selector]];
      if (val) {
        el.setAttribute('aria-label', val);
      }
    }
  }
}
