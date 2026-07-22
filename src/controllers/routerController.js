// src/controllers/routerController.js - SPA route mapping and navigation logic
// Single responsibility: Parse window.location paths, resolve deep links, manage view transitions, and route events.

const BASE_PATH = new URL(".", import.meta.url).pathname.replace(/\/controllers\/$/, "/");

let routerDeps = null;

export function initRouter(deps) {
  routerDeps = deps;
}

export function getBasePath() {
  return BASE_PATH;
}

export function toRoute(pathname) {
  const baseNoSlash = BASE_PATH.endsWith("/") ? BASE_PATH.slice(0, -1) : BASE_PATH;
  if (pathname === baseNoSlash || pathname === `${baseNoSlash}/`) return "/";
  if (pathname.startsWith(`${baseNoSlash}/`)) {
    return pathname.slice(baseNoSlash.length);
  }
  return pathname;
}

export function toUrl(route) {
  const baseNoSlash = BASE_PATH.endsWith("/") ? BASE_PATH.slice(0, -1) : BASE_PATH;
  const rel = route.startsWith("/") ? route : `/${route}`;
  return baseNoSlash + rel;
}

export function switchView(viewId, { focusSessionsColumn } = {}) {
  for (const view of document.querySelectorAll(".app-view")) {
    view.classList.remove("active");
  }

  for (const item of document.querySelectorAll(".header-nav .nav-item, .bottom-nav .nav-item")) {
    item.classList.remove("active");
  }

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add("active");
  }

  const mainTab = viewId.split("-")[0];
  const tabItem = document.querySelector(
    `.header-nav .nav-item[data-view^="${mainTab}"], .bottom-nav .nav-item[data-view^="${mainTab}"]`,
  );
  if (tabItem) {
    tabItem.classList.add("active");
  }

  const mainContent = document.getElementById("main-content");
  if (mainContent) mainContent.scrollTop = 0;

  const fnColumn = focusSessionsColumn || routerDeps?.focusSessionsColumn;
  if (viewId === "clients" && fnColumn) {
    requestAnimationFrame(() => fnColumn("today", "smooth"));
  }
}

export function showErrorView(attemptedPath, { setHeaderState } = {}) {
  const fnSetHeader = setHeaderState || routerDeps?.setHeaderState;
  if (fnSetHeader) fnSetHeader(false);

  const overlay = document.getElementById("active-session-overlay");
  if (overlay) overlay.classList.add("hidden");
  const pathEl = document.getElementById("error-view-path");
  if (pathEl) pathEl.textContent = attemptedPath;
  switchView("error");
}

export function focusActiveSessionCard() {
  requestAnimationFrame(() => {
    const card = document.querySelector("#today-sessions-list .booking-card.booking-live");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  });
}

export function setHeaderState(showActions = true) {
  const normalActions = document.querySelector(".normal-header-actions");
  if (normalActions) {
    if (showActions) {
      normalActions.classList.remove("hidden");
    } else {
      normalActions.classList.remove("hidden");
    }
  }
}

export function navigateToPath(targetPath) {
  const url = toUrl(targetPath);
  if (window.location.pathname === url) {
    handlePathChange();
  } else {
    window.history.pushState(null, "", url);
    handlePathChange();
  }
}

export function setupNavigation({ setupSessionsDayNav } = {}) {
  const navItems = document.querySelectorAll(".header-nav .nav-item, .bottom-nav .nav-item");
  for (const item of navItems) {
    item.addEventListener("click", () => {
      const viewTarget = item.getAttribute("data-view");
      navigateToPath(`/${viewTarget}`);
    });
  }

  const logoArea = document.getElementById("logo-area");
  if (logoArea) {
    logoArea.addEventListener("click", () => {
      navigateToPath("/");
    });
  }

  const errorHomeBtn = document.getElementById("btn-error-home");
  if (errorHomeBtn) {
    errorHomeBtn.addEventListener("click", () => {
      navigateToPath("/");
    });
  }

  const backToClientsBtn = document.getElementById("btn-back-to-clients");
  if (backToClientsBtn) {
    backToClientsBtn.addEventListener("click", () => {
      navigateToPath("/");
    });
  }

  const createSessionBtn = document.getElementById("btn-create-session");
  if (createSessionBtn) {
    createSessionBtn.addEventListener("click", () => {
      window.history.pushState(null, "", toUrl("/session/new"));
      if (routerDeps?.openWorkoutSetupModal) {
        routerDeps.openWorkoutSetupModal();
      }
    });
  }

  if (typeof setupSessionsDayNav === "function") {
    setupSessionsDayNav();
  }
}

