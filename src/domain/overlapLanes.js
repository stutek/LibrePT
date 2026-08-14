// src/domain/overlapLanes.js — lay overlapping time intervals out into side-by-side lanes
// (TODO §1.3). Single responsibility: decide WHICH COLUMN each block belongs in and how many columns
// it must share width with. Knows nothing about pixels, rooms, or where the intervals came from —
// the same answer serves the trainer's own sessions and the read-only room occupancy blocks
// calendarFreeBusy.js returns.
//
// **Why lanes at all.** §1.3's requirement is that 10:00–11:00 and 10:30–11:30 both render, showing
// the overlap, rather than stacking as if sequential. That is the calendar-app layout: a vertical
// time grid where top and height map to start and end, and anything that would collide sits beside
// it instead.
//
// **Width is per CLUSTER, not per day, and this is the part that is easy to get subtly wrong.** A
// day holding one pair of overlapping sessions at 07:00 and nothing else overlapping all afternoon
// should not render every afternoon session at half width. So intervals are first grouped into
// clusters — maximal runs where each interval overlaps at least one other, transitively — and
// `laneCount` is the width divisor for that cluster alone. A block that collides with nothing gets
// the full column.
//
// **Touching is not overlapping.** A session ending at 11:00 and one starting at 11:00 are
// sequential, and back-to-back sessions are the normal case on a gym floor, not the exception. If
// this used `>=` they would render side by side at half width all day — which reads as "these two
// clash" to the person the layout exists to inform.
//
// Injected dependencies: none — pure functions over plain objects.

/** Milliseconds for an interval edge. Accepts what Google's freeBusy returns (RFC3339 strings) and
 * what the local store holds (Date or epoch ms), because the occupancy view draws both on one grid
 * and converting at every call site is how the two drift. */
function toMillis(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

/** Groups intervals into maximal runs of transitively-overlapping ones.
 *
 * Walks in start order carrying the furthest end seen so far: the moment an interval starts at or
 * after that high-water mark, nothing already placed can reach it, so a new cluster begins. Using
 * the running maximum rather than the previous interval's end is what makes it transitive — a long
 * 09:00–13:00 block keeps a 12:00 one in the same cluster even though the interval between them
 * ended at 10:00. */
function toClusters(sorted) {
  const clusters = [];
  let current = [];
  let clusterEndMs = -Infinity;

  for (const entry of sorted) {
    if (current.length && entry.startMs >= clusterEndMs) {
      clusters.push(current);
      current = [];
      clusterEndMs = -Infinity;
    }
    current.push(entry);
    clusterEndMs = Math.max(clusterEndMs, entry.endMs);
  }
  if (current.length) clusters.push(current);
  return clusters;
}

/** Places one cluster's intervals into the lowest free lane, returning how many lanes it needed. */
function placeCluster(cluster) {
  const laneEndMs = [];
  for (const entry of cluster) {
    let lane = laneEndMs.findIndex((endMs) => endMs <= entry.startMs);
    if (lane === -1) {
      lane = laneEndMs.length;
    }
    laneEndMs[lane] = entry.endMs;
    entry.lane = lane;
  }
  return laneEndMs.length;
}

/** Assigns each interval a lane and the number of lanes it shares width with.
 *
 * Input: `[{ start, end, ... }]` — `start`/`end` as RFC3339 strings, Dates or epoch ms.
 * Output: `[{ item, lane, laneCount }]`, sorted by start then end, with the caller's original
 * object under `item` so records are handed back untouched.
 *
 * The sort is total and deterministic: two intervals with identical bounds keep their input order,
 * so a re-render never shuffles blocks between columns while someone is looking at them.
 */
export function assignLanes(intervals) {
  const sorted = (intervals || [])
    .map((item, inputIndex) => ({
      item,
      inputIndex,
      startMs: toMillis(item.start),
      endMs: toMillis(item.end),
    }))
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs || a.inputIndex - b.inputIndex);

  const placed = [];
  for (const cluster of toClusters(sorted)) {
    const laneCount = placeCluster(cluster);
    for (const entry of cluster) {
      placed.push({ item: entry.item, lane: entry.lane, laneCount });
    }
  }
  return placed;
}
