// src/app.js - LibrePT Main Application Entry Point & Root Orchestrator
// Single responsibility: Bootstraps the application, wires dependency injections across components,
// and manages global lifecycle hooks.

import * as appBoot from "./appBoot.js";
import {
  cancelWorkoutSession as cancelWorkoutSessionController,
  enforceQuickSignalExclusivity,
  enterClipboardEditMode as enterClipboardEditModeController,
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
  replaceQueryParam,
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
import { ISSUE_TRACKER_URL } from "./data/crashReport.js";
import { driveSyncStatus, onSyncCountsChanged, primeAheadCache } from "./data/driveSyncService.js";
import { clearDatabaseStores, listDatabaseStores } from "./data/indexedDb.js";
import { recordRsvp } from "./data/inviteRecord.js";
import { newRecordId } from "./data/recordId.js";
import { sandboxStaleness } from "./data/sandboxStaleness.js";
import { SESSION_INVITE, SESSION_RSVP, decodeSessionEvent } from "./data/sessionEventPayload.js";
import {
  deleteSandboxDatabase,
  ensureSandboxSeeded,
  getState,
  loadSavedState,
  onBackupRecorded,
  onStateSaved,
  prepareWorkspaceForBoot,
  readSandboxMeta,
  recordSandboxOfferDeclined,
  removeDemoData,
  resetLibrePTData,
  resetSandbox,
  saveToLocalStorage,
  seedMockData,
  setState,
  stateHasData,
  switchWorkspace,
} from "./data/stateStore.js";
import { isSandbox } from "./data/workspace.js";
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
  renderBuildStateBadge,
  renderHeaderShell,
  renderSyncBadge,
  renderWorkspaceChrome,
  setOfflineCachedState,
} from "./modules/common/applicationHeader.js";
import { prepareBackupDialog } from "./modules/common/backupRestore.js";
import { renderBuildInfo } from "./modules/common/buildInfoDialog.js";
import {
  CONSENT_FORM_VERSION,
  clientConsentFormUrl,
  clientPrivacyNoticeUrl,
} from "./modules/common/consentForm.js";
import { initDataWipeDialog, openDataWipeDialog } from "./modules/common/dataWipeDialog.js";
import { driveSyncFailureNotice, prepareDriveSyncCard } from "./modules/common/driveSyncUi.js";
import { openEncryptedFileReader } from "./modules/common/encryptedFileReader.js";
import { EVENT_PARAM, browserPlatform } from "./modules/common/eventTransports.js";
import { openFeedbackModal } from "./modules/common/feedbackModal.js";
import { renderNotificationArea } from "./modules/common/notificationArea.js";
import { populateDropdownSelectors as populateDropdownsController } from "./modules/common/populateDropdownSelectors.js";
import { registerShellRender, runShellRenders } from "./modules/common/renderRegistry.js";
import { openStaleSandboxDialog } from "./modules/common/sandboxDialogs.js";
import { DEMO_STORY, INIT_DEMO_DATA, getShareParams } from "./modules/common/shareLink.js";
import {
  applyTheme,
  applyThemeSwitcherLabels,
  getInitialTheme,
  initTheme,
} from "./modules/common/theme.js";
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
import { browserSignupPlatform, storySignupPlatform } from "./modules/intake/signupDelivery.js";
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
import { guidedDemoUrl } from "./modules/splash/splashScreen.js";

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

// TODO §28.9's build-state badge rides the SAME write seam, for a reason the two above share: what
// it names changes the moment the store stops being only the demo — the trainer's first real client
// — and that is a write like any other, arriving through call sites app.js never sees.
onStateSaved(() => renderBuildStateBadge(getState()));

window.resetLibrePTData = resetLibrePTData;
window.stateHasData = () => stateHasData(getState());

/** Whether this arrival was FURNISHED by its link: the demo seed, the walkthrough, or an invitation
 * being answered. Those links get exactly the boot they asked for, first run or not (TODO §28.11).
 */
function linkFurnishesTheApp({ shareInit, shareDemo, inboundEvent }) {
  return Boolean(shareInit || shareDemo || inboundEvent);
}

