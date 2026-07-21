import { renderActiveUsersList, updateClientTabsFadeState } from "./components/activeUsersList.js";
import {
  applyThemeSwitcherLabels,
  incrementLocalSync,
  initApplicationHeader,
  renderSyncBadge,
  resetSyncState,
  setSyncTrackingReady,
  setupApplicationHeader,
} from "./components/applicationHeader.js";
import { initBackupRestore, setupBackupRestore } from "./components/backupRestore.js";
import { renderClientsDirectory } from "./components/clientsDirectory.js";
import {
  focusSessionsColumn,
  getFocusedSessionDay,
  getSessionDayDate,
  initDaySelector,
  renderSessionsTitleBar,
  sessionDayTemporal,
  setFocusedSessionDay,
  setupSessionsDayNav,
} from "./components/daySelector.js";
import { initRestTimer, setupRestTimer } from "./components/exerciseAndRestTimer.js";
import { renderExerciseDeck } from "./components/exerciseDeck.js";
import {
  initFeedbackModal,
  openFeedbackModal,
  setupFeedbackForms,
} from "./components/feedbackModal.js";
import {
  initNotificationArea,
  renderNotificationArea,
  setupNotificationGestures,
} from "./components/notificationArea.js";
import {
  openAdjustmentWizardComponent,
  renderPendingPlanAdjustmentsComponent,
} from "./components/planAdjustments.js";
import {
  initSessionBar,
  renderActiveSessionBarLabels,
  renderIdleSessionBar,
  updateSessionBarTimer,
} from "./components/sessionBar.js";
import { renderSessionCard } from "./components/sessionCard.js";
import { renderSessionList } from "./components/sessionList.js";
import { initSessionTitleBar, renderSessionTitle } from "./components/sessionTitleBar.js";
import {
  initWorkoutSetup,
  openWorkoutSetupModal,
  setupWorkoutSetup,
} from "./components/workoutSetup.js";
import {
  cancelWorkoutSession as cancelWorkoutSessionController,
  focusExerciseByIndex,
  focusIndexFromRef,
  getActiveExercise as getActiveExerciseController,
  getActiveSession,
  initActiveSessionController,
  openSessionFromHistory,
  recoverActiveSession as recoverActiveSessionController,
  renderActiveGroupBoard as renderActiveGroupBoardController,
  saveActiveSessionToCache as saveActiveSessionToCacheController,
  sessionFocusPath,
  setActiveSession,
  setClipboardEditMode,
  setupActiveSession as setupActiveSessionController,
  startSessionTimer,
  startWorkoutSession as startWorkoutSessionController,
  syncSessionFocusUrl,
} from "./controllers/activeSessionController.js";
import {
  populateDropdownSelectors as populateDropdownsController,
  setupClientForms as setupClientFormsController,
  setupExerciseForms as setupExerciseFormsController,
  setupRoutineForms as setupRoutineFormsController,
} from "./controllers/formsController.js";
import { setupViewDismiss } from "./controllers/gestureController.js";
// app.js - LibrePT Application Controller Logic
import {
  DEFAULT_CLIENTS,
  DEFAULT_EXERCISES,
  DEFAULT_HISTORY,
  DEFAULT_MESSAGES,
  DEFAULT_PLAN_UPDATES,
  DEFAULT_ROUTINES,
  DEFAULT_SESSIONS,
} from "./data/index.js";
import { repsPresetsDatalistHTML } from "./helper/repsAndLoad.js";
import { INIT_DEMO_DATA, getShareParams } from "./helper/shareLink.js";
import {
  buildBookingMeta,
  escapeHTML,
  formatClockFromMinutes,
  formatDateStr,
  formatDuration,
  formatSignedDuration,
  generateShortUUID,
  getClientDisplayNameHTML,
  getInitials,
  getOverlappingBookings,
  isTimeOverlapping,
  parseTimeRange,
  truncateString,
} from "./helper/utils.js";
import { applyStaticDOMMappings } from "./i18n/domMappings.js";
import { TRANSLATIONS } from "./i18n/index.js";
import { BUILD_INFO } from "./version.js";
import {
  renderClientsList as clientsViewRender,
  showClientDetails as clientsViewShowDetails,
} from "./views/clientsView.js";
import { renderExercisesList as exercisesViewRender } from "./views/exercisesView.js";
import { renderGlobalHistory as historyViewRender } from "./views/historyView.js";
import {
  openRoutineEditorModal,
  renderRoutinesList as routinesViewRender,
} from "./views/routinesView.js";
import {
  launchClipboardDirectly as sessionsViewLaunchClipboard,
  renderSessions as sessionsViewRender,
  seedDemoActiveSession as sessionsViewSeedDemo,
  setupCalendarBookings as sessionsViewSetupBookings,
} from "./views/sessionsView.js";

