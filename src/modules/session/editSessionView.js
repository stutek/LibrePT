// src/modules/session/editSessionView.js - Modular view renderer for Edit Session & Workout Session Setup view
// Encapsulates the DOM structure and rendering logic for #view-workout-setup.

import { renderMarkupOnce } from "../common/dom.js";

export function renderWorkoutSetupViewShell() {
  renderMarkupOnce(
    "main-content",
    (mainContent) => mainContent.querySelector("#view-workout-setup"),
    `<section id="view-workout-setup" class="app-view"></section>`,
  );
}

export function renderEditSessionView(targetElement) {
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
          <p class="dialog-desc text-sm text-muted mb-3" data-i18n="workout_setup_desc">Set the slot and the place, then add the clients who are training. Each one can be given their own programme, or all of them the same one.</p>

          <div class="grid grid-2-col gap-2 mb-3">
            <div>
              <label for="setup-session-name" data-i18n="label_session_name">Session Name</label>
              <input type="text" id="setup-session-name" class="form-control" list="setup-session-name-list" placeholder="Select or type session name...">
              <datalist id="setup-session-name-list">
                <option value="Morning Strength"></option>
                <option value="Hypertrophy Upper"></option>
                <option value="Full Body Conditioning"></option>
                <option value="Cardio & Core"></option>
                <option value="Athletic Performance"></option>
                <option value="Mobility & Recovery"></option>
                <option value="Lower Body Power"></option>
                <option value="Personal Training 1-on-1"></option>
              </datalist>
              <p class="form-error" id="setup-session-name-error" hidden></p>
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
              <p class="form-error" id="setup-location-error" hidden></p>
            </div>
          </div>

          <div class="grid grid-3-col gap-2 mb-3">
            <div>
              <label for="setup-session-date" data-i18n="label_session_date">Date *</label>
              <input type="text" id="setup-session-date" class="form-control" required>
            </div>
            <div>
              <label for="setup-start-time" data-i18n="label_start_time">Start Time *</label>
              <input type="text" id="setup-start-time" class="form-control" placeholder="09:00" required>
            </div>
            <div>
              <label for="setup-end-time" data-i18n="label_end_time">End Time *</label>
              <input type="text" id="setup-end-time" class="form-control" placeholder="10:00" required>
            </div>
          </div>

          <!-- Repeating slot (TODO §35.3a). A trainer's week is mostly the same week: "Tuesdays and
               Thursdays at six" is ONE thing to set up, and the board owes every evening it
               produces. Off by default, because a one-off is still the thing being created most
               often and a repeat left ticked by accident fills eight weeks. -->
          <div class="setup-repeat mb-3">
            <label class="setup-repeat-toggle" for="setup-repeat">
              <input type="checkbox" id="setup-repeat">
              <span id="setup-repeat-label" data-i18n="label_repeats">Repeats every week</span>
            </label>
            <div id="setup-repeat-detail" class="setup-repeat-detail hidden">
              <p id="setup-repeat-days-label" class="text-sm text-muted m-0" data-i18n="label_repeat_days">On these days</p>
              <div id="setup-repeat-days" class="setup-repeat-days"></div>
              <label for="setup-repeat-until" class="text-sm" data-i18n="label_repeat_until">Until (optional)</label>
              <input type="text" id="setup-repeat-until" class="form-control">
            </div>
          </div>

          <!-- Which evening of a repeating session is being edited (TODO §35.3a). Shown only when
               the answer is "one of them", because that is when a trainer needs to know that what
               they change here does not touch next week. -->
          <div id="setup-occurrence-scope" class="setup-occurrence-note mb-3" hidden>
            <p id="setup-occurrence-note" class="text-sm m-0" role="status"></p>
            <label class="setup-repeat-toggle" for="setup-apply-to-series">
              <input type="checkbox" id="setup-apply-to-series">
              <span id="setup-apply-to-series-label" data-i18n="label_apply_to_series">Change every evening of this session</span>
            </label>
          </div>

          <!-- Live double-booking readout for the slot above (TODO §1.6). aria-live because it
               appears in response to typing elsewhere in the form, with no focus change to
               announce it, and it is the one thing here that can make a save wrong. -->
          <ul id="setup-schedule-conflicts" class="setup-conflict-list mb-3" role="status" aria-live="polite" hidden></ul>

          <!-- Who is on this session (TODO §46.2). A trainer with a hundred clients in the base is
               choosing two of them, so the list shows the two: the search field finds a person by
               name and a tap puts them on the session, and only the chosen ones get a row with a
               programme to assign. The old form listed EVERY client with a checkbox and a
               <select>, which is a wall to scroll one-handed and started with all of them ticked. -->
          <div class="participant-picker mb-3">
            <div class="participant-picker-head">
              <label for="setup-participant-search" class="m-0" data-i18n="select_participants">Who is training, and on which programme *</label>
              <span id="setup-participant-count" class="participant-count" role="status" aria-live="polite"></span>
            </div>
            <input type="text" id="setup-participant-search" class="form-control" placeholder="Find a client by name..." data-i18n-placeholder="filter_participants_placeholder" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="setup-participant-matches">
            <ul id="setup-participant-matches" class="participant-match-list" role="listbox" hidden></ul>
            <div id="setup-participants-assignment-list" class="participant-setup-list">
              <!-- Injected via JS, one row per chosen client: Name | [programme] | [remove] -->
            </div>
            <p id="setup-participants-empty" class="participant-empty" data-i18n="no_participants_chosen">Nobody is on this session yet. Find a client in the field above.</p>
          </div>
        </div>

        <div class="modal-actions mt-4 flex justify-end gap-3">
          <button type="button" class="btn secondary-btn modal-cancel setup-cancel-btn" data-i18n="btn_discard_changes">Discard Changes</button>
          <button type="submit" class="btn success-btn"><span data-i18n="btn_launch_clipboard_short">Open in Clipboard</span> <i class="fa-solid fa-clipboard-list ml-1"></i></button>
        </div>
      </form>
    </div>
  `;
}
export const renderWorkoutSetupView = renderEditSessionView;
