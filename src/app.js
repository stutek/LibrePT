// app.js - LibrePT Application Controller Logic
import { DEFAULT_EXERCISES, DEFAULT_CLIENTS, DEFAULT_ROUTINES, DEFAULT_HISTORY, DEFAULT_PLAN_UPDATES, DEFAULT_SESSIONS } from './data/index.js';
import { renderSessionCard } from './components/sessionCard.js';
import { renderSessionList } from './components/sessionList.js';
import { renderClientsDirectory } from './components/clientsDirectory.js';
import { renderExerciseDeck } from './components/exerciseDeck.js';
import { initSessionBar, updateSessionBarTimer, renderActiveSessionBarLabels, renderIdleSessionBar } from './components/sessionBar.js';
import { renderPendingPlanAdjustmentsComponent, openAdjustmentWizardComponent } from './components/planAdjustments.js';
import { initDaySelector, focusSessionsColumn, getFocusedSessionDay, setFocusedSessionDay, sessionDayTemporal, setupSessionsDayNav, renderSessionsTitleBar, getSessionDayDate } from './components/daySelector.js';
import { initSessionTitleBar, renderSessionTitle } from './components/sessionTitleBar.js';
import { renderActiveUsersList, updateClientTabsFadeState } from './components/activeUsersList.js';
import { initApplicationHeader, setupApplicationHeader, incrementLocalSync, resetSyncState, setSyncTrackingReady, renderSyncBadge, applyThemeSwitcherLabels } from './components/applicationHeader.js';
import { TRANSLATIONS } from './i18n/index.js';
import { initRestTimer, setupRestTimer } from './components/restTimer.js';
import { initBackupRestore, setupBackupRestore } from './components/backupRestore.js';
import { initWorkoutSetup, openWorkoutSetupModal, setupWorkoutSetup } from './components/workoutSetup.js';
import { initFeedbackModal, openFeedbackModal, setupFeedbackForms } from './components/feedbackModal.js';
import {
  generateShortUUID,
  getInitials,
  truncateString,
  formatDateStr,
  formatDuration,
  formatSignedDuration,
  formatClockFromMinutes,
  escapeHTML,
  getClientDisplayNameHTML,
  parseTimeRange,
  isTimeOverlapping,
  getOverlappingBookings,
  buildBookingMeta
} from './helper/utils.js';
import {
  renderClientsList as clientsViewRender,
  showClientDetails as clientsViewShowDetails,
  renderClientWorkoutHistory as clientsViewHistory
} from './views/clientsView.js';
import {
  renderRoutinesList as routinesViewRender,
  openRoutineEditorModal as routinesViewOpenEditor,
  addRoutineExerciseRow as routinesViewAddRow
} from './views/routinesView.js';
import {
  renderExercisesList as exercisesViewRender
} from './views/exercisesView.js';
import {
  renderGlobalHistory as historyViewRender,
  renderHistoryItems as historyViewItems
} from './views/historyView.js';
import {
  renderSessions as sessionsViewRender,
  setupCalendarBookings as sessionsViewSetupBookings,
  launchClipboardDirectly as sessionsViewLaunchClipboard,
  seedDemoActiveSession as sessionsViewSeedDemo
} from './views/sessionsView.js';
import {
  setupClientForms as setupClientFormsController,
  setupRoutineForms as setupRoutineFormsController,
  setupExerciseForms as setupExerciseFormsController,
  populateDropdownSelectors as populateDropdownsController
} from './controllers/formsController.js';
import {
  initActiveSessionController,
  startWorkoutSession as startWorkoutSessionController,
  startSessionTimer,
  setupActiveSession as setupActiveSessionController,
  cancelWorkoutSession as cancelWorkoutSessionController,
  finishWorkoutSession as finishWorkoutSessionController,
  saveActiveSessionToCache as saveActiveSessionToCacheController,
  recoverActiveSession as recoverActiveSessionController,
  getActiveSession,
  setActiveSession,
  getActiveExercise as getActiveExerciseController,
  buildSupersetUnits as buildSupersetUnitsController,
  renderActiveGroupBoard as renderActiveGroupBoardController,
  focusIndexFromRef,
  sessionFocusPath,
  syncSessionFocusUrl,
  focusExerciseByIndex
} from './controllers/activeSessionController.js';