function t(key) {
  const lang = state.lang || "en";
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || key;
}

function applyTranslations(lang = state.lang || "en") {
  state.lang = lang;

  // Set dropdown switcher value
  const switcher = document.getElementById("lang-switcher");
  if (switcher) switcher.value = lang;

  // Theme dropdown labels are localized outside the staticMappings table (compact forms)
  applyThemeSwitcherLabels();

  applyStaticDOMMappings(TRANSLATIONS[lang]);

  // The day title bar is data-driven (weekday/date/arrows), so it re-renders rather than map statically
  renderSessionsTitleBar();
  renderNotificationArea();
}

// --- STATE MANAGEMENT ---
let state = {
  clients: [],
  exercises: [],
  routines: [],
  history: [],
  planUpdates: [],
  bookings: [],
  notifications: [],
  lang: "en",
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

// Show the build stamp (commit SHA) in the header so a client screenshot ties a bug report to an
// exact build. 'dev' locally; the deploy/build overwrite version.js with the real short SHA.
function renderBuildStamp() {
  const el = document.getElementById("app-version");
  if (!el) return;
  const commit = BUILD_INFO?.commit || "dev";
  el.textContent = commit === "dev" ? "dev" : `#${commit}`;
  if (BUILD_INFO?.builtAt) el.title = `Built ${BUILD_INFO.builtAt}`;
}

// Keep the app portrait. The manifest's "orientation": "portrait-primary" covers the installed
// PWA; this is the best-effort runtime complement (Screen Orientation API only resolves in an
// installed/standalone or fullscreen context and rejects otherwise, so failures are swallowed).
// Re-applied on orientationchange because some engines drop the lock when the device rotates.
function lockPortraitOrientation() {
  const orientation = typeof screen !== "undefined" && screen.orientation;
  if (!orientation || typeof orientation.lock !== "function") return;
  const apply = () => {
    try {
      const p = orientation.lock("portrait");
      if (p?.catch) p.catch(() => {});
    } catch (_) {}
  };
  apply();
  orientation.addEventListener("change", apply);
}

// Dev/debug console helper (see README "Resetting to a clean state"): wipes every LibrePT-owned
// localStorage key and reloads. Defaults to landing back on the demo dataset — call
// resetLibrePTData({ demo: false }) for the empty first-run state instead.
function resetLibrePTData({ demo = true } = {}) {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("librept") || k.startsWith("openpt")) localStorage.removeItem(k);
  }
  const url = new URL(window.location.href);
  if (demo) {
    url.searchParams.set("init", "demo_data_load");
  } else {
    url.searchParams.delete("init");
  }
  window.location.href = url.toString();
}

