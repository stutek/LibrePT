// src/data/versionCatalog.js — which releases exist, and which of them this PT should be offered
// (TODO §16.1/§16.2). Single responsibility: read the published version manifest and turn it into a
// decision — upgrade available, rollback available, this version nearing its end of support.
//
// The manifest (`versions.json`, published next to the app by the deploy) is the AUTHORITY ON
// ORDER: it lists releases newest-first. Ordering is deliberately not derived by parsing version
// strings — a semver parser would be one more thing that can disagree with what was actually
// published, and the publisher already knows the true order.
//
// Nothing here forces anything on the PT. It answers "what could you switch to"; when and whether
// to switch is the trainer's call, bounded only by a release's end-of-support date (§16.1).
//
// Manifest shape:
//   { "current": "v1.3.0",
//     "releases": [ { "id": "v1.3.0", "path": "v1.3.0/", "publishedAt": "2026-08-01", "eol": null }, … ] }
//
// Injected dependencies: `fetchImpl` (defaults to global fetch) so the fetch path is testable.

import { UNRELEASED, currentRelease } from "../modules/common/releaseIdentity.js";
import { listReleaseBuckets } from "./storageNamespace.js";

export const VERSION_MANIFEST_FILE = "versions.json";

/**
 * Fetch the published manifest. A missing or unreadable manifest is NOT an error: it simply means
 * this deploy publishes one version, which is the state of the world until versioned hosting lands.
 * Returns null in that case, and every consumer treats null as "nothing to offer".
 */
export async function fetchVersionCatalog(basePath = "./", { fetchImpl = fetch } = {}) {
  try {
    // no-store: a cached manifest would keep announcing a release that has since been superseded.
    const response = await fetchImpl(`${basePath}${VERSION_MANIFEST_FILE}`, { cache: "no-store" });
    if (!response?.ok) return null;
    const catalog = await response.json();
    return isValidCatalog(catalog) ? catalog : null;
  } catch {
    return null;
  }
}

export function isValidCatalog(catalog) {
  return (
    !!catalog &&
    typeof catalog === "object" &&
    Array.isArray(catalog.releases) &&
    catalog.releases.every((release) => release && typeof release.id === "string")
  );
}

function releaseById(catalog, id) {
  return catalog.releases.find((release) => release.id === id) || null;
}

export function isPastEol(release, now = new Date()) {
  if (!release?.eol) return false;
  const eol = new Date(release.eol);
  return !Number.isNaN(eol.getTime()) && eol.getTime() < now.getTime();
}

/**
 * What to offer the PT running `release`, given the published catalog and the release buckets that
 * already hold data on this device.
 *
 * Returns { upgrade, rollback, eol } where each is a release entry or null:
 *   • upgrade  — the catalog's current release, when this build is not it and is not newer than it.
 *   • rollback — the newest OTHER release this device already has data for and that is still
 *                supported. Rollback is only ever offered for data that actually exists locally;
 *                there is nothing to go back to otherwise.
 *   • eol      — this build's own entry once it is past its end of support.
 *
 * An untagged build offers nothing: it is not a release, so it cannot be switched to or from.
 */
export function evaluateVersionOffer(catalog, options = {}) {
  const {
    release = currentRelease(),
    installedReleases = listReleaseBuckets(),
    now = new Date(),
  } = options;

  const none = { upgrade: null, rollback: null, eol: null };
  if (!isValidCatalog(catalog) || release === UNRELEASED) return none;

  const runningIndex = catalog.releases.findIndex((entry) => entry.id === release);
  const currentEntry = catalog.current ? releaseById(catalog, catalog.current) : null;

  // A build that isn't in the manifest at all (withdrawn, or a private build) still deserves the
  // upgrade offer — it is precisely the case where staying put is worst.
  const upgrade =
    currentEntry && currentEntry.id !== release && (runningIndex === -1 || runningIndex > 0)
      ? currentEntry
      : null;

  // Newest-first order means "older than the running build" is anything after it in the list.
  const olderReleases = runningIndex === -1 ? [] : catalog.releases.slice(runningIndex + 1);
  const rollback =
    olderReleases.find((entry) => installedReleases.includes(entry.id) && !isPastEol(entry, now)) ||
    null;

  const runningEntry = runningIndex === -1 ? null : catalog.releases[runningIndex];
  const eol = isPastEol(runningEntry, now) ? runningEntry : null;

  return { upgrade, rollback, eol };
}

// Where a release is served from, relative to the hosting root. The manifest may state it
// explicitly; otherwise it is the release id as a path segment (`v1.2.0/`), which is what the
// versioned-subpath deploy publishes.
export function releasePath(release) {
  if (!release) return null;
  if (typeof release.path === "string" && release.path) return release.path;
  return `${release.id}/`;
}

// Versions are hosted as siblings under one root, so a build running at `/LibrePT/v1.2.0/` has to
// strip its own release segment to address any other version. An untagged build is already at the
// root. Kept here, next to releasePath, so the two halves of the URL scheme stay together.
export function hostingRoot(basePath, release = currentRelease()) {
  if (!basePath) return "./";
  if (release === UNRELEASED) return basePath;
  const segment = `${release}/`;
  return basePath.endsWith(segment) ? basePath.slice(0, -segment.length) : basePath;
}

export function releaseUrl(basePath, release, runningRelease = currentRelease()) {
  const path = releasePath(release);
  return path ? `${hostingRoot(basePath, runningRelease)}${path}` : null;
}
