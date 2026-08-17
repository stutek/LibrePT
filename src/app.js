// src/app.js - LibrePT Main Application Entry Point & Root Orchestrator
// Single responsibility: Bootstraps the application, wires dependency injections across components,
// and manages global lifecycle hooks.

import * as appBoot from "./appBoot.js";
import {
  cancelWorkoutSession as cancelWorkoutSessionController,
  enforceQuickSignalExclusivity,
  focusIndexFromRef,
  getActiveExercise as getActiveExerciseController,
  getActiveSession,
  openCatalogPicker,
  openSessionFromHistory,
  recoverActiveSession as recoverActiveSessionController,
  renderActiveGroupBoard as renderActiveGroupBoardController,
  saveActiveSessionToCache as saveActiveSessionToCacheController,
  sessionFocusPath,
  setClipboardEditMode,
  startSessionTimer,
  startWorkoutSession as startWorkoutSessionController,
  syncSessionFocusUrl,
} from "./controllers/activeSessionController.js";
import { primeBackupHealth, refreshBackupBadge } from "./controllers/backupHealthController.js";
import {
  openExerciseCreateDialog,
  setupExerciseForms as setupExerciseFormsController,
} from "./controllers/exerciseFormsController.js";
import {
  activeRouteIsDialog,
  activeRouteName,
  getBasePath,
  handlePathChange,
  navigateToPath,
  pushRoute,
  renderErrorViewShell,
  replaceRoute,
  resolveRoute,
  setHeaderState,
  setupNavigation,
  showErrorView as showErrorViewController,
  switchView as switchViewController,
  toRoute,
  urlFor,
} from "./controllers/routerController.js";
import {
  openRoutineCreateDialog,
  setupRoutineForms as setupRoutineFormsController,
} from "./controllers/routineFormsController.js";
import { driveSyncStatus, onSyncCountsChanged, primeAheadCache } from "./data/driveSyncService.js";
import { recordRsvp } from "./data/inviteRecord.js";
import { newRecordId } from "./data/recordId.js";
import { SESSION_INVITE, SESSION_RSVP, decodeSessionEvent } from "./data/sessionEventPayload.js";
import {
  getState,
  loadSavedState,
  onBackupRecorded,
  onStateSaved,
  removeDemoData,
  resetLibrePTData,
  saveToLocalStorage,
  seedMockData,
  setState,
  stateHasData,
} from "./data/stateStore.js";
import { repsPresetsDatalistHTML } from "./domain/repsAndLoad.js";
import { applyStaticDOMMappings } from "./i18n/domMappings.js";
import { dictionaryFor, hasChosenLanguage, isSupportedLang, resolveLang } from "./i18n/index.js";
import {
  renderClientsList as clientsViewRender,
  showClientDetails as clientsViewShowDetails,
  renderClientDetailViewShell,
  renderClientDirectoryViewShell,
} from "./modules/clients/clientsView.js";
import { openSignupReview } from "./modules/clients/signupReviewDialog.js";
import {
  renderHeaderShell,
  renderSyncBadge,
  setOfflineCachedState,
} from "./modules/common/applicationHeader.js";
import { prepareBackupDialog } from "./modules/common/backupRestore.js";
import { renderBuildInfo } from "./modules/common/buildInfoDialog.js";
import {
  CONSENT_FORM_VERSION,
  clientConsentFormUrl,
  clientPrivacyNoticeUrl,
} from "./modules/common/consentForm.js";
import { driveSyncFailureNotice, prepareDriveSyncCard } from "./modules/common/driveSyncUi.js";
import { openEncryptedFileReader } from "./modules/common/encryptedFileReader.js";
import { EVENT_PARAM, browserPlatform } from "./modules/common/eventTransports.js";
import { openFeedbackModal } from "./modules/common/feedbackModal.js";
import { renderNotificationArea } from "./modules/common/notificationArea.js";
import { populateDropdownSelectors as populateDropdownsController } from "./modules/common/populateDropdownSelectors.js";
import { registerShellRender, runShellRenders } from "./modules/common/renderRegistry.js";
import { INIT_DEMO_DATA, getShareParams } from "./modules/common/shareLink.js";
import { applyThemeSwitcherLabels, initTheme } from "./modules/common/theme.js";
import {
  escapeHTML,
  formatClockFromMinutes,
  formatDuration,
  formatDurationHourMin,
  formatSignedDuration,
  getClientDisplayNameHTML,
  getISODateForColumn,
  getISODateString,
} from "./modules/common/utils.js";
import {
  renderExercisesList as exercisesViewRender,
  renderExercisesViewShell,
} from "./modules/exercises/exercisesView.js";
import {
  renderGlobalHistory as historyViewRender,
  renderHistoryViewShell,
} from "./modules/history/historyView.js";
import { isIntakeLocation, resolveIntakeLang } from "./modules/intake/intakeRoute.js";
import { browserSignupPlatform } from "./modules/intake/signupDelivery.js";
import {
  openAdjustmentWizardComponent,
  renderAdjustmentsViewShell,
  renderApplyAdjustmentDialog,
  renderPendingPlanAdjustmentsComponent,
} from "./modules/plans/planAdjustments.js";
import {
  openRoutineEditorModal,
  renderRoutinesViewShell,
  renderRoutinesList as routinesViewRender,
} from "./modules/plans/plansView.js";
import { openWorkoutSetupModal } from "./modules/session/editSessionControl.js";
import { renderWorkoutSetupViewShell } from "./modules/session/editSessionView.js";
import { renderClipboardBar } from "./modules/session/sessionBar.js";
import { openSessionInviteDialog } from "./modules/session/sessionInviteDialog.js";
import { renderSessionTitle } from "./modules/session/sessionTitleBar.js";
import {
  focusSessionsColumn,
  renderSessionsTitleBar,
  scheduleTimelineSettle,
  setupSessionsDayNav,
} from "./modules/sessionList/sessionTimeline.js";
import {
  renderClientsViewShell,
  launchClipboardDirectly as sessionsViewLaunchClipboard,
  renderSessions as sessionsViewRender,
  seedDemoActiveSession as sessionsViewSeedDemo,
} from "./modules/sessionList/sessionsView.js";

