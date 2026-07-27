// src/controllers/routerController.js - SPA route mapping and navigation logic
// Single responsibility: Parse window.location paths, resolve deep links, manage view transitions, and route events.
//
// The route TABLE lives in routes/routeTable.js and each route's behaviour in its own class, so this
// file holds only the parts that must know about the browser: the base path, history writes, and the
// facade of operations a route is allowed to perform.

import { SHARE_INIT_PARAM } from "../modules/common/shareLink.js";
import { DialogRoute } from "./routes/dialogRoute.js";
import { buildRouteTable } from "./routes/routeTable.js";

const BASE_PATH = new URL(".", import.meta.url).pathname.replace(/\/controllers\/$/, "/");

let routerDeps = null;
let routes = null;
// The route currently on screen, with the ctx it was entered with: exit() must be able to undo what
// that entry did, which needs its own params, not the incoming ones.
let activeEntry = null;

export function initRouter(deps) {
  routerDeps = deps;
  routes = buildRouteTable();
}

// The operations a route may perform. Everything DOM- or history-shaped is here, so a route stays a
// plain object that can be matched and entered in a test with a stub in this slot.
const routerOps = {
  setHeaderState: (showActions) => setHeaderState(showActions),
  switchView: (viewId, options) => switchView(viewId, options),
  showErrorView: (attemptedPath) => showErrorView(attemptedPath),
  showSessionView: (sessionId, clientId, focusRef, opts) =>
    showSessionView(sessionId, clientId, focusRef, opts),
  focusActiveSessionCard: () => focusActiveSessionCard(),
  hideSessionOverlay: () => {
    const overlay = document.getElementById("active-session-overlay");
    if (overlay) overlay.classList.add("hidden");
  },
  replaceUrl: (route) => replaceRoute(route),
};

// A promo param that is consumed once at boot and must NOT be carried onward: it seeds demo data, so
// a sticky `?init=` would turn any URL the trainer copies out of the address bar into a link that
// seeds someone else's empty app.
const BOOT_ONLY_PARAMS = [SHARE_INIT_PARAM];

// What a navigation carries over from the current URL: the presentational share params (`?lang`,
// `?theme`) survive, because a promo link must still look like itself after the first tap. Before
// this, only the `/` redirect happened to re-append the query string, so those two died on any
// other navigation.
function carriedSearch() {
  const params = new URLSearchParams(window.location.search);
  for (const name of BOOT_ONLY_PARAMS) params.delete(name);
  const query = params.toString();
  return query ? `?${query}` : "";
}

// The two history writers. Every URL change in the app goes through one of them, so the rules about
// what a URL carries live in one place instead of being re-decided at each call site. A write that
// would not change the URL is skipped, so history never grows a duplicate entry.
//
// push() when the user moved somewhere they should be able to come Back from; replace() when the URL
// is catching up with a state they are already looking at.
function writeHistory(route, { replace }) {
  const url = toUrl(route) + carriedSearch();
  if (url === window.location.pathname + window.location.search) return false;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  return true;
}

// A dialog opened from inside the app sits on top of the entry the trainer came from, so Back closes
// it. Arriving straight at a dialog URL — a shared link, or a reload while one is open — has nothing
// underneath, and Back would leave the app entirely. Rewrite that first entry as the view beneath and
// push the dialog on top of it, so Back behaves the same either way.
function ensureBackTargetForDialog(ctx) {
  if (!ctx.isBootPass || !(ctx.route instanceof DialogRoute)) return;
  const here = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", toUrl(ctx.route.parentUrl(ctx)) + carriedSearch());
  window.history.pushState(null, "", here);
}

// Whatever closes a routed dialog — the ✕, Cancel, Escape, a save handler — has to pop the entry that
// opened it, or the address bar would keep naming a dialog that is no longer on screen. `close` does
// not bubble, but it does reach a capturing listener, so this one hook covers every existing close
// call site without touching any of them.
function setupRoutedDialogClose() {
  document.addEventListener(
    "close",
    (event) => {
      const el = event.target;
      if (!(el instanceof HTMLDialogElement)) return;
      if (el.dataset.routeClosing) return; // the router closed it as part of routing away
      if (!el.dataset.routeName || el.dataset.routeName !== activeRouteName()) return;
      delete el.dataset.routeName;
      window.history.back();
    },
    true,
  );
}

export function pushRoute(route) {
  return writeHistory(route, { replace: false });
}

export function replaceRoute(route) {
  return writeHistory(route, { replace: true });
}

