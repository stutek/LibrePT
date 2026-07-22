// src/views/workoutSetupView.js - Modular view renderer for Workout Session Create & Edit view
// Encapsulates the DOM structure and rendering logic for #view-workout-setup.

export function renderWorkoutSetupView(targetElement) {
  const container = targetElement || document.getElementById("view-workout-setup");
  if (!container) return;

  container.innerHTML = `
    <div class="view-header view-titlebar">
      <button class="view-grabber" type="button" aria-label="Return to home"></button>
      <h2 id="workout-setup-view-title" data-i18n="workout_setup_title">Start Workout Session</h2>
    </div>

    <div class="card glassmorphic p-4 mb-4 max-w-2xl mx-auto" id="dialog-workout-setup">
      <form id="form-workout-setup" class="modal-form">
        <div class="form-group">
          <p class="dialog-desc text-sm text-muted mb-3" data-i18n="workout_setup_desc">Configure session details and check clients to select participants (2–6). You can assign a distinct routine template to each individual, or select a shared routine.</p>

          <div class="grid grid-2-col gap-2 mb-3">
            <div>
              <label for="setup-session-name" data-i18n="label_session_name">Session Name</label>
              <input type="text" id="setup-session-name" class="form-control" placeholder="e.g. Morning Strength">
            </div>
            <div>
              <label for="setup-location" data-i18n="label_location">Location</label>
              <input type="text" id="setup-location" class="form-control" list="setup-location-list" placeholder="Select or type location...">
              <datalist id="setup-location-list">
                <option value="Trib gym base"></option>
                <option value="playground outside"></option>
                <option value="city park"></option>
                <option value="Studio A"></option>
                <option value="Main Gym Floor"></option>
              </datalist>
            </div>
          </div>

          <div class="grid grid-3-col gap-2 mb-3">
            <div>
              <label for="setup-session-date" data-i18n="label_session_date">Date (YYYY-MM-DD) *</label>
              <input type="date" id="setup-session-date" class="form-control" placeholder="YYYY-MM-DD" required>
            </div>
            <div>
              <label for="setup-start-time" data-i18n="label_start_time">Start Time (24h) *</label>
              <input type="time" id="setup-start-time" class="form-control" placeholder="09:00" required>
            </div>
            <div>
              <label for="setup-end-time" data-i18n="label_end_time">End Time (24h) *</label>
              <input type="time" id="setup-end-time" class="form-control" placeholder="10:00" required>
            </div>
          </div>

          <div class="participant-filter-bar mb-2 flex items-center justify-between gap-2">
            <label for="setup-participant-search" class="m-0 font-semibold" data-i18n="select_participants">Selected Participants & Assigned Routines *</label>
            <div class="search-input-wrap text-xs" style="width: 200px;">
              <input type="text" id="setup-participant-search" class="form-control text-xs" placeholder="Filter clients..." data-i18n-placeholder="filter_participants_placeholder" style="height: 28px; padding: 2px 8px;">
            </div>
          </div>
          <div id="setup-participants-assignment-list" class="participant-setup-list">
            <!-- Injected via JS: [Checkbox] Name | [Dropdown Select Routine] -->
          </div>
        </div>

        <div class="modal-actions mt-4 flex justify-end gap-3">
          <button type="button" class="btn secondary-btn modal-cancel setup-cancel-btn" data-i18n="btn_discard_changes">Discard Changes</button>
          <button type="submit" class="btn success-btn"><span data-i18n="btn_launch_clipboard_short">Session Details</span> <i class="fa-solid fa-circle-play ml-1"></i></button>
        </div>
      </form>
    </div>
  `;
}