function t(key) {
  // resolveLang, not `|| "en"`: an unchosen language is null and must still render in English
  // without that null being written back as a choice (see i18n/index.js).
  const dict = dictionaryFor(resolveLang(getState().lang));
  return dict[key] || key;
}

function applyTranslations(lang = resolveLang(getState().lang)) {
  const state = getState();
  state.lang = lang;
  // index.html ships `lang="en"` and nothing moved it, so a trainer switched to Slovenian was
  // served Slovenian text inside a document still declaring English — which is what a screen
  // reader picks its pronunciation from, and what `:lang()`/hyphenation rules match on.
  document.documentElement.lang = lang;

  const switcher = document.getElementById("lang-switcher");
  if (switcher) switcher.value = lang;

  applyThemeSwitcherLabels(lang);
  applyStaticDOMMappings(dictionaryFor(lang));

  renderSessionsTitleBar();
  renderNotificationArea();
}

function saveState() {
  saveToLocalStorage();
}

// The header's ahead/behind badge re-renders itself off these TWO seams (TODO §3.9's actual fix —
// see stateStore.js's onStateSaved doc comment) rather than needing every write call site to
// remember to refresh it: onStateSaved covers the "ahead" half (any local write), and
// onSyncCountsChanged covers the "behind" half (a read-only Drive counter refresh never touches
// local state, so it never fires onStateSaved on its own — see driveSyncService.js). Both registered
// once, at module load, since renderSyncBadge() already no-ops safely if the header hasn't rendered
// yet.
onStateSaved(renderSyncBadge);
onSyncCountsChanged(renderSyncBadge);

// TODO §3.8's unbacked warning rides the same seams, plus one of its own. onStateSaved covers "the
// trainer just made another change that exists nowhere else"; onBackupRecorded covers the moment
// that stops being true — and it is needed separately because a downloaded FILE never touches state,
// so onStateSaved cannot see it. Without it the badge would keep warning after the very action that
// resolved it, which is how a warning teaches people to ignore it.
onStateSaved(refreshBackupBadge);
onBackupRecorded(primeBackupHealth);

window.resetLibrePTData = resetLibrePTData;
window.stateHasData = () => stateHasData(getState());

