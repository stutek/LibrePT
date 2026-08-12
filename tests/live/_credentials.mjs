// tests/live/_credentials.mjs — resolves an access token for the live-Google suite, from whichever
// of the two credential sources is present, and returns null (never throws) when neither is.
//
// **One path, two ways of arriving at it.** `.private/google-live.json` holds
// `{client_id, client_secret, refresh_token}` for a consumer test account, which this module
// exchanges for a short-lived access token. That file gets there either because a developer put it
// there, or because CI fetched it — and the code cannot tell the difference, which is the point:
// there is no CI-only branch to rot unnoticed.
//
//   * **Locally** the developer writes it once. `.private/` is gitignored and must stay that way —
//     unlike the OAuth *client id* (which ships in driveSyncConfig.js by design), a client secret
//     and refresh token are real secrets.
//   * **In CI** the canary workflow authenticates with **no stored credential at all**: GitHub mints
//     a short-lived OIDC assertion, Google verifies GitHub's signature and returns a token, and that
//     token reads the credential from **GCP Secret Manager** and writes this same file into the
//     ephemeral runner. So the vault is on Google's side, with IAM and audit logs, and GitHub holds
//     nothing secret — only two non-sensitive variables naming the provider and service account.
//
// **A consumer refresh token is not a preference here, it is the only identity that can write.**
// Running the canary as the federated service account itself was tried on 2026-08-12 and lasted one
// run: Drive answered the `files.list` and returned **403** to the `appDataFolder` upload. Google
// removed service-account Drive storage quota, and neither remedy they offer applies — an
// `appDataFolder` cannot live in a shared drive, and domain-wide delegation needs Workspace. A
// read-only canary would have left multipart upload, the most fragile part of the contract,
// unwatched. The federated identity therefore holds no Drive or Calendar scope at all — only
// permission to read one secret.
//
// `GOOGLE_LIVE_ACCESS_TOKEN` still short-circuits everything below, for ad-hoc runs against a token
// obtained some other way.
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
        `${path.relative(REPO_ROOT, LOCAL_CREDENTIALS_PATH)} (in CI, add a new Secret Manager ` +
        "version). The durable fix is to set the consent screen's publishing status to In " +
        "production: the 7-day expiry is tied to Testing, not to verification, so it ends there " +
        "and a weekly-red canary stops being noise.",
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
