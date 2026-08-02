// src/data/driveSyncConfig.js — the one piece of Google Drive sync setup that is a deployment
// constant, not runtime state (TODO §1.5/§3.3).
//
// **`CLIENT_ID` must be filled in by whoever deploys this build.** Google Calendar/Drive API access
// requires a GCP project registered once by the developer (TODO §1.5's "GCP note") — this is a public
// OAuth client id for a browser app, not a secret (Google's own installed/SPA OAuth flows are
// designed to ship it in client code; the security boundary is the redirect-URI allowlist configured
// server-side in the GCP console, not secrecy of this string). Leaving it blank is a valid, supported
// state: the feature detects it and reports "not configured" instead of guessing or erroring.
//
// To obtain one: console.cloud.google.com → new/existing project → "APIs & Services" → "Credentials"
// → "Create OAuth client ID" → Application type "Web application" → add this deployment's origin
// (e.g. https://stutek.github.io) under "Authorized JavaScript origins". No client secret is needed —
// this is the browser-side implicit token flow (Google Identity Services), not a server flow.
//
// Injected dependencies: none — a static constant module.

export const GOOGLE_DRIVE_CLIENT_ID = "";

// drive.appdata: access limited to this app's own hidden per-app folder — invisible in the trainer's
// normal Drive UI/picker, inaccessible to any other app's OAuth grant (TODO §1.5's PII-isolation
// point). Never widen this to `drive.file` or `drive`; that would ask for far more than sync needs.
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

export function isDriveSyncConfigured() {
  return typeof GOOGLE_DRIVE_CLIENT_ID === "string" && GOOGLE_DRIVE_CLIENT_ID.length > 0;
}