async function init() {
  // The intake page is a different app for a different person, and it returns before any of the
  // trainer's boot happens (TODO §1.7/§26.1). No state load, no seed, no service worker, no terms
  // modal, no splash hold — and crucially NO WRITE: a prospective client who fills this in and walks
  // away leaves nothing on their own phone. `initTheme` is skipped for exactly that reason (it
  // persists the resolved theme); theme-boot.js has already put the right class on <html> before
  // paint, and it writes nothing.
  // An invite link is the app's own root with `?evt=` (eventTransports.buildEventLink), so WHO is
  // holding the phone is decided by what the payload turns out to be — not by a path. An INVITE means
  // the client is answering one; an RSVP means the trainer is collecting an answer, and that falls
  // through to the normal boot below. There is deliberately no `/rsvp` route: the link shape already
  // existed and inventing a second one would strand links already sent.
  const inboundEvent = decodeSessionEvent(
    new URLSearchParams(window.location.search).get(EVENT_PARAM),
  );
  const mangledEvent =
    !inboundEvent && Boolean(new URLSearchParams(window.location.search).get(EVENT_PARAM));
  if (inboundEvent?.kind === SESSION_INVITE || mangledEvent) {
    // A mangled link lands here too, on purpose: a messaging app that wrapped the URL must produce
    // "ask your trainer to send it again" rather than the trainer's dashboard, which would tell the
    // client nothing and show them someone else's app.
    appBoot.bootRsvpReply({
      encodedEvent: new URLSearchParams(window.location.search).get(EVENT_PARAM),
      t: (key) =>
        dictionaryFor(resolveIntakeLang(getShareParams().lang, navigator.languages || []))[key] ||
        key,
      lang: resolveIntakeLang(getShareParams().lang, navigator.languages || []),
      appUrl: window.location.origin + getBasePath(),
      platform: browserPlatform(),
    });
    return;
  }

  if (isIntakeLocation(window.location.pathname)) {
    let intakeLang = resolveIntakeLang(
      getShareParams().lang,
      navigator.languages || [navigator.language],
    );
    appBoot.bootIntake({
      // A dictionary read straight from the chosen language, never through `state.lang` — there is no
      // state on this path and nothing to write a choice into.
      t: (key) => dictionaryFor(intakeLang)[key] || key,
      lang: () => intakeLang,
      onChooseLanguage: (chosen) => {
        intakeLang = resolveIntakeLang(chosen, []);
      },
      platform: browserSignupPlatform(),
      todayIso: () => getISODateString(Date.now()),
      consentVersion: CONSENT_FORM_VERSION,
      noticeUrlFor: clientPrivacyNoticeUrl,
      formUrlFor: clientConsentFormUrl,
    });
    return;
  }

  initTheme();
  // The header shell renders before anything else: appBoot.bootAppLifecycle() below stamps the
  // build commit into #app-version synchronously, and several setup functions later in this file
  // query header elements (#backup-btn, #app-version) despite not being the header's own module —
  // the header must exist before any of that runs, not just before appBoot.bootHeader() itself.
  renderHeaderShell();
  appBoot.bootAppLifecycle({
    basePath: getBasePath(),
    setOfflineCachedState,
    t,
  });

  // Loading is IndexedDB-backed (TODO §18.6 part 4): everything below still assumes `state` is
  // fully populated once this resolves, exactly as when the call was synchronous.
  const state = await loadSavedState();

  const { lang: shareLang, init: shareInit, demo: shareDemo } = getShareParams();
  if (isSupportedLang(shareLang)) state.lang = shareLang;

  if (shareInit === INIT_DEMO_DATA && !stateHasData(state)) {
    seedMockData();
    sessionsViewSeedDemo({ state: getState() });
  } else if (!stateHasData(state)) {
    localStorage.removeItem("librept_active_session");
  }

  // A reply the trainer just tapped (TODO §1.6). The answer lands on the INVITATION — decided
  // 2026-08-17: sessions host attendees, invites host the RSVP — so `participants` is deliberately
  // untouched. A "no" is an answer, not a withdrawal, and a client's reply must not silently remove
  // someone the trainer put in the session.
  if (inboundEvent?.kind === SESSION_RSVP) {
    state.invites = recordRsvp(state.invites || [], inboundEvent, {
      now: new Date().toISOString(),
      newId: newRecordId,
    });
    saveState();
  }

  // Wire router dependencies
  appBoot.bootRouter({
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
    renderClipboardBar,
    renderSessions: () => renderSessions(),
    renderClientsList: (q) => renderClientsList(q),
    startSessionTimer,
    syncSessionFocusUrl,
    focusIndexFromRef,
    getISODateForColumn,
    clientsViewShowDetails,
    setHeaderState,
    prepareBackupDialog,
    prepareDriveSyncCard,
    renderBuildInfo,
    openRoutineCreateDialog,
    openExerciseCreateDialog,
    openCatalogPicker,
    openRoutineEditor: (routineId) => openRoutineEditorModal({ routineId, state: getState(), t }),
    openAdjustmentWizard,
  });

  // Every view's shell markup is injected here, before any per-view setup step queries an element
  // inside it — index.html only owns the empty #main-content canvas, each view module owns its own
  // <section>, the same way the dialogs above own their own <dialog>. TODO.md §14.8: rather than a
  // hand-maintained call order (which already produced two silent no-op bugs — a module's render
  // landing above the element it queries), each shell registers itself plus what it depends on
  // existing first, and runShellRenders() computes a valid order via topological sort.
  registerShellRender("clients-view", renderClientsViewShell);
  registerShellRender("adjustments-view", renderAdjustmentsViewShell);
  // dialog-apply-adjustment must exist before its route is ever entered: DialogRoute.enter() looks
  // the element up before calling this route's open() callback (which used to be the only thing
  // creating it), so a lazily-rendered dialog was always missing on the very navigation meant to
  // open it. Declared as depending on "adjustments-view" (the surface it's launched from) so a
  // future reorder can't silently separate them again.
  registerShellRender("apply-adjustment-dialog", renderApplyAdjustmentDialog, ["adjustments-view"]);
  registerShellRender("client-directory-view", renderClientDirectoryViewShell);
  registerShellRender("client-detail-view", renderClientDetailViewShell);
  registerShellRender("routines-view", renderRoutinesViewShell);
  registerShellRender("exercises-view", renderExercisesViewShell);
  registerShellRender("history-view", renderHistoryViewShell);
  registerShellRender("workout-setup-view", renderWorkoutSetupViewShell);
  registerShellRender("error-view", renderErrorViewShell);
  runShellRenders();

  setupNavigation({ setupSessionsDayNav });
  setupClientForms();
  setupClientDataRights();
  appBoot.bootEncryptedFileReader();
  appBoot.bootPlansView({ navigateToPath, urlFor });
  setupRoutineForms();
  setupExerciseForms();

  appBoot.bootSessionInviteDialog({ getState, t, saveState, newInviteId: newRecordId });

  appBoot.bootWorkoutSetup({
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
    openSessionInviteDialog,
  });
  setupActiveSession();

  appBoot.bootFeedbackModal({
    getState,
    getActiveSession: () => getActiveSession(),
    t,
    newRecordId,
    saveActiveSessionToCache,
    saveToLocalStorage: saveState,
    renderPendingPlanAdjustments,
    enforceQuickSignalExclusivity,
  });

  appBoot.bootRestTimer({
    t,
    onFocusTimer: (timer) => {
      if (!timer.sessionId || !timer.clientId) return;
      let path = `/session/${timer.sessionId}/client/${timer.clientId}`;
      if (timer.focusRef) path += `/${timer.focusRef.type}/${timer.focusRef.id}`;
      navigateToPath(path);
    },
  });

  appBoot.bootBackupRestore({
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
    renderSessions,
    t,
  });
  // renderSyncBadge/renderNotificationArea are injected because a sync's START and its FAILURE
  // repaint surfaces the header's own seams never hear about: onStateSaved fires only for a local
  // write, and a sync that failed before writing made none.
  appBoot.bootDriveSyncUi({ t, renderSyncBadge, renderNotificationArea });

  appBoot.bootHeader({
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
    renderClipboardBar,
    openEncryptedFileReader,
    openSignupReview,
  });

  appBoot.bootSessionTimeline({
    getState,
    t,
    activeRouteName,
    pushRoute,
    urlFor,
  });

  appBoot.bootSessionTitleBar({
    getActiveSession: () => getActiveSession(),
    getISODateString,
    formatClockFromMinutes,
  });

  appBoot.bootBuildInfoDialog({ t, navigateToPath, urlFor });

  appBoot.bootNotificationArea({
    getState,
    getActiveSession: () => getActiveSession(),
    t,
    // A failed sync's home outside the Sync & Backup dialog (TODO §3.11) — the header glyph turns
    // into a warning triangle, and this is what says why.
    getSyncFailure: driveSyncFailureNotice,
    escapeHTML,
    navigateToPath,
    openSessionFromHistory,
    removeDemoData,
    // A full re-render rather than a targeted patch: clearing the demo touches every collection, so
    // every view showing one is stale at once.
    onRemoved: () => window.location.reload(),
    // The same reasoning in the opposite direction, for the empty feed's offer to seed one.
    seedDemoData: () => {
      seedMockData();
      window.location.reload();
    },
  });

  // After bootNotificationArea: the clipboard bar mounts into the notification area's handle bar,
  // so that shell has to exist first. `clipboardPath` is what the bar navigates to — the controller
  // builds it, including the in-focus card and edit-mode segments, so a tap returns the trainer to
  // exactly where they left rather than to the top of the deck.
  appBoot.bootSessionBar({
    getActiveSession: () => getActiveSession(),
    t,
    formatSignedDuration,
    formatDuration,
    formatDurationHourMin,
    navigateToPath,
    clipboardPath: () => sessionFocusPath(),
  });

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

  appBoot.bootViewDismiss({ navigateToPath, getActiveSession, launchClipboardDirectly });

  // Local-only read (IndexedDB meta), so this is cheap to await here rather than firing it off
  // unobserved — the ahead count badge below would otherwise render its very first paint from an
  // empty cache (reading 0) even when a prior sync's ancestor is sitting right there in storage.
  await primeAheadCache();
  renderSyncBadge();
  // Awaited for the same reason: both inputs are local reads, and a first paint that renders "no
  // warning" from an empty cache would flash the wrong answer to precisely the trainer who needs
  // the right one.
  await primeBackupHealth();

  // Results are published on `window` rather than only logged, because the e2e suite replays this
  // exact tour and asserts on them (tests/e2e/test_demo_tour.py) — the demo and the test are one
  // artifact, which is the point of scripting it instead of recording it.
  await appBoot.bootDemoTour({
    shareDemo,
    hasData: stateHasData(getState()),
    onResults: (results) => {
      window.__demoTourResults = results;
    },
  });

  await appBoot.bootWalkthrough({ shareDemo, hasData: stateHasData(getState()), t });
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
  historyViewRender({ state: getState(), t, openSessionFromHistory });
}

