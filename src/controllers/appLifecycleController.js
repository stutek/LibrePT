// src/controllers/appLifecycleController.js - Application Lifecycle & Browser Runtime Integration
// Single responsibility: Handles PWA screen orientation lock, dev phone viewport resizing,
// build stamp header rendering, Service Worker registration, and network connectivity state monitoring.

import {
  driveSyncStatus,
  refreshSyncCounts,
  startPeriodicSync as startPeriodicDriveSync,
} from "../data/driveSyncService.js";
import { CURRENT_SCHEMA_VERSION } from "../data/migrationSteps.js";
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

// The stamp shows the COMMIT, not a release tag — there are no release tags any more (TODO §16/§18:
// one build carries every supported schema concurrently). The commit is the better identifier for
// support regardless: it is exact and exists for EVERY build. The full detail (commit, data schema,
// build time) is one tap away in the build-info dialog (the `title` is a desktop nicety only; a
// phone cannot reach it).
export function renderBuildStamp() {
  const el = document.getElementById("app-version");
  if (!el) return;
  const commit = typeof BUILD_INFO?.commit === "string" ? BUILD_INFO.commit.trim() : "";
  el.textContent = commit && commit !== "dev" ? `#${commit}` : "dev";
  const parts = [];
  if (commit && commit !== "dev") parts.push(`Commit ${commit}`);
  parts.push(`Schema ${CURRENT_SCHEMA_VERSION}`);
  if (BUILD_INFO?.builtAt) parts.push(`Built ${BUILD_INFO.builtAt}`);
  el.title = parts.join(" · ");
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

// Poll-on-resume (TODO §1.5/§3.10): Drive sync has no push channel (`changes.watch` needs a webhook
// endpoint this app deliberately doesn't run), so the next best trigger is "the trainer came back to
// the tab" — a real device switch is exactly when a phone's tab was backgrounded and is now visible
// again. Only refreshes the ahead/behind counters (syncing itself is manual-only, see
// driveSyncService.js's module doc) — a no-op call when nothing changed is cheap either way, and
// `refreshSyncCounts()` itself no-ops when not connected.
export function setupDriveSyncOnResume() {
  if (typeof document === "undefined") return;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (!driveSyncStatus().connected) return;
    refreshSyncCounts();
  });
}

export function initAppLifecycle({ basePath, setOfflineCachedState, t }) {
  resizeToPhoneViewport();
  lockPortraitOrientation();
  renderBuildStamp();
  registerServiceWorker(basePath, setOfflineCachedState, t);
  setupOnlineOfflineListeners(basePath, setOfflineCachedState);
  setupDriveSyncOnResume();
  // Runs unconditionally from boot regardless of connection state (periodicTick() no-ops until
  // connected) — the alternative, starting it only after a successful connect, would also need to
  // restart on every future boot with a stored grant, which this already does for free.
  startPeriodicDriveSync();
}
