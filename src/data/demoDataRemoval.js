// src/data/demoDataRemoval.js — what can be removed when a trainer clears the demo data, and what
// must survive because their own work now depends on it.
// Single responsibility: turn a database into a removal PLAN. Removes nothing itself, touches no
// storage, and is the only place the "is this safe to delete" question is answered.
//
// The scenario this exists for: a trainer loads the demo to evaluate LibrePT, starts adding real
// clients, and now the fake people are a stain across their dashboard. `resetLibrePTData()` cannot
// help — it deletes the whole database, real clients included.
//
// Two rules do the real work here, and both are about NOT deleting things:
//
//   1. **Exercises are an asset, not a stain.** The seed ships 48 movements, and a trainer's first
//      real session is built out of them. They are a starter catalog, so they default to KEEP while
//      the fake people and their fake training records default to remove. That default is the
//      caller's to override per collection, but it is the one that matches what a trainer means by
//      "clear the demo".
//   2. **Nothing a surviving record depends on is removed.** A demo exercise used in a real routine
//      stays; a demo client with a real logged session stays. Computed to a FIXPOINT, because
//      retaining a record retains its own dependencies in turn — keeping a demo routine is
//      worthless if the exercises it prescribes are deleted underneath it.
//
// Rule 2 also settles the awkward case on its own: a demo client the trainer renamed and has been
// logging real sessions against is referenced by those real records, so it is retained without
// anything needing to guess at intent. What it cannot settle is a demo record edited into
// something real that nothing else points at — for that the plan carries per-record detail so a
// confirmation screen can offer opt-out, rather than this module deciding for the trainer.
// Injected dependencies: none.

import { dependenciesOf, dependencyIndex } from "./recordDependencies.js";
import { isSeedRecord, seededCollections } from "./seedProvenance.js";

// Seeded, but worth keeping: the movement catalog a trainer builds real programmes from.
export const DEFAULT_COLLECTIONS_TO_KEEP = ["exercises"];

function recordsIn(state, collection) {
  const records = state?.[collection];
  return Array.isArray(records) ? records : [];
}

/**
 * Plan the removal of demo data from `state`.
 *
 * Returns `{ removals, retained, counts }`:
 *   - `removals`  — `{ collection: [id, ...] }`, safe to delete
 *   - `retained`  — `[{ collection, id, reason }]`, seeded but kept, each with a stated why
 *   - `counts`    — `{ collection: { removing, retaining, keeping } }` for a confirmation screen
 *
 * `keepCollections` are swept for reporting but never removed from. `keepIds` is the confirmation
 * screen's opt-out: ids the trainer has marked as theirs, which are treated exactly like a retained
 * record, dependencies and all.
 */
export function planDemoRemoval(state, options = {}) {
  const { keepCollections = DEFAULT_COLLECTIONS_TO_KEEP, keepIds = {} } = options || {};
  const kept = new Set(keepCollections);

  // Candidates: seeded records in collections the trainer is clearing, minus anything they have
  // explicitly claimed as their own.
  const candidates = {};
  for (const collection of seededCollections()) {
    const optedOut = new Set(keepIds[collection] || []);
    candidates[collection] = kept.has(collection)
      ? []
      : recordsIn(state, collection).filter(
          (record) => isSeedRecord(collection, record) && !optedOut.has(record.id),
        );
  }

  const candidateIds = Object.fromEntries(
    Object.entries(candidates).map(([collection, records]) => [
      collection,
      new Set(records.map((record) => record.id)),
    ]),
  );

  // Fixpoint: a record is retained if anything SURVIVING depends on it, and retaining it makes its
  // own dependencies survivors too. Iterate until an pass rescues nothing new — bounded by the
  // number of candidates, since each pass either rescues one or stops.
  const retainedReasons = new Map();
  for (;;) {
    const survivors = {};
    for (const collection of seededCollections()) {
      survivors[collection] = recordsIn(state, collection).filter(
        (record) => !candidateIds[collection]?.has(record.id),
      );
    }

    const needed = dependencyIndex(survivors);
    let rescuedAny = false;

    for (const collection of seededCollections()) {
      for (const id of [...(candidateIds[collection] || [])]) {
        if (!needed[collection]?.has(id)) continue;
        candidateIds[collection].delete(id);
        retainedReasons.set(`${collection}:${id}`, {
          collection,
          id,
          reason: "a record you created still depends on it",
        });
        rescuedAny = true;
      }
    }
    if (!rescuedAny) break;
  }

  const removals = {};
  const counts = {};
  for (const collection of seededCollections()) {
    const seededHere = recordsIn(state, collection).filter((record) =>
      isSeedRecord(collection, record),
    );
    const removing = [...(candidateIds[collection] || [])];
    removals[collection] = removing;
    counts[collection] = {
      removing: removing.length,
      retaining: seededHere.length - removing.length,
      keeping: kept.has(collection),
    };
  }

  return { removals, retained: [...retainedReasons.values()], counts };
}

/**
 * Apply a plan, returning a NEW state. The caller persists it through the normal save path, where
 * star-write's stale-id reconciliation removes each dropped record from every live schema store —
 * there is no separate deletion machinery to keep in step.
 */
export function applyDemoRemoval(state, plan) {
  const next = { ...state };
  for (const [collection, ids] of Object.entries(plan?.removals || {})) {
    if (ids.length === 0) continue;
    const dropped = new Set(ids);
    next[collection] = recordsIn(state, collection).filter((record) => !dropped.has(record.id));
  }
  return next;
}

/** Whether there is anything to do — what a "Clear demo data" affordance shows itself for. */
export function hasRemovableDemoData(state, options) {
  const { removals } = planDemoRemoval(state, options);
  return Object.values(removals).some((ids) => ids.length > 0);
}

/**
 * Records that would BREAK if the plan were applied — always empty for a plan straight out of
 * `planDemoRemoval`, and the assertion that proves it. Kept as a real check rather than a comment
 * because the plan is user-editable: a confirmation screen that lets a trainer opt a record back
 * INTO removal could otherwise orphan a dependant, and this is what catches that before a write.
 */
export function brokenDependenciesAfter(state, plan) {
  const next = applyDemoRemoval(state, plan);
  const surviving = Object.fromEntries(
    seededCollections().map((collection) => [
      collection,
      new Set(recordsIn(next, collection).map((record) => record.id)),
    ]),
  );

  const broken = [];
  for (const collection of seededCollections()) {
    for (const record of recordsIn(next, collection)) {
      for (const [target, ids] of Object.entries(dependenciesOf(collection, record))) {
        for (const id of ids) {
          if (surviving[target] && !surviving[target].has(id)) {
            broken.push({ collection, id: record.id, missing: { collection: target, id } });
          }
        }
      }
    }
  }
  return broken;
}