function init() {
  window.resetLibrePTData = resetLibrePTData;
  resizeToPhoneViewport();
  lockPortraitOrientation();
  renderBuildStamp();

  // Load data from LocalStorage (migrating the legacy OpenPT key if present). No data means a
  // clean, empty boot — demo data is only ever populated on request via ?init=demo_data_load.
  let savedData = localStorage.getItem("librept_db");
  if (!savedData) {
    // Migrate data from old OpenPT key if it exists
    savedData = localStorage.getItem("openpt_db");
    if (savedData) {
      localStorage.setItem("librept_db", savedData);
      localStorage.removeItem("openpt_db");

      const activeSessionData = localStorage.getItem("openpt_active_session");
      if (activeSessionData) {
        localStorage.setItem("librept_active_session", activeSessionData);
        localStorage.removeItem("openpt_active_session");
      }
    }
  }

  // The app boots to a clean, empty slate. Existing local data is loaded as-is; a corrupt db is
  // discarded (reset to empty) rather than silently re-seeded with demo data.
  if (savedData) {
    try {
      state = JSON.parse(savedData);
    } catch (e) {
      console.error("Error parsing local storage database. Starting empty.", e);
      state = emptyState();
    }
  } else {
    state = emptyState();
  }

  if (!state.lang) state.lang = "en";

  // A promo/share link's ?lang= preselects the UI language for this visit, overriding the saved
  // preference so the recipient sees the app in the shared language. Unknown codes are ignored
  // (falls through to the existing value), mirroring the theme param's revert-to-default rule.
  const { lang: shareLang, init: shareInit } = getShareParams();
  if (shareLang && TRANSLATIONS[shareLang]) state.lang = shareLang;

  // Demo-data initializer (?init=demo_data_load). The demo dataset is opt-in — populated only on
  // an explicit request AND only when the app is genuinely empty. If any data is already present
  // (a returning user, or a real trainer's records) the param is ignored so nothing is clobbered.
  if (shareInit === INIT_DEMO_DATA && !stateHasData(state)) {
    seedMockData();
    // Demo: open on session 1 already in progress, participants at varied completion.
    seedDemoActiveSession();
  } else if (!stateHasData(state)) {
    // Genuinely empty app: drop any stale active-session cache (e.g. from a prior demo) so a
    // clean start can't recover a session that references data no longer present.
    localStorage.removeItem("librept_active_session");
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
    startWorkoutSession,
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
    renderPendingPlanAdjustments,
  });
  setupFeedbackForms();
  // Initialize the per-client timer stack component
  initRestTimer({
    t,
    onFocusTimer: (timer) => {
      if (!timer.sessionId || !timer.clientId) return;
      let path = `/session/${timer.sessionId}/client/${timer.clientId}`;
      if (timer.focusRef) path += `/${timer.focusRef.type}/${timer.focusRef.id}`;
      navigateToPath(path);
    },
  });
  setupRestTimer();

  // Initialize Backup & Restore component
  initBackupRestore({
    getState: () => state,
    setState: (newState) => {
      state = newState;
    },
    saveToLocalStorage,
    renderClientsList,
    renderRoutinesList,
    renderExercisesList,
    renderGlobalHistory,
    populateDropdownSelectors,
    t,
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
    renderActiveSessionBarLabels,
  });

  // Wire event listeners for the header and themes
  setupApplicationHeader();

  // Initialize Day Selector component
  initDaySelector({
    getState: () => state,
    t,
    toRoute,
    toUrl,
    getISODateForColumn,
  });

  // Initialize Session Title Bar component
  initSessionTitleBar({
    getActiveSession: () => getActiveSession(),
    getISODateString,
    formatClockFromMinutes,
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
    getSessionDayDate,
  });

  initNotificationArea({
    getState: () => state,
    getActiveSession: () => getActiveSession(),
    t,
    escapeHTML,
    navigateToPath,
  });
  setupNotificationGestures();

  // Apply translations initially
  applyTranslations(state.lang);

  // Reps-preset datalists are data-driven — build them from the taxonomy tiers once at boot.
  const repsPresetHost = document.getElementById("reps-preset-datalists");
  if (repsPresetHost) repsPresetHost.innerHTML = repsPresetsDatalistHTML();

  // Render Initial Views
  renderClientsList();
  renderRoutinesList();
  renderExercisesList();
  renderGlobalHistory();
  renderPendingPlanAdjustments();
  renderSessions();
  renderNotificationArea();
  populateDropdownSelectors();

  // Check if there was an active session saved (session recovery)
  recoverActiveSession();

  // Set up view routing based on URL path
  window.addEventListener("popstate", handlePathChange);
  handlePathChange();

  // Every view (and the active-session clipboard) can be dismissed to the home dashboard the same
  // way: tap the grab handle, or swipe its title bar down. The app-name logo is the third way home.
  setupViewDismiss({ navigateToPath, getActiveSession, launchClipboardDirectly });

  // Keep the idle bar's "next session" + starts-in countdown fresh even with no other
  // trigger firing (an active session's own 1s tick handles the bar while one is running)
  setInterval(renderIdleSessionBar, 30000);

  // Show the (mock) sync counters, then start counting on-device edits from here
  renderSyncBadge();
  setSyncTrackingReady(true);
}