export function showSessionView(sessionId, clientId, focusRef = null, opts = {}) {
  const activeSession = routerDeps?.getActiveSession ? routerDeps.getActiveSession() : null;

  if (!activeSession) {
    const cached = localStorage.getItem("librept_active_session");
    if (cached && routerDeps?.recoverActiveSession) {
      routerDeps.recoverActiveSession();
    }
  }

  const currentActive = routerDeps?.getActiveSession ? routerDeps.getActiveSession() : null;

  if (currentActive && currentActive.id === sessionId) {
    const bar = document.getElementById("active-session-bar");
    if (bar) {
      bar.classList.remove("hidden", "is-idle");
      delete bar.dataset.nextBookingId;
    }
    if (routerDeps?.renderActiveSessionBarLabels) routerDeps.renderActiveSessionBarLabels();

    if (!currentActive.timerIntervalId && routerDeps?.startSessionTimer) {
      routerDeps.startSessionTimer();
    }

    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.remove("hidden");
    if (routerDeps?.renderSessionTitle) routerDeps.renderSessionTitle();

    if (clientId && currentActive.participants.includes(clientId)) {
      currentActive.activeClientId = clientId;
    }
    if (focusRef && routerDeps?.focusIndexFromRef) {
      const cs = currentActive.clientRoutines[currentActive.activeClientId];
      const idx = routerDeps.focusIndexFromRef(cs, focusRef);
      if (idx >= 0) cs.activeExerciseIndex = idx;
    }
    if (opts.edit && routerDeps?.setClipboardEditMode) {
      routerDeps.setClipboardEditMode(true);
    }
    if (routerDeps?.renderActiveGroupBoard) routerDeps.renderActiveGroupBoard();
    if (routerDeps?.syncSessionFocusUrl) routerDeps.syncSessionFocusUrl();
    return;
  }

  const state = routerDeps?.getState ? routerDeps.getState() : null;
  const booking = state?.bookings?.find((b) => b.id === sessionId);
  if (booking && routerDeps?.launchClipboardDirectly) {
    routerDeps.launchClipboardDirectly({ bookingId: sessionId });
    if (routerDeps.getActiveSession() && (clientId || focusRef || opts.edit)) {
      showSessionView(sessionId, clientId, focusRef, opts);
    }
    return;
  }

  const log = state?.history?.find((h) => h.id === sessionId);
  if (log && routerDeps?.openSessionFromHistory) {
    routerDeps.openSessionFromHistory(log);
    if (routerDeps.getActiveSession() && (clientId || focusRef || opts.edit)) {
      showSessionView(sessionId, clientId, focusRef, opts);
    }
    return;
  }

  const overlay = document.getElementById("active-session-overlay");
  if (overlay) overlay.classList.add("hidden");
  showErrorView(window.location.pathname);
}

export function handlePathChange() {
  const path = toRoute(window.location.pathname);

  const sessionFocusMatch = path.match(
    /^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)\/(exercise|superset)\/([A-Za-z0-9_-]+)$/,
  );
  const sessionEditMatch = path.match(
    /^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)\/edit$/,
  );
  const sessionClientMatch = path.match(/^\/session\/([A-Za-z0-9_-]+)\/client\/([A-Za-z0-9_-]+)$/);
  const sessionMatch = path.match(/^\/session\/([A-Za-z0-9_-]+)$/);
  const clientDetailMatch = path.match(/^\/clients\/([A-Za-z0-9_-]+)$/);
  const sessionsDateMatch = path.match(/^\/sessions\/([0-9]{4}-[0-9]{2}-[0-9]{2})$/);

  if (path === "/session/new" || path === "/sessions/new") {
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("workout-setup");
    if (routerDeps?.openWorkoutSetupModal) {
      routerDeps.openWorkoutSetupModal(null, null, null, false);
    }
  } else if (path.startsWith("/session/setup/")) {
    const bookingId = path.split("/session/setup/")[1];
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("workout-setup");
    if (routerDeps?.openWorkoutSetupModal) {
      routerDeps.openWorkoutSetupModal(null, null, bookingId, false);
    }
  } else if (sessionEditMatch) {
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
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    if (routerDeps?.clientsViewShowDetails) {
      routerDeps.clientsViewShowDetails({
        clientId,
        state: routerDeps.getState(),
        t: routerDeps.t,
        showErrorView,
        switchView,
        openWorkoutSetupModal: routerDeps.openWorkoutSetupModal,
      });
    }
  } else if (sessionsDateMatch) {
    const isoDate = sessionsDateMatch[1];
    const column = routerDeps?.getColumnForISODate ? routerDeps.getColumnForISODate(isoDate) : "today";
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("clients");
    requestAnimationFrame(() => routerDeps?.focusSessionsColumn ? routerDeps.focusSessionsColumn(column, "auto") : null);
    focusActiveSessionCard();
  } else if (path === "/" || path === "/index.html") {
    const todayDate = routerDeps?.getISODateForColumn ? routerDeps.getISODateForColumn("today") : "";
    setHeaderState(false);
    window.history.replaceState(null, "", toUrl(`/sessions/${todayDate}`) + window.location.search);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("clients");
    requestAnimationFrame(() => routerDeps?.focusSessionsColumn ? routerDeps.focusSessionsColumn("today", "auto") : null);
    focusActiveSessionCard();
  } else if (path === "/clients") {
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("client-directory");
    if (routerDeps?.renderClientsList) routerDeps.renderClientsList();
  } else if (path === "/adjustments") {
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("adjustments");
  } else if (path === "/routines") {
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("routines");
  } else if (path === "/exercises") {
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("exercises");
  } else if (path === "/history") {
    setHeaderState(false);
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
    switchView("history");
  } else {
    showErrorView(window.location.pathname);
  }
}
