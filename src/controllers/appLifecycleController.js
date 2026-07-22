// src/controllers/appLifecycleController.js - Application Lifecycle & Browser Runtime Integration
// Single responsibility: Handles PWA screen orientation lock, dev phone viewport resizing,
// build stamp header rendering, Service Worker registration, and network connectivity state monitoring.

import { BUILD_INFO } from "../version.js";

export function resizeToPhoneViewport() {
  const targetWidth = 412;
  const targetHeight = 915;
  try {
    window.resizeTo(targetWidth, targetHeight);
  } catch (e) {
    // Disallowed by browser on ordinary tabs — silently ignored
  }
}

export function renderBuildStamp() {
  const el = document.getElementById("app-version");
  if (!el) return;
  const commit = BUILD_INFO?.commit || "dev";
  el.textContent = commit === "dev" ? "dev" : `#${commit}`;
  if (BUILD_INFO?.builtAt) el.title = `Built ${BUILD_INFO.builtAt}`;
}

export function lockPortraitOrientation() {
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

export function registerServiceWorker(basePath, setOfflineCachedState) {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (
      event.data &&
      event.data.type === "OFFLINE_CACHE_USED" &&
      typeof setOfflineCachedState === "function"
    ) {
      setOfflineCachedState(true);
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${basePath}sw.js`)
      .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
      .catch((err) => console.error("PWA Service Worker registration failed:", err));
  });
}

export function setupOnlineOfflineListeners(basePath, setOfflineCachedState) {
  if (typeof window === "undefined" || typeof setOfflineCachedState !== "function") return;

  window.addEventListener("offline", () => setOfflineCachedState(true));
  window.addEventListener("online", () => {
    if (navigator.onLine) {
      fetch(`${basePath}version.js?check=${Date.now()}`, { cache: "no-store" })
        .then((res) => {
          if (res.ok) setOfflineCachedState(false);
        })
        .catch(() => {});
    }
  });
}

export function initAppLifecycle({ basePath, setOfflineCachedState }) {
  resizeToPhoneViewport();
  lockPortraitOrientation();
  renderBuildStamp();
  registerServiceWorker(basePath, setOfflineCachedState);
  setupOnlineOfflineListeners(basePath, setOfflineCachedState);
}
