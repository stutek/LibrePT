// src/version.js — build/deploy stamp shown in the header so a client screenshot pins a bug report
// to an exact build. This checked-in copy ships as 'dev'; the build (build/__init__.py) and the
// GitHub Pages deploy (.github/workflows/deploy.yml) overwrite dist/version.js with the real short
// commit SHA, a UTC build timestamp and the release tag. Keep those two writers in sync with this shape.
//
// `release` is the git tag the build was cut from — the version identity used by versioned hosting,
// per-version storage namespacing and the upgrade/rollback flow (TODO §16). An untagged build stays
// "dev": it runs fine, it just takes no part in version switching. See modules/common/releaseIdentity.js.
export const BUILD_INFO = {
  commit: "dev",
  builtAt: "",
  release: "dev",
};
