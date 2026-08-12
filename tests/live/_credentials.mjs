// tests/live/_credentials.mjs — resolves an access token for the live-Google suite, from whichever
// of the two credential sources is present, and returns null (never throws) when neither is.
//
// **Two sources, one seam.** The suite itself never learns where its token came from:
//
//   1. **CI** sets `GOOGLE_LIVE_ACCESS_TOKEN` directly. It is minted by Workload Identity
//      Federation — GitHub's OIDC assertion is exchanged with Google for a short-lived service
//      account token, so nothing long-lived is stored on either side. Nothing to leak, nothing to
//      rotate, nothing to expire, and no `pull_request_target` hazard: a fork cannot obtain an OIDC
//      assertion satisfying the provider's repository condition.
//   2. **Locally** `.private/google-live.json` holds `{client_id, client_secret, refresh_token}` for
//      a consumer account, exchanged for an access token here. `.private/` is gitignored and must
//      stay that way — unlike the OAuth *client id* (which ships in driveSyncConfig.js by design), a
//      client secret and refresh token are real secrets.
//
// **Why CI uses a service account rather than a real Gmail identity** (considered, dropped
// 2026-08-12): the only thing a consumer account exercises that a service account cannot is the
// CONSENT flow — and no CI can drive that at all, since Google fingerprints and blocks automated
// browsers on accounts.google.com. Every endpoint reachable from a token behaves identically for
// either identity. So a vaulted refresh token bought a second OAuth client, a manual consent dance
// and an expiry story in exchange for no extra coverage. The local path keeps the option open for
// anyone who wants to check a real account by hand.
//
// **Absence is a skip, not a failure.** Most runs — every contributor, every gated `build check` —
// have neither source, and must not go red for it. The live suite is a canary for changes on
// GOOGLE's side, not a gate on ours; the hermetic `fetchImpl` tests in tests/unit_js/ are what pin
// our own request shapes, and they run everywhere.
//
// Injected dependencies: none — reads `process.env` and the filesystem.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const LOCAL_CREDENTIALS_PATH = path.join(REPO_ROOT, ".private", "google-live.json");
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

async function exchangeRefreshToken({ client_id, client_secret, refresh_token }) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id,
      client_secret,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (response.ok && payload.access_token) return payload.access_token;

  // `invalid_grant` is the one failure worth naming precisely. While the OAuth app is in Testing
  // mode Google expires refresh tokens after SEVEN DAYS, so this is the expected end state of any
  // local credential left alone for a week — and the resulting Drive/Calendar 401s two calls later
  // look nothing like the actual cause. Say the real thing instead of letting it cascade.
  if (payload.error === "invalid_grant") {
    throw new Error(
      "Google refused the stored refresh token (invalid_grant). While the OAuth app is in " +
        "Testing mode refresh tokens expire after 7 days — re-grant and rewrite " +
        `${path.relative(REPO_ROOT, LOCAL_CREDENTIALS_PATH)}.`,
    );
  }
  throw new Error(
    `Refresh token exchange failed: ${response.status} ${payload.error || ""} ${
      payload.error_description || ""
    }`.trim(),
  );
}

/**
 * An access token for the live suite, or null when this machine has no credentials configured.
 * Throws only when a credential IS present but is broken — a stale token must be loud, because the
 * alternative is a canary that silently stops watching.
 */
export async function resolveAccessToken() {
  const fromEnvironment = process.env.GOOGLE_LIVE_ACCESS_TOKEN;
  if (fromEnvironment) return fromEnvironment;

  let raw;
  try {
    raw = await readFile(LOCAL_CREDENTIALS_PATH, "utf8");
  } catch {
    return null;
  }
  return exchangeRefreshToken(JSON.parse(raw));
}

/** Reason string for `node:test`'s `skip` option, or false when the suite can run. */
export function skipReason(accessToken) {
  return accessToken
    ? false
    : "no Google credentials (set GOOGLE_LIVE_ACCESS_TOKEN or .private/google-live.json)";
}