function t(key) {
  const lang = state.lang || 'en';
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  return dict[key] || key;
}

function applyTranslations(lang = state.lang || 'en') {
  state.lang = lang;
  
  // Set dropdown switcher value
  const switcher = document.getElementById('lang-switcher');
  if (switcher) switcher.value = lang;

  // Theme dropdown labels are localized outside the staticMappings table (compact forms)
  applyThemeSwitcherLabels();

  const tDict = TRANSLATIONS[lang];
  if (!tDict) return;
  
  // Map of selector to translation key
  const staticMappings = {
    '.logo-area h1': 'logo_title',
    // Application (☰) header menu + About / Terms modals
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
        // preserve icons if any
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

  // The day title bar is data-driven (weekday/date/arrows), so it re-renders rather than map statically
  renderSessionsTitleBar();
}

// --- STATE MANAGEMENT ---
let state = {
  clients: [],
  exercises: [],
  routines: [],
  history: [],
  planUpdates: [],
  bookings: [],
  lang: 'en'
};

// --- INITIALIZE APPLICATION ---
// Best-effort: size the browser window itself to a phone viewport on load/reload, so
// the gym-floor phone view is what you see without manually opening DevTools' device
// toolbar every time. Browsers only honor resizeTo() on a window the page itself opened
// via script with a single tab/history entry (e.g. `chrome --app=<url>`, or a
// window.open() popup) — on an ordinary browser tab this is a documented no-op, not a bug.
function resizeToPhoneViewport() {
  const targetWidth = 412;
  const targetHeight = 915;
  try {
    window.resizeTo(targetWidth, targetHeight);
  } catch (e) {
    // Disallowed by the browser — silently ignored, nothing else on the page depends on it
  }
}

function init() {
  resizeToPhoneViewport();

  // Load data from LocalStorage or initialize with Mock Data
  let savedData = localStorage.getItem('librept_db');
  if (!savedData) {
    // Migrate data from old OpenPT key if it exists
    savedData = localStorage.getItem('openpt_db');
    if (savedData) {
      localStorage.setItem('librept_db', savedData);
      localStorage.removeItem('openpt_db');
      
      const activeSessionData = localStorage.getItem('openpt_active_session');
      if (activeSessionData) {
        localStorage.setItem('librept_active_session', activeSessionData);
        localStorage.removeItem('openpt_active_session');
      }
    }
  }

  if (savedData) {
    try {
      state = JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing local storage database. Re-seeding...', e);
      seedMockData();
    }
  } else {
    seedMockData();
  }

  if (!state.lang) state.lang = 'en';

  // Ensure new bookings/sessions mock data is loaded and has the modern today/tomorrow schema
  const hasTodayOrTomorrow = (state.bookings || []).some(b => b.day === 'today' || b.day === 'tomorrow');
  if (!state.bookings || state.bookings.length < DEFAULT_SESSIONS.length || !hasTodayOrTomorrow) {
    state.bookings = [...DEFAULT_SESSIONS];
    saveToLocalStorage();
  }

  // Demo-data version guard. Editing mockData.js otherwise leaves anyone with an existing
  // localStorage db seeing the old demo data (collections are only seeded on an empty db).
  // Bump SEED_VERSION whenever the demo dataset changes to force a full refresh of every
  // reference collection, then re-seed session 1 as a live workout. This is demo behaviour:
  // it does discard in-session test edits, which is the intent for a reshapeable prototype.
  const SEED_VERSION = 12;
  const storedSeed = parseInt(localStorage.getItem('librept_seed_version') || '0', 10);
  if (storedSeed < SEED_VERSION) {
    state.clients = [...DEFAULT_CLIENTS];
    state.exercises = [...DEFAULT_EXERCISES];
    state.routines = [...DEFAULT_ROUTINES];
    state.history = [...DEFAULT_HISTORY];
    state.planUpdates = [...DEFAULT_PLAN_UPDATES];
    state.bookings = [...DEFAULT_SESSIONS];
    localStorage.setItem('librept_seed_version', String(SEED_VERSION));
    saveToLocalStorage();
    // Demo: open on session 1 already in progress, participants at varied completion
    seedDemoActiveSession();
  }

  // Set up Event Listeners
  setupNavigation();
  setupClientForms();
  setupRoutineForms();
  setupExerciseForms();
  // Initialize Workout Setup Component
  initWorkoutSetup({
    getState: () => state,
    t,
    getClientDisplayNameHTML,
    startWorkoutSession
  });
  setupWorkoutSetup();
  setupActiveSession();

  // Initialize Feedback Modal Component
  initFeedbackModal({
    getState: () => state,
    getActiveSession: () => getActiveSession(),
    t,
    generateShortUUID,
    saveActiveSessionToCache,
    saveToLocalStorage,
    renderPendingPlanAdjustments
  });
  setupFeedbackForms();
  // Initialize Rest Timer component
  initRestTimer({
    getActiveExercise
  });
  setupRestTimer();

  // Initialize Backup & Restore component
  initBackupRestore({
    getState: () => state,
    setState: (newState) => { state = newState; },
    saveToLocalStorage,
    cancelWorkoutSession,
    seedMockData,
    renderClientsList,
    renderRoutinesList,
    renderExercisesList,
    renderGlobalHistory,
    populateDropdownSelectors,
    t
  });
  setupBackupRestore();
  setupCalendarBookings();

  // Initialize Application Header component
  initApplicationHeader({
    getState: () => state,
    t,
    saveToLocalStorage,
    applyTranslations,
    navigateToPath,
    renderClientsList,
    renderRoutinesList,
    renderExercisesList,
    renderGlobalHistory,
    renderPendingPlanAdjustments,
    renderSessions,
    populateDropdownSelectors,
    getActiveSession: () => getActiveSession(),
    renderActiveGroupBoard,
    renderActiveSessionBarLabels
  });

  // Wire event listeners for the header and themes
  setupApplicationHeader();

  // Initialize Day Selector component
  initDaySelector({
    getState: () => state,
    t,
    toRoute,
    toUrl,
    getISODateForColumn
  });

  // Initialize Session Title Bar component
  initSessionTitleBar({
    getActiveSession: () => getActiveSession(),
    getISODateString,
    formatClockFromMinutes
  });

  // Wire the session-bar component with accessors (state/activeSession are reassigned) and
  // the app-level helpers it renders from, before any render that touches the bar.
  initSessionBar({
    getState: () => state,
    getActiveSession: () => getActiveSession(),
    t,
    formatSignedDuration,
    formatDuration,
    parseTimeRange,
    getOverlappingBookings,
    buildBookingMeta,
    getSessionDayDate
  });

  // Apply translations initially
  applyTranslations(state.lang);

  // Render Initial Views
  renderClientsList();
  renderRoutinesList();
  renderExercisesList();
  renderGlobalHistory();
  renderPendingPlanAdjustments();
  renderSessions();
  populateDropdownSelectors();

  // Check if there was an active session saved (session recovery)
  recoverActiveSession();

  // Set up view routing based on URL path
  window.addEventListener('popstate', handlePathChange);
  handlePathChange();

  // Every view (and the active-session clipboard) can be dismissed to the home dashboard the same
  // way: tap the grab handle, or swipe its title bar down. The app-name logo is the third way home.
  setupViewDismiss();

  // Keep the idle bar's "next session" + starts-in countdown fresh even with no other
  // trigger firing (an active session's own 1s tick handles the bar while one is running)
  setInterval(renderIdleSessionBar, 30000);

  // Show the (mock) sync counters, then start counting on-device edits from here
  renderSyncBadge();
  setSyncTrackingReady(true);
}

function seedMockData() {
  const currentLang = state.lang || 'en';
  state.clients = [...DEFAULT_CLIENTS];
  state.exercises = [...DEFAULT_EXERCISES];
  state.routines = [...DEFAULT_ROUTINES];
  state.history = [...DEFAULT_HISTORY];
  state.planUpdates = [...DEFAULT_PLAN_UPDATES];
  state.bookings = [...DEFAULT_SESSIONS];
  state.lang = currentLang;
  saveToLocalStorage();
}

function saveToLocalStorage() {
  localStorage.setItem('librept_db', JSON.stringify(state));
  // Each on-device edit is one more local change "ahead" of the (mock) remote. Seeding runs
  // before syncTrackingReady flips on, so the initial data load doesn't inflate the count.
  incrementLocalSync();
}

// Demo-only: seeds session 1 (b-1) as a live, half-finished workout so the prototype
// opens on a running session rather than an empty dashboard. Each participant is parked
// at a different exercise so the clipboard shows a spread of card-completion counts.
// Written straight to the active-session cache; recoverActiveSession() picks it up on init.
function seedDemoActiveSession() {
  sessionsViewSeedDemo({ state });
}

// --- VIEW ROUTER ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewTarget = item.getAttribute('data-view');
      navigateToPath(`/${viewTarget}`);
    });
  });

  // Logo Area home click handler
  const logoArea = document.getElementById('logo-area');
  if (logoArea) {
    logoArea.addEventListener('click', () => {
      navigateToPath('/clients');
    });
  }

  // Not-found view: return to the dashboard.
  const errorHomeBtn = document.getElementById('btn-error-home');
  if (errorHomeBtn) {
    errorHomeBtn.addEventListener('click', () => {
      navigateToPath('/clients');
    });
  }

  // Theme setup and initialization has been moved to components/applicationHeader.js

  // Client Details back button
  document.getElementById('btn-back-to-clients').addEventListener('click', () => {
    navigateToPath('/clients');
  });

  setupSessionsDayNav();
}

