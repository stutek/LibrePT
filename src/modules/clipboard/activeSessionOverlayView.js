// Markup-only companion to activeSessionController.js — the three `renderXShell`/`renderXDialog`
// functions that inject the full-screen active-session overlay shell, the "add exercise to plan"
// dialog, and the exercise-catalog picker dialog. Pure DOM-injection (idempotent existence-guard,
// static HTML string, no closures over `activeSession`/`appDeps`), so it has no reason to share a
// file with active-session STATE and BEHAVIOR. TODO §14.9: the shell split (§14.5) grew
// activeSessionController.js by adding markup ownership on top of its existing behavior logic
// instead of extracting a companion view file — this is that extraction, unchanged in content.

import { renderMarkupOnce } from "../common/dom.js";

export function renderAddSessionExerciseDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-add-session-exercise"),
    `
<dialog id="dialog-add-session-exercise" class="dialog-modal card glassmorphic">
    <div class="modal-header">
      <h3>Inject Exercise to Active Plan</h3>
      <button class="modal-close-btn" aria-label="Close add exercise modal"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="form-add-session-exercise" method="dialog" class="modal-form">
      <div class="form-group">
        <label for="session-add-select-ex">Select Exercise *</label>
        <!-- Free-text combobox: type any name (matching library exercises are offered in the
             datalist as you type; a name that isn't in the library is injected as-is). -->
        <input id="session-add-select-ex" list="session-ex-datalist" required class="form-control"
               autocomplete="off" placeholder="Type to search or add a new exercise…">
        <datalist id="session-ex-datalist"><!-- Injected via JS --></datalist>
      </div>

      <div class="form-row">
        <div class="form-group col">
          <label for="session-add-sets">Sets</label>
          <input type="number" id="session-add-sets" min="1" value="3" required class="form-control">
        </div>
        <div class="form-group col">
          <label for="session-add-reps">Reps</label>
          <input type="number" id="session-add-reps" min="1" value="10" required class="form-control">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group col">
          <label for="session-add-weight">Weight (kg)</label>
          <input type="number" step="0.5" id="session-add-weight" value="0" class="form-control">
        </div>
        <div class="form-group col">
          <label for="session-add-rest">Rest (sec)</label>
          <input type="number" id="session-add-rest" min="0" value="60" class="form-control">
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn secondary-btn modal-cancel">Cancel</button>
        <button type="submit" class="btn primary-btn">Inject Exercise</button>
      </div>
    </form>
  </dialog>
`,
  );
}

export function renderCatalogPickerDialog() {
  renderMarkupOnce(
    "dialogs-root",
    (root) => root.querySelector("#dialog-catalog-picker"),
    `
<dialog id="dialog-catalog-picker" class="dialog-modal card glassmorphic wide-modal">
    <div class="modal-header">
      <h3 id="catalog-picker-title">Add from Exercise Catalog</h3>
      <button class="modal-close-btn" aria-label="Close catalog"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div id="catalog-picker-mount" class="exercise-picker"></div>
  </dialog>
`,
  );
}

