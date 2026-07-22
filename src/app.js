// src/app.js - LibrePT Main Application Entry Point & Root Orchestrator
// Single responsibility: Bootstraps the application, wires dependency injections across components,
// and manages global lifecycle hooks.

import { renderActiveUsersList, updateClientTabsFadeState } from "./components/activeUsersList.js";
import {
  incrementLocalSync,
  initApplicationHeader,
  renderSyncBadge,
  resetSyncState,
  setOfflineCachedState,
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
import {
  initEditSessionControl,
  initWorkoutSetup,
  openEditSessionControlModal,
  openWorkoutSetupModal,
  setupEditSessionControl,
  setupWorkoutSetup,
} from "./components/editSessionControl.js";
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
import { initAppLifecycle } from "./controllers/appLifecycleController.js";
import {
  populateDropdownSelectors as populateDropdownsController,
  setupClientForms as setupClientFormsController,
  setupExerciseForms as setupExerciseFormsController,
  setupRoutineForms as setupRoutineFormsController,
} from "./controllers/formsController.js";
import { setupViewDismiss } from "./controllers/gestureController.js";
import {
  focusActiveSessionCard,
  getBasePath,
  handlePathChange,
  initRouter,
  navigateToPath,
  setHeaderState,
  setupNavigation,
  showErrorView as showErrorViewController,
  showSessionView,
  switchView as switchViewController,
  toRoute,
  toUrl,
} from "./controllers/routerController.js";
import { applyThemeSwitcherLabels, initTheme } from "./controllers/themeController.js";
import {
  getState,
  loadSavedState,
  resetLibrePTData,
  saveToLocalStorage,
  seedMockData,
  setState,
  stateHasData,
} from "./data/stateStore.js";
import { repsPresetsDatalistHTML } from "./helper/repsAndLoad.js";
import { INIT_DEMO_DATA, getShareParams } from "./helper/shareLink.js";
import {
  buildBookingMeta,
  escapeHTML,
  formatClockFromMinutes,
  formatDateStr,
  formatDuration,
  formatDurationHM,
  formatSignedDuration,
  generateShortUUID,
  getClientDisplayNameHTML,
  getColumnForISODate,
  getISODateForColumn,
  getISODateString,
  getInitials,
  getOverlappingBookings,
  isTimeOverlapping,
  parseTimeRange,
  truncateString,
} from "./helper/utils.js";
import { applyStaticDOMMappings } from "./i18n/domMappings.js";
import { TRANSLATIONS } from "./i18n/index.js";
import {
  renderClientsList as clientsViewRender,
  showClientDetails as clientsViewShowDetails,
} from "./views/clientsView.js";
import { renderEditSessionView, renderWorkoutSetupView } from "./views/editSessionView.js";
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
  const lang = getState().lang || "en";
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || key;
}

function applyTranslations(lang = getState().lang || "en") {
  const state = getState();
  state.lang = lang;

  const switcher = document.getElementById("lang-switcher");
  if (switcher) switcher.value = lang;

  applyThemeSwitcherLabels(lang);
  applyStaticDOMMappings(TRANSLATIONS[lang]);

  renderSessionsTitleBar();
  renderNotificationArea();
}

function saveState() {
  saveToLocalStorage(incrementLocalSync);
}

