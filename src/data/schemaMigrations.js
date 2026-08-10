// src/data/schemaMigrations.js — walks the schema-migration chain and reports what it did (§16.2).
// Single responsibility: take a stored database of ANY known schema version and produce one at the
// current version, or refuse and say why. The individual transforms live in data/migrationSteps.js.
//
// Three properties this runner exists to guarantee:
//   1. **Nothing is mutated in place.** Every run works on a deep clone, so a step that throws
//      halfway cannot leave the caller holding a half-migrated database.
//   2. **Every step validates its own output.** A transform is trusted for nothing: if the shape it
//      produces is not recognisable, the run fails LOUD and the original data is handed back
//      untouched. Silent corruption is the one outcome that must be impossible — migrations can
//      never be tested against a real PT's data, because that data is local-only by design.
//   3. **The run is reportable.** It returns a summary ("7 clients migrated, 1 routine dropped an
//      unrecognised field") so a PT can be shown what will happen BEFORE committing to an upgrade.
// Injected dependencies: none.

import {
  BASELINE_SCHEMA_VERSION,
  CURRENT_SCHEMA_VERSION,
  MIGRATION_STEPS,
} from "./migrationSteps.js";

// Collections that must be arrays if present at all — the cheap, universal shape assertion every
// step's output is held to.
const ARRAY_COLLECTIONS = [
  "clients",
  "exercises",
  "routines",
  "history",
  "planUpdates",
  "sessions",
  "notifications",
];

/**
 * Which version a stored database should be read AS.
 *
 * Current or newer is taken at face value — that is what lets the rollback refusal below fire.
 * Everything else re-enters at the floor: the field absent, 0, garbage, or one of the burned
 * pre-release values (2, 3, 4), whose shapes were dropped wholesale rather than migrated one hop at
 * a time (migrationSteps.js). A comparison rather than a list of dead numbers — which works only
 * because current sits ABOVE every burned value, the reason the chain starts at 5 and not 1.
 */
export function detectSchemaVersion(state) {
  const stored = state?.schemaVersion;
  if (Number.isInteger(stored) && stored >= CURRENT_SCHEMA_VERSION) return stored;
  return BASELINE_SCHEMA_VERSION;
}

// Structural problems, as a list of human-readable strings — empty means the shape is acceptable.
export function validateStateShape(state, expectedVersion) {
  const problems = [];
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return ["the migrated database is not an object"];
  }
  for (const key of ARRAY_COLLECTIONS) {
    if (key in state && !Array.isArray(state[key])) {
      problems.push(`\`${key}\` is not an array`);
    }
  }
  if (!Array.isArray(state.sessions)) problems.push("`sessions` is missing");
  if (expectedVersion !== undefined && state.schemaVersion !== expectedVersion) {
    problems.push(`schemaVersion is ${state.schemaVersion}, expected ${expectedVersion}`);
  }
  return problems;
}

// Fill in any known collection the stored database simply doesn't have. A hand-trimmed backup, or
// one taken before a collection existed, otherwise reaches the renderers as `undefined` and breaks
// them one at a time. Done once here rather than defended against at every read site.
export function normalizeCollections(state) {
  if (!state || typeof state !== "object") return state;
  for (const key of ARRAY_COLLECTIONS) {
    // Only ABSENT collections are filled in. A key that is present but not an array is corruption,
    // and must still fail validation loudly rather than be quietly replaced with an empty list.
    if (state[key] === undefined || state[key] === null) state[key] = [];
  }
  return state;
}

function clone(state) {
  return typeof structuredClone === "function"
    ? structuredClone(state)
    : JSON.parse(JSON.stringify(state));
}

/**
 * Migrate `rawState` to CURRENT_SCHEMA_VERSION.
 *
 * Always returns { ok, state, summary } and never throws: the caller gets either the migrated
 * database (ok) or its own untouched input (not ok) plus a summary explaining the refusal.
 */
export function migrateState(rawState) {
  const fromVersion = detectSchemaVersion(rawState);
  const summary = {
    fromVersion,
    toVersion: CURRENT_SCHEMA_VERSION,
    applied: [],
    problems: [],
  };

  // Data written by a NEWER build than this one. This is the rollback case, and it is exactly what
  // §16.2's data-loss warning is about: the old build has no forward transform and must not guess.
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    summary.problems.push(
      `this build reads schema ${CURRENT_SCHEMA_VERSION} but the data is schema ${fromVersion} — it was written by a newer version`,
    );
    return { ok: false, state: rawState, summary };
  }

  let working;
  try {
    working = clone(rawState);
  } catch (err) {
    summary.problems.push(`the stored database could not be read: ${err.message}`);
    return { ok: false, state: rawState, summary };
  }

  for (const step of MIGRATION_STEPS) {
    if (step.from < fromVersion) continue;
    if (step.to > CURRENT_SCHEMA_VERSION) break;

    let notes = [];
    try {
      const result = step.apply(working);
      working = result?.state ?? result;
      notes = result?.notes ?? [];
    } catch (err) {
      summary.problems.push(`step v${step.from}→v${step.to} threw: ${err.message}`);
      return { ok: false, state: rawState, summary };
    }

    if (working && typeof working === "object") working.schemaVersion = step.to;

    const problems = validateStateShape(working, step.to);
    if (problems.length > 0) {
      // Fail loud, keep the original: an unrecognised shape is never written back.
      summary.problems.push(
        `step v${step.from}→v${step.to} produced an invalid database`,
        ...problems,
      );
      return { ok: false, state: rawState, summary };
    }

    summary.applied.push({ from: step.from, to: step.to, description: step.description, notes });
  }

  // A database already at the current version still gets stamped, so the field exists from here on.
  if (working && typeof working === "object") working.schemaVersion = CURRENT_SCHEMA_VERSION;
  normalizeCollections(working);

  const problems = validateStateShape(working, CURRENT_SCHEMA_VERSION);
  if (problems.length > 0) {
    summary.problems.push(...problems);
    return { ok: false, state: rawState, summary };
  }

  return { ok: true, state: working, summary };
}

// One line per applied step, for the "what will this upgrade do" confirmation a PT is shown.
export function describeMigration(summary) {
  if (!summary) return [];
  if (summary.problems.length > 0) return summary.problems;
  return summary.applied.flatMap((step) => [step.description, ...step.notes]);
}
