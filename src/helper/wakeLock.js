// src/helper/wakeLock.js - Screen Wake Lock API helper
// Single responsibility: Manage navigator.wakeLock to keep screen active during workouts.

let screenWakeLock = null;
let wakeLockVisibilityAttached = false;

export async function requestScreenWakeLock(getActiveSession) {
  if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
    try {
      if (!screenWakeLock) {
        screenWakeLock = await navigator.wakeLock.request("screen");
        screenWakeLock.addEventListener("release", () => {
          screenWakeLock = null;
        });
      }
      if (!wakeLockVisibilityAttached && typeof document !== "undefined") {
        wakeLockVisibilityAttached = true;
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && getActiveSession() !== null) {
            requestScreenWakeLock(getActiveSession);
          }
        });
      }
    } catch (err) {
      console.debug("WakeLock request failed or disallowed:", err);
    }
  }
}

export async function releaseScreenWakeLock() {
  if (screenWakeLock !== null && typeof screenWakeLock.release === "function") {
    try {
      await screenWakeLock.release();
      screenWakeLock = null;
    } catch (err) {
      console.debug("WakeLock release failed:", err);
    }
  }
}