// Theme controller and switcher logic moved to components/applicationHeader.js

function switchView(viewId) {
  // Hide all views
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.remove('active');
  });

  // Deactivate all nav items
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Highlight bottom nav matching tab
  // Handles secondary screens (like client detail) which don't map to bottom nav
  const mainTab = viewId.split('-')[0]; // handles 'client-detail' -> 'client' or matches 'clients'
  const tabItem = document.querySelector(`.bottom-nav .nav-item[data-view^="${mainTab}"]`);
  if (tabItem) {
    tabItem.classList.add('active');
  }

  // Scroll to top
  document.getElementById('main-content').scrollTop = 0;

  // Coming home always re-focuses today, so the trainer never lands on a stale day
  if (viewId === 'clients') {
    requestAnimationFrame(() => focusSessionsColumn('today', 'smooth'));
  }
}

// Not-found view for deep-link URLs that match no route (or reference a deleted entity).
// The URL is left untouched so the bad link stays visible; the omnipresent header stays put
// because #view-error lives inside #main-content like every other view.
function showErrorView(attemptedPath) {
  setHeaderState(false);
  document.getElementById('active-session-overlay').classList.add('hidden');
  const pathEl = document.getElementById('error-view-path');
  if (pathEl) pathEl.textContent = attemptedPath;
  switchView('error');
}

function getISODateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getISODateForColumn(day) {
  const now = Date.now();
  if (day === 'yesterday') return getISODateString(now - 24 * 60 * 60 * 1000);
  if (day === 'today') return getISODateString(now);
  if (day === 'tomorrow') return getISODateString(now + 24 * 60 * 60 * 1000);
  if (day === 'upcoming') return getISODateString(now + 2 * 24 * 60 * 60 * 1000);
  return getISODateString(now);
}

function getColumnForISODate(isoDate) {
  if (isoDate === getISODateForColumn('yesterday')) return 'yesterday';
  if (isoDate === getISODateForColumn('today')) return 'today';
  if (isoDate === getISODateForColumn('tomorrow')) return 'tomorrow';
  return 'upcoming';
}

// The app root path: "/" in local dev (served at the domain root) and "/LibrePT/" on
// GitHub Pages (a project site served under /<repo>/). Derived from this module's own URL
// so the router works under any deploy sub-path without hardcoding it. The deploy step
// rewrites <base href> to the same sub-path so assets resolve there too.
const BASE_PATH = new URL('.', import.meta.url).pathname;

// window.location.pathname (which includes BASE_PATH) -> the root-relative route the
// matchers below expect (e.g. "/LibrePT/sessions/2026-07-17" -> "/sessions/2026-07-17").
function toRoute(pathname) {
  return pathname.startsWith(BASE_PATH) ? '/' + pathname.slice(BASE_PATH.length) : pathname;
}

