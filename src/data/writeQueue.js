// src/data/writeQueue.js — serialises asynchronous persistence behind a synchronous-looking call
// (TODO §18.6). Single responsibility: run write tasks strictly in the order they were enqueued,
// never concurrently, and make failures visible instead of swallowing them.
//
// **Why this exists at all.** Moving the store from localStorage to IndexedDB changes persistence
// from synchronous to asynchronous, and the app has ~52 `saveToLocalStorage(...)` call sites against
// ~47 synchronous `getState()` reads. Making all of them async would be a very large diff across the
// gym-floor path for no user-visible gain — the UI already treats the in-memory state object as
// truth, exactly as it did when the backing store was synchronous. So the read model stays
// synchronous and the WRITE becomes write-behind. This module is what makes that safe.
//
// Two failure modes it exists to prevent, both of which a bare `void asyncWrite()` would have:
//
//   1. **Out-of-order writes.** Fire-and-forget IndexedDB writes can complete in a different order
//      than they were issued, so a stale snapshot could land after a fresh one and silently undo a
//      trainer's last few taps. Tasks here run one at a time, in FIFO order, always.
//   2. **Silent loss.** An unobserved rejected promise is a write that failed with nobody told —
//      and for an app holding the only copy of a business's records, "the save failed and we said
//      nothing" is the worst available outcome. Every failure is captured and handed to a listener.
//
// A failing task does NOT stall the queue: the next write is a fresh snapshot of the same state, so
// stopping would turn one transient error (a quota blip, a locked store) into a permanent outage.
//
// Injected dependencies: none. `onError` is registered by the caller.

const queue = [];
let draining = false;
let errorListener = null;
let lastError = null;
let failureCount = 0;
// Resolvers for callers awaiting `flush()`. Held as a list because several callers (a backup export
// and a test, say) can be waiting on the same drain.
let flushWaiters = [];

function settleFlushWaiters() {
  const waiters = flushWaiters;
  flushWaiters = [];
  for (const resolve of waiters) resolve();
}

function reportFailure(error, label) {
  failureCount += 1;
  lastError = { error, label, at: Date.now() };
  if (typeof errorListener === "function") {
    try {
      errorListener(lastError);
    } catch {
      // A listener that throws must not take the queue down with it — it is a reporting surface,
      // not part of the write path.
    }
  } else {
    // No listener registered yet (early boot): at minimum it must reach the console rather than
    // vanishing into an unobserved rejection.
    console.error(`writeQueue: "${label}" failed`, error);
  }
}

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length > 0) {
      const { task, label } = queue.shift();
      try {
        await task();
      } catch (error) {
        // Deliberately continue: the next enqueued write is a fresh snapshot of the same state, so
        // halting would escalate a transient error into a permanent one.
        reportFailure(error, label);
      }
    }
  } finally {
    draining = false;
    settleFlushWaiters();
  }
}

/**
 * Queue a write. Returns immediately — this is the synchronous-looking half of write-behind.
 *
 * `label` names the write for error reporting ("state", "session-cache"); it is what a trainer's bug
 * report will carry, so it should say which write failed rather than merely that one did.
 */
export function enqueueWrite(task, label = "write") {
  queue.push({ task, label });
  // Not awaited: the caller must not be blocked, and `drain` reports its own failures.
  void drain();
}

/** Resolves once the queue is empty and no task is in flight. */
export function flushWrites() {
  if (!draining && queue.length === 0) return Promise.resolve();
  return new Promise((resolve) => flushWaiters.push(resolve));
}

/**
 * Register the single handler told about failed writes — the UI surface that warns the trainer their
 * data did not save. Returns the previous listener so a caller can restore it.
 */
export function onWriteError(listener) {
  const previous = errorListener;
  errorListener = listener;
  return previous;
}

/** Queue health, for the UI and for support: pending work, and whether anything has ever failed. */
export function writeQueueStatus() {
  return { pending: queue.length, draining, failureCount, lastError };
}

// Test seam: drop queued work and forget past failures. Not part of the app's normal lifecycle —
// discarding pending writes is exactly the data loss this module exists to prevent.
export function resetWriteQueue() {
  queue.length = 0;
  failureCount = 0;
  lastError = null;
  errorListener = null;
  settleFlushWaiters();
}
