// src/modules/common/releaseIdentity.js — single source of truth for WHICH RELEASE of the app is
// running (TODO §16). A release is the **git tag** a build was cut from; that tag is the identity
// versioned hosting (`/v1.2.0/`), per-version storage namespacing, and the upgrade / rollback
// messages all key off. Deliberately separate from the commit SHA in version.js: many commits share
// one release, and an untagged build has no release at all.
// Injected dependencies: none — reads the build stamp written by build/__init__.py and the deploy.

import { BUILD_INFO } from "../../version.js";

// An untagged build (local dev, or a commit ahead of the last tag) has no release identity. It is
// still a perfectly runnable app — it just cannot take part in version switching, so it gets one
// stable bucket of its own rather than a fabricated version number.
export const UNRELEASED = "dev";

// A release id is used verbatim as a storage-key suffix and as a URL path segment, so anything
// outside a conservative tag charset is rejected rather than escaped — a malformed tag must never
// silently mint a new storage bucket or a bogus hosting path.
const RELEASE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function normalizeRelease(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value === UNRELEASED) return UNRELEASED;
  return RELEASE_ID_PATTERN.test(value) ? value : UNRELEASED;
}

export function currentRelease() {
  return normalizeRelease(BUILD_INFO?.release);
}

export function isReleasedBuild() {
  return currentRelease() !== UNRELEASED;
}

// The long form for the stamp's desktop tooltip: release, commit and build time together. The
// phone-reachable version of this is the build-info dialog (modules/common/buildInfoDialog.js).
export function buildDescription() {
  const parts = [];
  const release = currentRelease();
  if (release !== UNRELEASED) parts.push(`Release ${release}`);
  const commit = typeof BUILD_INFO?.commit === "string" ? BUILD_INFO.commit.trim() : "";
  if (commit && commit !== UNRELEASED) parts.push(`Commit ${commit}`);
  if (BUILD_INFO?.builtAt) parts.push(`Built ${BUILD_INFO.builtAt}`);
  return parts.join(" · ");
}
