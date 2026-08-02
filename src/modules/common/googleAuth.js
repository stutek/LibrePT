// src/modules/common/googleAuth.js — Google Identity Services (GIS) token client wrapper for the
// Drive appDataFolder sync feature (TODO §1.5/§3.3).
// Single responsibility: get and hold a short-lived OAuth access token for `GOOGLE_DRIVE_SCOPE`,
// nothing else. It knows nothing about Drive's REST API or sync/merge — see driveAppData.js and
// driveSyncService.js for those.
//
// **Lazy by construction.** The GIS script (https://accounts.google.com/gsi/client) is only ever
// injected the first time `requestAccessToken()` is called — never on boot — so the app's normal
// offline-first path (and every existing e2e test that never touches cloud sync) makes zero calls to
// Google. This is also why it needs a `script-src`/`connect-src` CSP allowance for accounts.google.com
// rather than a wider one: nothing loads until a trainer explicitly taps "Connect Google Drive".
//
// The access token itself is held in memory only, never persisted — it is short-lived (~1h) and
// trivially re-requested; persisting it would be a needless secret sitting in localStorage. Only the
// boolean "has this device ever completed a consent grant" is persisted, so the UI can show a
// "Connected" state across reloads without re-prompting until a token is actually needed.
//
// Injected dependencies: none — reads `document`/`window` from the platform, `GOOGLE_DRIVE_CLIENT_ID`
// / `GOOGLE_DRIVE_SCOPE` from driveSyncConfig.js.

import {
  GOOGLE_DRIVE_CLIENT_ID,
  GOOGLE_DRIVE_SCOPE,
  isDriveSyncConfigured,
} from "../../data/driveSyncConfig.js";

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const CONNECTED_KEY = "librept_drive_connected";

let gisLoadPromise = null;
let tokenClient = null;
let accessToken = null;
let tokenExpiresAt = 0;

function loadGisScript() {
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script."));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

function getTokenClient() {
  if (tokenClient) return tokenClient;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_DRIVE_CLIENT_ID,
    scope: GOOGLE_DRIVE_SCOPE,
    // callback is overridden per-call in requestAccessToken() — initTokenClient requires one, but
    // every real request supplies its own so the promise it returns settles with THAT call's token.
    callback: () => {},
  });
  return tokenClient;
}

/** Fire-and-forget script preload for when the sync UI is about to be shown, so the click that
 * actually requests consent doesn't have to await the script load first (see the note on
 * `requestAccessToken` in driveSyncUi.js about why that gap matters for the consent popup). A no-op
 * when sync isn't configured. */
export function preloadGoogleIdentityServices() {
  if (!isDriveSyncConfigured()) return;
  loadGisScript().catch((err) => console.debug("Google Identity Services preload failed:", err));
}

export function hasStoredConsent() {
  return localStorage.getItem(CONNECTED_KEY) === "1";
}

/**
 * Get a valid access token, prompting the trainer for consent if `interactive` is true and none is
 * cached. Must be called from a user-gesture handler when `interactive` is true — browsers block a
 * consent popup opened outside one. Returns null (never throws) when sync isn't configured for this
 * deployment, or a silent (non-interactive) attempt found no usable session.
 */
export async function requestAccessToken({ interactive = false } = {}) {
  if (!isDriveSyncConfigured()) return null;
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  await loadGisScript();
  const client = getTokenClient();

  return new Promise((resolve) => {
    client.callback = (response) => {
      if (response?.error || !response?.access_token) {
        resolve(null);
        return;
      }
      accessToken = response.access_token;
      // expires_in is seconds; 30s safety margin so a call in flight doesn't straddle expiry.
      tokenExpiresAt = Date.now() + (Number(response.expires_in) || 0) * 1000 - 30_000;
      localStorage.setItem(CONNECTED_KEY, "1");
      resolve(accessToken);
    };
    try {
      client.requestAccessToken({ prompt: interactive ? "consent" : "" });
    } catch {
      resolve(null);
    }
  });
}

/** Revoke the current grant and forget local connection state. Does not throw on network failure —
 * the local "disconnected" state is what the UI needs, revocation on Google's side is best-effort. */
export async function revokeAccess() {
  const token = accessToken;
  accessToken = null;
  tokenExpiresAt = 0;
  localStorage.removeItem(CONNECTED_KEY);
  if (!token || !window.google?.accounts?.oauth2) return;
  try {
    window.google.accounts.oauth2.revoke(token, () => {});
  } catch {
    // Best-effort — the local disconnect already happened above.
  }
}
