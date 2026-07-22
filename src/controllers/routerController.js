// src/controllers/routerController.js - SPA route mapping and navigation logic
// Single responsibility: Parse window.location paths, resolve deep links, and trigger view transitions.

const BASE_PATH = new URL(".", import.meta.url).pathname.replace(/\/controllers\/$/, "/");

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

  if (viewId === "clients" && focusSessionsColumn) {
    requestAnimationFrame(() => focusSessionsColumn("today", "smooth"));
  }
}

export function showErrorView(attemptedPath, { switchView, setHeaderState }) {
  if (setHeaderState) setHeaderState(false);
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
