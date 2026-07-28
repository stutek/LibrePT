// src/app.js - LibrePT Main Application Entry Point & Root Orchestrator
// Single responsibility: Bootstraps the application, wires dependency injections across components,
// and manages global lifecycle hooks.

import {
  cancelWorkoutSession as cancelWorkoutSessionController,
  enforceQuickSignalExclusivity,
  focusExerciseByIndex,
  focusIndexFromRef,
  getActiveExercise as getActiveExerciseController,
  getActiveSession,
  initActiveSessionController,
  openCatalogPicker,
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
  openExerciseCreateDialog,
  openRoutineCreateDialog,
  populateDropdownSelectors as populateDropdownsController,
  setupClientForms as setupClientFormsController,
  setupExerciseForms as setupExerciseFormsController,
  setupRoutineForms as setupRoutineFormsController,
} from "./controllers/formsController.js";
import { setupViewDismiss } from "./controllers/gestureController.js";
import {
  activeRouteIsDialog,
  activeRouteName,
  focusActiveSessionCard,
  getBasePath,
  handlePathChange,
  initRouter,
  navigateToPath,
  pushRoute,
  renderErrorViewShell,
  replaceRoute,
  resolveRoute,
  setHeaderState,
  setupNavigation,
  showErrorView as showErrorViewController,
  showSessionView,
  switchView as switchViewController,
  toRoute,
  urlFor,
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
import { fetchVersionCatalog } from "./data/versionCatalog.js";
import { applyStaticDOMMappings } from "./i18n/domMappings.js";
import { TRANSLATIONS } from "./i18n/index.js";
import { renderClientsDirectory } from "./modules/clients/clientsDirectory.js";
import {
  renderClientsList as clientsViewRender,
  showClientDetails as clientsViewShowDetails,
  renderClientDetailViewShell,
  renderClientDirectoryViewShell,
} from "./modules/clients/clientsView.js";
import { initRestTimer, setupRestTimer } from "./modules/clipboard/exerciseAndRestTimer.js";
import { renderExerciseDeck } from "./modules/clipboard/exerciseDeck.js";
import {
  renderActiveUsersList,
  updateClientTabsFadeState,
} from "./modules/common/activeUsersList.js";
import {
  incrementLocalSync,
  initApplicationHeader,
  renderHeaderShell,
  renderSyncBadge,
  resetSyncState,
  setOfflineCachedState,
  setSyncTrackingReady,
  setupApplicationHeader,
} from "./modules/common/applicationHeader.js";
import {
  initBackupRestore,
  prepareBackupDialog,
  setupBackupRestore,
} from "./modules/common/backupRestore.js";
import {
  initBuildInfoDialog,
  renderBuildInfo,
  setupBuildInfoDialog,
} from "./modules/common/buildInfoDialog.js";
import {
  initFeedbackModal,
  openFeedbackModal,
  setupFeedbackForms,
} from "./modules/common/feedbackModal.js";
import {
  initNotificationArea,
  renderNotificationArea,
  setupNotificationGestures,
} from "./modules/common/notificationArea.js";
import { newRecordId } from "./modules/common/recordId.js";
import { repsPresetsDatalistHTML } from "./modules/common/repsAndLoad.js";
import { INIT_DEMO_DATA, getShareParams } from "./modules/common/shareLink.js";
import {
  buildSessionMeta,
  escapeHTML,
  formatClockFromMinutes,
  formatDateStr,
  formatDuration,
  formatDurationHM,
  formatSignedDuration,
  getClientDisplayNameHTML,
  getISODateForColumn,
  getISODateString,
  getInitials,
  getOverlappingSessions,
  isTimeOverlapping,
  parseTimeRange,
  truncateString,
} from "./modules/common/utils.js";
import { initVersionMessages } from "./modules/common/versionMessages.js";
import {
  renderExercisesList as exercisesViewRender,
  renderExercisesViewShell,
} from "./modules/exercises/exercisesView.js";
import {
  renderGlobalHistory as historyViewRender,
  renderHistoryViewShell,
} from "./modules/history/historyView.js";
import {
  openAdjustmentWizardComponent,
  renderAdjustmentsViewShell,
  renderApplyAdjustmentDialog,
  renderPendingPlanAdjustmentsComponent,
} from "./modules/plans/planAdjustments.js";
import {
  initPlansView,
  openRoutineEditorModal,
  renderRoutinesViewShell,
  renderRoutinesList as routinesViewRender,
} from "./modules/plans/plansView.js";
import {
  initEditSessionControl,
  initWorkoutSetup,
  openEditSessionControlModal,
  openWorkoutSetupModal,
  setupEditSessionControl,
  setupWorkoutSetup,
} from "./modules/session/editSessionControl.js";
import {
  renderEditSessionView,
  renderWorkoutSetupView,
  renderWorkoutSetupViewShell,
} from "./modules/session/editSessionView.js";
import {
  initSessionBar,
  renderActiveSessionBarLabels,
  renderIdleSessionBar,
  updateSessionBarTimer,
} from "./modules/session/sessionBar.js";
import { initSessionTitleBar, renderSessionTitle } from "./modules/session/sessionTitleBar.js";
import {
  focusSessionsColumn,
  getSessionDayDate,
  initSessionTimeline,
  renderSessionsTitleBar,
  scheduleTimelineSettle,
  setupSessionsDayNav,
} from "./modules/sessionList/sessionTimeline.js";
import {
  renderClientsViewShell,
  launchClipboardDirectly as sessionsViewLaunchClipboard,
  renderSessions as sessionsViewRender,
  seedDemoActiveSession as sessionsViewSeedDemo,
  setupCalendarSessions as sessionsViewSetupSessions,
} from "./modules/sessionList/sessionsView.js";

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

window.resetLibrePTData = resetLibrePTData;
window.seedMockData = () => seedMockData(incrementLocalSync);
window.stateHasData = () => stateHasData(getState());

// Populated asynchronously at boot from the published manifest; null until then, and null forever
// on a deploy that publishes a single version.
let versionCatalog = null;

function init() {
  initTheme();
  // The header shell renders before anything else: initAppLifecycle() below stamps the build
  // commit into #app-version synchronously, and several setup functions later in this file query
  // header elements (#backup-btn, #app-version) despite not being the header's own module — the
  // header must exist before any of that runs, not just before its own setupApplicationHeader().
  renderHeaderShell();
  initAppLifecycle({
    basePath: getBasePath(),
    setOfflineCachedState,
    t,
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
    scheduleTimelineSettle,
    setClipboardEditMode,
    renderActiveGroupBoard: () => renderActiveGroupBoard(),
    renderActiveSessionBarLabels,
    renderSessions: () => renderSessions(),
    renderClientsList: (q) => renderClientsList(q),
    startSessionTimer,
    syncSessionFocusUrl,
    focusIndexFromRef,
    getISODateForColumn,
    clientsViewShowDetails,
    setHeaderState,
    prepareBackupDialog,
    renderBuildInfo,
    openRoutineCreateDialog,
    openExerciseCreateDialog,
    openCatalogPicker,
    openRoutineEditor: (routineId) => openRoutineEditorModal({ routineId, state: getState(), t }),
    openAdjustmentWizard,
  });

  // Every view's shell markup is injected here, in document order, before any per-view setup
  // step queries an element inside it — index.html only owns the empty #main-content canvas, each
  // view module owns its own <section>, the same way the dialogs above own their own <dialog>.
  renderClientsViewShell();
  renderAdjustmentsViewShell();
  // dialog-apply-adjustment must exist before its route is ever entered: DialogRoute.enter()
  // looks the element up before calling this route's open() callback (which used to be the only
  // thing creating it), so a lazily-rendered dialog was always missing on the very navigation
  // meant to open it.
  renderApplyAdjustmentDialog();
  renderClientDirectoryViewShell();
  renderClientDetailViewShell();
  renderRoutinesViewShell();
  renderExercisesViewShell();
  renderHistoryViewShell();
  renderWorkoutSetupViewShell();
  renderErrorViewShell();

  setupNavigation({ setupSessionsDayNav });
  setupClientForms();
  initPlansView({ navigateToPath, urlFor });
  setupRoutineForms();
  setupExerciseForms();

  renderWorkoutSetupView();
  initWorkoutSetup({
    getState,
    t,
    getClientDisplayNameHTML,
    startWorkoutSession,
    switchView,
    pushRoute,
    urlFor,
    getISODateForColumn,
    focusSessionsColumn,
    scheduleTimelineSettle,
    saveToLocalStorage: saveState,
    rerenderSessions: renderSessions,
  });
  setupWorkoutSetup();
  setupActiveSession();

  initFeedbackModal({
    getState,
    getActiveSession: () => getActiveSession(),
    t,
    newRecordId,
    saveActiveSessionToCache,
    saveToLocalStorage: saveState,
    renderPendingPlanAdjustments,
    enforceQuickSignalExclusivity,
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
    navigateToPath,
    urlFor,
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
  setupCalendarSessions();

  initApplicationHeader({
    getState,
    t,
    saveToLocalStorage: saveState,
    applyTranslations,
    navigateToPath,
    urlFor,
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

  initSessionTimeline({
    getState,
    t,
    activeRouteName,
    pushRoute,
    urlFor,
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
    getOverlappingSessions,
    buildSessionMeta,
    getSessionDayDate,
  });

  // The version catalog is fetched once at boot and cached here; every notification render reads
  // this snapshot rather than refetching. Absent (today's single-version deploy) means no offers.
  initBuildInfoDialog({ t, navigateToPath, urlFor });
  setupBuildInfoDialog();

  initVersionMessages({
    t,
    escapeHTML,
    basePath: getBasePath(),
    getCatalog: () => versionCatalog,
  });
  fetchVersionCatalog(getBasePath()).then((catalog) => {
    if (!catalog) return;
    versionCatalog = catalog;
    renderNotificationArea();
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
    navigateToPath,
    urlFor,
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
    navigateToPath,
    urlFor,
  });
}
function setupExerciseForms() {
  setupExerciseFormsController({
    state: getState(),
    t,
    saveToLocalStorage: saveState,
    populateDropdownSelectors,
    navigateToPath,
    urlFor,
  });
}
function populateDropdownSelectors() {
  populateDropdownsController({ state: getState(), t });
}

function startWorkoutSession(clientRoutines, sessionMeta = null) {
  startWorkoutSessionController(clientRoutines, sessionMeta, {
    state: getState(),
    newRecordId,
    navigateToPath,
    toRoute,
    replaceRoute,
    resolveRoute,
    activeRouteName,
    activeRouteIsDialog,
    urlFor,
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
    replaceRoute,
    resolveRoute,
    activeRouteName,
    activeRouteIsDialog,
    urlFor,
    focusSessionsColumn,
    launchClipboardDirectly,
    newRecordId,
    renderIdleSessionBar,
    renderSessions,
    saveToLocalStorage: saveState,
  });
  setupActiveSessionController({
    state: getState(),
    t,
    navigateToPath,
    focusSessionsColumn,
    launchClipboardDirectly,
    newRecordId,
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
    newRecordId,
    navigateToPath,
    focusSessionsColumn,
    toRoute,
    replaceRoute,
    resolveRoute,
    activeRouteName,
    activeRouteIsDialog,
    urlFor,
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
    replaceRoute,
    resolveRoute,
    activeRouteName,
    activeRouteIsDialog,
    urlFor,
    openFeedbackModal,
    newRecordId,
    saveToLocalStorage: saveState,
  });
}

function launchClipboardDirectly(arg) {
  const sessionId = arg && typeof arg === "object" ? arg.sessionId : arg;
  sessionsViewLaunchClipboard({ sessionId, state: getState(), startWorkoutSession });
}

function setupCalendarSessions() {
  sessionsViewSetupSessions({
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
    urlFor,
    focusSessionsColumn,
  });
}

window.addEventListener("DOMContentLoaded", init);
