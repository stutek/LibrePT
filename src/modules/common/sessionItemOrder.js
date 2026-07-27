// src/modules/common/sessionItemOrder.js — explicit ordering for a session's item list (TODO §17.5).
//
// Order is DATA, carried on the record — never implied by array index. On the localStorage JSON
// store sequence rode along free inside an array; the move to IndexedDB (TODO §18.6) retires that,
// because a key order is not a program order. Unless order is a field, a projection or a per-row
// store loses it with nothing left to rebuild from, and §18.3's completeness check would not
// notice: every id is still present, only the sequence is wrong. A scrambled program that passes
// every integrity test we have.
//
// The invariant everything rests on — one session's positions are dense, unique and gapless:
//
//     positions(items) === [0, 1, 2, … , n-1]
//
// Density is what makes "is this list whole?" answerable at all. Sparse or fractional ranks forfeit
// that: any set of distinct values is a valid rank set, so a dropped or half-written item stops
// being detectable. See docs/DATA_MODEL.md §3 "Ordering" for why not a linked list.
//
// No dependencies — pure functions over plain item objects, so every writer can call them and the
// invariant checks can run in a unit test without a browser.

const hasPosition = (item) => Number.isInteger(item?.position);

// Stamp dense positions from the list's CURRENT order. Called on every write, so while the array is
// still the storage, array order and position order cannot drift apart.
export function assignPositions(items) {
  if (!Array.isArray(items)) return items;
  items.forEach((item, index) => {
    if (item) item.position = index;
  });
  return items;
}

// Read a stored list in program order.
//
// Items with no position keep their arrival order: legacy history rows, old backups and the seed
// data predate the field. That fallback is a one-time import concern, not a permanent reader path —
// once the store no longer guarantees list order there is no index left to fall back to.
export function orderedItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => ({ item, index, key: hasPosition(item) ? item.position : index }))
    .sort((a, b) => a.key - b.key || a.index - b.index)
    .map((entry) => entry.item);
}

// Every way this list can be malformed, named. Returns [] when the list is sound.
//
// Two assertions no implicit scheme could express — which is the point of paying for the field:
// density catches a dropped, duplicated or half-reordered item (and a projection that wrote a
// partial list), and circuit contiguity turns the invariant normalizeCircuits() upholds by
// convention into something verifiable at rest.
export function positionIssues(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const issues = [];

  const missing = items.filter((item) => !hasPosition(item)).length;
  if (missing) issues.push(`${missing} of ${items.length} item(s) carry no position`);

  const positions = items.filter(hasPosition).map((item) => item.position);
  const unique = new Set(positions);
  if (unique.size !== positions.length) {
    issues.push(`duplicate position(s): ${duplicatesOf(positions).join(", ")}`);
  }
  for (let expected = 0; expected < items.length; expected++) {
    if (!unique.has(expected)) issues.push(`missing position ${expected}`);
  }

  // A circuit renders as one unit by folding a RUN of consecutive members, so members that are not
  // contiguous silently split into two units — a display bug with no error, until it is a query.
  for (const [circuitId, members] of circuitsOf(items)) {
    const span = Math.max(...members) - Math.min(...members) + 1;
    if (span !== members.length) {
      issues.push(
        `circuit ${circuitId} is not contiguous (${members.length} members spanning ${span})`,
      );
    }
  }
  return issues;
}

// Renumber from the list's current program order. The repair for a hole or a duplicate is
// mechanical and obviously right — which is exactly what a pointer chain cannot offer, because
// deciding which branch of a forked chain is the real one is guesswork.
export function repairPositions(items) {
  if (!Array.isArray(items)) return items;
  const ordered = orderedItems(items);
  assignPositions(ordered);
  items.length = 0;
  items.push(...ordered);
  return items;
}

function duplicatesOf(positions) {
  const seen = new Set();
  const dupes = new Set();
  for (const position of positions) {
    if (seen.has(position)) dupes.add(position);
    seen.add(position);
  }
  return [...dupes].sort((a, b) => a - b);
}

function circuitsOf(items) {
  const groups = new Map();
  items.forEach((item, index) => {
    if (!item?.circuitId) return;
    const position = hasPosition(item) ? item.position : index;
    if (!groups.has(item.circuitId)) groups.set(item.circuitId, []);
    groups.get(item.circuitId).push(position);
  });
  return groups;
}
