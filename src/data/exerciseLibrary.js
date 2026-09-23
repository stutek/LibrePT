// src/data/exerciseLibrary.js — the exercises a trainer picks from: LibrePT's catalog and their own.
//
// Single responsibility: assemble that list, and say where each entry comes from. Pure — no DOM, no
// storage.
//
// **The catalog is read from code, never stored** (TODO §45.5, ruled 2026-09-23). A working database
// starts with no exercises, and the catalog used to reach only the sandbox, so outside it a trainer
// had an empty library. Storing it on first boot would put forty rows into every database and every
// backup, and would freeze them there: a correction to the catalog would never reach a trainer who
// already had a copy. Read from code, it is always this build's catalog.
//
// **A stored entry wins over the catalog's** when both carry the same id. The sandbox stores the
// catalog (`seedMockData`), and what it stored may have been edited there; the library shows the
// record the trainer is looking at, once.
//
// **Every screen reads the list through `libraryExercises`**, never `state.exercises`: a screen that
// read storage directly would show an empty library again. tests/unit_js/data/exerciseLibrary.test.mjs
// fails the build on such a read.
//
// Injected dependencies: none.

import { DEFAULT_EXERCISES } from "./exercises.js";

/** Where an exercise comes from. These two are the filter's values, never shown to the trainer; an
 * imported exercise's source is the name it was imported under (TODO §45.5 — any number of them,
 * because trainers exchange catalogs), and that name IS shown. */
export const CATALOG_SOURCE = "librept";
export const OWN_SOURCE = "own";
export const ALL_SOURCES = "all";

// Frozen, so a screen that changed a listed entry would throw instead of changing the catalog for
// the rest of the page's life — DEFAULT_EXERCISES is a module singleton.
const CATALOG = Object.freeze(DEFAULT_EXERCISES.map((exercise) => Object.freeze({ ...exercise })));
const CATALOG_IDS = new Set(CATALOG.map((exercise) => exercise.id));

/** The trainer's stored exercises, then every catalog entry they do not already hold. */
export function libraryExercises(state) {
  const stored = state?.exercises || [];
  const storedIds = new Set(stored.map((exercise) => exercise.id));
  return [...stored, ...CATALOG.filter((exercise) => !storedIds.has(exercise.id))];
}

/** Add imported exercises and circuits to the stored library (TODO §45.5). New arrays rather than a
 * push, so a caller holding the previous list does not see it change underneath it. */
export function addToLibrary(state, { exercises = [], circuits = [] }) {
  state.exercises = [...(state.exercises || []), ...exercises];
  state.circuits = [...(state.circuits || []), ...circuits];
}

/** The library entry with this id, or undefined. */
export function libraryExerciseById(state, id) {
  return libraryExercises(state).find((exercise) => exercise.id === id);
}

/** `CATALOG_SOURCE` for an entry of LibrePT's catalog, stored copy or not; the name it was imported
 * under; otherwise `OWN_SOURCE` — typed in the app, or imported with no name given. */
export function exerciseSourceOf(exercise) {
  if (CATALOG_IDS.has(exercise?.id)) return CATALOG_SOURCE;
  return exercise?.source || OWN_SOURCE;
}

/** Every source these exercises come from: LibrePT and the trainer's own first when present, then
 * the imported ones alphabetically — the order the filter row shows them in. */
export function sourcesOf(exercises) {
  const found = new Set(exercises.map(exerciseSourceOf));
  const named = [...found].filter((source) => source !== CATALOG_SOURCE && source !== OWN_SOURCE);
  return [
    ...[CATALOG_SOURCE, OWN_SOURCE].filter((source) => found.has(source)),
    ...named.sort((a, b) => a.localeCompare(b)),
  ];
}

/** The exercises from one source; `ALL_SOURCES` keeps every one. */
export function withSource(exercises, source) {
  if (source === ALL_SOURCES) return exercises;
  return exercises.filter((exercise) => exerciseSourceOf(exercise) === source);
}