// The route on screen right now, by name — for callers that must behave differently depending on
// where the user is without re-parsing the path themselves.
export function activeRouteName() {
  return activeEntry?.route.name ?? null;
}

// True while a dialog route is what the URL names. Callers that mutate state from inside a dialog use
// it to defer their re-render: painting the view behind an open dialog wastes the render on a surface
// nobody can see, and a one-shot call-out spent there is gone by the time the dialog closes.
export function activeRouteIsDialog() {
  return activeEntry?.route instanceof DialogRoute;
}

// Spell the URL for a named route. The only sanctioned way to build one: a hand-written path string
// is what survives a pattern change and turns into a dead link.
export function urlFor(name, params) {
  return routes.urlFor(name, params);
}

// What a pathname names, WITHOUT entering it: `{ name, params }` or null. For the one caller that
// must read the address bar before the first route is entered — active-session recovery runs at boot,
// ahead of routing, and both restores edit mode from the URL and must not overwrite the URL's own row
// id when it renders.
export function resolveRoute(pathname) {
  const hit = routes.resolve(toRoute(pathname));
  return hit ? { name: hit.route.name, params: hit.params, isEditor: hit.route.isEditor } : null;
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

export function renderErrorViewShell() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent || document.getElementById("view-error")) return;
  mainContent.insertAdjacentHTML(
    "beforeend",
    `
<section id="view-error" class="app-view">
      <div class="error-view">
        <i class="fa-solid fa-compass error-view-icon"></i>
        <h2 id="error-view-title">Page not found</h2>
        <p class="view-desc">This link doesn't point to a session, client or view in LibrePT.</p>
        <p class="error-view-path"><code id="error-view-path"></code></p>
        <button id="btn-error-home" class="btn primary-btn btn-sm">
          <i class="fa-solid fa-house"></i> Back to dashboard
        </button>
      </div>
    </section>
`,
  );
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
    const card = document.querySelector("#sessions-categories-grid .session-card.session-live");
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
  pushRoute(targetPath);
  handlePathChange();
}

export function setupNavigation({ setupSessionsDayNav } = {}) {
  setupRoutedDialogClose();

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
      pushRoute(urlFor("session.new"));
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
      delete bar.dataset.nextSessionId;
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
      routerDeps.setClipboardEditMode(true, opts.slotId ?? null);
    }
    if (routerDeps?.renderActiveGroupBoard) routerDeps.renderActiveGroupBoard();
    if (routerDeps?.syncSessionFocusUrl) routerDeps.syncSessionFocusUrl();
    return;
  }

  const state = routerDeps?.getState ? routerDeps.getState() : null;
  const sessions = state?.sessions;
  const session = sessions?.find((s) => s.id === sessionId);
  if (session && routerDeps?.launchClipboardDirectly) {
    routerDeps.launchClipboardDirectly({ sessionId });
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

let hasResolvedOnce = false;

// Resolve the address bar to exactly one route and enter it. The route table decides WHICH state a
// path names (routes/routeTable.js) and each route class decides what entering it does — so this
// function never grows a branch when a new addressable state is added.
export function handlePathChange() {
  const path = toRoute(window.location.pathname);
  const hit = routes.resolve(path);

  if (!hit) {
    // An unknown route renders the in-app not-found view rather than redirecting, so the address bar
    // keeps the path that failed: a link minted by a newer release must say so, not silently land the
    // trainer somewhere else. The view offers the way home (#btn-error-home).
    if (activeEntry) activeEntry.route.exit(activeEntry.ctx);
    activeEntry = null;
    showErrorView(window.location.pathname);
    return;
  }

  const ctx = {
    path,
    params: hit.params,
    route: hit.route,
    previousRoute: activeEntry?.route ?? null,
    isBootPass: !hasResolvedOnce,
    deps: routerDeps,
    router: routerOps,
  };
  hasResolvedOnce = true;
  ensureBackTargetForDialog(ctx);

  if (activeEntry && activeEntry.route !== hit.route) activeEntry.route.exit(activeEntry.ctx);
  // Active from the moment entry BEGINS, not once it returns: entering renders, a render can ask
  // where it is (the session's focus sync, the day deck), and an answer of "still the previous
  // route" makes those callers act on a screen that is already gone.
  activeEntry = { route: hit.route, ctx };
  // enter() returns the route the user ends up on, which is not always the one that matched: a
  // redirect renders its target, and that target is what a later exit() has to undo.
  const entered = hit.route.enter(ctx) || hit.route;
  if (entered !== hit.route) activeEntry = { route: entered, ctx };
}