// A root-relative route -> a full path under BASE_PATH for pushState/replaceState
// (e.g. "/sessions/2026-07-17" -> "/LibrePT/sessions/2026-07-17").
function toUrl(route) {
  return BASE_PATH + route.replace(/^\//, '');
}

function navigateToPath(targetPath) {
  const url = toUrl(targetPath);
  if (window.location.pathname === url) {
    handlePathChange();
  } else {
    window.history.pushState(null, '', url);
    handlePathChange();
  }
}

// The header is identical in every view — logo + language/theme/sync-backup. An active session's
// own controls (options menu, minimize) live in its title bar, not the header, so nothing swaps
// here; this just guarantees the shared actions stay visible. The argument is ignored (kept so
// existing call sites read as "entering/leaving a session").
function setHeaderState() {
  const normalActions = document.querySelector('.normal-header-actions');
  if (normalActions) normalActions.classList.remove('hidden');
}

// --- SHARED "DISMISS VIEW → HOME" GESTURE ---
// Returns to the home dashboard (which hides the active-session overlay and re-focuses today) —
// the same destination as the app-name logo, so a title-bar swipe / handle tap reads as "close".
function goHome() {
  navigateToPath('/clients');
}

// Every .view-titlebar (each view's header + the active-session clipboard) can be dismissed the
// same way: tap its .view-grabber handle, or swipe the bar down. The clipboard slides out like a
// sheet first; regular views just navigate. Taps on the bar's own controls (nav arrows, options
// menu, back/edit) are left alone so only the bar background / handle triggers a dismiss.
function setupViewDismiss() {
  const SWIPE_CLOSE_PX = 70; // downward distance that commits the dismissal
  document.querySelectorAll('.view-titlebar').forEach(bar => {
    const grab = bar.querySelector('.view-grabber');
    if (grab) grab.addEventListener('click', (e) => { e.stopPropagation(); goHome(); });

    let startY = null, startX = null;
    bar.addEventListener('touchstart', (e) => {
      if (e.target.closest('button:not(.view-grabber), a, input, select')) { startY = null; return; }
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    }, { passive: true });

    bar.addEventListener('touchend', (e) => {
      if (startY === null) return;
      const t = e.changedTouches[0];
      const dy = t.clientY - startY;
      const dx = t.clientX - startX;
      startY = null; startX = null;
      // Commit only on a clearly downward, vertical-dominant swipe
      if (dy < SWIPE_CLOSE_PX || Math.abs(dx) > dy * 0.6) return;

      const overlay = bar.closest('.active-session-overlay');
      if (overlay) {
        overlay.style.animation = 'none';
        overlay.style.transition = 'transform 0.24s ease';
        overlay.style.transform = 'translateY(100%)';
        setTimeout(() => {
          goHome();
          overlay.style.transition = '';
          overlay.style.transform = '';
          overlay.style.animation = '';
        }, 230);
      } else {
        goHome();
      }
    }, { passive: true });
  });
}

function handlePathChange() {
  const path = toRoute(window.location.pathname);

  // Match patterns:
  // 0. /session/{sessionId}/client/{clientId}/exercise|superset/{cardId}  (in-focus card)
  const sessionFocusMatch = path.match(/^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)\/(exercise|superset)\/([A-Za-z0-9_-]+)$/);
  // 1. /session/{sessionId}/client/{clientId}
  const sessionClientMatch = path.match(/^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)$/);
  // 2. /session/{sessionId}
  const sessionMatch = path.match(/^\/session\/([A-Za-z0-9_-]+)$/);
  // 3. /clients/{clientId}
  const clientDetailMatch = path.match(/^\/clients\/([A-Za-z0-9_-]+)$/);
  // 4. /sessions/{isoDate}
  const sessionsDateMatch = path.match(/^\/sessions\/([0-9]{4}-[0-9]{2}-[0-9]{2})$/);

  if (sessionFocusMatch) {
    const [, sessionId, clientId, focusType, focusId] = sessionFocusMatch;
    setHeaderState(true);
    showSessionView(sessionId, clientId, { type: focusType, id: focusId });
  } else if (sessionClientMatch) {
    const sessionId = sessionClientMatch[1];
    const clientId = sessionClientMatch[2];
    setHeaderState(true);
    showSessionView(sessionId, clientId);
  } else if (sessionMatch) {
    const sessionId = sessionMatch[1];
    setHeaderState(true);
    showSessionView(sessionId, null);
  } else if (clientDetailMatch) {
    const clientId = clientDetailMatch[1];
    setHeaderState(false);
    document.getElementById('active-session-overlay').classList.add('hidden');
    showClientDetails(clientId);
  } else if (sessionsDateMatch) {
    const isoDate = sessionsDateMatch[1];
    const column = getColumnForISODate(isoDate);
    setHeaderState(false);
    document.getElementById('active-session-overlay').classList.add('hidden');
    switchView('clients');
    requestAnimationFrame(() => focusSessionsColumn(column, 'auto'));
  } else if (path === '/clients' || path === '/' || path === '/index.html') {
    const todayDate = getISODateForColumn('today');
    setHeaderState(false);
    window.history.replaceState(null, '', toUrl(`/sessions/${todayDate}`));
    document.getElementById('active-session-overlay').classList.add('hidden');
    switchView('clients');
    requestAnimationFrame(() => focusSessionsColumn('today', 'auto'));
  } else if (path === '/routines') {
    setHeaderState(false);
    document.getElementById('active-session-overlay').classList.add('hidden');
    switchView('routines');
  } else if (path === '/exercises') {
    setHeaderState(false);
    document.getElementById('active-session-overlay').classList.add('hidden');
    switchView('exercises');
  } else if (path === '/history') {
    setHeaderState(false);
    document.getElementById('active-session-overlay').classList.add('hidden');
    switchView('history');
  } else {
    // Unknown route — show the not-found view rather than silently bouncing to today.
    // The bad URL is left in the address bar so it stays visible and copyable.
    showErrorView(window.location.pathname);
  }
}