function setupClientDataRights() {
  appBoot.bootSignupReview({
    getState,
    t,
    saveState,
    renderClientsList: () => renderClientsList(),
    newClientId: newRecordId,
    todayIso: () => getISODateString(Date.now()),
  });

  appBoot.bootClientDataRights({
    getState,
    // The erasure rewrites four collections at once, so it hands back a whole new state rather than
    // mutating in place — setState is the only seam that can accept that.
    saveState: (next) => {
      setState(next);
      saveState();
      renderClientsList();
      renderGlobalHistory();
      populateDropdownSelectors();
    },
    isDriveConfigured: () => driveSyncStatus().configured,
    t,
  });
}

function setupClientForms() {
  appBoot.bootClientForms({
    state: getState(),
    t,
    navigateToPath,
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

function startWorkoutSession(clientRoutines, sessionMeta = null, options = {}) {
  startWorkoutSessionController(
    clientRoutines,
    sessionMeta,
    {
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
      renderClipboardBar,
      saveToLocalStorage: saveState,
    },
    options,
  );
  renderSessions();
}

function setupActiveSession() {
  appBoot.bootActiveSession({
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
    renderClipboardBar,
    renderSessions,
    renderSessionTitle,
    saveToLocalStorage: saveState,
  });

  // Deliberately last: the splash comes down only once every component above is wired. It may not
  // come down on its own at all — first it asks for a language if none has been chosen, then, with
  // an empty database, it becomes the onboarding entry point and waits for a choice.
  appBoot.bootSplashScreen({
    offerOnboarding: !stateHasData(getState()),
    needsLanguageChoice: !hasChosenLanguage(getState().lang),
    onChooseLanguage: (lang) => {
      applyTranslations(lang);
      saveState();
    },
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
    renderClipboardBar,
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

function launchClipboardDirectly(arg, options = {}) {
  const sessionId = arg && typeof arg === "object" ? arg.sessionId : arg;
  sessionsViewLaunchClipboard({ sessionId, state: getState(), startWorkoutSession }, options);
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
