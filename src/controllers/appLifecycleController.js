// src/controllers/appLifecycleController.js - Application Lifecycle & Browser Runtime Integration
// Single responsibility: Handles PWA screen orientation lock, dev phone viewport resizing,
// build stamp header rendering, Service Worker registration, and network connectivity state monitoring.

import { buildDescription } from "../modules/common/releaseIdentity.js";
import { BUILD_INFO } from "../version.js";

export function resizeToPhoneViewport() {
  const targetWidth = 412;
  const targetHeight = 915;
  try {
    window.resizeTo(targetWidth, targetHeight);
  } catch (err) {
    console.debug("window.resizeTo ignored by browser:", err);
  }
}

// The stamp shows the COMMIT, not the release. For support it is the better identifier: it is
// exact, and it exists for EVERY build — most deploys sit between tags, and those are precisely the
// ones a confusing bug report comes from. The release, data schema and build time are one tap away
// in the build-info dialog (the `title` is a desktop nicety only; a phone cannot reach it).
export function renderBuildStamp() {
  const el = document.getElementById("app-version");
  if (!el) return;
  const commit = typeof BUILD_INFO?.commit === "string" ? BUILD_INFO.commit.trim() : "";
  el.textContent = commit && commit !== "dev" ? `#${commit}` : "dev";
  const description = buildDescription();
  if (description) el.title = description;
}

export function lockPortraitOrientation() {
  const orientation = typeof screen !== "undefined" && screen.orientation;
  if (!orientation || typeof orientation.lock !== "function") return;
  const apply = () => {
    try {
      const p = orientation.lock("portrait");
      if (p?.catch) p.catch((err) => console.debug("Screen orientation lock rejected:", err));
    } catch (err) {
      console.debug("Screen orientation lock unsupported or rejected:", err);
    }
  };
  apply();
  orientation.addEventListener("change", apply);
}

// Discard the failed/stale worker and every cache, then reload from a clean slate so the next install
// re-downloads and re-verifies from scratch. A plain reload was not enough: the old worker keeps
// controlling and the HTTP cache keeps serving the same stale bytes, so the mismatch just recurs.
async function clearCachesAndReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in self) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.warn("Integrity retry cleanup failed:", err);
  }
  window.location.reload();
}

// Reveal the blocking integrity error page when the service worker reports a failed/absent verification
// (INTEGRITY_ERROR). Never silently swallowed — a build that can't be verified must be impossible to
// miss (dev and prod alike). `reason` picks the explanation; `detail` (the offending asset) is shown
// verbatim for a bug report.
function showIntegrityError(reason, detail, t) {
  const overlay = document.getElementById("integrity-error-overlay");
  if (!overlay) return;
  const tr = (key, fallback) => (typeof t === "function" && t(key)) || fallback;

  const titleEl = document.getElementById("integrity-error-title");
  const messageEl = document.getElementById("integrity-error-message");
  const detailEl = document.getElementById("integrity-error-detail");
  const retryBtn = document.getElementById("btn-integrity-retry");

  if (titleEl) titleEl.textContent = tr("integrity_error_title", "App verification failed");
  if (messageEl) {
    messageEl.textContent =
      reason === "missing-catalog"
        ? tr("integrity_error_missing", "No integrity catalog was found for this build.")
        : tr("integrity_error_mismatch", "A file failed its integrity check.");
  }
  if (detailEl) detailEl.textContent = detail || "";
  if (retryBtn) {
    retryBtn.textContent = tr("integrity_error_retry", "Clear cache & retry");
    retryBtn.onclick = () => {
      retryBtn.disabled = true;
      clearCachesAndReload();
    };
  }
  overlay.classList.remove("hidden");
}

export function registerServiceWorker(basePath, setOfflineCachedState, t) {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;
    if (data.type === "OFFLINE_CACHE_USED" && typeof setOfflineCachedState === "function") {
      setOfflineCachedState(true);
    } else if (data.type === "INTEGRITY_ERROR") {
      showIntegrityError(data.reason, data.detail, t);
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      // updateViaCache:'none' so the worker script AND its importScripts modules are always revalidated
      // on an update check — otherwise a changed sw/*.js could be served stale from the HTTP cache.
      .register(`${basePath}sw.js`, { updateViaCache: "none" })
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
        .catch((err) => console.warn("Failed to reach server during online check:", err));
    }
  });
}

export function initAppLifecycle({ basePath, setOfflineCachedState, t }) {
  resizeToPhoneViewport();
  lockPortraitOrientation();
  renderBuildStamp();
  registerServiceWorker(basePath, setOfflineCachedState, t);
  setupOnlineOfflineListeners(basePath, setOfflineCachedState);
}