async function init() {
  // FIRST, before anything else can throw: a crash during boot is exactly the one a trainer is least
  // able to describe, and §12.4's whole point is that it currently dies in a console nobody opens.
  // Re-renders the feed rather than interrupting — nothing steals focus (TODO §12.4).
  appBoot.bootCrashCapture({ onCaptured: () => renderNotificationArea() });

  // The intake page is a different app for a different person, and it returns before any of the
  // trainer's boot happens (TODO §1.7/§26.1). No state load, no seed, no service worker, no terms
  // modal, no splash hold — and crucially NO WRITE: a prospective client who fills this in and walks
  // away leaves nothing on their own phone (their half-typed form lives in sessionStorage until the
  // tab closes — §38.12). `initTheme` is skipped for exactly that reason (it
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
    // The theme the link named, on screen only: `theme-boot.js` put it on <html> before paint, but
    // every theme stylesheet declares its tokens against `html.X, body.X` and <body> still wears the
    // light class from the document. Applied without persisting, because this phone belongs to a
    // stranger and the whole boot writes nothing (§26.1).
    applyTheme(getInitialTheme(), { persist: false });
    appBoot.bootIntake({
      // A dictionary read straight from the chosen language, never through `state.lang` — there is no
      // state on this path and nothing to write a choice into.
      t: (key) => dictionaryFor(intakeLang)[key] || key,
      lang: () => intakeLang,
      onChooseLanguage: (chosen) => {
        intakeLang = resolveIntakeLang(chosen, []);
      },
      // The story's client chapter must not drop a file into a viewer's Downloads folder, so when
      // the demo is what brought them here the last inch is a recorder rather than a share sheet
      // (modules/intake/signupDelivery.js). Everything before it is the real page.
      platform:
        getShareParams().demo === DEMO_STORY ? storySignupPlatform() : browserSignupPlatform(),
      todayIso: () => getISODateString(Date.now()),
      consentVersion: CONSENT_FORM_VERSION,
      noticeUrlFor: clientPrivacyNoticeUrl,
      formUrlFor: clientConsentFormUrl,
      // The story's client-side chapter, when the handover sent them here (TODO §35.3e). Read from
      // the link like everything else on this path; it writes nothing either.
      shareDemo: getShareParams().demo,
      shareChapter: getShareParams().chapter,
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

  const {
    lang: shareLang,
    init: shareInit,
    demo: shareDemo,
    chapter: shareChapter,
    workspace: shareWorkspace,
  } = getShareParams();

  // A link asking for the sandbox picks the workspace BEFORE the load, so boot reads one database
  // rather than two (TODO §40.9). This is where the app's own "show me around" offers land.
  prepareWorkspaceForBoot(shareWorkspace);

  // Loading is IndexedDB-backed (TODO §18.6 part 4): everything below still assumes `state` is
  // fully populated once this resolves, exactly as when the call was synchronous.
  const state = await loadSavedState();
  if (isSupportedLang(shareLang)) state.lang = shareLang;

  // First entry fills the sandbox. Before the `?init=` branch below, or an unseeded sandbox reads as
  // an empty app and has its open-session key cleared out from under it. `?init=` itself is left
  // alone by all of this: it still seeds whichever workspace is open, which is what the whole e2e
  // suite runs on (TODO §40.7).
  await ensureSandboxSeeded();

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
    // The support data-wipe (TODO §31): reachable only by the address support sends, and even then
    // only as far as its confirmation.
    openDataWipe: openDataWipeDialog,
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
  // The splash's first-run decisions ride along from here because they are facts about THIS
  // arrival — what the link carried, and what language was stored before it was applied — and
  // setupActiveSession is where the splash is taken down (TODO §28.11). Its promise is handed back
  // rather than awaited: the splash may sit on screen until someone answers a question, and the
  // rest of the boot must finish either way — the demo is what waits for it.
  const splashDown = setupActiveSession({
    linkBringsContent: linkFurnishesTheApp({ shareInit, shareDemo, inboundEvent }),
  });

  initDataWipeDialog({
    t,
    storeNames: listDatabaseStores,
    localStorageKeys: () => Object.keys(localStorage),
    clearStores: clearDatabaseStores,
    removeKeys: (keys) => {
      for (const key of keys) localStorage.removeItem(key);
    },
    // The sandbox database, deleted whole rather than emptied store by store (TODO §40): it holds
    // sample data only, and a wipe that left a second database standing would be a wipe that left
    // something behind.
    removeSandbox: () => deleteSandboxDatabase(),
    reload: () => window.location.reload(),
  });

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
    // A timer that finishes in the trainer's own work while they are in the sandbox offers the way
    // back (TODO §40.11); this is that way back.
    onReturnToWork: (name) => switchToWorkspace(name),
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
    onSwitchWorkspace: (name) => switchToWorkspace(name),
    // An imported programme lands in the ordinary plan editor (TODO §29): the same clipboard a
    // trainer builds a session in, so its save is the write and there is no import-specific
    // persistence to keep correct.
    onProgramImported: openImportedProgramme,
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
    // For the day label the bar now carries — "today" reads on a gym floor, "2026-09-01" does not.
    t,
  });

  appBoot.bootBuildInfoDialog({ t, navigateToPath, urlFor });

  appBoot.bootNotificationArea({
    // The crash log lives in the lifecycle controller (in memory only) and the tracker URL is a
    // constant — the feed decides IF and WHEN to mention a crash, which is what keeps §12.4's handler
    // from interrupting a live session.
    getCrashes: appBoot.crashLog,
    repoUrl: ISSUE_TRACKER_URL,
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
    // every view showing one is stale at once. It used to reload the page for that, which is a
    // heavy way to repaint and loses the trainer's place (TODO §40.3a).
    onRemoved: () => renderEverything(),
    // The same reasoning in the opposite direction, for the empty feed's offer to seed one.
    seedDemoData: () => {
      seedMockData();
      renderEverything();
    },
    // The guided demo runs from a deep link and a reload, exactly as the splash's own offer does
    // (TODO §28.14) — the same URL builder, so the two entry points cannot drift into starting
    // different things.
    startWalkthrough: () => window.location.assign(guidedDemoUrl()),
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

  const repsPresetHost = document.getElementById("reps-preset-datalists");
  if (repsPresetHost) repsPresetHost.innerHTML = repsPresetsDatalistHTML();

  // The same repaint boot needs and every wholesale state replacement needs — including the build
  // state badge, which reads the store to tell SANDBOX from the trainer's own work.
  renderEverything();

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

  // Started, never awaited: it waits for the splash and the first-run agreement, which may take as
  // long as the trainer takes to read them.
  startDemoWhenWatchable({ splashDown, shareDemo, shareChapter, shareStep: getShareParams().step });
}

/** Everything a `?demo=` link asks for, started only once someone can actually watch it.
 *
 * Not part of init()'s body: the demo used to start the moment the app was wired, which on a first
 * run is behind the mandatory terms modal and the splash's own language question (reported
 * 2026-08-21). It ran its whole script to an empty room. `splashDown` is the splash's own promise,
 * so this also waits out the language step — and the demo then narrates itself in the language the
 * viewer just picked.
 *
 * Results are published on `window` rather than only logged, because the e2e suite replays these
 * exact scripts and asserts on them — the demo and the test are one artifact, which is the point of
 * scripting it instead of recording it.
 */
async function startDemoWhenWatchable({ splashDown, shareDemo, shareChapter, shareStep }) {
  await appBoot.whenDemoCanBeWatched(splashDown);

  await appBoot.bootDemoTour({
    shareDemo,
    hasData: stateHasData(getState()),
    onResults: (results) => {
      window.__demoTourResults = results;
    },
  });

  await appBoot.bootDemoStory({
    shareDemo,
    shareChapter,
    shareStep,
    rememberStep: (stepId) => replaceQueryParam("step", stepId),
    hasData: stateHasData(getState()),
    t,
    goHome: (path) => navigateToPath(path || "/"),
    // Read at the moment of the crossing, not at boot: the trainer can change language mid-story
    // from the ☰ menu, and the evening chapter does exactly that with the theme.
    getLang: () => resolveLang(getState().lang),
  });

  await appBoot.bootWalkthrough({
    shareDemo,
    hasData: stateHasData(getState()),
    t,
    goHome: () => navigateToPath("/"),
  });
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
function renderExercisesList(filterQuery, categoryFilter) {
  // Left undefined on purpose when a caller passes nothing: the view then reads the visible
  // search box and chip, instead of this wrapper resetting them to "" / "All".
  exercisesViewRender({ state: getState(), t, filterQuery, categoryFilter });
}
function renderGlobalHistory() {
  historyViewRender({ state: getState(), t, openSessionFromHistory });
}

/**
 * Repaint every view that reads the database, after the whole database was replaced under them
 * (TODO §40.3a).
 *
 * Four things replace it wholesale — a backup restore, a Drive merge, clearing the demo, and now a
 * workspace switch — and until this existed each of them re-rendered its own subset. Two got it
 * wrong in the cheapest possible way: they reloaded the page. One function, one call, so the next
 * caller cannot repaint three views out of eight and leave the trainer reading a database that is
 * no longer there.
 */
function renderEverything() {
  applyTranslations(getState().lang);
  renderClientsList();
  renderRoutinesList();
  renderExercisesList();
  renderGlobalHistory();
  renderPendingPlanAdjustments();
  renderSessions();
  renderNotificationArea();
  populateDropdownSelectors();
  renderBuildStateBadge(getState());
  renderWorkspaceChrome();
}

/**
 * Move between the trainer's own work and the sandbox (TODO §40.3), without reloading the page.
 *
 * The route goes home rather than staying put: a path like `/client/<id>` names a record that the
 * workspace being entered does not have, and repainting a detail view for a record that is not
 * there is a worse answer than the dashboard.
 */
async function switchToWorkspace(name) {
  await switchWorkspace(name);
  renderEverything();
  // The clocks do not stop: what was ticking underneath becomes the visible stack and the other way
  // round (TODO §40.11). Deliberately not a teardown — a rest period must survive the switch.
  appBoot.rebindTimers();
  navigateToPath("/");
  if (isSandbox()) await offerFreshSandboxIfStale();
}

// Asked on ENTRY, never at boot: at boot it is a question about a workspace the trainer is not in
// (TODO §40.4). Declining starts the cooldown, which is what keeps the answer answered.
async function offerFreshSandboxIfStale() {
  const { ask } = sandboxStaleness(await readSandboxMeta());
  if (!ask) return;
  openStaleSandboxDialog({
    t,
    onConfirm: async () => {
      await resetSandbox();
      renderEverything();
    },
    onDecline: () => recordSandboxOfferDeclined(),
  });
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
      renderEverything();
    },
    isDriveConfigured: () => driveSyncStatus().configured,
    t,
  });
}