// A fresh, empty database — the default the app boots into when there's nothing stored and no
// demo-data initializer. Lang defaults here too; the caller may override it from ?lang=.
function emptyState() {
  return {
    clients: [],
    exercises: [],
    routines: [],
    history: [],
    planUpdates: [],
    bookings: [],
    notifications: [],
    lang: "en",
  };
}

// Whether the app already holds any real data. Used to gate the ?init=demo_data_load initializer
// so it never overwrites existing records — the demo dataset only lands on a genuinely empty app.
function stateHasData(s) {
  return ["clients", "exercises", "routines", "history", "planUpdates", "bookings"].some(
    (k) => Array.isArray(s[k]) && s[k].length > 0,
  );
}

function seedMockData() {
  const currentLang = state.lang || "en";
  state.clients = [...DEFAULT_CLIENTS];
  state.exercises = [...DEFAULT_EXERCISES];
  state.routines = [...DEFAULT_ROUTINES];
  state.history = [...DEFAULT_HISTORY];
  state.planUpdates = [...DEFAULT_PLAN_UPDATES];
  state.bookings = [...DEFAULT_SESSIONS];
  state.notifications = [...DEFAULT_MESSAGES];
  state.lang = currentLang;
  saveToLocalStorage();
}

function saveToLocalStorage() {
  localStorage.setItem("librept_db", JSON.stringify(state));
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
  const navItems = document.querySelectorAll(".header-nav .nav-item, .bottom-nav .nav-item");
  for (const item of navItems) {
    item.addEventListener("click", () => {
      const viewTarget = item.getAttribute("data-view");
      navigateToPath(`/${viewTarget}`);
    });
  }

  // Logo Area home click handler
  const logoArea = document.getElementById("logo-area");
  if (logoArea) {
    logoArea.addEventListener("click", () => {
      navigateToPath("/clients");
    });
  }

  // Not-found view: return to the dashboard.
  const errorHomeBtn = document.getElementById("btn-error-home");
  if (errorHomeBtn) {
    errorHomeBtn.addEventListener("click", () => {
      navigateToPath("/clients");
    });
  }

  // Theme setup and initialization has been moved to components/applicationHeader.js

  // Client Details back button
  document.getElementById("btn-back-to-clients").addEventListener("click", () => {
    navigateToPath("/clients");
  });

  setupSessionsDayNav();
}

// Theme controller and switcher logic moved to components/applicationHeader.js

function switchView(viewId) {
  // Hide all views
  for (const view of document.querySelectorAll(".app-view")) {
    view.classList.remove("active");
  }

  // Deactivate all nav items
  for (const item of document.querySelectorAll(".header-nav .nav-item, .bottom-nav .nav-item")) {
    item.classList.remove("active");
  }

  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add("active");
  }

  // Highlight bottom nav matching tab
  // Handles secondary screens (like client detail) which don't map to bottom nav
  const mainTab = viewId.split("-")[0]; // handles 'client-detail' -> 'client' or matches 'clients'
  const tabItem = document.querySelector(
    `.header-nav .nav-item[data-view^="${mainTab}"], .bottom-nav .nav-item[data-view^="${mainTab}"]`,
  );
  if (tabItem) {
    tabItem.classList.add("active");
  }

  // Scroll to top
  document.getElementById("main-content").scrollTop = 0;

  // Coming home always re-focuses today, so the trainer never lands on a stale day
  if (viewId === "clients") {
    requestAnimationFrame(() => focusSessionsColumn("today", "smooth"));
  }
}

// Not-found view for deep-link URLs that match no route (or reference a deleted entity).
// The URL is left untouched so the bad link stays visible; the omnipresent header stays put
// because #view-error lives inside #main-content like every other view.
function showErrorView(attemptedPath) {
  setHeaderState(false);
  document.getElementById("active-session-overlay").classList.add("hidden");
  const pathEl = document.getElementById("error-view-path");
  if (pathEl) pathEl.textContent = attemptedPath;
  switchView("error");
}

function getISODateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getISODateForColumn(day) {
  const now = Date.now();
  if (day === "yesterday") return getISODateString(now - 24 * 60 * 60 * 1000);
  if (day === "today") return getISODateString(now);
  if (day === "tomorrow") return getISODateString(now + 24 * 60 * 60 * 1000);
  if (day === "upcoming") return getISODateString(now + 2 * 24 * 60 * 60 * 1000);
  return getISODateString(now);
}

