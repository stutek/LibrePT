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
      <!-- The title OPENS THE MENU too (asked 2026-08-31: "maybe make the ... menu open (edit,
           copy, delete) on session name click instead of separate button"). Added to the ⋯ rather
           than replacing it: that menu holds Delete Session, and a destructive action reachable
           only by tapping a title with no affordance is the ✕ mistake of §38.16 again. The ⋯ stays
           as the one visible mark saying there is more here; this buys the big target the request
           was after. Not a <button> because it holds an h3 and a two-line block; the role, the
           name and the expanded state are what a screen reader and a keyboard need. -->
      <div class="session-title-block" role="button" tabindex="0" aria-haspopup="true"
           aria-expanded="false" data-i18n-label="session_options" aria-label="Session options">
        <h3 id="session-title-text">Clipboard</h3>
      </div>
      <div class="session-title-actions">
        <div class="session-timer-block">
          <!-- Staged-but-not-started: Start lives here (not on the dashboard card, TODO §2.3) so
               tapping it is the one explicit "begin the workout" action. Once tapped it's replaced
               by the live countdown-to-end (updateOverlaySessionTimer), which is what earns the
               clock icon back — a clock ticking down means something once a clock is actually
               running. -->
          <!-- A GLYPH, not words (asked 2026-08-31: "we probably should change start session
               button from text to play glyph"). It was already meant to have one — the markup has
               said fa-circle-play all along — but data-i18n on the button itself made the
               translator replace its whole content with the label, icon included, so what shipped
               was a 123px word button with no glyph in either language. The key moves to
               data-i18n-label, which writes aria-label and leaves the content alone.
               (No backticks in here: this comment lives inside a template literal, and one closed
               it mid-markup — the overlay stopped rendering entirely.)
               tests/unit/test_i18n_parity.py refuses the old shape now.
               Measured: the title beside it goes from 171px to 258px on a 390px phone. -->
          <button id="btn-start-session" class="btn primary-btn btn-glyph" data-i18n-label="btn_start_workout_session" aria-label="Start Session"><i class="fa-solid fa-circle-play"></i></button>
          <div id="overlay-session-timer" class="hidden">
            <i class="fa-solid fa-clock text-primary" id="overlay-session-duration-icon"></i>
            <span id="overlay-session-duration">00:00</span>
          </div>
        </div>
        <!-- Shown only in edit mode (see renderActiveGroupBoard): finishing the plan edit lives on
             the title line next to the mode label, so the editor body needs no header of its own. -->
        <!-- A glyph for the same reason, and this one is what stopped the title truncating: with
             the word there the editor's title block gets 206px on a 390px phone and the session's
             name loses 12px to an ellipsis (27px at 375). Without it the block gets 246px and
             nothing is cut at either size. ✓ beside the ✎ on the title reads as "finished with
             this", which is exactly what it does. -->
        <button id="btn-done-edit" class="btn primary-btn btn-glyph hidden" data-i18n-label="done_editing_plan" aria-label="Done editing plan">
          <i class="fa-solid fa-check"></i>
        </button>
        <div class="session-menu-wrap">
          <button id="btn-session-menu" class="icon-btn" data-i18n-label="session_options" aria-label="Session options" aria-haspopup="true" aria-expanded="false">
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
            <!-- Everybody on the same plan (TODO §8.1). Two or three people doing the identical
                 circuit in lockstep should cost the trainer ONE tap per set, not one per person —
                 and what each of them thought of it stays their own, because feedback is not part
                 of the plan. -->
            <!-- Asked for by a trainer: the deck shows one card open and the rest as peeking rows,
                 which is compact and does not answer "what is the whole session". This opens every
                 card at once; the cards it opens carry no controls (deckCard.js), so reading the
                 plan cannot become logging against the wrong exercise. -->
            <button id="btn-expand-all" class="session-menu-item" role="menuitem">
              <i class="fa-solid fa-up-right-and-down-left-from-center"></i> <span id="btn-expand-all-text" data-i18n="expand_all">Expand all cards</span>
            </button>
            <button id="btn-bind-participants" class="session-menu-item" role="menuitem">
              <i class="fa-solid fa-link"></i> <span data-i18n="bind_participants">Everyone on this plan</span>
            </button>
            <!-- Give someone else tonight's plan (TODO §8.8) — the walk-in who joins a session
                 already underway. A COPY, not a binding: it diverges the moment either plan is
                 edited, which is what a trainer wants when two people do the same session at their
                 own loads. The participants are listed by name, because "copy to whom" is the whole
                 question and a menu item that guesses would be answering it for them. -->
            <button id="btn-copy-plan" class="session-menu-item" role="menuitem" aria-haspopup="true">
              <i class="fa-solid fa-copy"></i> <span data-i18n="copy_plan_to">Copy this plan to…</span>
            </button>
            <div id="copy-plan-targets" class="session-menu-sub hidden" role="menu"></div>
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
        <!-- What the gym already said about this client (TODO §35.3d): the signals and notes
             taken one-handed mid-circuit, waiting where they are finally useful — the moment their
             next plan is being shaped. The ones about movements in THIS plan come first, or the
             ordering reads as arbitrary. Hidden when there is nothing, since an empty block on a
             390px panel costs the plan itself. -->
        <div class="client-focus-item hidden" id="client-focus-gym">
          <span class="client-focus-label">
            <i class="fa-solid fa-bell-concierge"></i>
            <span id="client-focus-gym-label">In the gym</span>
          </span>
          <ul id="client-focus-gym-notes" class="gym-note-list"></ul>
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
