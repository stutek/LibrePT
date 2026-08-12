// src/data/driveAppData.js — Google Drive `appDataFolder` REST client (TODO §1.5/§3.3).
// Single responsibility: read and write the one JSON file this app keeps in its hidden per-app Drive
// space. Knows nothing about merging or auth — driveSyncService.js orchestrates those; this module is
// just the wire format for four Drive v3 endpoints.
//
// `appDataFolder` is a virtual, always-present folder id scoped to this app's own OAuth grant — it is
// invisible in the trainer's normal Drive UI/file picker and unreachable by any other app's token
// (TODO §1.5's PII-isolation point), which is why every request below scopes its query to
// `spaces=appDataFolder` rather than searching the whole Drive.
//
// Injected dependencies: `fetchImpl` (defaults to the global `fetch`) so tests can supply a stub
// without a real network call or a live access token.

const API_BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
export const SYNC_FILENAME = "librept_sync.json";

// The erasure register is a SECOND file, not a key inside the snapshot, and the separation is
// load-bearing (erasureSuppression.js): the snapshot is replaced wholesale by a restore or a merge,
// and a register that rode inside it would be rolled back by the very operation it exists to
// filter. As its own file it is only ever unioned — an append-only set that cannot regress.
export const ERASURE_REGISTER_FILENAME = "librept_erasure_register.json";

/** A failed Drive call, carrying the HTTP status so callers can tell "reconnect" from "retry".
 *
 * The status matters because an access token is OPAQUE — Google's `ya29.` tokens are not JWTs, so
 * `expires_in` at grant time is the only expiry signal, and a locally-computed expiry is a guess.
 * A token can die before it: the trainer revokes the grant at myaccount.google.com, the account
 * password changes, Google invalidates it, or the device clock is skewed. In every one of those the
 * ONLY signal is a 401 from the call itself, so folding it into a generic message is what leaves a
 * trainer tapping "Sync Now" forever on a grant that can never succeed. */
export class DriveApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "DriveApiError";
    this.status = status;
  }
}

/** True when the failure means the GRANT is gone, not that the request was bad — 401 for a dead or
 * revoked token, and 403 specifically for missing scope (a 403 for quota is not an auth problem, so
 * the reason string is checked rather than the bare status). Both are fixed by reconnecting and by
 * nothing else. */
export function isAuthFailure(error) {
  if (error?.status === 401) return true;
  return error?.status === 403 && /insufficient|insufficientPermissions/i.test(error.message || "");
}

async function driveFetch(url, options, fetchImpl) {
  const response = await fetchImpl(url, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new DriveApiError(
      `Drive API ${options?.method || "GET"} ${url} failed: ${response.status} ${body}`,
      response.status,
    );
  }
  return response;
}

function authHeaders(accessToken, extra = {}) {
  return { Authorization: `Bearer ${accessToken}`, ...extra };
}

/** A file's `{id, modifiedTime}`, or null if this device's grant has never created it. */
export async function findSyncFile(
  accessToken,
  { fetchImpl = fetch, filename = SYNC_FILENAME } = {},
) {
  const query = encodeURIComponent(`name='${filename}' and trashed=false`);
  const fields = encodeURIComponent("files(id,modifiedTime)");
  const url = `${API_BASE}/files?spaces=appDataFolder&q=${query}&fields=${fields}`;
  const response = await driveFetch(url, { headers: authHeaders(accessToken) }, fetchImpl);
  const data = await response.json();
  return data.files?.[0] || null;
}

/** The sync file's parsed JSON content. */
export async function downloadSyncFile(accessToken, fileId, { fetchImpl = fetch } = {}) {
  const url = `${API_BASE}/files/${fileId}?alt=media`;
  const response = await driveFetch(url, { headers: authHeaders(accessToken) }, fetchImpl);
  return response.json();
}

// Drive's multipart upload wants metadata and content as two parts of one `multipart/related` body,
// each preceded by its own Content-Type — this is the one endpoint that can set both the file's name
// (metadata, JSON) and its bytes (content) in a single request, which is only needed at creation.
function buildMultipartBody(boundary, metadata, content) {
  return (
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n${JSON.stringify(content)}\r\n` +
    `--${boundary}--`
  );
}

/** Create a file for the first time. Returns the new file's `{id}`. */
export async function createSyncFile(
  accessToken,
  content,
  { fetchImpl = fetch, filename = SYNC_FILENAME } = {},
) {
  const boundary = "librept-drive-sync";
  const metadata = { name: filename, parents: ["appDataFolder"] };
  const body = buildMultipartBody(boundary, metadata, content);
  const url = `${UPLOAD_BASE}/files?uploadType=multipart&fields=id`;
  const response = await driveFetch(
    url,
    {
      method: "POST",
      headers: authHeaders(accessToken, {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      }),
      body,
    },
    fetchImpl,
  );
  return response.json();
}

/** Overwrite a file's content (metadata unchanged) — a plain media-only update. */
export async function updateSyncFile(accessToken, fileId, content, { fetchImpl = fetch } = {}) {
  const url = `${UPLOAD_BASE}/files/${fileId}?uploadType=media`;
  await driveFetch(
    url,
    {
      method: "PATCH",
      headers: authHeaders(accessToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(content),
    },
    fetchImpl,
  );
}