function getColumnForISODate(isoDate) {
  if (isoDate === getISODateForColumn("yesterday")) return "yesterday";
  if (isoDate === getISODateForColumn("today")) return "today";
  if (isoDate === getISODateForColumn("tomorrow")) return "tomorrow";
  return "upcoming";
}

// The app root path: "/" in local dev (served at the domain root) and "/LibrePT/" on
// GitHub Pages (a project site served under /<repo>/). Derived from this module's own URL
// so the router works under any deploy sub-path without hardcoding it. The deploy step
// rewrites <base href> to the same sub-path so assets resolve there too.
const BASE_PATH = new URL(".", import.meta.url).pathname;

// window.location.pathname (which includes BASE_PATH) -> the root-relative route the
// matchers below expect (e.g. "/LibrePT/sessions/2026-07-17" -> "/sessions/2026-07-17").
function toRoute(pathname) {
  return pathname.startsWith(BASE_PATH) ? `/${pathname.slice(BASE_PATH.length)}` : pathname;
}

// A root-relative route -> a full path under BASE_PATH for pushState/replaceState
// (e.g. "/sessions/2026-07-17" -> "/LibrePT/sessions/2026-07-17").
function toUrl(route) {
  return BASE_PATH + route.replace(/^\//, "");
}

function navigateToPath(targetPath) {
  const url = toUrl(targetPath);
  if (window.location.pathname === url) {
    handlePathChange();
  } else {
    window.history.pushState(null, "", url);
    handlePathChange();
  }
}

// The header is identical in every view — logo + language/theme/sync-backup. An active session's
// own controls (options menu, minimize) live in its title bar, not the header, so nothing swaps
// here; this just guarantees the shared actions stay visible. The argument is ignored (kept so
// existing call sites read as "entering/leaving a session").
function setHeaderState() {
  const normalActions = document.querySelector(".normal-header-actions");
  if (normalActions) normalActions.classList.remove("hidden");
}

// On entering the sessions dashboard, bring the ongoing session into view (it may be below the fold
// after the completed ones). Only called on view-entry — never on the timer re-renders — so it
// never yanks a trainer who has scrolled away. inline:'nearest' keeps the horizontal day focus.
function focusActiveSessionCard() {
  requestAnimationFrame(() => {
    const card = document.querySelector("#today-sessions-list .booking-card.booking-live");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  });
}

function handlePathChange() {
  const path = toRoute(window.location.pathname);

  // Match patterns:
  // 0. /session/{sessionId}/client/{clientId}/exercise|superset/{cardId}  (in-focus card)
  const sessionFocusMatch = path.match(
    /^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)\/(exercise|superset)\/([A-Za-z0-9_-]+)$/,
  );
  // 0b. /session/{sessionId}/client/{clientId}/edit  (inline plan editor — survives reloads)
  const sessionEditMatch = path.match(
    /^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)\/edit$/,
  );
  // 1. /session/{sessionId}/client/{clientId}
  const sessionClientMatch = path.match(/^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)$/);
  // 2. /session/{sessionId}
  const sessionMatch = path.match(/^\/session\/([A-Za-z0-9_-]+)$/);
  // 3. /clients/{clientId}
  const clientDetailMatch = path.match(/^\/clients\/([A-Za-z0-9_-]+)$/);
  // 4. /sessions/{isoDate}
  const sessionsDateMatch = path.match(/^\/sessions\/([0-9]{4}-[0-9]{2}-[0-9]{2})$/);

  if (sessionEditMatch) {
    const [, sessionId, clientId] = sessionEditMatch;
    setHeaderState(true);
    showSessionView(sessionId, clientId, null, { edit: true });
  } else if (sessionFocusMatch) {
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
    document.getElementById("active-session-overlay").classList.add("hidden");
    clientsViewShowDetails({
      clientId,
      state,
      t,
      showErrorView,
      switchView,
      openWorkoutSetupModal,
    });
  } else if (sessionsDateMatch) {
    const isoDate = sessionsDateMatch[1];
    const column = getColumnForISODate(isoDate);
    setHeaderState(false);
    document.getElementById("active-session-overlay").classList.add("hidden");
    switchView("clients");
    requestAnimationFrame(() => focusSessionsColumn(column, "auto"));
    focusActiveSessionCard();
  } else if (path === "/clients" || path === "/" || path === "/index.html") {
    const todayDate = getISODateForColumn("today");
    setHeaderState(false);
    window.history.replaceState(null, "", toUrl(`/sessions/${todayDate}`));
    document.getElementById("active-session-overlay").classList.add("hidden");
    switchView("clients");
    requestAnimationFrame(() => focusSessionsColumn("today", "auto"));
    focusActiveSessionCard();
  } else if (path === "/routines") {
    setHeaderState(false);
    document.getElementById("active-session-overlay").classList.add("hidden");
    switchView("routines");
  } else if (path === "/exercises") {
    setHeaderState(false);
    document.getElementById("active-session-overlay").classList.add("hidden");
    switchView("exercises");
  } else if (path === "/history") {
    setHeaderState(false);
    document.getElementById("active-session-overlay").classList.add("hidden");
    switchView("history");
  } else {
    // Unknown route — show the not-found view rather than silently bouncing to today.
    // The bad URL is left in the address bar so it stays visible and copyable.
    showErrorView(window.location.pathname);
  }
}