function setupClientForms() {
  appBoot.bootClientForms({
    getState,
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
    getState,
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
    getState,
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
      getState,
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

function setupActiveSession({ linkBringsContent } = {}) {
  appBoot.bootActiveSession({
    getState,
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
  return (
    appBoot
      .bootSplashScreen({
        offerOnboarding: !stateHasData(getState()),
        // `?lang=` still ANSWERS this, deliberately (TODO §28.11). The first attempt made a URL
        // parameter a mere preselection that the step would ask about anyway — which is a defensible
        // rule and breaks a shipped promise: a share link naming a language must open in it, pinned by
        // tests/e2e/test_share_deeplink.py. `?splash=off` is different, and that is the half kept: it
        // says nothing about language or onboarding, so on a first run it is a leftover rather than an
        // answer.
        needsLanguageChoice: !hasChosenLanguage(getState().lang),
        // Whether this arrival was FURNISHED by its link — the demo seed, the walkthrough, an
        // invitation being answered. Those get exactly the boot they asked for; a bare `?splash=off`
        // left in the address bar after a trainer cleared their browser does not (TODO §28.11).
        linkBringsContent,
        onChooseLanguage: (lang) => {
          applyTranslations(lang);
          saveState();
        },
      })
      // Only once the splash is actually gone: a submission shared into the app opens a modal, and a
      // modal makes the page under it inert — splash included (§38.22).
      .then(() => appBoot.bootSharedSubmissions())
  );
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
    getState,
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

/** Opens an imported programme in the plan editor (TODO §29).
 *
 * As a PLANNING session when no session was named: a programme written at a desk has no slot yet,
 * and planning mode is exactly the mode this app already has for a plan with no clock — no
 * countdown, no Start, no completion stamp. Naming a session instead attaches it to that evening.
 *
 * Nothing is persisted here. The editor's own save is the write, which is why an import that guessed
 * a field wrong is a field the trainer retypes rather than a record anybody has to repair.
 */
function openImportedProgramme({ title, items, clientId, sessionId }) {
  const state = getState();
  const client =
    state.clients.find((row) => row.id === clientId) || state.clients.find((row) => row.active);
  const routineId = state.routines[0]?.id || "";
  const sessionName = title || t("program_import_title");

  startWorkoutSession(
    [{ clientId: client?.id, routineId }],
    {
      id: sessionId || newRecordId(),
      isPlanning: !sessionId,
      titles: [sessionName],
      date: getISODateString(Date.now()),
      timeLabel: "",
      location: "",
    },
    { plan: items },
  );
  enterClipboardEditModeController();
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
    // What an evening from a repeating series is given when the trainer first acts on it and it
    // stops being a rule (TODO §35.3a).
    newRecordId,
  });
}

window.addEventListener("DOMContentLoaded", init);
