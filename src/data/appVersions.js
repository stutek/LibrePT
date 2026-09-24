// src/data/appVersions.js — the versions of the app a trainer can choose to run (TODO §76).
//
// Single responsibility: say which app versions this build supports, which one this device runs,
// and whether a named behaviour is on in it. One build carries every supported version (§16, §18),
// so a fix lands once and every version has it.
//
// **A version decides how the app BEHAVES, never what is read.** Every install reads the newest
// numbered schema whatever version runs (recordSchemas.js, DEFAULT_READ_SCHEMA): memory, and so every
// save, backup and sync, always holds everything. A version that does not show something leaves it
// stored, untouched.
//
// **Feature code asks for a behaviour by NAME** (`hasBehaviour("libraryImport")`), never for a version
// id. A comparison of versions would spread into every file that branches; a name lives in one entry
// here. appVersions.test.mjs fails the build on a name the code asks for that no version declares, and
// on a name every supported version turns on — its branch is then dead and must go.
//
// `schema` names the schema a version's behaviour WRITES, which keeps that schema live (the same
// test checks every numbered live schema is named here). Changing the choice reloads the page, so a
// behaviour is read once per page load and nothing has to be re-rendered in place.
//
// Injected dependencies: none; the choice is plain localStorage, like the theme.

const APP_VERSION_KEY = "librept_app_version";

/** Oldest first. `status` is "default" (exactly one: what a device that never chose runs) or
 * "supported" (offered). Add a version; retire one only by a decision, never as a side effect. */
export const APP_VERSIONS = [
  {
    id: "2026-09",
    schema: 4,
    status: "supported",
    descriptionKey: "app_version_2026_09_desc",
    behaviours: [],
  },
  {
    id: "2026-10",
    schema: 5,
    status: "default",
    descriptionKey: "app_version_2026_10_desc",
    // Importing a trainer's own exercise library and circuits (TODO §45.5).
    behaviours: ["libraryImport"],
  },
];

export function defaultAppVersion() {
  return APP_VERSIONS.find((version) => version.status === "default");
}

/** The version this device runs: its stored choice, or the default when there is none or the stored
 * one is no longer supported — a build that retires a version must not strand a device on it. */
export function activeAppVersion() {
  let stored = null;
  try {
    stored = localStorage.getItem(APP_VERSION_KEY);
  } catch {
    // Storage unavailable: the default is the only honest answer.
  }
  return APP_VERSIONS.find((version) => version.id === stored) ?? defaultAppVersion();
}

export function setAppVersion(id) {
  if (!APP_VERSIONS.some((version) => version.id === id)) {
    throw new Error(`app version ${id} is not supported by this build`);
  }
  localStorage.setItem(APP_VERSION_KEY, id);
}

export function hasBehaviour(name) {
  return activeAppVersion().behaviours.includes(name);
}