function init() {
  window.resetLibrePTData = resetLibrePTData;
  window.seedMockData = () => seedMockData(incrementLocalSync);
  window.stateHasData = () => stateHasData(getState());

  initTheme();
  initAppLifecycle({
    basePath: getBasePath(),
    setOfflineCachedState,
  });

  const state = loadSavedState();

  const { lang: shareLang, init: shareInit } = getShareParams();
  if (shareLang && TRANSLATIONS[shareLang]) state.lang = shareLang;

  if (shareInit === INIT_DEMO_DATA && !stateHasData(state)) {
    seedMockData(incrementLocalSync);
    sessionsViewSeedDemo({ state: getState() });
  } else if (!stateHasData(state)) {
    localStorage.removeItem("librept_active_session");
  }

  // Wire router dependencies
  initRouter({
    getState,
    t,
    getActiveSession,
    recoverActiveSession: () => recoverActiveSession(),
    startWorkoutSession: (cr, bm) => startWorkoutSession(cr, bm),
    launchClipboardDirectly: (arg) => launchClipboardDirectly(arg),
    openSessionFromHistory: (log) => openSessionFromHistory(log),
    openWorkoutSetupModal: (c, r, b, o) => openWorkoutSetupModal(c, r, b, o),
    focusSessionsColumn,
    setClipboardEditMode,
    renderActiveGroupBoard: () => renderActiveGroupBoard(),
    renderActiveSessionBarLabels,
    renderSessions: () => renderSessions(),
    renderClientsList: (q) => renderClientsList(q),
    startSessionTimer,
    syncSessionFocusUrl,
    focusIndexFromRef,
    getColumnForISODate,
    getISODateForColumn,
    clientsViewShowDetails,
    setHeaderState,
  });

  setupNavigation({ setupSessionsDayNav });
  setupClientForms();
  setupRoutineForms();
  setupExerciseForms();

  renderWorkoutSetupView();
  initWorkoutSetup({
    getState,
    t,
    getClientDisplayNameHTML,
    startWorkoutSession,
    switchView,
    toUrl,
    getISODateForColumn,
    focusSessionsColumn,
  });
  setupWorkoutSetup();
  setupActiveSession();

  initFeedbackModal({
    getState,
    getActiveSession: () => getActiveSession(),
    t,
    generateShortUUID,
    saveActiveSessionToCache,
    saveToLocalStorage: saveState,
    renderPendingPlanAdjustments,
  });
  setupFeedbackForms();

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

  initBackupRestore({
    getState,
    setState: (ns) => setState(ns),
    saveToLocalStorage: saveState,
    renderClientsList,
    renderRoutinesList,
    renderExercisesList,
    renderGlobalHistory,
    populateDropdownSelectors,
    t,
  });
  setupBackupRestore();
  setupCalendarBookings();

  initApplicationHeader({
    getState,
    t,
    saveToLocalStorage: saveState,
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
  setupApplicationHeader();

  initDaySelector({
    getState,
    t,
    toRoute,
    toUrl,
    getISODateForColumn,
  });

  initSessionTitleBar({
    getActiveSession: () => getActiveSession(),
    getISODateString,
    formatClockFromMinutes,
  });

  initSessionBar({
    getState,
    getActiveSession: () => getActiveSession(),
    t,
    formatSignedDuration,
    formatDuration,
    formatDurationHM,
    parseTimeRange,
    getOverlappingBookings,
    buildBookingMeta,
    getSessionDayDate,
  });

  initNotificationArea({
    getState,
    getActiveSession: () => getActiveSession(),
    t,
    escapeHTML,
    navigateToPath,
  });
  setupNotificationGestures();

  applyTranslations(getState().lang);

  const repsPresetHost = document.getElementById("reps-preset-datalists");
  if (repsPresetHost) repsPresetHost.innerHTML = repsPresetsDatalistHTML();

  renderClientsList();
  renderRoutinesList();
  renderExercisesList();
  renderGlobalHistory();
  renderPendingPlanAdjustments();
  renderSessions();
  renderNotificationArea();
  populateDropdownSelectors();

  recoverActiveSession();

  window.addEventListener("popstate", handlePathChange);
  handlePathChange();

  setupViewDismiss({ navigateToPath, getActiveSession, launchClipboardDirectly });

  setInterval(renderIdleSessionBar, 30000);

  renderSyncBadge();
  setSyncTrackingReady(true);
}

// --- BOUND VIEW & CONTROLLER ACTIONS ---
function switchView(viewId) {
  switchViewController(viewId, { focusSessionsColumn });
}

function showErrorView(attemptedPath) {
  showErrorViewController(attemptedPath, { switchView, setHeaderState });
}

function renderPendingPlanAdjustments() {
  const container = document.getElementById("dashboard-adjustments-list");
  const countBadge = document.getElementById("badge-adjustments-count");
  renderPendingPlanAdjustmentsComponent(container, countBadge, {
    state: getState(),
    t,
    escapeHTML,
    openAdjustmentWizard,
    openRoutineEditorModal,
  });

  const menuBadge = document.getElementById("menu-badge-adjustments-count");
  if (menuBadge) {
    const unresolved = (getState().planUpdates || []).filter((u) => !u.resolved).length;
    menuBadge.textContent = unresolved;
    menuBadge.classList.toggle("hidden", unresolved === 0);
  }
}

function openAdjustmentWizard(updateId) {
  openAdjustmentWizardComponent(updateId, {
    state: getState(),
    t,
    escapeHTML,
    saveToLocalStorage: saveState,
    renderRoutinesList,
    renderPendingPlanAdjustments,
  });
}

function renderClientsList(filterQuery = "") {
  clientsViewRender({ state: getState(), t, navigateToPath, filterQuery });
}
function renderRoutinesList() {
  routinesViewRender({ state: getState(), t, openWorkoutSetupModal });
}
function renderExercisesList(filterQuery = "", categoryFilter = "All") {
  exercisesViewRender({ state: getState(), t, filterQuery, categoryFilter });
}
function renderGlobalHistory() {
  historyViewRender({ state: getState(), t });
}

function setupClientForms() {
  setupClientFormsController({
    state: getState(),
    t,
    saveToLocalStorage: saveState,
    populateDropdownSelectors,
    showErrorView,
    switchView,
    openWorkoutSetupModal,
  });
}
function setupRoutineForms() {
  setupRoutineFormsController({
    state: getState(),
    t,
    saveToLocalStorage: saveState,
    populateDropdownSelectors,
    openWorkoutSetupModal,
  });
}
function setupExerciseForms() {
  setupExerciseFormsController({
    state: getState(),
    t,
    saveToLocalStorage: saveState,
    populateDropdownSelectors,
  });
}
function populateDropdownSelectors() {
  populateDropdownsController({ state: getState(), t });
}

function startWorkoutSession(clientRoutines, bookingMeta = null) {
  startWorkoutSessionController(clientRoutines, bookingMeta, {
    state: getState(),
    generateShortUUID,
    navigateToPath,
    toRoute,
    toUrl,
    focusSessionsColumn,
    launchClipboardDirectly,
    renderIdleSessionBar,
    saveToLocalStorage: saveState,
  });
  renderSessions();
}

function setupActiveSession() {
  initActiveSessionController({
    state: getState(),
    t,
    navigateToPath,
    toRoute,
    toUrl,
    focusSessionsColumn,
    launchClipboardDirectly,
    generateShortUUID,
    renderIdleSessionBar,
    saveToLocalStorage: saveState,
  });
  setupActiveSessionController({
    state: getState(),
    t,
    navigateToPath,
    focusSessionsColumn,
    launchClipboardDirectly,
    generateShortUUID,
    renderIdleSessionBar,
  });
}

function cancelWorkoutSession() {
  cancelWorkoutSessionController({ state: getState(), t, navigateToPath });
  renderSessions();
}

function saveActiveSessionToCache() {
  saveActiveSessionToCacheController();
}

function recoverActiveSession() {
  recoverActiveSessionController({
    state: getState(),
    t,
    generateShortUUID,
    navigateToPath,
    focusSessionsColumn,
    toRoute,
    toUrl,
    launchClipboardDirectly,
    renderIdleSessionBar,
    saveToLocalStorage: saveState,
  });
  renderSessions();
}

function getActiveExercise() {
  return getActiveExerciseController();
}

function renderActiveGroupBoard() {
  renderActiveGroupBoardController({
    state: getState(),
    t,
    navigateToPath,
    toRoute,
    toUrl,
    openFeedbackModal,
    generateShortUUID,
    saveToLocalStorage: saveState,
  });
}

function launchClipboardDirectly(arg) {
  const bookingId = arg && typeof arg === "object" ? arg.bookingId : arg;
  sessionsViewLaunchClipboard({ bookingId, state: getState(), startWorkoutSession });
}

function setupCalendarBookings() {
  sessionsViewSetupBookings({
    state: getState(),
    t,
    saveToLocalStorage: saveState,
    renderSessions,
  });
}

function renderSessions() {
  sessionsViewRender({
    state: getState(),
    t,
    getActiveSession,
    launchClipboardDirectly,
    saveToLocalStorage: saveState,
    rerenderSessions: renderSessions,
    navigateToPath,
    toUrl,
  });
}

window.addEventListener("DOMContentLoaded", init);
