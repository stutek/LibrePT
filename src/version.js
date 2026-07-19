// src/version.js — build/deploy stamp shown in the header so a client screenshot pins a bug report
// to an exact commit. This checked-in copy ships as 'dev'; the build (build/__init__.py) and the
// GitHub Pages deploy (.github/workflows/deploy.yml) overwrite dist/version.js with the real short
// commit SHA and a UTC build timestamp. Keep those two writers in sync with this shape.
export const BUILD_INFO = {
  commit: 'dev',
  builtAt: ''
};
