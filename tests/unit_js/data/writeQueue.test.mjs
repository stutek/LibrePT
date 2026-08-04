// tests/unit_js/data/writeQueue.test.mjs
// The persistence write queue (TODO §18.6). Moving the store to IndexedDB makes persistence async,
// but the app has ~52 synchronous save call sites against ~47 synchronous state reads — so the read
// model stays synchronous and writes become write-behind. These tests pin the two properties that
// makes safe: writes land in the order they were issued even when they resolve out of order, and a
// failed write is reported rather than vanishing into an unobserved rejection.

import assert from "node:assert/strict";
import { test } from "node:test";
import * as m from "../../../src/data/writeQueue.js";

test("writes run in order even when they resolve out of order", async () => {
  m.resetWriteQueue();

  const order = [];
  const delayed = (name, ms) => () =>
    new Promise((resolve) => {
      setTimeout(() => {
        order.push(name);
        resolve();
      }, ms);
    });

  // Issued slowest-first: unserialised fire-and-forget would finish c, b, a — landing a
  // stale snapshot after a fresh one and silently undoing the trainer's last taps.
  m.enqueueWrite(delayed("a", 40), "a");
  m.enqueueWrite(delayed("b", 20), "b");
  m.enqueueWrite(delayed("c", 1), "c");
  await m.flushWrites();

  const status = m.writeQueueStatus();
  assert.deepEqual(order, ["a", "b", "c"]);
  assert.equal(status.pending, 0);
  assert.equal(status.draining, false);
  assert.equal(status.failureCount, 0);
});

test("a failed write is reported and does not stall the queue", async () => {
  m.resetWriteQueue();

  const seen = [];
  m.onWriteError((failure) => seen.push(failure.label));

  const done = [];
  m.enqueueWrite(async () => {
    done.push("first");
  }, "first");
  m.enqueueWrite(async () => {
    throw new Error("quota exceeded");
  }, "state");
  m.enqueueWrite(async () => {
    done.push("third");
  }, "third");
  await m.flushWrites();

  const status = m.writeQueueStatus();
  // A transient error (quota blip, locked store) must not become a permanent outage — the next
  // write is a fresh snapshot of the same state, so the queue keeps going.
  assert.deepEqual(done, ["first", "third"]);
  // For an app holding the only copy of a business's records, a silent failed save is the worst
  // available outcome, so the failure reaches a listener with the label that names which write.
  assert.deepEqual(seen, ["state"]);
  assert.equal(status.failureCount, 1);
  assert.equal(status.lastError.label, "state");
  assert.equal(status.lastError.error.message, "quota exceeded");
});

test("a throwing error listener cannot take the queue down", async () => {
  m.resetWriteQueue();

  m.onWriteError(() => {
    throw new Error("the reporting UI is broken");
  });
  const done = [];
  m.enqueueWrite(async () => {
    throw new Error("write failed");
  }, "state");
  m.enqueueWrite(async () => {
    done.push("after");
  }, "after");
  await m.flushWrites();

  // The listener is a reporting surface, not part of the write path.
  assert.deepEqual(done, ["after"]);
  assert.equal(m.writeQueueStatus().failureCount, 1);
});

test("writes enqueued while draining are picked up", async () => {
  m.resetWriteQueue();

  const order = [];
  m.enqueueWrite(async () => {
    order.push("first");
    // A tap landing mid-flush is the ordinary gym-floor case, not an edge case.
    m.enqueueWrite(async () => {
      order.push("nested");
    }, "nested");
  }, "first");
  await m.flushWrites();

  // flushWrites must not resolve while work enqueued during the drain is still outstanding.
  assert.deepEqual(order, ["first", "nested"]);
  assert.equal(m.writeQueueStatus().pending, 0);
});

test("flush on an idle queue resolves immediately", async () => {
  // Pinned via microtask ordering, not a wall-clock budget: flushWrites() returns
  // Promise.resolve() when idle, so its .then() callback must already have run by the time a
  // single extra `await Promise.resolve()` in this same async function resumes (that await's own
  // continuation is queued behind the .then() one). A wall-clock threshold here previously flaked
  // on shared CI runners — it was timing a Playwright IPC round-trip for a synchronous return, not
  // anything the app actually does slowly.
  m.resetWriteQueue();
  let resolved = false;
  m.flushWrites().then(() => {
    resolved = true;
  });
  await Promise.resolve();
  assert.equal(resolved, true);
});
