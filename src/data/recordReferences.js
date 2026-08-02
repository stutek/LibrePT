// src/data/recordReferences.js — the domain's cross-collection reference graph (TODO §18.5).
// Single responsibility: declare which collection fields are STRUCTURAL references to another
// collection (the record depends on that collection's row existing), and detect cycles in the
// graph those references form — migration replay order means correct order of foreign-key
// availability, which only exists if the graph is a DAG. A convenience back-reference added later
// would otherwise deadlock migration or silently pick an arbitrary order.
//
// Deliberately NOT every field that carries another collection's id: a "soft ref" field like
// `routineName`/`clientName`/`exerciseName` (see recordSchemas.js) is a denormalised label, not a
// dependency — the record stays valid even if the label is stale or the referenced row is gone.
// Only add a field here when losing the referenced row should be treated as breaking the record,
// not just staling a label. §17.4 (saving a past session as a routine template) is flagged in
// TODO §18.5 as the first realistic risk of introducing an actual cycle — check this graph when
// building it.

export const REFERENCES = {
  history: { clientId: "clients" },
  planUpdates: { clientId: "clients" },
};

const WHITE = 0;
const GRAY = 1;
const BLACK = 2;

// Depth-first search with a recursion-stack colouring: GRAY means "on the current path", so
// reaching a GRAY node again is exactly a cycle. Returns the cycle (collection names, first
// repeated at both ends) or null if the graph is acyclic.
export function findCycle(references = REFERENCES) {
  const graph = new Map();
  for (const [collection, fields] of Object.entries(references)) {
    if (!graph.has(collection)) graph.set(collection, new Set());
    for (const target of Object.values(fields)) {
      graph.get(collection).add(target);
      if (!graph.has(target)) graph.set(target, new Set());
    }
  }

  const color = new Map();
  const path = [];

  function visit(node) {
    color.set(node, GRAY);
    path.push(node);
    for (const next of graph.get(node) || []) {
      const state = color.get(next) ?? WHITE;
      if (state === GRAY) return [...path.slice(path.indexOf(next)), next];
      if (state === WHITE) {
        const cycle = visit(next);
        if (cycle) return cycle;
      }
    }
    path.pop();
    color.set(node, BLACK);
    return null;
  }

  for (const node of graph.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE) {
      const cycle = visit(node);
      if (cycle) return cycle;
    }
  }
  return null;
}

export function isAcyclic(references = REFERENCES) {
  return findCycle(references) === null;
}