// focusRef (optional) = { type: 'exercise'|'superset', id } from a deep link, selecting which
// card starts in focus. A stale/unknown id is ignored, leaving the client's default focus.
function showSessionView(sessionId, clientId, focusRef = null) {
  const activeSession = getActiveSession();
  if (activeSession) {
    // Show active tracking clipboard overlay
    const bar = document.getElementById('active-session-bar');
    bar.classList.remove('hidden', 'is-idle');
    delete bar.dataset.nextBookingId;
    renderActiveSessionBarLabels();

    // Ensure timer is ticking if not already
    if (!activeSession.timerIntervalId) {
      startSessionTimer();
    }

    document.getElementById('active-session-overlay').classList.remove('hidden');
    renderSessionTitle();

    if (clientId && activeSession.participants.includes(clientId)) {
      activeSession.activeClientId = clientId;
    }
    if (focusRef) {
      const cs = activeSession.clientRoutines[activeSession.activeClientId];
      const idx = focusIndexFromRef(cs, focusRef);
      if (idx >= 0) cs.activeExerciseIndex = idx;
    }
    renderActiveGroupBoard();
    syncSessionFocusUrl();
  } else {
    // No active session in memory. Check if we can recover it
    const cached = localStorage.getItem('librept_active_session');
    if (cached) {
      recoverActiveSession();
      if (getActiveSession()) {
        // Retry
        showSessionView(sessionId, clientId, focusRef);
        return;
      }
    }
    
    // Fall back to clients dashboard but open the workout setup modal for this client
    document.getElementById('active-session-overlay').classList.add('hidden');
    switchView('clients');
    openWorkoutSetupModal(clientId);
  }
}

// Resolve a deep-link focus reference to an index into the client's exercise list. A superset
// ref matches the first member of that circuit (the whole superset renders as one card); an
// exercise ref matches a standalone (non-superset) exercise. Returns -1 when nothing matches.
// focusIndexFromRef, sessionFocusPath, syncSessionFocusUrl, and focusExerciseByIndex
// are imported from controllers/activeSessionController.js

// The session view's context line — "YYYY-MM-DD HH:MM Location" (e.g.
// "2026-07-17 10:00 Trib gym base"). Derived from the booking the session was launched
// from; an ad-hoc session started without a booking shows just its actual date and start
// time, since it has no scheduled slot or location.
// Active session title bar logic moved to components/sessionTitleBar.js

// --- RENDER FUNCTIONS ---

function renderPendingPlanAdjustments() {
  const container = document.getElementById('dashboard-adjustments-list');
  const countBadge = document.getElementById('badge-adjustments-count');
  renderPendingPlanAdjustmentsComponent(container, countBadge, {
    state,
    t,
    escapeHTML,
    openAdjustmentWizard
  });
}

function openAdjustmentWizard(updateId) {
  openAdjustmentWizardComponent(updateId, {
    state,
    t,
    escapeHTML,
    saveToLocalStorage,
    renderRoutinesList,
    renderPendingPlanAdjustments
  });
}