export function renderActiveSessionOverlayShell() {
  renderMarkupOnce(
    "active-session-overlay",
    (root) => root.querySelector(".session-title-bar"),
    `
    <div class="session-title-bar view-titlebar">
      <button class="view-grabber" type="button" aria-label="Close session and return to home"></button>
      <div class="session-title-block">
        <h3 id="session-title-text">Clipboard</h3>
      </div>
      <div class="session-title-actions">
        <div class="session-timer-block">
          <!-- Staged-but-not-started: Start lives here (not on the dashboard card, TODO §2.3) so
               tapping it is the one explicit "begin the workout" action. Once tapped it's replaced
               by the live countdown-to-end (updateOverlaySessionTimer), which is what earns the
               clock icon back — a clock ticking down means something once a clock is actually
               running. -->
          <button id="btn-start-session" class="btn primary-btn btn-sm" data-i18n="btn_start_workout_session" aria-label="Start session"><i class="fa-solid fa-circle-play"></i> Start Session</button>
          <div id="overlay-session-timer" class="hidden">
            <i class="fa-solid fa-clock text-primary" id="overlay-session-duration-icon"></i>
            <span id="overlay-session-duration">00:00</span>
          </div>
        </div>
        <!-- Shown only in edit mode (see renderActiveGroupBoard): finishing the plan edit lives on
             the title line next to the mode label, so the editor body needs no header of its own. -->
        <button id="btn-done-edit" class="btn primary-btn btn-sm hidden" aria-label="Done editing plan">
          <i class="fa-solid fa-check"></i> <span data-i18n="done">Done</span>
        </button>
        <div class="session-menu-wrap">
          <button id="btn-session-menu" class="icon-btn" aria-label="Session options" aria-haspopup="true" aria-expanded="false">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <!-- Edit lives in here rather than beside the title (reported 2026-08-18: "the three dots
               menu and edit icon take too much space from the title label"). Measured on a 390px
               phone, the two icons plus their gaps took 48px of a bar where the title had 169 —
               under half. Folding one in gives the title the larger share without shrinking a touch
               target or costing a row of height, and it also gives this menu a second reason to
               exist: it held nothing but Delete. -->
          <div id="session-menu" class="session-menu hidden" role="menu">
            <button id="btn-edit-plan" class="session-menu-item" role="menuitem" aria-label="Edit plan">
              <i class="fa-solid fa-pen-to-square"></i> <span data-i18n="edit_plan">Edit plan</span>
            </button>
            <button id="btn-delete-session" class="session-menu-item session-menu-item-danger" role="menuitem">
              <i class="fa-solid fa-trash-can"></i> Delete Session
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Client selector tabs for sub-second plan switching -->
    <div id="active-session-client-tabs" class="client-tabs-bar">
      <!-- Injected via JS: [Jane Doe] [John Smith] [Sarah Jenkins] -->
    </div>

    <!-- Active Client Clipboard Content (Budgeted height, scroll-free design) -->
    <div class="clipboard-body">
      <!-- Health Caveat Banner (crucial for PT awareness) -->
      <div id="clipboard-client-alert" class="client-caveat-banner">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span id="clipboard-client-notes-text">Notes go here</span>
      </div>

      <!-- Client focus panel: personal goals + notes, surfaced while editing the plan
           (with the active-member tabs and live timer hidden) so the trainer shapes the
           program against the client's aims rather than the running session. -->
      <div id="clipboard-client-focus" class="client-focus-panel">
        <div class="client-focus-item">
          <span class="client-focus-label">
            <i class="fa-solid fa-bullseye"></i>
            <span id="client-focus-goals-label">Training Goals</span>
          </span>
          <p id="client-focus-goals"></p>
        </div>
        <div class="client-focus-item">
          <span class="client-focus-label">
            <i class="fa-solid fa-notes-medical"></i>
            <span id="client-focus-notes-label">Notes</span>
          </span>
          <p id="client-focus-notes"></p>
        </div>
      </div>

      <!-- Vertical Exercise List: the in-focus card is the primary logging surface
           (stats + one-tap Too Easy / Too Hard / Feedback), upcoming exercises stack below -->
      <div id="active-exercise-scroll-deck" class="exercise-vertical-list">
        <!-- Dynamically populated card elements: Past Session Exercises, Current Exercises (Completed/In-Focus/Upcoming) -->
      </div>

      <!-- Historical review panel: only shown when a past-session card is tapped -->
      <div id="clipboard-logger-container" class="clipboard-grid-card card glassmorphic hidden">
        <!-- Populated by showPastExerciseInFocus() -->
      </div>

      <!-- Active Client Level Controls -->
      <div class="clipboard-actions-row" style="display: none !important;">
        <button id="btn-add-exercise-to-session" class="btn secondary-btn btn-sm">
          <i class="fa-solid fa-circle-plus"></i> Inject Exercise
        </button>
      </div>

      <!-- Session Completion Drawer: Start moved to the title bar's session-timer-block above (only
           Complete is a footer action now), shown once the session is running (renderActiveGroupBoard). -->
      <div class="session-actions-footer mt-auto hidden">
        <div class="session-finish-row">
          <button id="btn-finish-session" class="btn success-btn btn-sm flex-1">Complete Workout Session</button>
        </div>
      </div>
    </div>
`,
  );
}
