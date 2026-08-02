// src/version.js — build/deploy stamp shown in the header so a client screenshot pins a bug report
// to an exact build. This checked-in copy ships as 'dev'; the build (build/__init__.py) and the
// GitHub Pages deploy (.github/workflows/deploy.yml) overwrite dist/version.js with the real short
// commit SHA and a UTC build timestamp. Keep those two writers in sync with this shape.
//
// No `release` field: multi-version hosting was dropped (TODO §16/§18) — one build carries every
// supported data schema concurrently, and storage keys on the schema major (data/recordSchemas.js),
// not a release tag. The commit SHA identifies the code; `CURRENT_SCHEMA_VERSION` identifies the
// data shape — two different axes, never collapsed into one number (docs/DATA_MODEL.md §1).
export const BUILD_INFO = {
  commit: "dev",
  builtAt: "",
};