// --- BRIDGE WRAPPERS FOR EXTRACTED VIEWS & CONTROLLERS ---

// Clients View
function renderClientsList(filterQuery = '') {
  clientsViewRender({ state, t, navigateToPath, filterQuery });
}

function showClientDetails(clientId) {
  clientsViewShowDetails({ clientId, state, t, showErrorView, switchView, openWorkoutSetupModal });
}

function renderClientWorkoutHistory(client) {
  return clientsViewHistory({ client, state, t });
}

// Routines View
function renderRoutinesList() {
  routinesViewRender({ state, t, openWorkoutSetupModal });
}

function openRoutineEditorModal(routineId) {
  routinesViewOpenEditor({ routineId, state });
}

function addRoutineExerciseRow(preset = null) {
  routinesViewAddRow({ preset, state });
}

// Exercise Library View
function renderExercisesList(filterQuery = '', categoryFilter = 'All') {
  exercisesViewRender({ state, t, filterQuery, categoryFilter });
}

// Global History View
function renderGlobalHistory() {
  historyViewRender({ state, t });
}

function renderHistoryItems(historyList, container) {
  historyViewItems({ historyList, container, t });
}

// Form Controllers
function setupClientForms() {
  setupClientFormsController({ state, t, saveToLocalStorage, populateDropdownSelectors, showErrorView, switchView, openWorkoutSetupModal });
}

function setupRoutineForms() {
  setupRoutineFormsController({ state, t, saveToLocalStorage, populateDropdownSelectors, openWorkoutSetupModal });
}

function setupExerciseForms() {
  setupExerciseFormsController({ state, t, saveToLocalStorage, populateDropdownSelectors });
}

function populateDropdownSelectors() {
  populateDropdownsController({ state, t });
}

// Active Session & Workout Lifecycle Controller
function startWorkoutSession(clientRoutines, bookingMeta = null) {
  startWorkoutSessionController(clientRoutines, bookingMeta, { state, generateShortUUID, navigateToPath, toRoute, toUrl, focusSessionsColumn, launchClipboardDirectly, renderIdleSessionBar, saveToLocalStorage });
}

function setupActiveSession() {
  initActiveSessionController({ state, t, navigateToPath, toRoute, toUrl, focusSessionsColumn, launchClipboardDirectly, generateShortUUID, renderIdleSessionBar, saveToLocalStorage });
  setupActiveSessionController({ state, t, navigateToPath, focusSessionsColumn, launchClipboardDirectly, generateShortUUID, renderIdleSessionBar });
}

function cancelWorkoutSession() {
  cancelWorkoutSessionController({ state, t, navigateToPath });
}

function finishWorkoutSession() {
  finishWorkoutSessionController({ state, t });
}

function saveActiveSessionToCache() {
  saveActiveSessionToCacheController();
}

function recoverActiveSession() {
  recoverActiveSessionController({ state, t, generateShortUUID, navigateToPath, focusSessionsColumn, toRoute, toUrl, launchClipboardDirectly, renderIdleSessionBar, saveToLocalStorage });
}

function getActiveExercise() {
  return getActiveExerciseController();
}

function buildSupersetUnits(items, activeIndex) {
  return buildSupersetUnitsController(items, activeIndex);
}

function renderActiveGroupBoard() {
  renderActiveGroupBoardController({ state, t, navigateToPath, toRoute, toUrl, openFeedbackModal, generateShortUUID, saveToLocalStorage });
}

// Sessions Dashboard & Calendar Integration View
function launchClipboardDirectly(arg) {
  const bookingId = (arg && typeof arg === 'object') ? arg.bookingId : arg;
  sessionsViewLaunchClipboard({ bookingId, state, startWorkoutSession });
}

function setupCalendarBookings() {
  sessionsViewSetupBookings({ state, t, saveToLocalStorage, renderSessions });
}

function renderSessions() {
  sessionsViewRender({ state, t, getActiveSession, launchClipboardDirectly });
}

// Register Service Worker for offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${BASE_PATH}sw.js`)
      .then(reg => console.log('PWA Service Worker registered:', reg.scope))
      .catch(err => console.error('PWA Service Worker registration failed:', err));
  });
}

// Trigger initialization on DOM load
window.addEventListener('DOMContentLoaded', init);