// focusRef (optional) = { type: 'exercise'|'superset', id } from a deep link, selecting which
// card starts in focus. A stale/unknown id is ignored, leaving the client's default focus.
function showSessionView(sessionId, clientId, focusRef = null, opts = {}) {
  // A deep link must follow the id in the URL. The in-memory session is gone after a reload, so
  // first rehydrate it from the persisted cache — but only treat it as a match when its id is the
  // one the URL names. We never render whatever session happens to be cached under a different id.
  if (!getActiveSession()) {
    const cached = localStorage.getItem("librept_active_session");
    if (cached) recoverActiveSession();
  }

  const activeSession = getActiveSession();

  if (activeSession && activeSession.id === sessionId) {
    // Show active tracking clipboard overlay
    const bar = document.getElementById("active-session-bar");
    if (bar) {
      bar.classList.remove("hidden", "is-idle");
      delete bar.dataset.nextBookingId;
    }
    renderActiveSessionBarLabels();

    // Ensure timer is ticking if not already
    if (!activeSession.timerIntervalId) {
      startSessionTimer();
    }

    document.getElementById("active-session-overlay").classList.remove("hidden");
    renderSessionTitle();

    if (clientId && activeSession.participants.includes(clientId)) {
      activeSession.activeClientId = clientId;
    }
    if (focusRef) {
      const cs = activeSession.clientRoutines[activeSession.activeClientId];
      const idx = focusIndexFromRef(cs, focusRef);
      if (idx >= 0) cs.activeExerciseIndex = idx;
    }
    // An /edit deep link (typed, shared, or hit on reload) restores the inline plan editor. We only
    // ENTER edit mode from the URL — never force-exit — so a planning session that forces edit mode
    // isn't dropped when its plain URL is visited before syncSessionFocusUrl upgrades it to /edit.
    if (opts.edit) setClipboardEditMode(true);
    renderActiveGroupBoard();
    syncSessionFocusUrl();
    return;
  }

  // The URL names a session that isn't the one live in memory (e.g. a cold reload after the cache
  // expired, or a shared link). Resolve its id against known data so the deep link lands on the
  // session it names. Each launcher rebuilds the active session with id === sessionId and navigates,
  // which re-enters this view; we retry once more only to re-apply the URL's client/focus.
  const booking = state.bookings?.find((b) => b.id === sessionId);
  if (booking) {
    launchClipboardDirectly({ bookingId: sessionId });
    if (getActiveSession() && (clientId || focusRef || opts.edit)) {
      showSessionView(sessionId, clientId, focusRef, opts);
    }
    return;
  }

  const log = state.history?.find((h) => h.id === sessionId);
  if (log) {
    openSessionFromHistory(log);
    if (getActiveSession() && (clientId || focusRef || opts.edit)) {
      showSessionView(sessionId, clientId, focusRef, opts);
    }
    return;
  }

  // Unknown session id — the deep link names nothing we can open. Show the not-found view rather
  // than a blank setup modal, leaving the bad URL in the address bar so it stays visible.
  document.getElementById("active-session-overlay").classList.add("hidden");
  showErrorView(window.location.pathname);
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
  const container = document.getElementById("dashboard-adjustments-list");
  const countBadge = document.getElementById("badge-adjustments-count");
  renderPendingPlanAdjustmentsComponent(container, countBadge, {
    state,
    t,
    escapeHTML,
    openAdjustmentWizard,
    openRoutineEditorModal,
  });
}

function openAdjustmentWizard(updateId) {
  openAdjustmentWizardComponent(updateId, {
    state,
    t,
    escapeHTML,
    saveToLocalStorage,
    renderRoutinesList,
    renderPendingPlanAdjustments,
  });
}

// --- BOUND VIEW & CONTROLLER ACTIONS ---
function renderClientsList(filterQuery = "") {
  clientsViewRender({ state, t, navigateToPath, filterQuery });
}
function renderRoutinesList() {
  routinesViewRender({ state, t, openWorkoutSetupModal });
}
function renderExercisesList(filterQuery = "", categoryFilter = "All") {
  exercisesViewRender({ state, t, filterQuery, categoryFilter });
}
function renderGlobalHistory() {
  historyViewRender({ state, t });
}

function setupClientForms() {
  setupClientFormsController({
    state,
    t,
    saveToLocalStorage,
    populateDropdownSelectors,
    showErrorView,
    switchView,
    openWorkoutSetupModal,
  });
}
function setupRoutineForms() {
  setupRoutineFormsController({
    state,
    t,
    saveToLocalStorage,
    populateDropdownSelectors,
    openWorkoutSetupModal,
  });
}
function setupExerciseForms() {
  setupExerciseFormsController({ state, t, saveToLocalStorage, populateDropdownSelectors });
}
function populateDropdownSelectors() {
  populateDropdownsController({ state, t });
}

function startWorkoutSession(clientRoutines, bookingMeta = null) {
  startWorkoutSessionController(clientRoutines, bookingMeta, {
    state,
    generateShortUUID,
    navigateToPath,
    toRoute,
    toUrl,
    focusSessionsColumn,
    launchClipboardDirectly,
    renderIdleSessionBar,
    saveToLocalStorage,
  });
  renderSessions();
}
function setupActiveSession() {
  initActiveSessionController({
    state,
    t,
    navigateToPath,
    toRoute,
    toUrl,
    focusSessionsColumn,
    launchClipboardDirectly,
    generateShortUUID,
    renderIdleSessionBar,
    saveToLocalStorage,
  });
  setupActiveSessionController({
    state,
    t,
    navigateToPath,
    focusSessionsColumn,
    launchClipboardDirectly,
    generateShortUUID,
    renderIdleSessionBar,
  });
}
function cancelWorkoutSession() {
  cancelWorkoutSessionController({ state, t, navigateToPath });
  renderSessions();
}
function saveActiveSessionToCache() {
  saveActiveSessionToCacheController();
}
function recoverActiveSession() {
  recoverActiveSessionController({
    state,
    t,
    generateShortUUID,
    navigateToPath,
    focusSessionsColumn,
    toRoute,
    toUrl,
    launchClipboardDirectly,
    renderIdleSessionBar,
    saveToLocalStorage,
  });
  renderSessions();
}
function getActiveExercise() {
  return getActiveExerciseController();
}
function renderActiveGroupBoard() {
  renderActiveGroupBoardController({
    state,
    t,
    navigateToPath,
    toRoute,
    toUrl,
    openFeedbackModal,
    generateShortUUID,
    saveToLocalStorage,
  });
}

function launchClipboardDirectly(arg) {
  const bookingId = arg && typeof arg === "object" ? arg.bookingId : arg;
  sessionsViewLaunchClipboard({ bookingId, state, startWorkoutSession });
}
function setupCalendarBookings() {
  sessionsViewSetupBookings({ state, t, saveToLocalStorage, renderSessions });
}
function renderSessions() {
  sessionsViewRender({
    state,
    t,
    getActiveSession,
    launchClipboardDirectly,
    saveToLocalStorage,
    rerenderSessions: renderSessions,
  });
}

// Register Service Worker for offline PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${BASE_PATH}sw.js`)
      .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
      .catch((err) => console.error("PWA Service Worker registration failed:", err));
  });
}

// Trigger initialization on DOM load
window.addEventListener("DOMContentLoaded", init);
